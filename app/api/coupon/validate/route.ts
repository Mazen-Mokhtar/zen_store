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
          isValid: false, 
          error: 'Coupon code and valid order amount are required' 
        } as CouponValidationResponse,
        { status: 400 }
      );
    }

    const headers = await getAuthHeaders();
    
    console.log('Forwarding coupon validation request to backend API');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coupon/validate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.status === 401) {
      return NextResponse.json(
        { 
          isValid: false, 
          error: 'Unauthorized access' 
        } as CouponValidationResponse,
        { status: 401 }
      );
    }

    if (response.status === 400) {
      return NextResponse.json(
        { 
          isValid: false, 
          error: data.message || 'Invalid coupon validation request' 
        } as CouponValidationResponse,
        { status: 400 }
      );
    }

    if (!response.ok) {
      console.error('Backend API error:', data);
      return NextResponse.json(
        { 
          isValid: false, 
          error: 'Failed to validate coupon' 
        } as CouponValidationResponse,
        { status: response.status }
      );
    }

    // Transform backend response to frontend format
    if (data.success && data.data) {
      return NextResponse.json({
        isValid: true,
        coupon: data.data.coupon,
        discountAmount: data.data.discountAmount,
        finalAmount: data.data.finalAmount
      } as CouponValidationResponse);
    } else {
      return NextResponse.json({
        isValid: false,
        error: data.message || 'Invalid coupon'
      } as CouponValidationResponse);
    }
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { 
        isValid: false, 
        error: 'Internal server error' 
      } as CouponValidationResponse,
      { status: 500 }
    );
  }
}