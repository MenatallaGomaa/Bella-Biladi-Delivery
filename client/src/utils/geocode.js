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

// Reverse geocoding: convert coordinates to address
export async function reverseGeocode(latitude, longitude) {
  try {
    // Use zoom level 18 for more precise address details (house number level)
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BellaBiladi-Delivery-App' // Required by Nominatim
      }
    });

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      
      // Try to get the most accurate house number
      // Nominatim can return house_number, house, or building number
      const houseNumber = addr.house_number || addr.house || addr.building || '';
      
      // Get street name
      const streetName = addr.road || addr.pedestrian || addr.path || '';
      
      // Combine street name and house number
      const street = [streetName, houseNumber].filter(Boolean).join(' ').trim();
      
      // Get postal code and city
      const postcode = addr.postcode || '';
      const city = addr.city || addr.town || addr.village || addr.municipality || '';
      const postalCity = [postcode, city].filter(Boolean).join(' ').trim();
      
      // If we don't have a good street from address components, try parsing display_name
      let finalStreet = street;
      if (!finalStreet && data.display_name) {
        // Try to extract street and house number from display_name
        // Format is usually: "house_number, street, city, ..."
        const parts = data.display_name.split(',');
        if (parts.length >= 2) {
          // First part is usually house number, second is street
          const houseNum = parts[0].trim();
          const streetNameFromDisplay = parts[1].trim();
          finalStreet = [streetNameFromDisplay, houseNum].filter(Boolean).join(' ').trim();
        }
      }
      
      return {
        street: finalStreet || '',
        postalCity: postalCity || '',
        fullAddress: data.display_name || '',
      };
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
