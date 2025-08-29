import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '../../../../lib/sessionManager';
import { cookies } from 'next/headers';

// Get all user sessions
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // Validate current session
    const currentSession = await sessionManager.validateSession(sessionToken);
    
    if (!currentSession) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get all user sessions
    const userSessions = await sessionManager.getUserSessions(currentSession.userId);
    
    // Format sessions for client (remove sensitive data)
    const formattedSessions = userSessions.map(session => ({
      sessionId: session.sessionId,
      loginTime: Date.now(),
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      isActive: session.expiresAt > Date.now(),
      isCurrent: session.sessionId === currentSession.sessionId
    }));

    // Sort by last activity (most recent first)
    formattedSessions.sort((a, b) => b.lastActivity - a.lastActivity);

    return NextResponse.json({
      sessions: formattedSessions,
      totalSessions: formattedSessions.length,
      activeSessions: formattedSessions.filter(s => s.isActive).length
    });
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Clean up expired sessions
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // Validate current session
    const currentSession = await sessionManager.validateSession(sessionToken);
    
    if (!currentSession) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Clean up expired sessions for this user
    const cleanedCount = await sessionManager.cleanupExpiredSessions(currentSession.userId);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired sessions`,
      cleanedCount
    });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}