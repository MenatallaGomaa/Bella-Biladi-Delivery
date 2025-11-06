import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:10000";

export default function Admin({ onNavigate }) {
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const canAccess = useMemo(() => {
    // Check both AuthContext user and token for admin role
    if (user?.role === "admin") return true;
    try {
      const payload = JSON.parse(atob((token || "").split(".")[1] || "e30="));
      return payload?.role === "admin";
    } catch {
      return false;
    }
  }, [token, user]);

  const [activeTab, setActiveTab] = useState("orders");

  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

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

  const fetchOrders = useCallback(async () => {
    if (!token || !canAccess) return;
    try {
      setOrdersLoading(true);
      setOrdersError("");
      const url = new URL(`${API_BASE}/api/orders`);
      if (status) url.searchParams.set("status", status);
      const res = await fetch(url.toString(), { headers });
      if (!res.ok) throw new Error("Bestellungen konnten nicht geladen werden");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setOrdersError(err.message);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
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

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  useEffect(() => {
    if (activeTab === "items") {
      fetchItems();
    }
  }, [activeTab, fetchItems]);

  const updateOrderStatus = async (id, newStatus) => {
    if (!token) return;
    await fetch(`${API_BASE}/api/orders/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: newStatus }),
    });
    fetchOrders();
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
        <div className="bg-white p-6 rounded-xl shadow text-center max-w-sm w-full">
          <div className="font-semibold mb-2">Kein Zugriff</div>
          <div className="text-sm text-gray-600">Nur für Administratoren.</div>
          <button
            className="mt-4 text-blue-600 underline"
            onClick={() => onNavigate("Home")}
          >
            Zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-200 p-4 sm:p-6 flex justify-center">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>

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
              <div className="space-y-4">
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
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Status:</span>
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Vorhandene Artikel</h2>
                <button
                  onClick={fetchItems}
                  className="text-sm text-blue-600 underline"
                >
                  Aktualisieren
                </button>
              </div>
              {itemsLoading ? (
                <div className="text-sm text-gray-600">
                  Artikel werden geladen…
                </div>
              ) : items.length === 0 ? (
                <div className="text-sm text-gray-600">
                  Noch keine Artikel vorhanden.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.map((item) => (
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
      </div>
    </div>
  );
}
