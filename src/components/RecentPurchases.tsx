import { useState, useEffect } from "react";
import { ShoppingBag, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PurchaseEntry {
  product_name: string;
  product_category: string;
  price: number;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
}

const maskName = (name: string | null) => {
  if (!name || name.length <= 3) return "***";
  return "***" + name.slice(-3);
};

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

const RecentPurchases = () => {
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);

  useEffect(() => {
    supabase.rpc("get_recent_purchases", { limit_count: 20 }).then(({ data }) => {
      setPurchases((data as PurchaseEntry[]) || []);
    });
  }, []);

  if (purchases.length === 0) return null;

  return (
    <div className="min-w-0 max-w-full bg-card border border-border rounded-xl neon-card h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 pb-2">
        <ShoppingBag className="w-4 h-4 text-primary" />
        <h2 className="font-display text-sm font-bold text-foreground">ĐƠN HÀNG GẦN ĐÂY</h2>
      </div>
      <div className="min-w-0 max-h-[280px] overflow-y-auto overflow-x-hidden px-4 pb-4">
        <div className="space-y-1.5">
          {purchases.map((p, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  <span className="font-bold">{maskName(p.display_name)}</span>{" "}
                  <span className="text-muted-foreground">mua</span>{" "}
                  <span className="font-semibold">{p.product_name}</span>{" "}
                  <span className="text-muted-foreground">với giá</span>{" "}
                  <span className="font-bold text-primary">{formatVND(p.price)}</span>
                </p>
              </div>
              <span className="text-[10px] font-medium text-primary-foreground bg-primary/80 px-1.5 py-0.5 rounded shrink-0">{timeAgo(p.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentPurchases;
