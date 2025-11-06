import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";

import userIcon from "/public/user.png";
import homeIcon from "/public/home.png";
import clockIcon from "/public/clock.png";
import chatIcon from "/public/chat.png";

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:10000";

export default function CheckoutPayment({ onNavigate }) {
  const { user } = useAuth();
  const { cart, addToCart, removeOneFromCart, removeAllFromCart, clearCart } =
    useCart();

  const redirectTimeoutRef = useRef(null);

  const grouped = useMemo(() => {
    const map = new Map();
    cart.forEach((item) => {
      if (!map.has(item.name)) {
        map.set(item.name, { ...item, qty: 1 });
      } else {
        map.get(item.name).qty += 1;
      }
    });
    return Array.from(map.values());
  }, [cart]);

  const subtotal = useMemo(
    () =>
      grouped.reduce((sum, item) => sum + (item.priceCents * item.qty) / 100, 0),
    [grouped]
  );
  const delivery = 0;
  const total = subtotal + delivery;

  const [editing, setEditing] = useState(null);
  const [showItems, setShowItems] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    street: "",
    postalCity: "",
    time: { type: "asap", label: "So schnell wie möglich" },
    comment: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.body.style.overflow = editing || showItems ? "hidden" : "auto";
  }, [editing, showItems]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const token = localStorage.getItem("token");
    if (!token) {
      setLoadingProfile(false);
      return;
    }

    async function loadProfile() {
      try {
        const res = await fetch(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Profil konnte nicht geladen werden");
        const data = await res.json();
        if (ignore) return;

        const addresses = Array.isArray(data.addresses) ? data.addresses : [];
        setAvailableAddresses(addresses);

        setForm((prev) => {
          const next = { ...prev };
          if (!next.name && data.name) next.name = data.name;
          if (!next.email && data.email) next.email = data.email;

          const primary = addresses[0];
          if (primary) {
            if (!next.street && primary.street) next.street = primary.street;
            if (!next.postalCity && primary.postalCity)
              next.postalCity = primary.postalCity;
            if (!next.phone && primary.phone) next.phone = primary.phone;
            if (!next.name && primary.name) next.name = primary.name;
          }
          return next;
        });
      } catch (err) {
        console.warn(err.message);
      } finally {
        if (!ignore) setLoadingProfile(false);
      }
    }

    loadProfile();
    return () => {
      ignore = true;
    };
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Bitte gib deinen Namen ein.";
    if (!form.email.trim()) newErrors.email = "Bitte gib deine E-Mail ein.";
    if (!form.phone.trim())
      newErrors.phone = "Bitte gib deine Telefonnummer ein.";
    if (!form.street.trim())
      newErrors.street = "Bitte gib deine Straße und Hausnummer ein.";
    if (!form.postalCity.trim())
      newErrors.postalCity = "Bitte gib deine PLZ und Stadt ein.";
    if (!form.time || !form.time.label)
      newErrors.time = "Bitte wähle eine Lieferzeit.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      const element = document.getElementById(`input-${firstKey}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
      return false;
    }
    return true;
  };

  const handleApplyAddress = (addr) => {
    setForm((prev) => ({
      ...prev,
      name: addr.name || prev.name,
      phone: addr.phone || prev.phone,
      street: addr.street || prev.street,
      postalCity: addr.postalCity || prev.postalCity,
    }));
    setErrors((prev) => ({
      ...prev,
      street: undefined,
      postalCity: undefined,
    }));
  };

  const handleOrderSubmit = async () => {
    setSubmitError("");
    setConfirmation(null);
    if (!validateForm()) return;

    if (!grouped.length) {
      setSubmitError("Dein Warenkorb ist leer.");
      return;
    }

    const itemsPayload = [];
    for (const item of grouped) {
      const itemId = item._id || item.id;
      if (!itemId) {
        setSubmitError(
          "Ein Artikel konnte nicht verarbeitet werden. Bitte lade die Seite neu."
        );
        return;
      }
      itemsPayload.push({ itemId, qty: item.qty });
    }

    const payload = {
      items: itemsPayload,
      customer: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: `${form.street.trim()}, ${form.postalCity.trim()}`,
        desiredTime:
          typeof form.time === "object" ? form.time.label : form.time,
      },
      notes: form.comment.trim(),
    };

    const headers = {
      "Content-Type": "application/json",
    };
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Bestellung fehlgeschlagen");
      }

      clearCart();
      setConfirmation({
        ref: data.ref,
        total,
        email: payload.customer.email,
      });

      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      redirectTimeoutRef.current = setTimeout(() => {
        onNavigate("Orders");
      }, 3500);
    } catch (err) {
      setSubmitError(err.message || "Bestellung fehlgeschlagen");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-amber-200 flex justify-center items-start p-4 sm:p-10 overflow-y-auto relative">
      <button
        onClick={() => onNavigate("Cart")}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white px-3 py-1.5 rounded-lg font-medium shadow hover:bg-gray-100 transition"
      >
        ← Zurück
      </button>

      <div className="w-full max-w-5xl grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 mt-14 sm:mt-16">
        <div className="bg-white rounded-2xl shadow-md p-6 w-full">
          <h2 className="text-xl font-bold mb-4">Bestelldetails</h2>
          {loadingProfile && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span className="inline-block h-3 w-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              Profil wird geladen …
            </div>
          )}
          <div className="divide-y text-sm">
            <button
              className="w-full text-left py-3 flex justify-between items-center"
              onClick={() => setEditing("user")}
            >
              <div className="flex items-center gap-3">
                <img src={userIcon} alt="User" className="w-5 h-5 opacity-80" />
                <div>
                  <div className="font-medium">
                    {form.name || "Name"}{" "}
                    <span className="text-red-500">*</span>
                  </div>
                  <div className="text-gray-500">
                    {form.phone || "Telefonnummer"}
                  </div>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button
              className="w-full text-left py-3 flex justify-between items-center"
              onClick={() => setEditing("address")}
            >
              <div className="flex items-center gap-3">
                <img
                  src={homeIcon}
                  alt="Adresse"
                  className="w-5 h-5 opacity-80"
                />
                <div>
                  <div className="font-medium">
                    {form.street || "Straße und Hausnummer"}{" "}
                    <span className="text-red-500">*</span>
                  </div>
                  <div className="text-gray-500">
                    {form.postalCity || "PLZ und Stadt"}
                  </div>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button
              className="w-full text-left py-3 flex justify-between items-center"
              onClick={() => setEditing("time")}
            >
              <div className="flex items-center gap-3">
                <img
                  src={clockIcon}
                  alt="Lieferzeit"
                  className="w-5 h-5 opacity-80"
                />
                <div>
                  <div className="font-medium">
                    Lieferzeit <span className="text-red-500">*</span>
                  </div>
                  <div className="text-gray-500">{form.time.label}</div>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button
              className="w-full text-left py-3 flex justify-between items-center"
              onClick={() => setEditing("comment")}
            >
              <div className="flex items-center gap-3">
                <img
                  src={chatIcon}
                  alt="Kommentar"
                  className="w-5 h-5 opacity-80"
                />
                <div>
                  <div className="font-medium">Sonderwünsche</div>
                  <div className="text-gray-500">
                    {form.comment || "Kommentar (optional)"}
                  </div>
                </div>
              </div>
              <span className="text-gray-400">+</span>
            </button>
          </div>
        </div>

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
              <span aria-hidden>🍕</span>
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

          {submitError && (
            <div className="mt-4 bg-red-100 border border-red-300 text-red-700 text-xs sm:text-sm px-3 py-2 rounded">
              {submitError}
            </div>
          )}

          {confirmation && (
            <div className="mt-4 bg-green-100 border border-green-300 text-green-700 text-xs sm:text-sm px-3 py-3 rounded">
              <div className="font-semibold text-sm">
                Bestellung bestätigt! 🎉
              </div>
              <p className="mt-1">
                Deine Bestellnummer lautet <strong>{confirmation.ref}</strong>.
              </p>
              <p className="mt-1">
                Wir haben dir eine Bestätigung an {confirmation.email} gesendet.
              </p>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <button
                  className="bg-amber-400 hover:bg-amber-500 transition px-3 py-2 rounded-lg text-sm font-semibold"
                  onClick={() => {
                    if (redirectTimeoutRef.current) {
                      clearTimeout(redirectTimeoutRef.current);
                    }
                    onNavigate("Orders");
                  }}
                >
                  Zu meinen Bestellungen
                </button>
                <button
                  className="border border-amber-300 px-3 py-2 rounded-lg text-sm"
                  onClick={() => {
                    if (redirectTimeoutRef.current) {
                      clearTimeout(redirectTimeoutRef.current);
                    }
                    onNavigate("Home");
                  }}
                >
                  Zur Startseite
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleOrderSubmit}
            disabled={submitting || cart.length === 0}
            className="mt-6 w-full bg-amber-400 py-3 rounded-lg font-semibold hover:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Bestellung wird gesendet…" : "Bestellen & Bezahlen"}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 xl:col-span-2">
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
                  key={item._id || item.name}
                  className="flex justify-between items-center border-b pb-3"
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {item.qty} × {(item.priceCents / 100).toFixed(2)} €
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeOneFromCart(item.name)}
                      className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 text-center font-bold"
                    >
                      −
                    </button>

                    <span className="w-6 text-center">{item.qty}</span>

                    <button
                      onClick={() => addToCart(item)}
                      className="w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-500 text-center font-bold"
                    >
                      +
                    </button>

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
                  id="input-name"
                  type="text"
                  placeholder="Vorname Nachname"
                  className={`w-full border rounded-lg px-3 py-2 mb-1 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  value={form.name}
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, name: undefined }));
                    setSubmitError("");
                    setForm({ ...form, name: e.target.value });
                  }}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mb-3">{errors.name}</p>
                )}
                <input
                  id="input-email"
                  type="email"
                  placeholder="E-Mail"
                  className={`w-full border rounded-lg px-3 py-2 mb-1 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  value={form.email}
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                    setSubmitError("");
                    setForm({ ...form, email: e.target.value });
                  }}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mb-3">{errors.email}</p>
                )}
                <input
                  id="input-phone"
                  type="tel"
                  placeholder="Telefonnummer"
                  className={`w-full border rounded-lg px-3 py-2 mb-1 ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  value={form.phone}
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, phone: undefined }));
                    setSubmitError("");
                    setForm({ ...form, phone: e.target.value });
                  }}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mb-3">{errors.phone}</p>
                )}
                <button
                  onClick={() => setEditing(null)}
                  className="w-full bg-amber-400 py-2 rounded-lg font-medium hover:bg-amber-500"
                >
                  Speichern
                </button>
              </>
            )}

            {editing === "address" && (
              <>
                <h3 className="text-lg font-semibold mb-4">Adresse bearbeiten</h3>
                {availableAddresses.length > 0 && (
                  <div className="mb-4 max-h-36 overflow-y-auto space-y-2 pr-1">
                    <div className="text-xs uppercase text-gray-500 font-semibold">
                      Gespeicherte Adressen
                    </div>
                    {availableAddresses.map((addr, idx) => (
                      <button
                        key={`${addr.street}-${idx}`}
                        type="button"
                        onClick={() => handleApplyAddress(addr)}
                        className="w-full text-left border border-amber-200 hover:border-amber-400 rounded-lg px-3 py-2 text-xs"
                      >
                        <div className="font-medium text-sm">{addr.label || `Adresse ${idx + 1}`}</div>
                        <div>{addr.street}</div>
                        <div>{addr.postalCity}</div>
                        <div className="text-gray-500 text-xs">{addr.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
                <input
                  id="input-street"
                  type="text"
                  placeholder="Straße und Hausnummer"
                  className={`w-full border rounded-lg px-3 py-2 mb-1 ${
                    errors.street ? "border-red-500" : "border-gray-300"
                  }`}
                  value={form.street}
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, street: undefined }));
                    setSubmitError("");
                    setForm({ ...form, street: e.target.value });
                  }}
                />
                {errors.street && (
                  <p className="text-red-500 text-xs mb-3">{errors.street}</p>
                )}
                <input
                  id="input-postalCity"
                  type="text"
                  placeholder="PLZ und Stadt"
                  className={`w-full border rounded-lg px-3 py-2 mb-1 ${
                    errors.postalCity ? "border-red-500" : "border-gray-300"
                  }`}
                  value={form.postalCity}
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, postalCity: undefined }));
                    setSubmitError("");
                    setForm({ ...form, postalCity: e.target.value });
                  }}
                />
                {errors.postalCity && (
                  <p className="text-red-500 text-xs mb-3">
                    {errors.postalCity}
                  </p>
                )}
                <button
                  onClick={() => setEditing(null)}
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
                    checked={form.time.type === "asap"}
                    onChange={() => {
                      setSubmitError("");
                      setForm({
                        ...form,
                        time: { type: "asap", label: "So schnell wie möglich" },
                      });
                    }}
                  />
                  <span>So schnell wie möglich</span>
                </label>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="radio"
                    name="time"
                    checked={form.time.type === "later"}
                    onChange={() => {
                      setSubmitError("");
                      setForm({
                        ...form,
                        time: {
                          type: "later",
                          day: "Heute",
                          hour: "12:00",
                          label: "Heute, 12:00 Uhr",
                        },
                      });
                    }}
                  />
                  <span>Für später planen</span>
                </label>
                {form.time.type === "later" && (
                  <div className="mt-3 space-y-4">
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
                    setSubmitError("");
                    setEditing(null);
                  }}
                  className="w-full bg-amber-400 py-2 rounded-lg font-medium hover:bg-amber-500 mt-6"
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
                  onChange={(e) => {
                    setSubmitError("");
                    setForm({ ...form, comment: e.target.value });
                  }}
                />
                <button
                  onClick={() => setEditing(null)}
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
