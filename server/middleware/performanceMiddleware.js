// Performance optimization middleware for Express.js
import compression from 'compression';
import helmet from 'helmet';

// Response compression middleware
export const compressionMiddleware = compression({
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Fallback to standard filter function
    return compression.filter(req, res);
  },
  level: 6, // Compression level (1-9, 6 is good balance)
  threshold: 1024, // Only compress responses larger than 1KB
});

// Security headers middleware
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Cache control middleware
export const cacheMiddleware = (maxAge = 300) => {
  return (req, res, next) => {
    // Set cache headers for GET requests
    if (req.method === 'GET') {
      res.set({
        'Cache-Control': `public, max-age=${maxAge}`,
        'ETag': `"${Date.now()}"`,
        'Vary': 'Accept-Encoding',
      });
    }
    next();
  };
};

// Request timing middleware
export const timingMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
    }
    
    // Add timing header
    res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
  });
  
  next();
};

// Rate limiting middleware (simple implementation)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

export const rateLimitMiddleware = (req, res, next) => {
  const clientId = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Clean old entries
  for (const [id, data] of requestCounts.entries()) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
      requestCounts.delete(id);
    }
  }
  
  // Check current client
  const clientData = requestCounts.get(clientId);
  
  if (!clientData) {
    requestCounts.set(clientId, {
      count: 1,
      firstRequest: now
    });
  } else if (now - clientData.firstRequest < RATE_LIMIT_WINDOW) {
    clientData.count++;
    
    if (clientData.count > RATE_LIMIT_MAX) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - clientData.firstRequest)) / 1000)
      });
    }
  } else {
    // Reset window
    requestCounts.set(clientId, {
      count: 1,
      firstRequest: now
    });
  }
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': RATE_LIMIT_MAX,
    'X-RateLimit-Remaining': Math.max(0, RATE_LIMIT_MAX - (clientData?.count || 1)),
    'X-RateLimit-Reset': new Date(now + RATE_LIMIT_WINDOW).toISOString()
  });
  
  next();
};

// JSON optimization middleware
export const jsonOptimizationMiddleware = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Remove null/undefined values to reduce payload size
    const optimizedData = removeEmptyValues(data);
    
    // Add performance headers
    res.set({
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Length': JSON.stringify(optimizedData).length
    });
    
    return originalJson.call(this, optimizedData);
  };
  
  next();
};

// Helper function to remove empty values
function removeEmptyValues(obj) {
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyValues).filter(item => item !== null && item !== undefined);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = removeEmptyValues(value);
      if (cleanedValue !== null && cleanedValue !== undefined && cleanedValue !== '') {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }
  
  return obj;
}

// Memory usage monitoring
export const memoryMonitoringMiddleware = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  };
  
  // Log high memory usage
  if (memUsageMB.heapUsed > 100) {
    console.warn('High memory usage:', memUsageMB);
  }
  
  // Add memory headers in development
  if (process.env.NODE_ENV === 'development') {
    res.set('X-Memory-Usage', JSON.stringify(memUsageMB));
  }
  
  next();
};

export default {
  compressionMiddleware,
  securityMiddleware,
  cacheMiddleware,
  timingMiddleware,
  rateLimitMiddleware,
  jsonOptimizationMiddleware,
  memoryMonitoringMiddleware
};