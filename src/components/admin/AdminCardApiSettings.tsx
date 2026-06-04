import { useEffect, useState } from "react";
import { CheckCircle, Loader2, Save, Server } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const apis = [
  { id: "gachthefast", name: "gachthefast.com", desc: "API hiện có, dùng GTF_PARTNER_ID và GTF_PARTNER_KEY." },
  { id: "thesieure", name: "thesieure.com", desc: "API Thesieure, dùng TSR_PARTNER_ID và TSR_PARTNER_KEY." },
];

const AdminCardApiSettings = () => {
  const { toast } = useToast();
  const [activeApi, setActiveApi] = useState("gachthefast");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("shop_settings").select("value").eq("key", "charge_card_api").maybeSingle().then(({ data }) => {
      setActiveApi(data?.value || "gachthefast");
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("shop_settings").upsert({
      key: "charge_card_api",
      value: activeApi,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    setSaving(false);
    toast(error ? { title: "Lỗi", description: "Không thể lưu API gạch thẻ.", variant: "destructive" } : { title: "✅ Đã lưu API gạch thẻ" });
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary neon-text flex items-center gap-2">
        <Server className="w-6 h-6" /> API GẠCH THẺ
      </h1>
      <div className="grid md:grid-cols-2 gap-4">
        {apis.map((api) => {
          const selected = activeApi === api.id;
          return (
            <button key={api.id} onClick={() => setActiveApi(api.id)}
              className={`text-left bg-card border rounded-xl p-5 space-y-3 transition-all ${selected ? "border-primary neon-border" : "border-border hover:border-primary/50"}`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-foreground">{api.name}</h2>
                {selected && <span className="inline-flex items-center gap-1 text-xs font-bold text-primary"><CheckCircle className="w-4 h-4" /> Đang hoạt động</span>}
              </div>
              <p className="text-sm text-muted-foreground">{api.desc}</p>
              <p className={`text-xs font-bold ${selected ? "text-primary" : "text-muted-foreground"}`}>
                {selected ? "Chỉ API này được hiển thị trạng thái và dùng để gửi thẻ." : "Không hoạt động"}
              </p>
            </button>
          );
        })}
      </div>
      <button onClick={handleSave} disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 galaxy-button text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Đang lưu..." : "Lưu lựa chọn API"}
      </button>
    </div>
  );
};

export default AdminCardApiSettings;