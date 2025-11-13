import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RESTAURANT_LOCATION, getDriverLocation, initializeRestaurantCoords } from "../utils/restaurantLocation";
import { geocodeAddress } from "../utils/geocode";

// Fix for default marker icons in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Create bike icon for driver
const createBikeIcon = () => {
  return L.divIcon({
    className: "bike-icon",
    html: `<div style="
      font-size: 32px;
      text-align: center;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    ">🚴</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Create restaurant icon
const createRestaurantIcon = () => {
  return L.divIcon({
    className: "restaurant-icon",
    html: `<div style="
      font-size: 28px;
      text-align: center;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    ">🍕</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

// Create customer location icon ("You are here")
const createCustomerIcon = () => {
  return L.divIcon({
    className: "customer-icon",
    html: `<div style="
      background: black;
      color: white;
      padding: 6px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: bold;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">Sie sind hier</div>`,
    iconSize: [100, 30],
    iconAnchor: [50, 30],
    popupAnchor: [0, -30],
  });
};

export default function DriverMap({ driverLocation, customerAddress, orderId, height = "256px" }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const restaurantMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const [customerCoords, setCustomerCoords] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [restaurantCoords, setRestaurantCoords] = useState(RESTAURANT_LOCATION);

  // Initialize restaurant coordinates on mount
  useEffect(() => {
    initializeRestaurantCoords().then(coords => {
      setRestaurantCoords(coords);
    });
  }, []);

  // Geocode customer address
  useEffect(() => {
    if (!customerAddress) {
      setCustomerCoords(null);
      return;
    }

    const fetchCustomerLocation = async () => {
      setGeocoding(true);
      const coords = await geocodeAddress(customerAddress);
      setCustomerCoords(coords);
      setGeocoding(false);
    };

    fetchCustomerLocation();
  }, [customerAddress]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Driver ALWAYS starts at restaurant location (Probstheidaer Straße 21)
    // Use helper function with restaurantCoords to ensure correct logic
    const driverPos = getDriverLocation(driverLocation, restaurantCoords);
    const driverLat = driverPos.latitude;
    const driverLng = driverPos.longitude;
    const hasActualLocation = !driverPos.isAtRestaurant;

    // Use geocoded customer location or fallback to approximate if geocoding fails
    const customerLat = customerCoords?.latitude || restaurantCoords.latitude + 0.01;
    const customerLng = customerCoords?.longitude || restaurantCoords.longitude + 0.01;

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current && mapRef.current) {
      try {
        const map = L.map(mapRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
        });

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        
        // Invalidate size to ensure map renders correctly
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 100);

        // Add restaurant marker (always show) - use restaurantCoords state
        const restaurantMarker = L.marker(
          [restaurantCoords.latitude, restaurantCoords.longitude],
          { icon: createRestaurantIcon() }
        )
          .addTo(map)
          .bindPopup(`<b>Bella Biladi</b><br>${restaurantCoords.address}`);

        restaurantMarkerRef.current = restaurantMarker;

        // Add customer marker ("You are here") - only if we have customer address
        if (customerAddress) {
          const customerMarker = L.marker([customerLat, customerLng], {
            icon: createCustomerIcon(),
          })
            .addTo(map)
            .bindPopup(`<b>Sie sind hier</b><br>${customerAddress}`);

          customerMarkerRef.current = customerMarker;
        }

        // Add route line from restaurant to customer (teal color like reference)
        // Only show route if we have customer coordinates
        if (customerCoords || customerAddress) {
          const routePoints = [
            [restaurantCoords.latitude, restaurantCoords.longitude],
            [customerLat, customerLng],
          ];

          const routeLine = L.polyline(routePoints, {
            color: "#14b8a6", // teal-500
            weight: 4,
            opacity: 0.8,
          }).addTo(map);

          routeLineRef.current = routeLine;
        }

        // Add driver marker - ALWAYS starts at restaurant location (Probstheidaer Straße 21)
        // This ensures the driver icon is always visible at the starting point
        const driverMarker = L.marker([driverLat, driverLng], {
          icon: createBikeIcon(),
          zIndexOffset: 1000, // Ensure driver marker is always on top
        })
          .addTo(map)
          .bindPopup(
          `<b>Fahrer</b><br>${driverPos.driverName || "Bereit am Restaurant"}<br>${
            hasActualLocation ? "Unterwegs" : `Startpunkt: ${restaurantCoords.address}`
          }`
          );
        
        // Debug: Log driver position to verify it's at restaurant
        console.log("🚴 Driver marker position:", {
          driverLat,
          driverLng,
          restaurantLat: restaurantCoords.latitude,
          restaurantLng: restaurantCoords.longitude,
          isAtRestaurant: driverPos.isAtRestaurant,
          hasActualLocation,
          driverLocationProvided: !!driverLocation
        });

        driverMarkerRef.current = driverMarker;

        // Fit bounds to show restaurant, customer (if available), and driver
        const boundsPoints = [
          [restaurantCoords.latitude, restaurantCoords.longitude],
          [driverLat, driverLng],
        ];
        
        if (customerCoords || customerAddress) {
          boundsPoints.push([customerLat, customerLng]);
        }
        
        const bounds = L.latLngBounds(boundsPoints);
        map.fitBounds(bounds, { padding: [50, 50] });
        
        // Ensure map is properly sized after rendering
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 200);
      } catch (error) {
        console.error("Error initializing map:", error);
        return;
      }
    } else {
      // Update driver marker position if map already exists
      if (driverMarkerRef.current) {
        const newLatLng = [driverLat, driverLng];
        driverMarkerRef.current.setLatLng(newLatLng);
        
        // Update popup - recalculate driver position with current restaurant coords
        const currentDriverPos = getDriverLocation(driverLocation, restaurantCoords);
        const currentDriverLat = currentDriverPos.latitude;
        const currentDriverLng = currentDriverPos.longitude;
        
        driverMarkerRef.current.setPopupContent(
          `<b>Fahrer</b><br>${currentDriverPos.driverName || "Bereit am Restaurant"}<br>${
            !currentDriverPos.isAtRestaurant ? "Unterwegs" : `Startpunkt: ${restaurantCoords.address}`
          }`
        );
        
        // Update marker position if it changed (e.g., restaurant coords were geocoded)
        if (currentDriverPos.isAtRestaurant) {
          driverMarkerRef.current.setLatLng([currentDriverLat, currentDriverLng]);
        }

        // Update route line to include driver position if moving
        if (hasActualLocation && routeLineRef.current && (customerCoords || customerAddress)) {
          const routePoints = [
            [restaurantCoords.latitude, restaurantCoords.longitude],
            [driverLat, driverLng],
            [customerLat, customerLng],
          ];
          routeLineRef.current.setLatLngs(routePoints);
        }

        // Update customer marker position if geocoding completed
        if (customerMarkerRef.current && (customerCoords || customerAddress)) {
          customerMarkerRef.current.setLatLng([customerLat, customerLng]);
        }

        // Fit bounds to show all markers
        const boundsPoints = [
          [restaurantCoords.latitude, restaurantCoords.longitude],
          [driverLat, driverLng],
        ];
        
        if (customerCoords || customerAddress) {
          boundsPoints.push([customerLat, customerLng]);
        }
        
        const bounds = L.latLngBounds(boundsPoints);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        driverMarkerRef.current = null;
        restaurantMarkerRef.current = null;
        customerMarkerRef.current = null;
        routeLineRef.current = null;
      }
    };
  }, [driverLocation, customerAddress, orderId, customerCoords, restaurantCoords]);

  return (
    <div
      ref={mapRef}
      id={`map-${orderId}`}
      style={{ height, width: "100%", zIndex: 0, minHeight: height }}
      className="rounded-lg"
    />
  );
}

