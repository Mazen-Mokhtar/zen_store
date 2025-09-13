'use client';

import React, { useEffect, useRef, useCallback, memo } from 'react';

interface MemoryOptimizerProps {
  children: React.ReactNode;
  cleanupInterval?: number;
  maxMemoryUsage?: number;
  enableGarbageCollection?: boolean;
}

// Memory optimization component
export const MemoryOptimizer = memo<MemoryOptimizerProps>(({ 
  children, 
  cleanupInterval = 30000, // 30 seconds
  maxMemoryUsage = 100, // 100MB
  enableGarbageCollection = true
}) => {
  const cleanupRef = useRef<NodeJS.Timeout>();
  const memoryCheckRef = useRef<NodeJS.Timeout>();

  // Force garbage collection if available
  const forceGarbageCollection = useCallback(() => {
    if (enableGarbageCollection && typeof window !== 'undefined') {
      // @ts-ignore - gc is available in some environments
      if (window.gc) {
        window.gc();
      }
      
      // Clear any cached data
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('temp') || name.includes('cache')) {
              caches.delete(name);
            }
          });
        });
      }
    }
  }, [enableGarbageCollection]);

  // Check memory usage
  const checkMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // @ts-ignore - memory is available in some browsers
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        if (usedMB > maxMemoryUsage) {
          console.warn(`Memory usage high: ${usedMB.toFixed(2)}MB`);
          forceGarbageCollection();
        }
      }
    }
  }, [maxMemoryUsage, forceGarbageCollection]);

  // Cleanup unused resources
  const cleanup = useCallback(() => {
    // Clear any unused event listeners
    const unusedElements = document.querySelectorAll('[data-cleanup="true"]');
    unusedElements.forEach(element => {
      element.remove();
    });

    // Clear any unused timers
    const tempTimeoutId = setTimeout(() => {}, 0);
    const highestTimeoutId = Number(tempTimeoutId);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    clearTimeout(tempTimeoutId);

    // Force garbage collection
    forceGarbageCollection();
  }, [forceGarbageCollection]);

  useEffect(() => {
    // Set up periodic cleanup
    cleanupRef.current = setInterval(cleanup, cleanupInterval);
    
    // Set up memory monitoring
    memoryCheckRef.current = setInterval(checkMemoryUsage, 10000); // Check every 10 seconds

    // Cleanup on page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanup();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on beforeunload
    const handleBeforeUnload = () => {
      cleanup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (cleanupRef.current) {
        clearInterval(cleanupRef.current);
      }
      if (memoryCheckRef.current) {
        clearInterval(memoryCheckRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, [cleanup, checkMemoryUsage, cleanupInterval]);

  return <>{children}</>;
});

MemoryOptimizer.displayName = 'MemoryOptimizer';

// Hook for manual memory optimization
export const useMemoryOptimization = () => {
  const forceCleanup = useCallback(() => {
    // Clear any cached data
    if (typeof window !== 'undefined') {
      // Clear localStorage items older than 1 hour
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('temp_')) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const data = JSON.parse(item);
              if (data.timestamp && (now - data.timestamp) > oneHour) {
                localStorage.removeItem(key);
              }
            } catch {
              localStorage.removeItem(key);
            }
          }
        }
      }

      // Clear sessionStorage
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.startsWith('temp_') || key.startsWith('cache_')) {
          sessionStorage.removeItem(key);
        }
      });

      // Force garbage collection if available
      // @ts-ignore
      if (window.gc) {
        window.gc();
      }
    }
  }, []);

  const getMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // @ts-ignore
      const memory = (performance as any).memory;
      if (memory) {
        return {
          used: memory.usedJSHeapSize / 1024 / 1024, // MB
          total: memory.totalJSHeapSize / 1024 / 1024, // MB
          limit: memory.jsHeapSizeLimit / 1024 / 1024 // MB
        };
      }
    }
    return null;
  }, []);

  return { forceCleanup, getMemoryUsage };
};