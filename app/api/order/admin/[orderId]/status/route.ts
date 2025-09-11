import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const rawToken = cookieStore.get('auth_token')?.value;
    
    // Await params
    const { orderId } = await params;
    
    if (!rawToken) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // Ensure token has proper format (role prefix + JWT)
    let token = rawToken.trim();
    
    // If token doesn't have role prefix, add 'admin' prefix
    const rolePattern = /^(user|admin|superAdmin)\s+/i;
    if (!rolePattern.test(token)) {
      token = `admin ${token}`;
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'رمز غير صالح' },
        { status: 401 }
      );
    }

    const { status, adminNote } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'حالة الطلب مطلوبة' },
        { status: 400 }
      );
    }

    // Valid order statuses based on backend OrderStatus enum
    const validStatuses = ['pending', 'processing', 'paid', 'delivered', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'حالة الطلب غير صالحة' },
        { status: 400 }
      );
    }

    // Prepare payload matching UpdateOrderStatusDTO
    const payload: { status: string; adminNote?: string } = { status };
    if (adminNote && typeof adminNote === 'string') {
      payload.adminNote = adminNote;
    }

    // Make request to backend API
    const backendResponse = await fetch(`${BACKEND_URL}/order/admin/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify(payload),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      return NextResponse.json(
        { error: 'فشل في تحديث حالة الطلب' },
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

    return NextResponse.json(
      { error: 'خطأ في الخادم الداخلي' },
      { status: 500 }
    );
  }
}