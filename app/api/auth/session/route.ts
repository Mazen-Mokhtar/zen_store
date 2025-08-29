import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils';

// Get current session info
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    console.log('🔍 Session API: Checking auth token');
    console.log('Auth token:', authToken ? 'exists' : 'missing');
    
    if (!authToken) {
      console.log('❌ No auth token found');
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // Call backend session API
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/auth/session`, {
        method: 'GET',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('❌ Backend session validation failed:', response.status);
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        );
      }

      const sessionData = await response.json();
      console.log('✅ Session validated by backend');

      return NextResponse.json(sessionData);
    } catch (backendError) {
      console.error('❌ Backend session API error:', backendError);
      return NextResponse.json(
        { error: 'Session validation failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error getting session info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}