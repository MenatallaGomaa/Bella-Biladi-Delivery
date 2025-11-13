// Restaurant location: Probstheidaer Straße 21, 04277 Leipzig, Germany
// Coordinates for Probstheidaer Straße 21, Leipzig
export const RESTAURANT_LOCATION = {
  latitude: 51.3208, // Probstheidaer Straße 21, 04277 Leipzig (approximate)
  longitude: 12.4203,
  address: "Probstheidaer Straße 21, 04277 Leipzig, Germany",
};

// Initialize restaurant coordinates via geocoding on first load
let restaurantCoordsInitialized = false;

export async function initializeRestaurantCoords() {
  if (restaurantCoordsInitialized) return RESTAURANT_LOCATION;
  
  try {
    const encodedAddress = encodeURIComponent(RESTAURANT_LOCATION.address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BellaBiladi-Delivery-App'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        RESTAURANT_LOCATION.latitude = parseFloat(data[0].lat);
        RESTAURANT_LOCATION.longitude = parseFloat(data[0].lon);
        restaurantCoordsInitialized = true;
        console.log("Restaurant coordinates geocoded:", RESTAURANT_LOCATION);
      }
    }
  } catch (error) {
    console.warn("Could not geocode restaurant address, using default coordinates:", error);
  }
  
  return RESTAURANT_LOCATION;
}

// Helper to ensure driver always starts at restaurant
export function getDriverLocation(driverLocation, restaurantCoords = RESTAURANT_LOCATION) {
  // If no driver location provided, return restaurant location
  if (!driverLocation || !driverLocation.latitude || !driverLocation.longitude) {
    return {
      latitude: restaurantCoords.latitude,
      longitude: restaurantCoords.longitude,
      isAtRestaurant: true,
    };
  }
  
  // Driver has moved from restaurant
  return {
    latitude: driverLocation.latitude,
    longitude: driverLocation.longitude,
    driverName: driverLocation.driverName,
    isAtRestaurant: false,
  };
}

