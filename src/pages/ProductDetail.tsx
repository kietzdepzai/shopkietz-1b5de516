import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Package, ShoppingCart, Loader2, AlertCircle, Clock, Pencil, Save, X, ImagePlus, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PurchaseConfirmDialog from "@/components/PurchaseConfirmDialog";
import BoostPurchaseDialog from "@/components/BoostPurchaseDialog";
import { useNavigate } from "react-router-dom";

const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

const IMAGE_URL_REGEX = /https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[^\s]*)?/gi;

const DescriptionWithImages = ({ text }: { text: string }) => {
  // Split text into image URLs vs text lines while preserving order
  const tokens: Array<{ type: "text" | "image"; value: string }> = [];
  let lastIndex = 0;
  const regex = new RegExp(IMAGE_URL_REGEX.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) tokens.push({ type: "text", value: text.slice(lastIndex, m.index) });
    tokens.push({ type: "image", value: m[0] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) tokens.push({ type: "text", value: text.slice(lastIndex) });

  return (
    <div className="space-y-2">
      {tokens.map((tok, i) => {
        if (tok.type === "image") {
          return (
            <a key={i} href={tok.value} target="_blank" rel="noopener noreferrer" className="block my-2">
              <img src={tok.value} alt="Ảnh sản phẩm" className="max-w-full rounded-lg border border-border max-h-72 object-contain" />
            </a>
          );
        }
        const lines = tok.value.split("\n").map((l) => l.trim()).filter(Boolean);
        if (!lines.length) return null;
        return (
          <ul key={i} className="space-y-1.5">
            {lines.map((line, j) => (
              <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="leading-snug">{line}</span>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [soldCount, setSoldCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showBoost, setShowBoost] = useState(false);
  const [buying, setBuying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data } = await supabase.from("products").select("*").eq("id", id!).single();
      setProduct(data);
      if (data) setEditForm(data);
      const { count } = await supabase
        .from("product_accounts")
        .select("*", { count: "exact", head: true })
        .eq("product_id", id!)
        .eq("is_sold", true);
      setSoldCount(count || 0);
      setLoading(false);
    };
    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin")
      .then(({ data }) => { if (data && data.length > 0) setIsAdmin(true); });
  }, [user]);

  const handleSaveEdit = async () => {
    setSaving(true);
    const { error } = await supabase.from("products").update({
      name: editForm.name,
      description: editForm.description,
      price: editForm.price,
      stock: editForm.stock,
      category: editForm.category,
      account_info: editForm.account_info,
    }).eq("id", product.id);
    setSaving(false);
    if (error) {
      toast({ title: "Lỗi", description: "Không thể cập nhật sản phẩm.", variant: "destructive" });
    } else {
      setProduct({ ...product, ...editForm });
      setEditing(false);
      toast({ title: "✅ Đã cập nhật sản phẩm!" });
    }
  };

  const handleBuy = async (quantity: number = 1, discountCode?: string) => {
    if (!user) {
      toast({ title: "Vui lòng đăng nhập", variant: "destructive" });
      return;
    }
    setBuying(true);

    const { data, error } = await supabase.rpc("purchase_product_batch", {
      p_user_id: user.id,
      p_product_id: product.id,
      p_quantity: quantity,
      p_discount_code: discountCode || null,
    } as any);

    if (error) {
      setBuying(false);
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      return;
    }

    const result = data as any;
    if (!result.success) {
      setBuying(false);
      toast({ title: "❌ " + result.error, variant: "destructive" });
      return;
    }

    setBuying(false);
    toast({ title: "✅ Mua hàng thành công!", description: `Mã đơn: ${result.order_code}` });
    window.location.href = `/don-hang/${result.order_id}`;
  };

  const handleBoostBuy = async (username: string, password: string, note: string) => {
    if (!user) return;
    if (!username.trim() || !password.trim()) {
      toast({ title: "Vui lòng nhập tài khoản và mật khẩu", variant: "destructive" });
      return;
    }
    setBuying(true);
    const { data, error } = await supabase.rpc("purchase_boost" as any, {
      p_user_id: user.id, p_product_id: product.id,
      p_username: username, p_password: password, p_note: note,
    });
    setBuying(false);
    if (error) { toast({ title: "Lỗi", description: error.message, variant: "destructive" }); return; }
    const r = data as any;
    if (!r?.success) { toast({ title: "❌ " + (r?.error || "Đặt thất bại"), variant: "destructive" }); return; }
    setShowBoost(false);
    toast({ title: "✅ Đã đặt dịch vụ cày thuê!", description: `Mã đơn: ${r.order_code}. Admin sẽ xử lý sớm.` });
    navigate("/lich-su-cay-thue");
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar /><Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Không tìm thấy sản phẩm.</p>
          <Link to="/" className="inline-block px-6 py-3 gradient-primary text-primary-foreground font-semibold rounded-lg text-sm">Về trang chủ</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar /><Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại cửa hàng
        </Link>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg animate-slide-up">
          {isAdmin && !editing && (
            <div className="flex justify-end px-6 pt-4">
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg bg-muted hover:bg-border transition-colors" title="Chỉnh sửa">
                <Pencil className="w-4 h-4 text-foreground" />
              </button>
            </div>
          )}

          <div className="p-6 space-y-5">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tên sản phẩm</label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground text-sm focus:outline-none focus:border-primary transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Giá (VNĐ)</label>
                    <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                      className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground text-sm focus:outline-none focus:border-primary transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Kho hàng</label>
                    <input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                      className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground text-sm focus:outline-none focus:border-primary transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Danh mục</label>
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground text-sm focus:outline-none focus:border-primary transition-all">
                    {["Blox Fruits", "Random", "Robux", "Gamepass", "Khác"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mô tả</label>
                  <textarea value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData('text');
                      if (text && IMAGE_URL_REGEX.test(text)) {
                        e.preventDefault();
                        const textarea = e.target as HTMLTextAreaElement;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const current = editForm.description || "";
                        const newVal = current.substring(0, start) + text + current.substring(end);
                        setEditForm({ ...editForm, description: newVal });
                      }
                    }}
                    rows={3} className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground text-sm focus:outline-none focus:border-primary transition-all resize-none" />
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt("Nhập link ảnh (URL):");
                        if (url && url.trim()) {
                          const current = editForm.description || "";
                          setEditForm({ ...editForm, description: current + (current ? "\n" : "") + url.trim() });
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <ImagePlus className="w-3 h-3" /> Chèn link ảnh
                    </button>
                    <span className="text-xs text-muted-foreground">Paste link ảnh trực tiếp vào mô tả</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Thông tin tài khoản (Tk:Mk)</label>
                  <textarea value={editForm.account_info || ""} onChange={(e) => setEditForm({ ...editForm, account_info: e.target.value })}
                    rows={3} placeholder="VD: username:password" className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground text-sm font-mono focus:outline-none focus:border-primary transition-all resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                    <Save className="w-4 h-4" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                  <button onClick={() => { setEditing(false); setEditForm(product); }} className="px-5 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-semibold hover:bg-border transition-colors">
                    <X className="w-4 h-4 inline mr-1" /> Huỷ
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Title with product image icon */}
                <div className="flex items-center gap-3">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-11 h-11 rounded-lg object-cover border border-border shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <h1 className="font-display text-2xl font-extrabold text-foreground leading-tight">{product.name}</h1>
                </div>

                {/* Info pills */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-fuchsia-600 text-white text-xs font-bold shadow-sm">
                    Kho hàng: <span className="ml-1 font-extrabold">{product.product_type === "boost" ? "∞" : product.stock.toLocaleString("vi-VN")}</span>
                  </span>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-teal-500 text-white text-xs font-bold shadow-sm">
                    Đã bán: <span className="ml-1 font-extrabold">{soldCount}</span>
                  </span>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-muted text-foreground text-xs font-bold border border-border">
                    {product.category}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold border ${product.product_type === "boost" ? "bg-accent/10 text-accent border-accent/30" : product.stock > 0 ? "bg-primary/10 text-primary border-primary/30" : "bg-destructive/10 text-destructive border-destructive/30"}`}>
                    {product.product_type === "boost" ? "Nhận đơn cày thuê" : product.stock > 0 ? "Còn hàng" : "Hết hàng"}
                  </span>
                </div>

                {/* Price */}
                {user ? (
                  <div className="text-3xl font-extrabold text-primary">{formatVND(product.price)}</div>
                ) : (
                  <Link to="/dang-nhap" className="inline-block text-base text-primary hover:underline italic">Đăng nhập để xem giá</Link>
                )}

                {/* Description with images */}
                {product.description && (
                  <div className="pt-2">
                    <DescriptionWithImages text={product.description} />
                  </div>
                )}

                {product.created_at && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Ngày đăng: {new Date(product.created_at).toLocaleString("vi-VN")}
                  </p>
                )}

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {user ? (
                    product.product_type === "boost" ? (
                      <button
                        onClick={() => setShowBoost(true)}
                        disabled={buying}
                        className="w-full py-3 gradient-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                      >
                        <ShoppingCart className="w-5 h-5" /> ĐẶT CÀY THUÊ
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowConfirm(true)}
                        disabled={buying || product.stock <= 0}
                        className="w-full py-3 gradient-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        {product.stock <= 0 ? "HẾT HÀNG" : "MUA NGAY"}
                      </button>
                    )
                  ) : (
                    <Link to="/dang-nhap" className="w-full py-3 gradient-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md">
                      <ShoppingCart className="w-5 h-5" /> ĐĂNG NHẬP ĐỂ MUA
                    </Link>
                  )}
                  <Link to="/" className="w-full py-3 bg-muted text-foreground rounded-xl text-sm font-bold hover:bg-border transition-colors flex items-center justify-center gap-2 border border-border">
                    <ArrowLeft className="w-5 h-5" /> QUAY LẠI
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />

      <PurchaseConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        productName={product.name}
        price={formatVND(product.price)}
        numericPrice={product.price}
        stock={product.stock}
        onConfirm={(qty, code) => handleBuy(qty, code)}
        buying={buying}
      />

      <BoostPurchaseDialog
        open={showBoost}
        onOpenChange={setShowBoost}
        productName={product.name}
        price={formatVND(product.price)}
        onConfirm={handleBoostBuy}
        buying={buying}
      />
    </div>
  );
};


export default ProductDetail;
