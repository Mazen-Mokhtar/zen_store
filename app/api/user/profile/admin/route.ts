import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = `admin_profile_${ip}`;
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

async function verifyAdminAccess(): Promise<{ authorized: boolean; role?: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    // Enhanced security checks
    if (!authToken) {
      return { authorized: false, error: 'Missing authentication data' };
    }

    // Decode JWT token to check role locally
    try {
      const tokenParts = authToken.split('.');
      if (tokenParts.length !== 3) {
        return { authorized: false, error: 'Invalid token format' };
      }
      
      const payload = JSON.parse(atob(tokenParts[1]));
      const userRole = payload.role;
      
      // Check if user has admin or superAdmin role
      if (userRole !== 'admin' && userRole !== 'superAdmin') {
        return { authorized: false, error: 'Insufficient permissions' };
      }
      
      return { authorized: true, role: userRole };
    } catch (decodeError) {
      return { authorized: false, error: 'Token decode failed' };
    }
  } catch (error) {
    return { authorized: false, error: 'Verification failed' };
  }
}

async function buildHeadersWithRole(role: 'admin' | 'superAdmin') {
  const cookieStore = await cookies();
  const raw = cookieStore.get('auth_token')?.value;
  
  let decoded = raw as string | undefined;
  if (raw) {
    try {
      decoded = /%[0-9A-Fa-f]{2}/.test(raw) ? decodeURIComponent(raw) : raw;
    } catch {
      decoded = raw;
    }
  }
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Admin-Request': 'true',
    'X-Security-Token': Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64'),
  };
  if (decoded && decoded.trim().length > 0) {
    const prefixed = /^(user|admin|superAdmin)\s+.+/i.test(decoded)
      ? decoded
      : `${role} ${decoded}`;
    headers['Authorization'] = prefixed;
  }
  return headers;
}

export async function GET(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Apply rate limiting
    if (!checkRateLimit(ip, 10, 60000)) {
      // Log suspicious activity
      logger.warn(`Rate limit exceeded for admin profile API from IP: ${ip}`);
      // Return 404 to hide API existence
      return new NextResponse(null, { status: 404 });
    }

    // Verify admin access with enhanced security
    const accessCheck = await verifyAdminAccess();
    
    if (!accessCheck.authorized) {
      // Log unauthorized access attempt
      logger.warn(`Unauthorized admin profile API access attempt from IP: ${ip}, Error: ${accessCheck.error}`);
      // Return 404 to hide API existence
      return new NextResponse(null, { status: 404 });
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    // Try with verified role first, then fallback roles
    const roles: Array<'admin' | 'superAdmin'> = accessCheck.role === 'superAdmin' 
      ? ['superAdmin', 'admin'] 
      : ['admin', 'superAdmin'];
    let lastText = '';
    let lastStatus = 500;

    for (const role of roles) {
      try {
        const headers = await buildHeadersWithRole(role);
        
        const res = await fetch(`${API_BASE_URL}/user/profile`, {
          method: 'GET',
          headers: headers,
          // @ts-ignore
          agent: process.env.NODE_ENV === 'development' ? undefined : undefined,
        });

        const txt = await res.text().catch(() => '');
        lastText = txt;
        lastStatus = res.status;

        if (res.ok) {
          // Try as JSON, else passthrough text
          try {
            const data = JSON.parse(txt);
            // Add security headers to response
            const response = NextResponse.json(data);
            response.headers.set('X-Content-Type-Options', 'nosniff');
            response.headers.set('X-Frame-Options', 'DENY');
            response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            return response;
          } catch {
            // If response isn't JSON, return as text with security headers
            const response = new NextResponse(txt, { status: 200, headers: { 'Content-Type': 'text/plain' } });
            response.headers.set('X-Content-Type-Options', 'nosniff');
            response.headers.set('X-Frame-Options', 'DENY');
            return response;
          }
        }

        // If backend explicitly says Not allow for you, return 404 to hide existence
        if (txt && txt.includes('Not allow for you')) {
          logger.warn(`Backend denied profile access for role ${role} from IP: ${ip}`);
          return new NextResponse(null, { status: 404 });
        }
      } catch (e) {
        logger.warn(`Profile proxy fetch error for role ${role} from IP: ${ip}:`, e);
      }
    }

    // All attempts failed - return 404 to hide API existence
    logger.error(`All admin profile API attempts failed from IP: ${ip}, Last status: ${lastStatus}`);
    return new NextResponse(null, { status: 404 });
  } catch (error) {
    logger.error('❌ Critical error in admin profile API route:', error);
    // Return 404 instead of 500 to hide API existence
    return new NextResponse(null, { status: 404 });
  }
}