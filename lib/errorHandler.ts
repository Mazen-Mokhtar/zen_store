import { NextRequest, NextResponse } from 'next/server';
import { securityLogger, SecurityEventType, LogLevel } from './securityLogger';

// Error types for classification
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  SERVER = 'SERVER_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  SECURITY = 'SECURITY_ERROR'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Custom error class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: number;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly metadata?: Record<string, any>;

  constructor(
    message: string,
    type: ErrorType,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isOperational: boolean = true,
    metadata?: Record<string, any>
  ) {
    super(message);
    
    this.type = type;
    this.severity = severity;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = Date.now();
    this.metadata = metadata;
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  setRequestId(requestId: string): this {
    (this as any).requestId = requestId;
    return this;
  }

  setUserId(userId: string): this {
    (this as any).userId = userId;
    return this;
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    message: string;
    type: string;
    code: string;
    timestamp: number;
    requestId?: string;
  };
  details?: any;
}

// Security-focused error handler
export class SecurityErrorHandler {
  private static instance: SecurityErrorHandler;
  private sensitivePatterns: RegExp[];
  private logSensitiveErrors: boolean;

  constructor() {
    // Patterns that indicate sensitive information
    this.sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /auth/i,
      /session/i,
      /jwt/i,
      /api[_-]?key/i,
      /database/i,
      /connection/i,
      /env/i,
      /config/i
    ];
    
    this.logSensitiveErrors = process.env.NODE_ENV === 'development';
  }

  static getInstance(): SecurityErrorHandler {
    if (!SecurityErrorHandler.instance) {
      SecurityErrorHandler.instance = new SecurityErrorHandler();
    }
    return SecurityErrorHandler.instance;
  }

  // Sanitize error message to remove sensitive information
  private sanitizeErrorMessage(message: string): string {
    let sanitized = message;
    
    // Remove file paths
    sanitized = sanitized.replace(/\/[^\s]+\.(js|ts|jsx|tsx|json)/g, '[FILE_PATH]');
    
    // Remove potential connection strings
    sanitized = sanitized.replace(/mongodb:\/\/[^\s]+/g, '[DATABASE_URL]');
    sanitized = sanitized.replace(/postgres:\/\/[^\s]+/g, '[DATABASE_URL]');
    sanitized = sanitized.replace(/mysql:\/\/[^\s]+/g, '[DATABASE_URL]');
    
    // Remove potential API keys or tokens
    sanitized = sanitized.replace(/[a-zA-Z0-9]{32,}/g, '[REDACTED]');
    
    // Remove email addresses
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    
    // Remove IP addresses
    sanitized = sanitized.replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, '[IP_ADDRESS]');
    
    return sanitized;
  }

  // Check if error contains sensitive information
  private containsSensitiveInfo(error: Error): boolean {
    const errorString = `${error instanceof Error ? error.message : 'Unknown error'} ${error instanceof Error ? error.stack || '' : ''}`;
    return this.sensitivePatterns.some(pattern => pattern.test(errorString));
  }

  // Generate safe error message for client
  private generateSafeErrorMessage(error: AppError): string {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, use generic messages for certain error types
    if (isProduction) {
      switch (error.type) {
        case ErrorType.DATABASE:
          return 'A database error occurred. Please try again later.';
        case ErrorType.EXTERNAL_API:
          return 'An external service is temporarily unavailable.';
        case ErrorType.SERVER:
          return 'An internal server error occurred.';
        case ErrorType.SECURITY:
          return 'A security error occurred.';
        default:
          // For other errors, sanitize the message
          return this.sanitizeErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // In development, show more details but still sanitize
    return this.sanitizeErrorMessage(error instanceof Error ? error.message : 'Unknown error');
  }

  // Log error securely
  private logError(error: AppError, request?: NextRequest): void {
    const context = {
      userId: error.userId || request?.headers.get('x-user-id') || undefined,
      sessionId: request?.headers.get('x-session-id') || undefined,
      ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      userAgent: request?.headers.get('user-agent') || undefined,
      url: request?.url,
      method: request?.method,
      additionalContext: {
        type: error.type,
        statusCode: error.statusCode,
        requestId: error.requestId,
        metadata: error.metadata,
        timestamp: error.timestamp
      }
    };

    // Log to security logger
    const logLevel = this.getLogLevelFromSeverity(error.severity);
    securityLogger.log(logLevel, error instanceof Error ? error.message : 'Unknown error', context);

    // Log security events for security-related errors
    if (error.type === ErrorType.SECURITY) {
      const securityEventType = this.getSecurityEventType(error);
      securityLogger.logSecurityEvent(
        securityEventType,
        `Security error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          ...context,
          blocked: true,
          additionalContext: {
            errorCode: `E${error.statusCode}`,
            severity: error.severity
          }
        }
      );
    }

    // Log stack trace only in development or for critical errors
    if (this.logSensitiveErrors || error.severity === ErrorSeverity.CRITICAL) {
      securityLogger.log(LogLevel.DEBUG, 'Stack trace', {
        ...context,
        additionalContext: {
          ...context.additionalContext,
          stack: error.stack
        }
      });
    }
  }

  // Map error severity to log level
  private getLogLevelFromSeverity(severity: ErrorSeverity): LogLevel {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return LogLevel.CRITICAL;
      case ErrorSeverity.HIGH:
        return LogLevel.ERROR;
      case ErrorSeverity.MEDIUM:
        return LogLevel.WARN;
      case ErrorSeverity.LOW:
        return LogLevel.INFO;
      default:
        return LogLevel.ERROR;
    }
  }

  // Map error to security event type
  private getSecurityEventType(error: AppError): SecurityEventType {
    const message = (error instanceof Error ? error.message : '').toLowerCase();
    const metadata = error.metadata || {};

    if (message.includes('sql') || message.includes('injection')) {
      return SecurityEventType.SQL_INJECTION_ATTEMPT;
    }
    if (message.includes('xss') || message.includes('script')) {
      return SecurityEventType.XSS_ATTEMPT;
    }
    if (message.includes('csrf')) {
      return SecurityEventType.CSRF_ATTEMPT;
    }
    if (message.includes('path') || message.includes('traversal')) {
      return SecurityEventType.PATH_TRAVERSAL_ATTEMPT;
    }
    if (message.includes('brute') || message.includes('force')) {
      return SecurityEventType.BRUTE_FORCE_ATTEMPT;
    }
    if (message.includes('session') || message.includes('hijack')) {
      return SecurityEventType.SESSION_HIJACK_ATTEMPT;
    }
    if (message.includes('privilege') || message.includes('escalation')) {
      return SecurityEventType.PRIVILEGE_ESCALATION;
    }
    if (message.includes('scan') || message.includes('probe')) {
      return SecurityEventType.SECURITY_SCAN_DETECTED;
    }
    
    return SecurityEventType.SUSPICIOUS_ACTIVITY;
  }

  // Handle error and return appropriate response
  public handleError(error: Error | AppError, request?: NextRequest): NextResponse {
    let appError: AppError;
    
    // Convert regular errors to AppError
    if (!(error instanceof AppError)) {
      // Determine error type based on message content
      let errorType = ErrorType.SERVER;
      let statusCode = 500;
      let severity = ErrorSeverity.MEDIUM;
      
      const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
        errorType = ErrorType.VALIDATION;
        statusCode = 400;
        severity = ErrorSeverity.LOW;
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
        errorType = ErrorType.AUTHENTICATION;
        statusCode = 401;
        severity = ErrorSeverity.MEDIUM;
      } else if (errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
        errorType = ErrorType.AUTHORIZATION;
        statusCode = 403;
        severity = ErrorSeverity.MEDIUM;
      } else if (errorMessage.includes('not found')) {
        errorType = ErrorType.NOT_FOUND;
        statusCode = 404;
        severity = ErrorSeverity.LOW;
      } else if (this.containsSensitiveInfo(error)) {
        errorType = ErrorType.SECURITY;
        statusCode = 500;
        severity = ErrorSeverity.HIGH;
      }
      
      appError = new AppError(
        error instanceof Error ? error.message : 'Unknown error',
        errorType,
        statusCode,
        severity,
        true,
        { originalError: error.constructor.name }
      );
    } else {
      appError = error;
    }

    // Generate request ID if not present
    if (!appError.requestId && request) {
      const requestId = request.headers.get('x-request-id') || 
                       `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      appError.setRequestId(requestId);
    }

    // Log the error
    this.logError(appError, request);

    // Generate safe response
    const errorResponse: ErrorResponse = {
      error: {
        message: this.generateSafeErrorMessage(appError),
        type: appError.type,
        code: `E${appError.statusCode}`,
        timestamp: appError.timestamp,
        requestId: appError.requestId
      }
    };

    // Add details only in development for non-sensitive errors
    if (process.env.NODE_ENV === 'development' && !this.containsSensitiveInfo(appError)) {
      errorResponse.details = {
        stack: appError.stack,
        metadata: appError.metadata
      };
    }

    return NextResponse.json(errorResponse, {
      status: appError.statusCode,
      headers: {
        'X-Request-ID': appError.requestId || 'unknown',
        'X-Error-Type': appError.type
      }
    });
  }
}

// Global error handler instance
export const errorHandler = SecurityErrorHandler.getInstance();

// Middleware wrapper for error handling
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      return errorHandler.handleError(error as Error, request);
    }
  };
}

