import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ShopLayout = "cyber" | "compact" | "showcase";

type ShopLayoutContextValue = {
  layout: ShopLayout;
  loading: boolean;
  refreshLayout: () => Promise<void>;
};

const ShopLayoutContext = createContext<ShopLayoutContextValue>({
  layout: "cyber",
  loading: true,
  refreshLayout: async () => undefined,
});

const isShopLayout = (value: string | undefined): value is ShopLayout =>
  value === "cyber" || value === "compact" || value === "showcase";

export const ShopLayoutProvider = ({ children }: { children: ReactNode }) => {
  const [layout, setLayout] = useState<ShopLayout>("cyber");
  const [loading, setLoading] = useState(true);

  const refreshLayout = useCallback(async () => {
    const { data } = await supabase
      .from("shop_settings")
      .select("value")
      .eq("key", "shop_layout")
      .maybeSingle();

    setLayout(isShopLayout(data?.value) ? data.value : "cyber");
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshLayout();

    const channel = supabase
      .channel("shop-layout-setting")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shop_settings", filter: "key=eq.shop_layout" },
        () => void refreshLayout(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshLayout]);

  return (
    <ShopLayoutContext.Provider value={{ layout, loading, refreshLayout }}>
      <div className={`shop-layout shop-layout-${layout}`}>{children}</div>
    </ShopLayoutContext.Provider>
  );
};

export const useShopLayout = () => useContext(ShopLayoutContext);