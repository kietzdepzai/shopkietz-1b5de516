import { useState } from "react";
import { ShoppingCart, Eye, Loader2, CheckCircle2, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import PurchaseConfirmDialog from "./PurchaseConfirmDialog";
import BoostPurchaseDialog from "./BoostPurchaseDialog";

interface ProductCardProps {
  id?: string;
  name: string;
  price: string;
  numericPrice?: number;
  stock: number;
  description: string;
  category: string;
  imageUrl?: string;
  product_type?: string;
}

const ProductCard = ({ id, name, price, numericPrice, stock, description, category, imageUrl, product_type }: ProductCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [buying, setBuying] = useState(false);
  const [showAccDialog, setShowAccDialog] = useState(false);
  const [purchasedQuantity, setPurchasedQuantity] = useState(0);
  const [purchasedOrderCode, setPurchasedOrderCode] = useState("");
  const [purchasedOrderId, setPurchasedOrderId] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showBoost, setShowBoost] = useState(false);
  const isBoost = product_type === "boost";

  // Auto-generate short tags from description lines (max 3 items)
  const tags = description
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3);

  const handleBoostBuy = async (username: string, password: string, note: string) => {
    if (!user || !id) return;
    if (!username || !password) {
      toast({ title: "Vui lòng nhập tài khoản và mật khẩu", variant: "destructive" });
      return;
    }
    setBuying(true);
    const { data, error } = await supabase.rpc("purchase_boost" as any, {
      p_user_id: user.id, p_product_id: id,
      p_username: username, p_password: password, p_note: note,
    });
    setBuying(false);
    if (error) { toast({ title: "Lỗi", description: error.message, variant: "destructive" }); return; }
    const r = data as any;
    if (!r?.success) { toast({ title: "❌ " + (r?.error || "Đặt thất bại"), variant: "destructive" }); return; }
    setShowBoost(false);
    toast({ title: "✅ Đã đặt dịch vụ cày thuê!", description: `Mã đơn: ${r.order_code}` });
    window.location.href = "/lich-su-cay-thue";
  };

  const handleBuy = async (quantity: number, discountCode?: string) => {
    if (!user) { toast({ title: "Vui lòng đăng nhập", variant: "destructive" }); return; }
    if (!id) { toast({ title: "Lỗi sản phẩm", variant: "destructive" }); return; }
    if (stock <= 0) { toast({ title: "Hết hàng", variant: "destructive" }); return; }
    setBuying(true);
    setShowConfirm(false);

    const { data, error } = await supabase.rpc("purchase_product_batch", {
      p_user_id: user.id,
      p_product_id: id,
      p_quantity: quantity,
      p_discount_code: discountCode || null,
    });

    if (error) { toast({ title: "Lỗi", description: error.message, variant: "destructive" }); setBuying(false); return; }

    const result = data as any;
    if (!result.success) { toast({ title: "❌ " + result.error, variant: "destructive" }); setBuying(false); return; }

    setBuying(false);
    setPurchasedQuantity(result.quantity || quantity);
    setPurchasedOrderCode(result.order_code);
    setPurchasedOrderId(result.order_id);
    setShowAccDialog(true);
  };

  return (
    <>
      <div className={`group relative flex flex-col bg-card border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isBoost ? "border-accent/50" : "border-border hover:border-primary/60"}`}>
        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-muted to-background">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Package className="w-16 h-16 opacity-30" />
            </div>
          )}

          {/* Stock badge */}
          <div className="absolute top-2 left-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold shadow-md ${isBoost ? "bg-accent text-accent-foreground" : stock > 0 ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"}`}>
              {isBoost ? "Cày thuê" : stock > 0 ? `Còn ${stock}` : "Hết hàng"}
            </span>
          </div>

          {/* Country flag */}
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 backdrop-blur flex items-center justify-center text-sm shadow-md">
            🇻🇳
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-3 space-y-2.5">
          {/* Name */}
          <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
            {name}
          </h3>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 min-h-[22px]">
            {tags.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold leading-tight"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span className="truncate max-w-[140px]">{t}</span>
              </span>
            ))}
          </div>

          {/* Price */}
          <div className="flex items-baseline justify-between pt-1 border-t border-border">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Giá bán</span>
            <span className="text-lg font-extrabold text-yellow-500 leading-none">
              {user ? price : "Đăng nhập"}
            </span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1 mt-auto">
            {id ? (
              <Link
                to={`/san-pham/${id}`}
                className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-muted border border-border hover:bg-border transition-colors text-xs font-semibold text-foreground"
              >
                <Eye className="w-3.5 h-3.5" /> Chi tiết
              </Link>
            ) : <span />}
            {user ? (
              <button
                onClick={() => isBoost ? setShowBoost(true) : setShowConfirm(true)}
                disabled={buying || (!isBoost && stock <= 0)}
                className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-bold disabled:opacity-50"
              >
                {buying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                {buying ? "..." : !isBoost && stock <= 0 ? "Hết" : isBoost ? "Đặt cày" : "Mua ngay"}
              </button>
            ) : (
              <Link to="/dang-nhap" className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-bold">
                <ShoppingCart className="w-3.5 h-3.5" /> Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>

      <PurchaseConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        productName={name}
        price={price}
        numericPrice={numericPrice || 0}
        stock={stock}
        onConfirm={handleBuy}
        buying={buying}
      />

      <BoostPurchaseDialog
        open={showBoost}
        onOpenChange={setShowBoost}
        productName={name}
        price={price}
        onConfirm={handleBoostBuy}
        buying={buying}
      />

      {showAccDialog && (
        <Dialog open={showAccDialog} onOpenChange={setShowAccDialog}>
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="text-primary flex items-center gap-2">✅ Mua hàng thành công!</DialogTitle>
              <DialogDescription>Đơn hàng đã được tạo. Xem chi tiết đơn hàng để lấy thông tin tài khoản.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="bg-muted border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1 font-semibold">Sản phẩm:</p>
                <p className="text-sm text-foreground font-medium">{name} (x{purchasedQuantity})</p>
              </div>
              <div className="bg-muted border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1 font-semibold">Mã đơn:</p>
                <p className="text-sm text-primary font-mono font-bold">{purchasedOrderCode}</p>
              </div>
              <div className="bg-muted border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1 font-semibold">Thông tin tài khoản:</p>
                <p className="text-sm text-muted-foreground">●●●●●●●● (đã ẩn)</p>
                <p className="text-xs text-muted-foreground mt-1">Bấm "Xem chi tiết" để xem thông tin tài khoản đầy đủ.</p>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Link to={`/don-hang/${purchasedOrderId}`} onClick={() => setShowAccDialog(false)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                <Eye className="w-4 h-4" /> Xem chi tiết
              </Link>
              <button onClick={() => { setShowAccDialog(false); window.location.reload(); }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                Mua thêm
              </button>
              <Link to="/lich-su-mua" onClick={() => setShowAccDialog(false)}
                className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-border transition-colors text-center">
                Lịch sử giao dịch
              </Link>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ProductCard;
