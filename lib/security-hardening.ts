// Advanced security hardening utilities

import { headers } from 'next/headers';
import crypto from 'crypto';

interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
  };
  csrf: {
    enabled: boolean;
    tokenLength: number;
    cookieName: string;
  };
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
  contentSecurity: {
    enabled: boolean;
    reportOnly: boolean;
    directives: Record<string, string[]>;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
  };
}

interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security': string;
  'X-XSS-Protection': string;
  'X-DNS-Prefetch-Control': string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

interface SecurityEvent {
  type: 'rate_limit' | 'csrf_violation' | 'xss_attempt' | 'sql_injection' | 'suspicious_activity';
  ip: string;
  userAgent: string;
  timestamp: number;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Default security configuration
export const SECURITY_CONFIG: SecurityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false
  },
  csrf: {
    enabled: true,
    tokenLength: 32,
    cookieName: '__csrf_token'
  },
  cors: {
    allowedOrigins: [
      'https://zen-store.com',
      'https://www.zen-store.com',
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    credentials: true
  },
  contentSecurity: {
    enabled: true,
    reportOnly: process.env.NODE_ENV === 'development',
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://vercel.live'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'media-src': ["'self'", 'https:'],
      'connect-src': ["'self'", 'https:', 'wss:'],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    }
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32
  }
};

// Security hardening class
export class SecurityHardening {
  private config: SecurityConfig;
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private blockedIPs: Set<string> = new Set();
  private csrfTokens: Map<string, { token: string; expires: number }> = new Map();

  constructor(config: SecurityConfig = SECURITY_CONFIG) {
    this.config = config;
    this.startCleanupInterval();
  }

  // Generate security headers
  generateSecurityHeaders(): SecurityHeaders {
    const headers: SecurityHeaders = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-XSS-Protection': '1; mode=block',
      'X-DNS-Prefetch-Control': 'off'
    };

    if (this.config.contentSecurity.enabled) {
      const csp = this.generateCSP();
      const headerName = this.config.contentSecurity.reportOnly 
        ? 'Content-Security-Policy-Report-Only' 
        : 'Content-Security-Policy';
      headers[headerName as keyof SecurityHeaders] = csp;
    }

