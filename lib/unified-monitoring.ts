import { logger } from './utils';

// Unified interfaces for monitoring
export interface MonitoringEvent {
  type: 'analytics' | 'performance' | 'error' | 'interaction';
  name: string;
  data: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit?: string;
  timestamp: number;
  context?: Record<string, any>;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

export interface UserInteraction {
  type: 'click' | 'scroll' | 'form_submit' | 'search' | 'purchase';
  element?: string;
  value?: any;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

export interface PageView {
  page: string;
  title: string;
  referrer?: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

// Observer pattern for monitoring events
type MonitoringObserver = (event: MonitoringEvent) => void;

class UnifiedMonitoringManager {
  private events: MonitoringEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private pageViews: PageView[] = [];
  private interactions: UserInteraction[] = [];
  private observers: MonitoringObserver[] = [];
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean = true;
  private maxEvents: number = 1000;
  private flushInterval: number = 30000;
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Listen for settings changes
    window.addEventListener('monitoring-toggle', (event: any) => {
      this.isEnabled = event.detail;
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Auto-flush periodically
    this.startAutoFlush();

    // Initialize Core Web Vitals monitoring
    this.initializeCoreWebVitals();
  }

  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private initializeCoreWebVitals(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordPerformanceMetric('LCP', lastEntry.startTime, 'ms', {
          element: (lastEntry as any).element?.tagName
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordPerformanceMetric('FID', (entry as any).processingStart - entry.startTime, 'ms', {
            eventType: (entry as any).name
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        if (clsValue > 0) {
          this.recordPerformanceMetric('CLS', clsValue, 'score');
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Time to First Byte (TTFB)
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordPerformanceMetric('TTFB', navEntry.responseStart - navEntry.requestStart, 'ms');
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });

    } catch (error) {
      logger.warn('Failed to initialize Core Web Vitals monitoring:', error);
    }
  }

  // Observer management
  addObserver(observer: MonitoringObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: MonitoringObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  private notifyObservers(event: MonitoringEvent): void {
    this.observers.forEach(observer => {
      try {
        observer(event);
      } catch (error) {
        logger.warn('Observer error:', error);
      }
    });
  }

  // User management
  setUserId(userId: string): void {
    this.userId = userId;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled) {
      this.startAutoFlush();
    } else if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }

  isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }

  // Analytics methods
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    const monitoringEvent: MonitoringEvent = {
      type: 'analytics',
      name: eventName,
      data: { ...properties },
      timestamp: event.timestamp,
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.events.push(monitoringEvent);
    this.notifyObservers(monitoringEvent);
    this.cleanupOldEvents();
    
    logger.log('Analytics Event:', event);
  }

  trackPageView(page: string, title: string, referrer?: string): void {
    if (!this.isEnabled) return;

    const pageView: PageView = {
      page,
      title,
      referrer,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.pageViews.push(pageView);

    const monitoringEvent: MonitoringEvent = {
      type: 'analytics',
      name: 'page_view',
      data: { page, title, referrer },
      timestamp: pageView.timestamp,
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.events.push(monitoringEvent);
    this.notifyObservers(monitoringEvent);
    this.cleanupOldEvents();
  }

  trackInteraction(type: UserInteraction['type'], element?: string, value?: any): void {
    if (!this.isEnabled) return;

    const interaction: UserInteraction = {
      type,
      element,
      value,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.interactions.push(interaction);

    const monitoringEvent: MonitoringEvent = {
      type: 'interaction',
      name: type,
      data: { element, value },
      timestamp: interaction.timestamp,
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.events.push(monitoringEvent);
    this.notifyObservers(monitoringEvent);
    this.cleanupOldEvents();
  }

  // Performance methods
  recordPerformanceMetric(name: string, value: number, unit?: string, context?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      context
    };

    this.performanceMetrics.push(metric);

    const monitoringEvent: MonitoringEvent = {
      type: 'performance',
      name,
      data: { value, unit, ...context },
      timestamp: metric.timestamp,
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.events.push(monitoringEvent);
    this.notifyObservers(monitoringEvent);
    this.cleanupOldEvents();
  }

  trackError(error: Error, context?: string): void {
    if (!this.isEnabled) return;

    const monitoringEvent: MonitoringEvent = {
      type: 'error',
      name: error.name || 'Error',
      data: {
        message: error.message,
        stack: error.stack,
        context
      },
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.events.push(monitoringEvent);
    this.notifyObservers(monitoringEvent);
    this.cleanupOldEvents();
    
    logger.error('Tracked Error:', error, context);
  }

  // Specialized tracking methods
  trackPurchase(gameId: string, packageId: string, amount: number, currency: string): void {
    this.trackEvent('purchase', {
      gameId,
      packageId,
      amount,
      currency,
      revenue: amount
    });
  }

  trackSearch(query: string, results?: number): void {
    this.trackEvent('search', {
      query,
      results
    });
  }

  trackConversion(type: string, value?: number, currency?: string): void {
    this.trackEvent('conversion', {
      type,
      value,
      currency
    });
  }

  // Data retrieval methods
  getEvents(type?: MonitoringEvent['type']): MonitoringEvent[] {
    if (type) {
      return this.events.filter(event => event.type === type);
    }
    return [...this.events];
  }

  getPerformanceMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.performanceMetrics.filter(metric => metric.name === name);
    }
    return [...this.performanceMetrics];
  }

  getLatestMetric(name: string): PerformanceMetric | null {
    const metrics = this.getPerformanceMetrics(name);
    return metrics.length > 0 ? metrics[metrics.length - 1] : null;
  }

  getPageViews(): PageView[] {
    return [...this.pageViews];
  }

  getInteractions(): UserInteraction[] {
    return [...this.interactions];
  }

  getSummary(): {
    totalEvents: number;
    totalPerformanceMetrics: number;
    totalPageViews: number;
    totalInteractions: number;
    sessionDuration: number;
    topPages: { page: string; views: number }[];
    topEvents: { name: string; count: number }[];
    averageMetrics: { name: string; average: number; unit?: string }[];
  } {
    const now = Date.now();
    const sessionStart = Math.min(
      ...this.events.map(e => e.timestamp),
      ...this.pageViews.map(p => p.timestamp)
    );

    // Calculate top pages
    const pageViewCounts = this.pageViews.reduce((acc, pv) => {
      acc[pv.page] = (acc[pv.page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPages = Object.entries(pageViewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([page, views]) => ({ page, views }));

    // Calculate top events
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Calculate average metrics
    const metricGroups = this.performanceMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = { values: [], unit: metric.unit };
      }
      acc[metric.name].values.push(metric.value);
      return acc;
    }, {} as Record<string, { values: number[]; unit?: string }>);

    const averageMetrics = Object.entries(metricGroups).map(([name, data]) => ({
      name,
      average: data.values.reduce((sum, val) => sum + val, 0) / data.values.length,
      unit: data.unit
    }));

    return {
      totalEvents: this.events.length,
      totalPerformanceMetrics: this.performanceMetrics.length,
      totalPageViews: this.pageViews.length,
      totalInteractions: this.interactions.length,
      sessionDuration: now - sessionStart,
      topPages,
      topEvents,
      averageMetrics
    };
  }

  // Utility methods
  private cleanupOldEvents(): void {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    if (this.performanceMetrics.length > this.maxEvents) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxEvents);
    }
    if (this.pageViews.length > this.maxEvents) {
      this.pageViews = this.pageViews.slice(-this.maxEvents);
    }
    if (this.interactions.length > this.maxEvents) {
      this.interactions = this.interactions.slice(-this.maxEvents);
    }
  }

  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      // In a real application, you would send this data to your analytics service
      const payload = {
        events: this.events,
        performanceMetrics: this.performanceMetrics,
        pageViews: this.pageViews,
        interactions: this.interactions,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: Date.now()
      };

      // Simulate API call
      logger.log('Flushing monitoring data:', {
        eventsCount: this.events.length,
        metricsCount: this.performanceMetrics.length,
        pageViewsCount: this.pageViews.length,
        interactionsCount: this.interactions.length
      });

      // Clear data after successful flush
      this.clear();
    } catch (error) {
      logger.error('Failed to flush monitoring data:', error);
    }
  }

  clear(): void {
    this.events = [];
    this.performanceMetrics = [];
    this.pageViews = [];
    this.interactions = [];
  }

  // Performance utilities
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  }

  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }

  preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        // Skip preloading during SSR
        resolve();
        return;
      }
      
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }

  createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver | null {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return null;
    }
    return new IntersectionObserver(callback, options);
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
    this.observers = [];
    this.clear();
  }
}

// Create singleton instance
export const unifiedMonitoring = new UnifiedMonitoringManager();

// Initialize monitoring when DOM is ready - only in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Additional check to ensure we're in a proper browser environment
  if (window.document && window.navigator) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        // Monitoring is already initialized in constructor
      });
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      unifiedMonitoring.destroy();
    });
  }
}

// Export convenience functions
export const trackEvent = unifiedMonitoring.trackEvent.bind(unifiedMonitoring);
export const trackPageView = unifiedMonitoring.trackPageView.bind(unifiedMonitoring);
export const trackInteraction = unifiedMonitoring.trackInteraction.bind(unifiedMonitoring);
export const trackError = unifiedMonitoring.trackError.bind(unifiedMonitoring);
export const trackPurchase = unifiedMonitoring.trackPurchase.bind(unifiedMonitoring);
export const trackSearch = unifiedMonitoring.trackSearch.bind(unifiedMonitoring);
export const recordPerformanceMetric = unifiedMonitoring.recordPerformanceMetric.bind(unifiedMonitoring);

// Export the manager for advanced usage
export { UnifiedMonitoringManager };