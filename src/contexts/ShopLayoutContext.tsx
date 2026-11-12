import { createContext, useCallback, useContext, useEffect, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ShopLayout = "cyber" | "compact" | "showcase" | "tokii-catalog";

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
  value === "cyber" || value === "compact" || value === "showcase" || value === "tokii-catalog";

export const ShopLayoutProvider = ({ children }: { children: ReactNode }) => {
  const [layout, setLayout] = useState<ShopLayout>("cyber");
  const [loading, setLoading] = useState(true);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
    const pointerY = Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100));
    const shiftX = ((pointerX / 100) - 0.5) * 18;
    const shiftY = ((pointerY / 100) - 0.5) * 14;

    event.currentTarget.style.setProperty("--pointer-x", `${pointerX}%`);
    event.currentTarget.style.setProperty("--pointer-y", `${pointerY}%`);
    event.currentTarget.style.setProperty("--bg-shift-x", `${shiftX}px`);
    event.currentTarget.style.setProperty("--bg-shift-y", `${shiftY}px`);
  }, []);

  const handlePointerLeave = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--pointer-x", "50%");
    event.currentTarget.style.setProperty("--pointer-y", "45%");
    event.currentTarget.style.setProperty("--bg-shift-x", "0px");
    event.currentTarget.style.setProperty("--bg-shift-y", "0px");
  }, []);

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
      <div
        className={`shop-layout shop-layout-${layout}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {children}
      </div>
    </ShopLayoutContext.Provider>
  );
};

export const useShopLayout = () => useContext(ShopLayoutContext);