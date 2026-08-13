import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Star, TrendingUp } from "lucide-react";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { supabase } from "@/integrations/supabase/client";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  stock: number;
  product_type: string;
};

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

// Rating derived from real sales volume (4.6 -> 5.0)
const ratingFromSales = (sold: number) => Math.min(5, 4.6 + Math.log10(sold + 1) * 0.25);

const BestSellers = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [soldMap, setSoldMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [prodRes, salesRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, price, category, image_url, stock, product_type")
          .eq("status", "active"),
        supabase.rpc("get_recent_purchases", { limit_count: 200 }),
      ]);

      const counts: Record<string, number> = {};
      ((salesRes.data as { product_name: string }[]) || []).forEach((s) => {
        counts[s.product_name] = (counts[s.product_name] || 0) + 1;
      });

      setSoldMap(counts);
      setProducts((prodRes.data as Product[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const top = useMemo(() => {
    return [...products]
      .sort((a, b) => (soldMap[b.name] || 0) - (soldMap[a.name] || 0) || a.price - b.price)
      .slice(0, 8);
  }, [products, soldMap]);

  if (loading) {
    return <ProductCardSkeleton count={4} />;
  }

  if (top.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl sm:text-2xl text-foreground">Sản phẩm bán chạy</h2>
        </div>
        <p className="text-sm text-muted-foreground">Dựa trên lượt mua thực tế</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {top.map((p, idx) => {
          const sold = soldMap[p.name] || 0;
          const rating = ratingFromSales(sold);
          return (
            <Link
              key={p.id}
              to={`/san-pham/${p.id}`}
              style={{ animationDelay: `${idx * 60}ms` }}
              className="group flex flex-col rounded-2xl overflow-hidden glass-panel neon-edge card-lift hover:-translate-y-1 hover:neon-edge-strong animate-fade-in-up"
            >
              <div className="relative aspect-square w-full bg-gradient-to-br from-muted/60 via-card to-background flex items-center justify-center overflow-hidden">
                <div className="pointer-events-none absolute inset-0 glow-orbs opacity-70" aria-hidden="true" />
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    className="relative w-full h-full object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                ) : (
                  <Package className="w-16 h-16 text-muted-foreground/40" />
                )}
                {idx === 0 && (
                  <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide badge-hot">
                    Hot
                  </span>
                )}
                {sold > 0 && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide badge-sale">
                    Đã bán {sold}
                  </span>
                )}
              </div>
              <div className="relative flex flex-col flex-1 p-3 space-y-2">
                <h3 className="font-display text-sm leading-snug line-clamp-2 min-h-[2.5rem] text-foreground group-hover:text-primary transition-colors">
                  {p.name}
                </h3>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.round(rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/40"}`}
                    />
                  ))}
                  <span className="text-[11px] text-muted-foreground ml-1">{rating.toFixed(1)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide line-clamp-1">{p.category}</p>
                <div className="flex items-baseline justify-between pt-1 border-t border-primary/15">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Giá</span>
                  <span className="text-base font-extrabold text-yellow-500 leading-none">{formatVND(p.price)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

    </section>
  );
};

export default BestSellers;
