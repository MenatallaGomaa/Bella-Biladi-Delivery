import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { euro } from "../api";
import { useAuth } from "./AuthContext";
import { translateStatus } from "../utils/statusTranslations";
import DriverMap from "../components/DriverMap";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:10000").replace(/\/+$/, "");

export default function Orders({ onNavigate }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const socketRef = useRef(null);

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
    
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orders/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const ordersList = Array.isArray(data) ? data : [];
        // Remove duplicates based on _id to fix React key warnings
        const uniqueOrders = ordersList.filter((order, index, self) =>
          index === self.findIndex((o) => o._id === order._id)
        );
        setOrders(uniqueOrders);
        
        // Join WebSocket rooms for all orders after they're loaded
        if (socketRef.current?.connected) {
          uniqueOrders.forEach((order) => {
            socketRef.current.emit("join-order-room", order._id);
          });
        }
      } catch (err) {
        setOrders([]);
      }
    };

    // Set up WebSocket connection for real-time updates
    if (!socketRef.current) {
      socketRef.current = io(API_BASE, {
        transports: ["websocket", "polling"],
      });

      socketRef.current.on("connect", () => {
        console.log("✅ WebSocket connected for order updates");
        // Join rooms for existing orders when connected
        setOrders((currentOrders) => {
          currentOrders.forEach((order) => {
            socketRef.current.emit("join-order-room", order._id);
          });
          return currentOrders;
        });
      });

      socketRef.current.on("order-status-updated", (data) => {
        console.log("📦 Order status updated via WebSocket:", data);
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === data.orderId
              ? { ...order, status: data.status, ...data.order }
              : order
          )
        );
      });

      socketRef.current.on("disconnect", () => {
        console.log("🔌 WebSocket disconnected");
      });
    }

    // Fetch orders
    fetchOrders();

    return () => {
      // Cleanup on unmount
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
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
                onClick={() => setSelectedOrderId(order._id)}
                className="border border-gray-200 rounded-lg p-3 shadow-sm bg-gray-50 cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all"
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
                  Status: {translateStatus(order.status)}
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

      {/* Order Details Modal */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          order={orders.find((o) => o._id === selectedOrderId)}
          onClose={() => setSelectedOrderId(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

// Order Details Modal Component
function OrderDetailsModal({ orderId, order, onClose, onNavigate }) {
  const { user } = useAuth();
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!order || !orderId) {
      setLoading(false);
      return;
    }

    // Always fetch driver location (will show restaurant location if not available)
    const fetchDriverLocation = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Fetch driver location for this order
        // Note: 404 is expected when no driver is assigned, so we handle it silently
        const res = await fetch(`${API_BASE}/api/orders/${orderId}/driver-location`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setDriverLocation(data);
        } else if (res.status === 404) {
          // No driver assigned yet - will show restaurant location as default
          // This is expected behavior, silently handle it
          setDriverLocation(null);
        } else {
          // Only log unexpected errors (not 404)
          console.warn("Driver location fetch returned:", res.status, res.statusText);
          setDriverLocation(null);
        }
      } catch (err) {
        // Network errors or other exceptions - only log if not a 404-related error
        if (!err.message?.includes('404')) {
          console.warn("Error fetching driver location:", err.message);
        }
        setDriverLocation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverLocation();

    // Set up WebSocket for real-time driver location updates
    if (!socketRef.current) {
      socketRef.current = io(API_BASE, {
        transports: ["websocket", "polling"],
      });

      socketRef.current.on("connect", () => {
        console.log("✅ WebSocket connected for driver location");
        socketRef.current.emit("join-order-room", orderId);
      });

      socketRef.current.on("driver-location-updated", (data) => {
        console.log("🚴 Driver location updated via WebSocket:", data);
        setDriverLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          lastUpdated: data.lastUpdated,
          driverName: data.driverName,
        });
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-order-room", orderId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [orderId, order]);

  if (!order) return null;

  // Order status stages
  const statusStages = [
    { key: "new", label: "Neu", icon: "📋" },
    { key: "accepted", label: "Akzeptiert", icon: "✅" },
    { key: "preparing", label: "In Bearbeitung", icon: "👨‍🍳" },
    { key: "on_the_way", label: "Unterwegs", icon: "🚴" },
    { key: "delivered", label: "Geliefert", icon: "🎉" },
  ];

  const getCurrentStageIndex = () => {
    return statusStages.findIndex((s) => s.key === order.status);
  };

  const currentStageIndex = getCurrentStageIndex();

  return (
    <div className="fixed inset-0 bg-amber-200 bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center z-10">
          <h2 className="text-lg font-bold">Bestelldetails</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Order Status Tracking */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-center mb-3">
              <p className="text-sm text-gray-600 font-medium">
                {order.status === "new" && "Bestellung erhalten"}
                {order.status === "accepted" && "Bestellung bestätigt"}
                {order.status === "preparing" && "Bestellung wird vorbereitet"}
                {order.status === "on_the_way" && "Unterwegs zu Ihnen"}
                {order.status === "delivered" && "Geliefert"}
                {order.status === "canceled" && "Storniert"}
              </p>
              {order.status === "on_the_way" && (
                <p className="text-xs text-gray-500 mt-1">Ankunft: in Kürze</p>
              )}
            </div>
            
            {/* Status Stages */}
            <div className="flex items-start justify-between mb-4 gap-1">
              {statusStages.slice(0, 4).map((stage, index) => {
                const isCompleted = index <= currentStageIndex;
                const isCurrent = index === currentStageIndex;
                
                return (
                  <div key={stage.key} className="flex flex-col items-center flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                        isCompleted
                          ? "bg-teal-500 text-white"
                          : "bg-gray-200 text-gray-400"
                      } ${isCurrent ? "ring-2 ring-teal-300 ring-offset-2" : ""}`}
                    >
                      {isCompleted ? "✓" : stage.icon}
                    </div>
                    <span
                      className={`text-xs mt-1 text-center whitespace-nowrap ${
                        isCompleted ? "text-teal-600 font-medium" : "text-gray-400"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map - Always visible */}
          <div className="rounded-xl overflow-hidden bg-gray-100" style={{ height: "300px", minHeight: "300px" }}>
            {loading ? (
              <div className="h-full bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Lade Karte...</p>
              </div>
            ) : (
              <DriverMap
                driverLocation={driverLocation}
                customerAddress={order.customer?.address}
                orderId={orderId}
                height="300px"
              />
            )}
          </div>

          {/* Order Info Card */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-base">{order.ref}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(order.createdAt || Date.now()).toLocaleString("de-DE")}
                </p>
              </div>
              <span className="text-lg font-bold text-teal-600">
                {euro(order?.totals?.grandTotalCents || 0)}
              </span>
            </div>

            {/* Items */}
            <div className="border-t pt-3">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">Artikel:</h4>
              <div className="space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {item.qty}× {item.name}
                    </span>
                    <span className="font-medium">{euro(item.priceCents * item.qty)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Address */}
            {order.customer && (
              <div className="border-t pt-3">
                <h4 className="text-xs font-semibold text-gray-600 mb-1">Lieferadresse:</h4>
                <div className="text-sm text-gray-700">
                  <p className="font-medium">{order.customer.name}</p>
                  <p>{order.customer.address}</p>
                  <p className="text-xs text-gray-500 mt-1">{order.customer.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {order.status !== "delivered" && order.status !== "canceled" && (
            <div className="flex gap-3">
              <a
                href="tel:+4915213274837"
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
              >
                Restaurant anrufen
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