// Common error factory functions
export const createValidationError = (message: string, metadata?: Record<string, any>) => 
  new AppError(message, ErrorType.VALIDATION, 400, ErrorSeverity.LOW, true, metadata);

export const createAuthenticationError = (message: string = 'Authentication required') => 
  new AppError(message, ErrorType.AUTHENTICATION, 401, ErrorSeverity.MEDIUM);

export const createAuthorizationError = (message: string = 'Insufficient permissions') => 
  new AppError(message, ErrorType.AUTHORIZATION, 403, ErrorSeverity.MEDIUM);

export const createNotFoundError = (resource: string = 'Resource') => 
  new AppError(`${resource} not found`, ErrorType.NOT_FOUND, 404, ErrorSeverity.LOW);

export const createRateLimitError = (message: string = 'Rate limit exceeded') => 
  new AppError(message, ErrorType.RATE_LIMIT, 429, ErrorSeverity.MEDIUM);

export const createSecurityError = (message: string, metadata?: Record<string, any>) => 
  new AppError(message, ErrorType.SECURITY, 403, ErrorSeverity.HIGH, true, metadata);

export const createDatabaseError = (message: string = 'Database operation failed') => 
  new AppError(message, ErrorType.DATABASE, 500, ErrorSeverity.HIGH);

export const createExternalApiError = (service: string, message?: string) => 
  new AppError(
    message || `External service ${service} is unavailable`,
    ErrorType.EXTERNAL_API,
    502,
    ErrorSeverity.MEDIUM
  );