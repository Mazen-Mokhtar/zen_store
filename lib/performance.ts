import { analytics } from './analytics';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface PerformanceObserver {
  onMetric: (metric: PerformanceMetric) => void;
}

class PerformanceManager {
  private observers: PerformanceObserver[] = [];
  private metrics: PerformanceMetric[] = [];
  private isMonitoring: boolean = false;

  constructor() {
    this.initializePerformanceMonitoring();
  }

  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Monitor resource loading
    this.monitorResourceLoading();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor network performance
    this.monitorNetworkPerformance();
  }

  private monitorCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // First Input Delay (FID)
    this.observeFID();
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS();
  }

  private observeLCP(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        if (lastEntry) {
          const metric: PerformanceMetric = {
            name: 'LCP',
            value: lastEntry.startTime,
            unit: 'ms',
            timestamp: Date.now()
          };
          
          this.recordMetric(metric);
          analytics.trackPerformance('lcp', lastEntry.startTime);
        }
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  private observeFID(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          const metric: PerformanceMetric = {
            name: 'FID',
            value: entry.processingStart - entry.startTime,
            unit: 'ms',
            timestamp: Date.now()
          };
          
          this.recordMetric(metric);
          analytics.trackPerformance('fid', metric.value);
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
    }
  }

  private observeCLS(): void {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        
        const metric: PerformanceMetric = {
          name: 'CLS',
          value: clsValue,
          unit: '',
          timestamp: Date.now()
        };
        
        this.recordMetric(metric);
        analytics.trackPerformance('cls', clsValue);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  private monitorResourceLoading(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            const loadTime = resourceEntry.loadEventEnd - resourceEntry.loadEventStart;
            
            const metric: PerformanceMetric = {
              name: 'Resource Load',
              value: loadTime,
              unit: 'ms',
              timestamp: Date.now()
            };
            
            this.recordMetric(metric);
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMemory = memory.usedJSHeapSize / 1024 / 1024; // MB
        
        const metric: PerformanceMetric = {
          name: 'Memory Usage',
          value: usedMemory,
          unit: 'MB',
          timestamp: Date.now()
        };
        
        this.recordMetric(metric);
        analytics.trackPerformance('memory_usage', usedMemory);
      }, 30000); // Check every 30 seconds
    }
  }

  private monitorNetworkPerformance(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      if (connection) {
        const metric: PerformanceMetric = {
          name: 'Network Type',
          value: this.getNetworkTypeValue(connection.effectiveType),
          unit: '',
          timestamp: Date.now()
        };
        
        this.recordMetric(metric);
        analytics.trackPerformance('network_type', metric.value);
      }
    }
  }

  private getNetworkTypeValue(type: string): number {
    switch (type) {
      case 'slow-2g': return 1;
      case '2g': return 2;
      case '3g': return 3;
      case '4g': return 4;
      default: return 0;
    }
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    // Notify observers
    this.observers.forEach(observer => {
      observer.onMetric(metric);
    });
  }

  // Public methods
  addObserver(observer: PerformanceObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: PerformanceObserver): void {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  getLatestMetric(name: string): PerformanceMetric | null {
    const metrics = this.getMetricsByName(name);
    return metrics.length > 0 ? metrics[metrics.length - 1] : null;
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  // Performance optimization helpers
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Image optimization
  preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }

  // Lazy loading helper
  createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver | null {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return null;
    }
    
    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });
  }

  // Bundle size optimization
  async loadModule(modulePath: string): Promise<any> {
    try {
      const module = await import(modulePath);
      return module;
    } catch (error) {
      console.error(`Failed to load module: ${modulePath}`, error);
      throw error;
    }
  }

  // Cache optimization
  setCacheHeaders(url: string, maxAge: number = 3600): void {
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.open('app-cache').then(cache => {
        cache.add(url).then(() => {
          console.log(`Cached: ${url}`);
        });
      });
    }
  }

  // Performance budget checking
  checkPerformanceBudget(metric: PerformanceMetric, budget: number): boolean {
    return metric.value <= budget;
  }

  // Get performance report
  getPerformanceReport(): {
    summary: Record<string, { avg: number; min: number; max: number }>;
    recommendations: string[];
  } {
    const summary: Record<string, { avg: number; min: number; max: number }> = {};
    const recommendations: string[] = [];

    // Group metrics by name
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics
    Object.entries(groupedMetrics).forEach(([name, values]) => {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      summary[name] = { avg, min, max };

      // Generate recommendations
      if (name === 'LCP' && avg > 2500) {
        recommendations.push('LCP is too high. Consider optimizing images and critical resources.');
      }
      if (name === 'FID' && avg > 100) {
        recommendations.push('FID is too high. Consider reducing JavaScript execution time.');
      }
      if (name === 'CLS' && avg > 0.1) {
        recommendations.push('CLS is too high. Consider fixing layout shifts.');
      }
      if (name === 'Memory Usage' && avg > 100) {
        recommendations.push('Memory usage is high. Consider optimizing memory usage.');
      }
    });

    return { summary, recommendations };
  }
}

export const performanceManager = new PerformanceManager();

// Export performance utilities
export const debounce = performanceManager.debounce.bind(performanceManager);
export const throttle = performanceManager.throttle.bind(performanceManager);
export const preloadImage = performanceManager.preloadImage.bind(performanceManager);
export const createIntersectionObserver = performanceManager.createIntersectionObserver.bind(performanceManager);
export const loadModule = performanceManager.loadModule.bind(performanceManager); 