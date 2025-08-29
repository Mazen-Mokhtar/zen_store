'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { sessionManager } from '../../lib/sessionManager';

interface SessionInfo {
  sessionId: string;
  loginTime: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
  expiresAt: number;
  isActive: boolean;
}

interface SessionManagerProps {
  showDetails?: boolean;
  autoLogoutWarning?: boolean;
  warningThreshold?: number; // Minutes before expiration to show warning
  className?: string;
}

export default function SessionManagerComponent({
  showDetails = false,
  autoLogoutWarning = true,
  warningThreshold = 5,
  className = ''
}: SessionManagerProps) {
  const { user, logout } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [userSessions, setUserSessions] = useState<SessionInfo[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Check session status
  const checkSessionStatus = useCallback(async () => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    try {
      // Get current session info from cookie or localStorage
      const sessionId = document.cookie
        .split('; ')
        .find(row => row.startsWith('session='))
        ?.split('=')[1];

      if (sessionId) {
        // In a real implementation, you would call an API to get session info
        // For now, we'll simulate session data
        const mockSessionInfo: SessionInfo = {
          sessionId,
          loginTime: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
          lastActivity: Date.now() - (5 * 60 * 1000), // 5 minutes ago
          ipAddress: '192.168.1.1',
          userAgent: navigator.userAgent,
          expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes from now
          isActive: true
        };

        setSessionInfo(mockSessionInfo);
        
        // Calculate time until expiry
        const timeLeft = mockSessionInfo.expiresAt - Date.now();
        setTimeUntilExpiry(Math.max(0, timeLeft));
        
        // Show warning if close to expiry
        const warningTime = warningThreshold * 60 * 1000;
        setShowWarning(timeLeft <= warningTime && timeLeft > 0);
      }

      // Get all user sessions (mock data)
      const mockUserSessions: SessionInfo[] = [
        {
          sessionId: 'session_1',
          loginTime: Date.now() - (1 * 60 * 60 * 1000),
          lastActivity: Date.now() - (2 * 60 * 1000),
          ipAddress: '192.168.1.1',
          userAgent: 'Chrome/91.0.4472.124',
          expiresAt: Date.now() + (25 * 60 * 1000),
          isActive: true
        },
        {
          sessionId: 'session_2',
          loginTime: Date.now() - (3 * 60 * 60 * 1000),
          lastActivity: Date.now() - (10 * 60 * 1000),
          ipAddress: '192.168.1.2',
          userAgent: 'Firefox/89.0',
          expiresAt: Date.now() + (20 * 60 * 1000),
          isActive: true
        }
      ];

      setUserSessions(mockUserSessions);
    } catch (error) {
      console.error('Error checking session status:', error);
    } finally {
      setLoading(false);
    }
  }, [user, warningThreshold]);

  // Extend session
  const extendSession = useCallback(async () => {
    try {
      // In a real implementation, call API to extend session
      const response = await fetch('/api/auth/extend-session', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        await checkSessionStatus();
        setShowWarning(false);
      }
    } catch (error) {
      console.error('Error extending session:', error);
    }
  }, [checkSessionStatus]);

  // Logout from specific session
  const logoutFromSession = useCallback(async (sessionId: string) => {
    try {
      // In a real implementation, call API to logout from specific session
      const response = await fetch('/api/auth/logout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId }),
        credentials: 'include'
      });

      if (response.ok) {
        await checkSessionStatus();
      }
    } catch (error) {
      console.error('Error logging out from session:', error);
    }
  }, [checkSessionStatus]);

  // Logout from all other sessions
  const logoutFromAllOtherSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout-all-other-sessions', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        await checkSessionStatus();
      }
    } catch (error) {
      console.error('Error logging out from all sessions:', error);
    }
  }, [checkSessionStatus]);

  useEffect(() => {
    checkSessionStatus();
    
    // Update session info every minute
    const interval = setInterval(checkSessionStatus, 60000);
    
    return () => clearInterval(interval);
  }, [checkSessionStatus]);

  // Auto-logout when session expires
  useEffect(() => {
    if (timeUntilExpiry <= 0 && sessionInfo) {
      logout();
    }
  }, [timeUntilExpiry, sessionInfo, logout]);

  // Format time duration
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  // Format device info
  const formatDevice = (userAgent: string): string => {
    if (userAgent.includes('Chrome')) return '🖥️ Chrome';
    if (userAgent.includes('Firefox')) return '🦊 Firefox';
    if (userAgent.includes('Safari')) return '🧭 Safari';
    if (userAgent.includes('Edge')) return '🌐 Edge';
    return '💻 Unknown';
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  if (!user || !sessionInfo) {
    return null;
  }

  return (
    <div className={`session-manager ${className}`}>
      {/* Session Expiry Warning */}
      {showWarning && autoLogoutWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Session Expiring Soon
                </h3>
                <p className="text-sm text-yellow-700">
                  Your session will expire in {formatDuration(timeUntilExpiry)}
                </p>
              </div>
            </div>
            <button
              onClick={extendSession}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Extend Session
            </button>
          </div>
        </div>
      )}

      {/* Current Session Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Current Session</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Device:</span>
            <span>{formatDevice(sessionInfo.userAgent)}</span>
          </div>
          <div className="flex justify-between">
            <span>IP Address:</span>
            <span className="font-mono">{sessionInfo.ipAddress}</span>
          </div>
          <div className="flex justify-between">
            <span>Login Time:</span>
            <span>{new Date(sessionInfo.loginTime).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Activity:</span>
            <span>{new Date(sessionInfo.lastActivity).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Expires:</span>
            <span>{new Date(sessionInfo.expiresAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Time Remaining:</span>
            <span className={timeUntilExpiry < 300000 ? 'text-red-600 font-medium' : 'text-green-600'}>
              {formatDuration(timeUntilExpiry)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={extendSession}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            Extend Session
          </button>
          <button
            onClick={() => logout()}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Other Sessions */}
      {showDetails && userSessions.length > 1 && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Other Sessions ({userSessions.length - 1})
            </h3>
            <button
              onClick={logoutFromAllOtherSessions}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Logout All Others
            </button>
          </div>
          
          <div className="space-y-3">
            {userSessions
              .filter(session => session.sessionId !== sessionInfo.sessionId)
              .map((session) => (
                <div key={session.sessionId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">
                          {formatDevice(session.userAgent)}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {session.ipAddress}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Last active: {new Date(session.lastActivity).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => logoutFromSession(session.sessionId)}
                      className="text-red-600 hover:text-red-700 text-xs font-medium px-2 py-1 rounded border border-red-200 hover:border-red-300"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for session management
export function useSessionManager() {
  const { user } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number>(0);

  const checkSession = useCallback(async () => {
    if (!user?._id) return;

    // Implementation would check actual session status
    // For now, return mock data
    const mockSession: SessionInfo = {
      sessionId: 'current_session',
      loginTime: Date.now() - (2 * 60 * 60 * 1000),
      lastActivity: Date.now() - (5 * 60 * 1000),
      ipAddress: '192.168.1.1',
      userAgent: navigator.userAgent,
      expiresAt: Date.now() + (30 * 60 * 1000),
      isActive: true
    };

    setSessionInfo(mockSession);
    setTimeUntilExpiry(Math.max(0, mockSession.expiresAt - Date.now()));
  }, [user]);

  useEffect(() => {
    checkSession();
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, [checkSession]);

  return {
    sessionInfo,
    timeUntilExpiry,
    isExpiringSoon: timeUntilExpiry <= 5 * 60 * 1000, // 5 minutes
    checkSession
  };
}