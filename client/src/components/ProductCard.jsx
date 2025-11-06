import { useState } from "react";
import { euro } from "../api";
import { useCart } from "../pages/CartContext";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

export function ProductCard({ item, compact = false, delay = 0 }) {
  const { addToCart } = useCart();
  const [ref, isVisible] = useScrollAnimation({ threshold: 0.1 });
  const [imageError, setImageError] = useState(false);
  const imageSrc = imageError || !item.imageUrl ? "/main.jpeg" : item.imageUrl;

  const handleImageError = () => {
    setImageError(true);
  };

  if (compact) {
    return (
      <div
        ref={ref}
        className={`relative min-w-[180px] bg-white shadow rounded-lg p-3 snap-center transition-all duration-500 ease-out ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <img
          src={imageSrc}
          alt={item.name}
          className="w-full h-28 object-cover rounded-md"
          onError={handleImageError}
        />
        <div className="mt-2 font-medium">{item.name}</div>
        <div className="mt-1 font-semibold">{euro(item.priceCents)}</div>
        <button
          onClick={() => addToCart(item)}
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-amber-200 transition-colors"
        >
          <img src="/plus.png" alt="add" className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`relative flex flex-col sm:flex-row sm:items-center gap-4 bg-white shadow rounded-lg p-4 h-full transition-all duration-500 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex-1">
        <div className="font-medium text-base sm:text-lg">{item.name}</div>
        <div className="text-sm text-gray-500 mt-1 leading-relaxed max-h-16 overflow-hidden">
          {item.description}
        </div>
        <div className="mt-2 font-semibold text-lg text-amber-600">
          {euro(item.priceCents)}
        </div>
      </div>
      <img
        src={imageSrc}
        alt={item.name}
        className="w-full sm:w-28 h-36 sm:h-28 object-cover rounded-xl border border-amber-100"
        onError={handleImageError}
      />
      <button
        onClick={() => addToCart(item)}
        className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow hover:bg-amber-200 transition-colors"
      >
        <img src="/plus.png" alt="add" className="w-5 h-5" />
      </button>
    </div>
  );
}
