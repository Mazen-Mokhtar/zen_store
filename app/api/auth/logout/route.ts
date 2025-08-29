import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    console.log('🔍 Logout API: Processing logout request');
    
    // Call backend logout API if token exists
    if (authToken) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(`${backendUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('✅ Backend logout successful');
        } else {
          console.log('⚠️ Backend logout failed, but continuing with cookie cleanup');
        }
      } catch (backendError) {
        console.error('❌ Backend logout API error:', backendError);
        // Continue with cookie cleanup even if backend fails
      }
    }

    // Clear auth token cookie
    cookieStore.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    // Clear any remaining session cookie (for backward compatibility)
    cookieStore.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    console.log('🍪 All auth cookies cleared');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}