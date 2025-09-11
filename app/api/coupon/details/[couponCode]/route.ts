import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ couponCode: string }> }
) {
  try {
    const { couponCode } = await params;
    
    if (!couponCode || couponCode.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Coupon code is required' 
        },
        { status: 400 }
      );
    }

    const headers = await getAuthHeaders();
    

    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coupon/details/${encodeURIComponent(couponCode)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();

      
      if (response.status === 404) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Coupon not found' 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch coupon details' 
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    

    
    return NextResponse.json(result);
    
  } catch (error) {

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}