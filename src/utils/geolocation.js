// Geolocation utility functions
// Handles getting user's current location and reverse geocoding

/**
 * Get user's current location using browser geolocation API
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number, error: string|null}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: 'Geolocation is not supported by your browser'
      });
      return;
    }

    const options = {
      enableHighAccuracy: true, // Request high accuracy (GPS if available)
      timeout: 15000, // Increased timeout to allow GPS to get accurate fix
      maximumAge: 0 // Don't use cached location
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = position.coords.accuracy; // Accuracy in meters
        const altitude = position.coords.altitude;
        const altitudeAccuracy = position.coords.altitudeAccuracy;
        
        console.log('Location obtained:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: accuracy + ' meters',
          altitude: altitude,
          altitudeAccuracy: altitudeAccuracy
        });
        
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: accuracy,
          error: null
        });
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please check your GPS/WiFi settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or check your internet connection.';
            break;
          default:
            errorMessage = 'An unknown error occurred: ' + error.message;
            break;
        }
        
        console.error('Geolocation error:', error);
        
        resolve({
          latitude: null,
          longitude: null,
          accuracy: null,
          error: errorMessage
        });
      },
      options
    );
  });
};

/**
 * Reverse geocode coordinates to get address
 * Uses a free geocoding service (Nominatim)
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<{address: string, city: string, error: string|null}>}
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    // Using Nominatim (OpenStreetMap) - free and no API key required
    // Increased zoom level for more detailed address
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en`,
      {
        headers: {
          'User-Agent': 'Glory CV Builder App' // Required by Nominatim
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();
    
    if (data.error) {
      return {
        address: null,
        city: null,
        error: data.error
      };
    }

    const addressParts = data.address || {};
    
    // Try multiple fields for city name (different countries use different fields)
    const city = addressParts.city || 
                 addressParts.town || 
                 addressParts.village || 
                 addressParts.municipality ||
                 addressParts.county || 
                 addressParts.state_district ||
                 '';
    
    // Build a more structured address
    const street = addressParts.road || addressParts.street || '';
    const houseNumber = addressParts.house_number || '';
    const neighborhood = addressParts.neighbourhood || addressParts.suburb || '';
    const postcode = addressParts.postcode || '';
    
    let structuredAddress = '';
    if (houseNumber && street) {
      structuredAddress = `${houseNumber} ${street}`;
    } else if (street) {
      structuredAddress = street;
    }
    
    if (neighborhood) {
      structuredAddress += structuredAddress ? `, ${neighborhood}` : neighborhood;
    }
    
    if (city) {
      structuredAddress += structuredAddress ? `, ${city}` : city;
    }
    
    if (postcode) {
      structuredAddress += structuredAddress ? ` ${postcode}` : postcode;
    }
    
    // Use structured address if available, otherwise fall back to display_name
    const fullAddress = structuredAddress || data.display_name || '';

    console.log('Reverse geocoding result:', {
      coordinates: `${latitude}, ${longitude}`,
      city: city,
      address: fullAddress,
      rawData: addressParts
    });

    return {
      address: fullAddress,
      city: city,
      error: null
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      address: null,
      city: null,
      error: error.message || 'Failed to get address from coordinates'
    };
  }
};

/**
 * Get user's location and reverse geocode to get address
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number, address: string, city: string, error: string|null}>}
 */
export const getLocationWithAddress = async () => {
  const location = await getCurrentLocation();
  
  if (location.error || !location.latitude || !location.longitude) {
    return {
      ...location,
      address: null,
      city: null
    };
  }

  // Show accuracy warning if accuracy is poor
  if (location.accuracy && location.accuracy > 100) {
    console.warn(`Location accuracy is ${location.accuracy} meters. This may affect address accuracy.`);
  }

  const geocode = await reverseGeocode(location.latitude, location.longitude);
  
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    address: geocode.address,
    city: geocode.city,
    error: geocode.error || location.error
  };
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
