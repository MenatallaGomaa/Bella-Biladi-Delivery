import { useEffect, useState } from "react";

export default function Orders({ onNavigate }) {
  const [orders, setOrders] = useState([]);

  // Load orders from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("orders") || "[]");
    setOrders(saved);
  }, []);

  return (
    <div className="min-h-screen bg-amber-200 flex flex-col items-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Meine Bestellungen</h1>

        {orders.length === 0 ? (
          <div className="text-gray-600 text-center py-10">
            Du hast noch keine Bestellungen gemacht.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-xl p-4 shadow-sm bg-gray-50"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">
                    Bestellung #{idx + 1}
                  </h3>
                  <span className="text-sm text-gray-500">{order.date}</span>
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {item.qty}× {item.name}
                      </span>
                      <span>{item.price.toFixed(2)} €</span>
                    </div>
                  ))}
                </div>

                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Gesamt</span>
                  <span>{order.total.toFixed(2)} €</span>
                </div>

                <div className="text-sm text-gray-500 mt-1">
                  Lieferzeit: {order.time}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => onNavigate("Home")}
          className="mt-6 bg-amber-400 hover:bg-amber-500 py-2 px-4 rounded-lg font-medium"
        >
          Zurück zur Startseite
        </button>
      </div>
    </div>
  );
}
