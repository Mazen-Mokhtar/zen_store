import { logger } from './utils';
import { securityManager } from './security';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
  onLimitReached?: (key: string, req: any) => void;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
  blocked: boolean;
  suspiciousActivity: boolean;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  };

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  // Check if request is allowed
  checkLimit(key: string, config: Partial<RateLimitConfig> = {}): RateLimitResult {
    const finalConfig = { ...this.defaultConfig, ...config };
    const now = Date.now();
    const windowStart = now - finalConfig.windowMs;
    
    let entry = this.store.get(key);
    
    // Create new entry if doesn't exist or window has expired
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + finalConfig.windowMs,
        firstRequest: now,
        blocked: false,
        suspiciousActivity: false
      };
      this.store.set(key, entry);
    }
    
    // Check for suspicious activity patterns
    this.detectSuspiciousActivity(key, entry, now);
    
    // If blocked due to suspicious activity
    if (entry.blocked) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      };
    }
    
    // Increment request count
    entry.count++;
    
    const allowed = entry.count <= finalConfig.maxRequests;
    const remaining = Math.max(0, finalConfig.maxRequests - entry.count);
    
    if (!allowed) {
      // Log rate limit exceeded
      logger.warn('Rate limit exceeded', {
        key,
        count: entry.count,
        maxRequests: finalConfig.maxRequests,
        windowMs: finalConfig.windowMs
      });
      
      // Log rate limit exceeded
      logger.warn('Rate limit exceeded', {
        timeWindow: finalConfig.windowMs
      });
      
      // Call onLimitReached callback if provided
      if (finalConfig.onLimitReached) {
        finalConfig.onLimitReached(key, { key, count: entry.count });
      }
    }
    
    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000)
    };
  }
  
  // Detect suspicious activity patterns
  private detectSuspiciousActivity(key: string, entry: RateLimitEntry, now: number): void {
    const requestRate = entry.count / ((now - entry.firstRequest) / 1000); // requests per second
    
    // Mark as suspicious if:
    // 1. More than 10 requests per second
    // 2. Consistent high-frequency requests
    if (requestRate > 10 || (entry.count > 50 && requestRate > 5)) {
      entry.suspiciousActivity = true;
      
      // Block for extended period if very suspicious
      if (requestRate > 20) {
        entry.blocked = true;
        entry.resetTime = now + (60 * 60 * 1000); // Block for 1 hour
        
        logger.error('Suspicious activity detected - blocking IP', {
          key,
          requestRate,
          count: entry.count,
          timeSpan: (now - entry.firstRequest) / 1000
        });
        
        logger.error('Suspicious activity detected', {
          key,
          requestRate,
          requestCount: entry.count,
          blocked: true
        });
      }
    }
  }
  
  // Reset rate limit for a specific key
  reset(key: string): void {
    this.store.delete(key);
    logger.info('Rate limit reset', { key });
  }
  
  // Block a specific key
  block(key: string, durationMs: number = 60 * 60 * 1000): void {
    const now = Date.now();
    const entry: RateLimitEntry = {
      count: 0,
      resetTime: now + durationMs,
      firstRequest: now,
      blocked: true,
      suspiciousActivity: true
    };
    
    this.store.set(key, entry);
    
    logger.warn('Key blocked manually', {
      key,
      durationMs,
      resetTime: entry.resetTime
    });
  }
  
  // Unblock a specific key
  unblock(key: string): void {
    const entry = this.store.get(key);
    if (entry) {
      entry.blocked = false;
      entry.suspiciousActivity = false;
      logger.info('Key unblocked', { key });
    }
  }
  
  // Get current status for a key
  getStatus(key: string): RateLimitEntry | null {
    return this.store.get(key) || null;
  }
  
  // Get all active rate limits
  getAllStatus(): Map<string, RateLimitEntry> {
    return new Map(this.store);
  }
  
  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    Array.from(this.store.entries()).forEach(([key, entry]) => {
      if (entry.resetTime <= now && !entry.blocked) {
        this.store.delete(key);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      logger.debug('Rate limiter cleanup completed', { entriesRemoved: cleaned });
    }
  }
  
  // Destroy rate limiter and clean up resources
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  
  // API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  
  // General web requests
  web: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  
  // File uploads
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
  },
  
  // Search endpoints
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
  },
  
  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
  }
};

// Create singleton instance
export const rateLimiter = new RateLimiter();

// Helper function to generate keys
export const generateRateLimitKey = {
  byIP: (ip: string, endpoint?: string) => `ip:${ip}${endpoint ? `:${endpoint}` : ''}`,
  byUser: (userId: string, endpoint?: string) => `user:${userId}${endpoint ? `:${endpoint}` : ''}`,
  bySession: (sessionId: string, endpoint?: string) => `session:${sessionId}${endpoint ? `:${endpoint}` : ''}`,
  byEmail: (email: string, endpoint?: string) => `email:${email}${endpoint ? `:${endpoint}` : ''}`,
};

// Middleware function for Next.js API routes
export function withRateLimit(config: Partial<RateLimitConfig> = {}) {
  return function rateLimitMiddleware(handler: any) {
    return async function(req: any, res: any) {
      // Generate key based on IP and endpoint
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
      const endpoint = req.url || 'unknown';
      const key = generateRateLimitKey.byIP(ip, endpoint);
      
      // Check rate limit
      const result = rateLimiter.checkLimit(key, config);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests || 100);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
      
      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfter || 60);
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter
        });
      }
      
      return handler(req, res);
    };
  };
}

export default rateLimiter;