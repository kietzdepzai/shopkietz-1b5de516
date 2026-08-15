import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, RotateCcw, Clock } from "lucide-react";

type BoostOrder = {
  id: string;
  user_id: string;
  product_name: string;
  price: number;
  account_username: string;
  account_password: string;
  customer_note: string | null;
  admin_note: string | null;
  status: string;
  refunded: boolean;
  order_code: string | null;
  created_at: string;
};

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

const AdminBoostOrders = () => {
  const [orders, setOrders] = useState<BoostOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPwd, setShowPwd] = useState<Record<string, boolean>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from("boost_orders" as any).select("*").order("created_at", { ascending: false });
    setOrders((data as any as BoostOrder[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleComplete = async (o: BoostOrder) => {
    if (!confirm(`Xác nhận đã HOÀN THÀNH đơn ${o.order_code}?`)) return;
    setBusy(o.id);
    await supabase.from("boost_orders" as any).update({ status: "completed", admin_note: noteDrafts[o.id] ?? o.admin_note ?? "" }).eq("id", o.id);
    setBusy(null);
    fetchOrders();
  };

  const handleCancel = async (o: BoostOrder) => {
    const refund = confirm(`Huỷ đơn ${o.order_code}.\n\nBấm OK = HUỶ + HOÀN TIỀN cho khách.\nBấm Cancel = HUỶ KHÔNG hoàn tiền.`);
    setBusy(o.id);
    const { data, error } = await supabase.rpc("cancel_boost_order" as any, {
      p_order_id: o.id, p_refund: refund, p_admin_note: noteDrafts[o.id] ?? o.admin_note ?? "",
    });
    setBusy(null);
    if (error || (data as any)?.success === false) {
      alert("Lỗi: " + (error?.message || (data as any)?.error));
      return;
    }
    fetchOrders();
  };

  const statusBadge = (status: string) => {
    if (status === "completed") return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30"><CheckCircle className="w-3 h-3" /> Hoàn thành</span>;
    if (status === "cancelled_refunded") return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"><RotateCcw className="w-3 h-3" /> Huỷ + hoàn tiền</span>;
    if (status === "cancelled") return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/30"><XCircle className="w-3 h-3" /> Đã huỷ</span>;
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30"><Clock className="w-3 h-3" /> Đang xử lý</span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary neon-text">ĐƠN CÀY THUÊ</h1>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl text-muted-foreground">Chưa có đơn cày thuê nào.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-card border border-border rounded-xl p-4 neon-card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{o.product_name}{(o as any).package_name ? ` — ${(o as any).package_name}` : ""}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{o.order_code} · {new Date(o.created_at).toLocaleString("vi-VN")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(o.status)}
                  <span className="text-yellow-500 font-bold text-sm">{formatVND(o.price)}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-xs">
                <div className="bg-muted border border-border rounded-lg p-3">
                  <p className="text-muted-foreground mb-1 font-semibold">Tài khoản khách</p>
                  <p className="text-foreground font-mono break-all">{o.account_username}</p>
                  <p className="text-foreground font-mono break-all mt-1">
                    {showPwd[o.id] ? o.account_password : "••••••••"}
                    <button onClick={() => setShowPwd((s) => ({ ...s, [o.id]: !s[o.id] }))} className="ml-2 text-muted-foreground hover:text-foreground">
                      {showPwd[o.id] ? <EyeOff className="w-3 h-3 inline" /> : <Eye className="w-3 h-3 inline" />}
                    </button>
                  </p>
                </div>
                <div className="bg-muted border border-border rounded-lg p-3">
                  <p className="text-muted-foreground mb-1 font-semibold">Lời nhắn của khách</p>
                  <p className="text-foreground whitespace-pre-line">{o.customer_note || "(không có)"}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Lời nhắn / phản hồi cho khách</label>
                <textarea
                  value={noteDrafts[o.id] ?? o.admin_note ?? ""}
                  onChange={(e) => setNoteDrafts({ ...noteDrafts, [o.id]: e.target.value })}
                  rows={2}
                  placeholder="VD: đã nhận đơn, đang cày..."
                  className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground text-xs focus:outline-none focus:border-primary resize-none" />
              </div>

              {o.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleComplete(o)} disabled={busy === o.id}
                    className="flex items-center gap-1.5 px-3 py-2 gradient-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50">
                    <CheckCircle className="w-3.5 h-3.5" /> Hoàn thành
                  </button>
                  <button onClick={() => handleCancel(o)} disabled={busy === o.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-xs font-bold hover:bg-destructive/20 disabled:opacity-50">
                    <XCircle className="w-3.5 h-3.5" /> Huỷ đơn
                  </button>
                  <button onClick={async () => { setBusy(o.id); await supabase.from("boost_orders" as any).update({ admin_note: noteDrafts[o.id] ?? "" }).eq("id", o.id); setBusy(null); fetchOrders(); }}
                    disabled={busy === o.id}
                    className="px-3 py-2 bg-muted text-foreground rounded-lg text-xs font-bold hover:bg-border disabled:opacity-50">
                    Lưu lời nhắn
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBoostOrders;
