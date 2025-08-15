import { NextResponse } from 'next/server';

// Add dynamic export to prevent static prerendering
export const dynamic = "force-dynamic";

function buildHeaders(request: Request) {
  const incoming = new Headers(request.headers);
  const out: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  const auth = incoming.get('authorization');
  const token = incoming.get('token');
  if (auth) out['Authorization'] = auth;
  if (token) out['token'] = token;
  return out;
}

export async function GET(_req: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const { orderId } = await context.params;
    const res = await fetch(`${API_BASE_URL}/order/${orderId}`, {
      method: 'GET',
      headers: buildHeaders(_req),
      // @ts-ignore
      agent: process.env.NODE_ENV === 'development' ? undefined : undefined,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return NextResponse.json({ error: 'Failed to fetch order details', details: txt }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error', details: e instanceof Error ? e.message : 'Unknown' }, { status: 500 });
  }
}

// تم إزالة طريقة PATCH لإلغاء الطلب
