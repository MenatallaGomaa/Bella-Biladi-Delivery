import { useState, useEffect, useMemo } from "react";
import { useCart } from "./CartContext";
import { useAuth } from "./AuthContext";

export default function Cart({ onNavigate }) {
  const { cart, addToCart, removeOneFromCart, removeAllFromCart } = useCart();
  const { user } = useAuth(); // ✅ get user
  const [deliveryMode, setDeliveryMode] = useState("Lieferung");

  const total = cart.reduce((sum, item) => sum + item.priceCents, 0) / 100;

  const increase = (item) => addToCart(item);

  const decrease = (itemName) => {
    removeOneFromCart(itemName);
  };

  const removeAll = (name) => {
    removeAllFromCart(name);
  };

  // Group items while preserving the order of first appearance
  const grouped = useMemo(() => {
    const map = new Map();
    const order = [];
    
    cart.forEach((item) => {
      if (!map.has(item.name)) {
        map.set(item.name, { ...item, qty: 0 });
        order.push(item.name);
      }
      map.get(item.name).qty++;
    });
    
    // Return items in the order they first appeared
    return order.map(name => map.get(name));
  }, [cart]);

  // Prevent page scroll (keep fixed height)
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  // Handle checkout button click
  const handleCheckout = () => {
    if (user) {
      // already logged in → go directly to payment
      onNavigate("CheckoutPayment");
    } else {
      // not logged in → remember destination and go to login
      localStorage.setItem("redirectAfterLogin", "CheckoutPayment");
      onNavigate("CheckoutLogin");
    }
  };

  return (
    <div
      className="
        bg-amber-200
        min-h-screen
        px-4 py-6
        md:py-12
        flex justify-center
        items-start md:items-center
      "
    >
      <div
        className="
          bg-white 
          w-full 
          max-w-3xl
          rounded-2xl
          shadow-md 
          p-6 sm:p-8 
          flex flex-col 
          justify-between
          min-h-[450px] sm:min-h-[520px]
          transition-all duration-300
        "
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={() => onNavigate("Home")}
            className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700"
          >
            ← Zurück
          </button>
          <h2 className="text-2xl sm:text-3xl font-bold text-center flex-1">
            Warenkorb
          </h2>
          <div className="w-16" aria-hidden="true"></div>
        </div>

        {/* Delivery / Pickup toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setDeliveryMode("Lieferung")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg ${
              deliveryMode === "Lieferung"
                ? "bg-amber-300 text-black font-semibold"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <img
                src="/delivery.png"
                alt="Lieferung"
                className="w-5 h-5"
              />
              <span>Lieferung</span>
            </div>
            <span className="text-xs">15–35 min</span>
          </button>

          <button
            onClick={() => setDeliveryMode("Abholung")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg ${
              deliveryMode === "Abholung"
                ? "bg-amber-300 text-black font-semibold"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <img
                src="/delivery-man.png"
                alt="Abholung"
                className="w-5 h-5"
              />
              <span>Abholung</span>
            </div>
            <span className="text-xs">15 min</span>
          </button>
        </div>

        {/* Cart items list */}
        <div
          className="
            flex-1 
            space-y-4 
            overflow-y-auto 
            max-h-[45vh] 
            sm:max-h-[50vh] 
            pr-1
          "
        >
          {grouped.length > 0 ? (
            grouped.map((item) => (
              <div
                key={item.name}
                className="flex justify-between items-center border-b pb-3"
              >
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    {item.description}
                  </div>
                  {item.customizations && (
                    <div className="mt-1 space-y-1 text-xs text-gray-500">
                      {item.customizations.dip && (
                        <div>Dip: {item.customizations.dip}</div>
                      )}
                      {item.customizations.cheese && (
                        <div>Käse: {item.customizations.cheese}</div>
                      )}
                      {item.customizations.extras?.length > 0 && (
                        <div>
                          Extras: {" "}
                          {item.customizations.extras
                            .map((extra) => extra.label)
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  )}
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
            ))
          ) : (
            <div className="text-center text-gray-500 py-10">
              Dein Warenkorb ist leer 🛒
            </div>
          )}
        </div>

        {/* Checkout row */}
        {grouped.length > 0 && (
          <div className="mt-6 flex justify-between items-center border-t pt-4">
            <div className="text-lg font-semibold">
              Zur Kasse {total.toFixed(2)} €
            </div>
            <button
              onClick={handleCheckout} // uses logic above
              className="bg-amber-400 px-6 py-2 rounded-lg font-semibold hover:bg-amber-500"
            >
              Zur Kasse
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
