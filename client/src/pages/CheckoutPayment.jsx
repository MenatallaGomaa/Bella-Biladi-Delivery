import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import { reverseGeocode, geocodeAddress } from "../utils/geocode";
import { calculateDeliveryFee, getDeliveryFeeDescription, calculateDistance } from "../utils/deliveryFee";
import { RESTAURANT_LOCATION } from "../utils/restaurantLocation";
import DeliveryInfoPopup from "../components/DeliveryInfoPopup";

import userIcon from "/public/user.png";
import homeIcon from "/public/home.png";
import clockIcon from "/public/clock.png";
import chatIcon from "/public/chat.png";

// Normalize API base URL - remove trailing slash to avoid double slashes
const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:4000").replace(/\/+$/, "");

// Store hours configuration
// Monday-Saturday: 11:00-22:00, Sunday: 11:00-23:00
const STORE_HOURS = {
  0: { open: 11, close: 23 }, // Sunday
  1: { open: 11, close: 22 }, // Monday
  2: { open: 11, close: 22 }, // Tuesday
  3: { open: 11, close: 22 }, // Wednesday
  4: { open: 11, close: 22 }, // Thursday
  5: { open: 11, close: 22 }, // Friday
  6: { open: 11, close: 22 }, // Saturday
};

// Helper function to format date for display
function formatDateLabel(date, isToday = false, isTomorrow = false) {
  const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  
  if (isToday) {
    return `Heute, ${day}.${month.toString().padStart(2, "0")}.`;
  } else if (isTomorrow) {
    return `Morgen, ${day}.${month.toString().padStart(2, "0")}.`;
  } else {
    return `${dayName}, ${day}.${month.toString().padStart(2, "0")}.`;
  }
}

// Helper function to generate the next 10 days
function getNextDays(count = 10) {
  const days = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset to start of day
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const isToday = i === 0;
    const isTomorrow = i === 1;
    
    days.push({
      date,
      label: formatDateLabel(date, isToday, isTomorrow),
      value: date.toISOString().split('T')[0], // YYYY-MM-DD format
      isToday,
      isTomorrow,
    });
  }
  
  return days;
}

// Helper function to get available time slots based on date and store hours
function getAvailableTimeSlots(targetDate) {
  // Handle both Date objects and legacy string values
  let date;
  if (targetDate instanceof Date) {
    date = targetDate;
  } else if (typeof targetDate === 'string') {
    // Legacy support: "Heute" or "Morgen" or date string
    const now = new Date();
    if (targetDate === "Heute") {
      date = now;
    } else if (targetDate === "Morgen") {
      date = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else {
      // Try parsing as date string (YYYY-MM-DD)
      date = new Date(targetDate);
    }
  } else {
    date = new Date(targetDate);
  }
  
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const dayOfWeek = date.getDay();
  const storeHours = STORE_HOURS[dayOfWeek];
  
  if (!storeHours) {
    return [];
  }
  
  const slots = [];
  const closeTime = storeHours.close * 60; // Convert to minutes
  const lastOrderTime = closeTime - 30; // Last 30 minutes no orders
  
  // Generate time slots from opening time to closing time (minus 30 mins) in 15-minute intervals
  for (let hour = storeHours.open; hour < storeHours.close; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const slotTime = hour * 60 + minute;
      if (slotTime < lastOrderTime) {
        const formatted = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push({ formatted, hour, minute, slotTime });
      }
    }
  }
  
  if (isToday) {
    // For today, filter slots to only show those at least 45 minutes in the future
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const minTime = currentHour * 60 + currentMinute + 45; // 45 minutes from now
    
    const available = slots
      .filter(({ slotTime }) => slotTime >= minTime)
      .map(({ formatted }) => formatted);
    
    return available;
  } else {
    // For future days, show all slots within store hours
    return slots.map(({ formatted }) => formatted);
  }
}

