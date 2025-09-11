import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils';
import { CreateOrderData, CouponValidationRequest, CouponValidationResponse } from '@/lib/types';

// Add dynamic export to prevent static prerendering
export const dynamic = "force-dynamic";

// Helper function to get package price
async function getPackagePrice(gameId: string, packageId: string): Promise<number> {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_BASE_URL}/game/${gameId}/packages`);
    
    if (!response.ok) {
      logger.error('Failed to fetch packages:', response.status);
      return 0;
    }
    
    const packagesResponse = await response.json();
    
    // Find the specific package by packageId
    if (packagesResponse.success && Array.isArray(packagesResponse.data)) {
      const targetPackage = packagesResponse.data.find((pkg: any) => pkg._id === packageId);
      if (targetPackage) {
        return targetPackage.finalPrice || targetPackage.price || 0;
      }
    }
    
    logger.error('Package not found:', { gameId, packageId });
    return 0;
  } catch (error) {
    logger.error('Error fetching package price:', error);
    return 0;
  }
}

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
    const body: CreateOrderData = await request.json().catch(() => undefined);

    const outHeaders = await getAuthHeaders();

    // If coupon code is provided, validate it first
    if (body?.couponCode) {
      try {
        logger.debug('🔍 Coupon validation request:', {
          gameId: body.gameId,
          packageId: body.packageId,
          couponCode: body.couponCode
        });
        
        // Let the backend handle price validation and coupon application
        // We don't need to fetch package price here as the backend will do it
        
        // Skip frontend coupon validation - let backend handle it
        logger.debug('✅ Skipping frontend coupon validation, letting backend handle it:', {
          code: body.couponCode
        });
      } catch (couponError) {
        logger.error('❌ Error validating coupon:', couponError);
        return NextResponse.json(
          { 
            error: 'فشل في التحقق من الكوبون',
            validationError: true
          },
          { status: 400 }
        );
      }
    }

    // Log the outgoing request
    logger.debug('📤 Forwarding order request to:', `${API_BASE_URL}/order`, {
      hasAuthorization: !!outHeaders['Authorization'],
      hasCoupon: !!body?.couponCode,
      couponCode: body?.couponCode,
      bodyKeys: Object.keys(body || {}),
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

    // Log the response for debugging
    const responseText = await response.text();
    logger.info('📥 Backend API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText,
      url: `${API_BASE_URL}/order`,
      requestBody: JSON.stringify(body, null, 2)
    });
    


    // Handle non-OK responses
    if (!response.ok) {
      logger.error('❌ Error from API:', {
        status: response.status,
        statusText: response.statusText,
        errorData: responseText,
        url: `${API_BASE_URL}/order`,
        requestBody: JSON.stringify(body, null, 2)
      });
      
      // Special handling for 401 Unauthorized - authentication required
      if (response.status === 401) {
        // Check if it's invalid token or missing token
        const isInvalidToken = responseText && (responseText.includes('invalid token') || responseText.includes('expired'));
        const message = isInvalidToken ? 'انتهت صلاحية الجلسة' : 'مطلوب تسجيل الدخول';
        
        return NextResponse.json(
          { 
            error: message, 
            details: responseText,
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
          error: responseText,
          message: 'Account info validation failed'
        });
        
        // Check if it's email validation error
        const isEmailError = responseText && (responseText.includes('email') || responseText.includes('Account info validation failed'));
        const message = isEmailError ? 'يرجى إدخال بريد إلكتروني صحيح' : 'بيانات غير صحيحة';
        
        return NextResponse.json(
          { 
            error: message, 
            details: responseText,
            validationError: true
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create order', details: responseText },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);
    
    // Transform backend response to match frontend expectations
    if (data.success && data.data && data.data.couponApplied) {
      // Map couponApplied to coupon for frontend compatibility
      data.data.coupon = {
        code: data.data.couponApplied.code,
        name: data.data.couponApplied.name,
        discountAmount: data.data.couponApplied.discountAmount,
        originalAmount: data.data.couponApplied.originalAmount
      };
      
      logger.info('✅ Transformed couponApplied to coupon for frontend compatibility:', {
        couponCode: data.data.coupon.code,
        discountAmount: data.data.coupon.discountAmount
      });
    }
    
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
