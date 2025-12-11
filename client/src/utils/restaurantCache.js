// Restaurant Cache Utility for Performance Optimization
class RestaurantCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 10 * 60 * 1000; // 10 minutes
    this.searchTTL = 5 * 60 * 1000; // 5 minutes for search results
  }

  // Generate cache key
  generateKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${endpoint}_${JSON.stringify(sortedParams)}`;
  }

  // Get cached data
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Set cached data
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      timestamp: Date.now()
    });
  }

  // Clear specific cache
  clear(key) {
    this.cache.delete(key);
  }

  // Clear all cache
  clearAll() {
    this.cache.clear();
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Preload restaurants
  async preloadRestaurants(axios) {
    const key = this.generateKey('restaurants');
    if (this.get(key)) return; // Already cached
    
    try {
      const { data } = await axios.get('/api/restaurants', {
        headers: { 'Cache-Control': 'max-age=600' },
        timeout: 10000
      });
      
      this.set(key, data);
      return data;
    } catch (error) {
      console.error('Error preloading restaurants:', error);
      return null;
    }
  }

  // Optimized restaurant fetch with caching
  async fetchRestaurants(axios, useCache = true) {
    const key = this.generateKey('restaurants');
    
    if (useCache) {
      const cached = this.get(key);
      if (cached) return cached;
    }
    
    try {
      const { data } = await axios.get('/api/restaurants', {
        headers: { 
          'Cache-Control': 'max-age=600',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      this.set(key, data);
      return data;
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }
  }

  // Optimized search with caching
  async searchRestaurants(axios, query, filters = {}, useCache = true) {
    const key = this.generateKey('search', { q: query, ...filters });
    
    if (useCache) {
      const cached = this.get(key);
      if (cached) return cached;
    }
    
    try {
      const params = { q: query, ...filters };
      const { data } = await axios.get('/api/restaurants/search', {
        params,
        headers: { 
          'Cache-Control': 'max-age=300',
          'Accept': 'application/json'
        },
        timeout: 8000
      });
      
      this.set(key, data, this.searchTTL);
      return data;
    } catch (error) {
      console.error('Error searching restaurants:', error);
      throw error;
    }
  }

  // Optimized nearby restaurants with caching
  async fetchNearbyRestaurants(axios, latitude, longitude, useCache = true) {
    const key = this.generateKey('nearby', { 
      lat: latitude.toFixed(4), 
      lng: longitude.toFixed(4) 
    });
    
    if (useCache) {
      const cached = this.get(key);
      if (cached) return cached;
    }
    
    try {
      const { data } = await axios.post('/api/restaurants/nearby', {
        latitude,
        longitude
      }, {
        headers: { 
          'Cache-Control': 'max-age=300',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      this.set(key, data, this.searchTTL);
      return data;
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
      throw error;
    }
  }

  // Get restaurant by ID with caching
  async fetchRestaurantById(axios, id, useCache = true) {
    const key = this.generateKey('restaurant', { id });
    
    if (useCache) {
      const cached = this.get(key);
      if (cached) return cached;
    }
    
    try {
      const { data } = await axios.get(`/api/restaurants/${id}`, {
        headers: { 
          'Cache-Control': 'max-age=600',
          'Accept': 'application/json'
        },
        timeout: 8000
      });
      
      this.set(key, data);
      return data;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      throw error;
    }
  }

  // Invalidate related caches when restaurant data changes
  invalidateRestaurantCaches(restaurantId = null) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes('restaurants') || 
          key.includes('search') || 
          key.includes('nearby') ||
          (restaurantId && key.includes(restaurantId))) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Invalidated ${keysToDelete.length} restaurant cache entries`);
  }
}

// Create singleton instance
export const restaurantCache = new RestaurantCache();

// Export utility functions
export const useRestaurantCache = () => {
  return {
    fetchRestaurants: (axios, useCache) => restaurantCache.fetchRestaurants(axios, useCache),
    searchRestaurants: (axios, query, filters, useCache) => 
      restaurantCache.searchRestaurants(axios, query, filters, useCache),
    fetchNearbyRestaurants: (axios, lat, lng, useCache) => 
      restaurantCache.fetchNearbyRestaurants(axios, lat, lng, useCache),
    fetchRestaurantById: (axios, id, useCache) => 
      restaurantCache.fetchRestaurantById(axios, id, useCache),
    preloadRestaurants: (axios) => restaurantCache.preloadRestaurants(axios),
    invalidateCache: (restaurantId) => restaurantCache.invalidateRestaurantCaches(restaurantId),
    clearCache: () => restaurantCache.clearAll(),
    getCacheStats: () => restaurantCache.getStats()
  };
};

export default restaurantCache;