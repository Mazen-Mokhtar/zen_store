// Advanced caching strategies for optimal performance

import { LRUCache } from 'lru-cache';

interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  staleWhileRevalidate?: number;
  maxAge?: number;
  updateAgeOnGet?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
  lastModified?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

// Cache configurations for different data types
export const CACHE_CONFIGS = {
  API_RESPONSES: {
    maxSize: 100,
    ttl: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: 10 * 60 * 1000 // 10 minutes
  },
  STATIC_DATA: {
    maxSize: 50,
    ttl: 30 * 60 * 1000, // 30 minutes
    updateAgeOnGet: true
  },
  USER_DATA: {
    maxSize: 20,
    ttl: 2 * 60 * 1000, // 2 minutes
    staleWhileRevalidate: 5 * 60 * 1000
  },
  IMAGES: {
    maxSize: 200,
    ttl: 60 * 60 * 1000, // 1 hour
    updateAgeOnGet: true
  },
  COMPONENTS: {
    maxSize: 30,
    ttl: 15 * 60 * 1000, // 15 minutes
    updateAgeOnGet: false
  }
} as const;

// Advanced cache implementation with multiple strategies
export class AdvancedCache<T = any> {
  private cache: LRUCache<string, CacheEntry<T>>;
  private stats: CacheStats;
  private config: CacheConfig;
  private backgroundRefresh: Map<string, Promise<T>>;

  constructor(config: CacheConfig) {
    this.config = config;
    this.cache = new LRUCache({
      max: config.maxSize,
      ttl: config.ttl,
      updateAgeOnGet: config.updateAgeOnGet || false
    });
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      hitRate: 0
    };
    
