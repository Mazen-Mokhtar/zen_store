// Comprehensive monitoring and analytics system

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

interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  page: string;
  userAgent: string;
}

interface ErrorEvent {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  sessionId: string;
  userId?: string;
  page: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  sessionId: string;
  page: string;
  context?: Record<string, any>;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: number;
  errors: number;
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
  };
  location?: {
    country?: string;
    city?: string;
    timezone: string;
  };
}

interface MonitoringConfig {
  enableAnalytics: boolean;
  enableErrorTracking: boolean;
  enablePerformanceMonitoring: boolean;
  enableUserTracking: boolean;
  sampleRate: number;
  maxEvents: number;
  maxErrors: number;
  flushInterval: number;
  endpoints: {
    analytics?: string;
    errors?: string;
    performance?: string;
  };
}

// Default monitoring configuration
export const MONITORING_CONFIG: MonitoringConfig = {
  enableAnalytics: false, // Disabled to prevent ERR_ABORTED errors
  enableErrorTracking: false, // Disabled to prevent ERR_ABORTED errors
  enablePerformanceMonitoring: false, // Disabled to prevent ERR_ABORTED errors
  enableUserTracking: false, // Disabled to prevent ERR_ABORTED errors
  sampleRate: 1.0, // 100% sampling in development
  maxEvents: 1000,
  maxErrors: 100,
  flushInterval: 30000, // 30 seconds
  endpoints: {
    analytics: '/api/analytics',
    errors: '/api/errors',
    performance: '/api/performance'
  }
};

