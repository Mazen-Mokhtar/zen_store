import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, rateLimitConfigs, generateRateLimitKey } from '../lib/rateLimiter';
import { logger } from '../lib/utils';

// Rate limit middleware for Next.js API routes
export function createRateLimitMiddleware(config?: {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: NextRequest) => string;
  skipPaths?: string[];
  customConfigs?: Record<string, { windowMs: number; maxRequests: number }>;
}) {
  return async function rateLimitMiddleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    
    // Skip rate limiting for certain paths
    if (config?.skipPaths?.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }
    
    // Get client IP
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    // Generate rate limit key
    const key = config?.keyGenerator ? 
                config.keyGenerator(req) : 
                generateRateLimitKey.byIP(ip, pathname);
    
    // Determine rate limit configuration based on endpoint
    let rateLimitConfig = config || rateLimitConfigs.api;
    
    // Apply custom configurations for specific paths
    if (config?.customConfigs) {
      for (const [path, customConfig] of Object.entries(config.customConfigs)) {
        if (pathname.startsWith(path)) {
          rateLimitConfig = customConfig;
          break;
        }
      }
    }
    
    // Apply predefined configurations for known endpoints
    if (pathname.includes('/auth/')) {
      rateLimitConfig = rateLimitConfigs.auth;
    } else if (pathname.includes('/upload')) {
      rateLimitConfig = rateLimitConfigs.upload;
    } else if (pathname.includes('/search')) {
      rateLimitConfig = rateLimitConfigs.search;
    } else if (pathname.includes('/password-reset')) {
      rateLimitConfig = rateLimitConfigs.passwordReset;
    }
    
    // Check rate limit
    const result = rateLimiter.checkLimit(key, rateLimitConfig);
    
    // Create response
    const response = result.allowed ? NextResponse.next() : new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', (rateLimitConfig.maxRequests || 100).toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    
    if (!result.allowed && result.retryAfter) {
      response.headers.set('Retry-After', result.retryAfter.toString());
    }
    
    // Log rate limit events
    if (!result.allowed) {
      logger.warn('Rate limit exceeded in middleware', {
        ip,
        pathname,
        key,
        remaining: result.remaining,
        resetTime: result.resetTime
      });
    }
    
    return response;
  };
}

// Default rate limit middleware with common configurations
export const defaultRateLimitMiddleware = createRateLimitMiddleware({
  skipPaths: ['/api/health', '/api/status'],
  customConfigs: {
    '/api/auth/login': rateLimitConfigs.auth,
    '/api/auth/register': rateLimitConfigs.auth,
    '/api/auth/forgot-password': rateLimitConfigs.passwordReset,
    '/api/upload': rateLimitConfigs.upload,
    '/api/search': rateLimitConfigs.search,
  }
});

// Enhanced rate limit middleware with user-based limiting
export function createUserBasedRateLimitMiddleware(config?: {
  windowMs?: number;
  maxRequests?: number;
  skipPaths?: string[];
}) {
  return async function userRateLimitMiddleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    
    // Skip rate limiting for certain paths
    if (config?.skipPaths?.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }
    
    // Get user ID from JWT token or session
    const authHeader = req.headers.get('authorization');
    const sessionCookie = req.cookies.get('session');
    
    let userId: string | null = null;
    
    // Try to extract user ID from JWT token
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId || payload.sub;
      } catch (error) {
        // Invalid token, fall back to IP-based limiting
      }
    }
    
    // Generate rate limit key
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const key = userId ? 
                generateRateLimitKey.byUser(userId, pathname) : 
                generateRateLimitKey.byIP(ip, pathname);
    
    // Use higher limits for authenticated users
    const rateLimitConfig = {
      windowMs: config?.windowMs || (userId ? 60 * 1000 : 60 * 1000), // 1 minute
      maxRequests: config?.maxRequests || (userId ? 120 : 60), // Higher limit for authenticated users
    };
    
    // Check rate limit
    const result = rateLimiter.checkLimit(key, rateLimitConfig);
    
    // Create response
    const response = result.allowed ? NextResponse.next() : new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: userId ? 
          'You have exceeded the rate limit for authenticated users.' :
          'You have exceeded the rate limit. Please log in for higher limits.',
        retryAfter: result.retryAfter,
        suggestion: userId ? null : 'Consider logging in for higher rate limits'
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitConfig.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    response.headers.set('X-RateLimit-Type', userId ? 'user' : 'ip');
    
    if (!result.allowed && result.retryAfter) {
      response.headers.set('Retry-After', result.retryAfter.toString());
    }
    
    return response;
  };
}

export default defaultRateLimitMiddleware;