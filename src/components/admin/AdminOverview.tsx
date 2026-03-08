import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, CreditCard, Package, TrendingUp } from "lucide-react";

const AdminOverview = () => {
  const [stats, setStats] = useState({ users: 0, pendingTopups: 0, products: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [profilesRes, topupsRes, productsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("topup_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("products").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        users: profilesRes.count || 0,
        pendingTopups: topupsRes.count || 0,
        products: productsRes.count || 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Tổng người dùng", value: stats.users, icon: Users, color: "text-primary" },
    { label: "Nạp tiền chờ duyệt", value: stats.pendingTopups, icon: CreditCard, color: "text-neon-orange" },
    { label: "Sản phẩm", value: stats.products, icon: Package, color: "text-neon-cyan" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary neon-text">TỔNG QUAN</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-6 neon-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <p className="text-3xl font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
