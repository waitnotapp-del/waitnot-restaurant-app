/**
 * Address resolution utilities for converting coordinates to human-readable addresses
 */

// Cache for storing resolved addresses to avoid repeated API calls
const addressCache = new Map();

/**
 * Convert latitude/longitude coordinates to human-readable address
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {boolean} useCache - Whether to use cached results (default: true)
 * @returns {Promise<string>} Human-readable address
 */
export async function resolveAddress(latitude, longitude, useCache = true) {
  if (!latitude || !longitude) {
    return `${latitude || 'N/A'}, ${longitude || 'N/A'}`;
  }

  const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  
  // Check cache first
  if (useCache && addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey);
  }

  try {
    let address = null;
    
    // Try multiple geocoding services for better reliability
    
    // 1. Try OpenCage Geocoding API (free tier available)
    try {
      const openCageResponse = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=demo&limit=1&no_annotations=1&language=en`
      );
      
      if (openCageResponse.ok) {
        const data = await openCageResponse.json();
        if (data.results && data.results.length > 0) {
          address = data.results[0].formatted;
          console.log('✅ Address resolved via OpenCage:', address);
        }
      }
    } catch (error) {
      console.log('OpenCage API failed, trying alternative...');
    }

    // 2. Fallback to Nominatim (OpenStreetMap) - free but rate limited
    if (!address) {
      try {
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'WaitNot-Restaurant-App/1.0'
            }
          }
        );
        
        if (nominatimResponse.ok) {
          const data = await nominatimResponse.json();
          if (data.display_name) {
            address = data.display_name;
            console.log('✅ Address resolved via Nominatim:', address);
          }
        }
      } catch (error) {
        console.log('Nominatim API failed, trying alternative...');
      }
    }

    // 3. Try BigDataCloud (free tier available)
    if (!address) {
      try {
        const bigDataResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        
        if (bigDataResponse.ok) {
          const data = await bigDataResponse.json();
          if (data.locality || data.city) {
            const parts = [
              data.locality || data.city,
              data.principalSubdivision,
              data.countryName
            ].filter(Boolean);
            address = parts.join(', ');
            console.log('✅ Address resolved via BigDataCloud:', address);
          }
        }
      } catch (error) {
        console.log('BigDataCloud API failed');
      }
    }

    // 4. Final fallback - create a readable coordinate string
    if (!address) {
      address = `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
      console.log('📍 Using coordinate fallback:', address);
    }

    // Cache the result
    if (useCache) {
      addressCache.set(cacheKey, address);
    }

    return address;

  } catch (error) {
    console.error('Error resolving address:', error);
    return `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
  }
}

/**
 * Resolve addresses for multiple locations in batch
 * @param {Array} locations - Array of {latitude, longitude} objects
 * @returns {Promise<Array>} Array of resolved addresses
 */
export async function resolveAddressesBatch(locations) {
  const promises = locations.map(location => 
    resolveAddress(location.latitude, location.longitude)
  );
  
  try {
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error resolving addresses in batch:', error);
    return locations.map(loc => `${loc.latitude?.toFixed(4) || 'N/A'}°N, ${loc.longitude?.toFixed(4) || 'N/A'}°E`);
  }
}

/**
 * Get a short version of an address (city, state)
 * @param {string} fullAddress - Full address string
 * @returns {string} Shortened address
 */
export function getShortAddress(fullAddress) {
  if (!fullAddress || typeof fullAddress !== 'string') {
    return fullAddress || 'Unknown location';
  }

  // Split by comma and take relevant parts
  const parts = fullAddress.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    // Take city and state/region (skip street address)
    return parts.slice(-3, -1).join(', ');
  } else if (parts.length >= 2) {
    // Take last two parts
    return parts.slice(-2).join(', ');
  }
  
  return fullAddress;
}

/**
 * Clear the address cache (useful for testing or memory management)
 */
export function clearAddressCache() {
  addressCache.clear();
  console.log('📍 Address cache cleared');
}

/**
 * Get cache statistics
 * @returns {object} Cache statistics
 */
export function getAddressCacheStats() {
  return {
    size: addressCache.size,
    keys: Array.from(addressCache.keys())
  };
}