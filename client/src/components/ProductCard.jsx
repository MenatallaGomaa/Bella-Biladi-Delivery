import { euro } from "../api";

export function ProductCard({ item, compact = false }) {
  if (compact) {
    // 🔹 For Beliebt (small square card)
    return (
      <div className="min-w-[180px] bg-white shadow rounded-lg p-3 snap-center">
        <img
          src={item.imageUrl || "/placeholder.png"}
          alt={item.name}
          className="w-full h-28 object-cover rounded-md"
        />
        <div className="mt-2 font-medium">{item.name}</div>
        <div className="mt-1 font-semibold">{euro(item.priceCents)}</div>
      </div>
    );
  }

  // 🔹 For Pizza, Pizzabrötchen (full width card)
  return (
    <div className="flex justify-between items-center bg-white shadow rounded-lg p-4">
      <div>
        <div className="font-medium">{item.name}</div>
        <div className="text-sm text-gray-500">{item.description}</div>
        <div className="mt-1 font-semibold">{euro(item.priceCents)}</div>
      </div>
      <img
        src={item.imageUrl || "/placeholder.png"}
        alt={item.name}
        className="w-24 h-24 object-cover rounded-md"
      />
    </div>
  );
}
