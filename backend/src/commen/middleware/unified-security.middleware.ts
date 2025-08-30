import { Injectable, NestMiddleware, BadRequestException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { SecurityConfig } from '../config/security.config';
import { CsrfService } from '../service/csrf.service';
import { SecurityEventType, SecurityMonitoringService } from '../service/security-monitoring.service';

/**
 * Unified Security Middleware that combines all security features:
 * - Helmet security headers
 * - Rate limiting
 * - CSRF protection
 * - Input sanitization
 * - Security monitoring
 */
@Injectable()
export class UnifiedSecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(UnifiedSecurityMiddleware.name);
  
  // Rate limiters
  private readonly generalLimiter;
  private readonly authLimiter;
  
  // CSRF protection settings
  private readonly protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  private readonly exemptPaths = SecurityConfig.csrf.exemptPaths;
  
  constructor(
    private readonly csrfService: CsrfService,
    private readonly securityMonitoringService: SecurityMonitoringService
  ) {
    // Initialize general rate limiter
    this.generalLimiter = rateLimit({
      windowMs: SecurityConfig.rateLimit.windowMs,
      max: SecurityConfig.rateLimit.maxRequests,
      message: { statusCode: 429, message: SecurityConfig.rateLimit.message },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      handler: (req, res, next, options) => {
        this.securityMonitoringService.reportEvent({
          type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          timestamp: new Date(),
          ip: req.ip || '127.0.0.1',
          path: req.path,
          details: {
            headers: req.headers,
            method: req.method,
          }
        });
        res.status(options.statusCode).json(options.message);
      },
    });
    
    // Initialize auth rate limiter
    this.authLimiter = rateLimit({
      windowMs: SecurityConfig.authRateLimit.windowMs,
      max: SecurityConfig.authRateLimit.maxAttempts,
      message: { statusCode: 429, message: SecurityConfig.authRateLimit.message },
      skipSuccessfulRequests: true,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Use combination of IP and email/username for more accurate tracking
        const identifier = req.body?.email || req.body?.username || req.ip;
        return `auth_${identifier}`;
      },
      handler: (req, res, next, options) => {
        this.securityMonitoringService.reportEvent({
          type: SecurityEventType.BRUTE_FORCE_ATTEMPT,
          timestamp: new Date(),
          ip: req.ip || '127.0.0.1',
          email: req.body?.email,
          path: req.path,
          details: {
            userAgent: req.headers['user-agent'],
            method: req.method,
          }
        });
        res.status(options.statusCode).json(options.message);
      },
    });
  }
  
  use(req: Request, res: Response, next: NextFunction) {
    // Apply security measures in sequence
    this.applyHelmetSecurity(req, res, () => {
      this.applyRateLimit(req, res, () => {
        this.applyCsrfProtection(req, res, () => {
          this.applySanitization(req, res, () => {
            this.applySecurityMonitoring(req, res, next);
          });
        });
      });
    });
  }
  
  /**
   * Apply Helmet security headers
   */
  private applyHelmetSecurity(req: Request, res: Response, next: NextFunction) {
    helmet({
      contentSecurityPolicy: {
        directives: SecurityConfig.csp.directives,
        reportOnly: false,
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: SecurityConfig.hsts,
      noSniff: true,
      originAgentCluster: true,
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      xssFilter: true,
      ieNoOpen: true,
    })(req, res, next);
  }
  
  /**
   * Apply rate limiting based on path
   */
  private applyRateLimit(req: Request, res: Response, next: NextFunction) {
    // Check if this is an auth-related endpoint
    const isAuthEndpoint = req.path.includes('/auth/') || 
                          req.path.includes('/login') || 
                          req.path.includes('/signup') ||
                          req.path.includes('/reset-password');
    
    if (isAuthEndpoint) {
      this.authLimiter(req, res, next);
    } else {
      this.generalLimiter(req, res, next);
    }
  }
  
  /**
   * Apply CSRF protection
   */
  private applyCsrfProtection(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF check for exempt paths or non-protected methods
    if (
      !this.protectedMethods.includes(req.method) ||
      this.exemptPaths.some(path => req.path.startsWith(path))
    ) {
      return next();
    }
    
    const csrfToken = req.headers[SecurityConfig.csrf.headerName] as string;
    const cookieToken = req.cookies?.[SecurityConfig.csrf.cookieName];
    
    // If no CSRF token in cookie, generate one for future requests
    if (!cookieToken) {
      return this.setNewCsrfToken(res, next);
    }
    
    // Validate the CSRF token
    if (!csrfToken || !this.csrfService.validateToken(csrfToken, cookieToken)) {
      this.securityMonitoringService.reportEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        timestamp: new Date(),
        ip: req.ip || '127.0.0.1',
        path: req.path,
        details: {
          reason: 'Invalid CSRF token',
          userAgent: req.headers['user-agent'],
        }
      });
      return next(new BadRequestException('Invalid CSRF token'));
    }
    
    next();
  }
  
  /**
   * Apply input sanitization
   */
  private applySanitization(req: Request, res: Response, next: NextFunction) {
    try {
      // Sanitize request body
      if (req.body) {
        this.sanitizeObject(req.body);
      }
      
      // Sanitize query parameters
      if (req.query) {
        this.sanitizeObject(req.query);
      }
      
      // Sanitize URL parameters
      if (req.params) {
        this.sanitizeObject(req.params);
      }
      
      next();
    } catch (error) {
      this.logger.error('Sanitization error:', error);
      next(new BadRequestException('Invalid input data'));
    }
  }
  
  /**
   * Apply security monitoring
   */
  private applySecurityMonitoring(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    // Monitor suspicious patterns
    this.detectSuspiciousActivity(req);
    
    // Override res.end to capture response details
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const responseTime = Date.now() - startTime;
      
      // Log slow requests (potential DoS attempts)
      if (responseTime > 5000) {
        this.securityMonitoringService?.reportEvent({
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          timestamp: new Date(),
          ip: req.ip || '127.0.0.1',
          path: req.path,
          details: {
            reason: 'Slow response time',
            responseTime,
            method: req.method,
          }
        });
      }
      
      originalEnd.call(this, chunk, encoding);
    }.bind(res);
    
    next();
  }
  
  /**
   * Generate and set a new CSRF token
   */
  private setNewCsrfToken(res: Response, next: NextFunction) {
    const newToken = this.csrfService.generateToken();
    
    res.cookie(SecurityConfig.csrf.cookieName, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SecurityConfig.csrf.cookieMaxAge,
    });
    
    next();
  }
  
  /**
   * Sanitize object recursively
   */
  private sanitizeObject(obj: any) {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      if (typeof value === 'string') {
        obj[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'string') {
            value[index] = this.sanitizeString(item);
          } else if (typeof item === 'object' && item !== null) {
            this.sanitizeObject(item);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        this.sanitizeObject(value);
      }
    });
  }
  
  /**
   * Sanitize string values
   */
  private sanitizeString(value: string): string {
    return value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }
  
  /**
   * Detect suspicious activity patterns
   */
  private detectSuspiciousActivity(req: Request) {
    const suspiciousPatterns = [
      /(<script[^>]*>.*?<\/script>)/gi,  // Script injection
      /(javascript:|data:|vbscript:)/gi,   // Protocol injection
      /(union.*select|select.*from|insert.*into|delete.*from|drop.*table)/gi, // SQL injection
      /(\.\.\/|\.\.\\/)/g,              // Path traversal
      /(eval\(|setTimeout\(|setInterval\()/gi, // Code execution
    ];
    
    const checkString = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(checkString)) {
        this.securityMonitoringService.reportEvent({
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          timestamp: new Date(),
          ip: req.ip || '127.0.0.1',
          path: req.path,
          details: {
            reason: 'Suspicious input pattern detected',
            pattern: pattern.source,
            userAgent: req.headers['user-agent'],
            method: req.method,
          }
        });
        break;
      }
    }
  }
}

/**
 * Lightweight middleware for endpoints that don't need full security
 */
@Injectable()
export class BasicSecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Apply only essential security headers
    helmet({
      contentSecurityPolicy: false, // Disable CSP for basic endpoints
      hsts: SecurityConfig.hsts,
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true,
    })(req, res, next);
  }
}