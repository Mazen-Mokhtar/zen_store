/**
 * Service Worker Caching Strategies
 * Reusable caching strategies for different types of resources
 */

export interface CacheConfig {
  cacheName: string;
  maxEntries?: number;
  maxAgeSeconds?: number;
  networkTimeoutSeconds?: number;
}

export interface CacheStrategy {
  handle(request: Request, config: CacheConfig): Promise<Response>;
}

/**
 * Cache First Strategy
 * Best for: Static assets, fonts, images that rarely change
 * Flow: Cache → Network → Fallback
 */
export class CacheFirstStrategy implements CacheStrategy {
  async handle(request: Request, config: CacheConfig): Promise<Response> {
    try {
      const cache = await caches.open(config.cacheName);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        // Check if cached response is still fresh
        if (this.isFresh(cachedResponse, config.maxAgeSeconds)) {
          return cachedResponse;
        }
      }
      
      // Fetch from network
      const networkResponse = await this.fetchWithTimeout(request, config.networkTimeoutSeconds);
      
      if (networkResponse.ok) {
        // Cache the response
        await cache.put(request, networkResponse.clone());
        await this.cleanupCache(cache, config.maxEntries);
      }
      
      return networkResponse;
    } catch (error) {
      // Return stale cache if available
      const cache = await caches.open(config.cacheName);
      const staleResponse = await cache.match(request);
      
      if (staleResponse) {
        console.warn('[SW Strategy] Returning stale cache due to network error:', error);
        return staleResponse;
      }
      
      throw error;
    }
  }
  
  private isFresh(response: Response, maxAgeSeconds?: number): boolean {
    if (!maxAgeSeconds) return true;
    
    const dateHeader = response.headers.get('date');
    if (!dateHeader) return false;
    
    const responseDate = new Date(dateHeader);
    const now = new Date();
    const ageSeconds = (now.getTime() - responseDate.getTime()) / 1000;
    
    return ageSeconds < maxAgeSeconds;
  }
  
  private async fetchWithTimeout(request: Request, timeoutSeconds = 10): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
    
    try {
      const response = await fetch(request, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  private async cleanupCache(cache: Cache, maxEntries?: number): Promise<void> {
    if (!maxEntries) return;
    
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const entriesToDelete = keys.slice(0, keys.length - maxEntries);
      await Promise.all(entriesToDelete.map(key => cache.delete(key)));
    }
  }
}

/**
 * Network First Strategy
 * Best for: API calls, dynamic content that changes frequently
 * Flow: Network → Cache → Fallback
 */
export class NetworkFirstStrategy implements CacheStrategy {
  async handle(request: Request, config: CacheConfig): Promise<Response> {
    try {
      // Try network first
      const networkResponse = await this.fetchWithTimeout(request, config.networkTimeoutSeconds);
      
      if (networkResponse.ok) {
        // Cache successful response
        const cache = await caches.open(config.cacheName);
        await cache.put(request, networkResponse.clone());
        await this.cleanupCache(cache, config.maxEntries);
      }
      
      return networkResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('[SW Strategy] Network failed, trying cache:', errorMessage);
      
      // Fallback to cache
      const cache = await caches.open(config.cacheName);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        // Add header to indicate this is from cache
        const response = cachedResponse.clone();
        response.headers.set('X-Served-By', 'sw-cache');
        return response;
      }
      
      // No cache available, return error response
      return this.createErrorResponse(request, error);
    }
  }
  
  private async fetchWithTimeout(request: Request, timeoutSeconds = 5): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
    
    try {
      const response = await fetch(request, {
        signal: controller.signal,
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  private async cleanupCache(cache: Cache, maxEntries?: number): Promise<void> {
    if (!maxEntries) return;
    
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const entriesToDelete = keys.slice(0, keys.length - maxEntries);
      await Promise.all(entriesToDelete.map(key => cache.delete(key)));
    }
  }
  
  private createErrorResponse(request: Request, error: any): Response {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({
        error: 'Service unavailable',
        message: 'Unable to fetch data. Please check your connection.',
        offline: true
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': 'sw-fallback'
        }
      });
    }
    
    return new Response('Service unavailable', {
      status: 503,
      headers: { 'X-Served-By': 'sw-fallback' }
    });
  }
}

/**
 * Stale While Revalidate Strategy
 * Best for: Content that can be slightly stale but should be updated in background
 * Flow: Cache (immediate) → Network (background update)
 */
export class StaleWhileRevalidateStrategy implements CacheStrategy {
  async handle(request: Request, config: CacheConfig): Promise<Response> {
    const cache = await caches.open(config.cacheName);
    const cachedResponse = await cache.match(request);
    
    // Start network request in background
    const networkPromise = this.updateCache(request, cache, config);
    
    if (cachedResponse) {
      // Return cached response immediately
      // Network update happens in background
      networkPromise.catch(error => {
        console.warn('[SW Strategy] Background update failed:', error);
      });
      
      return cachedResponse;
    }
    
    // No cache available, wait for network
    try {
      return await networkPromise;
    } catch (error) {
      return this.createErrorResponse(request, error);
    }
  }
  
  private async updateCache(request: Request, cache: Cache, config: CacheConfig): Promise<Response> {
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
        await this.cleanupCache(cache, config.maxEntries);
      }
      
