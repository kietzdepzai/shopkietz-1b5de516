import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Package, Clock, CheckCircle, XCircle, RotateCcw } from "lucide-react";

type BoostOrder = {
  id: string;
  product_name: string;
  price: number;
  status: string;
  order_code: string | null;
  customer_note: string | null;
  admin_note: string | null;
  refunded: boolean;
  created_at: string;
};

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

const statusBadge = (status: string, refunded: boolean) => {
  if (status === "completed") return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30"><CheckCircle className="w-3 h-3" /> Hoàn thành</span>;
  if (status === "cancelled_refunded") return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"><RotateCcw className="w-3 h-3" /> Đã huỷ + hoàn tiền</span>;
  if (status === "cancelled") return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/30"><XCircle className="w-3 h-3" /> Đã huỷ</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30"><Clock className="w-3 h-3" /> Đang xử lý</span>;
};

const BoostHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<BoostOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("boost_orders" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setOrders((data as any as BoostOrder[]) || []); setLoading(false); });
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar /><Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Vui lòng đăng nhập để xem lịch sử.</p>
          <Link to="/dang-nhap" className="px-6 py-3 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold">Đăng nhập</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar /><Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-primary neon-text text-center">LỊCH SỬ CÀY THUÊ</h1>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Bạn chưa đặt dịch vụ cày thuê nào.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-card border border-border rounded-xl p-4 neon-card">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground">{o.product_name}{(o as any).package_name ? ` — ${(o as any).package_name}` : ""}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{o.order_code}</p>
                  </div>
                  {statusBadge(o.status, o.refunded)}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Giá:</span>{" "}
                    <span className="text-yellow-500 font-bold">{formatVND(o.price)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ngày:</span>{" "}
                    <span className="text-foreground">{new Date(o.created_at).toLocaleString("vi-VN")}</span>
                  </div>
                </div>
                {o.customer_note && (
                  <div className="mt-2 text-xs"><span className="text-muted-foreground">Lời nhắn của bạn:</span> <span className="text-foreground">{o.customer_note}</span></div>
                )}
                {o.admin_note && (
                  <div className="mt-2 text-xs bg-muted border border-border rounded-lg p-2">
                    <span className="text-primary font-semibold">Phản hồi admin:</span> <span className="text-foreground whitespace-pre-line">{o.admin_note}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BoostHistory;
