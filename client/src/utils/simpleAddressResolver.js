/**
 * Simple and reliable address resolution utility
 * Converts coordinates to human-readable addresses with multiple fallbacks
 */

// Simple cache to avoid repeated API calls
const addressCache = new Map();

/**
 * Convert coordinates to human-readable address with multiple API fallbacks
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string>} Human-readable address
 */
export async function getReadableAddress(lat, lon) {
  if (!lat || !lon) {
    return `${lat || 'N/A'}, ${lon || 'N/A'}`;
  }

  const cacheKey = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  
  // Check cache first
  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey);
  }

  let address = null;

  try {
    // Method 1: Try BigDataCloud (most reliable free API)
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        { timeout: 5000 }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.city || data.locality) {
          const parts = [
            data.locality || data.city,
            data.principalSubdivision,
            data.countryName
          ].filter(Boolean);
          address = parts.join(', ');
          console.log('✅ Address from BigDataCloud:', address);
        }
      }
    } catch (error) {
      console.log('BigDataCloud failed, trying next...');
    }

    // Method 2: Try Nominatim if BigDataCloud failed
    if (!address) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
          {
            headers: { 'User-Agent': 'WaitNot-App/1.0' },
            timeout: 5000
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.display_name) {
            // Extract meaningful parts from the full address
            const parts = data.display_name.split(',').map(p => p.trim());
            if (parts.length >= 3) {
              // Take city, state, country (skip street details)
              address = parts.slice(-3).join(', ');
            } else {
              address = data.display_name;
            }
            console.log('✅ Address from Nominatim:', address);
          }
        }
      } catch (error) {
        console.log('Nominatim failed, trying next...');
      }
    }

    // Method 3: Try OpenCage as final fallback
    if (!address) {
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=demo&limit=1&no_annotations=1`,
          { timeout: 5000 }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results[0]) {
            address = data.results[0].formatted;
            console.log('✅ Address from OpenCage:', address);
          }
        }
      } catch (error) {
        console.log('OpenCage failed');
      }
    }

    // Final fallback: Create readable coordinate string
    if (!address) {
      address = `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
      console.log('📍 Using coordinate fallback:', address);
    }

    // Cache the result
    addressCache.set(cacheKey, address);
    return address;

  } catch (error) {
    console.error('Error resolving address:', error);
    return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
  }
}

/**
 * Get a short version of an address (just city, state)
 * @param {string} fullAddress - Full address string
 * @returns {string} Short address
 */
export function getShortAddress(fullAddress) {
  if (!fullAddress) return 'Unknown location';
  
  const parts = fullAddress.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return parts.slice(0, 2).join(', ');
  }
  return fullAddress;
}

/**
 * Clear address cache
 */
export function clearCache() {
  addressCache.clear();
}