import { useState } from "react";
import { Check, LayoutGrid, Loader2, PanelsTopLeft, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type ShopLayout, useShopLayout } from "@/contexts/ShopLayoutContext";

const layouts: Array<{
  id: ShopLayout;
  name: string;
  description: string;
  icon: typeof LayoutGrid;
  preview: "balanced" | "dense" | "feature";
}> = [
  {
    id: "cyber",
    name: "Cyber Neon",
    description: "Bố cục cân đối, hiệu ứng neon và thẻ danh mục nổi bật.",
    icon: LayoutGrid,
    preview: "balanced",
  },
  {
    id: "compact",
    name: "Compact Gaming",
    description: "Hiển thị nhiều danh mục hơn, phù hợp tìm kiếm nhanh.",
    icon: Rows3,
    preview: "dense",
  },
  {
    id: "showcase",
    name: "Showcase",
    description: "Hình ảnh lớn, khoảng thở rộng và nhấn mạnh nội dung chính.",
    icon: PanelsTopLeft,
    preview: "feature",
  },
];

const LayoutPreview = ({ type }: { type: "balanced" | "dense" | "feature" }) => (
  <div className="aspect-[16/9] w-full overflow-hidden rounded-md border border-border bg-background p-2" aria-hidden="true">
    <div className="mb-2 h-2 w-full rounded-sm bg-primary/70" />
    <div className="mb-2 h-7 w-full rounded-sm bg-muted" />
    {type === "balanced" && (
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((item) => <div key={item} className="h-10 rounded-sm border border-primary/30 bg-card" />)}
      </div>
    )}
    {type === "dense" && (
      <div className="grid grid-cols-4 gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => <div key={item} className="h-[18px] rounded-sm border border-primary/30 bg-card" />)}
      </div>
    )}
    {type === "feature" && (
      <div className="grid grid-cols-[1.6fr_1fr] gap-1.5">
        <div className="h-10 rounded-sm border border-primary/40 bg-primary/15" />
        <div className="space-y-1.5">
          <div className="h-[17px] rounded-sm bg-card" />
          <div className="h-[17px] rounded-sm bg-card" />
        </div>
      </div>
    )}
  </div>
);

const AdminAppearance = () => {
  const { layout, refreshLayout } = useShopLayout();
  const { toast } = useToast();
  const [saving, setSaving] = useState<ShopLayout | null>(null);

  const applyLayout = async (nextLayout: ShopLayout) => {
    setSaving(nextLayout);
    const { error } = await supabase.from("shop_settings").upsert(
      { key: "shop_layout", value: nextLayout, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );

    if (error) {
      toast({ title: "Không thể đổi giao diện", description: "Vui lòng thử lại sau.", variant: "destructive" });
    } else {
      await refreshLayout();
      toast({ title: "✨ Đã áp dụng giao diện mới!" });
    }
    setSaving(null);
  };

  return (
    <section className="space-y-5 min-w-0">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-primary">
          <PanelsTopLeft className="h-6 w-6" /> GIAO DIỆN SHOP
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Chọn một mẫu để áp dụng cho toàn bộ khách truy cập.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {layouts.map((item) => {
          const active = layout === item.id;
          const Icon = item.icon;
          return (
            <article key={item.id} className={`min-w-0 rounded-lg border bg-card p-4 transition-colors ${active ? "border-primary shadow-md" : "border-border"}`}>
              <LayoutPreview type={item.preview} />
              <div className="mt-4 flex min-w-0 items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground">{item.name}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Button
                type="button"
                variant={active ? "secondary" : "default"}
                className="mt-4 w-full"
                disabled={active || saving !== null}
                onClick={() => void applyLayout(item.id)}
              >
                {saving === item.id ? <Loader2 className="animate-spin" /> : active ? <Check /> : null}
                {saving === item.id ? "Đang áp dụng..." : active ? "Đang sử dụng" : "Áp dụng mẫu"}
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default AdminAppearance;