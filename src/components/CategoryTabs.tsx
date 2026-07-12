import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}

type Category = { id: string; name: string; slug: string; sort_order: number; image_url: string | null };

const CategoryTabs = ({ activeCategory, onCategoryChange }: CategoryTabsProps) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => {
      setCategories((data as Category[]) || []);
    });
  }, []);

  const pillBase =
    "flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all border whitespace-nowrap";
  const pillActive =
    "bg-primary text-primary-foreground border-primary shadow-[0_4px_14px_hsl(var(--primary)/0.4)]";
  const pillIdle =
    "bg-card text-foreground border-border hover:border-primary/50 hover:text-primary";

  return (
    <div className="space-y-5">
      {/* Pill row */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange("all")}
          className={`${pillBase} ${activeCategory === "all" ? pillActive : pillIdle}`}
        >
          <Package className="w-4 h-4" />
          Tất cả
        </button>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.slug)}
              className={`${pillBase} ${isActive ? pillActive : pillIdle}`}
            >
              {cat.image_url ? (
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-5 h-5 object-contain shrink-0"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <Package className="w-4 h-4" />
              )}
              <span className="uppercase">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Square card grid */}
      {categories.length > 0 && (
        <div className="bg-muted/40 border border-border rounded-2xl p-4 sm:p-5">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-4">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.slug)}
                  className={`group flex flex-col items-center justify-center gap-2 aspect-square rounded-xl border bg-card p-3 transition-all ${
                    isActive
                      ? "border-primary shadow-[0_6px_20px_hsl(var(--primary)/0.35)] -translate-y-0.5"
                      : "border-border hover:border-primary/60 hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                >
                  <div className="flex-1 w-full flex items-center justify-center">
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="max-h-12 sm:max-h-14 w-auto object-contain"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <Package className={`w-10 h-10 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    )}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-semibold text-center leading-tight line-clamp-2 ${
                      isActive ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryTabs;
