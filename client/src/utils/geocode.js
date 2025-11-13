// Geocoding utility using OpenStreetMap Nominatim API (free, no API key needed)

export async function geocodeAddress(address) {
  if (!address) return null;

  try {
    // Use Nominatim API for geocoding
    const encodedAddress = encodeURIComponent(address + ", Leipzig, Germany");
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BellaBiladi-Delivery-App' // Required by Nominatim
      }
    });

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

