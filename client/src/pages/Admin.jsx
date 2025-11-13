import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { translateStatus } from "../utils/statusTranslations";
import DriverMap from "../components/DriverMap";

// Normalize API base URL - remove trailing slash to avoid double slashes
const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:10000").replace(/\/+$/, "");

export default function Admin({ onNavigate }) {
  const { user, refreshProfile } = useAuth();
  const token = localStorage.getItem("token");

  // Refresh profile on mount to ensure we have the latest role
  useEffect(() => {
    if (token && refreshProfile) {
      refreshProfile();
    }
  }, [token, refreshProfile]);

  const canAccess = useMemo(() => {
    if (!token) {
      console.log("❌ No token found");
      return false;
    }
    
    // Check AuthContext user first
    if (user?.role === "admin") {
      console.log("✅ Admin access granted via user.role");
      return true;
    }
    
    // Check JWT token payload
    try {
      const payload = JSON.parse(atob((token || "").split(".")[1] || "e30="));
      if (payload?.role === "admin") {
        console.log("✅ Admin access granted via token payload");
        return true;
      }
      console.log("❌ Admin access denied. User role:", user?.role, "Token role:", payload?.role);
      console.log("💡 Tip: If you just updated your role to admin, please log out and log back in to get a fresh token.");
    } catch (err) {
      console.error("❌ Error parsing token:", err);
    }
    
    return false;
  }, [token, user]);

  const [activeTab, setActiveTab] = useState("orders");

  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [newOrderPopup, setNewOrderPopup] = useState(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);
  const [lastOrderCheck, setLastOrderCheck] = useState(Date.now());

  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState("");
  const [itemFeedback, setItemFeedback] = useState("");
  const [itemSaving, setItemSaving] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
  });
  const [itemSearch, setItemSearch] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driversError, setDriversError] = useState("");

  useEffect(() => {
    if (!itemFeedback) return;
    const timeout = setTimeout(() => setItemFeedback(""), 4000);
    return () => clearTimeout(timeout);
  }, [itemFeedback]);

  const headers = useMemo(() => {
    const base = { "Content-Type": "application/json" };
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const fetchOrders = useCallback(async (checkForNew = false) => {
    if (!token || !canAccess) return;
    try {
      if (!checkForNew) setOrdersLoading(true);
      setOrdersError("");
      const url = new URL(`${API_BASE}/api/orders`);
      if (status) url.searchParams.set("status", status);
      const res = await fetch(url.toString(), { headers });
      if (!res.ok) throw new Error("Bestellungen konnten nicht geladen werden");
      const data = await res.json();
      const ordersList = Array.isArray(data) ? data : [];
      
      // Check for new orders if polling
      if (checkForNew) {
        setOrders((prevOrders) => {
          if (prevOrders.length > 0) {
            const newOrders = ordersList.filter(
              (order) => 
                order.status === "new" && 
                !prevOrders.find((o) => o._id === order._id)
            );
            if (newOrders.length > 0) {
              // Show popup for the first new order (check if popup is not already showing)
              setNewOrderPopup((currentPopup) => {
                if (!currentPopup) {
                  return newOrders[0];
                }
                return currentPopup;
              });
            }
          }
          return ordersList;
        });
      } else {
        setOrders(ordersList);
      }
      
      setLastOrderCheck(Date.now());
    } catch (err) {
      setOrdersError(err.message);
      if (!checkForNew) setOrders([]);
    } finally {
      if (!checkForNew) setOrdersLoading(false);
    }
  }, [token, canAccess, status, headers]);

  const fetchItems = useCallback(async () => {
    if (!token || !canAccess) return;
    try {
      setItemsLoading(true);
      setItemsError("");
      const res = await fetch(`${API_BASE}/api/items`);
      if (!res.ok) throw new Error("Artikel konnten nicht geladen werden");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setItemsError(err.message);
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, [token, canAccess]);

  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return items;
    const query = itemSearch.trim().toLowerCase();
    return items.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(query);
      const categoryMatch = item.category?.toLowerCase().includes(query);
      const descriptionMatch = item.description?.toLowerCase().includes(query);
      return nameMatch || categoryMatch || descriptionMatch;
    });
  }, [items, itemSearch]);

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  // Poll for new orders every 5 seconds when on orders tab
  useEffect(() => {
    if (!canAccess || activeTab !== "orders") return;
    
    const interval = setInterval(() => {
      fetchOrders(true); // Check for new orders
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [canAccess, activeTab, fetchOrders]);

  useEffect(() => {
    if (activeTab === "items") {
      fetchItems();
    }
  }, [activeTab, fetchItems]);

  const fetchDrivers = useCallback(async () => {
    if (!token || !canAccess) return;
    try {
      setDriversLoading(true);
      setDriversError("");
      const res = await fetch(`${API_BASE}/api/drivers`, { headers });
      if (!res.ok) throw new Error("Fahrer konnten nicht geladen werden");
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      setDriversError(err.message);
      setDrivers([]);
    } finally {
      setDriversLoading(false);
    }
  }, [token, canAccess, headers]);

  useEffect(() => {
    if (activeTab === "drivers") {
      fetchDrivers();
      // Poll for driver location updates every 5 seconds
      const interval = setInterval(() => {
        fetchDrivers();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchDrivers]);

  const updateOrderStatus = async (id, newStatus) => {
    if (!token) return;
    await fetch(`${API_BASE}/api/orders/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: newStatus }),
    });
    fetchOrders();
  };

  const confirmOrder = async (orderId) => {
    if (!token) return;
    try {
      setConfirmingOrderId(orderId);
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/confirm`, {
        method: "POST",
        headers,
      });
      if (!res.ok) throw new Error("Bestätigung fehlgeschlagen");
      const data = await res.json();
      
      // Close popup and refresh orders
      setNewOrderPopup(null);
      fetchOrders();
      
      // Show success message
      alert("Bestellung bestätigt! Der Kunde hat eine Bestätigungs-E-Mail erhalten.");
    } catch (err) {
      alert(`Fehler: ${err.message}`);
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const resetItemForm = () => {
    setEditingItemId(null);
    setItemForm({
      name: "",
      description: "",
      price: "",
      category: "",
      imageUrl: "",
    });
  };

  const handleEditItem = (item) => {
    setEditingItemId(item._id);
    setItemForm({
      name: item.name || "",
      description: item.description || "",
      price: ((item.priceCents || 0) / 100).toFixed(2),
      category: item.category || "",
      imageUrl: item.imageUrl || "",
    });
  };

  const handleDeleteItem = async (id) => {
    if (!token) return;
    const confirmed = window.confirm(
      "Möchtest du diesen Artikel wirklich löschen?"
    );
    if (!confirmed) return;
    try {
      setItemsError("");
      const res = await fetch(`${API_BASE}/api/items/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Artikel konnte nicht gelöscht werden");
      setItemFeedback("Artikel erfolgreich gelöscht.");
      fetchItems();
    } catch (err) {
      setItemsError(err.message);
    }
  };

  const handleItemSubmit = async (event) => {
    event.preventDefault();
    setItemsError("");

    const priceValue = Number.parseFloat(
      String(itemForm.price).replace(",", ".")
    );
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      setItemsError("Bitte gib einen gültigen Preis ein.");
      return;
    }

    if (!itemForm.name.trim() || !itemForm.category.trim()) {
      setItemsError("Name und Kategorie sind Pflichtfelder.");
      return;
    }

    const payload = {
      name: itemForm.name.trim(),
      description: itemForm.description.trim(),
      category: itemForm.category.trim(),
      imageUrl: itemForm.imageUrl.trim() || undefined,
      priceCents: Math.round(priceValue * 100),
    };

    try {
      setItemSaving(true);
      setItemFeedback("");
      const method = editingItemId ? "PUT" : "POST";
      const url = editingItemId
        ? `${API_BASE}/api/items/${editingItemId}`
        : `${API_BASE}/api/items`;
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Artikel konnte nicht gespeichert werden");

      setItemFeedback(
        editingItemId ? "Artikel aktualisiert." : "Artikel erstellt."
      );
      resetItemForm();
      fetchItems();
    } catch (err) {
      setItemsError(err.message);
    } finally {
      setItemSaving(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-amber-200 flex items-center justify-center px-4">
        <div className="bg-white p-6 rounded-xl shadow text-center max-w-md w-full">
          <div className="font-semibold mb-2 text-lg">Kein Zugriff</div>
          <div className="text-sm text-gray-600 mb-4">
            Nur für Administratoren. 
            {user && (
              <div className="mt-2 text-xs text-gray-500">
                Aktueller Status: {user.role || "unbekannt"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <button
              className="block w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              onClick={() => {
                if (refreshProfile) {
                  refreshProfile().then(() => {
                    console.log("Profile refreshed, please try again");
                  });
                }
              }}
            >
              Profil aktualisieren
            </button>
            <button
              className="block w-full px-4 py-2 text-blue-600 underline text-sm"
              onClick={() => onNavigate("Home")}
            >
              Zur Startseite
            </button>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            💡 Tipp: Falls Sie gerade Admin-Rechte erhalten haben, loggen Sie sich aus und wieder ein, um ein neues Token zu erhalten.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* New Order Popup Modal */}
      {newOrderPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">🚨 NEUE BESTELLUNG</h2>
                  <p className="text-red-100 mt-1">Bestellnummer: {newOrderPopup.ref}</p>
                </div>
                <button
                  onClick={() => setNewOrderPopup(null)}
                  className="text-white hover:text-red-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">👤 Kundeninformationen</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {newOrderPopup.customer?.name || "Nicht angegeben"}</p>
                  <p><strong>E-Mail:</strong> {newOrderPopup.customer?.email || "Nicht angegeben"}</p>
                  <p><strong>Telefon:</strong> {newOrderPopup.customer?.phone || "Nicht angegeben"}</p>
                  {newOrderPopup.customer?.address && (
                    <p><strong>Adresse:</strong> {newOrderPopup.customer.address}</p>
                  )}
                  {newOrderPopup.customer?.desiredTime && (
                    <p><strong>Gewünschte Lieferzeit:</strong> {newOrderPopup.customer.desiredTime}</p>
                  )}
                  {newOrderPopup.customer?.notes && (
                    <p className="mt-2 text-gray-600"><strong>Notiz:</strong> {newOrderPopup.customer.notes}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">🛒 Bestellung</h3>
                <div className="space-y-2">
                  {newOrderPopup.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium">{item.qty}× {item.name}</span>
                      <span className="text-red-600 font-bold">
                        €{((item.priceCents * item.qty) / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t-2 border-red-600">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Gesamtbetrag:</span>
                    <span className="text-2xl font-bold text-red-600">
                      €{((newOrderPopup.totals?.grandTotalCents || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => confirmOrder(newOrderPopup._id)}
                  disabled={confirmingOrderId === newOrderPopup._id}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirmingOrderId === newOrderPopup._id ? "Wird bestätigt..." : "✅ Bestellung bestätigen"}
                </button>
                <button
                  onClick={() => setNewOrderPopup(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Später bearbeiten
                </button>
              </div>
              
              <p className="text-xs text-gray-500 text-center mt-2">
                ⚡ Bitte sofort bearbeiten - Der Kunde erhält erst nach Ihrer Bestätigung eine E-Mail
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-amber-200 p-4 sm:p-6 flex justify-center">
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            {orders.filter(o => o.status === "new").length > 0 && (
              <span className="bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full animate-pulse text-center whitespace-nowrap flex items-center justify-center">
                <span>{orders.filter(o => o.status === "new").length}</span>
                <span className="ml-1">neue Bestellungen</span>
              </span>
            )}
          </div>

          {/* ✅ Responsive Toggle Buttons */}
          <div className="flex justify-center sm:justify-end w-full sm:w-auto">
            <div className="inline-flex rounded-lg border border-amber-300 overflow-hidden text-sm sm:text-base">
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-3 sm:px-4 py-2 font-medium transition-colors ${
                  activeTab === "orders"
                    ? "bg-amber-400 text-black"
                    : "bg-white text-gray-700 hover:bg-amber-100"
                }`}
              >
                Bestellungen
              </button>
              <button
                onClick={() => setActiveTab("items")}
                className={`px-3 sm:px-4 py-2 font-medium transition-colors ${
                  activeTab === "items"
                    ? "bg-amber-400 text-black"
                    : "bg-white text-gray-700 hover:bg-amber-100"
                }`}
              >
                Artikel verwalten
              </button>
              <button
                onClick={() => setActiveTab("drivers")}
                className={`px-3 sm:px-4 py-2 font-medium transition-colors ${
                  activeTab === "drivers"
                    ? "bg-amber-400 text-black"
                    : "bg-white text-gray-700 hover:bg-amber-100"
                }`}
              >
                Fahrer
              </button>
            </div>
          </div>
        </div>

        {activeTab === "orders" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-xl font-semibold">Bestellungen</h2>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="select-clean"
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

            {ordersError && (
              <div className="bg-red-100 border border-red-300 text-red-700 text-sm px-3 py-2 rounded">
                {ordersError}
              </div>
            )}

            {ordersLoading ? (
              <div className="text-sm text-gray-600">
                Bestellungen werden geladen…
              </div>
            ) : orders.length === 0 ? (
              <div className="text-gray-600 text-sm">
                Keine Bestellungen gefunden.
              </div>
            ) : (
              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="font-semibold text-base">{order.ref}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleString("de-DE")}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-gray-700">
                      {order.items.map((item) => (
                        <div
                          key={`${order._id}-${item.itemId}`}
                          className="flex justify-between gap-3"
                        >
                          <span>
                            {item.qty}× {item.name}
                          </span>
                          <span>
                            {((item.priceCents * item.qty) / 100).toFixed(2)} €
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                      <div>
                        <div>
                          <strong>Kunde:</strong> {order.customer?.name}
                        </div>
                        <div>
                          <strong>Adresse:</strong> {order.customer?.address}
                        </div>
                        <div>
                          <strong>Telefon:</strong> {order.customer?.phone}
                        </div>
                        {order.customer?.email && (
                          <div>
                            <strong>E-Mail:</strong> {order.customer.email}
                          </div>
                        )}
                        {order.customer?.desiredTime && (
                          <div>
                            <strong>Lieferzeit:</strong>{" "}
                            {order.customer.desiredTime}
                          </div>
                        )}
                        {order.customer?.notes && (
                          <div className="text-gray-600 mt-1">
                            <strong>Hinweis:</strong> {order.customer.notes}
                          </div>
                        )}
                        <div className="mt-2">
                          <span className="text-sm font-medium">Status: </span>
                          <span className="text-sm font-semibold text-amber-600">
                            {translateStatus(order.status)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        {order.status === "new" && (
                          <button
                            onClick={() => confirmOrder(order._id)}
                            disabled={confirmingOrderId === order._id}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {confirmingOrderId === order._id ? "Wird bestätigt..." : "✅ Bestätigen"}
                          </button>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Status ändern:</span>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              updateOrderStatus(order._id, e.target.value)
                            }
                            className="select-clean"
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "items" && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6">
            <div className="border border-amber-200 rounded-xl p-5 bg-amber-50/60">
              <h2 className="text-lg font-semibold mb-4">
                {editingItemId ? "Artikel bearbeiten" : "Neuen Artikel anlegen"}
              </h2>
              {itemsError && (
                <div className="mb-3 bg-red-100 border border-red-300 text-red-700 text-sm px-3 py-2 rounded">
                  {itemsError}
                </div>
              )}
              {itemFeedback && (
                <div className="mb-3 bg-green-100 border border-green-300 text-green-700 text-sm px-3 py-2 rounded">
                  {itemFeedback}
                </div>
              )}
              <form className="space-y-3" onSubmit={handleItemSubmit}>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, name: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">
                    Beschreibung
                  </label>
                  <textarea
                    rows={3}
                    value={itemForm.description}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, description: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">
                      Preis (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemForm.price}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, price: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">
                      Kategorie
                    </label>
                    <input
                      type="text"
                      value={itemForm.category}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, category: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">
                    Bild-URL oder Upload
                  </label>

                  <div className="space-y-2">
                    {/* 1️⃣ Optional text field for manual URLs */}
                    <input
                      type="text"
                      value={itemForm.imageUrl}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, imageUrl: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="https:// oder lade ein Bild unten hoch"
                    />

                    {/* 2️⃣ File upload input */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const formData = new FormData();
                        formData.append("file", file); // must match upload.single("file") in backend

                        try {
                          const res = await fetch(`${API_BASE}/api/upload`, {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${token}`, // required for requireAdmin
                            },
                            body: formData,
                          });

                          if (!res.ok) throw new Error("Upload failed");

                          const data = await res.json();

                          if (data.url) {
                            setItemForm((f) => ({ ...f, imageUrl: data.url }));
                          } else {
                            alert("Upload succeeded but no URL returned.");
                          }
                        } catch (err) {
                          console.error("Upload failed", err);
                          alert(
                            "Bild-Upload fehlgeschlagen. Bitte erneut versuchen."
                          );
                        }
                      }}
                      className="block w-full text-sm text-gray-700 border border-amber-200 rounded-lg cursor-pointer bg-amber-50 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-amber-300 file:text-gray-800 hover:file:bg-amber-400"
                    />

                    {/* 3️⃣ Image preview */}
                    {itemForm.imageUrl ? (
                      <div className="mt-2">
                        <img
                          src={itemForm.imageUrl}
                          alt="Vorschau"
                          className="h-24 w-24 object-cover rounded-lg border"
                          onError={(e) => {
                            e.target.src = "/main.jpeg";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="mt-2">
                        <img
                          src="/main.jpeg"
                          alt="Default preview"
                          className="h-24 w-24 object-cover rounded-lg border opacity-50"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
                  <button
                    type="submit"
                    disabled={itemSaving}
                    className="bg-amber-400 hover:bg-amber-500 px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
                  >
                    {itemSaving
                      ? "Speichern…"
                      : editingItemId
                      ? "Artikel aktualisieren"
                      : "Artikel erstellen"}
                  </button>
                  {editingItemId && (
                    <button
                      type="button"
                      onClick={resetItemForm}
                      className="text-sm text-gray-600 underline"
                    >
                      Abbrechen
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-semibold">Vorhandene Artikel</h2>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <div className="relative w-full sm:w-72">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-amber-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-4.35-4.35m0 0A6.5 6.5 0 1010.5 17.5a6.5 6.5 0 006.5-6.5"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Artikel suchen…"
                      className="w-full rounded-lg border border-amber-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  </div>
                  <button
                    onClick={fetchItems}
                    className="inline-flex items-center justify-center rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
                  >
                    Aktualisieren
                  </button>
                </div>
              </div>
              {itemsLoading ? (
                <div className="text-sm text-gray-600">
                  Artikel werden geladen…
                </div>
              ) : items.length === 0 ? (
                <div className="text-sm text-gray-600">
                  Noch keine Artikel vorhanden.
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-sm text-gray-600">
                  Keine Artikel gefunden.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item._id}
                      className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={item.imageUrl || "/main.jpeg"}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg border border-amber-100"
                          onError={(e) => {
                            e.target.src = "/main.jpeg";
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-base">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-600 capitalize">
                            {item.category}
                          </div>
                          <div className="text-sm font-semibold text-amber-600 mt-1">
                            {(item.priceCents / 100).toFixed(2)} €
                          </div>
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 max-h-20 overflow-hidden">
                          {item.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="flex-1 bg-amber-100 hover:bg-amber-200 text-sm font-medium rounded-lg px-3 py-2"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="flex-1 bg-red-100 hover:bg-red-200 text-sm font-medium text-red-600 rounded-lg px-3 py-2"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "drivers" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold">Fahrerübersicht</h2>
            
            {driversError && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
                {driversError}
              </div>
            )}

            {driversLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                <p className="mt-2 text-gray-600">Fahrer werden geladen...</p>
              </div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                Keine aktiven Fahrer gefunden.
              </div>
            ) : (
              <div className="space-y-4">
                {drivers.map((driver) => (
                  <div
                    key={driver._id}
                    className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                  >
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{driver.name}</h3>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><strong>Telefon:</strong> {driver.phone}</p>
                          {driver.email && (
                            <p><strong>E-Mail:</strong> {driver.email}</p>
                          )}
                          {driver.currentOrder && (
                            <p className="text-amber-600">
                              <strong>Aktuelle Bestellung:</strong> {driver.currentOrder.ref || driver.currentOrder._id}
                            </p>
                          )}
                          {driver.currentLocation?.latitude && (
                            <p className="text-xs text-gray-500">
                              <strong>Letzte Aktualisierung:</strong>{" "}
                              {new Date(driver.currentLocation.lastUpdated).toLocaleString("de-DE")}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Always show map - driver starts at restaurant, moves when location available */}
                      <div className="lg:w-96 h-64 bg-gray-100 rounded-lg overflow-hidden">
                        <DriverMap
                          driverLocation={
                            driver.currentLocation?.latitude && driver.currentLocation?.longitude
                              ? {
                                  latitude: driver.currentLocation.latitude,
                                  longitude: driver.currentLocation.longitude,
                                  driverName: driver.name,
                                }
                              : null
                          }
                          orderId={driver._id}
                          height="256px"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
