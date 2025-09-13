// Client-side data caching system with SWR-like functionality

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdvancedCache } from './advanced-caching';
import { logger } from './utils';
import { performanceMonitor, trackCachePerformance } from './performance-monitor';

interface CacheOptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
  dedupingInterval?: number;
  errorRetryCount?: number;
  errorRetryInterval?: number;
  fallbackData?: any;
  keepPreviousData?: boolean;
}

interface CacheState<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (data?: T | Promise<T> | ((current: T | undefined) => T | Promise<T>), shouldRevalidate?: boolean) => Promise<T | undefined>;
}

// Global cache instance for client-side data
const clientCache = new AdvancedCache<any>({
  maxSize: 100,
  ttl: 5 * 60 * 1000, // 5 minutes default TTL
  staleWhileRevalidate: 10 * 60 * 1000, // 10 minutes stale-while-revalidate
});

// Request deduplication map
const requestMap = new Map<string, Promise<any>>();

// Focus and online event handlers
let focusRevalidateKeys = new Set<string>();
let onlineRevalidateKeys = new Set<string>();

// Setup global event listeners
if (typeof window !== 'undefined') {
  // Revalidate on focus
  window.addEventListener('focus', () => {
    focusRevalidateKeys.forEach(key => {
      // Trigger revalidation for keys that need it
      window.dispatchEvent(new CustomEvent(`revalidate-${key}`));
    });
  });

  // Revalidate on reconnect
  window.addEventListener('online', () => {
    onlineRevalidateKeys.forEach(key => {
      window.dispatchEvent(new CustomEvent(`revalidate-${key}`));
    });
  });
}

/**
 * Custom hook for client-side data fetching with caching, similar to SWR
 * @param key - Unique key for the data
 * @param fetcher - Function to fetch the data
 * @param options - Cache options
 */
export function useClientCache<T>(
  key: string | null,
  fetcher?: () => Promise<T>,
  options: CacheOptions = {}
): CacheState<T> {
  const {
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    refreshInterval,
    dedupingInterval = 2000,
    errorRetryCount = 3,
    errorRetryInterval = 5000,
    fallbackData,
    keepPreviousData = false,
  } = options;

  const [data, setData] = useState<T | undefined>(fallbackData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  
  const retryCountRef = useRef(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const errorRetryTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch function with caching and deduplication
  const fetchData = useCallback(async (forceRefresh = false): Promise<T | undefined> => {
    if (!key || !fetcher) return undefined;

    try {
      setIsValidating(true);
      setError(null);

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await clientCache.get(key);
        if (cached !== null) {
          // Track cache hit
          performanceMonitor.startTiming(key);
          trackCachePerformance(key, true);
          
          setData(cached);
          setIsLoading(false);
          return cached;
        }
      }

      // Check for ongoing request (deduplication)
      const requestKey = `${key}-${Date.now() - (Date.now() % dedupingInterval)}`;
      if (requestMap.has(requestKey) && !forceRefresh) {
        const result = await requestMap.get(requestKey)!;
        setData(result);
        setIsLoading(false);
        return result;
      }

      // Create new request
      // Start performance monitoring
      performanceMonitor.startTiming(key);
      
      const requestPromise = fetcher();
      requestMap.set(requestKey, requestPromise);

      const result = await requestPromise;
      
      // Cache the result
      clientCache.set(key, result);
      
      // Track cache miss (new data fetched)
      trackCachePerformance(key, false);
      
      // Update state
      setData(result);
      setError(null);
      retryCountRef.current = 0;
      
      // Clean up request map
      setTimeout(() => requestMap.delete(requestKey), dedupingInterval);
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Client cache fetch error:', error);
      
      setError(error);
      
      // Track cache miss with error
      trackCachePerformance(key, false);
      
      // Keep previous data if option is enabled
      if (!keepPreviousData) {
        setData(undefined);
      }
      
      // Retry logic
      if (retryCountRef.current < errorRetryCount) {
        retryCountRef.current++;
        errorRetryTimeoutRef.current = setTimeout(() => {
          fetchData(forceRefresh);
        }, errorRetryInterval * Math.pow(2, retryCountRef.current - 1)); // Exponential backoff
      }
      
      throw error;
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [key, fetcher, dedupingInterval, errorRetryCount, errorRetryInterval, keepPreviousData]);

  // Mutate function for manual data updates
  const mutate = useCallback(async (
    data?: T | Promise<T> | ((current: T | undefined) => T | Promise<T>),
    shouldRevalidate = true
  ): Promise<T | undefined> => {
    if (!key) return undefined;

    try {
      let newData: T | undefined;

      if (typeof data === 'function') {
        const currentData = await clientCache.get(key);
        newData = await (data as Function)(currentData);
      } else if (data !== undefined) {
        newData = await Promise.resolve(data);
      }

      if (newData !== undefined) {
        // Update cache
        clientCache.set(key, newData);
        // Update state
        setData(newData);
        setError(null);
      }

      // Revalidate if requested
      if (shouldRevalidate && fetcher) {
        fetchData(true);
      }

      return newData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Client cache mutate error:', error);
      setError(error);
      throw error;
    }
  }, [key, fetcher, fetchData]);

  // Initial fetch and setup
  useEffect(() => {
    if (!key) {
      setData(undefined);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchData();

    // Setup revalidation listeners
    if (revalidateOnFocus) {
      focusRevalidateKeys.add(key);
    }
    if (revalidateOnReconnect) {
      onlineRevalidateKeys.add(key);
    }

    // Custom revalidation event listener
    const handleRevalidate = () => fetchData(true);
    window.addEventListener(`revalidate-${key}`, handleRevalidate);

    // Cleanup
    return () => {
      focusRevalidateKeys.delete(key);
      onlineRevalidateKeys.delete(key);
      window.removeEventListener(`revalidate-${key}`, handleRevalidate);
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (errorRetryTimeoutRef.current) {
        clearTimeout(errorRetryTimeoutRef.current);
      }
    };
  }, [key, fetchData, revalidateOnFocus, revalidateOnReconnect]);

  // Setup refresh interval
  useEffect(() => {
    if (refreshInterval && key && fetcher) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData(true);
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, key, fetcher, fetchData]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

/**
 * Preload data into cache
 */
export function preloadData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  return clientCache.get(key, fetcher);
}

/**
 * Clear cache for specific key or all keys
 */
export function clearCache(key?: string): void {
  if (key) {
    clientCache.delete(key);
  } else {
    clientCache.clear();
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return clientCache.getStats();
}

/**
 * Revalidate specific key
 */
export function revalidate(key: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`revalidate-${key}`));
  }
}

// Export the cache instance for advanced usage
export { clientCache };