import { euro } from "../api";
import { useCart } from "../pages/CartContext";

export function ProductCard({ item, compact = false }) {
  const { addToCart } = useCart();

  if (compact) {
    return (
      <div className="relative min-w-[180px] bg-white shadow rounded-lg p-3 snap-center">
        <img
          src={item.imageUrl || "/placeholder.png"}
          alt={item.name}
          className="w-full h-28 object-cover rounded-md"
        />
        <div className="mt-2 font-medium">{item.name}</div>
        <div className="mt-1 font-semibold">{euro(item.priceCents)}</div>
        <button
          onClick={() => addToCart(item)}
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-amber-200"
        >
          <img src="/plus.png" alt="add" className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex justify-between items-center bg-white shadow rounded-lg p-4">
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
      <button
        onClick={() => addToCart(item)}
        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-amber-200"
      >
        <img src="/plus.png" alt="add" className="w-5 h-5" />
      </button>
    </div>
  );
}
