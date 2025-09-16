import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CouponValidationRequest, CouponValidationResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getAuthHeaders() {
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
  }
  
  return headers;
}

export async function POST(request: NextRequest) {
  try {
    const body: CouponValidationRequest = await request.json();
    
    // Validate required fields
    if (!body.code || typeof body.orderAmount !== 'number' || body.orderAmount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Coupon code and valid order amount are required' 
        } as CouponValidationResponse,
        { status: 400 }
      );
    }

    const headers = await getAuthHeaders();
    

    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coupon/validate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.status === 401) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized access' 
        } as CouponValidationResponse,
        { status: 401 }
      );
    }

    if (response.status === 400) {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Invalid coupon validation request' 
        } as CouponValidationResponse,
        { status: 400 }
      );
    }

    if (!response.ok) {

      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to validate coupon' 
        } as CouponValidationResponse,
        { status: response.status }
      );
    }

    // Transform backend response to frontend format
    if (data.success && data.data) {
      return NextResponse.json({
        success: true,
        data: {
          code: data.data.code || '',
          discountAmount: data.data.discountAmount || 0,
          discountPercentage: data.data.discountPercentage,
          type: data.data.type || 'fixed',
          description: data.data.description,
          coupon: data.data.coupon,
          finalAmount: data.data.finalAmount
        }
      } as CouponValidationResponse, {
        headers: {
          'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
          'CDN-Cache-Control': 'private, s-maxage=30'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: data.message || 'Invalid coupon'
      } as CouponValidationResponse, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
  } catch (error) {

    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      } as CouponValidationResponse,
      { status: 500 }
    );
  }
}