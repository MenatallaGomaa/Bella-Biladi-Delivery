// Geocoding utility using OpenStreetMap Nominatim API (free, no API key needed)

export async function geocodeAddress(address) {
  if (!address) return null;

  try {
    // Clean up the address
    let cleanAddress = address.trim();
    
    // Remove duplicate "Leipzig" if present multiple times
    const parts = cleanAddress.split(',').map(p => p.trim()).filter(Boolean);
    const uniqueParts = [];
    const seen = new Set();
    
    for (const part of parts) {
      const lowerPart = part.toLowerCase();
      // Skip duplicate Leipzig or Germany
      if ((lowerPart === 'leipzig' || lowerPart === 'germany' || lowerPart === 'deutschland') && seen.has(lowerPart)) {
        continue;
      }
      seen.add(lowerPart);
      uniqueParts.push(part);
    }
    
    cleanAddress = uniqueParts.join(', ');
    
    // Ensure we have Leipzig and Germany
    const hasLeipzig = cleanAddress.toLowerCase().includes('leipzig');
    const hasGermany = cleanAddress.toLowerCase().includes('germany') || cleanAddress.toLowerCase().includes('deutschland');
    
    if (!hasLeipzig) {
      cleanAddress = `${cleanAddress}, Leipzig`;
    }
    if (!hasGermany) {
      cleanAddress = `${cleanAddress}, Germany`;
    }
    
    // Try multiple address formats
    const addressVariations = [
      cleanAddress,
      cleanAddress.replace(/, Leipzig, Germany$/, ', Germany'), // Remove duplicate Leipzig
      address.trim() + ', Leipzig, Germany', // Original with additions
    ];
    
    for (const addressToTry of addressVariations) {
      try {
        const encodedAddress = encodeURIComponent(addressToTry);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=5&addressdetails=1`;
        
        console.log('🔍 Geocoding address:', addressToTry);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'BellaBiladi-Delivery-App' // Required by Nominatim
          }
        });

        if (!response.ok) {
          console.warn('⚠️ Geocoding API error:', response.status, response.statusText);
          continue; // Try next variation
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
          // Try to find the best match - prefer results with house numbers
          let bestMatch = data[0];
          
          // If we have multiple results, try to find one that matches better
          if (data.length > 1) {
            const streetPart = address.split(',')[0].toLowerCase().trim();
            const betterMatch = data.find(result => {
              const displayName = (result.display_name || '').toLowerCase();
              return displayName.includes(streetPart);
            });
            if (betterMatch) {
              bestMatch = betterMatch;
            }
          }
          
          const result = {
            latitude: parseFloat(bestMatch.lat),
            longitude: parseFloat(bestMatch.lon),
            displayName: bestMatch.display_name,
          };
          
          console.log('✅ Geocoding success:', result);
          return result;
        }
      } catch (err) {
        console.warn('⚠️ Geocoding attempt failed:', err.message);
        continue; // Try next variation
      }
      
      // Add small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.warn('⚠️ No geocoding results found for any variation of:', address);
    return null;
  } catch (error) {
    console.error('❌ Geocoding error:', error);
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
