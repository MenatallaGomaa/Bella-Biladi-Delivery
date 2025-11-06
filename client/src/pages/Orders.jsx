import { useEffect, useState } from "react";
import { euro } from "../api";
import { useAuth } from "./AuthContext";

export default function Orders({ onNavigate }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  // Redirect admin users to Admin Dashboard instead of showing order history
  useEffect(() => {
    if (user?.role === "admin") {
      onNavigate("Admin");
      return;
    }
  }, [user, onNavigate]);

  useEffect(() => {
    // Don't fetch orders if user is admin (will be redirected)
    if (user?.role === "admin") return;
    
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:10000"}/api/orders/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]));
  }, [user]);

  return (
    <div className="bg-amber-200 flex flex-col items-center py-4 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-4">
        <h1 className="text-lg sm:text-xl font-bold mb-3">Meine Bestellungen</h1>

        {orders.length === 0 ? (
          <div className="text-gray-600 text-center py-6 text-sm">
            Du hast noch keine Bestellungen gemacht.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, idx) => (
              <div
                key={order._id || idx}
                className="border border-gray-200 rounded-lg p-3 shadow-sm bg-gray-50"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-sm sm:text-base">
                    {order.ref || `Bestellung #${orders.length - idx}`}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(order.createdAt || Date.now()).toLocaleString("de-DE")}
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-gray-700 space-y-1">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {item.qty}× {item.name}
                      </span>
                      <span>{euro(item.priceCents * item.qty)}</span>
                    </div>
                  ))}
                </div>

                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-sm">
                  <span>Gesamt</span>
                  <span>{euro(order?.totals?.grandTotalCents || 0)}</span>
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  Status: {order.status}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => onNavigate("Home")}
          className="mt-4 w-full bg-amber-400 hover:bg-amber-500 py-2 px-4 rounded-lg font-medium text-sm"
        >
          Zurück zur Startseite
        </button>
      </div>
    </div>
  );
}
