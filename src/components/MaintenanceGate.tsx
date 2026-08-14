import { ReactNode, useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Wrench, Loader2 } from "lucide-react";

const ALLOWED_PREFIXES = ["/admin", "/dang-nhap", "/reset-password"];

const MaintenanceGate = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("shop_settings")
        .select("key,value")
        .in("key", ["maintenance_enabled", "maintenance_message"]);
      if (!active) return;
      let on = false;
      let msg = "";
      (data || []).forEach((r: any) => {
        if (r.key === "maintenance_enabled") on = r.value === "true";
        if (r.key === "maintenance_message") msg = r.value || "";
      });
      setEnabled(on);
      setMessage(msg);
      setChecked(true);
    };
    load();
    const channel = supabase
      .channel("maintenance-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "shop_settings" }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin")
      .then(({ data }) => setIsAdmin(!!data && data.length > 0));
  }, [user]);

  const allowedRoute = ALLOWED_PREFIXES.some((p) => location.pathname.startsWith(p));

  if (!checked || loading) {
    if (!checked) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }
  }

  if (enabled && !isAdmin && !allowedRoute) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-panel neon-edge rounded-3xl max-w-lg w-full p-8 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center animate-pulse">
            <Wrench className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-primary">SHOP ĐANG BẢO TRÌ</h1>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {message || "Shop đang được bảo trì để khắc phục sự cố. Vui lòng quay lại sau ít phút. Xin lỗi vì sự bất tiện!"}
          </p>
          <p className="text-xs text-muted-foreground">
            Hỗ trợ: Zalo{" "}
            <a href="https://zalo.me/0987672604" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              0987672604
            </a>
          </p>
          <Link to="/dang-nhap" className="inline-block text-xs text-muted-foreground hover:text-primary underline">
            Đăng nhập quản trị
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MaintenanceGate;
