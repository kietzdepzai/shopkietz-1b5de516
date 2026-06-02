import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Phone, ShieldOff, Loader2, Facebook, Twitter, Youtube, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formatVND = (n: number) => (n || 0).toLocaleString("vi-VN") + "đ";
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleString("vi-VN", { hour12: false }).replace(",", "") : "—";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [totalTopup, setTotalTopup] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/dang-nhap"); return; }
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      setProfile(p);
      setFullName((p as any)?.full_name || "");
      setPhone((p as any)?.phone || "");

      const { data: topups } = await supabase
        .from("topup_requests").select("amount").eq("user_id", user.id).eq("status", "approved");
      setTotalTopup((topups || []).reduce((s, t: any) => s + (t.amount || 0), 0));

      const { data: orders } = await supabase
        .from("orders").select("price").eq("user_id", user.id);
      setTotalSpent((orders || []).reduce((s, o: any) => s + (o.price || 0), 0));

      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, display_name: fullName || profile?.display_name })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    else toast({ title: "✅ Đã lưu thay đổi" });
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>;
  }
  if (!user) return null;

  const username = profile?.username || user.email?.split("@")[0];
  const balance = profile?.balance || 0;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
          {/* LEFT — User card */}
          <div className="bg-card border border-border rounded-xl overflow-hidden neon-card">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-white mx-auto overflow-hidden border-4 border-white/30 flex items-center justify-center text-3xl font-bold text-blue-700">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : (username || "U").charAt(0).toUpperCase()}
              </div>
              <h2 className="mt-3 text-white text-xl font-bold">{username}</h2>
              <p className="text-white/80 text-sm">{formatVND(balance)}</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-sm text-foreground truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-sm text-muted-foreground">{phone || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                <ShieldOff className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-sm text-muted-foreground">Đang tắt bảo mật</span>
              </div>
              <div className="flex items-center justify-center gap-4 pt-3 border-t border-border">
                <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary/20 transition-colors"><Facebook className="w-4 h-4 text-blue-500" /></a>
                <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary/20 transition-colors"><Twitter className="w-4 h-4 text-blue-500" /></a>
                <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary/20 transition-colors"><Youtube className="w-4 h-4 text-blue-500" /></a>
              </div>
              <Link
                to="/doi-mat-khau"
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors text-sm font-semibold"
              >
                <KeyRound className="w-4 h-4" /> Đổi mật khẩu
              </Link>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-5 text-center neon-card">
                <p className="text-2xl font-bold text-blue-500">{formatVND(totalTopup)}</p>
                <p className="text-sm text-muted-foreground mt-1">Tổng tiền nạp</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 text-center neon-card">
                <p className="text-2xl font-bold text-green-500">{formatVND(totalSpent)}</p>
                <p className="text-sm text-muted-foreground mt-1">Số Dư Sử Dụng</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 text-center neon-card">
                <p className="text-2xl font-bold text-yellow-500">{formatVND(balance)}</p>
                <p className="text-sm text-muted-foreground mt-1">Số Dư Hiện Tại</p>
              </div>
            </div>

            {/* Info form */}
            <div className="bg-card border border-border rounded-xl p-6 neon-card">
              <h3 className="text-lg font-bold text-foreground mb-5">Thông Tin Cá Nhân</h3>
              <div className="space-y-4">
                {[
                  { label: "Họ và Tên", value: fullName, onChange: setFullName, placeholder: "Nhập họ và tên" },
                  { label: "Tên đăng nhập", value: username, disabled: true },
                  { label: "Số điện thoại", value: phone, onChange: setPhone, placeholder: "Nhập số điện thoại" },
                  { label: "Địa chỉ Email (*)", value: user.email, disabled: true },
                  { label: "Thời gian đăng ký", value: fmtDate(user.created_at), disabled: true },
                  { label: "Đăng nhập gần đây", value: fmtDate(user.last_sign_in_at), disabled: true },
                ].map((f, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
                    <label className="text-sm text-muted-foreground">{f.label}</label>
                    <input
                      value={f.value || ""}
                      onChange={(e) => f.onChange?.(e.target.value)}
                      placeholder={f.placeholder}
                      disabled={f.disabled}
                      className="bg-muted/50 border border-border rounded-lg py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
