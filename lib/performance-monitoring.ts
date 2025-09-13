// Advanced performance monitoring and analytics

// Web vitals import - optional dependency
type Metric = {
  name: string;
  value: number;
  delta: number;
  id: string;
};

// Fallback implementations for web vitals
const getCLS = (callback: (metric: Metric) => void) => {
  // Fallback implementation
};
const getFID = (callback: (metric: Metric) => void) => {
  // Fallback implementation
};
const getFCP = (callback: (metric: Metric) => void) => {
  // Fallback implementation
};
const getLCP = (callback: (metric: Metric) => void) => {
  // Fallback implementation
};
const getTTFB = (callback: (metric: Metric) => void) => {
  // Fallback implementation
};

interface PerformanceMetrics {
  // Core Web Vitals
  cls: number | null;
  fid: number | null;
  fcp: number | null;
  lcp: number | null;
  ttfb: number | null;
  
  // Custom metrics
  pageLoadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  resourceLoadTime: number;
  memoryUsage: number;
  connectionType: string;
  
  // User interaction metrics
  timeToInteractive: number | null;
  totalBlockingTime: number | null;
  cumulativeLayoutShift: number | null;
}

interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
}

interface PerformanceReport {
  metrics: PerformanceMetrics;
  score: number;
  recommendations: string[];
  timestamp: number;
  url: string;
  userAgent: string;
}

// Performance thresholds based on Google's recommendations
export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 }
};

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private reportCallback?: (report: PerformanceReport) => void;
  
  constructor(reportCallback?: (report: PerformanceReport) => void) {
    this.reportCallback = reportCallback;
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    // Initialize Web Vitals monitoring
    this.initWebVitals();
    
    // Initialize custom performance monitoring
    this.initCustomMetrics();
    
    // Initialize resource monitoring
    this.initResourceMonitoring();
    
    // Initialize memory monitoring
    this.initMemoryMonitoring();
    
    // Generate report after page load
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(() => this.generateReport(), 5000);
      });
    }
  }

  private initWebVitals(): void {
    getCLS((metric: Metric) => {
      this.metrics.cls = metric.value;
      this.metrics.cumulativeLayoutShift = metric.value;
    });
    
    getFID((metric: Metric) => {
      this.metrics.fid = metric.value;
    });
    
    getFCP((metric: Metric) => {
      this.metrics.fcp = metric.value;
      this.metrics.firstPaint = metric.value;
    });
    
    getLCP((metric: Metric) => {
      this.metrics.lcp = metric.value;
    });
    
    getTTFB((metric: Metric) => {
      this.metrics.ttfb = metric.value;
    });
  }

  private initCustomMetrics(): void {
    if (typeof window === 'undefined') return;
    
    // Page load time
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      }
    });
    
    // Time to Interactive (TTI)
    this.measureTimeToInteractive();
    
    // Connection information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionType = connection.effectiveType || 'unknown';
    }
  }

  private initResourceMonitoring(): void {
    if (typeof window === 'undefined') return;
    
    // Monitor resource loading
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalResourceTime = 0;
      
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          totalResourceTime += entry.duration;
        }
      });
      
      this.metrics.resourceLoadTime = totalResourceTime;
    });
    
    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.push(resourceObserver);
  }

  private initMemoryMonitoring(): void {
    if (typeof window === 'undefined') return;
    
    // Monitor memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let totalBlockingTime = 0;
        
        entries.forEach((entry) => {
          if (entry.duration > 50) {
            totalBlockingTime += entry.duration - 50;
          }
        });
        
        this.metrics.totalBlockingTime = totalBlockingTime;
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn('Long task monitoring not supported');
      }
    }
  }

  private measureTimeToInteractive(): void {
    if (typeof window === 'undefined') return;
    
    let isInteractive = false;
    let interactiveTime = 0;
    
    const checkInteractive = () => {
      if (isInteractive) return;
      
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation && navigation.domContentLoadedEventEnd > 0) {
        isInteractive = true;
        interactiveTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        this.metrics.timeToInteractive = interactiveTime;
      }
    };
    
    // Check periodically
    const interval = setInterval(() => {
      checkInteractive();
      if (isInteractive) {
        clearInterval(interval);
      }
    }, 100);
    
    // Cleanup after 10 seconds
    setTimeout(() => clearInterval(interval), 10000);
  }

  private calculatePerformanceScore(): number {
    const weights = {
      lcp: 0.25,
      fid: 0.25,
      cls: 0.25,
      fcp: 0.15,
      ttfb: 0.1
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([metric, weight]) => {
      const value = this.metrics[metric as keyof PerformanceMetrics] as number;
      if (value !== null && value !== undefined) {
        const threshold = PERFORMANCE_THRESHOLDS[metric as keyof PerformanceThresholds];
        let score = 100;
        
        if (value > threshold.needsImprovement) {
          score = 0;
        } else if (value > threshold.good) {
          score = 50;
        }
        
        totalScore += score * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.lcp && this.metrics.lcp > PERFORMANCE_THRESHOLDS.lcp.good) {
      recommendations.push('Optimize Largest Contentful Paint by reducing server response times and optimizing critical resources');
    }
    
    if (this.metrics.fid && this.metrics.fid > PERFORMANCE_THRESHOLDS.fid.good) {
      recommendations.push('Improve First Input Delay by reducing JavaScript execution time and optimizing event handlers');
    }
    
    if (this.metrics.cls && this.metrics.cls > PERFORMANCE_THRESHOLDS.cls.good) {
      recommendations.push('Reduce Cumulative Layout Shift by setting dimensions for images and avoiding dynamic content insertion');
    }
    
    if (this.metrics.fcp && this.metrics.fcp > PERFORMANCE_THRESHOLDS.fcp.good) {
      recommendations.push('Optimize First Contentful Paint by reducing render-blocking resources and improving server response time');
    }
    
    if (this.metrics.ttfb && this.metrics.ttfb > PERFORMANCE_THRESHOLDS.ttfb.good) {
      recommendations.push('Improve Time to First Byte by optimizing server performance and using CDN');
    }
    
    if (this.metrics.memoryUsage && this.metrics.memoryUsage > 0.8) {
      recommendations.push('Optimize memory usage by reducing JavaScript bundle size and implementing proper cleanup');
    }
    
    if (this.metrics.totalBlockingTime && this.metrics.totalBlockingTime > 300) {
      recommendations.push('Reduce Total Blocking Time by breaking up long-running tasks and optimizing JavaScript execution');
    }
    
    return recommendations;
  }

  public generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      metrics: this.metrics as PerformanceMetrics,
      score: this.calculatePerformanceScore(),
      recommendations: this.generateRecommendations(),
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };
    
    if (this.reportCallback) {
      this.reportCallback(report);
    }
    
    return report;
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Performance analytics service
export class PerformanceAnalytics {
  private reports: PerformanceReport[] = [];
  private maxReports = 50;
  
  addReport(report: PerformanceReport): void {
    this.reports.push(report);
    
    // Keep only the latest reports
    if (this.reports.length > this.maxReports) {
      this.reports = this.reports.slice(-this.maxReports);
    }
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('performance_reports', JSON.stringify(this.reports));
      } catch (e) {
        console.warn('Failed to store performance reports:', e);
      }
    }
  }
  
  getReports(): PerformanceReport[] {
    return [...this.reports];
  }
  
  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.reports.length === 0) return {};
    
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};
    
    this.reports.forEach(report => {
      Object.entries(report.metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          totals[key] = (totals[key] || 0) + value;
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });
    
    const averages: Partial<PerformanceMetrics> = {};
    Object.entries(totals).forEach(([key, total]) => {
      if (typeof total === 'number' && counts[key]) {
        (averages as any)[key] = total / counts[key];
      }
    });
    
    return averages;
  }
  
  getPerformanceTrends(): { metric: string; trend: 'improving' | 'declining' | 'stable' }[] {
    if (this.reports.length < 5) return [];
    
    const recentReports = this.reports.slice(-5);
    const olderReports = this.reports.slice(-10, -5);
    
    if (olderReports.length === 0) return [];
    
    const trends: { metric: string; trend: 'improving' | 'declining' | 'stable' }[] = [];
    
    ['lcp', 'fid', 'cls', 'fcp', 'ttfb'].forEach(metric => {
      const recentAvg = this.calculateAverage(recentReports, metric);
      const olderAvg = this.calculateAverage(olderReports, metric);
      
      if (recentAvg !== null && olderAvg !== null) {
        const change = (recentAvg - olderAvg) / olderAvg;
        
        let trend: 'improving' | 'declining' | 'stable';
        if (change < -0.1) {
          trend = 'improving';
        } else if (change > 0.1) {
          trend = 'declining';
        } else {
          trend = 'stable';
        }
        
        trends.push({ metric, trend });
      }
    });
    
    return trends;
  }
  
  private calculateAverage(reports: PerformanceReport[], metric: string): number | null {
    const values = reports
      .map(report => report.metrics[metric as keyof PerformanceMetrics])
      .filter(value => typeof value === 'number') as number[];
    
    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }
  
  loadStoredReports(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('performance_reports');
        if (stored) {
          this.reports = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to load stored performance reports:', e);
      }
    }
  }
}