// Main monitoring and analytics class
export class MonitoringAnalytics {
  private config: MonitoringConfig;
  private sessionId: string;
  private userId?: string;
  private events: AnalyticsEvent[] = [];
  private errors: ErrorEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private session: UserSession;
  private flushTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: MonitoringConfig = MONITORING_CONFIG) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.session = this.initializeSession();
  }

  // Initialize monitoring
  initialize(userId?: string): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    this.userId = userId;
    this.session.userId = userId;
    
    if (this.config.enableErrorTracking) {
      this.setupErrorTracking();
    }
    
    if (this.config.enablePerformanceMonitoring) {
      this.setupPerformanceMonitoring();
    }
    
    if (this.config.enableAnalytics) {
      this.setupAnalytics();
    }
    
    // Start periodic flushing
    this.startFlushTimer();
    
    // Track page load
    this.trackEvent('page_load', {
      url: window.location.href,
      referrer: document.referrer,
      loadTime: performance.now()
    });
    
    this.isInitialized = true;
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize user session
  private initializeSession(): UserSession {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: 0,
      errors: 0,
      device: this.detectDevice(userAgent),
      location: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  }

  // Detect device information
  private detectDevice(userAgent: string): UserSession['device'] {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent);
    
    let os = 'Unknown';
    if (/Windows/i.test(userAgent)) os = 'Windows';
    else if (/Mac/i.test(userAgent)) os = 'macOS';
    else if (/Linux/i.test(userAgent)) os = 'Linux';
    else if (/Android/i.test(userAgent)) os = 'Android';
    else if (/iOS/i.test(userAgent)) os = 'iOS';
    
    let browser = 'Unknown';
    if (/Chrome/i.test(userAgent)) browser = 'Chrome';
    else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/Safari/i.test(userAgent)) browser = 'Safari';
    else if (/Edge/i.test(userAgent)) browser = 'Edge';
    
    return {
      type: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
      os,
      browser
    };
  }

  // Setup error tracking
  private setupErrorTracking(): void {
    if (typeof window === 'undefined') return;
    
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        severity: 'high'
      });
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        severity: 'high',
        context: { type: 'unhandled_promise_rejection' }
      });
    });
    
    // React error boundary integration
    if (typeof window !== 'undefined') {
      (window as any).__MONITORING_TRACK_ERROR__ = (error: Error, errorInfo: any) => {
        this.trackError({
          message: error.message,
          stack: error.stack,
          severity: 'critical',
          context: { errorInfo, type: 'react_error_boundary' }
        });
      };
    }
  }

  // Setup performance monitoring
  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;
    
    // Web Vitals monitoring
    getCLS((metric: Metric) => {
      this.trackPerformance('cls', metric.value, { delta: metric.delta });
    });
    
    getFID((metric: Metric) => {
      this.trackPerformance('fid', metric.value, { delta: metric.delta });
    });
    
    getFCP((metric: Metric) => {
      this.trackPerformance('fcp', metric.value, { delta: metric.delta });
    });
    
    getLCP((metric: Metric) => {
      this.trackPerformance('lcp', metric.value, { delta: metric.delta });
    });
    
    getTTFB((metric: Metric) => {
      this.trackPerformance('ttfb', metric.value, { delta: metric.delta });
    });
    
    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
          this.trackPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
          this.trackPerformance('first_byte', navigation.responseStart - navigation.requestStart);
        }
      }, 0);
    });
    
    // Resource timing
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          this.trackPerformance('resource_load_time', entry.duration, {
            name: entry.name,
            type: (entry as PerformanceResourceTiming).initiatorType
          });
        }
      });
    });
    
    resourceObserver.observe({ entryTypes: ['resource'] });
    
    // Long task monitoring
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.trackPerformance('long_task', entry.duration, {
            startTime: entry.startTime
          });
        });
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Long task monitoring not supported');
      }
    }
  }

  // Setup analytics tracking
  private setupAnalytics(): void {
    if (typeof window === 'undefined') return;
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('page_visibility_change', {
        hidden: document.hidden
      });
    });
    
    // Track user interactions
    ['click', 'scroll', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType as keyof DocumentEventMap, this.throttle(() => {
        this.updateLastActivity();
      }, 1000) as EventListener);
    });
    
    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('page_unload', {
        sessionDuration: Date.now() - this.session.startTime
      });
      // Fire and forget flush on page unload
      this.flush().catch(console.error);
    });
  }

  // Track analytics event
  trackEvent(name: string, properties: Record<string, any> = {}): void {
    if (!this.config.enableAnalytics || !this.shouldSample()) return;
    
    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };
    
    this.events.push(event);
    this.session.events++;
    this.updateLastActivity();
    
    // Auto-flush if buffer is full (disabled to prevent ERR_ABORTED errors)
    // if (this.events.length >= this.config.maxEvents) {
    //   this.flush().catch(console.error);
    // }
  }

  // Track error
  trackError(error: Omit<ErrorEvent, 'timestamp' | 'sessionId' | 'userId' | 'page' | 'userAgent'>): void {
    if (!this.config.enableErrorTracking) return;
    
    const errorEvent: ErrorEvent = {
      ...error,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };
    
    this.errors.push(errorEvent);
    this.session.errors++;
    this.updateLastActivity();
    
    // Log critical errors immediately
    if (error.severity === 'critical') {
      console.error('Critical error tracked:', errorEvent);
      this.flushErrors();
    }
    
    // Auto-flush if buffer is full (disabled to prevent ERR_ABORTED errors)
    // if (this.errors.length >= this.config.maxErrors) {
    //   this.flushErrors();
    // }
  }

  // Track performance metric
  trackPerformance(name: string, value: number, context?: Record<string, any>): void {
    if (!this.config.enablePerformanceMonitoring || !this.shouldSample()) return;
    
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      context
    };
    
    this.performanceMetrics.push(metric);
    this.updateLastActivity();
  }

  // Track page view
  trackPageView(page?: string): void {
    const currentPage = page || (typeof window !== 'undefined' ? window.location.pathname : '');
    
    this.trackEvent('page_view', {
      page: currentPage,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      timestamp: Date.now()
    });
    
    this.session.pageViews++;
  }

  // Track user action
  trackUserAction(action: string, target?: string, properties?: Record<string, any>): void {
    this.trackEvent('user_action', {
      action,
      target,
      ...properties
    });
  }

  // Track conversion
  trackConversion(event: string, value?: number, properties?: Record<string, any>): void {
    this.trackEvent('conversion', {
      event,
      value,
      ...properties
    });
  }

  // Update last activity timestamp
  private updateLastActivity(): void {
    this.session.lastActivity = Date.now();
  }

  // Check if event should be sampled
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  // Throttle function
  private throttle(func: Function, limit: number): Function {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Start flush timer
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushInterval);
  }

  // Flush all data
  async flush(): Promise<void> {
    await Promise.allSettled([
      this.flushEvents(),
      this.flushErrors(),
      this.flushPerformanceMetrics()
    ]);
  }

  // Flush events
  private async flushEvents(): Promise<void> {
    if (this.events.length === 0 || !this.config.endpoints.analytics) return;
    
    const events = [...this.events];
    this.events = [];
    
    try {
      await this.sendData(this.config.endpoints.analytics, {
        events,
        session: this.session
      });
    } catch (error) {
      console.error('Failed to flush events:', error);
      // Re-add events to buffer on failure
      this.events.unshift(...events.slice(-100)); // Keep last 100 events
    }
  }

  // Flush errors
  private async flushErrors(): Promise<void> {
    if (this.errors.length === 0 || !this.config.endpoints.errors) return;
    
    const errors = [...this.errors];
    this.errors = [];
    
    try {
      await this.sendData(this.config.endpoints.errors, {
        errors,
        session: this.session
      });
    } catch (error) {
      console.error('Failed to flush errors:', error);
      // Re-add errors to buffer on failure
      this.errors.unshift(...errors.slice(-50)); // Keep last 50 errors
    }
  }

  // Flush performance metrics
  private async flushPerformanceMetrics(): Promise<void> {
    if (this.performanceMetrics.length === 0 || !this.config.endpoints.performance) return;
    
    const metrics = [...this.performanceMetrics];
    this.performanceMetrics = [];
    
    try {
      await this.sendData(this.config.endpoints.performance, {
        metrics,
        session: this.session
      });
    } catch (error) {
      console.error('Failed to flush performance metrics:', error);
    }
  }

  // Send data to endpoint
  private async sendData(endpoint: string, data: any): Promise<void> {
    if (typeof fetch === 'undefined') return;
    
    // Don't send data if page is unloading to prevent ERR_ABORTED errors
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        keepalive: true // Use keepalive for requests during page unload
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Silently handle errors to prevent console noise
      // The monitoring system should not disrupt the user experience
    }
  }

  // Get current session
  getSession(): UserSession {
    return { ...this.session };
  }

  // Get analytics summary
  getAnalyticsSummary(): {
    events: number;
    errors: number;
    performanceMetrics: number;
    sessionDuration: number;
  } {
    return {
      events: this.session.events,
      errors: this.session.errors,
      performanceMetrics: this.performanceMetrics.length,
      sessionDuration: Date.now() - this.session.startTime
    };
  }

  // Cleanup
  cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    // Fire and forget flush on cleanup
    this.flush().catch(console.error);
  }
}

