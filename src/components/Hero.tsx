import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Zap, Headphones } from "lucide-react";

const badges = [
  { icon: ShieldCheck, label: "Bảo hành 1-1 trong 24h" },
  { icon: Zap, label: "Giao tài khoản tự động 24/7" },
  { icon: Headphones, label: "Hỗ trợ Zalo / Facebook" },
];

const Hero = () => {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card">
      <div className="absolute inset-0 hero-aurora" aria-hidden="true" />
      <div className="absolute inset-0 hero-grid-lines" aria-hidden="true" />

      <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:py-20 max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
          <Zap className="w-3.5 h-3.5" /> SHOPKIETZ — GIAN HÀNG SỐ UY TÍN
        </span>

        <h1 className="mt-4 font-display text-3xl sm:text-5xl lg:text-6xl leading-tight text-foreground">
          Tài khoản game &amp; dịch vụ số{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--brand-gradient)" }}>
            giá tốt nhất
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-xl">
          Mua acc Blox Fruits, Robux, cày thuê và nhiều dịch vụ khác. Thanh toán tự động, nhận hàng tức thì,
          bảo hành rõ ràng.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href="#danh-muc"
            className="inline-flex items-center gap-2 rounded-xl galaxy-button px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Khám phá sản phẩm <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            to="/nap-the"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/50 px-6 py-3 text-sm font-bold text-foreground backdrop-blur transition-colors hover:border-primary/60 hover:text-primary"
          >
            Nạp tiền ngay
          </Link>
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          {badges.map((b) => (
            <li key={b.label} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <b.icon className="w-4 h-4 text-primary" />
              {b.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Hero;
