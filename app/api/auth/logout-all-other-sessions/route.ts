import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '../../../../lib/sessionManager';
import { cookies } from 'next/headers';

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

    // Get all user sessions
    const userSessions = await sessionManager.getUserSessions(currentSession.userId);
    
    // Filter out the current session
    const otherSessions = userSessions.filter(
      session => session.sessionId !== currentSession.sessionId
    );

    if (otherSessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No other sessions to logout',
        loggedOutCount: 0
      });
    }

    // Destroy all other sessions
    let loggedOutCount = 0;
    const destroyPromises = otherSessions.map(async (session) => {
      try {
        await sessionManager.destroySession(session.sessionId);
        loggedOutCount++;
      } catch (error) {
        console.error(`Failed to destroy session ${session.sessionId}:`, error);
      }
    });

    await Promise.allSettled(destroyPromises);

    // Log security event
    console.log(`User ${currentSession.userId} logged out from ${loggedOutCount} other sessions`);

    return NextResponse.json({
      success: true,
      message: `Successfully logged out from ${loggedOutCount} other sessions`,
      loggedOutCount
    });
  } catch (error) {
    console.error('Error logging out from all other sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}