import { forwardRef } from "react";
import { ProductCard } from "./ProductCard";

const Section = forwardRef(({ title, items }, ref) => {
  return (
    <section ref={ref} className="mt-8">
      <h2 className="text-xl font-bold mb-3">{title}</h2>

      {title === "Beliebt" ? (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {items.map((item) => (
            <ProductCard key={item._id} item={item} compact />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <ProductCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
});

export default Section;
