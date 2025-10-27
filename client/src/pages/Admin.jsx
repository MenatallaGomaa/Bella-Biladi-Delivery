import { useEffect, useMemo, useState } from "react";

export default function Admin({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const token = localStorage.getItem("token");

  const canAccess = useMemo(() => {
    try {
      const payload = JSON.parse(atob((token || "").split(".")[1] || "e30="));
      return payload?.role === "admin";
    } catch {
      return false;
    }
  }, [token]);

  useEffect(() => {
    if (!token || !canAccess) return;
    const url = new URL(`${import.meta.env.VITE_API_BASE || "http://localhost:4000"}/api/orders`);
    if (status) url.searchParams.set("status", status);
    fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]));
  }, [status, token, canAccess]);

  const updateStatus = async (id, newStatus) => {
    if (!token) return;
    await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:4000"}/api/orders/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    // refresh
    const url = new URL(`${import.meta.env.VITE_API_BASE || "http://localhost:4000"}/api/orders`);
    if (status) url.searchParams.set("status", status);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-amber-200 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <div className="font-semibold mb-2">Kein Zugriff</div>
          <div className="text-sm text-gray-600">Nur für Administratoren.</div>
          <button className="mt-4 text-blue-600 underline" onClick={() => onNavigate("Home")}>
            Zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-200 p-6 flex justify-center">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Alle Status</option>
            <option value="new">neu</option>
            <option value="accepted">akzeptiert</option>
            <option value="preparing">in Bearbeitung</option>
            <option value="on_the_way">unterwegs</option>
            <option value="delivered">geliefert</option>
            <option value="canceled">storniert</option>
          </select>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{order.ref}</div>
                <div className="text-sm text-gray-600">
                  {new Date(order.createdAt).toLocaleString("de-DE")}
                </div>
              </div>
              <div className="text-sm text-gray-700 mt-2">
                {order.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {i.qty}× {i.name}
                    </span>
                    <span>{(i.priceCents * i.qty / 100).toFixed(2)} €</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm">Status:</span>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="new">neu</option>
                  <option value="accepted">akzeptiert</option>
                  <option value="preparing">in Bearbeitung</option>
                  <option value="on_the_way">unterwegs</option>
                  <option value="delivered">geliefert</option>
                  <option value="canceled">storniert</option>
                </select>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-gray-600 text-sm">Keine Bestellungen gefunden.</div>
          )}
        </div>
      </div>
    </div>
  );
}
