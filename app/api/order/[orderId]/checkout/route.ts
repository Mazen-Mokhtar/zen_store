import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function buildHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('auth_token')?.value;
  const decoded = raw ? decodeURIComponent(raw) : undefined;
  const out: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  if (decoded && decoded.trim().length > 0) {
    const hasRolePrefix = /^(user|admin|superAdmin)\s+.+/i.test(decoded);
    out['Authorization'] = hasRolePrefix ? decoded : `user ${decoded}`;
    // out['token'] = hasRolePrefix ? decoded.split(/\s+/, 2)[1] : decoded;
  }
  return out;
}

export async function POST(request: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const body = await request.json().catch(() => undefined);

    const { orderId } = await context.params;

    const res = await fetch(`${API_BASE_URL}/order/${orderId}/checkout`, {
      method: 'POST',
      headers: await buildHeaders(),
      body: JSON.stringify(body ?? {}),
      // @ts-ignore
      agent: process.env.NODE_ENV === 'development' ? undefined : undefined,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      
      // Special handling for 401 Unauthorized - authentication required
       if (res.status === 401) {
         // Check if it's invalid token or missing token
         const isInvalidToken = txt && (txt.includes('invalid token') || txt.includes('expired'));
         const message = isInvalidToken ? 'انتهت صلاحية الجلسة' : 'مطلوب تسجيل الدخول';
         
         return NextResponse.json(
           { 
             error: message, 
             details: txt,
             requiresAuth: true,
             redirectTo: '/signin',
             isTokenExpired: isInvalidToken
           },
           { status: 401 }
         );
       }
      
      return NextResponse.json({ error: 'Failed to checkout', details: txt }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error', details: e instanceof Error ? e.message : 'Unknown' }, { status: 500 });
  }
}
