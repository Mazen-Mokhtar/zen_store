import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger, decodeJWT } from '@/lib/utils';
import { sessionManager } from '@/lib/sessionManager';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Forward to actual backend
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log('🔍 Backend response status:', response.status);
    console.log('🔍 Backend response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.log('❌ Backend login failed:', data.message);
      return NextResponse.json(
        { success: false, message: data.message || 'Login failed' },
        { status: response.status }
      );
    }

    // Extract token and user from backend response
    const accessToken = data.data?.accessToken;
    let user = data.data?.user;
    console.log('🔍 Extracted accessToken:', accessToken ? 'exists' : 'missing');
    console.log('🔍 Extracted user from response:', user ? JSON.stringify(user, null, 2) : 'missing');

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'No access token received' },
        { status: 500 }
      );
    }

    // If user data is not in response, extract it from JWT token
    if (!user && accessToken) {
      const jwtPayload = decodeJWT(accessToken);
      console.log('🔍 JWT payload:', jwtPayload);
      
      if (jwtPayload) {
        user = {
          id: jwtPayload.userId,
          _id: jwtPayload.userId,
          email: jwtPayload.email || 'unknown@example.com',
          name: jwtPayload.name || 'Unknown User',
          role: jwtPayload.role || 'user'
        };
        console.log('🔧 Created user from JWT:', JSON.stringify(user, null, 2));
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No user data received and could not extract from token' },
        { status: 500 }
      );
    }

    // No need for local session management - backend handles everything
    console.log('✅ Login successful, backend manages session via JWT');

    // Set auth_token from backend
    const cookieStore = await cookies();
    cookieStore.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });
    console.log('🍪 Auth token cookie set from backend');

    // Return success response with user data (not token)
    return NextResponse.json({
      success: true,
      data: {
        user,
        message: 'Login successful'
      }
    });

  } catch (error) {
    logger.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}