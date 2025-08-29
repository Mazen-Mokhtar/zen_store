import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor, ActivityData } from '../lib/securityMonitor';
import { securityLogger, ErrorSeverity } from '../lib/securityLogger';

// Interface for request context
interface RequestContext {
  startTime: number;
  ipAddress: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  requestId: string;
}

// Interface for monitoring configuration
interface MonitoringConfig {
  enabled: boolean;
  trackAllRequests: boolean;
  trackFailedRequests: boolean;
  trackSlowRequests: boolean;
  slowRequestThresholdMs: number;
  excludePaths: string[];
  includeRequestBody: boolean;
  includeResponseHeaders: boolean;
  maxBodySize: number;
}

class SecurityMonitoringMiddleware {
  private config: MonitoringConfig;
  private requestContexts: Map<string, RequestContext> = new Map();

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabled: true,
      trackAllRequests: false,
      trackFailedRequests: true,
      trackSlowRequests: true,
      slowRequestThresholdMs: 5000, // 5 seconds
      excludePaths: [
        '/favicon.ico',
        '/robots.txt',
        '/_next/static',
        '/_next/image',
        '/api/health'
      ],
      includeRequestBody: false, // For security reasons
      includeResponseHeaders: false,
      maxBodySize: 1024 * 10, // 10KB
      ...config
    };
  }

  // Main monitoring middleware
  public monitor = (handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) => {
    return async (req: NextRequest): Promise<NextResponse> => {
      if (!this.config.enabled) {
        return handler(req);
      }

      const requestContext = this.createRequestContext(req);
      
      try {
        // Check if request should be monitored
        if (!this.shouldMonitorRequest(req)) {
          return handler(req);
        }

        // Check if IP or user is blocked
        const blockResult = await this.checkBlocked(requestContext);
        if (blockResult) {
          return blockResult;
        }

        // Execute the handler
        const response = await handler(req);
        
        // Record the activity
        await this.recordActivity(req, response, requestContext);
        
        return response;
        
      } catch (error) {
        // Record error activity
        await this.recordErrorActivity(req, error, requestContext);
        throw error;
        
      } finally {
        // Cleanup request context
        this.requestContexts.delete(requestContext.requestId);
      }
    };
  };

  // Create request context
  private createRequestContext(req: NextRequest): RequestContext {
    const requestId = this.generateRequestId();
    const ipAddress = this.extractIPAddress(req);
    const userAgent = req.headers.get('user-agent') || undefined;
    const userId = this.extractUserId(req);
    const sessionId = this.extractSessionId(req);

    const context: RequestContext = {
      startTime: Date.now(),
      ipAddress,
      userAgent,
      userId,
      sessionId,
      requestId
    };

    this.requestContexts.set(requestId, context);
    return context;
  }

  // Check if request should be monitored
  private shouldMonitorRequest(req: NextRequest): boolean {
    const pathname = req.nextUrl.pathname;
    
    // Check excluded paths
    for (const excludePath of this.config.excludePaths) {
      if (pathname.startsWith(excludePath)) {
        return false;
      }
    }

    return true;
  }

  // Check if IP or user is blocked
  private async checkBlocked(context: RequestContext): Promise<NextResponse | null> {
    try {
      // Check if IP is blocked
      if (securityMonitor.isIPBlocked(context.ipAddress)) {
        securityLogger.warn('Blocked IP attempted access', {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId
        });

        return new NextResponse(
          JSON.stringify({ 
            error: 'Access denied', 
            message: 'Your IP address has been blocked due to suspicious activity' 
          }),
          { 
            status: 403, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check if user is blocked
      if (context.userId && securityMonitor.isUserBlocked(context.userId)) {
        securityLogger.warn('Blocked user attempted access', {
          userId: context.userId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId
        });

        return new NextResponse(
          JSON.stringify({ 
            error: 'Account suspended', 
            message: 'Your account has been suspended due to suspicious activity' 
          }),
          { 
            status: 403, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }

      return null;
      
    } catch (error) {
      securityLogger.error('Error checking blocked status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: context.requestId
      });
      return null;
    }
  }

  // Record activity
  private async recordActivity(
    req: NextRequest, 
    response: NextResponse, 
    context: RequestContext
  ): Promise<void> {
    try {
      const duration = Date.now() - context.startTime;
      const shouldRecord = this.shouldRecordActivity(req, response, duration);
      
      if (!shouldRecord) {
        return;
      }

      const activity: ActivityData = {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        userId: context.userId,
        sessionId: context.sessionId,
        url: req.nextUrl.pathname + req.nextUrl.search,
        method: req.method,
        timestamp: new Date(context.startTime),
        headers: this.sanitizeHeaders(req.headers),
        body: await this.extractRequestBody(req),
        response: {
          status: response.status,
          headers: this.config.includeResponseHeaders 
            ? this.sanitizeHeaders(response.headers) 
            : undefined
        }
      };

      // Record the activity
      securityMonitor.recordActivity(activity);

      // Log slow requests
      if (this.config.trackSlowRequests && duration > this.config.slowRequestThresholdMs) {
        securityLogger.warn('Slow request detected', {
          url: activity.url,
          method: activity.method,
          duration,
          ipAddress: context.ipAddress,
          userId: context.userId,
          requestId: context.requestId
        });
      }
      
    } catch (error) {
      securityLogger.error('Failed to record activity', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: context.requestId
      });
    }
  }

  // Record error activity
  private async recordErrorActivity(
    req: NextRequest, 
    error: any, 
    context: RequestContext
  ): Promise<void> {
    try {
      const activity: ActivityData = {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        userId: context.userId,
        sessionId: context.sessionId,
        url: req.nextUrl.pathname + req.nextUrl.search,
        method: req.method,
        timestamp: new Date(context.startTime),
        headers: this.sanitizeHeaders(req.headers),
        body: await this.extractRequestBody(req),
        response: {
          status: 500,
          headers: undefined
        }
      };

      // Record the activity
      securityMonitor.recordActivity(activity);

      // Log the error
      securityLogger.error('Request resulted in error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: activity.url,
        method: activity.method,
        ipAddress: context.ipAddress,
        userId: context.userId,
        requestId: context.requestId
      });
      
    } catch (recordError) {
      securityLogger.error('Failed to record error activity', {
        error: recordError instanceof Error ? recordError.message : 'Unknown error',
        originalError: error instanceof Error ? error.message : 'Unknown error',
        requestId: context.requestId
      });
    }
  }

  // Determine if activity should be recorded
  private shouldRecordActivity(
    req: NextRequest, 
    response: NextResponse, 
    duration: number
  ): boolean {
    // Always record if tracking all requests
    if (this.config.trackAllRequests) {
      return true;
    }

    // Record failed requests
    if (this.config.trackFailedRequests && response.status >= 400) {
      return true;
    }

    // Record slow requests
    if (this.config.trackSlowRequests && duration > this.config.slowRequestThresholdMs) {
      return true;
    }

    // Record authentication-related requests
    const pathname = req.nextUrl.pathname;
    if (pathname.includes('/auth/') || pathname.includes('/login') || pathname.includes('/logout')) {
      return true;
    }

    // Record admin requests
    if (pathname.startsWith('/admin/')) {
      return true;
    }

    // Record API requests with errors
    if (pathname.startsWith('/api/') && response.status >= 400) {
      return true;
    }

    return false;
  }

  // Extract IP address from request
  private extractIPAddress(req: NextRequest): string {
    // Check various headers for the real IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIP = req.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    const cfConnectingIP = req.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    // Fallback to connection IP (may not be available in all environments)
    // Note: req.ip is not available in Next.js middleware, so we return 'unknown' as fallback
    return 'unknown';
  }

  // Extract user ID from request (from JWT token or session)
  private extractUserId(req: NextRequest): string | undefined {
    try {
      // Try to get from Authorization header
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // This would need to be implemented based on your JWT library
        // const decoded = jwt.decode(token);
        // return decoded?.userId;
      }

      // Try to get from cookie
      const authCookie = req.cookies.get('auth_token');
      if (authCookie) {
        // This would need to be implemented based on your JWT library
        // const decoded = jwt.decode(authCookie.value);
        // return decoded?.userId;
      }

      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  // Extract session ID from request
  private extractSessionId(req: NextRequest): string | undefined {
    try {
      const sessionCookie = req.cookies.get('session_id');
      return sessionCookie?.value;
    } catch (error) {
      return undefined;
    }
  }

  // Extract request body (with size limits)
  private async extractRequestBody(req: NextRequest): Promise<any> {
    if (!this.config.includeRequestBody) {
      return undefined;
    }

    try {
      const contentType = req.headers.get('content-type');
      
      // Only extract body for certain content types
      if (!contentType || 
          (!contentType.includes('application/json') && 
           !contentType.includes('application/x-www-form-urlencoded'))) {
        return undefined;
      }

      // Check content length
      const contentLength = req.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > this.config.maxBodySize) {
        return { truncated: true, reason: 'Body too large' };
      }

      // Clone the request to avoid consuming the body
      const clonedReq = req.clone();
      
      if (contentType.includes('application/json')) {
        const body = await clonedReq.json();
        return this.sanitizeRequestBody(body);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await clonedReq.formData();
        const body: Record<string, any> = {};
        formData.forEach((value, key) => {
          body[key] = value;
        });
        return this.sanitizeRequestBody(body);
      }

      return undefined;
      
    } catch (error) {
      return { error: 'Failed to extract body' };
    }
  }

  // Sanitize request body to remove sensitive information
  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 'authorization',
      'credit_card', 'ssn', 'social_security', 'passport'
    ];

    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  // Sanitize headers to remove sensitive information
  private sanitizeHeaders(headers: Headers): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveHeaders = [
      'authorization', 'cookie', 'x-api-key', 'x-auth-token'
    ];

    headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveHeaders.includes(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Update configuration
  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  public getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  // Enable/disable monitoring
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  // Get monitoring statistics
  public getStats(): {
    activeRequests: number;
    totalRequestsProcessed: number;
  } {
    return {
      activeRequests: this.requestContexts.size,
      totalRequestsProcessed: 0 // This would need to be tracked separately
    };
  }
}

// Factory function to create monitoring middleware with custom config
export function createSecurityMonitoringMiddleware(config?: Partial<MonitoringConfig>) {
  return new SecurityMonitoringMiddleware(config);
}

// Default monitoring middleware instance
export const securityMonitoringMiddleware = new SecurityMonitoringMiddleware();

// Export types
export type { MonitoringConfig, RequestContext };