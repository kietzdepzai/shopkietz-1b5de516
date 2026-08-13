const ProductCardSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden animate-fade-in-up"
        style={{ animationDelay: `${i * 60}ms` }}
      >
        <div className="aspect-square w-full shimmer" />
        <div className="p-3 space-y-2.5">
          <div className="h-4 w-4/5 rounded-md shimmer" />
          <div className="h-3 w-2/3 rounded-md shimmer" />
          <div className="flex gap-1.5">
            <div className="h-5 w-16 rounded-md shimmer" />
            <div className="h-5 w-12 rounded-md shimmer" />
          </div>
          <div className="h-5 w-1/2 rounded-md shimmer" />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="h-9 rounded-lg shimmer" />
            <div className="h-9 rounded-lg shimmer" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default ProductCardSkeleton;
