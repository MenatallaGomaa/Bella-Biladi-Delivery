import { useEffect, useState } from "react";

export default function Profile({ onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      onNavigate("Login");
      return;
    }
    async function load() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:4000"}/api/profile`, {
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

  const handleAddAddress = () => {
    setAddresses((prev) => [
      ...prev,
      { label: "Zuhause", name: "", phone: "", street: "", postalCity: "" },
    ]);
  };

  const handleRemoveAddress = (idx) => {
    setAddresses((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:4000"}/api/profile/addresses`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ addresses }),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
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
    <div className="min-h-screen bg-amber-200 py-8 px-4 flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Mein Profil</h1>
        {error && (
          <div className="mb-4 bg-red-100 border border-red-300 text-red-700 text-sm px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-sm text-gray-500">Name</div>
            <div className="font-medium">{profile.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">E-Mail</div>
            <div className="font-medium">{profile.email}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Rolle</div>
            <div className="font-medium">{profile.role}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">E-Mail bestätigt</div>
            <div className="font-medium">{profile.emailVerified ? "Ja" : "Nein"}</div>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-2">Adressen</h2>
        <div className="space-y-4">
          {addresses.map((addr, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  className="border rounded px-3 py-2 text-sm"
                  placeholder="Bezeichnung (z.B. Zuhause)"
                  value={addr.label || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAddresses((prev) => prev.map((a, i) => (i === idx ? { ...a, label: v } : a)));
                  }}
                />
                <input
                  className="border rounded px-3 py-2 text-sm"
                  placeholder="Name"
                  value={addr.name || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAddresses((prev) => prev.map((a, i) => (i === idx ? { ...a, name: v } : a)));
                  }}
                />
                <input
                  className="border rounded px-3 py-2 text-sm"
                  placeholder="Telefon"
                  value={addr.phone || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAddresses((prev) => prev.map((a, i) => (i === idx ? { ...a, phone: v } : a)));
                  }}
                />
                <input
                  className="border rounded px-3 py-2 text-sm"
                  placeholder="Straße Hausnummer"
                  value={addr.street || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAddresses((prev) => prev.map((a, i) => (i === idx ? { ...a, street: v } : a)));
                  }}
                />
                <input
                  className="border rounded px-3 py-2 text-sm sm:col-span-2"
                  placeholder="PLZ Ort"
                  value={addr.postalCity || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAddresses((prev) => prev.map((a, i) => (i === idx ? { ...a, postalCity: v } : a)));
                  }}
                />
              </div>
              <div className="mt-3 text-right">
                <button
                  className="text-red-600 text-sm hover:underline"
                  onClick={() => handleRemoveAddress(idx)}
                >
                  Entfernen
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleAddAddress}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            Adresse hinzufügen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded bg-amber-400 hover:bg-amber-500 disabled:opacity-50"
          >
            {saving ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
