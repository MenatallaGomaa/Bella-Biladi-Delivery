import { useState, useEffect, useMemo, useRef } from "react";
import { useCart } from "../pages/CartContext";
import { useAuth } from "../pages/AuthContext";

export default function FixedCart({ onNavigate }) {
  const { cart, addToCart, removeOneFromCart, removeAllFromCart, lastAdded } = useCart();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState("Lieferung");
  const hasAutoExpandedRef = useRef(false);

  // Auto-expand only the FIRST time an item is added
  useEffect(() => {
    if (lastAdded && cart.length === 1 && !hasAutoExpandedRef.current) {
      setIsExpanded(true);
      hasAutoExpandedRef.current = true;
    }
  }, [lastAdded, cart.length]);

  // Reset the flag when cart becomes empty
  useEffect(() => {
    if (cart.length === 0) {
      hasAutoExpandedRef.current = false;
      setIsExpanded(false);
    }
  }, [cart.length]);

  const total = cart.reduce((sum, item) => sum + item.priceCents, 0) / 100;

  const increase = (item) => addToCart(item);
  const decrease = (itemName) => removeOneFromCart(itemName);
  const removeAll = (name) => removeAllFromCart(name);

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
    
    return order.map(name => map.get(name));
  }, [cart]);

  const handleCheckout = () => {
    if (user) {
      onNavigate("CheckoutPayment");
    } else {
      localStorage.setItem("redirectAfterLogin", "CheckoutPayment");
      onNavigate("CheckoutLogin");
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-amber-400 shadow-2xl transition-all duration-300 ${
        isExpanded ? "h-[70vh] sm:h-[60vh]" : "h-16"
      }`}
    >
        {/* Cart Header - Always Visible */}
        <div
          className="flex items-center justify-between px-4 py-3 bg-amber-200 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
        <div className="flex items-center gap-3">
          <img
            src="/shopping-bag.png"
            alt="Warenkorb"
            className="h-6 w-6"
          />
          <div>
            <div className="font-semibold text-lg">Warenkorb</div>
            <div className="text-sm text-gray-600">
              {cart.length} {cart.length === 1 ? "Artikel" : "Artikel"} • {total.toFixed(2)} €
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <span className="bg-amber-500 text-white text-sm font-bold rounded-full px-2.5 py-1 min-w-[2rem] text-center">
              {cart.length}
            </span>
          )}
          <button
            className="text-2xl font-bold text-gray-600 hover:text-gray-800"
            aria-label={isExpanded ? "Warenkorb schließen" : "Warenkorb öffnen"}
          >
            {isExpanded ? "−" : "+"}
          </button>
        </div>
      </div>

      {/* Cart Content - Expandable */}
      {isExpanded && (
        <div className="flex flex-col h-[calc(100%-4rem)] overflow-hidden">
          {/* Delivery / Pickup toggle */}
          <div className="flex justify-center gap-2 px-4 py-3 border-b bg-white">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeliveryMode("Lieferung");
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                setDeliveryMode("Abholung");
              }}
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
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {grouped.length > 0 ? (
              grouped.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between items-start border-b pb-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex-1">
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
                    <div className="text-sm font-semibold mt-1">
                      {(item.priceCents / 100).toFixed(2)} €
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => removeAll(item.name)}
                      className="text-gray-500 hover:text-red-500 text-lg"
                      aria-label="Alle entfernen"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={() => decrease(item.name)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                      aria-label="Verringern"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold">{item.qty}</span>
                    <button
                      onClick={() => increase(item)}
                      className="w-8 h-8 rounded-full bg-amber-400 hover:bg-amber-500 flex items-center justify-center font-bold"
                      aria-label="Erhöhen"
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

          {/* Checkout button */}
          {grouped.length > 0 && (
            <div
              className="px-4 py-3 border-t bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCheckout}
                className="w-full bg-amber-400 px-6 py-3 rounded-lg font-semibold hover:bg-amber-500 text-lg"
              >
                Zur Kasse ({total.toFixed(2)} €)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

