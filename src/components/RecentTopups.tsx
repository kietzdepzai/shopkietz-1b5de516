import { useState, useEffect } from "react";
import { Wallet, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TopupEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  amount: number;
  created_at: string;
  method: string;
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

const RecentTopups = () => {
  const [topups, setTopups] = useState<TopupEntry[]>([]);

  useEffect(() => {
    const fetchTopups = async () => {
      const { data } = await supabase
        .from("topup_requests")
        .select("user_id, amount, created_at, method")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!data || data.length === 0) return;

      const userIds = [...new Set(data.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      profiles?.forEach(p => { profileMap[p.user_id] = p; });

      setTopups(data.map(t => ({
        user_id: t.user_id,
        amount: t.amount,
        created_at: t.created_at,
        method: t.method || "Chuyển khoản",
        display_name: profileMap[t.user_id]?.display_name || "User",
        avatar_url: profileMap[t.user_id]?.avatar_url || null,
      })));
    };
    fetchTopups();
  }, []);

  if (topups.length === 0) return null;

  return (
    <div className="min-w-0 max-w-full bg-card border border-border rounded-xl neon-card h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 pb-2">
        <Wallet className="w-4 h-4 text-accent" />
        <h2 className="font-display text-sm font-bold text-foreground">NẠP TIỀN GẦN ĐÂY</h2>
      </div>
      <div className="min-w-0 max-h-[280px] overflow-y-auto overflow-x-hidden px-4 pb-4">
        <div className="space-y-1.5">
          {topups.map((t, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  <span className="font-bold">{maskName(t.display_name)}</span>{" "}
                  <span className="text-muted-foreground">thực hiện nạp</span>{" "}
                  <span className="font-bold text-accent">{formatVND(t.amount)}</span>{" "}
                  <span className="text-muted-foreground">bằng</span>{" "}
                  <span className="font-semibold text-primary">{t.method}</span>{" "}
                  <span className="text-muted-foreground">thực nhận</span>{" "}
                  <span className="font-bold text-accent">{formatVND(t.amount)}</span>
                </p>
              </div>
              <span className="text-[10px] font-medium text-primary-foreground bg-accent/80 px-1.5 py-0.5 rounded shrink-0">{timeAgo(t.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentTopups;
