import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Environment configuration
  environment: process.env.NODE_ENV || 'development',
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Server-specific integrations
  integrations: [
    Sentry.httpIntegration(),
    Sentry.expressIntegration(),
    Sentry.prismaIntegration(), // If using Prisma
  ],
  
  // Filter out noise and focus on important errors
  beforeSend(event, hint) {
    // Filter out known development errors
    if (event.exception) {
      const error = hint.originalException;
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
      ) {
        // Filter out common server errors that aren't actionable
        if (
          error.message.includes('ECONNRESET') ||
          error.message.includes('EPIPE') ||
          error.message.includes('Client disconnected') ||
          error.message.includes('Request timeout')
        ) {
          return null;
        }
      }
    }
    
    // Filter out development errors in production
    if (process.env.NODE_ENV === 'production' && event.environment === 'development') {
      return null;
    }
    
    return event;
  },
  
  // Custom tags for better error categorization
  initialScope: {
    tags: {
      component: 'server',
      version: process.env.npm_package_version || '1.0.0',
      runtime: 'nodejs',
    },
  },
  
  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',
  
  // Maximum breadcrumbs to keep
  maxBreadcrumbs: 100,
  
  // Attach stack traces to pure capture message calls
  attachStacktrace: true,
  
  // Send default PII (personally identifiable information)
  sendDefaultPii: false,
  
  // Custom breadcrumb filtering
  beforeBreadcrumb(breadcrumb, hint) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null;
    }
    
    // Filter out health check requests
    if (
      breadcrumb.category === 'http' &&
      breadcrumb.data?.url?.includes('/api/health')
    ) {
      return null;
    }
    
    // Enhance HTTP breadcrumbs with additional context
    if (breadcrumb.category === 'http') {
      breadcrumb.data = {
        ...breadcrumb.data,
        timestamp: Date.now(),
        nodeVersion: process.version,
      };
    }
    
    return breadcrumb;
  },
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'development',
  
  // Server-specific transport options
  transport: Sentry.makeNodeTransport,
  
  // Profiling (experimental)
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0,
  
  // Note: Unhandled rejections are captured by default in modern Sentry SDK
});

// Custom middleware for API routes
export function withSentryAPI(handler: any) {
  return async (req: any, res: any) => {
    // Set request context
    const scope = Sentry.getCurrentScope();
    scope.setTag('api-route', req.url);
    scope.setContext('request', {
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'accept': req.headers.accept,
        'content-type': req.headers['content-type'],
      },
      query: req.query,
    });
    
    try {
      const startTime = Date.now();
      const result = await handler(req, res);
      const duration = Date.now() - startTime;
      
      // Track API performance
      Sentry.addBreadcrumb({
        category: 'api-performance',
        message: `${req.method} ${req.url} completed in ${duration}ms`,
        level: 'info',
        data: {
          method: req.method,
          url: req.url,
          duration,
          statusCode: res.statusCode,
        },
      });
      
      return result;
    } catch (error) {
      // Capture API errors with additional context
      Sentry.withScope((scope) => {
        scope.setTag('error-boundary', 'api-route');
        scope.setContext('api-error', {
          route: req.url,
          method: req.method,
          statusCode: res.statusCode,
        });
        Sentry.captureException(error);
      });
      
      throw error;
    }
  };
}

// Custom function for database error tracking
export function captureDBError(error: any, operation: string, table?: string) {
  Sentry.withScope((scope) => {
    scope.setTag('error-type', 'database');
    scope.setTag('db-operation', operation);
    if (table) scope.setTag('db-table', table);
    
    scope.setContext('database', {
      operation,
      table,
      timestamp: new Date().toISOString(),
    });
    
    Sentry.captureException(error);
  });
}

// Custom function for external API error tracking
export function captureExternalAPIError(
  error: any,
  service: string,
  endpoint: string,
  statusCode?: number
) {
  Sentry.withScope((scope) => {
    scope.setTag('error-type', 'external-api');
    scope.setTag('external-service', service);
    scope.setTag('api-endpoint', endpoint);
    if (statusCode) scope.setTag('status-code', statusCode.toString());
    
    scope.setContext('external-api', {
      service,
      endpoint,
      statusCode,
      timestamp: new Date().toISOString(),
    });
    
    Sentry.captureException(error);
  });
}

// Custom function for performance monitoring
export function trackServerPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category: 'performance',
    message: `${operation} completed in ${duration}ms`,
    level: 'info',
    data: {
      operation,
      duration,
      ...metadata,
      timestamp: Date.now(),
    },
  });
  
  // Set custom measurement
  Sentry.setMeasurement(`server.${operation}`, duration, 'millisecond');
  
  // Log slow operations
  if (duration > 1000) {
    Sentry.captureMessage(`Slow server operation: ${operation}`, {
      level: 'warning',
      tags: {
        'performance-issue': 'slow-operation',
        operation,
      },
      extra: {
        duration,
        ...metadata,
      },
    });
  }
}

// Helper function to set server user context
export function setSentryServerUser(user: {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
}) {
  Sentry.setUser(user);
}

// Helper function to add server context
export function setSentryServerContext(key: string, context: any) {
  Sentry.setContext(key, context);
}

// Helper function to capture server events
export function captureServerEvent(message: string, data?: any) {
  Sentry.captureMessage(message, {
    level: 'info',
    tags: {
      component: 'server',
    },
    extra: data,
  });
}