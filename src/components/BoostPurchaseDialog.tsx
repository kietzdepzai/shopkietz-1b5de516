import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, ShoppingCart, AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productName: string;
  price: string;
  onConfirm: (username: string, password: string, note: string) => void;
  buying: boolean;
}

const BoostPurchaseDialog = ({ open, onOpenChange, productName, price, onConfirm, buying }: Props) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary">🚀 Đặt dịch vụ cày thuê</DialogTitle>
          <DialogDescription>{productName} — <span className="text-yellow-500 font-bold">{price}</span></DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">Vui lòng <b>TẮT bảo mật 2 lớp (2FA)</b> trước khi gửi tài khoản cho admin để tránh đăng nhập thất bại.</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tài khoản game</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Tên đăng nhập / email"
              className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mật khẩu</label>
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu (admin sẽ chỉ dùng để đăng nhập cày)"
              className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground text-sm font-mono focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Lời nhắn cho admin (tuỳ chọn)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              placeholder="VD: cày ép hải tặc, level 1000, ưu tiên buổi tối..."
              className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground text-sm focus:outline-none focus:border-primary resize-none" />
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <button onClick={() => onOpenChange(false)} disabled={buying}
            className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-border transition-colors">
            Huỷ
          </button>
          <button onClick={() => onConfirm(username.trim(), password.trim(), note.trim())}
            disabled={buying || !username.trim() || !password.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
            {buying ? "Đang đặt..." : "Xác nhận đặt"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoostPurchaseDialog;
