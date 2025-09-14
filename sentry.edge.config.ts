import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Environment configuration
  environment: process.env.NODE_ENV || 'development',
  
  // Performance monitoring for edge runtime
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Edge runtime specific configuration
  integrations: [
    // Limited integrations for edge runtime
  ],
  
  // Filter out noise and focus on important errors
  beforeSend(event, hint) {
    // Filter out known edge runtime errors
    if (event.exception) {
      const error = hint.originalException;
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
      ) {
        // Filter out common edge runtime errors
        if (
          error.message.includes('Dynamic Code Evaluation') ||
          error.message.includes('Edge Runtime') ||
          error.message.includes('Middleware timeout')
        ) {
          return null;
        }
      }
    }
    
    return event;
  },
  
  // Custom tags for edge runtime
  initialScope: {
    tags: {
      component: 'edge',
      runtime: 'edge',
      version: process.env.npm_package_version || '1.0.0',
    },
  },
  
  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',
  
  // Reduced breadcrumbs for edge runtime
  maxBreadcrumbs: 25,
  
  // Attach stack traces
  attachStacktrace: true,
  
  // No PII in edge runtime
  sendDefaultPii: false,
  
  // Custom breadcrumb filtering for edge
  beforeBreadcrumb(breadcrumb, hint) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null;
    }
    
    // Enhance edge breadcrumbs
    if (breadcrumb.category === 'http') {
      breadcrumb.data = {
        ...breadcrumb.data,
        timestamp: Date.now(),
        runtime: 'edge',
      };
    }
    
    return breadcrumb;
  },
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'development',
  
  // Reduced profiling for edge runtime
  profilesSampleRate: 0,
});

// Custom middleware wrapper for Sentry
export function withSentryMiddleware(middleware: any) {
  return async (request: Request, event: any) => {
    // Set request context for middleware
    Sentry.withScope((scope: any) => {
      scope.setTag('middleware', 'nextjs');
      scope.setContext('request', {
        method: request.method,
        url: request.url,
        headers: {
          'user-agent': request.headers.get('user-agent'),
          'accept': request.headers.get('accept'),
          'referer': request.headers.get('referer'),
        },
      });
    });
    
    try {
      const startTime = Date.now();
      const result = await middleware(request, event);
      const duration = Date.now() - startTime;
      
      // Track middleware performance
      Sentry.addBreadcrumb({
        category: 'middleware-performance',
        message: `Middleware executed in ${duration}ms`,
        level: 'info',
        data: {
          method: request.method,
          url: request.url,
          duration,
        },
      });
      
      return result;
    } catch (error) {
      // Capture middleware errors
      Sentry.withScope((scope) => {
        scope.setTag('error-boundary', 'middleware');
        scope.setContext('middleware-error', {
          url: request.url,
          method: request.method,
        });
        Sentry.captureException(error);
      });
      
      throw error;
    }
  };
}

// Custom function for edge API error tracking
export function captureEdgeAPIError(
  error: any,
  request: Request,
  context?: Record<string, any>
) {
  Sentry.withScope((scope) => {
    scope.setTag('error-type', 'edge-api');
    scope.setTag('request-method', request.method);
    scope.setTag('request-url', request.url);
    
    scope.setContext('edge-api', {
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString(),
      ...context,
    });
    
    Sentry.captureException(error);
  });
}

// Custom function for edge performance monitoring
export function trackEdgePerformance(
  operation: string,
  duration: number,
  request?: Request,
  metadata?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category: 'edge-performance',
    message: `${operation} completed in ${duration}ms`,
    level: 'info',
    data: {
      operation,
      duration,
      url: request?.url,
      method: request?.method,
      ...metadata,
      timestamp: Date.now(),
    },
  });
  
  // Set custom measurement
  Sentry.setMeasurement(`edge.${operation}`, duration, 'millisecond');
  
  // Log slow edge operations
  if (duration > 500) {
    Sentry.captureMessage(`Slow edge operation: ${operation}`, {
      level: 'warning',
      tags: {
        'performance-issue': 'slow-edge-operation',
        operation,
      },
      extra: {
        duration,
        url: request?.url,
        method: request?.method,
        ...metadata,
      },
    });
  }
}

// Helper function to capture edge events
export function captureEdgeEvent(message: string, request?: Request, data?: any) {
  Sentry.captureMessage(message, {
    level: 'info',
    tags: {
      component: 'edge',
      runtime: 'edge',
    },
    extra: {
      url: request?.url,
      method: request?.method,
      ...data,
    },
  });
}

// Helper function to set edge context
export function setSentryEdgeContext(key: string, context: any) {
  Sentry.setContext(key, context);
}

// Helper function to add edge tags
export function setSentryEdgeTag(key: string, value: string) {
  Sentry.setTag(key, value);
}