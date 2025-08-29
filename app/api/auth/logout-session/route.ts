import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '../../../../lib/sessionManager';
import { cookies } from 'next/headers';

// Logout from specific session
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
  const currentSessionToken = cookieStore.get('session')?.value;
    
    if (!currentSessionToken) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // Validate current session
    const currentSession = await sessionManager.validateSession(currentSessionToken);
    
    if (!currentSession) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get all user sessions to find the target session
    const userSessions = await sessionManager.getUserSessions(currentSession.userId);
    const targetSession = userSessions.find(session => session.sessionId === sessionId);
    
    if (!targetSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Ensure user can only logout their own sessions
    if (targetSession.userId !== currentSession.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Destroy the target session
    await sessionManager.destroySession(targetSession.sessionId);

    // If user is logging out their current session, clear the cookie
    const response = NextResponse.json({
      success: true,
      message: 'Session terminated successfully'
    });

    if (sessionId === currentSession.sessionId) {
      response.cookies.set('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0)
      });
    }

    return response;
  } catch (error) {
    console.error('Error logging out session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}