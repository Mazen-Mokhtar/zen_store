import { NextResponse, NextRequest } from 'next/server';

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

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = `rate_limit_${ip}`;
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

async function isUserAuthorized(req: NextRequest): Promise<boolean> {
  try {
    console.log('🔍 Middleware: بدء التحقق من الصلاحيات');
    const token = req.cookies.get('auth_token')?.value;
    
    console.log('🍪 Auth Token في Middleware:', token ? 'موجود' : 'غير موجود');
    
    if (!token) {
      console.log('❌ لا يوجد auth_token في Middleware');
      return false;
    }
    
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
  const { pathname } = req.nextUrl;
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Enhanced security for admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/user/profile/admin') || pathname.startsWith('/api/order/admin')) {
    // Check authorization first
    const isAuthorized = await isUserAuthorized(req);
    if (!isAuthorized) {
      // Log unauthorized access attempt
      console.warn(`Unauthorized admin access attempt from IP: ${ip}, Path: ${pathname}, Time: ${new Date().toISOString()}`);
      
      // Return 404 to hide the existence of admin routes
      return new NextResponse(null, { status: 404 });
    }
    
    // Rate limiting for admin routes (more lenient for authorized users)
    if (!checkRateLimit(ip, 30, 60000)) {
      // Return 429 for authorized users who exceed rate limit
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }
  
  const res = NextResponse.next();

  // Attach a nonce for inline scripts/styles if needed later
  const nonce = generateNonce();
  res.headers.set('x-csp-nonce', nonce);

  // Reinforce critical headers; next.config.js also sets global headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Optionally enforce HTTPS in production
  if (process.env.NODE_ENV === 'production' && req.headers.get('x-forwarded-proto') !== 'https') {
    const url = new URL(req.url);
    url.protocol = 'https:';
    return NextResponse.redirect(url.toString(), 301);
  }

  return res;
}