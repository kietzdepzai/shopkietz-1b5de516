import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const ChangePassword = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) { navigate("/dang-nhap"); return null; }

  const handleSave = async () => {
    if (!current || !next || !confirm) {
      toast({ title: "Vui lòng nhập đầy đủ các ô", variant: "destructive" });
      return;
    }
    if (next.length < 6) {
      toast({ title: "Mật khẩu mới tối thiểu 6 ký tự", variant: "destructive" });
      return;
    }
    if (next !== confirm) {
      toast({ title: "Mật khẩu xác nhận không khớp", variant: "destructive" });
      return;
    }
    setLoading(true);
    // Verify current password
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: current,
    });
    if (signInErr) {
      setLoading(false);
      toast({ title: "Mật khẩu hiện tại không đúng", variant: "destructive" });
      return;
    }
    // Update
    const { error: updErr } = await supabase.auth.updateUser({ password: next });
    setLoading(false);
    if (updErr) {
      toast({ title: "Lỗi", description: updErr.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Đã đổi mật khẩu thành công" });
    setCurrent(""); setNext(""); setConfirm("");
    navigate("/trang-ca-nhan");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="bg-card border border-border rounded-xl p-6 neon-card">
          <h1 className="text-2xl font-bold text-foreground mb-6">Thay đổi mật khẩu</h1>
          <div className="space-y-5">
            {[
              { label: "Mật khẩu hiện tại", value: current, set: setCurrent, ph: "Vui lòng nhập mật khẩu hiện tại" },
              { label: "Mật khẩu mới", value: next, set: setNext, ph: "Vui lòng nhập mật khẩu mới" },
              { label: "Nhập lại mật khẩu mới", value: confirm, set: setConfirm, ph: "Vui lòng nhập lại mật khẩu mới" },
            ].map((f, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[220px_1fr] items-center gap-3">
                <label className="text-sm text-foreground">{f.label}</label>
                <input
                  type="password"
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.ph}
                  className="bg-muted/50 border border-border rounded-lg py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-7">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu Thay Đổi
            </button>
            <button
              onClick={() => navigate("/trang-ca-nhan")}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChangePassword;
