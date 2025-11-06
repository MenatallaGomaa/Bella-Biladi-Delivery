import { useEffect, useState, useRef } from "react";

export default function Profile({ onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const successTimeoutRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      onNavigate("Login");
      return;
    }
    async function load() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:10000"}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Profil laden fehlgeschlagen");
        const data = await res.json();
        setProfile(data);
        setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleAddAddress = () => {
    setSuccess("");
    setAddresses((prev) => [
      ...prev,
      { label: "Zuhause", name: "", phone: "", street: "", postalCity: "" },
    ]);
  };

  const handleRemoveAddress = (idx) => {
    setSuccess("");
    setAddresses((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:10000"}/api/profile/addresses`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ addresses }),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      const data = await res.json();
      setProfile(data);
      setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
      setSuccess("Adresse erfolgreich gespeichert!");
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => setSuccess(""), 3500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-200">
        <div className="text-gray-700">Profil wird geladen…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-200">
        <div className="bg-white p-6 rounded-xl shadow">Kein Profil gefunden.</div>
      </div>
    );
  }

  return (
    <div className="bg-amber-200 py-4 px-4 flex justify-center items-start">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-4">
        <h1 className="text-lg sm:text-xl font-bold mb-3">Mein Profil</h1>
        {error && (
          <div className="mb-3 bg-red-100 border border-red-300 text-red-700 text-xs sm:text-sm px-3 py-2 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 bg-green-100 border border-green-300 text-green-700 text-xs sm:text-sm px-3 py-2 rounded">
            {success}
          </div>
        )}

        <div className="space-y-2 mb-4 pb-3 border-b border-gray-200">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Name</div>
            <div className="font-medium text-sm">{profile.name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">E-Mail</div>
            <div className="font-medium text-sm break-words">{profile.email}</div>
          </div>
        </div>

        <h2 className="text-base font-semibold mb-2">Adressen</h2>
        <div className="space-y-2">
          {addresses.map((addr, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="space-y-2">
                <input
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="Bezeichnung (z.B. Zuhause)"
                  value={addr.label || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSuccess("");
                    setAddresses((prev) => prev.map((a, i) => (i === idx ? { ...a, label: v } : a)));
                  }}
                />
                <input
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="Name"
                  value={addr.name || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSuccess("");
                    setAddresses((prev) => prev.map((a, i) => (i === idx ? { ...a, name: v } : a)));
                  }}
                />
                <input
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="Telefon"
                  value={addr.phone || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSuccess("");
                    setAddresses((prev) => prev.map((a, i) => (i === idx ? { ...a, phone: v } : a)));
                  }}
                />
                <input
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="Straße Hausnummer"
                  value={addr.street || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSuccess("");
                    setAddresses((prev) => prev.map((a, i) => (i === idx ? { ...a, street: v } : a)));
                  }}
                />
                <input
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="PLZ Ort"
                  value={addr.postalCity || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSuccess("");
                    setAddresses((prev) => prev.map((a, i) => (i === idx ? { ...a, postalCity: v } : a)));
                  }}
                />
              </div>
              <div className="mt-2 text-right">
                <button
                  className="text-red-600 text-xs hover:underline"
                  onClick={() => handleRemoveAddress(idx)}
                >
                  Entfernen
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={handleAddAddress}
            className="w-full px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Adresse hinzufügen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-3 py-2 text-sm rounded-lg bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
