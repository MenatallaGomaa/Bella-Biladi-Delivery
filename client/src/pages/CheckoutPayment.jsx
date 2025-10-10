import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";

export default function CheckoutPayment({ onNavigate }) {
  const { user } = useAuth();
  const { cart, addToCart, removeOneFromCart, removeAllFromCart, clearCart } =
    useCart();

  // Group items by name
  const groupedMap = new Map();
  cart.forEach((item) => {
    if (!groupedMap.has(item.name)) {
      groupedMap.set(item.name, { ...item, qty: 1 });
    } else {
      groupedMap.get(item.name).qty++;
    }
  });
  const grouped = Array.from(groupedMap.values());

  // Calculate totals
  const subtotal = grouped.reduce(
    (sum, item) => sum + (item.priceCents * item.qty) / 100,
    0
  );
  const delivery = 0.0;
  const total = subtotal + delivery;

  const [editing, setEditing] = useState(null);
  const [showItems, setShowItems] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: "000000000000",
    address: "Straße und Hausnummer , Postleitzahl Leipzig",
    time: { type: "asap", label: "So schnell wie möglich" },
    comment: "",
  });

  useEffect(() => {
    document.body.style.overflow = editing || showItems ? "hidden" : "auto";
  }, [editing, showItems]);

  const handleSave = () => setEditing(null);

  return (
    <div className="min-h-screen w-full bg-amber-200 flex justify-center items-start p-4 sm:p-10 overflow-y-auto relative">
      {/* 🔙 Back */}
      <button
        onClick={() => onNavigate("Cart")}
        className="absolute top-6 left-6 bg-white px-3 py-1.5 rounded-lg font-medium shadow hover:bg-gray-100 transition"
      >
        ← Zurück
      </button>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 mt-14">
        {/* ✅ BESTELLDETAILS */}
        <div className="bg-white rounded-2xl shadow-md p-6 w-full">
          <h2 className="text-xl font-bold mb-4">Bestelldetails</h2>
          <div className="divide-y text-sm">
            <button
              className="w-full text-left py-3 flex justify-between items-center"
              onClick={() => setEditing("user")}
            >
              <div>
                <div className="font-medium">{form.name || "Name"}</div>
                <div className="text-gray-500">{form.phone}</div>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button
              className="w-full text-left py-3 flex justify-between items-center"
              onClick={() => setEditing("address")}
            >
              <div>
                <div className="font-medium">{form.address.split(",")[0]}</div>
                <div className="text-gray-500">
                  {form.address.split(",")[1]}
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button
              className="w-full text-left py-3 flex justify-between items-center"
              onClick={() => setEditing("time")}
            >
              <div>
                <div className="font-medium">Lieferzeit</div>
                <div className="text-gray-500">{form.time.label}</div>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button
              className="w-full text-left py-3 flex justify-between items-center"
              onClick={() => setEditing("comment")}
            >
              <div>
                <div className="font-medium">Sonderwünsche</div>
                <div className="text-gray-500">
                  {form.comment || "Kommentar"}
                </div>
              </div>
              <span className="text-gray-400">+</span>
            </button>
          </div>
        </div>

        {/* ✅ BESTELLÜBERSICHT */}
        <div className="bg-white rounded-2xl shadow-md p-6 w-full">
          <h2 className="text-xl font-bold mb-4">Bestellübersicht</h2>
          <div className="text-sm text-gray-700 space-y-2">
            <div className="flex justify-between border-b pb-2">
              <button
                className="text-blue-600 underline cursor-pointer"
                onClick={() => setShowItems(true)}
              >
                {cart.length} Artikel anzeigen
              </button>
              <span>🍕</span>
            </div>

            <div className="flex justify-between mt-4">
              <span>Zwischensumme</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span>Lieferkosten</span>
              <span>{delivery.toFixed(2)} €</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Gesamt</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>

          <button
            onClick={() => {
              const savedOrders = JSON.parse(
                localStorage.getItem("orders") || "[]"
              );
              const newOrder = {
                date: new Date().toLocaleString("de-DE"),
                items: grouped.map((i) => ({
                  name: i.name,
                  qty: i.qty,
                  price: (i.priceCents / 100) * i.qty,
                })),
                total,
                time:
                  typeof form.time === "object" ? form.time.label : form.time,
              };

              localStorage.setItem(
                "orders",
                JSON.stringify([...savedOrders, newOrder])
              );
              alert("✅ Bestellung erfolgreich gespeichert!");
              clearCart();
              onNavigate("Home");
            }}
            className="mt-6 w-full bg-amber-400 py-3 rounded-lg font-semibold hover:bg-amber-500"
          >
            Bestellen & Bezahlen
          </button>
        </div>

        {/* ✅ ZAHLUNGSOPTIONEN */}
        <div className="bg-white rounded-2xl shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Zahlungsoptionen</h2>
          <div className="space-y-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="payment" defaultChecked />
              <span>Bargeld</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="payment" />
              <span>Mit Karte bei der Lieferung</span>
            </label>
          </div>
        </div>
      </div>

      {/* ✅ ITEM MODAL with quantity controls */}
      {showItems && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowItems(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-black"
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold mb-4">Deine Artikel</h3>

            <div className="max-h-[60vh] overflow-y-auto space-y-3">
              {grouped.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between items-center border-b pb-3"
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {item.qty} × {(item.priceCents / 100).toFixed(2)} €
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* ➖ Decrease one */}
                    <button
                      onClick={() => removeOneFromCart(item.name)}
                      className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 text-center font-bold"
                    >
                      −
                    </button>

                    <span className="w-6 text-center">{item.qty}</span>

                    {/* ➕ Increase one */}
                    <button
                      onClick={() => addToCart(item)}
                      className="w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-500 text-center font-bold"
                    >
                      +
                    </button>

                    {/* 🗑 Remove all */}
                    <button
                      onClick={() => removeAllFromCart(item.name)}
                      className="ml-2 text-red-500 hover:text-red-700 text-lg"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowItems(false)}
              className="w-full mt-4 py-2 bg-amber-400 rounded-lg font-medium hover:bg-amber-500"
            >
              Fertig
            </button>
          </div>
        </div>
      )}

      {/* ✅ EDIT MODALS */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 relative">
            <button
              onClick={() => setEditing(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-black"
            >
              ✕
            </button>

            {/* 🧍 USER INFO */}
            {editing === "user" && (
              <>
                <h3 className="text-lg font-semibold mb-4">Deine Angaben</h3>
                <input
                  type="text"
                  placeholder="Vorname Nachname"
                  className="w-full border rounded-lg px-3 py-2 mb-3"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  type="tel"
                  placeholder="Telefonnummer"
                  className="w-full border rounded-lg px-3 py-2 mb-4"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <button
                  onClick={handleSave}
                  className="w-full bg-amber-400 py-2 rounded-lg font-medium hover:bg-amber-500"
                >
                  Speichern
                </button>
              </>
            )}

            {/* 🏠 ADDRESS */}
            {editing === "address" && (
              <>
                <h3 className="text-lg font-semibold mb-4">
                  Adresse bearbeiten
                </h3>
                <input
                  type="text"
                  placeholder="Straße und Hausnummer"
                  className="w-full border rounded-lg px-3 py-2 mb-3"
                  value={form.address.split(",")[0]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: `${e.target.value}, ${
                        form.address.split(",")[1]
                      }`,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="PLZ und Stadt"
                  className="w-full border rounded-lg px-3 py-2 mb-4"
                  value={form.address.split(",")[1]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: `${form.address.split(",")[0]}, ${
                        e.target.value
                      }`,
                    })
                  }
                />
                <button
                  onClick={handleSave}
                  className="w-full bg-amber-400 py-2 rounded-lg font-medium hover:bg-amber-500"
                >
                  Speichern
                </button>
              </>
            )}

            {/* ⏰ LIEFERZEIT */}
            {editing === "time" && (
              <>
                <h3 className="text-lg font-semibold mb-4">Lieferzeit</h3>

                {/* Option 1: So schnell wie möglich */}
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="radio"
                    name="time"
                    checked={form.time.type === "asap"}
                    onChange={() =>
                      setForm({
                        ...form,
                        time: { type: "asap", label: "So schnell wie möglich" },
                      })
                    }
                  />
                  <span>So schnell wie möglich</span>
                </label>

                {/* Option 2: Für später planen */}
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="radio"
                    name="time"
                    checked={form.time.type === "later"}
                    onChange={() =>
                      setForm({
                        ...form,
                        time: {
                          type: "later",
                          day: "Heute",
                          hour: "12:00",
                          label: "Heute, 12:00 Uhr",
                        },
                      })
                    }
                  />
                  <span>Für später planen</span>
                </label>

                {/* Day + Time Selectors */}
                {form.time.type === "later" && (
                  <div className="mt-3 space-y-4">
                    {/* Select Day */}
                    <select
                      className="w-full border border-amber-300 rounded-lg px-3 py-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                      value={form.time.day}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          time: { ...prev.time, day: e.target.value },
                        }))
                      }
                    >
                      <option value="Heute">Heute</option>
                      <option value="Morgen">Morgen</option>
                    </select>

                    {/* Select Time */}
                    <select
                      className="w-full border border-amber-300 rounded-lg px-3 py-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                      value={form.time.hour}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          time: { ...prev.time, hour: e.target.value },
                        }))
                      }
                    >
                      {Array.from({ length: 44 }, (_, i) => {
                        const hour = 12 + Math.floor(i / 4);
                        const minute = (i % 4) * 15;
                        if (hour > 23) return null;
                        const formatted = `${hour
                          .toString()
                          .padStart(2, "0")}:${minute
                          .toString()
                          .padStart(2, "0")}`;
                        return (
                          <option key={formatted} value={formatted}>
                            {formatted}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={() => {
                    const label =
                      form.time.type === "asap"
                        ? "So schnell wie möglich"
                        : `${form.time.day}, ${form.time.hour} Uhr`;
                    setForm((prev) => ({
                      ...prev,
                      time: { ...prev.time, label },
                    }));
                    handleSave();
                  }}
                  className="w-full bg-amber-400 py-2 rounded-lg font-medium hover:bg-amber-500 mt-6"
                >
                  Speichern
                </button>
              </>
            )}

            {/* 💬 COMMENT */}
            {editing === "comment" && (
              <>
                <h3 className="text-lg font-semibold mb-4">Sonderwünsche</h3>
                <textarea
                  placeholder="Füge deinen Kommentar hinzu..."
                  className="w-full border rounded-lg px-3 py-2 mb-4"
                  rows={3}
                  value={form.comment}
                  onChange={(e) =>
                    setForm({ ...form, comment: e.target.value })
                  }
                />
                <button
                  onClick={handleSave}
                  className="w-full bg-amber-400 py-2 rounded-lg font-medium hover:bg-amber-500"
                >
                  Speichern
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
