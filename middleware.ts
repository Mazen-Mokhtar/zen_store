import { NextResponse, NextRequest } from 'next/server';
import { defaultRateLimitMiddleware, createUserBasedRateLimitMiddleware } from './middleware/rateLimitMiddleware';
import { errorHandler, AppError, ErrorType, ErrorSeverity } from './lib/errorHandler';
import { securityMonitor, ActivityData } from './lib/securityMonitor';
import { securityMonitoringMiddleware } from './middleware/securityMonitoringMiddleware';

export const config = {
  matcher: ['/((?!_next|.*\.\w+$).*)'],
};

function generateNonce() {
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * 256);
  }
  return Buffer.from(array).toString('base64');
}

// Enhanced rate limiting with user-based and IP-based limiting
const userBasedRateLimit = createUserBasedRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // Base limit, will be adjusted based on authentication
  skipPaths: ['/api/health', '/api/status', '/_next', '/favicon.ico']
});

async function isUserAuthorized(req: NextRequest): Promise<boolean> {
  try {
    console.log('🔍 Middleware: بدء التحقق من الصلاحيات');
    const authToken = req.cookies.get('auth_token')?.value;
    
    console.log('🍪 Auth Token في Middleware:', authToken ? 'موجود' : 'غير موجود');
    
    // Check auth_token only (no more session dependency)
    if (!authToken) {
      console.log('❌ لا يوجد auth_token في Middleware');
      return false;
    }
    
    // JWT token validation
    const token = authToken;
    
    // Decode JWT token to check role locally
    try {
      console.log('🔓 محاولة فك تشفير JWT في Middleware...');
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.log('❌ تنسيق JWT غير صحيح في Middleware');
        return false;
      }
      
      const payload = JSON.parse(atob(tokenParts[1]));
      const userRole = payload.role;
      
      console.log('👤 معلومات المستخدم في Middleware:', {
        userId: payload.userId,
        role: userRole,
        exp: new Date(payload.exp * 1000).toLocaleString()
      });
      
      // Check if user has admin or superAdmin role
      const isAuthorized = userRole === 'admin' || userRole === 'superAdmin';
      console.log('✅ نتيجة التحقق في Middleware:', isAuthorized ? 'مصرح' : 'غير مصرح');
      
      return isAuthorized;
    } catch (decodeError) {
      console.error('❌ فشل فك تشفير JWT في Middleware:', decodeError);
      return false;
    }
  } catch (error) {
    console.error('❌ فشل التحقق من الصلاحيات في Middleware:', error);
    return false;
  }
}

export async function middleware(req: NextRequest) {
  // Temporarily disable security monitoring for debugging
  // return await securityMonitoringMiddleware.monitor(async (req: NextRequest) => {
  try {
      const { pathname } = req.nextUrl;
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      
      // Generate request ID for tracking
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Security checks for suspicious patterns
      performSecurityChecks(req, ip, userAgent, pathname);
      
      // Temporarily disable rate limiting for debugging
      // const rateLimitResponse = await userBasedRateLimit(req);
      // if (rateLimitResponse.status === 429) {
      //   logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      //     ip,
      //     userAgent,
      //     pathname,
      //     requestId
      //   });
      //   return rateLimitResponse;
      // }
    
    // Enhanced security for admin routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/user/profile/admin') || pathname.startsWith('/api/order/admin')) {
      // Check authorization first
      const isAuthorized = await isUserAuthorized(req);
      if (!isAuthorized) {
        // Log unauthorized access attempt with enhanced details
        logSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', {
          ip,
          userAgent,
          pathname,
          requestId,
          timestamp: new Date().toISOString(),
          headers: Object.fromEntries(req.headers.entries())
        });
        
        // Return 404 to hide the existence of admin routes
        return new NextResponse(null, { status: 404 });
      }
    }
    
    const res = NextResponse.next();

    // Attach security headers
    const nonce = generateNonce();
    res.headers.set('x-csp-nonce', nonce);
    res.headers.set('x-request-id', requestId);

    // Reinforce critical headers; next.config.js also sets global headers
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    res.headers.set('X-XSS-Protection', '1; mode=block');

    // Optionally enforce HTTPS in production
    if (process.env.NODE_ENV === 'production' && req.headers.get('x-forwarded-proto') !== 'https') {
      const url = new URL(req.url);
      url.protocol = 'https:';
      return NextResponse.redirect(url.toString(), 301);
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
  // })(req);
}

// Enhanced security checks
function performSecurityChecks(req: NextRequest, ip: string, userAgent: string, pathname: string) {
  // Check for suspicious user agents
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /java/i,
    /go-http-client/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    logSecurityEvent('SUSPICIOUS_USER_AGENT', {
      ip,
      userAgent,
      pathname,
      timestamp: new Date().toISOString()
    });
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

  if (sqlPatterns.some(pattern => pattern.test(url))) {
    logSecurityEvent('SQL_INJECTION_ATTEMPT', {
      ip,
      userAgent,
      pathname,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
    throw new AppError(
      'Potential SQL injection attempt detected',
      ErrorType.SECURITY,
      403,
      ErrorSeverity.HIGH
    );
  }

  // Check for XSS patterns in URL
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /alert\(/i
  ];

  if (xssPatterns.some(pattern => pattern.test(url))) {
    logSecurityEvent('XSS_ATTEMPT', {
      ip,
      userAgent,
      pathname,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
    throw new AppError(
      'Potential XSS attempt detected',
      ErrorType.SECURITY,
      403,
      ErrorSeverity.HIGH
    );
  }

  // Check for path traversal attempts
  const pathTraversalPatterns = [
    /\.\.\//, 
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%2e%2e%5c/i,
    /\.\.%2f/i,
    /\.\.%5c/i
  ];

  if (pathTraversalPatterns.some(pattern => pattern.test(url))) {
    logSecurityEvent('PATH_TRAVERSAL_ATTEMPT', {
      ip,
      userAgent,
      pathname,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
    throw new AppError(
      'Path traversal attempt detected',
      ErrorType.SECURITY,
      403,
      ErrorSeverity.HIGH
    );
  }

  // Check for excessive request size
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    logSecurityEvent('LARGE_REQUEST_ATTEMPT', {
      ip,
      userAgent,
      pathname,
      contentLength,
      timestamp: new Date().toISOString()
    });
    
    throw new AppError(
      'Request payload too large',
      ErrorType.VALIDATION,
      413,
      ErrorSeverity.MEDIUM
    );
  }
}

// Security event logging
function logSecurityEvent(eventType: string, details: Record<string, any>) {
  const logEntry = {
    type: 'SECURITY_EVENT',
    eventType,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  console.warn(`🔒 Security Event [${eventType}]:`, logEntry);
  
  // In production, you would send this to a security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to monitoring service (e.g., Sentry, DataDog, CloudWatch, etc.)
    // Example: securityMonitor.logEvent(logEntry);
  }
}