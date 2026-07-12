import { Search, ShoppingCart, Heart, MessageCircle, ChevronDown, LogOut, User, Shield, Globe, Coins, Package, CreditCard, Newspaper, Home, Phone, Mail, LayoutGrid, Menu, X, HelpCircle, FileText } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hotline, setHotline] = useState("0967319920");
  const [email, setEmail] = useState("support@shopkietz.com");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const topupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("shop_settings").select("key,value").in("key", ["shop_logo_url", "shop_hotline", "shop_email"]).then(({ data }) => {
      data?.forEach((r) => {
        if (r.key === "shop_logo_url" && r.value) setLogoUrl(r.value);
        if (r.key === "shop_hotline" && r.value) setHotline(r.value);
        if (r.key === "shop_email" && r.value) setEmail(r.value);
      });
    });
  }, []);

  useEffect(() => {
    if (!user) { setIsAdmin(false); setBalance(null); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").then(({ data }) => {
      setIsAdmin(!!(data && data.length > 0));
    });
    supabase.from("profiles").select("balance").eq("user_id", user.id).single().then(({ data }) => {
      setBalance(data?.balance ?? 0);
    });
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (topupRef.current && !topupRef.current.contains(e.target as Node)) setTopupOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const isTopupActive = ["/nap-tien", "/nap-the", "/nap-ngan-hang"].some(p => currentPath.startsWith(p));

  const NavPill = ({ icon: Icon, label, path, badge, active, onClick }: any) => (
    <button
      onClick={onClick || (() => navigate(path))}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
        active ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-primary/5 hover:text-primary"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {badge && (
        <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white leading-none">
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-background shadow-sm">
      {/* Top blue gradient bar */}
      <div className="brand-gradient text-white">
        <div className="container mx-auto px-4 h-11 flex items-center justify-between">
          <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium">
            <a href="/quy-dinh-nap-the" className="px-3 py-1.5 hover:bg-white/15 rounded-md transition-colors">Chính sách</a>
            <a href="/faq" className="px-3 py-1.5 hover:bg-white/15 rounded-md transition-colors">FAQ</a>
            <a href="/faq" className="px-3 py-1.5 hover:bg-white/15 rounded-md transition-colors">Liên Hệ</a>
          </nav>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-white/15 hover:bg-white/25 text-sm font-medium transition-colors">
              <Globe className="w-3.5 h-3.5" /> Vietnamese <ChevronDown className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-white/15 hover:bg-white/25 text-sm font-medium transition-colors">
              <Coins className="w-3.5 h-3.5" /> VND <ChevronDown className="w-3 h-3" />
            </button>
            <div className="[&_button]:!bg-white/15 [&_button:hover]:!bg-white/25 [&_button]:!text-white [&_button]:!border-0 [&_button]:!rounded-full [&_button]:!h-8 [&_button]:!w-8">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Middle row: logo, search, actions */}
      <div className="bg-background border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/" className="shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover shadow-md"
                onError={() => setLogoUrl(null)}
              />
            ) : (
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl brand-gradient flex items-center justify-center text-white font-display text-xl shadow-md">SK</div>
            )}
          </a>

          <form onSubmit={handleSearch} className="flex-1 hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full h-12 bg-muted/60 rounded-full pl-6 pr-14 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
              <button type="submit" aria-label="Tìm kiếm" className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full brand-gradient flex items-center justify-center hover:opacity-90">
                <Search className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => navigate("/lich-su-mua")} title="Đơn hàng" className="h-11 w-11 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors">
              <ShoppingCart className="w-5 h-5 text-foreground/70" />
            </button>
            <button onClick={() => navigate("/trang-ca-nhan")} title="Yêu thích" className="h-11 w-11 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors">
              <Heart className="w-5 h-5 text-foreground/70" />
            </button>
            <a href="https://discord.gg/shopkietz" target="_blank" rel="noopener" title="Hỗ trợ" className="h-11 w-11 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors">
              <MessageCircle className="w-5 h-5 text-foreground/70" />
            </a>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2.5 pl-1 pr-3 h-11 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
                  <div className="w-9 h-9 rounded-lg brand-gradient flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-xs font-bold text-foreground max-w-[110px] truncate uppercase">{displayName}</span>
                    <span className="text-[11px] font-semibold text-yellow-500">{(balance ?? 0).toLocaleString("vi-VN")}đ</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[220px] z-50 animate-fade-in">
                    <div className="px-4 py-2.5 border-b border-border">
                      <p className="text-sm font-semibold text-foreground">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <a href="/trang-ca-nhan" className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted"><User className="w-4 h-4" /> Trang cá nhân</a>
                    <a href="/lich-su-mua" className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted"><ShoppingCart className="w-4 h-4" /> Đơn hàng của tôi</a>
                    {isAdmin && (
                      <a href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-muted"><Shield className="w-4 h-4" /> Admin Panel</a>
                    )}
                    <div className="border-t border-border mt-1">
                      <button onClick={() => { signOut(); setUserMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-muted"><LogOut className="w-4 h-4" /> Đăng xuất</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <a href="/dang-nhap" className="flex items-center gap-2 px-4 h-11 brand-gradient rounded-xl font-semibold text-sm text-white hover:opacity-90 shadow-md">
                <User className="w-4 h-4" /><span className="hidden sm:inline">Đăng nhập</span>
              </a>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden h-11 w-11 rounded-xl border border-border bg-card flex items-center justify-center">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full h-11 bg-muted/60 rounded-full pl-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button type="submit" className="absolute right-1.5 top-1.5 h-8 w-8 rounded-full brand-gradient flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        </form>
      </div>

      {/* Bottom nav row */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <nav className={`${mobileOpen ? "flex flex-col w-full" : "hidden"} md:flex md:flex-row md:items-center gap-1`}>
            <NavPill icon={Home} label="Trang chủ" path="/" active={currentPath === "/"} />
            <NavPill icon={LayoutGrid} label="Sản phẩm" path="/?cat=all" />
            <div className="relative" ref={topupRef}>
              <button
                onClick={() => setTopupOpen(!topupOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${isTopupActive ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-primary/5 hover:text-primary"}`}
              >
                <CreditCard className="w-4 h-4" /> Nạp tiền
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white leading-none">HOT</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${topupOpen ? "rotate-180" : ""}`} />
              </button>
              {topupOpen && (
                <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[200px] z-50">
                  <button onClick={() => { navigate("/nap-ngan-hang"); setTopupOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted">
                    <CreditCard className="w-4 h-4 text-primary" /> Ngân hàng
                  </button>
                  <button onClick={() => { navigate("/nap-the"); setTopupOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted">
                    <CreditCard className="w-4 h-4 text-primary" /> Thẻ cào
                  </button>
                </div>
              )}
            </div>
            <NavPill icon={Package} label="Đơn hàng" path="/lich-su-mua" active={currentPath.startsWith("/lich-su")} />
            <NavPill icon={Newspaper} label="Blogs" path="/faq" active={currentPath === "/faq"} />
            <NavPill icon={FileText} label="Quy định" path="/quy-dinh-nap-the" active={currentPath.startsWith("/quy-dinh")} />
          </nav>

          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full brand-gradient flex items-center justify-center text-white shadow-md">
                <Phone className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hotline 24/7</div>
                <div className="text-sm font-bold text-foreground">{hotline}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full brand-gradient flex items-center justify-center text-white shadow-md">
                <Mail className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</div>
                <div className="text-sm font-bold text-foreground">{email}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
