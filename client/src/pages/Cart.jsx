import { useState, useEffect } from "react";
import { useCart } from "./CartContext";

export default function Cart() {
  const { cart, addToCart, setCart } = useCart();
  const [deliveryMode, setDeliveryMode] = useState("Lieferung");

  // ✅ Load delivery mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("deliveryMode");
    if (savedMode) setDeliveryMode(savedMode);
  }, []);

  // ✅ Save delivery mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("deliveryMode", deliveryMode);
  }, [deliveryMode]);

  // 🧮 Calculate total
  const total = cart.reduce((sum, item) => sum + item.priceCents, 0) / 100;

  // ➕ Increase quantity
  const increase = (item) => addToCart(item);

  // ➖ Decrease quantity by name
  const decrease = (name) => {
    const idx = cart.findIndex((i) => i.name === name);
    if (idx !== -1) {
      const newCart = [...cart];
      newCart.splice(idx, 1);
      setCart(newCart);
    }
  };

  // 🗑️ Remove all of an item
  const removeAll = (name) => {
    setCart(cart.filter((i) => i.name !== name));
  };

  // 📦 Group items by name (with qty)
  const grouped = Object.values(
    cart.reduce((acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = { ...item, qty: 0 };
      }
      acc[item.name].qty++;
      return acc;
    }, {})
  );

  return (
    <div className="bg-amber-200 min-h-screen flex justify-center items-center py-10 px-4">
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-lg flex flex-col max-h-[80vh]">
        <h2 className="text-3xl font-bold text-center mb-6">Warenkorb</h2>

        {/* Liefer/Abholung Toggle */}
        <div className="flex justify-center gap-2 mb-6 shrink-0">
          <button
            onClick={() => setDeliveryMode("Lieferung")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg ${
              deliveryMode === "Lieferung"
                ? "bg-amber-300 text-black font-semibold"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            <img src="/delivery.png" alt="Lieferung" className="w-5 h-5" />
            Lieferung <span className="text-sm">15–35 min</span>
          </button>
          <button
            onClick={() => setDeliveryMode("Abholung")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg ${
              deliveryMode === "Abholung"
                ? "bg-amber-300 text-black font-semibold"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            <img src="/delivery-man.png" alt="Abholung" className="w-5 h-5" />
            Abholung <span className="text-sm">15 min</span>
          </button>
        </div>

        {/* Cart items */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-2">
          {grouped.map((item) => (
            <div
              key={item.name} // ✅ stable key so order doesn't jump
              className="flex justify-between items-center border-b pb-3"
            >
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-500">{item.description}</div>
                <div className="text-sm font-semibold">
                  {(item.priceCents / 100).toFixed(2)} €
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => removeAll(item.name)}
                  className="text-gray-500 hover:text-red-500"
                >
                  🗑️
                </button>
                <button
                  onClick={() => decrease(item.name)}
                  className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  −
                </button>
                <span className="w-6 text-center">{item.qty}</span>
                <button
                  onClick={() => increase(item)}
                  className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-6 flex justify-between items-center shrink-0">
          <div className="text-lg font-semibold">
            Zur Kasse {total.toFixed(2)} €
          </div>
          <button className="bg-amber-400 px-6 py-2 rounded-lg font-semibold hover:bg-amber-500">
            Zur Kasse
          </button>
        </div>
      </div>
    </div>
  );
}
