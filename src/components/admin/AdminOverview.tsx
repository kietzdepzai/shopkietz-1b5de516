import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  CreditCard,
  Package,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Clock,
  ArrowUpRight,
} from "lucide-react";

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

type Order = {
  id: string;
  order_code: string | null;
  product_name: string;
  product_category: string;
  price: number;
  status: string;
  created_at: string;
};

const AdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, pendingTopups: 0, products: 0, orders: 0 });
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [profilesRes, topupsRes, productsRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("topup_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, order_code, product_name, product_category, price, status, created_at")
          .order("created_at", { ascending: false }).limit(300),
      ]);
      const list = (ordersRes.data as Order[]) || [];
      setOrders(list);
      setStats({
        users: profilesRes.count || 0,
        pendingTopups: topupsRes.count || 0,
        products: productsRes.count || 0,
        orders: list.length,
      });
      setLoading(false);
    };
    fetchAll();
  }, []);

  const { revenueToday, revenue7d, ordersToday, series, topCategories } = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const day = 86400000;
    let rToday = 0, r7 = 0, oToday = 0;
    const buckets = Array.from({ length: 7 }, () => 0);
    const cats: Record<string, number> = {};

    for (const o of orders) {
      const t = new Date(o.created_at).getTime();
      if (t >= startOfDay) { rToday += o.price || 0; oToday++; }
      const diffDays = Math.floor((startOfDay - new Date(new Date(t).getFullYear(), new Date(t).getMonth(), new Date(t).getDate()).getTime()) / day);
      if (diffDays >= 0 && diffDays < 7) {
        r7 += o.price || 0;
        buckets[6 - diffDays] += o.price || 0;
      }
      const c = o.product_category || "Khác";
      cats[c] = (cats[c] || 0) + (o.price || 0);
    }
    const topCategories = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { revenueToday: rToday, revenue7d: r7, ordersToday: oToday, series: buckets, topCategories };
  }, [orders]);

  const maxBar = Math.max(...series, 1);
  const maxCat = Math.max(...topCategories.map((c) => c[1]), 1);

  const cards = [
    { label: "Doanh thu hôm nay", value: formatVND(revenueToday), sub: `${ordersToday} đơn hôm nay`, icon: Wallet, tone: "from-primary/20 to-primary/5", color: "text-primary" },
    { label: "Doanh thu 7 ngày", value: formatVND(revenue7d), sub: "Tổng 7 ngày gần nhất", icon: TrendingUp, tone: "from-accent/20 to-accent/5", color: "text-accent" },
    { label: "Tổng người dùng", value: stats.users.toLocaleString("vi-VN"), sub: "Tài khoản đã đăng ký", icon: Users, tone: "from-secondary/20 to-secondary/5", color: "text-secondary" },
    { label: "Nạp tiền chờ duyệt", value: stats.pendingTopups.toLocaleString("vi-VN"), sub: "Cần xử lý", icon: CreditCard, tone: "from-destructive/20 to-destructive/5", color: "text-destructive" },
    { label: "Sản phẩm", value: stats.products.toLocaleString("vi-VN"), sub: "Đang có trong kho", icon: Package, tone: "from-primary/20 to-primary/5", color: "text-primary" },
    { label: "Đơn hàng gần đây", value: stats.orders.toLocaleString("vi-VN"), sub: "300 đơn mới nhất", icon: ShoppingBag, tone: "from-accent/20 to-accent/5", color: "text-accent" },
  ];

  const statusStyle = (s: string) =>
    s === "completed" || s === "success"
      ? "bg-primary/15 text-primary border-primary/30"
      : s === "pending"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : "bg-muted text-muted-foreground border-border";

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border p-6 hero-aurora">
        <div className="absolute inset-0 hero-grid-lines pointer-events-none" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Bảng điều khiển</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-1">TỔNG QUAN CỬA HÀNG</h1>
          <p className="text-sm text-muted-foreground mt-1">Theo dõi doanh thu, đơn hàng và hoạt động người dùng theo thời gian thực.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${c.tone} p-5 neon-card transition-transform hover:-translate-y-0.5`}>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-bold text-foreground mt-2 truncate">
                  {loading ? <span className="inline-block h-7 w-24 rounded bg-muted animate-pulse" /> : c.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
              </div>
              <span className={`shrink-0 w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center ${c.color}`}>
                <c.icon className="w-5 h-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 neon-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wide">Doanh thu 7 ngày</h2>
            <span className="text-xs text-muted-foreground">{formatVND(revenue7d)}</span>
          </div>
          <div className="flex items-end gap-2 h-40">
            {series.map((v, i) => {
              const d = new Date(Date.now() - (6 - i) * 86400000);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-lg gradient-primary transition-all"
                      style={{ height: `${Math.max((v / maxBar) * 100, 3)}%` }}
                      title={formatVND(v)}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{d.getDate()}/{d.getMonth() + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 neon-card">
          <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wide mb-4">Top danh mục</h2>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
          ) : (
            <ul className="space-y-3">
              {topCategories.map(([name, val]) => (
                <li key={name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-foreground truncate">{name}</span>
                    <span className="text-yellow-500 font-semibold">{formatVND(val)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full gradient-accent" style={{ width: `${(val / maxCat) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 neon-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wide">Đơn hàng mới nhất</h2>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" /> Realtime</span>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có đơn hàng nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-semibold">Mã đơn</th>
                  <th className="py-2 pr-4 font-semibold">Sản phẩm</th>
                  <th className="py-2 pr-4 font-semibold">Giá</th>
                  <th className="py-2 pr-4 font-semibold">Trạng thái</th>
                  <th className="py-2 font-semibold">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{o.order_code || o.id.slice(0, 8)}</td>
                    <td className="py-2.5 pr-4 font-medium text-foreground max-w-[220px] truncate">{o.product_name}</td>
                    <td className="py-2.5 pr-4 text-yellow-500 font-semibold whitespace-nowrap">{formatVND(o.price || 0)}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${statusStyle(o.status)}`}>
                        <ArrowUpRight className="w-3 h-3" />{o.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(o.created_at).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;
