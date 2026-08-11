import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Package, Star, TrendingUp } from "lucide-react";
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
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  if (top.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">Sản phẩm bán chạy</h2>
        </div>
        <p className="text-sm text-muted-foreground">Dựa trên lượt mua thực tế</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {top.map((p) => {
          const sold = soldMap[p.name] || 0;
          const rating = ratingFromSales(sold);
          return (
            <Link
              key={p.id}
              to={`/san-pham/${p.id}`}
              className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/60"
            >
              <div className="relative aspect-square w-full bg-gradient-to-br from-muted to-background flex items-center justify-center overflow-hidden">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <Package className="w-16 h-16 text-muted-foreground/40" />
                )}
                {sold > 0 && (
                  <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-[11px] font-bold bg-primary text-primary-foreground shadow-md">
                    Đã bán {sold}
                  </span>
                )}
              </div>
              <div className="flex flex-col flex-1 p-3 space-y-2">
                <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
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
                <div className="flex items-baseline justify-between pt-1 border-t border-border">
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
