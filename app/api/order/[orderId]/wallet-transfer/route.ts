import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const rawToken = cookieStore.get('auth_token')?.value;
    
    if (!rawToken) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // Ensure token has proper format (role prefix + JWT)
    let token = rawToken.trim();
    
    // If token doesn't have role prefix, add 'user' prefix
    const rolePattern = /^(user|admin|superAdmin)\s+/i;
    if (!rolePattern.test(token)) {
      token = `user ${token}`;
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'رمز غير صالح' },
        { status: 401 }
      );
    }

    const { orderId } = await params;
    
    // Get form data from request
    const formData = await request.formData();
    
    // Validate required fields
    const walletTransferNumber = formData.get('walletTransferNumber') as string;
    const walletTransferImage = formData.get('walletTransferImage') as File;
    
    if (!walletTransferNumber || !walletTransferImage) {
      return NextResponse.json(
        { error: 'رقم التحويل وصورة التحويل مطلوبان' },
        { status: 400 }
      );
    }

    // Forward the form data to backend
    const backendFormData = new FormData();
    backendFormData.append('walletTransferNumber', walletTransferNumber);
    
    // Add optional nameOfInsta if provided
    const nameOfInsta = formData.get('nameOfInsta') as string;
    if (nameOfInsta) {
      backendFormData.append('nameOfInsta', nameOfInsta);
    }
    
    backendFormData.append('walletTransferImage', walletTransferImage);

    // Make request to backend API
    const backendResponse = await fetch(`${BACKEND_URL}/order/${orderId}/wallet-transfer`, {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
      body: backendFormData,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      logger.error('Backend error:', {
        status: backendResponse.status,
        error: errorText
      });
      
      // Handle authentication errors
      if (backendResponse.status === 401) {
        const isInvalidToken = errorText && (errorText.includes('invalid token') || errorText.includes('expired'));
        const message = isInvalidToken ? 'انتهت صلاحية الجلسة' : 'مطلوب تسجيل الدخول';
        
        return NextResponse.json(
          { 
            error: message, 
            details: errorText,
            requiresAuth: true,
            redirectTo: '/signin',
            isTokenExpired: isInvalidToken
          },
          { status: 401 }
        );
      }
      
      // Handle validation errors
      if (backendResponse.status === 400) {
        return NextResponse.json(
          { error: 'بيانات غير صحيحة', details: errorText },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'فشل في إرسال بيانات التحويل', details: errorText },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

  } catch (error) {
    logger.error('Error in wallet transfer API route:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم الداخلي' },
      { status: 500 }
    );
  }
}