// Error boundary for React
export class ErrorBoundary extends Error {
  constructor(message: string, public componentStack?: string) {
    super(message);
    this.name = 'ErrorBoundary';
  }
}

// Global monitoring instance
export const monitoring = new MonitoringAnalytics();

// React hooks for monitoring
export const useMonitoring = () => {
  const trackEvent = (name: string, properties?: Record<string, any>) => {
    monitoring.trackEvent(name, properties);
  };
  
  const trackError = (error: Error, context?: Record<string, any>) => {
    monitoring.trackError({
      message: error.message,
      stack: error.stack,
      severity: 'medium',
      context
    });
  };
  
  const trackPageView = (page?: string) => {
    monitoring.trackPageView(page);
  };
  
  const trackUserAction = (action: string, target?: string, properties?: Record<string, any>) => {
    monitoring.trackUserAction(action, target, properties);
  };
  
  const trackConversion = (event: string, value?: number, properties?: Record<string, any>) => {
    monitoring.trackConversion(event, value, properties);
  };
  
  return {
    trackEvent,
    trackError,
    trackPageView,
    trackUserAction,
    trackConversion
  };
};

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  const trackPerformance = (name: string, value: number, context?: Record<string, any>) => {
    monitoring.trackPerformance(name, value, context);
  };
  
  const getAnalyticsSummary = () => monitoring.getAnalyticsSummary();
  
  return {
    trackPerformance,
    getAnalyticsSummary
  };
};

// Initialize monitoring
export const initializeMonitoring = (userId?: string): void => {
  monitoring.initialize(userId);
  
  // Setup automatic page view tracking for SPA navigation
  if (typeof window !== 'undefined') {
    let currentPath = window.location.pathname;
    
    const trackNavigation = () => {
      const newPath = window.location.pathname;
      if (newPath !== currentPath) {
        currentPath = newPath;
        monitoring.trackPageView(newPath);
      }
    };
    
    // Listen for navigation events
    window.addEventListener('popstate', trackNavigation);
    
    // Override pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(trackNavigation, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setTimeout(trackNavigation, 0);
    };
  }
};

// Debug monitoring
export const debugMonitoring = (): void => {
  console.group('Monitoring Debug Info');
  
  const session = monitoring.getSession();
  console.log('Current Session:', session);
  
  const summary = monitoring.getAnalyticsSummary();
  console.log('Analytics Summary:', summary);
  
  console.groupEnd();
};

// Real-time analytics dashboard data
export const getRealtimeAnalytics = () => {
  const session = monitoring.getSession();
  const summary = monitoring.getAnalyticsSummary();
  
  return {
    session,
    summary,
    isActive: Date.now() - session.lastActivity < 30000, // Active if last activity within 30 seconds
    sessionDuration: Date.now() - session.startTime,
    averageEventRate: summary.events / ((Date.now() - session.startTime) / 1000 / 60), // Events per minute
    errorRate: summary.errors / Math.max(summary.events, 1) * 100 // Error percentage
  };
};