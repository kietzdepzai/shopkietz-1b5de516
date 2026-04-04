import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ArrowRight, CheckCircle } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    setChecking(false);
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/", { replace: true }), 3000);
    }
    setSubmitting(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Đang kiểm tra...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-md">
        <div className="bg-card border border-border rounded-xl p-8 animate-slide-up">
          {success ? (
            <div className="flex flex-col items-center text-center gap-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <h1 className="font-display text-xl font-bold text-foreground">
                Đổi mật khẩu thành công!
              </h1>
              <p className="text-muted-foreground text-sm">
                Bạn sẽ được chuyển về trang chủ trong giây lát...
              </p>
            </div>
          ) : !isRecovery ? (
            <div className="flex flex-col items-center text-center gap-4">
              <h1 className="font-display text-xl font-bold text-destructive">
                Liên kết không hợp lệ
              </h1>
              <p className="text-muted-foreground text-sm">
                Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.
              </p>
              <button
                onClick={() => navigate("/dang-nhap")}
                className="py-2 px-6 gradient-primary text-primary-foreground font-bold rounded-lg text-sm hover:opacity-90 transition-opacity"
              >
                Quay lại đăng nhập
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-6">
                <Lock className="w-12 h-12 text-primary mb-2" />
                <h1 className="font-display text-xl font-bold text-primary">
                  ĐẶT LẠI MẬT KHẨU
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Nhập mật khẩu mới cho tài khoản của bạn
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới..."
                      required
                      minLength={6}
                      className="w-full bg-muted border border-border rounded-lg py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu..."
                      required
                      minLength={6}
                      className="w-full bg-muted border border-border rounded-lg py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 gradient-primary text-primary-foreground font-bold rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;
