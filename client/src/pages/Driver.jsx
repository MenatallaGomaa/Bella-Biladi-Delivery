import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:4000").replace(/\/+$/, "");

export default function Driver({ onNavigate }) {
  const { user } = useAuth();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [watchId, setWatchId] = useState(null);

  // Fetch driver info
  useEffect(() => {
    const fetchDriver = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Bitte einloggen");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/drivers/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 404) {
          setError("Kein Fahrerkonto gefunden. Bitte kontaktieren Sie den Administrator.");
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error("Fahrerdaten konnten nicht geladen werden");

        const driverData = await res.json();
        setDriver(driverData);

        // Fetch current order if assigned
        if (driverData.currentOrder) {
          const orderRes = await fetch(`${API_BASE}/api/orders/${driverData.currentOrder}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (orderRes.ok) {
            const orderData = await orderRes.json();
            setCurrentOrder(orderData);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, []);

  // Start/stop location sharing
  const toggleLocationSharing = () => {
    if (sharingLocation) {
      // Stop sharing
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setSharingLocation(false);
      setLocationError("");
    } else {
      // Start sharing
      if (!navigator.geolocation) {
        setLocationError("Geolocation wird von diesem Browser nicht unterstützt");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setLocationError("Bitte einloggen");
        return;
      }

      setLocationError("");
      setSharingLocation(true);

      // Watch position and send updates
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const res = await fetch(`${API_BASE}/api/drivers/me/location`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ latitude, longitude }),
            });

            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || "Standort konnte nicht gesendet werden");
            }

            const data = await res.json();
            console.log("✅ Location updated:", data);
            setLocationError("");
          } catch (err) {
            console.error("Error updating location:", err);
            setLocationError(err.message);
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          let errorMsg = "Standort konnte nicht ermittelt werden";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = "Standortfreigabe wurde verweigert. Bitte erlauben Sie den Zugriff in den Browsereinstellungen.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = "Standortinformationen sind nicht verfügbar";
              break;
            case err.TIMEOUT:
              errorMsg = "Zeitüberschreitung beim Abrufen des Standorts";
              break;
          }
          setLocationError(errorMsg);
          setSharingLocation(false);
          if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );

      setWatchId(id);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-200 flex items-center justify-center px-4">
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="text-gray-600">Lade Fahrerdaten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-amber-200 flex items-center justify-center px-4">
        <div className="bg-white p-6 rounded-xl shadow text-center max-w-md w-full">
          <div className="text-red-600 mb-4 text-lg font-semibold">Fehler</div>
          <div className="text-gray-700 mb-4">{error}</div>
          <button
            onClick={() => onNavigate("Home")}
            className="bg-amber-400 hover:bg-amber-500 py-2 px-4 rounded-lg font-medium"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-200 flex flex-col items-center py-4 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">🚴 Fahrer Dashboard</h1>

        {/* Driver Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h2 className="font-semibold text-lg mb-2">{driver?.name}</h2>
          <p className="text-sm text-gray-600">📞 {driver?.phone}</p>
          {driver?.email && <p className="text-sm text-gray-600">📧 {driver.email}</p>}
        </div>

        {/* Current Order */}
        {currentOrder ? (
          <div className="bg-teal-50 border-2 border-teal-500 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-lg mb-2">📦 Aktuelle Bestellung</h3>
            <p className="text-sm font-medium mb-1">Bestellnummer: {currentOrder.ref}</p>
            <p className="text-xs text-gray-600 mb-2">
              Status: {currentOrder.status === "on_the_way" ? "Unterwegs" : "In Bearbeitung"}
            </p>
            {currentOrder.customer?.address && (
              <p className="text-xs text-gray-700">
                📍 {currentOrder.customer.address}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
            <p className="text-gray-600 text-sm">Keine aktuelle Bestellung zugewiesen</p>
          </div>
        )}

        {/* Location Sharing */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-lg mb-3">📍 Standortfreigabe</h3>
          
          {locationError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
              <p className="text-red-700 text-sm">{locationError}</p>
            </div>
          )}

          {sharingLocation && (
            <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
              <p className="text-green-700 text-sm font-medium">
                ✅ Standort wird geteilt...
              </p>
              {driver?.currentLocation?.lastUpdated && (
                <p className="text-green-600 text-xs mt-1">
                  Letzte Aktualisierung: {new Date(driver.currentLocation.lastUpdated).toLocaleTimeString("de-DE")}
                </p>
              )}
            </div>
          )}

          <button
            onClick={toggleLocationSharing}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              sharingLocation
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-teal-500 hover:bg-teal-600 text-white"
            }`}
          >
            {sharingLocation ? "⏸ Standortfreigabe stoppen" : "▶ Standortfreigabe starten"}
          </button>

          <p className="text-xs text-gray-500 mt-2 text-center">
            {sharingLocation
              ? "Ihr Standort wird automatisch alle paar Sekunden aktualisiert"
              : "Aktivieren Sie die Standortfreigabe, damit Kunden und Administratoren Sie sehen können"}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-sm mb-2">ℹ️ Anleitung:</h3>
          <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
            <li>Aktivieren Sie die Standortfreigabe, wenn Sie eine Bestellung ausliefern</li>
            <li>Ihr Standort wird automatisch an Kunden und Administratoren gesendet</li>
            <li>Stoppen Sie die Freigabe, wenn Sie zurück zum Restaurant fahren</li>
          </ol>
        </div>

        <button
          onClick={() => onNavigate("Home")}
          className="w-full bg-amber-400 hover:bg-amber-500 py-2 px-4 rounded-lg font-medium text-sm"
        >
          Zurück zur Startseite
        </button>
      </div>
    </div>
  );
}

