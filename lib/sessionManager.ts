import { logger } from './utils';
import { securityManager } from './security';
import { authService } from './auth';

interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
  loginTime: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  isActive: boolean;
  expiresAt: number;
  refreshTokenExpiresAt: number;
}

interface SessionConfig {
  maxAge: number; // Session max age in milliseconds
  idleTimeout: number; // Idle timeout in milliseconds
  maxConcurrentSessions: number; // Max concurrent sessions per user
  extendOnActivity: boolean; // Extend session on activity
  secureOnly: boolean; // Only allow secure sessions
  sameSite: 'strict' | 'lax' | 'none'; // SameSite cookie attribute
}

class SessionManager {
  private sessions = new Map<string, SessionData>();
  private userSessions = new Map<string, Set<string>>(); // userId -> sessionIds
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  private readonly config: SessionConfig = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    idleTimeout: 2 * 60 * 60 * 1000, // 2 hours (increased from 30 minutes)
    maxConcurrentSessions: 5,
    extendOnActivity: true,
    secureOnly: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  constructor() {
    // Clean up expired sessions every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  // Create a new session
  async createSession(userData: {
    userId: string;
    email: string;
    name: string;
    role: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<{ sessionId: string; expiresAt: number }> {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    const expiresAt = now + this.config.maxAge;
    const refreshTokenExpiresAt = now + (7 * 24 * 60 * 60 * 1000); // 7 days

    // Check concurrent session limit
    await this.enforceConcurrentSessionLimit(userData.userId);

    const sessionData: SessionData = {
      userId: userData.userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      loginTime: now,
      lastActivity: now,
      ipAddress: userData.ipAddress,
      userAgent: userData.userAgent,
      sessionId,
      isActive: true,
      expiresAt,
      refreshTokenExpiresAt
    };

    // Store session
    this.sessions.set(sessionId, sessionData);
    
    // Track user sessions
    if (!this.userSessions.has(userData.userId)) {
      this.userSessions.set(userData.userId, new Set());
    }
    this.userSessions.get(userData.userId)!.add(sessionId);

    // Log session creation
    logger.info('Session created', {
      sessionId,
      userId: userData.userId,
      email: userData.email,
      ipAddress: userData.ipAddress,
      expiresAt: new Date(expiresAt).toISOString()
    });

    // Log security event
    logger.info('Session created', {
      sessionId,
      userId: userData.userId,
      ipAddress: userData.ipAddress,
      userAgent: userData.userAgent,
      timestamp: now
    });

    return { sessionId, expiresAt };
  }

  // Validate and refresh session
  async validateSession(sessionId: string, ipAddress?: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    const now = Date.now();

    // Check if session is expired
    if (now > session.expiresAt || !session.isActive) {
      await this.destroySession(sessionId);
      return null;
    }

    // Check idle timeout
    if (now - session.lastActivity > this.config.idleTimeout) {
      logger.warn('Session expired due to inactivity', {
        sessionId,
        userId: session.userId,
        lastActivity: new Date(session.lastActivity).toISOString()
      });
      
      await this.destroySession(sessionId);
      return null;
    }

    // Validate IP address (optional security check)
    if (ipAddress && session.ipAddress !== ipAddress) {
      logger.warn('Session IP mismatch detected', {
        sessionId,
        userId: session.userId,
        originalIP: session.ipAddress,
        currentIP: ipAddress
      });
      
      // Log suspicious activity
      logger.warn('Session IP mismatch detected', {
        sessionId,
        userId: session.userId,
        originalIP: session.ipAddress,
        currentIP: ipAddress,
        timestamp: now
      });
      
      // Optionally destroy session on IP mismatch
      // await this.destroySession(sessionId);
      // return null;
    }

    // Update last activity if configured
    if (this.config.extendOnActivity) {
      session.lastActivity = now;
      
      // Extend session expiration if more than half the time has passed
      const halfLife = this.config.maxAge / 2;
      if (now - session.loginTime > halfLife) {
        session.expiresAt = now + this.config.maxAge;
      }
    }

    return session;
  }

  // Get session data without validation (for extension purposes)
  async getSessionData(sessionId: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId);
    return session || null;
  }

  // Destroy a specific session
  async destroySession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    // Remove from sessions map
    this.sessions.delete(sessionId);
    
    // Remove from user sessions tracking
    const userSessionSet = this.userSessions.get(session.userId);
    if (userSessionSet) {
      userSessionSet.delete(sessionId);
      if (userSessionSet.size === 0) {
        this.userSessions.delete(session.userId);
      }
    }

    logger.info('Session destroyed', {
      sessionId,
      userId: session.userId,
      email: session.email
    });

    // Log security event
    logger.info('Session destroyed', {
      sessionId,
      userId: session.userId,
      reason: 'manual_logout',
      timestamp: Date.now()
    });

    return true;
  }

  // Destroy all sessions for a user
  async destroyAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    const userSessionSet = this.userSessions.get(userId);
    
    if (!userSessionSet) {
      return 0;
    }

    let destroyedCount = 0;
    const sessionIds = Array.from(userSessionSet);
    
    for (const sessionId of sessionIds) {
      if (sessionId !== exceptSessionId) {
        const success = await this.destroySession(sessionId);
        if (success) {
          destroyedCount++;
        }
      }
    }

    logger.info('All user sessions destroyed', {
      userId,
      destroyedCount,
      exceptSessionId
    });

    return destroyedCount;
  }

