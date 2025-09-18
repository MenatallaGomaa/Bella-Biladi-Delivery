import { euro } from "../api";

export function ProductCard({ item }) {
  return (
    <div className="min-w-[180px] bg-white shadow rounded-lg p-3 snap-center">
      <img
        src={item.imageUrl || "/placeholder.png"}
        alt={item.name}
        className="w-full h-28 object-cover rounded-md"
      />
      <div className="mt-2 font-medium">{item.name}</div>
      <div className="text-sm text-gray-500">{item.description}</div>
      <div className="mt-1 font-semibold">{euro(item.priceCents)}</div>
      <button className="mt-2 w-full bg-amber-400 text-black py-1 rounded">
        +
      </button>
    </div>
  );
}
