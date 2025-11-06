import { forwardRef } from "react";
import { ProductCard } from "./ProductCard";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const Section = forwardRef(({ title, items, onAddToCart }, ref) => {
  const [sectionRef, isSectionVisible] = useScrollAnimation({ threshold: 0.1 });

  return (
    <section ref={ref} className="mt-8">
      <h2
        ref={sectionRef}
        className={`text-xl font-bold mb-3 transition-all duration-500 ease-out ${
          isSectionVisible
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-3"
        }`}
      >
        {title}
      </h2>

      {title === "Beliebt" ? (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
          {items.map((item, index) => (
            <ProductCard
              key={item._id}
              item={item}
              compact
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <ProductCard
              key={item._id}
              item={item}
              onAddToCart={onAddToCart}
              delay={index * 30}
            />
          ))}
        </div>
      )}
    </section>
  );
});

export default Section;