export default function CheckoutPayment({ onNavigate }) {
  const { user, loading } = useAuth();
  const { cart, addToCart, removeOneFromCart, removeAllFromCart, clearCart, setCart } =
    useCart();

  const redirectTimeoutRef = useRef(null);

  // State declarations - must be before useMemo hooks that use them
  const [editing, setEditing] = useState(null);
  const [showItems, setShowItems] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showDeliveryPopup, setShowDeliveryPopup] = useState(false);
  const [deliveryFeeInfo, setDeliveryFeeInfo] = useState({ feeCents: 0, eligible: true, distanceKm: 0 });

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

  const totalQuantity = useMemo(() => {
    return grouped.reduce((sum, item) => sum + item.qty, 0);
  }, [grouped]);

  const subtotal = useMemo(
    () =>
      grouped.reduce((sum, item) => sum + (item.priceCents * item.qty) / 100, 0),
    [grouped]
  );
  
  const subtotalCents = useMemo(
    () => grouped.reduce((sum, item) => sum + item.priceCents * item.qty, 0),
    [grouped]
  );
  
  const delivery = useMemo(() => deliveryFeeInfo.feeCents / 100, [deliveryFeeInfo.feeCents]);
  const total = subtotal + delivery;

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    street: "",
    postalCity: "",
    time: { type: "asap", label: "So schnell wie möglich", date: null, hour: null },
    comment: "",
  });

  const [errors, setErrors] = useState({});
  const [cartValidationError, setCartValidationError] = useState("");

  // Validate cart items against current database
  // Match by name instead of ID since IDs change when database is re-seeded
  // Cart validation disabled - restaurant always has everything available
  // useEffect(() => {
  //   async function validateCartItems() {
  //     // Validation logic removed - items are always available
  //   }
  //   if (cart.length > 0) {
  //     validateCartItems();
  //   }
  // }, [cart]);

  useEffect(() => {
    document.body.style.overflow = editing || showItems ? "hidden" : "auto";
  }, [editing, showItems]);

  useEffect(() => {
    if (!loading && !user) {
      localStorage.setItem("redirectAfterLogin", "CheckoutPayment");
      onNavigate("CheckoutLogin");
    }
  }, [loading, user]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // Calculate delivery fee when address changes
  useEffect(() => {
    // Don't calculate delivery fee if order is already confirmed
    if (confirmation) {
      return;
    }

    async function calculateFee() {
      if (!form.street || !form.postalCity) {
        setDeliveryFeeInfo({ feeCents: 0, eligible: true, distanceKm: 0 });
        return;
      }

      try {
        // Construct address - if postalCity already contains city, don't duplicate
        let fullAddress = form.street;
        if (form.postalCity) {
          // Check if postalCity already contains Leipzig
          if (!form.postalCity.toLowerCase().includes('leipzig')) {
            fullAddress = `${form.street}, ${form.postalCity}, Leipzig, Germany`;
          } else {
            fullAddress = `${form.street}, ${form.postalCity}, Germany`;
          }
        } else {
          fullAddress = `${form.street}, Leipzig, Germany`;
        }
        
        console.log("📍 Calculating delivery fee for address:", fullAddress);
        const coords = await geocodeAddress(fullAddress);
        
        if (coords) {
          console.log("📍 Geocoded coordinates:", coords);
          const distanceKm = calculateDistance(
            RESTAURANT_LOCATION.latitude,
            RESTAURANT_LOCATION.longitude,
            coords.latitude,
            coords.longitude
          );
          
          console.log("📍 Calculated distance:", distanceKm, "km");
          const feeInfo = calculateDeliveryFee(distanceKm, subtotalCents);
          console.log("📍 Delivery fee info:", feeInfo);
          setDeliveryFeeInfo({ ...feeInfo, distanceKm });
        } else {
          console.warn("⚠️ Geocoding failed for address:", fullAddress);
          // If geocoding fails, set default fee but mark as ineligible
          setDeliveryFeeInfo({ 
            feeCents: 0, 
            eligible: false, 
            distanceKm: 0,
            reason: "Adresse konnte nicht gefunden werden. Bitte überprüfen Sie die Adresse."
          });
        }
      } catch (error) {
        console.error("❌ Error calculating delivery fee:", error);
        setDeliveryFeeInfo({ 
          feeCents: 0, 
          eligible: false, 
          distanceKm: 0,
          reason: "Fehler bei der Berechnung der Lieferkosten. Bitte versuchen Sie es erneut."
        });
      }
    }

    // Add a small delay to avoid too many API calls while typing
    const timer = setTimeout(() => {
      calculateFee();
    }, 500);

    return () => clearTimeout(timer);
  }, [form.street, form.postalCity, subtotalCents, confirmation]);


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
    setValidationAttempted(true);
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
      // Scroll to top to show the error message
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      // Try to focus on first error field if modal is open
      const firstKey = Object.keys(newErrors)[0];
      const element = document.getElementById(`input-${firstKey}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }, 300);
      }
      return false;
    }
    
    setValidationAttempted(false);
    return true;
  };

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation wird von diesem Browser nicht unterstützt");
      return;
    }

    setGettingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const addressData = await reverseGeocode(latitude, longitude);

          if (addressData) {
            setForm((prev) => ({
              ...prev,
              street: addressData.street || prev.street,
              postalCity: addressData.postalCity || prev.postalCity,
            }));
            setErrors((prev) => ({
              ...prev,
              street: undefined,
              postalCity: undefined,
            }));
            setLocationError("");
          } else {
            setLocationError("Adresse konnte nicht ermittelt werden");
          }
        } catch (err) {
          console.error("Error reverse geocoding:", err);
          setLocationError("Fehler beim Abrufen der Adresse");
        } finally {
          setGettingLocation(false);
        }
      },
      (err) => {
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
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
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
      name: undefined,
      phone: undefined,
      street: undefined,
      postalCity: undefined,
    }));
    setValidationAttempted(false);
  };

  const handleOrderSubmit = async () => {
    setSubmitError("");
    setConfirmation(null);

    if (!user) {
      setSubmitError("Bitte melde dich an, um eine Bestellung aufzugeben.");
      localStorage.setItem("redirectAfterLogin", "CheckoutPayment");
      onNavigate("CheckoutLogin");
      return;
    }

    if (!validateForm()) return;

    if (!grouped.length) {
      setSubmitError("Dein Warenkorb ist leer.");
      return;
    }

    // Validate minimum order amount (20€)
    const MINIMUM_ORDER_AMOUNT = 20.0;
    if (subtotal < MINIMUM_ORDER_AMOUNT) {
      const remaining = (MINIMUM_ORDER_AMOUNT - subtotal).toFixed(2);
      setSubmitError(
        `Mindestbestellwert nicht erreicht. Bitte füge noch Artikel im Wert von ${remaining} € hinzu. (Mindestbestellwert: ${MINIMUM_ORDER_AMOUNT.toFixed(2)} €)`
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Validate delivery eligibility
    if (!deliveryFeeInfo.eligible) {
      setSubmitError(
        deliveryFeeInfo.reason || "Lieferung für diese Adresse nicht möglich."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // First, validate that all items still exist in the database and get current IDs
    let allItems, nameToIdMap;
    try {
      const itemsRes = await fetch(`${API_BASE}/api/items`);
      if (!itemsRes.ok) throw new Error("Could not fetch items");
      allItems = await itemsRes.json();
      
      // Create a map of item names to their current IDs
      nameToIdMap = new Map();
      allItems.forEach(item => {
        if (item.name) {
          nameToIdMap.set(item.name, String(item._id));
        }
      });
      
      // Validation disabled - restaurant always has everything available
      // Just update cart items with current IDs from database
      
      // Update cart items with current IDs if they don't match
      const updatedCart = cart.map(cartItem => {
        if (cartItem.name && nameToIdMap.has(cartItem.name)) {
          const currentId = nameToIdMap.get(cartItem.name);
          const cartItemId = String(cartItem._id || cartItem.id || '');
          if (cartItemId !== currentId) {
            return { ...cartItem, _id: currentId, id: currentId };
          }
        }
        return cartItem;
      });
      if (JSON.stringify(updatedCart) !== JSON.stringify(cart)) {
        setCart(updatedCart);
      }
    } catch (err) {
      console.error("Error validating cart items:", err);
      setSubmitError("Fehler beim Validieren der Artikel. Bitte versuche es erneut.");
      return;
    }

    // Build items payload - use current IDs from database (reuse nameToIdMap from validation)
    const itemsPayload = [];
    for (const item of grouped) {
      if (!item.name) {
        setSubmitError(
          "Ein Artikel konnte nicht verarbeitet werden. Bitte lade die Seite neu."
        );
        return;
      }
      
      // Get current ID from database by name
      const itemId = nameToIdMap.get(item.name);
      if (!itemId) {
        setSubmitError(
          `Artikel "${item.name}" konnte nicht gefunden werden. Bitte entferne ihn aus dem Warenkorb.`
        );
        return;
      }
      
      // Ensure qty is a valid number
      const qty = Number(item.qty) || 1;
      if (qty < 1) {
        setSubmitError("Ungültige Artikelmenge.");
        return;
      }
      itemsPayload.push({ itemId: String(itemId), qty });
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
      deliveryFee: deliveryFeeInfo.feeCents,
      distanceKm: deliveryFeeInfo.distanceKm,
      subtotal: subtotalCents,
      total: Math.round(total * 100), // Convert to cents
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
        if (res.status === 401) {
          setSubmitError("Bitte melde dich erneut an, um die Bestellung abzuschließen.");
          localStorage.setItem("redirectAfterLogin", "CheckoutPayment");
          onNavigate("CheckoutLogin");
          return;
        }
        // Validation disabled - restaurant always has everything available
        // If server returns an error, just throw it as-is
        throw new Error(data.error || "Bestellung fehlgeschlagen");
      }

      clearCart();
      setSubmitError(""); // Clear any errors when order is successful
      setCartValidationError(""); // Clear cart validation errors
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
        {/* Validation Error Message */}
        {validationAttempted && Object.keys(errors).length > 0 && (
          <div className="xl:col-span-2 bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-1">
                  Pflichtfelder müssen ausgefüllt werden
                </h3>
                <p className="text-sm text-red-700">
                  Um fortzufahren, bitte fülle alle mit <span className="text-red-500">*</span> markierten Felder aus.
                </p>
                <ul className="mt-2 text-sm text-red-600 list-disc list-inside space-y-1">
                  {errors.name && <li>Name</li>}
                  {errors.email && <li>E-Mail</li>}
                  {errors.phone && <li>Telefonnummer</li>}
                  {errors.street && <li>Straße und Hausnummer</li>}
                  {errors.postalCity && <li>PLZ und Stadt</li>}
                  {errors.time && <li>Lieferzeit</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md p-6 w-full">
          <h2 className="text-xl font-bold mb-4">Bestelldetails</h2>
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

        <div className="bg-white rounded-2xl shadow-md p-6 w-full xl:col-span-2">
          <h2 className="text-xl font-bold mb-4">Bestellübersicht</h2>
          <div className="text-sm text-gray-700 space-y-2">
            <div className="flex justify-between border-b pb-2">
              <button
                className="text-blue-600 underline cursor-pointer"
                onClick={() => setShowItems(true)}
              >
                {totalQuantity} Artikel anzeigen
              </button>
              <span aria-hidden>🍕</span>
            </div>

            <div className="flex justify-between mt-4">
              <span>Zwischensumme</span>
              <span className={subtotal < 20 ? "text-red-600 font-semibold" : ""}>
                {subtotal.toFixed(2)} €
              </span>
            </div>
            {subtotal < 20 && !confirmation && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                ⚠️ Mindestbestellwert: 20,00 € (noch {(20 - subtotal).toFixed(2)} € fehlen)
              </div>
            )}
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <span>Lieferkosten</span>
                <button
                  onClick={() => setShowDeliveryPopup(true)}
                  className="text-blue-600 hover:text-blue-800 underline text-xs"
                  type="button"
                >
                  Info
                </button>
              </div>
              <div className="text-right">
                <span className={deliveryFeeInfo.eligible || confirmation ? "" : "text-red-600"}>
                  {delivery.toFixed(2)} €
                </span>
                {deliveryFeeInfo.distanceKm > 0 && (
                  <div className="text-xs text-gray-500">
                    ({deliveryFeeInfo.distanceKm.toFixed(1)} km)
                  </div>
                )}
              </div>
            </div>
            {!deliveryFeeInfo.eligible && deliveryFeeInfo.reason && !confirmation && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                ⚠️ {deliveryFeeInfo.reason}
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Gesamt</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>


          {submitError && !confirmation && (
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
            disabled={submitting || cart.length === 0 || subtotal < 20}
            className="mt-6 w-full bg-amber-400 py-3 rounded-lg font-semibold hover:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Bestellung wird gesendet…" : "Bestellen & Bezahlen"}
          </button>
          {subtotal < 20 && !confirmation && (
            <p className="mt-2 text-xs text-center text-red-600">
              Mindestbestellwert von 20,00 € nicht erreicht
            </p>
          )}
        </div>
      </div>

      {showItems && (
        <div 
          className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50"
          onClick={() => setShowItems(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowItems(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 absolute top-3 right-3"
              aria-label="Schließen"
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
        <div 
          className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50"
          onClick={() => setEditing(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEditing(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 absolute top-3 right-3"
              aria-label="Schließen"
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
                    setValidationAttempted(false);
                    setForm({ ...form, name: e.target.value });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setEditing(null);
                    }
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
                    setValidationAttempted(false);
                    setForm({ ...form, email: e.target.value });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setEditing(null);
                    }
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
                    setValidationAttempted(false);
                    setForm({ ...form, phone: e.target.value });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setEditing(null);
                    }
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
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <span className="font-semibold">ℹ️ Hinweis:</span> Bitte überprüfe die Adresse vor dem Speichern, besonders die Hausnummer. Die automatische Standorterkennung kann manchmal ungenau sein.
                  </p>
                </div>
                <div className="relative mb-1">
                  <input
                    id="input-street"
                    type="text"
                    placeholder="Straße und Hausnummer"
                    className={`w-full border rounded-lg px-3 py-2 pr-10 ${
                      errors.street ? "border-red-500" : "border-gray-300"
                    }`}
                    value={form.street}
                    onChange={(e) => {
                      setErrors((prev) => ({ ...prev, street: undefined }));
                      setSubmitError("");
                      setValidationAttempted(false);
                      setForm({ ...form, street: e.target.value });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        setEditing(null);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-teal-600 hover:text-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Aktuellen Standort verwenden"
                  >
                    {gettingLocation ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {locationError && (
                  <p className="text-orange-600 text-xs mb-1">{locationError}</p>
                )}
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
                    setValidationAttempted(false);
                    setForm({ ...form, postalCity: e.target.value });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setEditing(null);
                    }
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
                      setValidationAttempted(false);
                      setErrors((prev) => ({ ...prev, time: undefined }));
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
                      setValidationAttempted(false);
                      setErrors((prev) => ({ ...prev, time: undefined }));
                      
                      // Get next 10 days
                      const nextDays = getNextDays(10);
                      const today = nextDays[0];
                      const todayDate = today.date;
                      
                      // Get first available slot for today
                      const availableSlots = getAvailableTimeSlots(todayDate);
                      
                      // Find first day with available slots
                      let selectedDay = today;
                      let selectedSlots = availableSlots;
                      
                      if (availableSlots.length === 0) {
                        // Try tomorrow
                        const tomorrow = nextDays[1];
                        if (tomorrow) {
                          selectedDay = tomorrow;
                          selectedSlots = getAvailableTimeSlots(tomorrow.date);
                        }
                      }
                      
                      const firstSlot = selectedSlots[0] || "12:00";
                      const dayLabel = formatDateLabel(selectedDay.date, selectedDay.isToday, selectedDay.isTomorrow);
                      
                      setForm({
                        ...form,
                        time: {
                          type: "later",
                          date: selectedDay.value,
                          hour: firstSlot,
                          label: `${dayLabel} ${firstSlot} Uhr`,
                        },
                      });
                    }}
                  />
                  <span>Für später planen</span>
                </label>
                {form.time.type === "later" && (
                  <div className="mt-3 space-y-4">
                    <select
                      key={`date-select-${form.time.date || 'none'}`}
                      className="w-full border border-amber-300 rounded-lg px-3 py-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                      value={form.time.date || ""}
                      onChange={(e) => {
                        const selectedDateValue = e.target.value;
                        const selectedDate = new Date(selectedDateValue);
                        const nextDays = getNextDays(10);
                        const selectedDay = nextDays.find(d => d.value === selectedDateValue);
                        
                        if (!selectedDay) return;
                        
                        // Calculate available time slots for the selected date
                        const availableSlots = getAvailableTimeSlots(selectedDate);
                        
                        // If no slots available, try to find next available day
                        if (availableSlots.length === 0) {
                          const currentIndex = nextDays.findIndex(d => d.value === selectedDateValue);
                          for (let i = currentIndex + 1; i < nextDays.length; i++) {
                            const daySlots = getAvailableTimeSlots(nextDays[i].date);
                            if (daySlots.length > 0) {
                              const firstSlot = daySlots[0];
                              const dayLabel = formatDateLabel(nextDays[i].date, nextDays[i].isToday, nextDays[i].isTomorrow);
                              setForm((prev) => ({
                                ...prev,
                                time: {
                                  ...prev.time,
                                  date: nextDays[i].value,
                                  hour: firstSlot,
                                  label: `${dayLabel} ${firstSlot} Uhr`,
                                },
                              }));
                              return;
                            }
                          }
                        } else {
                          const firstAvailableSlot = availableSlots[0] || "12:00";
                          const dayLabel = formatDateLabel(selectedDate, selectedDay.isToday, selectedDay.isTomorrow);
                          setForm((prev) => ({
                            ...prev,
                            time: {
                              ...prev.time,
                              date: selectedDateValue,
                              hour: firstAvailableSlot,
                              label: `${dayLabel} ${firstAvailableSlot} Uhr`,
                            },
                          }));
                        }
                      }}
                    >
                      {(() => {
                        const days = getNextDays(10);
                        console.log("📅 Generating dropdown with", days.length, "days:", days.map(d => d.label));
                        return days.map((day) => {
                          const dayDate = day.date;
                          const availableSlots = getAvailableTimeSlots(dayDate);
                          const isDisabled = availableSlots.length === 0;
                          
                          console.log(`Day: ${day.label}, Slots: ${availableSlots.length}, Disabled: ${isDisabled}`);
                          
                          return (
                            <option 
                              key={day.value} 
                              value={day.value}
                              disabled={isDisabled}
                              style={{ display: 'block' }}
                            >
                              {day.label} {isDisabled ? "(geschlossen)" : ""}
                            </option>
                          );
                        });
                      })()}
                    </select>
                    <select
                      className="w-full border border-amber-300 rounded-lg px-3 py-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                      value={form.time.hour || ""}
                      onChange={(e) => {
                        const selectedHour = e.target.value;
                        if (!form.time.date) return;
                        
                        const selectedDate = new Date(form.time.date);
                        const nextDays = getNextDays(10);
                        const selectedDay = nextDays.find(d => d.value === form.time.date);
                        
                        if (!selectedDay) return;
                        
                        const dayLabel = formatDateLabel(selectedDate, selectedDay.isToday, selectedDay.isTomorrow);
                        
                        setForm((prev) => ({
                          ...prev,
                          time: {
                            ...prev.time,
                            hour: selectedHour,
                            label: `${dayLabel} ${selectedHour} Uhr`,
                          },
                        }));
                      }}
                    >
                      {(() => {
                        if (!form.time.date) {
                          return <option value="">Bitte wähle zuerst ein Datum</option>;
                        }
                        
                        const selectedDate = new Date(form.time.date);
                        const availableSlots = getAvailableTimeSlots(selectedDate);
                        
                        if (availableSlots.length === 0) {
                          return (
                            <option value="" disabled>
                              Keine Slots verfügbar für diesen Tag
                            </option>
                          );
                        }
                        
                        return availableSlots.map((formatted) => (
                          <option key={formatted} value={formatted}>
                            {formatted} Uhr
                          </option>
                        ));
                      })()}
                    </select>
                    {form.time.date && (() => {
                      const selectedDate = new Date(form.time.date);
                      const availableSlots = getAvailableTimeSlots(selectedDate);
                      if (availableSlots.length === 0) {
                        return (
                          <p className="text-sm text-amber-600 mt-2">
                            ⚠️ Keine Slots verfügbar für diesen Tag. Bitte wähle einen anderen Tag.
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                <button
                  onClick={() => {
                    let label = "So schnell wie möglich";
                    if (form.time.type === "later" && form.time.date && form.time.hour) {
                      const selectedDate = new Date(form.time.date);
                      const nextDays = getNextDays(10);
                      const selectedDay = nextDays.find(d => d.value === form.time.date);
                      if (selectedDay) {
                        const dayLabel = formatDateLabel(selectedDate, selectedDay.isToday, selectedDay.isTomorrow);
                        label = `${dayLabel} ${form.time.hour} Uhr`;
                      }
                    }
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

      {showDeliveryPopup && (
        <DeliveryInfoPopup 
          onClose={() => setShowDeliveryPopup(false)} 
          showAtCheckout={true}
        />
      )}
    </div>
  );
}