  // Get active sessions for a user
  getUserSessions(userId: string): SessionData[] {
    const userSessionSet = this.userSessions.get(userId);
    
    if (!userSessionSet) {
      return [];
    }

    const sessions: SessionData[] = [];
    
    Array.from(userSessionSet).forEach(sessionId => {
      const session = this.sessions.get(sessionId);
      if (session && session.isActive) {
        sessions.push({ ...session });
      }
    });

    return sessions;
  }

  // Update session activity
  async updateActivity(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    
    if (!session || session.expiresAt <= Date.now()) {
      return false;
    }
    
    session.lastActivity = Date.now();
    this.sessions.set(sessionId, session);
    
    return true;
  }

  // Clean up expired sessions for a user
  async cleanupExpiredSessions(userId?: string): Promise<number> {
    let cleanedCount = 0;
    const now = Date.now();
    
    Array.from(this.sessions.entries()).forEach(([sessionId, session]) => {
      if (session.expiresAt <= now && (!userId || session.userId === userId)) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    });
    
    return cleanedCount;
  }

  // Get session statistics
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    uniqueUsers: number;
    expiredSessions: number;
  } {
    const now = Date.now();
    let activeSessions = 0;
    let expiredSessions = 0;

    Array.from(this.sessions.values()).forEach(session => {
      if (session.isActive && now <= session.expiresAt) {
        activeSessions++;
      } else {
        expiredSessions++;
      }
    });

    return {
      totalSessions: this.sessions.size,
      activeSessions,
      uniqueUsers: this.userSessions.size,
      expiredSessions
    };
  }

  // Enforce concurrent session limit
  private async enforceConcurrentSessionLimit(userId: string): Promise<void> {
    const userSessionSet = this.userSessions.get(userId);
    
    if (!userSessionSet || userSessionSet.size < this.config.maxConcurrentSessions) {
      return;
    }

    // Find oldest session to remove
    let oldestSession: SessionData | null = null;
    let oldestSessionId: string | null = null;

    Array.from(userSessionSet).forEach(sessionId => {
      const session = this.sessions.get(sessionId);
      if (session && (!oldestSession || session.loginTime < oldestSession.loginTime)) {
        oldestSession = session;
        oldestSessionId = sessionId;
      }
    });

    if (oldestSessionId) {
      logger.info('Destroying oldest session due to concurrent limit', {
        userId,
        sessionId: oldestSessionId,
        maxConcurrentSessions: this.config.maxConcurrentSessions
      });
      
      await this.destroySession(oldestSessionId);
    }
  }

  // Generate secure session ID
  private generateSessionId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Update session configuration
  updateConfig(newConfig: Partial<SessionConfig>): void {
    Object.assign(this.config, newConfig);
    logger.info('Session configuration updated', { config: this.config });
  }

  // Destroy session manager and clean up resources
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.sessions.clear();
    this.userSessions.clear();
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();

// Session middleware for Next.js API routes
export function withSessionValidation(handler: any) {
  return async function sessionMiddleware(req: any, res: any) {
    const sessionId = req.cookies.session || req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionId) {
      return res.status(401).json({ error: 'No session provided' });
    }

    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const session = await sessionManager.validateSession(sessionId, clientIP);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Attach session data to request
    req.session = session;
    req.user = {
      id: session.userId,
      email: session.email,
      role: session.role
    };

    return handler(req, res);
  };
}

export default sessionManager;