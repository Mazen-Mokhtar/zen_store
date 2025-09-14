// Advanced error tracking and reporting system

import React from 'react';
import { monitoring } from './monitoring-analytics';

interface ErrorContext {
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  timestamp: number;
  component?: string;
  action?: string;
  props?: Record<string, any>;
  state?: Record<string, any>;
  breadcrumbs?: Breadcrumb[];
}

interface Breadcrumb {
  timestamp: number;
  category: 'navigation' | 'user' | 'http' | 'console' | 'error';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  type: 'javascript' | 'react' | 'network' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  fingerprint: string;
  tags: string[];
  extra: Record<string, any>;
}

interface ErrorTrackingConfig {
  maxBreadcrumbs: number;
  enableConsoleCapture: boolean;
  enableNetworkCapture: boolean;
  enableUserInteractionCapture: boolean;
  enablePerformanceCapture: boolean;
  beforeSend?: (report: ErrorReport) => ErrorReport | null;
  onError?: (report: ErrorReport) => void;
  ignoreErrors: (string | RegExp)[];
  ignoreUrls: (string | RegExp)[];
  allowUrls: (string | RegExp)[];
  sampleRate: number;
}

// Default error tracking configuration
export const ERROR_TRACKING_CONFIG: ErrorTrackingConfig = {
  maxBreadcrumbs: 50,
  enableConsoleCapture: true,
  enableNetworkCapture: true,
  enableUserInteractionCapture: true,
  enablePerformanceCapture: true,
  ignoreErrors: [
    /Script error/,
    /Non-Error promise rejection captured/,
    /ResizeObserver loop limit exceeded/,
    /ChunkLoadError/,
    /AbortError/,
    /ERR_ABORTED/,
    /The user aborted a request/
  ],
  ignoreUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i
  ],
  allowUrls: [],
  sampleRate: 1.0
};

