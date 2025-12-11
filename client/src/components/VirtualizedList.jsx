import { useState, useEffect, useRef, useMemo } from 'react';
import { useThrottle } from '../utils/performanceOptimizer';

const VirtualizedList = ({
  items = [],
  itemHeight = 100,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Throttled scroll handler for better performance
  const throttledScrollHandler = useThrottle((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(e);
  }, 16); // ~60fps

  // Calculate visible items
  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      visibleItems.push({
        index: i,
        item: items[i],
        top: i * itemHeight
      });
    }

    return {
      items: visibleItems,
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={throttledScrollHandler}
      {...props}
    >
      {/* Total height container */}
      <div style={{ height: visibleItems.totalHeight, position: 'relative' }}>
        {/* Visible items */}
        {visibleItems.items.map(({ index, item, top }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualizedList;