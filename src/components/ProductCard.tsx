import { useState } from "react";
import { ShoppingCart, Eye, Package, Loader2 } from "lucide-react";
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
    if (!user) {
      toast({ title: "Vui lòng đăng nhập", variant: "destructive" });
      return;
    }
    if (!id) {
      toast({ title: "Lỗi sản phẩm", variant: "destructive" });
      return;
    }
    if (stock <= 0) {
      toast({ title: "Hết hàng", variant: "destructive" });
      return;
    }
    setBuying(true);
    setShowConfirm(false);

    const { data, error } = await supabase.rpc("purchase_product_batch", {
      p_user_id: user.id,
      p_product_id: id,
      p_quantity: quantity,
      p_discount_code: discountCode || null,
    });

    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      setBuying(false);
      return;
    }

    const result = data as any;
    if (!result.success) {
      toast({ title: "❌ " + result.error, variant: "destructive" });
      setBuying(false);
      return;
    }



    setBuying(false);
    setPurchasedQuantity(result.quantity || quantity);
    setPurchasedOrderCode(result.order_code);
    setPurchasedOrderId(result.order_id);
    setShowAccDialog(true);
  };

  return (
    <>
      <div className={`bg-card border rounded-xl overflow-hidden hover:neon-card transition-all duration-300 group ${isBoost ? "border-accent/50 neon-purple" : "border-border hover:border-primary/50"}`}>
        <div className={`${isBoost ? "gradient-accent" : "gradient-primary"} px-4 py-2 flex items-center justify-between`}>
          <span className="text-xs font-bold text-primary-foreground uppercase tracking-wider">{category}</span>
          <div className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-primary-foreground" />
            <span className="text-xs font-bold text-primary-foreground">
              {isBoost ? "Dịch vụ cày thuê" : stock > 0 ? `Kho: ${stock}` : "Hết hàng"}
            </span>
          </div>
        </div>

        {imageUrl && (
          <div className="aspect-video w-full overflow-hidden bg-muted">
            <img src={imageUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}

        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">{description}</p>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-lg font-semibold text-yellow-500">
              {user ? price : <span className="text-xs text-muted-foreground italic">Đăng nhập để xem giá</span>}
            </span>
            <div className="flex gap-2">
              {id && (
                <Link to={`/san-pham/${id}`} className="p-2 rounded-lg bg-muted hover:bg-border transition-colors" title="Chi tiết">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}
              {user ? (
                <button
                  onClick={() => isBoost ? setShowBoost(true) : setShowConfirm(true)}
                  disabled={buying || (!isBoost && stock <= 0)}
                  className="flex items-center gap-1.5 px-3 py-2 galaxy-button rounded-lg text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {buying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                  {buying ? "Đang xử lý..." : !isBoost && stock <= 0 ? "Hết hàng" : isBoost ? "Đặt cày" : "Mua ngay"}
                </button>

              ) : (
                <Link to="/dang-nhap" className="flex items-center gap-1.5 px-3 py-2 galaxy-button rounded-lg text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity">
                  <ShoppingCart className="w-3.5 h-3.5" /> Đăng nhập
                </Link>
              )}
            </div>
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


      {/* Success dialog - account info hidden */}
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
                className="flex items-center justify-center gap-2 px-4 py-2 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                <Eye className="w-4 h-4" /> Xem chi tiết
              </Link>
              <button onClick={() => { setShowAccDialog(false); window.location.reload(); }}
                className="px-4 py-2 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
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
