// Performance monitoring for caching effectiveness

import { logger } from './utils';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface CoreWebVitals {
  LCP: number | null; // Largest Contentful Paint
  FID: number | null; // First Input Delay
  CLS: number | null; // Cumulative Layout Shift
  FCP: number | null; // First Contentful Paint
  TTFB: number | null; // Time to First Byte
}

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  avgResponseTime: number;
  totalRequests: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private cacheMetrics: Map<string, CacheMetrics> = new Map();
  private requestTimes: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;
  private coreWebVitals: CoreWebVitals = {
    LCP: null,
    FID: null,
    CLS: null,
    FCP: null,
    TTFB: null,
  };
  private bundleLoadTimes: Record<string, number> = {};
  private interactionDelays: number[] = [];
  private memoryUsage: any | null = null;
  private navigationTiming: PerformanceNavigationTiming | null = null;

  constructor() {
    this.initializeObservers();
  }

  /**
   * Initialize Performance Observers for real-time monitoring
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    try {
      // Core Web Vitals Observer
      this.setupCoreWebVitalsObserver();
      
      // Navigation Timing Observer
      this.setupNavigationObserver();
      
      // Resource Timing Observer
      this.setupResourceObserver();
      
      // User Interaction Observer
      this.setupInteractionObserver();
      
      // Memory Usage Monitoring
      this.setupMemoryMonitoring();
      
      this.isInitialized = true;
      console.log('[Performance Monitor] Observers initialized');
    } catch (error) {
      console.warn('[Performance Monitor] Failed to initialize observers:', error);
    }
  }

  /**
   * Set up Core Web Vitals monitoring
   */
  private setupCoreWebVitalsObserver(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
            startTime: number;
          };
          if (lastEntry) {
            this.coreWebVitals.LCP = lastEntry.startTime;
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('[Performance Monitor] LCP observer failed:', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              this.coreWebVitals.FID = entry.processingStart - entry.startTime;
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('[Performance Monitor] FID observer failed:', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.coreWebVitals.CLS = clsValue;
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('[Performance Monitor] CLS observer failed:', error);
      }

      // First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.coreWebVitals.FCP = entry.startTime;
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      } catch (error) {
        console.warn('[Performance Monitor] FCP observer failed:', error);
      }
    }
  }

  /**
   * Set up Navigation Timing monitoring
   */
  private setupNavigationObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.navigationTiming = navEntry;
              
              // Calculate TTFB
              if (navEntry.responseStart && navEntry.requestStart) {
                this.coreWebVitals.TTFB = navEntry.responseStart - navEntry.requestStart;
              }
            }
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (error) {
        console.warn('[Performance Monitor] Navigation observer failed:', error);
      }
    }
  }

  /**
   * Set up Resource Timing monitoring for bundle load times
   */
  private setupResourceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name.includes('_next/static/') || entry.name.includes('.js') || entry.name.includes('.css')) {
              const resourceName = this.extractResourceName(entry.name);
              this.bundleLoadTimes[resourceName] = entry.duration;
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('[Performance Monitor] Resource observer failed:', error);
      }
    }
  }

  /**
   * Set up User Interaction monitoring
   */
  private setupInteractionObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const interactionObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.duration) {
              this.interactionDelays.push(entry.duration);
              
              // Keep only last 100 interactions
              if (this.interactionDelays.length > 100) {
                this.interactionDelays = this.interactionDelays.slice(-100);
              }
            }
          });
        });
        
        // Try to observe event timing (experimental)
        try {
          interactionObserver.observe({ entryTypes: ['event'] });
        } catch {
          // Fallback to measure timing (deprecated but more widely supported)
          try {
            interactionObserver.observe({ entryTypes: ['measure'] });
          } catch {
            console.warn('[Performance Monitor] No interaction timing support');
          }
        }
        
        this.observers.push(interactionObserver);
      } catch (error) {
        console.warn('[Performance Monitor] Interaction observer failed:', error);
      }
    }
  }

  /**
   * Set up Memory Usage monitoring
   */
  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        this.memoryUsage = (performance as any).memory;
      };
      
      updateMemoryUsage();
      
      // Update memory usage every 30 seconds
      setInterval(updateMemoryUsage, 30000);
    }
  }

  /**
   * Extract resource name from URL
   */
  private extractResourceName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/');
      return segments[segments.length - 1] || 'unknown';
    } catch {
      return 'unknown';
    }
  }
  
  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata,
    });
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }
  
  /**
   * Start timing a request
   */
  startTiming(key: string) {
    this.requestTimes.set(key, performance.now());
  }
  
  /**
   * End timing and record the duration
   */
  endTiming(key: string, cacheHit: boolean = false) {
    const startTime = this.requestTimes.get(key);
    if (!startTime) return;
    
    const duration = performance.now() - startTime;
    this.requestTimes.delete(key);
    
    // Record timing metric
    this.recordMetric('request_duration', duration, {
      key,
      cacheHit,
      type: cacheHit ? 'cache_hit' : 'cache_miss',
    });
    
    // Update cache metrics
    this.updateCacheMetrics(key, duration, cacheHit);
    
    return duration;
  }
  
  /**
   * Update cache metrics for a specific key
   */
  private updateCacheMetrics(key: string, duration: number, cacheHit: boolean) {
    const existing = this.cacheMetrics.get(key) || {
      hits: 0,
      misses: 0,
      hitRate: 0,
      avgResponseTime: 0,
      totalRequests: 0,
    };
    
    existing.totalRequests++;
    
    if (cacheHit) {
      existing.hits++;
    } else {
      existing.misses++;
    }
    
    existing.hitRate = (existing.hits / existing.totalRequests) * 100;
    existing.avgResponseTime = (
      (existing.avgResponseTime * (existing.totalRequests - 1) + duration) /
      existing.totalRequests
    );
    
    this.cacheMetrics.set(key, existing);
  }
  
  /**
   * Get cache metrics for a specific key
   */
  getCacheMetrics(key: string): CacheMetrics | undefined {
    return this.cacheMetrics.get(key);
  }
  
  /**
   * Get all cache metrics
   */
  getAllCacheMetrics(): Record<string, CacheMetrics> {
    const result: Record<string, CacheMetrics> = {};
    this.cacheMetrics.forEach((metrics, key) => {
      result[key] = metrics;
    });
    return result;
  }
  
  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const now = Date.now();
    const last5Minutes = now - 5 * 60 * 1000;
    const recentMetrics = this.metrics.filter(m => m.timestamp > last5Minutes);
    
    const requestDurations = recentMetrics
      .filter(m => m.name === 'request_duration')
      .map(m => m.value);
    
    const cacheHits = recentMetrics
      .filter(m => m.name === 'request_duration' && m.metadata?.cacheHit)
      .length;
    
    const totalRequests = requestDurations.length;
    const avgResponseTime = totalRequests > 0 
      ? requestDurations.reduce((a, b) => a + b, 0) / totalRequests 
      : 0;
    
    const overallHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
    
    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      overallHitRate: Math.round(overallHitRate * 100) / 100,
      cacheHits,
      cacheMisses: totalRequests - cacheHits,
      timeRange: '5 minutes',
    };
  }
  
  /**
   * Get slowest endpoints
   */
  getSlowestEndpoints(limit: number = 10) {
    const endpointTimes: Record<string, number[]> = {};
    
    this.metrics
      .filter(m => m.name === 'request_duration' && m.metadata?.key)
      .forEach(m => {
        const key = m.metadata!.key;
        if (!endpointTimes[key]) {
          endpointTimes[key] = [];
        }
        endpointTimes[key].push(m.value);
      });
    
    const avgTimes = Object.entries(endpointTimes)
      .map(([key, times]) => ({
        endpoint: key,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        requestCount: times.length,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
    
    return avgTimes;
  }
  
  /**
   * Get Core Web Vitals scores with ratings
   */
  getCoreWebVitalsScores(): Record<string, { value: number | null; rating: string; threshold: string }> {
    return {
      LCP: {
        value: this.coreWebVitals.LCP,
        rating: this.rateLCP(this.coreWebVitals.LCP),
        threshold: 'Good: <2.5s, Needs Improvement: 2.5s-4s, Poor: >4s'
      },
      FID: {
        value: this.coreWebVitals.FID,
        rating: this.rateFID(this.coreWebVitals.FID),
        threshold: 'Good: <100ms, Needs Improvement: 100ms-300ms, Poor: >300ms'
      },
      CLS: {
        value: this.coreWebVitals.CLS,
        rating: this.rateCLS(this.coreWebVitals.CLS),
        threshold: 'Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25'
      },
      FCP: {
        value: this.coreWebVitals.FCP,
        rating: this.rateFCP(this.coreWebVitals.FCP),
        threshold: 'Good: <1.8s, Needs Improvement: 1.8s-3s, Poor: >3s'
      },
      TTFB: {
        value: this.coreWebVitals.TTFB,
        rating: this.rateTTFB(this.coreWebVitals.TTFB),
        threshold: 'Good: <800ms, Needs Improvement: 800ms-1800ms, Poor: >1800ms'
      }
    };
  }

  /**
   * Rate Core Web Vitals metrics
   */
  private rateLCP(value: number | null): string {
    if (value === null) return 'Not Available';
    if (value <= 2500) return 'Good';
    if (value <= 4000) return 'Needs Improvement';
    return 'Poor';
  }

  private rateFID(value: number | null): string {
    if (value === null) return 'Not Available';
    if (value <= 100) return 'Good';
    if (value <= 300) return 'Needs Improvement';
    return 'Poor';
  }

  private rateCLS(value: number | null): string {
    if (value === null) return 'Not Available';
    if (value <= 0.1) return 'Good';
    if (value <= 0.25) return 'Needs Improvement';
    return 'Poor';
  }

  private rateFCP(value: number | null): string {
    if (value === null) return 'Not Available';
    if (value <= 1800) return 'Good';
    if (value <= 3000) return 'Needs Improvement';
    return 'Poor';
  }

  private rateTTFB(value: number | null): string {
    if (value === null) return 'Not Available';
    if (value <= 800) return 'Good';
    if (value <= 1800) return 'Needs Improvement';
    return 'Poor';
  }

  /**
   * Get average interaction delay
   */
  getAverageInteractionDelay(): number {
    if (this.interactionDelays.length === 0) return 0;
    
    const sum = this.interactionDelays.reduce((acc, delay) => acc + delay, 0);
    return sum / this.interactionDelays.length;
  }

  /**
   * Get bundle performance summary
   */
  getBundlePerformance(): Record<string, any> {
    const loadTimes = Object.values(this.bundleLoadTimes);
    
    if (loadTimes.length === 0) {
      return { totalBundles: 0, averageLoadTime: 0, slowestBundle: null };
    }
    
    const totalLoadTime = loadTimes.reduce((acc, time) => acc + time, 0);
    const averageLoadTime = totalLoadTime / loadTimes.length;
    const slowestBundle = Object.entries(this.bundleLoadTimes).reduce(
      (slowest, [name, time]) => time > slowest.time ? { name, time } : slowest,
      { name: '', time: 0 }
    );
    
    return {
      totalBundles: loadTimes.length,
      averageLoadTime: Math.round(averageLoadTime),
      slowestBundle: slowestBundle.name ? slowestBundle : null,
      totalLoadTime: Math.round(totalLoadTime)
    };
  }

  /**
   * Record Core Web Vitals
   */
  recordWebVitals() {
    // This method is now handled by the observers in the constructor
    console.warn('recordWebVitals() is deprecated. Core Web Vitals are now automatically tracked.');
  }
  
  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      metrics: this.metrics,
      cacheMetrics: this.getAllCacheMetrics(),
      summary: this.getPerformanceSummary(),
      slowestEndpoints: this.getSlowestEndpoints(),
      coreWebVitals: this.getCoreWebVitalsScores(),
      bundlePerformance: this.getBundlePerformance(),
      averageInteractionDelay: this.getAverageInteractionDelay(),
      memoryUsage: this.memoryUsage,
      navigationTiming: this.navigationTiming,
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Log performance report
   */
  logPerformanceReport() {
    const summary = this.getPerformanceSummary();
    const slowest = this.getSlowestEndpoints(5);
    
    logger.log('Performance Report (Last 5 minutes):', {
      summary,
      slowestEndpoints: slowest,
      cacheMetrics: this.getAllCacheMetrics(),
    });
  }
  
  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanMs: number = 30 * 60 * 1000) { // 30 minutes
    const cutoff = Date.now() - olderThanMs;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Clean up observers
   */
  destroy(): void {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('[Performance Monitor] Failed to disconnect observer:', error);
      }
    });
    this.observers = [];
    this.isInitialized = false;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-setup for browser environment
if (typeof window !== 'undefined') {
  // Log performance report every 5 minutes
  setInterval(() => {
    performanceMonitor.logPerformanceReport();
    performanceMonitor.clearOldMetrics();
  }, 5 * 60 * 1000);
  
  // Export to window for debugging
  (window as any).__performanceMonitor = performanceMonitor;
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.destroy();
  });
}

/**
 * Higher-order function to wrap API calls with performance monitoring
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  key: string
): T {
  return (async (...args: any[]) => {
    performanceMonitor.startTiming(key);
    
    try {
      const result = await fn(...args);
      performanceMonitor.endTiming(key, false); // Assume cache miss for API calls
      return result;
    } catch (error) {
      performanceMonitor.endTiming(key, false);
      throw error;
    }
  }) as T;
}

/**
 * Decorator for cache hit/miss tracking
 */
export function trackCachePerformance(key: string, cacheHit: boolean) {
  performanceMonitor.endTiming(key, cacheHit);
}