import { Swords } from "lucide-react";
import ProductCard from "./ProductCard";

interface Product {
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


interface ProductSectionProps {
  title: string;
  products: Product[];
  imageUrl?: string;
}

const ProductSection = ({ title, products, imageUrl }: ProductSectionProps) => {
  return (
    <div>
      <div className="gradient-primary rounded-xl px-5 py-3 flex items-center gap-3 mb-4">
        {imageUrl ? (
          <div className="w-8 h-8 rounded-md bg-white/90 flex items-center justify-center overflow-hidden shrink-0">
            <img src={imageUrl} alt={title} className="w-full h-full object-contain" />
          </div>
        ) : (
          <Swords className="w-5 h-5 text-primary-foreground" />
        )}
        <h2 className="font-display text-lg font-bold text-primary-foreground tracking-wide">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product, i) => (
          <ProductCard key={product.id || i} {...product} />
        ))}
      </div>
    </div>
  );
};

export default ProductSection;
