import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, Loader2, Wrench, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminMaintenance = () => {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("shop_settings").select("key,value").in("key", ["maintenance_enabled", "maintenance_message"]).then(({ data }) => {
      (data || []).forEach((r: any) => {
        if (r.key === "maintenance_enabled") setEnabled(r.value === "true");
        if (r.key === "maintenance_message") setMessage(r.value || "");
      });
      setLoading(false);
    });
  }, []);

  const save = async (nextEnabled = enabled) => {
    setSaving(true);
    const now = new Date().toISOString();
    await Promise.all([
      supabase.from("shop_settings").upsert({ key: "maintenance_enabled", value: nextEnabled ? "true" : "false", updated_at: now }, { onConflict: "key" }),
      supabase.from("shop_settings").upsert({ key: "maintenance_message", value: message, updated_at: now }, { onConflict: "key" }),
    ]);
    setSaving(false);
    toast({ title: nextEnabled ? "🛠️ Đã BẬT chế độ bảo trì" : "✅ Đã TẮT chế độ bảo trì" });
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
        <Wrench className="w-6 h-6" /> BẢO TRÌ SHOP
      </h1>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => { const n = !enabled; setEnabled(n); save(n); }}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 ${
              enabled ? "bg-destructive text-destructive-foreground" : "gradient-primary text-primary-foreground"
            }`}
          >
            <Wrench className="w-4 h-4" />
            {enabled ? "Đang bảo trì — Bấm để tắt" : "Bật chế độ bảo trì"}
          </button>

          <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => { setEnabled(e.target.checked); save(e.target.checked); }}
              className="w-5 h-5 accent-destructive"
            />
            Khoá toàn bộ shop (chỉ admin truy cập được)
          </label>
        </div>

        {enabled && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            Shop đang bảo trì: khách hàng và CTV sẽ thấy màn hình bảo trì và không thao tác được. Admin vẫn dùng bình thường.
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Thông báo hiển thị khi bảo trì</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
            placeholder="Shop đang bảo trì, vui lòng quay lại sau ít phút. Xin lỗi vì sự bất tiện!"
            className="w-full bg-muted border border-border rounded-lg py-3 px-4 text-foreground focus:outline-none focus:border-primary transition-all text-sm resize-y" />
        </div>

        <button onClick={() => save()} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
};

export default AdminMaintenance;
