import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import WelcomePanel from "@/components/WelcomePanel";
import TopUpGuide from "@/components/TopUpGuide";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import RecentPurchases from "@/components/RecentPurchases";
import RecentTopups from "@/components/RecentTopups";

import Footer from "@/components/Footer";
import WelcomePopup from "@/components/WelcomePopup";
import { supabase } from "@/integrations/supabase/client";
import { Package, ArrowRight } from "lucide-react";
import { useShopLayout } from "@/contexts/ShopLayoutContext";
import ProductCard from "@/components/ProductCard";

type Category = { id: string; name: string; slug: string; image_url: string | null; sort_order: number };
type Product = { id: string; name: string; price: number; category: string; image_url: string | null; stock: number; description: string | null; product_type?: string };

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

const Index = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { layout } = useShopLayout();

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, catRes] = await Promise.all([
        supabase.from("products").select("id, name, price, category, image_url, stock, description, product_type").eq("status", "active"),
        supabase.from("categories").select("*").order("sort_order"),
      ]);
      setProducts((prodRes.data as Product[]) || []);
      setCategories((catRes.data as Category[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const categoryGroups = useMemo(() => categories
    .map((category) => ({
      category,
      products: products.filter((product) => product.category === category.name),
    }))
    .filter((group) => group.products.length > 0), [categories, products]);

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      <div className="pointer-events-none fixed inset-0 interactive-pointer-glow" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 micro-grid opacity-40" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 glow-orbs" aria-hidden="true" />
      <WelcomePopup />
      <Header />

      <main className={`storefront-main relative flex-1 container mx-auto px-4 py-6 space-y-8 storefront-${layout}`}>

        <Hero />
        <WelcomePanel />

        <div id="danh-muc" className="flex items-center justify-between gap-3 scroll-mt-24">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">Sản phẩm theo danh mục</h2>
            <p className="mt-1 text-sm text-muted-foreground">Chọn nhanh sản phẩm trong từng nhóm</p>
          </div>
          <p className="shrink-0 text-sm text-muted-foreground">{products.length} sản phẩm</p>
        </div>

        {loading ? (
          <ProductCardSkeleton count={8} />
        ) : categoryGroups.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">Chưa có sản phẩm nào.</div>
        ) : (
          <div className="space-y-8">
            {categoryGroups.map(({ category, products: categoryProducts }) => (
              <section key={category.id} className="category-product-group scroll-mt-24">
                <div className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-primary/20 bg-card">
                      {category.image_url ? (
                        <img src={category.image_url} alt="" className="h-full w-full object-contain p-1" />
                      ) : (
                        <Package className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-bold text-foreground sm:text-lg">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">{categoryProducts.length} sản phẩm</p>
                    </div>
                  </div>
                  <Link to={`/danh-muc/${category.slug}`} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-foreground sm:text-sm">
                    Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="home-product-grid grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {categoryProducts.slice(0, 4).map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={formatVND(product.price)}
                      numericPrice={product.price}
                      stock={product.stock}
                      description={product.description || ""}
                      category={product.category}
                      imageUrl={product.image_url || undefined}
                      product_type={product.product_type}
                      compact
                    />
                  ))}
                </div>
              </section>
            ))}
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
