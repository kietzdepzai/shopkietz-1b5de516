import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import WelcomePanel from "@/components/WelcomePanel";
import TopUpGuide from "@/components/TopUpGuide";
import RecentPurchases from "@/components/RecentPurchases";
import RecentTopups from "@/components/RecentTopups";
import Footer from "@/components/Footer";
import WelcomePopup from "@/components/WelcomePopup";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, ArrowRight, Flame } from "lucide-react";

type Category = { id: string; name: string; slug: string; image_url: string | null; sort_order: number };
type Product = { id: string; name: string; price: number; category: string; image_url: string | null };

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

const Index = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, catRes] = await Promise.all([
        supabase.from("products").select("id, name, price, category, image_url").eq("status", "active"),
        supabase.from("categories").select("*").order("sort_order"),
      ]);
      setProducts((prodRes.data as Product[]) || []);
      setCategories((catRes.data as Category[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Build price range + representative image per category
  const catStats = useMemo(() => {
    const map: Record<string, { count: number; min: number; max: number; image: string | null }> = {};
    products.forEach((p) => {
      const s = (map[p.category] ||= { count: 0, min: p.price, max: p.price, image: p.image_url });
      s.count += 1;
      if (p.price < s.min) s.min = p.price;
      if (p.price > s.max) s.max = p.price;
      if (!s.image && p.image_url) s.image = p.image_url;
    });
    return map;
  }, [products]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <WelcomePopup />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 space-y-8">
        <WelcomePanel />

        {/* Section header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">Danh mục sản phẩm</h2>
          </div>
          <p className="text-sm text-muted-foreground">Chọn danh mục để xem sản phẩm</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">Chưa có danh mục nào.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {categories.map((cat) => {
              const stats = catStats[cat.name];
              const image = cat.image_url || stats?.image || null;
              const priceLabel = stats && stats.count > 0
                ? stats.min === stats.max
                  ? formatVND(stats.min)
                  : `${formatVND(stats.min)} ~ ${formatVND(stats.max)}`
                : "Chưa có sản phẩm";
              return (
                <Link
                  key={cat.id}
                  to={`/danh-muc/${cat.slug}`}
                  className="group relative flex flex-col bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/60"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-muted to-background flex items-center justify-center">
                    {image ? (
                      <img
                        src={image}
                        alt={cat.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Package className="w-20 h-20 text-muted-foreground/40" />
                    )}
                    {stats && stats.count > 0 && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold shadow-md bg-primary text-primary-foreground">
                        {stats.count} sản phẩm
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 p-3 space-y-2">
                    <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors uppercase">
                      {cat.name}
                    </h3>
                    <div className="flex items-baseline justify-between pt-1 border-t border-border">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Giá</span>
                      <span className="text-base font-extrabold text-yellow-500 leading-none">{priceLabel}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold group-hover:bg-primary/90 transition-colors">
                      Xem sản phẩm <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <RecentPurchases />
          <RecentTopups />
        </div>

        <TopUpGuide />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