    return headers;
  }

  // Generate Content Security Policy
  private generateCSP(): string {
    const directives = Object.entries(this.config.contentSecurity.directives)
      .map(([directive, sources]) => {
        if (sources.length === 0) {
          return directive;
        }
        return `${directive} ${sources.join(' ')}`;
      })
      .join('; ');

    return directives;
  }

  // Rate limiting
  checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.config.rateLimit.windowMs,
        blocked: false
      };
      this.rateLimitStore.set(identifier, newEntry);
      return {
        allowed: true,
        remaining: this.config.rateLimit.maxRequests - 1,
        resetTime: newEntry.resetTime
      };
    }

    entry.count++;

    if (entry.count > this.config.rateLimit.maxRequests) {
      entry.blocked = true;
      this.logSecurityEvent({
        type: 'rate_limit',
        ip: identifier,
        userAgent: '',
        timestamp: now,
        details: { count: entry.count, limit: this.config.rateLimit.maxRequests },
        severity: 'medium'
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    return {
      allowed: true,
      remaining: this.config.rateLimit.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  // CSRF protection
  generateCSRFToken(sessionId: string): string {
    const token = crypto.randomBytes(this.config.csrf.tokenLength).toString('hex');
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    this.csrfTokens.set(sessionId, { token, expires });
    return token;
  }

  validateCSRFToken(sessionId: string, token: string): boolean {
    const stored = this.csrfTokens.get(sessionId);
    
    if (!stored || stored.expires < Date.now()) {
      this.csrfTokens.delete(sessionId);
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(stored.token, 'hex'),
      Buffer.from(token, 'hex')
    );
  }

  // Input sanitization
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>"'&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[char] || char;
      })
      .trim();
  }

  // SQL injection detection
  detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
      /(script|javascript|vbscript|onload|onerror|onclick)/i,
      /(\<|\>|\"|\'|\%|\;|\(|\)|\&|\+)/
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // XSS detection
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]+src[\s]*=[\s]*["']?[\s]*javascript:/gi,
      /<[^>]+style[\s]*=[\s]*["'][^"']*expression[\s]*\(/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  // Validate request
  validateRequest(request: {
    ip: string;
    userAgent: string;
    body?: any;
    headers: Record<string, string>;
  }): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if IP is blocked
    if (this.blockedIPs.has(request.ip)) {
      issues.push('IP address is blocked');
    }

    // Rate limiting
    const rateLimit = this.checkRateLimit(request.ip);
    if (!rateLimit.allowed) {
      issues.push('Rate limit exceeded');
    }

    // Validate user agent
    if (!request.userAgent || request.userAgent.length < 10) {
      issues.push('Invalid or missing user agent');
    }

    // Check for suspicious patterns in headers
    Object.entries(request.headers).forEach(([key, value]) => {
      if (this.detectXSS(value) || this.detectSQLInjection(value)) {
        issues.push(`Suspicious content in header: ${key}`);
        this.logSecurityEvent({
          type: 'suspicious_activity',
          ip: request.ip,
          userAgent: request.userAgent,
          timestamp: Date.now(),
          details: { header: key, value },
          severity: 'high'
        });
      }
    });

    // Validate request body
    if (request.body) {
      const bodyStr = JSON.stringify(request.body);
      if (this.detectXSS(bodyStr)) {
        issues.push('XSS attempt detected in request body');
        this.logSecurityEvent({
          type: 'xss_attempt',
          ip: request.ip,
          userAgent: request.userAgent,
          timestamp: Date.now(),
          details: { body: request.body },
          severity: 'high'
        });
      }
      if (this.detectSQLInjection(bodyStr)) {
        issues.push('SQL injection attempt detected');
        this.logSecurityEvent({
          type: 'sql_injection',
          ip: request.ip,
          userAgent: request.userAgent,
          timestamp: Date.now(),
          details: { body: request.body },
          severity: 'critical'
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // Block IP address
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    this.logSecurityEvent({
      type: 'suspicious_activity',
      ip,
      userAgent: '',
      timestamp: Date.now(),
      details: { reason, action: 'ip_blocked' },
      severity: 'high'
    });
  }

  // Unblock IP address
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
  }

  // Log security events
  private logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Log critical events immediately
    if (event.severity === 'critical') {
      console.error('CRITICAL SECURITY EVENT:', event);
      
      // Auto-block IP for critical events
      this.blockIP(event.ip, `Critical security event: ${event.type}`);
    }

    // Store events in persistent storage (implement based on your needs)
    this.persistSecurityEvent(event);
  }

  // Persist security events (implement based on your storage solution)
  private persistSecurityEvent(event: SecurityEvent): void {
    // This would typically save to a database or log file
    // For now, we'll just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', event);
    }
  }

  // Get security events
  getSecurityEvents(filter?: {
    type?: SecurityEvent['type'];
    severity?: SecurityEvent['severity'];
    since?: number;
  }): SecurityEvent[] {
    let events = [...this.securityEvents];

    if (filter) {
      if (filter.type) {
        events = events.filter(event => event.type === filter.type);
      }
      if (filter.severity) {
        events = events.filter(event => event.severity === filter.severity);
      }
      if (filter.since !== undefined) {
        events = events.filter(event => event.timestamp >= filter.since!);
      }
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get security statistics
  getSecurityStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    blockedIPs: number;
    rateLimitedIPs: number;
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    this.securityEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    const rateLimitedIPs = Array.from(this.rateLimitStore.values())
      .filter(entry => entry.blocked).length;

    return {
      totalEvents: this.securityEvents.length,
      eventsByType,
      eventsBySeverity,
      blockedIPs: this.blockedIPs.size,
      rateLimitedIPs
    };
  }

  // Cleanup expired entries
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Clean up rate limit entries
      for (const [key, entry] of Array.from(this.rateLimitStore.entries())) {
        if (now > entry.resetTime) {
          this.rateLimitStore.delete(key);
        }
      }
      
      // Clean up CSRF tokens
      for (const [key, token] of Array.from(this.csrfTokens.entries())) {
        if (now > token.expires) {
          this.csrfTokens.delete(key);
        }
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }
}

// Encryption utilities
export class EncryptionUtils {
  private static algorithm = SECURITY_CONFIG.encryption.algorithm;
  
  static encrypt(text: string, key: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = (cipher as any).getAuthTag?.() || '';
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
  
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }, key: string): string {
    const decipher = crypto.createDecipher(this.algorithm, key);
    
    if (encryptedData.tag) {
      (decipher as any).setAuthTag?.(Buffer.from(encryptedData.tag, 'hex'));
    }
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  static hash(text: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    return crypto.pbkdf2Sync(text, actualSalt, 10000, 64, 'sha512').toString('hex');
  }
  
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

// Global security instance
export const securityHardening = new SecurityHardening();

// Middleware helper for Next.js
export const createSecurityMiddleware = () => {
  return async (request: Request) => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    
    // Convert headers to plain object
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersObj[key] = value;
    });
    
    // Parse body if present
    let body;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.clone().json();
      } catch {
        // Body is not JSON or empty
      }
    }
    
    const validation = securityHardening.validateRequest({
      ip,
      userAgent,
      body,
      headers: headersObj
    });
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: 'Request blocked for security reasons' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...securityHardening.generateSecurityHeaders()
          }
        }
      );
    }
    
    return null; // Allow request to continue
  };
};

// React hooks for security
export const useSecurity = () => {
  const getSecurityStats = () => securityHardening.getSecurityStats();
  const getSecurityEvents = (filter?: any) => securityHardening.getSecurityEvents(filter);
  const sanitizeInput = (input: string) => securityHardening.sanitizeInput(input);
  
  return {
    getSecurityStats,
    getSecurityEvents,
    sanitizeInput
  };
};

// Security monitoring
export const initializeSecurityMonitoring = (): void => {
  if (typeof window === 'undefined') return;
  
  // Monitor for suspicious client-side activity
  const monitorClientSecurity = () => {
    // Detect developer tools
    let devtools = { open: false };
    const threshold = 160;
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          console.warn('Developer tools detected');
        }
      } else {
        devtools.open = false;
      }
    }, 500);
    
    // Monitor for suspicious DOM manipulation
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'SCRIPT' && !element.hasAttribute('data-allowed')) {
                console.warn('Suspicious script injection detected');
                element.remove();
              }
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  };
  
  // Start monitoring
  monitorClientSecurity();
};

// Security debugging
export const debugSecurity = (): void => {
  console.group('Security Debug Info');
  
  const stats = securityHardening.getSecurityStats();
  console.log('Security Statistics:', stats);
  
  const recentEvents = securityHardening.getSecurityEvents({
    since: Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
  });
  console.log('Recent Security Events:', recentEvents);
  
  const headers = securityHardening.generateSecurityHeaders();
  console.log('Security Headers:', headers);
  
  console.groupEnd();
};