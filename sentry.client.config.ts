import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment configuration
  environment: process.env.NODE_ENV || 'development',
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay for debugging
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Core Web Vitals and performance monitoring
  integrations: [
    // Integrations will be added back once we verify the correct syntax
  ],
  
  // Filter out noise and focus on important errors
  beforeSend(event, hint) {
    // Filter out known browser extension errors
    if (event.exception) {
      const error = hint.originalException;
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
      ) {
        // Filter out common browser extension errors
        if (
          error.message.includes('Non-Error promise rejection') ||
          error.message.includes('ResizeObserver loop limit exceeded') ||
          error.message.includes('Script error') ||
          error.message.includes('Network request failed')
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
      component: 'client',
      version: process.env.npm_package_version || '1.0.0',
    },
  },
  
  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',
  
  // Note: Unhandled rejections are captured by default in modern Sentry SDK
  
  // Maximum breadcrumbs to keep
  maxBreadcrumbs: 50,
  
  // Attach stack traces to pure capture message calls
  attachStacktrace: true,
  
  // Send default PII (personally identifiable information)
  sendDefaultPii: false,
  
  // Custom error boundary fallback
  beforeBreadcrumb(breadcrumb, hint) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null;
    }
    
    // Enhance navigation breadcrumbs
    if (breadcrumb.category === 'navigation') {
      breadcrumb.data = {
        ...breadcrumb.data,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      };
    }
    
    return breadcrumb;
  },
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',
  
  // Custom transport options (using default transport)
  // transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
  
  // Profiling (experimental)
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0,
});

// Custom function to report Core Web Vitals to Sentry
export function reportWebVitals(metric: any) {
  // Report Core Web Vitals to Sentry
  Sentry.addBreadcrumb({
    category: 'web-vital',
    message: `${metric.name}: ${metric.value}`,
    level: 'info',
    data: {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      rating: metric.rating,
      navigationType: metric.navigationType,
    },
  });
  
  // Set custom measurements for performance monitoring
  Sentry.setMeasurement(metric.name, metric.value, 'millisecond');
  
  // Set tags for better filtering
  Sentry.setTag('web-vital', metric.name);
  Sentry.setTag('web-vital-rating', metric.rating);
  
  // Report as custom event for analytics
  Sentry.captureMessage(`Web Vital: ${metric.name}`, {
    level: 'info',
    tags: {
      webVital: metric.name,
      rating: metric.rating,
    },
    extra: {
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    },
  });
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }
}

// Custom error boundary component
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Custom profiler for performance monitoring
export const SentryProfiler = Sentry.withProfiler;

// Helper function to capture user feedback
export function captureUserFeedback(feedback: {
  name: string;
  email: string;
  message: string;
}) {
  const user = Sentry.getCurrentScope().getUser();
  
  Sentry.captureFeedback({
    name: feedback.name,
    email: feedback.email,
    message: feedback.message,
  });
  
  // Also capture as a message for analytics
  Sentry.captureMessage('User Feedback Received', {
    level: 'info',
    tags: {
      feedbackType: 'user-feedback',
    },
    extra: feedback,
  });
}

// Helper function to set user context
export function setSentryUser(user: {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
}) {
  Sentry.setUser(user);
}

// Helper function to add custom context
export function setSentryContext(key: string, context: any) {
  Sentry.setContext(key, context);
}

// Helper function to add custom tags
export function setSentryTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

// Helper function to capture custom events
export function captureCustomEvent(message: string, data?: any) {
  Sentry.captureMessage(message, {
    level: 'info',
    extra: data,
  });
}