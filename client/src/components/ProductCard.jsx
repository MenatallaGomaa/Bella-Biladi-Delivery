import { euro } from "../api";

export function ProductCard({ item, compact = false, onAddToCart }) {
  if (compact) {
    // 🔹 Beliebt card
    return (
      <div className="relative min-w-[180px] bg-white shadow rounded-lg p-3 snap-center">
        <img
          src={item.imageUrl || "/placeholder.png"}
          alt={item.name}
          className="w-full h-28 object-cover rounded-md"
        />

        {/* Floating Add Button */}
        <button
          onClick={() => onAddToCart(item)}
          className="absolute top-2 right-2 bg-white rounded-full shadow p-2 hover:scale-110 transition cursor-pointer"
        >
          <img
            src="/plus.png"
            alt="Add"
            className="w-4 h-4 pointer-events-none"
          />
        </button>

        <div className="mt-2 font-medium">{item.name}</div>
        <div className="mt-1 font-semibold">{euro(item.priceCents)}</div>
      </div>
    );
  }

  // 🔹 Pizza & Pizzabrötchen (full-width card)
  return (
    <div className="relative flex justify-between items-center bg-white shadow rounded-lg p-4">
      <div>
        <div className="font-medium">{item.name}</div>
        <div className="text-sm text-gray-500">{item.description}</div>
        <div className="mt-1 font-semibold">{euro(item.priceCents)}</div>
      </div>

      {/* Product image */}
      <img
        src={item.imageUrl || "/placeholder.png"}
        alt={item.name}
        className="w-24 h-24 object-cover rounded-md"
      />

      {/* Floating Add Button (same as Beliebt) */}
      <button
        onClick={() => onAddToCart(item)}
        className="absolute top-2 right-2 bg-white rounded-full shadow p-2 hover:scale-110 transition cursor-pointer"
      >
        <img
          src="/plus.png"
          alt="Add"
          className="w-4 h-4 pointer-events-none"
        />
      </button>
    </div>
  );
}
