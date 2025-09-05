import { NextRequest, NextResponse } from 'next/server';
import { errorHandler, AppError, ErrorType, ErrorSeverity } from '../lib/errorHandler';
import { securityLogger, SecurityEventType, LogLevel } from '../lib/securityLogger';

// Global error boundary for API routes
export function createErrorMiddleware() {
  return {
    // Wrap API handler with error handling
    wrapApiHandler: (handler: (req: NextRequest) => Promise<NextResponse>) => {
      return async (req: NextRequest): Promise<NextResponse> => {
        try {
          // Add request ID for tracking
          const requestId = req.headers.get('x-request-id') || 
                           `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Clone request to add request ID
          const requestWithId = new NextRequest(req.url, {
            method: req.method,
            headers: {
              ...Object.fromEntries(req.headers.entries()),
              'x-request-id': requestId
            },
            body: req.body
          });

          return await handler(requestWithId);
        } catch (error) {
          return errorHandler.handleError(error as Error, req);
        }
      };
    },

    // Handle unhandled promise rejections
    handleUnhandledRejection: (reason: any, promise: Promise<any>) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      
      securityLogger.critical('Unhandled Promise Rejection', {
        error,
        component: 'GlobalErrorHandler',
        additionalContext: {
          promiseString: promise.toString(),
          timestamp: new Date().toISOString()
        }
      });
      
      // Log as security event if it might be an attack
      if (error.message.toLowerCase().includes('security') || 
          error.message.toLowerCase().includes('attack')) {
        securityLogger.logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          `Unhandled rejection with security implications: ${error.message}`,
          {
            blocked: false,
            additionalContext: {
              source: 'unhandled_rejection',
              severity: 'critical'
            }
          }
        );
      }

      // Create error for logging
      const appError = new AppError(
        'Unhandled promise rejection',
        ErrorType.SERVER,
        500,
        ErrorSeverity.CRITICAL,
        false,
        { originalReason: reason?.message || String(reason) }
      );

      // In production, you might want to send this to monitoring service
      if (process.env.NODE_ENV === 'production') {
        // Send to monitoring service (e.g., Sentry, DataDog, etc.)
        console.error('Critical error logged for monitoring');
      }
    },

    // Handle uncaught exceptions
    handleUncaughtException: (error: Error) => {
      securityLogger.critical('Uncaught Exception', {
        error,
        component: 'GlobalErrorHandler',
        additionalContext: {
          timestamp: new Date().toISOString(),
          processId: process.pid
        }
      });
      
      // Log as security event - uncaught exceptions could indicate attacks
      securityLogger.logSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        `Uncaught exception: ${error.message}`,
        {
          blocked: false,
          additionalContext: {
            source: 'uncaught_exception',
            severity: 'critical',
            stack: error.stack
          }
        }
      );

      // Create AppError for consistent handling
      const appError = new AppError(
        'Uncaught exception',
        ErrorType.SERVER,
        500,
        ErrorSeverity.CRITICAL,
        false,
        { originalError: error.message }
      );

      // In production, gracefully shutdown after logging
      if (process.env.NODE_ENV === 'production') {
        console.error('Critical error - initiating graceful shutdown');
        setTimeout(() => {
          process.exit(1);
        }, 1000);
      }
    },

    // Validate request data
    validateRequest: (req: NextRequest, schema?: any) => {
      const errors: string[] = [];

      // Basic validation
      if (req.method === 'POST' || req.method === 'PUT') {
        const contentType = req.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          errors.push('Content-Type must be application/json');
        }
      }

      // Check for required headers
      const requiredHeaders = ['user-agent'];
      for (const header of requiredHeaders) {
        if (!req.headers.get(header)) {
          errors.push(`Missing required header: ${header}`);
        }
      }

      // Validate request size (prevent large payloads)
      const contentLength = req.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
        errors.push('Request payload too large');
      }

      if (errors.length > 0) {
        throw new AppError(
          `Request validation failed: ${errors.join(', ')}`,
          ErrorType.VALIDATION,
          400,
          ErrorSeverity.LOW,
          true,
          { validationErrors: errors }
        );
      }
    },

    // Security checks
    performSecurityChecks: (req: NextRequest) => {
      const userAgent = req.headers.get('user-agent');
      const origin = req.headers.get('origin');
      const referer = req.headers.get('referer');

      // Check for suspicious user agents
      const suspiciousPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python/i,
        /java/i
      ];

      const suspiciousAgent = suspiciousPatterns.find(pattern => 
        userAgent && pattern.test(userAgent)
      );
      
      if (suspiciousAgent) {
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        
        securityLogger.logSecurityEvent(
          SecurityEventType.SECURITY_SCAN_DETECTED,
          `Suspicious user agent detected: ${userAgent}`,
          {
            ipAddress,
            userAgent: userAgent || undefined,
            url: req.url,
            method: req.method,
            blocked: false,
            additionalContext: {
              detectedPattern: suspiciousAgent.toString(),
              fullUserAgent: userAgent
            }
          }
        );
      }

      // Check for potential CSRF attacks
      if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') && 
          origin && referer) {
        const originUrl = new URL(origin);
        const refererUrl = new URL(referer);
        
        if (originUrl.hostname !== refererUrl.hostname) {
          throw new AppError(
            'Potential CSRF attack detected',
            ErrorType.SECURITY,
            403,
            ErrorSeverity.HIGH,
            true,
            { origin, referer }
          );
        }
      }

      // Check for SQL injection patterns in URL
      const url = req.url.toLowerCase();
      const sqlPatterns = [
        /union.*select/,
        /drop.*table/,
        /insert.*into/,
        /delete.*from/,
        /update.*set/,
        /'.*or.*'.*='/,
        /--/,
        /\/\*/
      ];

      const sqlPattern = sqlPatterns.find(pattern => pattern.test(url));
      if (sqlPattern) {
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        
        securityLogger.logSecurityEvent(
          SecurityEventType.SQL_INJECTION_ATTEMPT,
          'SQL injection attempt detected in URL',
          {
            ipAddress,
            userAgent: req.headers.get('user-agent') || '',
            url: req.url,
            method: req.method,
            blocked: true,
            additionalContext: {
              detectedPattern: sqlPattern.toString()
            }
          }
        );
        
        throw new AppError(
          'Potential SQL injection attempt detected',
          ErrorType.SECURITY,
          403,
          ErrorSeverity.HIGH,
          true,
          { url: req.url }
        );
      }

      // Check for XSS patterns in URL
      const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
      ];

      const xssPattern = xssPatterns.find(pattern => pattern.test(url));
      if (xssPattern) {
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        
        securityLogger.logSecurityEvent(
          SecurityEventType.XSS_ATTEMPT,
          'XSS attempt detected in URL',
          {
            ipAddress,
            userAgent: req.headers.get('user-agent') || '',
            url: req.url,
            method: req.method,
            blocked: true,
            additionalContext: {
              detectedPattern: xssPattern.toString()
            }
          }
        );
        
        throw new AppError(
          'Potential XSS attempt detected',
          ErrorType.SECURITY,
          403,
          ErrorSeverity.HIGH,
          true,
          { url: req.url }
        );
      }
    }
  };
}

// Create global error middleware instance
export const errorMiddleware = createErrorMiddleware();

// Setup global error handlers
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', errorMiddleware.handleUnhandledRejection);
  
  // Handle uncaught exceptions
  process.on('uncaughtException', errorMiddleware.handleUncaughtException);
  
  // Handle process termination
  process.on('SIGTERM', () => {
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    process.exit(0);
  });
}

// Enhanced API route wrapper with comprehensive error handling
export function withEnhancedErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    validateRequest?: boolean;
    performSecurityChecks?: boolean;
    requireAuth?: boolean;
  } = {}
) {
  return errorMiddleware.wrapApiHandler(async (req: NextRequest) => {
    // Perform request validation if enabled
    if (options.validateRequest !== false) {
      errorMiddleware.validateRequest(req);
    }

    // Perform security checks if enabled
    if (options.performSecurityChecks !== false) {
      errorMiddleware.performSecurityChecks(req);
    }

    // Check authentication if required
    if (options.requireAuth) {
      const authHeader = req.headers.get('authorization');
      const sessionCookie = req.cookies.get('session');
      
      if (!authHeader && !sessionCookie) {
        throw new AppError(
          'Authentication required',
          ErrorType.AUTHENTICATION,
          401,
          ErrorSeverity.MEDIUM
        );
      }
    }

    return await handler(req);
  });
}