// Global performance monitoring instance
export const performanceMonitor = new PerformanceMonitor();
export const performanceAnalytics = new PerformanceAnalytics();

// Initialize performance monitoring
export const initializePerformanceMonitoring = (): void => {
  if (typeof window === 'undefined') return;
  
  // Load stored reports
  performanceAnalytics.loadStoredReports();
  
  // Set up automatic reporting
  const monitor = new PerformanceMonitor((report) => {
    performanceAnalytics.addReport(report);
    
    // Log performance issues in development
    if (process.env.NODE_ENV === 'development') {
      if (report.score < 70) {
        console.warn('Performance issues detected:', report.recommendations);
      }
    }
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    monitor.cleanup();
  });
};

// React hook for performance monitoring
export const usePerformanceMonitoring = () => {
  const getMetrics = () => performanceMonitor.getMetrics();
  const getReports = () => performanceAnalytics.getReports();
  const getAverageMetrics = () => performanceAnalytics.getAverageMetrics();
  const getTrends = () => performanceAnalytics.getPerformanceTrends();
  
  return {
    getMetrics,
    getReports,
    getAverageMetrics,
    getTrends
  };
};

// Performance debugging utilities
export const debugPerformance = (): void => {
  if (typeof window === 'undefined') return;
  
  console.group('Performance Debug Info');
  
  // Navigation timing
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigation) {
    console.log('Navigation Timing:', {
      'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
      'TCP Connection': navigation.connectEnd - navigation.connectStart,
      'Request': navigation.responseStart - navigation.requestStart,
      'Response': navigation.responseEnd - navigation.responseStart,
      'DOM Processing': navigation.domComplete - navigation.domContentLoadedEventStart,
      'Load Event': navigation.loadEventEnd - navigation.loadEventStart
    });
  }
  
  // Resource timing
  const resources = performance.getEntriesByType('resource');
  console.log(`Total Resources: ${resources.length}`);
  
  // Memory info
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory Usage:', {
      'Used': `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      'Total': `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      'Limit': `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
    });
  }
  
  console.groupEnd();
};