    this.backgroundRefresh = new Map();
  }

  // Get with stale-while-revalidate strategy
  async get(
    key: string, 
    fetchFn?: () => Promise<T>,
    options?: { forceRefresh?: boolean; etag?: string }
  ): Promise<T | null> {
    const entry = this.cache.get(key);
    const now = Date.now();
    
    // Force refresh if requested
    if (options?.forceRefresh && fetchFn) {
      return this.fetchAndSet(key, fetchFn);
    }
    
    // Cache hit - data is fresh
    if (entry && (now - entry.timestamp) < entry.ttl) {
      this.stats.hits++;
      this.updateStats();
      return entry.data;
    }
    
    // Cache hit - data is stale but within stale-while-revalidate window
    if (entry && this.config.staleWhileRevalidate && 
        (now - entry.timestamp) < (entry.ttl + this.config.staleWhileRevalidate)) {
      
      this.stats.hits++;
      this.updateStats();
      
      // Background refresh if fetch function is provided
      if (fetchFn && !this.backgroundRefresh.has(key)) {
        this.backgroundRefresh.set(key, this.fetchAndSet(key, fetchFn));
        
        // Clean up background refresh promise
        this.backgroundRefresh.get(key)?.finally(() => {
          this.backgroundRefresh.delete(key);
        });
      }
      
      return entry.data;
    }
    
    // Cache miss or expired data
    this.stats.misses++;
    this.updateStats();
    
    if (fetchFn) {
      return this.fetchAndSet(key, fetchFn);
    }
    
    return null;
  }

  // Set data in cache
  set(key: string, data: T, customTtl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: customTtl || this.config.ttl
    };
    
    this.cache.set(key, entry);
    this.stats.sets++;
    this.updateStats();
  }

  // Delete from cache
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateStats();
    }
    return deleted;
  }

  // Clear entire cache
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      hitRate: 0
    };
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Check if key exists and is fresh
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  // Get all keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Preload data into cache
  async preload(entries: Array<{ key: string; fetchFn: () => Promise<T> }>): Promise<void> {
    const preloadPromises = entries.map(async ({ key, fetchFn }) => {
      try {
        const data = await fetchFn();
        this.set(key, data);
      } catch (error) {
        console.warn(`Failed to preload cache entry ${key}:`, error);
      }
    });
    
    await Promise.allSettled(preloadPromises);
  }

  private async fetchAndSet(key: string, fetchFn: () => Promise<T>): Promise<T> {
    try {
      const data = await fetchFn();
      this.set(key, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch data for key ${key}:`, error);
      throw error;
    }
  }

  private updateStats(): void {
    this.stats.size = this.cache.size;
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}

// Cache instances for different data types
export const apiCache = new AdvancedCache(CACHE_CONFIGS.API_RESPONSES);
export const staticDataCache = new AdvancedCache(CACHE_CONFIGS.STATIC_DATA);
export const userDataCache = new AdvancedCache(CACHE_CONFIGS.USER_DATA);
export const imageCache = new AdvancedCache(CACHE_CONFIGS.IMAGES);
export const componentCache = new AdvancedCache(CACHE_CONFIGS.COMPONENTS);

// HTTP cache utilities
export class HTTPCache {
  private static instance: HTTPCache;
  private requestCache: Map<string, Promise<Response>>;
  
  private constructor() {
    this.requestCache = new Map();
  }
  
  static getInstance(): HTTPCache {
    if (!HTTPCache.instance) {
      HTTPCache.instance = new HTTPCache();
    }
    return HTTPCache.instance;
  }
  
  // Cached fetch with deduplication
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const cacheKey = this.getCacheKey(url, options);
    
    // Return existing request if in progress
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)!;
    }
    
    // Create new request
    const requestPromise = this.executeRequest(url, options);
    this.requestCache.set(cacheKey, requestPromise);
    
    // Clean up after request completes
    requestPromise.finally(() => {
      this.requestCache.delete(cacheKey);
    });
    
    return requestPromise;
  }
  
  private async executeRequest(url: string, options?: RequestInit): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        ...options?.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  }
  
  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }
}

// Service Worker cache utilities
export const setupServiceWorkerCache = (): void => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('Service Worker registered:', registration);
    }).catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
  }
};

// Cache warming utilities
export const warmupCache = async (): Promise<void> => {
  const criticalEndpoints = [
    '/api/categories',
    '/api/user/profile',
    '/api/settings'
  ];
  
  const warmupPromises = criticalEndpoints.map(async (endpoint) => {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      apiCache.set(endpoint, data);
      console.log(`Warmed up cache for: ${endpoint}`);
    } catch (error) {
      console.warn(`Failed to warm up cache for ${endpoint}:`, error);
    }
  });
  
  await Promise.allSettled(warmupPromises);
};

// React hook for cache management
export const useAdvancedCache = <T>(cacheInstance: AdvancedCache<T>) => {
  const get = async (key: string, fetchFn?: () => Promise<T>) => {
    return cacheInstance.get(key, fetchFn);
  };
  
  const set = (key: string, data: T, ttl?: number) => {
    cacheInstance.set(key, data, ttl);
  };
  
  const invalidate = (key: string) => {
    return cacheInstance.delete(key);
  };
  
  const getStats = () => {
    return cacheInstance.getStats();
  };
  
  return {
    get,
    set,
    invalidate,
    getStats
  };
};

// Cache performance monitoring
export const monitorCachePerformance = (): void => {
  const logStats = () => {
    const caches = {
      api: apiCache.getStats(),
      static: staticDataCache.getStats(),
      user: userDataCache.getStats(),
      images: imageCache.getStats(),
      components: componentCache.getStats()
    };
    
    console.group('Cache Performance Stats');
    Object.entries(caches).forEach(([name, stats]) => {
      console.log(`${name.toUpperCase()}:`, {
        hitRate: `${stats.hitRate.toFixed(1)}%`,
        size: stats.size,
        hits: stats.hits,
        misses: stats.misses
      });
    });
    console.groupEnd();
  };
  
  // Log stats every 5 minutes in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(logStats, 5 * 60 * 1000);
  }
};