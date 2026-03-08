import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  status: string;
};

const categories = ["Blox Fruits", "Random", "Robux", "Gamepass", "Khác"];

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: 0, stock: 0, category: "Blox Fruits", status: "active" });

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const resetForm = () => {
    setForm({ name: "", description: "", price: 0, stock: 0, category: "Blox Fruits", status: "active" });
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name) return;
    if (editing) {
      await supabase.from("products").update(form).eq("id", editing.id);
    } else {
      await supabase.from("products").insert(form);
    }
    resetForm();
    fetchProducts();
  };

  const handleEdit = (p: Product) => {
    setForm({ name: p.name, description: p.description || "", price: p.price, stock: p.stock, category: p.category, status: p.status });
    setEditing(p);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xoá sản phẩm này?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-primary neon-text">QUẢN LÝ SẢN PHẨM</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Thêm sản phẩm
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 neon-card animate-slide-up space-y-4">
          <h2 className="font-bold text-foreground">{editing ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Tên sản phẩm</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground focus:outline-none focus:border-primary focus:neon-border transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Danh mục</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all text-sm"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Giá (VNĐ)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground focus:outline-none focus:border-primary focus:neon-border transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Kho hàng</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground focus:outline-none focus:border-primary focus:neon-border transition-all text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full bg-muted border border-border rounded-lg py-2.5 px-4 text-foreground focus:outline-none focus:border-primary focus:neon-border transition-all text-sm resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-6 py-2.5 gradient-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              {editing ? "Cập nhật" : "Thêm"}
            </button>
            <button onClick={resetForm} className="px-6 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-semibold hover:bg-border transition-colors">
              Huỷ
            </button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden neon-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-foreground">Tên</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Danh mục</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Giá</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Kho</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Đang tải...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Chưa có sản phẩm</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium max-w-[250px] truncate">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-3 text-primary font-mono font-bold">{formatVND(p.price)}</td>
                    <td className="px-4 py-3 text-foreground">{p.stock}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(p)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-muted transition-colors text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
