import { ProductCard } from "./ProductCard";

export default function Section({ title, items }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold mb-3">{title}</h2>

      <div className="relative">
        {/* Horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {items.map((item) => (
            <ProductCard key={item._id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