      return networkResponse;
    } catch (error) {
      throw error;
    }
  }
  
  private async cleanupCache(cache: Cache, maxEntries?: number): Promise<void> {
    if (!maxEntries) return;
    
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const entriesToDelete = keys.slice(0, keys.length - maxEntries);
      await Promise.all(entriesToDelete.map(key => cache.delete(key)));
    }
  }
  
  private createErrorResponse(request: Request, error: any): Response {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({
        error: 'Service unavailable',
        message: 'Unable to fetch data. Please check your connection.',
        offline: true
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': 'sw-fallback'
        }
      });
    }
    
    return new Response('Service unavailable', {
      status: 503,
      headers: { 'X-Served-By': 'sw-fallback' }
    });
  }
}

/**
 * Network Only Strategy
 * Best for: Critical API calls that must always be fresh
 * Flow: Network only (no caching)
 */
export class NetworkOnlyStrategy implements CacheStrategy {
  async handle(request: Request, config: CacheConfig): Promise<Response> {
    try {
      return await fetch(request, {
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'Cache-Control': 'no-cache'
        }
      });
    } catch (error) {
      return this.createErrorResponse(request, error);
    }
  }
  
  private createErrorResponse(request: Request, error: any): Response {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({
        error: 'Network error',
        message: 'Unable to connect to server. Please check your connection.',
        offline: true
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': 'sw-network-only'
        }
      });
    }
    
    return new Response('Network error', {
      status: 503,
      headers: { 'X-Served-By': 'sw-network-only' }
    });
  }
}

/**
 * Cache Only Strategy
 * Best for: Offline-first content, pre-cached resources
 * Flow: Cache only (no network)
 */
export class CacheOnlyStrategy implements CacheStrategy {
  async handle(request: Request, config: CacheConfig): Promise<Response> {
    const cache = await caches.open(config.cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Not found in cache', {
      status: 404,
      headers: { 'X-Served-By': 'sw-cache-only' }
    });
  }
}

/**
 * Strategy Factory
 * Creates strategy instances based on configuration
 */
export class StrategyFactory {
  private static strategies = new Map<string, CacheStrategy>([
    ['cache-first', new CacheFirstStrategy()],
    ['network-first', new NetworkFirstStrategy()],
    ['stale-while-revalidate', new StaleWhileRevalidateStrategy()],
    ['network-only', new NetworkOnlyStrategy()],
    ['cache-only', new CacheOnlyStrategy()]
  ]);
  
  static getStrategy(name: string): CacheStrategy | null {
    return this.strategies.get(name) || null;
  }
  
  static registerStrategy(name: string, strategy: CacheStrategy): void {
    this.strategies.set(name, strategy);
  }
}

/**
 * Route-based Strategy Configuration
 * Maps URL patterns to caching strategies
 */
export interface RouteConfig {
  pattern: RegExp | string;
  strategy: string;
  config: CacheConfig;
}

export class RouteHandler {
  private routes: RouteConfig[] = [];
  
  addRoute(pattern: RegExp | string, strategy: string, config: CacheConfig): void {
    this.routes.push({ pattern, strategy, config });
  }
  
  async handleRequest(request: Request): Promise<Response | null> {
    const url = new URL(request.url);
    
    for (const route of this.routes) {
      if (this.matchesPattern(url.pathname, route.pattern)) {
        const strategy = StrategyFactory.getStrategy(route.strategy);
        
        if (strategy) {
          return await strategy.handle(request, route.config);
        }
      }
    }
    
    return null; // No matching route
  }
  
  private matchesPattern(pathname: string, pattern: RegExp | string): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(pathname);
    }
    
    return pathname.includes(pattern);
  }
}

/**
 * Predefined Route Configurations
 */
export const DEFAULT_ROUTES: RouteConfig[] = [
  // Static assets - Cache First
  {
    pattern: /\/_next\/static\//,
    strategy: 'cache-first',
    config: {
      cacheName: 'static-assets',
      maxEntries: 100,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      networkTimeoutSeconds: 10
    }
  },
  
  // Images - Cache First
  {
    pattern: /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i,
    strategy: 'cache-first',
    config: {
      cacheName: 'images',
      maxEntries: 200,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      networkTimeoutSeconds: 15
    }
  },
  
  // Fonts - Cache First
  {
    pattern: /\.(woff|woff2|ttf|eot)$/i,
    strategy: 'cache-first',
    config: {
      cacheName: 'fonts',
      maxEntries: 20,
      maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      networkTimeoutSeconds: 10
    }
  },
  
  // API routes - Network First
  {
    pattern: /^\/api\//,
    strategy: 'network-first',
    config: {
      cacheName: 'api-cache',
      maxEntries: 50,
      maxAgeSeconds: 5 * 60, // 5 minutes
      networkTimeoutSeconds: 5
    }
  },
  
  // Pages - Stale While Revalidate
  {
    pattern: /^\//,
    strategy: 'stale-while-revalidate',
    config: {
      cacheName: 'pages',
      maxEntries: 30,
      maxAgeSeconds: 24 * 60 * 60, // 1 day
      networkTimeoutSeconds: 3
    }
  }
];

// Export convenience function to create a configured route handler
export function createRouteHandler(routes: RouteConfig[] = DEFAULT_ROUTES): RouteHandler {
  const handler = new RouteHandler();
  
  routes.forEach(route => {
    handler.addRoute(route.pattern, route.strategy, route.config);
  });
  
  return handler;
}

// Export strategy instances for direct use
export const cacheFirst = new CacheFirstStrategy();
export const networkFirst = new NetworkFirstStrategy();
export const staleWhileRevalidate = new StaleWhileRevalidateStrategy();
export const networkOnly = new NetworkOnlyStrategy();
export const cacheOnly = new CacheOnlyStrategy();