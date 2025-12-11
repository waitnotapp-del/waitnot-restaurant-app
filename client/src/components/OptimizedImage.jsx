import { useState, useRef, useEffect } from 'react';
import { ImageOptimizer } from '../utils/performanceOptimizer';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height, 
  quality = 80,
  lazy = true,
  placeholder = 'blur',
  fallback = null,
  onLoad,
  onError,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, isInView]);

  // Optimize image URL
  const optimizedSrc = ImageOptimizer.optimizeImageUrl(src, {
    width,
    height,
    quality
  });

  // Generate placeholder
  const getPlaceholder = () => {
    if (placeholder === 'blur') {
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad)"/>
          <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="system-ui" font-size="14">Loading...</text>
        </svg>
      `)}`;
    }
    
    if (placeholder === 'empty') {
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f3f4f6"/>
        </svg>
      `)}`;
    }

    return placeholder;
  };

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  // Show fallback if error and fallback provided
  if (hasError && fallback) {
    return fallback;
  }

  // Show placeholder while not in view (for lazy loading)
  if (lazy && !isInView) {
    return (
      <div
        ref={imgRef}
        className={`${className} bg-gray-200 dark:bg-gray-700 animate-pulse`}
        style={{ width, height }}
        {...props}
      >
        <img
          src={getPlaceholder()}
          alt={alt}
          className="w-full h-full object-cover opacity-50"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={imgRef}>
      {/* Placeholder/Loading state */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <img
            src={getPlaceholder()}
            alt=""
            className="w-full h-full object-cover opacity-50"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Actual image */}
      <img
        src={isInView ? optimizedSrc : getPlaceholder()}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />

      {/* Error state */}
      {hasError && !fallback && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Image not available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;