// Advanced error tracking class
export class ErrorTracker {
  private config: ErrorTrackingConfig;
  private breadcrumbs: Breadcrumb[] = [];
  private isInitialized = false;
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
  };

  constructor(config: ErrorTrackingConfig = ERROR_TRACKING_CONFIG) {
    this.config = { ...ERROR_TRACKING_CONFIG, ...config };
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };
  }

  // Initialize error tracking
  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.setupGlobalErrorHandlers();
    
    if (this.config.enableConsoleCapture) {
      this.setupConsoleCapture();
    }
    
    if (this.config.enableNetworkCapture) {
      this.setupNetworkCapture();
    }
    
    if (this.config.enableUserInteractionCapture) {
      this.setupUserInteractionCapture();
    }
    
    if (this.config.enablePerformanceCapture) {
      this.setupPerformanceCapture();
    }

    this.addBreadcrumb({
      category: 'navigation',
      message: 'Error tracking initialized',
      level: 'info',
      data: { url: window.location.href }
    });

    this.isInitialized = true;
  }

  // Setup global error handlers
  private setupGlobalErrorHandlers(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      const error = event.error || new Error(event.message);
      this.captureError(error, {
        type: 'javascript',
        severity: 'high',
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      this.captureError(error, {
        type: 'javascript',
        severity: 'high',
        extra: {
          type: 'unhandled_promise_rejection',
          reason: event.reason
        }
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.captureError(new Error(`Resource loading failed: ${target.tagName}`), {
          type: 'network',
          severity: 'medium',
          extra: {
            tagName: target.tagName,
            src: (target as any).src || (target as any).href,
            outerHTML: target.outerHTML
          }
        });
      }
    }, true);
  }

  // Setup console capture
  private safeStringify(obj: any): string {
    try {
      // Handle DOM elements and other objects with circular references
      if (obj && typeof obj === 'object') {
        // Check if it's a DOM element
        if (obj.nodeType && obj.nodeName) {
          return `[${obj.nodeName}${obj.id ? '#' + obj.id : ''}${obj.className ? '.' + obj.className.split(' ').join('.') : ''}]`;
        }
        
        // Check if it's an Error object
        if (obj instanceof Error) {
          return `${obj.name}: ${obj.message}`;
        }
        
        // Try to stringify with circular reference handling
        const seen = new WeakSet();
        return JSON.stringify(obj, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular]';
            }
            seen.add(value);
          }
          return value;
        });
      }
      return JSON.stringify(obj);
    } catch (error) {
      return String(obj);
    }
  }

  private setupConsoleCapture(): void {
    const wrapConsole = (level: 'log' | 'warn' | 'error', originalMethod: Function) => {
      return (...args: any[]) => {
        // Call original method
        originalMethod.apply(console, args);
        
        // Add breadcrumb
        this.addBreadcrumb({
          category: 'console',
          message: args.map(arg => 
            typeof arg === 'object' ? this.safeStringify(arg) : String(arg)
          ).join(' '),
          level: level === 'log' ? 'info' : level === 'warn' ? 'warning' : 'error',
          data: { arguments: args }
        });
        
        // Capture console errors as actual errors
        if (level === 'error') {
          const error = args.find(arg => arg instanceof Error) || new Error(args.join(' '));
          this.captureError(error, {
            type: 'javascript',
            severity: 'medium',
            extra: { source: 'console.error', arguments: args }
          });
        }
      };
    };

    console.log = wrapConsole('log', this.originalConsole.log);
    console.warn = wrapConsole('warn', this.originalConsole.warn);
    console.error = wrapConsole('error', this.originalConsole.error);
  }

  // Setup network capture
  private setupNetworkCapture(): void {
    // Wrap fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof URL ? args[0].href : (args[0] as Request).url);
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        this.addBreadcrumb({
          category: 'http',
          message: `${args[1]?.method || 'GET'} ${url}`,
          level: response.ok ? 'info' : 'warning',
          data: {
            url,
            method: args[1]?.method || 'GET',
            status: response.status,
            duration
          }
        });
        
        // Capture HTTP errors
        if (!response.ok) {
          this.captureError(new Error(`HTTP ${response.status}: ${response.statusText}`), {
            type: 'network',
            severity: response.status >= 500 ? 'high' : 'medium',
            extra: {
              url,
              method: args[1]?.method || 'GET',
              status: response.status,
              statusText: response.statusText,
              duration
            }
          });
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Check if this is an AbortError from Next.js navigation or monitoring endpoints
        const isAbortError = error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'));
        const isNextJSNavigation = url.includes('_rsc=') || url.includes('?category=') || url.includes('/dashboard');
        const isMonitoringEndpoint = url.includes('/api/analytics') || url.includes('/api/performance');
        const isNetworkAbort = error instanceof Error && (error.message.includes('ERR_ABORTED') || error.message.includes('net::ERR_ABORTED'));
        
        // Don't track AbortErrors from Next.js navigation, monitoring endpoints, or network aborts as they are expected
        if (!(isAbortError && (isNextJSNavigation || isMonitoringEndpoint)) && !isNetworkAbort) {
          this.addBreadcrumb({
            category: 'http',
            message: `${args[1]?.method || 'GET'} ${url} - Network Error`,
            level: 'error',
            data: {
              url,
              method: args[1]?.method || 'GET',
              error: error instanceof Error ? error.message : String(error),
              duration
            }
          });
          
          this.captureError(error instanceof Error ? error : new Error(String(error)), {
            type: 'network',
            severity: 'high',
            extra: {
              url,
              method: args[1]?.method || 'GET',
              duration
            }
          });
        }
        
        throw error;
      }
    };

    // Wrap XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      (this as any)._errorTracker = {
        method,
        url: url.toString(),
        startTime: Date.now()
      };
      return originalXHROpen.call(this, method, url, args[0], args[1], args[2]);
    };
    
    XMLHttpRequest.prototype.send = function(...args: any[]) {
      const tracker = (this as any)._errorTracker;
      if (tracker) {
        this.addEventListener('load', () => {
          const duration = Date.now() - tracker.startTime;
          errorTracker.addBreadcrumb({
            category: 'http',
            message: `${tracker.method} ${tracker.url}`,
            level: this.status >= 400 ? 'warning' : 'info',
            data: {
              url: tracker.url,
              method: tracker.method,
              status: this.status,
              duration
            }
          });
        });
        
        this.addEventListener('error', () => {
          const duration = Date.now() - tracker.startTime;
          const error = new Error(`XMLHttpRequest failed: ${tracker.method} ${tracker.url}`);
          errorTracker.captureError(error, {
            type: 'network',
            severity: 'high',
            extra: {
              url: tracker.url,
              method: tracker.method,
              duration
            }
          });
        });
      }
      return originalXHRSend.call(this, ...args);
    };
  }

  // Setup user interaction capture
  private setupUserInteractionCapture(): void {
    const captureInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;
      
      this.addBreadcrumb({
        category: 'user',
        message: `${event.type} on ${target.tagName}`,
        level: 'info',
        data: {
          type: event.type,
          tagName: target.tagName,
          id: target.id,
          className: target.className,
          textContent: target.textContent?.slice(0, 100)
        }
      });
    };

    ['click', 'submit', 'input', 'change'].forEach(eventType => {
      document.addEventListener(eventType, captureInteraction, true);
    });

    // Navigation events
    window.addEventListener('popstate', () => {
      this.addBreadcrumb({
        category: 'navigation',
        message: `Navigation to ${window.location.pathname}`,
        level: 'info',
        data: {
          from: document.referrer,
          to: window.location.href
        }
      });
    });
  }

  // Setup performance capture
  private setupPerformanceCapture(): void {
    // Long task detection
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.addBreadcrumb({
              category: 'error',
              message: `Long task detected: ${entry.duration.toFixed(2)}ms`,
              level: 'warning',
              data: {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name
              }
            });
          }
        });
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Long task monitoring not supported');
      }
    }

    // Memory usage monitoring
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usagePercent > 90) {
          this.addBreadcrumb({
            category: 'error',
            message: `High memory usage: ${usagePercent.toFixed(1)}%`,
            level: 'warning',
            data: {
              usedJSHeapSize: memory.usedJSHeapSize,
              totalJSHeapSize: memory.totalJSHeapSize,
              jsHeapSizeLimit: memory.jsHeapSizeLimit,
              usagePercent
            }
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  // Add breadcrumb
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now()
    };

    this.breadcrumbs.push(fullBreadcrumb);
    
    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }
  }

  // Capture error
  captureError(
    error: Error, 
    options: {
      type?: ErrorReport['type'];
      severity?: ErrorReport['severity'];
      tags?: string[];
      extra?: Record<string, any>;
      component?: string;
      action?: string;
    } = {}
  ): string | null {
    // Check sampling rate
    if (Math.random() > this.config.sampleRate) {
      return null;
    }

    // Check ignore patterns
    if (this.shouldIgnoreError(error)) {
      return null;
    }

    const errorId = this.generateErrorId();
    const fingerprint = this.generateFingerprint(error);
    
    const context: ErrorContext = {
      sessionId: monitoring.getSession().sessionId,
      userId: monitoring.getSession().userId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now(),
      component: options.component,
      action: options.action,
      breadcrumbs: [...this.breadcrumbs]
    };

    const report: ErrorReport = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      type: options.type || 'javascript',
      severity: options.severity || 'medium',
      context,
      fingerprint,
      tags: options.tags || [],
      extra: options.extra || {}
    };

    // Apply beforeSend filter
    const filteredReport = this.config.beforeSend ? this.config.beforeSend(report) : report;
    if (!filteredReport) {
      return null;
    }

    // Send to monitoring system
    monitoring.trackError({
      message: filteredReport.message,
      stack: filteredReport.stack,
      severity: filteredReport.severity,
      context: {
        errorId: filteredReport.id,
        fingerprint: filteredReport.fingerprint,
        type: filteredReport.type,
        tags: filteredReport.tags,
        ...filteredReport.extra
      }
    });

    // Call onError callback
    if (this.config.onError) {
      this.config.onError(filteredReport);
    }

    return errorId;
  }

  // Check if error should be ignored
  private shouldIgnoreError(error: Error): boolean {
    const message = error.message;
    const stack = error.stack || '';
    const url = typeof window !== 'undefined' ? window.location.href : '';

    // Check ignore patterns
    for (const pattern of this.config.ignoreErrors) {
      if (typeof pattern === 'string' ? message.includes(pattern) : pattern.test(message)) {
        return true;
      }
    }

    // Check ignore URLs
    for (const pattern of this.config.ignoreUrls) {
      if (typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url)) {
        return true;
      }
      if (typeof pattern === 'string' ? stack.includes(pattern) : pattern.test(stack)) {
        return true;
      }
    }

    // Check allow URLs (if specified, only allow these)
    if (this.config.allowUrls.length > 0) {
      let allowed = false;
      for (const pattern of this.config.allowUrls) {
        if (typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url)) {
          allowed = true;
          break;
        }
      }
      if (!allowed) {
        return true;
      }
    }

    return false;
  }

  // Generate error ID
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate error fingerprint for grouping
  private generateFingerprint(error: Error): string {
    const message = error.message.replace(/\d+/g, 'X'); // Replace numbers with X
    const stack = error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : '';
    const combined = `${error.name}:${message}:${stack}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  // Get recent breadcrumbs
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  // Clear breadcrumbs
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  // Get error statistics
  getErrorStats(): {
    totalBreadcrumbs: number;
    recentErrors: number;
    errorsByType: Record<string, number>;
  } {
    const recentErrors = this.breadcrumbs.filter(
      b => b.category === 'error' && Date.now() - b.timestamp < 300000 // Last 5 minutes
    ).length;

    const errorsByType = this.breadcrumbs
      .filter(b => b.category === 'error')
      .reduce((acc, b) => {
        const type = b.data?.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalBreadcrumbs: this.breadcrumbs.length,
      recentErrors,
      errorsByType
    };
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker();

// React Error Boundary component
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; errorInfo: any }>
) => {
  return class ErrorBoundaryWrapper extends React.Component<P, { hasError: boolean; error?: Error }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
      errorTracker.captureError(error, {
        type: 'react',
        severity: 'high',
        component: Component.displayName || Component.name,
        extra: {
          errorInfo,
          props: this.props
        }
      });
    }

    render() {
      if (this.state.hasError) {
        if (fallback) {
          const FallbackComponent = fallback;
          return <FallbackComponent error={this.state.error!} errorInfo={{}} />;
        }
        return (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <p>We&apos;ve been notified about this error and will fix it soon.</p>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
};

// React hooks for error tracking
export const useErrorTracking = () => {
  const captureError = (error: Error, options?: Parameters<typeof errorTracker.captureError>[1]) => {
    return errorTracker.captureError(error, options);
  };

  const addBreadcrumb = (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => {
    errorTracker.addBreadcrumb(breadcrumb);
  };

  const getBreadcrumbs = () => errorTracker.getBreadcrumbs();
  const getErrorStats = () => errorTracker.getErrorStats();

  return {
    captureError,
    addBreadcrumb,
    getBreadcrumbs,
    getErrorStats
  };
};

// Initialize error tracking
export const initializeErrorTracking = (config?: Partial<ErrorTrackingConfig>): void => {
  if (config) {
    Object.assign(errorTracker['config'], config);
  }
  errorTracker.initialize();
};

// Manual error reporting
export const reportError = (
  message: string,
  options?: {
    severity?: ErrorReport['severity'];
    tags?: string[];
    extra?: Record<string, any>;
  }
): string | null => {
  const error = new Error(message);
  return errorTracker.captureError(error, {
    type: 'custom',
    ...options
  });
};

// Performance error detection
export const detectPerformanceIssues = (): void => {
  if (typeof window === 'undefined') return;

  // Check for memory leaks
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    
    if (usagePercent > 95) {
      reportError('Critical memory usage detected', {
        severity: 'critical',
        tags: ['performance', 'memory'],
        extra: {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercent
        }
      });
    }
  }

  // Check for slow navigation
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigation) {
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
    if (loadTime > 10000) { // Slower than 10 seconds
      reportError('Slow page load detected', {
        severity: 'medium',
        tags: ['performance', 'navigation'],
        extra: {
          loadTime,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstByte: navigation.responseStart - navigation.requestStart
        }
      });
    }
  }
};

// Debug error tracking
export const debugErrorTracking = (): void => {
  console.group('Error Tracking Debug Info');
  
  const stats = errorTracker.getErrorStats();
  console.log('Error Statistics:', stats);
  
  const breadcrumbs = errorTracker.getBreadcrumbs();
  console.log('Recent Breadcrumbs:', breadcrumbs.slice(-10));
  
  console.groupEnd();
};