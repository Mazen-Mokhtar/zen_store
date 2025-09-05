import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils';

// Get current session info
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    if (!authToken) {
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
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        );
      }

      const sessionData = await response.json();

      return NextResponse.json(sessionData);
    } catch (backendError) {
      logger.error('Backend session API error:', backendError);
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