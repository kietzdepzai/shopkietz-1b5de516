import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, PackageOpen } from "lucide-react";

type Category = { id: string; name: string; slug: string; image_url: string | null };
type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
  category: string;
  image_url: string | null;
  product_type?: string;
};

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: cat } = await supabase.from("categories").select("*").eq("slug", slug!).maybeSingle();
      setCategory(cat as Category);
      if (cat) {
        const { data: prods } = await supabase
          .from("products")
          .select("*")
          .eq("status", "active")
          .eq("category", (cat as Category).name)
          .order("price", { ascending: true });
        setProducts((prods as Product[]) || []);
      } else {
        setProducts([]);
      }
      setLoading(false);
    };
    if (slug) load();
  }, [slug]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>

        {/* Category header */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-card border border-border flex items-center justify-center shrink-0 shadow-sm">
              {category?.image_url ? (
                <img src={category.image_url} alt={category.name} className="w-full h-full object-contain p-2" />
              ) : (
                <PackageOpen className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Danh mục</p>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground truncate">
                {category?.name || "Danh mục không tồn tại"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {loading ? "Đang tải..." : `${products.length} sản phẩm`}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <PackageOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            Danh mục này chưa có sản phẩm nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={p.price.toLocaleString("vi-VN") + "đ"}
                numericPrice={p.price}
                stock={p.stock}
                description={p.description || ""}
                category={p.category}
                imageUrl={p.image_url || undefined}
                product_type={p.product_type}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;
