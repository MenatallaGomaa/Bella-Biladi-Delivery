import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";

export default function CheckoutPayment({ onNavigate }) {
  const { user } = useAuth();
  const { cart } = useCart();

  // Group items and calculate totals
  const grouped = Object.values(
    cart.reduce((acc, item) => {
      if (!acc[item.name]) acc[item.name] = { ...item, qty: 0 };
      acc[item.name].qty++;
      return acc;
    }, {})
  );

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
    phone: "017600000000",
    address: "Ostheimstr. 8B, 04328 Leipzig",
    time: "So schnell wie möglich",
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
                <div className="text-gray-500">{form.time}</div>
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
            onClick={() => alert("✅ Bestellung abgeschickt!")}
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

      {/* ✅ ITEM MODAL */}
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
            <div className="max-h-[50vh] overflow-y-auto space-y-3">
              {grouped.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {item.qty} × {(item.priceCents / 100).toFixed(2)} €
                    </div>
                  </div>
                  <div className="font-semibold">
                    {((item.priceCents * item.qty) / 100).toFixed(2)} €
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ✅ EDIT MODALS (same as before) */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 relative">
            <button
              onClick={() => setEditing(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-black"
            >
              ✕
            </button>

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

            {editing === "time" && (
              <>
                <h3 className="text-lg font-semibold mb-4">Lieferzeit</h3>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="radio"
                    name="time"
                    checked={form.time === "So schnell wie möglich"}
                    onChange={() =>
                      setForm({ ...form, time: "So schnell wie möglich" })
                    }
                  />
                  <span>So schnell wie möglich</span>
                </label>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="radio"
                    name="time"
                    checked={form.time === "Für später planen"}
                    onChange={() =>
                      setForm({ ...form, time: "Für später planen" })
                    }
                  />
                  <span>Für später planen</span>
                </label>
                <button
                  onClick={handleSave}
                  className="w-full bg-amber-400 py-2 rounded-lg font-medium hover:bg-amber-500"
                >
                  Speichern
                </button>
              </>
            )}

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
