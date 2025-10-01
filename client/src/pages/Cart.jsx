import { useCart } from "./CartContext";
import { euro } from "../api";

export default function Cart() {
  const { cart, removeFromCart } = useCart();

  if (cart.length === 0) {
    return <div className="p-6 text-gray-600">Your cart is empty 🛒</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
      <div className="space-y-3">
        {cart.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center bg-white p-4 shadow rounded"
          >
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">
                {euro(item.priceCents)}
              </div>
            </div>
            <button
              onClick={() => removeFromCart(idx)}
              className="text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
