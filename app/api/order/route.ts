import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils'

// Add dynamic export to prevent static prerendering
export const dynamic = "force-dynamic";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('auth_token')?.value;
  const decoded = raw ? decodeURIComponent(raw) : undefined;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (decoded && decoded.trim().length > 0) {
    // If cookie already contains a role prefix (user|admin|superAdmin), use it as-is
    const hasRolePrefix = /^(user|admin|superAdmin)\s+.+/i.test(decoded);
    headers['Authorization'] = hasRolePrefix ? decoded : `user ${decoded}`;
    // Optional: keep raw token (without role) header only when no prefix existed
    // headers['token'] = hasRolePrefix ? decoded.split(/\s+/, 2)[1] : decoded;
  }
  
  return headers;
}

export async function POST(request: Request) {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const body = await request.json().catch(() => undefined);

    const outHeaders = await getAuthHeaders();

    // Log the outgoing request
    logger.debug('📤 Forwarding order request to:', `${API_BASE_URL}/order`, {
      hasAuthorization: !!outHeaders['Authorization'],
      // hasTokenHeader: !!outHeaders['token'],
    })

    const response = await fetch(`${API_BASE_URL}/order`, {
      method: 'POST',
      headers: outHeaders,
      body: JSON.stringify(body ?? {}),
      // Configure the agent to handle proxy if needed
      // @ts-ignore - Node.js specific property
      agent: process.env.NODE_ENV === 'development' ? undefined : undefined,
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.text().catch(() => '');
      logger.error('❌ Error from API:', response.status, response.statusText, errorData)
      
      // Special handling for 401 Unauthorized - authentication required
      if (response.status === 401) {
        // Check if it's invalid token or missing token
        const isInvalidToken = errorData && (errorData.includes('invalid token') || errorData.includes('expired'));
        const message = isInvalidToken ? 'انتهت صلاحية الجلسة' : 'مطلوب تسجيل الدخول';
        
        return NextResponse.json(
          { 
            error: message, 
            details: errorData,
            requiresAuth: true,
            redirectTo: '/signin',
            isTokenExpired: isInvalidToken
          },
          { status: 401 }
        );
      }
      
      // Special handling for 400 Bad Request - validation errors
      if (response.status === 400) {
        // Log the validation error
        logger.error('❌ Validation error from backend API:', {
          status: response.status,
          error: errorData,
          message: 'Account info validation failed'
        });
        
        // Check if it's email validation error
        const isEmailError = errorData && (errorData.includes('email') || errorData.includes('Account info validation failed'));
        const message = isEmailError ? 'يرجى إدخال بريد إلكتروني صحيح' : 'بيانات غير صحيحة';
        
        return NextResponse.json(
          { 
            error: message, 
            details: errorData,
            validationError: true
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create order', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    logger.error('❌ Error in order API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const outHeaders = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/order`, {
      method: 'GET',
      headers: outHeaders,
      // @ts-ignore
      agent: process.env.NODE_ENV === 'development' ? undefined : undefined,
    });

    if (!response.ok) {
      const errorData = await response.text().catch(() => '');
      
      // Special handling for 401 Unauthorized - authentication required
      if (response.status === 401) {
        // Check if it's invalid token or missing token
        const isInvalidToken = errorData && (errorData.includes('invalid token') || errorData.includes('expired'));
        const message = isInvalidToken ? 'انتهت صلاحية الجلسة' : 'مطلوب تسجيل الدخول';
        
        return NextResponse.json(
          { 
            error: message, 
            details: errorData,
            requiresAuth: true,
            redirectTo: '/signin',
            isTokenExpired: isInvalidToken
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
