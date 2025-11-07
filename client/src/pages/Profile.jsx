import { useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";

export default function Profile({ onNavigate }) {
  const { user: authUser, changePassword } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const successTimeoutRef = useRef(null);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.error || "Profil laden fehlgeschlagen";
          
          // If user not found (404), the token is invalid - clear it and redirect to login
          if (res.status === 404 || errorMessage.includes("not found") || errorMessage.includes("Please log in again")) {
            console.warn("User not found in database. Clearing token and redirecting to login.");
            localStorage.removeItem("token");
            setTimeout(() => {
              onNavigate("CheckoutLogin");
            }, 2000);
            setError("Ihr Benutzerkonto wurde nicht gefunden. Bitte melden Sie sich erneut an.");
            return;
          }
          
          // If unauthorized (401), token is invalid - clear it
          if (res.status === 401) {
            console.warn("Invalid token. Clearing and redirecting to login.");
            localStorage.removeItem("token");
            setTimeout(() => {
              onNavigate("CheckoutLogin");
            }, 2000);
            setError("Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.");
            return;
          }
          
          throw new Error(errorMessage);
        }
        const data = await res.json();
        console.log("✅ Profile loaded:", data);
        setProfile(data);
        setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
        setError(""); // Clear any previous errors
      } catch (e) {
        console.error("Profile load error:", e);
        // Only set error if we haven't already set a redirect message
        const currentError = e.message || "";
        if (!currentError.includes("Bitte melden Sie sich erneut an") && !currentError.includes("nicht gefunden")) {
          setError(e.message);
          // If API fails but we have auth user, use that as fallback
          if (authUser) {
            setProfile({
              name: authUser.name,
              email: authUser.email,
              role: authUser.role,
              addresses: [],
            });
            setAddresses([]);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authUser, onNavigate]);

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

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.current.trim() || !passwordForm.next.trim()) {
      setPasswordError("Bitte fülle alle Felder aus.");
      return;
    }
    if (passwordForm.next.trim().length < 6) {
      setPasswordError("Das neue Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (passwordForm.next.trim() !== passwordForm.confirm.trim()) {
      setPasswordError("Die neuen Passwörter stimmen nicht überein.");
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(passwordForm.current.trim(), passwordForm.next.trim());
      setPasswordSuccess("Passwort erfolgreich geändert!");
      setPasswordForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPasswordError(err.message || "Passwort konnte nicht geändert werden.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-200">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700 text-sm">Laden...</span>
        </div>
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-200">
        <div className="bg-white p-6 rounded-xl shadow max-w-md w-full mx-4">
          <div className="text-center">
            <div className="font-semibold mb-2">Kein Profil gefunden</div>
            {error && (
              <div className="text-sm text-red-600 mb-4">{error}</div>
            )}
            <button
              onClick={() => {
                // Try to reload
                setLoading(true);
                setError("");
                const token = localStorage.getItem("token");
                if (token) {
                  fetch(`${import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:10000"}/api/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                    .then((res) => res.json())
                    .then((data) => {
                      setProfile(data);
                      setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
                      setLoading(false);
                    })
                    .catch((e) => {
                      setError(e.message);
                      setLoading(false);
                    });
                }
              }}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 rounded-lg text-sm font-medium"
            >
              Erneut versuchen
            </button>
            <button
              onClick={() => onNavigate("Home")}
              className="mt-2 px-4 py-2 text-blue-600 underline text-sm"
            >
              Zur Startseite
            </button>
          </div>
        </div>
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

        <div className="mt-6 border-t border-gray-200 pt-4">
          <h2 className="text-base font-semibold mb-3">Passwort ändern</h2>
          {passwordError && (
            <div className="mb-3 rounded border border-red-300 bg-red-100 px-3 py-2 text-xs text-red-700">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="mb-3 rounded border border-green-300 bg-green-100 px-3 py-2 text-xs text-green-700">
              {passwordSuccess}
            </div>
          )}
          <div className="space-y-2">
            <input
              type="password"
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="Aktuelles Passwort"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, current: e.target.value }))}
            />
            <input
              type="password"
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="Neues Passwort"
              value={passwordForm.next}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, next: e.target.value }))}
            />
            <input
              type="password"
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="Neues Passwort bestätigen"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))}
            />
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="w-full px-3 py-2 text-sm rounded-lg bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {changingPassword ? "Ändern…" : "Passwort ändern"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
