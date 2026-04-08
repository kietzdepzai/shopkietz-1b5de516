import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminShopSettings = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("shop_settings").select("*").then(({ data }) => {
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => { map[s.key] = s.value; });
      setTitle(map["shop_title"] || "");
      // Combine old subtitle fields or use new description field
      if (map["shop_description"]) {
        setDescription(map["shop_description"]);
      } else {
        const lines = [map["shop_subtitle_1"], map["shop_subtitle_2"], map["shop_subtitle_3"]].filter(Boolean);
        setDescription(lines.join("\n"));
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    
    // Upsert title
    await supabase.from("shop_settings").upsert(
      { key: "shop_title", value: title, updated_at: now },
      { onConflict: "key" }
    );
    
    // Upsert description (all lines in one field)
    await supabase.from("shop_settings").upsert(
      { key: "shop_description", value: description, updated_at: now },
      { onConflict: "key" }
    );

    setSaving(false);
    toast({ title: "✅ Đã lưu cài đặt shop!" });
  };

  const descLines = description.split("\n").filter(Boolean);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary neon-text flex items-center gap-2">
        <FileText className="w-6 h-6" /> MÔ TẢ SHOP
      </h1>

      <div className="bg-card border border-border rounded-xl p-6 neon-card space-y-4">
        <p className="text-sm text-muted-foreground">Chỉnh sửa nội dung mô tả hiển thị trên trang chủ.</p>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Tiêu đề shop (dòng lớn)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Mô tả (mỗi dòng = 1 dòng mô tả)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder={"🔥 Giao dịch tự động 24/7 – Mua là có ngay\n🛡️ Bảo mật tuyệt đối – Cam kết uy tín\n💰 Giá cả học sinh – Chất lượng hàng đầu"}
            className="w-full bg-muted border border-border rounded-lg py-3 px-4 text-foreground focus:outline-none focus:border-primary transition-all text-base leading-relaxed resize-y"
          />
        </div>

        <div className="bg-muted border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Xem trước:</p>
          <p className="text-lg font-bold text-foreground">{title}</p>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            {descLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
};

export default AdminShopSettings;
