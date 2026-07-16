import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Shield, KeyRound, Package, Wallet, History, Heart, LifeBuoy, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { label: string; to?: string; icon: any; onClick?: () => void };

const AccountSidebar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ display_name?: string; username?: string; avatar_url?: string; balance?: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, username, avatar_url, balance").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as any));
  }, [user]);

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: "Tài khoản",
      items: [
        { label: "Thông tin cá nhân", to: "/trang-ca-nhan", icon: User },
        { label: "Bảo mật", to: "/doi-mat-khau", icon: Shield },
        { label: "Thay đổi mật khẩu", to: "/doi-mat-khau", icon: KeyRound },
      ],
    },
    {
      title: "Giao dịch",
      items: [
        { label: "Đơn hàng của tôi", to: "/lich-su-mua", icon: Package },
        { label: "Biến động số dư", to: "/bien-dong-so-du", icon: Wallet },
        { label: "Nhật ký hoạt động", to: "/lich-su", icon: History },
      ],
    },
    {
      title: "Tiện ích",
      items: [
        { label: "Sản phẩm yêu thích", to: "/lich-su-mua", icon: Heart },
        { label: "Yêu cầu hỗ trợ", to: "/faq", icon: LifeBuoy },
      ],
    },
  ];

  const displayName = profile?.display_name || profile?.username || user?.email?.split("@")[0] || "Khách";
  const initial = displayName.charAt(0).toUpperCase();

  const isActive = (to?: string) => !!to && location.pathname === to;

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-4">
      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="w-12 h-12 rounded-full object-cover border-2 border-primary/40" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center border-2 border-primary/40">
                {initial}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground truncate">{displayName}</p>
            <p className="text-xs text-yellow-500 font-semibold">
              {(profile?.balance ?? 0).toLocaleString("vi-VN")}đ
            </p>
          </div>
        </div>
      </div>

      {/* Navigation sections */}
      <div className="bg-card border border-border rounded-2xl p-2 shadow-sm">
        {sections.map((section, si) => (
          <div key={section.title} className={si > 0 ? "mt-2 pt-2 border-t border-border" : ""}>
            <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((it) => {
                const active = isActive(it.to);
                const cls = `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-muted"
                }`;
                const inner = (
                  <>
                    <it.icon className={`w-4 h-4 ${active ? "" : "text-muted-foreground"}`} />
                    <span className="truncate">{it.label}</span>
                  </>
                );
                return (
                  <li key={it.label}>
                    {it.to ? (
                      <Link to={it.to} className={cls}>{inner}</Link>
                    ) : (
                      <button type="button" onClick={it.onClick} className={cls + " w-full text-left"}>{inner}</button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Logout */}
      {user && (
        <button
          type="button"
          onClick={async () => { await signOut(); navigate("/"); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive font-semibold text-sm hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      )}
    </aside>
  );
};

export default AccountSidebar;
