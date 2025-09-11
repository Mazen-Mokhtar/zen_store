import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '../../../../lib/sessionManager';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // Try to get session data directly (even if expired)
    const sessionData = await sessionManager.getSessionData(sessionToken);
    
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Check if session can be extended
    const now = Date.now();
    const timeSinceExpiry = now - sessionData.expiresAt;
    
    // Allow extension if session expired less than 1 hour ago (more lenient)
    if (timeSinceExpiry > 60 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Session expired too long ago, please login again' },
        { status: 401 }
      );
    }

    // Get client info for security validation
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate IP and user agent match (basic security check)
    if (sessionData.ipAddress && sessionData.ipAddress !== clientIP) {
      
      // In production, you might want to reject this or require re-authentication
    }

    // Create new session with extended expiry
    const newSessionData = {
      ...sessionData,
      expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours (full session duration)
      lastActivity: now,
      ipAddress: clientIP,
      userAgent
    };

    // Generate new session token
    const newSessionResult = await sessionManager.createSession({
      userId: sessionData.userId,
      email: sessionData.email || '',
      name: sessionData.name || sessionData.email || 'User',
      role: sessionData.role || 'user',
      ipAddress: clientIP,
      userAgent: userAgent
    });

    if (!newSessionResult) {
      return NextResponse.json(
        { error: 'Failed to extend session' },
        { status: 500 }
      );
    }

    const newSessionToken = newSessionResult.sessionId;

    // Destroy old session
    await sessionManager.destroySession(sessionToken);

    // Set new session cookie
    const response = NextResponse.json({
      success: true,
      expiresAt: newSessionData.expiresAt,
      message: 'Session extended successfully'
    });

    response.cookies.set('session', newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: Math.floor((newSessionData.expiresAt - now) / 1000),
      path: '/'
    });

    return response;
  } catch (error) {

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}