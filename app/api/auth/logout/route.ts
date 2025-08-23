import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest) {
  const cookieStore = await cookies();
  // Clear the cookie by setting maxAge to 0
  cookieStore.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return NextResponse.json({ success: true, message: 'Logged out' });
}