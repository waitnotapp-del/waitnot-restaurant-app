// Geocoding utilities for converting coordinates to addresses

/**
 * Convert latitude and longitude to a human-readable address
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Address information
 */
export async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data = await response.json();
    
    if (!data || data.error) {
      throw new Error('No address found for these coordinates');
    }
    
    return {
      success: true,
      displayName: data.display_name,
      address: {
        house_number: data.address?.house_number || '',
        road: data.address?.road || '',
        neighbourhood: data.address?.neighbourhood || '',
        suburb: data.address?.suburb || '',
        city: data.address?.city || data.address?.town || data.address?.village || '',
        state: data.address?.state || '',
        postcode: data.address?.postcode || '',
        country: data.address?.country || '',
        country_code: data.address?.country_code || ''
      },
      formatted: formatAddress(data.address),
      coordinates: {
        lat: parseFloat(data.lat),
        lon: parseFloat(data.lon)
      },
      raw: data
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      success: false,
      error: error.message,
      displayName: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
      formatted: `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`
    };
  }
}

/**
 * Format address components into a readable string
 * @param {Object} address - Address components from Nominatim
 * @returns {string} Formatted address
 */
function formatAddress(address) {
  if (!address) return '';
  
  const parts = [];
  
  // Building number and street
  if (address.house_number && address.road) {
    parts.push(`${address.house_number} ${address.road}`);
  } else if (address.road) {
    parts.push(address.road);
  }
  
  // Neighbourhood or suburb
  if (address.neighbourhood) {
    parts.push(address.neighbourhood);
  } else if (address.suburb) {
    parts.push(address.suburb);
  }
  
  // City
  if (address.city || address.town || address.village) {
    parts.push(address.city || address.town || address.village);
  }
  
  // State and postcode
  const statePostcode = [];
  if (address.state) statePostcode.push(address.state);
  if (address.postcode) statePostcode.push(address.postcode);
  if (statePostcode.length > 0) {
    parts.push(statePostcode.join(' '));
  }
  
  // Country (only if not local)
  if (address.country && address.country_code !== 'in') {
    parts.push(address.country);
  }
  
  return parts.join(', ');
}

/**
 * Get short address (city, state format)
 * @param {Object} address - Address components
 * @returns {string} Short formatted address
 */
export function getShortAddress(address) {
  if (!address) return '';
  
  const parts = [];
  
  // City
  if (address.city || address.town || address.village) {
    parts.push(address.city || address.town || address.village);
  }
  
  // State
  if (address.state) {
    parts.push(address.state);
  }
  
  return parts.join(', ');
}

/**
 * Convert address string to coordinates (forward geocoding)
 * @param {string} address - Address string to geocode
 * @returns {Promise<Object>} Coordinates and address info
 */
export async function forwardGeocode(address) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('No coordinates found for this address');
    }
    
    const result = data[0];
    
    return {
      success: true,
      coordinates: {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
      },
      displayName: result.display_name,
      address: result.address,
      formatted: formatAddress(result.address),
      raw: result
    };
  } catch (error) {
    console.error('Forward geocoding error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Batch reverse geocode multiple coordinates
 * @param {Array} coordinates - Array of {lat, lon} objects
 * @returns {Promise<Array>} Array of address results
 */
export async function batchReverseGeocode(coordinates) {
  const results = [];
  
  // Process in batches to avoid rate limiting
  for (let i = 0; i < coordinates.length; i++) {
    const { lat, lon } = coordinates[i];
    
    try {
      const result = await reverseGeocode(lat, lon);
      results.push(result);
      
      // Add delay between requests to respect rate limits
      if (i < coordinates.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        coordinates: { lat, lon }
      });
    }
  }
  
  return results;
}

/**
 * Check if coordinates are valid
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} True if valid coordinates
 */
export function isValidCoordinates(lat, lon) {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180 &&
    !isNaN(lat) &&
    !isNaN(lon)
  );
}

/**
 * Get distance between two coordinates in kilometers
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in kilometers
 */
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}