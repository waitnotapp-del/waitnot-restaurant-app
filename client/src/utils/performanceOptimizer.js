// Global Performance Optimization Utilities
import { useState, useEffect, useCallback, useMemo } from 'react';

// Global cache for API responses
class GlobalCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.maxSize = 100; // Maximum cache entries
  }

  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${url}_${JSON.stringify(sortedParams)}`;
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, cached);
    
    return cached.data;
  }

  set(key, data, ttl = this.defaultTTL) {
    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      timestamp: Date.now()
    });
  }

  clear(pattern) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton cache instance
export const globalCache = new GlobalCache();

// Debounce hook for performance
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for performance
export function useThrottle(callback, delay) {
  const [lastRun, setLastRun] = useState(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun >= delay) {
      callback(...args);
      setLastRun(Date.now());
    }
  }, [callback, delay, lastRun]);
}

// Optimized API hook with caching
export function useOptimizedAPI(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    dependencies = [],
    ttl = 5 * 60 * 1000, // 5 minutes
    enabled = true,
    params = {},
    onSuccess,
    onError
  } = options;

  const cacheKey = useMemo(() => 
    globalCache.generateKey(url, params), 
    [url, params]
  );

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = globalCache.get(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        onSuccess?.(cached);
        return;
      }

      // Import axios dynamically to avoid circular dependencies
      const { default: axios } = await import('axios');
      
      const response = await axios.get(url, {
        params,
        headers: {
          'Cache-Control': `max-age=${Math.floor(ttl / 1000)}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      const responseData = response.data;
      
      // Cache the response
      globalCache.set(cacheKey, responseData, ttl);
      
      setData(responseData);
      onSuccess?.(responseData);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'Failed to fetch data');
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [url, cacheKey, enabled, ttl, onSuccess, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = useCallback(() => {
    globalCache.clear(cacheKey);
    fetchData();
  }, [cacheKey, fetchData]);

  return { data, loading, error, refetch };
}

// Image optimization utilities
export const ImageOptimizer = {
  // Lazy load images
  createLazyImage: (src, alt, className = '') => {
    return {
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNjY2MiLz48L3N2Zz4=',
      'data-src': src,
      alt,
      className: `${className} lazy-image`,
      loading: 'lazy'
    };
  },

  // Initialize lazy loading
  initLazyLoading: () => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy-image');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll('.lazy-image').forEach(img => {
        imageObserver.observe(img);
      });
    }
  },

  // Optimize image URL (add compression parameters)
  optimizeImageUrl: (url, options = {}) => {
    if (!url || url.startsWith('data:')) return url;
    
    const { width, height, quality = 80, format = 'webp' } = options;
    
    // For external images, return as-is (would need image service)
    if (url.startsWith('http')) {
      return url;
    }
    
    return url;
  }
};

// Performance monitoring
export const PerformanceMonitor = {
  // Measure component render time
  measureRender: (componentName) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`${componentName} render time: ${(end - start).toFixed(2)}ms`);
    };
  },

  // Measure API call time
  measureAPI: (apiName) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`${apiName} API time: ${(end - start).toFixed(2)}ms`);
    };
  },

  // Get performance metrics
  getMetrics: () => {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    }
    return null;
  }
};

// Bundle optimization utilities
export const BundleOptimizer = {
  // Preload critical resources
  preloadResource: (href, as = 'script') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },

  // Prefetch non-critical resources
  prefetchResource: (href) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  },

  // Preconnect to external domains
  preconnectDomain: (domain) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    document.head.appendChild(link);
  }
};

// Memory optimization
export const MemoryOptimizer = {
  // Clean up event listeners
  cleanupEventListeners: (element, events) => {
    events.forEach(({ event, handler }) => {
      element.removeEventListener(event, handler);
    });
  },

  // Optimize large lists with virtualization
  calculateVisibleItems: (containerHeight, itemHeight, scrollTop, buffer = 5) => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + buffer * 2;
    return { startIndex, visibleCount };
  }
};

// Export performance optimization hook
export function usePerformanceOptimization() {
  useEffect(() => {
    // Initialize lazy loading
    ImageOptimizer.initLazyLoading();

    // Preconnect to common domains
    BundleOptimizer.preconnectDomain('https://fonts.googleapis.com');
    BundleOptimizer.preconnectDomain('https://fonts.gstatic.com');

    // Log performance metrics
    setTimeout(() => {
      const metrics = PerformanceMonitor.getMetrics();
      if (metrics) {
        console.log('Performance Metrics:', metrics);
      }
    }, 2000);
  }, []);

  return {
    globalCache,
    ImageOptimizer,
    PerformanceMonitor,
    BundleOptimizer,
    MemoryOptimizer
  };
}

export default {
  globalCache,
  useDebounce,
  useThrottle,
  useOptimizedAPI,
  ImageOptimizer,
  PerformanceMonitor,
  BundleOptimizer,
  MemoryOptimizer,
  usePerformanceOptimization
};