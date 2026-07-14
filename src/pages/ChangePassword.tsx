import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";

type FieldKey = "current" | "next" | "confirm";

const strengthOf = (pwd: string) => {
  let s = 0;
  if (pwd.length >= 6) s++;
  if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return Math.min(s, 4);
};

const ChangePassword = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [values, setValues] = useState<Record<FieldKey, string>>({ current: "", next: "", confirm: "" });
  const [shown, setShown] = useState<Record<FieldKey, boolean>>({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);

  if (!user) { navigate("/dang-nhap"); return null; }

  const set = (k: FieldKey, v: string) => setValues((s) => ({ ...s, [k]: v }));
  const toggle = (k: FieldKey) => setShown((s) => ({ ...s, [k]: !s[k] }));

  const handleSave = async () => {
    const { current, next, confirm } = values;
    if (!current || !next || !confirm) {
      toast({ title: "Vui lòng nhập đầy đủ các ô", variant: "destructive" });
      return;
    }
    if (next.length < 6) {
      toast({ title: "Mật khẩu mới tối thiểu 6 ký tự", variant: "destructive" });
      return;
    }
    if (next === current) {
      toast({ title: "Mật khẩu mới phải khác mật khẩu hiện tại", variant: "destructive" });
      return;
    }
    if (next !== confirm) {
      toast({ title: "Mật khẩu xác nhận không khớp", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: current,
    });
    if (signInErr) {
      setLoading(false);
      toast({ title: "Mật khẩu hiện tại không đúng", variant: "destructive" });
      return;
    }
    const { error: updErr } = await supabase.auth.updateUser({ password: next });
    setLoading(false);
    if (updErr) {
      toast({ title: "Lỗi", description: updErr.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Đã đổi mật khẩu thành công" });
    setValues({ current: "", next: "", confirm: "" });
    navigate("/trang-ca-nhan");
  };

  const strength = strengthOf(values.next);
  const strengthColors = ["bg-muted", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
  const strengthLabels = ["", "Yếu", "Trung bình", "Khá", "Mạnh"];

  const fields: { key: FieldKey; label: string; ph: string }[] = [
    { key: "current", label: "Mật khẩu hiện tại", ph: "Nhập mật khẩu hiện tại" },
    { key: "next", label: "Mật khẩu mới", ph: "Ít nhất 6 ký tự" },
    { key: "confirm", label: "Nhập lại mật khẩu mới", ph: "Nhập lại mật khẩu mới" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 neon-card">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">Thay đổi mật khẩu</h1>
              <p className="text-xs text-muted-foreground">Bảo vệ tài khoản với mật khẩu mạnh</p>
            </div>
          </div>

          <div className="space-y-4">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{f.label}</label>
                <div className="relative">
                  <input
                    type={shown[f.key] ? "text" : "password"}
                    value={values[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.ph}
                    autoComplete={f.key === "current" ? "current-password" : "new-password"}
                    className="w-full bg-muted/50 border border-border rounded-lg py-2.5 pl-4 pr-11 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => toggle(f.key)}
                    tabIndex={-1}
                    aria-label={shown[f.key] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {shown[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {f.key === "next" && values.next.length > 0 && (
                  <div className="pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Độ mạnh: <span className="font-semibold text-foreground">{strengthLabels[strength] || "Yếu"}</span>
                    </p>
                  </div>
                )}
                {f.key === "confirm" && values.confirm.length > 0 && values.next !== values.confirm && (
                  <p className="text-xs text-destructive">Mật khẩu xác nhận không khớp</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6">
            <button
              onClick={() => navigate("/trang-ca-nhan")}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-muted hover:bg-border text-foreground rounded-lg text-sm font-semibold transition-colors"
            >
              Huỷ
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 sm:flex-none px-6 py-2.5 gradient-primary text-primary-foreground rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu thay đổi
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChangePassword;
