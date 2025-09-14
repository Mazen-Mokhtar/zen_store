interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  priority: CachePriority;
}

enum CachePriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  enableCompression: boolean;
}

class EnhancedCache {
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 5 * 60 * 1000,
      cleanupInterval: config.cleanupInterval || 60 * 1000,
      enableCompression: config.enableCompression || false
    };
    
    this.startCleanupTimer();
  }

  set<T>(
    key: string, 
    data: T, 
    ttl: number = this.config.defaultTTL,
    priority: CachePriority = CachePriority.MEDIUM
  ): void {
    // Check if cache is full and evict if necessary
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastImportant();
    }

    const processedData = this.config.enableCompression ? this.compress(data) : data;
    
    this.cache.set(key, {
      data: processedData,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      priority
    });
  }

  get<T>(key: string): T | null {
    this.stats.totalRequests++;
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    const isExpired = Date.now() - item.timestamp > item.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();
    this.stats.hits++;

    const data = this.config.enableCompression ? this.decompress(item.data) : item.data;
    return data;
  }

  has(key: string): boolean {
    return this.cache.has(key) && !this.isExpired(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  private isExpired(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return true;
    return Date.now() - item.timestamp > item.ttl;
  }

  private evictLeastImportant(): void {
    let leastImportantKey: string | null = null;
    let lowestScore = Infinity;

    this.cache.forEach((item, key) => {
      // Calculate importance score based on priority, access count, and recency
      const timeSinceAccess = Date.now() - item.lastAccessed;
      const score = (item.priority * item.accessCount) / (timeSinceAccess + 1);
      
      if (score < lowestScore) {
        lowestScore = score;
        leastImportantKey = key;
      }
    });

    if (leastImportantKey) {
      this.cache.delete(leastImportantKey);
      this.stats.evictions++;
    }
  }

  private compress<T>(data: T): T {
    // Simple compression simulation - in real implementation, use actual compression
    return data;
  }

  private decompress<T>(data: T): T {
    // Simple decompression simulation
    return data;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  cleanup(): void {
    const expiredKeys: string[] = [];
    
    this.cache.forEach((_value, key) => {
      if (this.isExpired(key)) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.cache.delete(key);
    });
  }

  getStats() {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: this.cache.size,
      maxSize: this.config.maxSize
    };
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0
    };
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Create enhanced cache instances for different use cases
// Disable caching in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

export const cache = new EnhancedCache({
  maxSize: isDevelopment ? 0 : 1000,
  defaultTTL: isDevelopment ? 0 : 5 * 60 * 1000,
  cleanupInterval: isDevelopment ? 0 : 60 * 1000,
  enableCompression: false
});

export const apiCache = new EnhancedCache({
  maxSize: isDevelopment ? 0 : 500,
  defaultTTL: isDevelopment ? 0 : 10 * 60 * 1000,
  cleanupInterval: isDevelopment ? 0 : 2 * 60 * 1000,
  enableCompression: !isDevelopment
});

export const imageCache = new EnhancedCache({
  maxSize: isDevelopment ? 50 : 200,
  defaultTTL: isDevelopment ? 30 * 1000 : 30 * 60 * 1000,
  cleanupInterval: isDevelopment ? 30 * 1000 : 5 * 60 * 1000,
  enableCompression: false
});

// Cache keys with namespacing
export const CACHE_KEYS = {
  // API cache keys
  GAMES: 'api:games',
  PACKAGES: 'api:packages',
  CATEGORIES: 'api:categories',
  STEAM_GAMES: 'api:steam_games',
  POPULAR_ITEMS: 'api:popular_items',
  USER_PROFILE: 'api:user_profile',
  
  // UI State
  THEME: 'ui:theme',
  LANGUAGE: 'ui:language',
  SIDEBAR_STATE: 'ui:sidebar_state',
  
  // Performance
  METRICS: 'perf:metrics',
  ANALYTICS: 'perf:analytics',
  
  // Images
  GAME_IMAGES: 'img:games',
  AVATARS: 'img:avatars'
} as const;

// Cache TTL (Time To Live) in milliseconds
export const CACHE_TTL = {
  INSTANT: 30 * 1000,      // 30 seconds
  SHORT: 1 * 60 * 1000,    // 1 minute
  MEDIUM: 5 * 60 * 1000,   // 5 minutes
  LONG: 15 * 60 * 1000,    // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
  PERSISTENT: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Enhanced helper functions with smart caching
export const getCachedData = <T>(key: string, cacheInstance: EnhancedCache = cache): T | null => {
  return cacheInstance.get<T>(key);
};

export const setCachedData = <T>(
  key: string, 
  data: T, 
  ttl: number = CACHE_TTL.MEDIUM,
  priority: CachePriority = CachePriority.MEDIUM,
  cacheInstance: EnhancedCache = cache
): void => {
  cacheInstance.set(key, data, ttl, priority);
};

export const setCachedApiData = <T>(key: string, data: T, ttl: number = CACHE_TTL.LONG): void => {
  apiCache.set(key, data, ttl, CachePriority.HIGH);
};

export const getCachedApiData = <T>(key: string): T | null => {
  return apiCache.get<T>(key);
};

export const setCachedImage = (key: string, data: any, ttl: number = CACHE_TTL.VERY_LONG): void => {
  imageCache.set(key, data, ttl, CachePriority.MEDIUM);
};

export const getCachedImage = (key: string): any | null => {
  return imageCache.get(key);
};

export const invalidateCache = (key: string, cacheInstance: EnhancedCache = cache): void => {
  cacheInstance.delete(key);
};

export const invalidateAllCache = (): void => {
  cache.clear();
  apiCache.clear();
  imageCache.clear();
};

export const getCacheStats = () => {
  return {
    general: cache.getStats(),
    api: apiCache.getStats(),
    images: imageCache.getStats()
  };
};

// Smart cache warming for critical data
export const warmCache = async () => {
  try {
    // Pre-load critical data that's likely to be needed
    const criticalKeys = [
      CACHE_KEYS.CATEGORIES,
      CACHE_KEYS.POPULAR_ITEMS
    ];
    
    // This would be implemented based on your API structure
  } catch (error) {
    // Cache warming failed silently
  }
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cache.destroy();
    apiCache.destroy();
    imageCache.destroy();
  });
}

// Export types for external use
export { CachePriority, EnhancedCache };