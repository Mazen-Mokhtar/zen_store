// إدارة حالة تسجيل الدخول والتوكن
import { useState, useEffect } from 'react';
import { logger } from './utils';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface JwtPayload {
  sub?: string;
  userId?: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false
  };
  
  // Session timeout configuration (in milliseconds)
  private readonly SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
  private readonly SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute
  private sessionCheckInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.loadFromStorage();
    this.startSessionMonitoring();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private decodeJwtPayload(token: string): JwtPayload | null {
    try {
      // Support tokens that may come prefixed (e.g., "Bearer " or role prefix like "user ")
      let raw = token.trim();
      
      // Remove Bearer prefix if present
      if (raw.startsWith('Bearer ')) {
        raw = raw.slice(7);
      }
      
      // Remove role prefix if present (user/admin/superAdmin followed by space)
      const rolePattern = /^(user|admin|superAdmin)\s+/i;
      if (rolePattern.test(raw)) {
        raw = raw.replace(rolePattern, '');
      }
      
      const parts = raw.split('.');
      if (parts.length !== 3) return null;
      
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(json) as JwtPayload;
    } catch (error) {
      logger.warn('Failed to decode JWT payload:', error);
      return null;
    }
  }

  private isJwtExpired(token: string | null): boolean {
    if (!token) return true;
    
    const payload = this.decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') {
      // If no expiration time is set, consider token as non-expiring but validate structure
      return !payload;
    }
    
    const nowMs = Date.now();
    const expMs = payload.exp * 1000;
    const isExpired = nowMs >= expMs;
    
    if (isExpired) {
      logger.warn('JWT token has expired:', {
        expiredAt: new Date(expMs).toISOString(),
        currentTime: new Date(nowMs).toISOString()
      });
    }
    
    return isExpired;
  }

  /**
   * Check if token will expire within the warning time
   */
  private isTokenExpiringSoon(token: string | null): boolean {
    if (!token) return false;
    
    const payload = this.decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') return false;
    
    const nowMs = Date.now();
    const expMs = payload.exp * 1000;
    const timeUntilExpiry = expMs - nowMs;
    
    return timeUntilExpiry <= this.SESSION_WARNING_TIME && timeUntilExpiry > 0;
  }

  /**
   * Get remaining time until token expires (in milliseconds)
   */
  private computeTokenTimeRemaining(token: string | null): number {
    if (!token) return 0;
    
    const payload = this.decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') return Infinity;
    
    const nowMs = Date.now();
    const expMs = payload.exp * 1000;
    
    return Math.max(0, expMs - nowMs);
  }

  /**
   * Start monitoring session for expiration
   */
  private startSessionMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Reset any existing interval to avoid duplicates
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    
    this.sessionCheckInterval = setInterval(() => {
      const currentToken = this.authState.token;
      
      if (!currentToken) {
        this.stopSessionMonitoring();
        return;
      }

      if (this.isJwtExpired(currentToken)) {
        this.handleSessionExpired();
      } else if (this.isTokenExpiringSoon(currentToken)) {
        this.handleSessionExpiring();
      }
    }, this.SESSION_CHECK_INTERVAL);
  }

  /**
   * Stop session monitoring
   */
  private stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Handle when session has expired
   */
  private handleSessionExpired(): void {
    logger.warn('Session has expired, logging out user');
    
    // Import notification service dynamically to avoid circular dependencies
    if (typeof window !== 'undefined') {
      import('./notifications').then(({ notificationService }) => {
        notificationService.warning(
          'انتهت الجلسة',
          'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'
        );
      }).catch(() => {
        // Fallback notification
        logger.warn('Session expired notification failed');
      });
    }
    
    this.logout();
  }

  /**
   * Handle when session is about to expire
   */
  private handleSessionExpiring(): void {
    const timeRemaining = this.computeTokenTimeRemaining(this.authState.token);
    const minutesRemaining = Math.floor(timeRemaining / (60 * 1000));

    if (typeof window !== 'undefined') {
      import('./notifications').then(({ notificationService }) => {
        notificationService.warning(
          'Session expiring soon',
          `Session will expire in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}. Please save your work and refresh your session.`
        );
      }).catch(() => {
        logger.warn('Notification service not available');
      });
    }
  }

  public isTokenExpired(token: string | null): boolean {
    return this.isJwtExpired(token);
  }

  public getTokenPayload(token?: string | null): JwtPayload | null {
    const tokenToCheck = token || this.authState.token;
    return this.decodeJwtPayload(tokenToCheck || '');
  }

  public getTokenTimeRemaining(): number {
    return this.computeTokenTimeRemaining(this.authState.token);
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      // Only load user data from localStorage - token is now in httpOnly cookie
      const userStr = localStorage.getItem('auth_user');
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          
          // Set auth state with user but no token (handled by httpOnly cookie)
          this.authState = {
            user,
            token: null, // No longer store tokens in localStorage
            isAuthenticated: true
          };
          
          logger.log('User data loaded from storage successfully');
        } catch (error) {
          logger.error('Failed to parse stored user data:', error);
          this.clearAuth();
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      if (this.authState.user) {
        // Only save user data - token is handled by httpOnly cookie
        localStorage.setItem('auth_user', JSON.stringify(this.authState.user));
      } else {
        this.clearStorage();
      }
    }
  }

  private clearStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
      // Keep this line for old sessions cleanup
      localStorage.removeItem('auth_token');
    }
  }

  setAuth(token: string, user: User) {
    // With httpOnly cookies, we don't validate or store tokens client-side
    // This method is kept for compatibility but only stores user data
    this.authState = {
      user,
      token: null, // No longer store tokens in localStorage
      isAuthenticated: true
    };
    
    this.saveToStorage();
    this.startSessionMonitoring();
    logger.log('Authentication state updated successfully');
  }

  clearAuth() {
    this.authState = {
      user: null,
      token: null,
      isAuthenticated: false
    };
    
    this.clearStorage();
    this.stopSessionMonitoring();
    logger.log('Authentication state cleared');
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  isAuthenticated(): boolean {
    // With httpOnly cookies, we trust the user data presence for client-side checks
    // Server-side verification happens automatically with cookies
    return !!this.authState.user && this.authState.isAuthenticated;
  }

  getToken(): string | null {
    // Tokens are now in httpOnly cookies, not accessible from client-side
    // Return null to prevent any client-side token usage
    return null;
  }

  getUser(): User | null {
    return this.authState.user;
  }

  isAdmin(): boolean {
    return this.authState.user?.role === 'admin';
  }

  hasRole(role: string): boolean {
    return this.authState.user?.role === role;
  }

  // دالة تسجيل الدخول
  async login(email: string, password: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Remove hardcoded admin check - let backend handle all authentication
      
      // Use Next.js API route instead of direct backend call
      const apiUrl = '/api/auth/login';
      
      logger.log('Attempting login via Next.js API route:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for httpOnly handling
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Login failed:', data);
        return {
          success: false,
          error: data.message || 'فشل في تسجيل الدخول'
        };
      }

      // Get user data from response - no token needed since it's in httpOnly cookie
      const user: User = data.data?.user || {
        _id: '',
        email: email,
        name: email.includes('@') ? email.split('@')[0] : email,
        role: 'user'
      };

      // Store only user data - token is handled by httpOnly cookie
      this.authState = {
        user,
        token: null, // No longer store tokens in localStorage
        isAuthenticated: true
      };
      
      // Store only user data in localStorage (not the token)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.removeItem('auth_token'); // Clean up any old tokens
      }

      logger.log('Login successful, session established with httpOnly cookies');

      return {
        success: true,
        data: {
          ...data,
          user
        }
      };
    } catch (error) {
      logger.error('Login error:', error);
      return {
        success: false,
        error: 'حدث خطأ في الاتصال بالخادم'
      };
    }
  }

  // دالة تسجيل الخروج
  logout() {
    logger.log('Logging out user');
    
    // Call Next.js logout API to clear httpOnly cookie
    if (typeof window !== 'undefined') {
      fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(error => {
        logger.warn('Logout API call failed:', error);
      });
    }
    
    this.clearAuth();
    
    // Redirect to home or login page
    if (typeof window !== 'undefined') {
      // Check if we're on a protected route
      const currentPath = window.location.pathname;
      const protectedRoutes = ['/orders', '/dashboard', '/profile'];
      
      if (protectedRoutes.some(route => currentPath.startsWith(route))) {
        // Redirect to signin with return URL
        const returnUrl = encodeURIComponent(currentPath + window.location.search);
        window.location.replace(`/signin?returnUrl=${returnUrl}`);
      }
    }
  }

  /**
   * Extend session - not needed with httpOnly cookies as server manages expiration
   */
  async extendSession(): Promise<boolean> {
    // With httpOnly cookies, session extension is handled server-side
    // We just need to check if the user is still authenticated
    try {
      // Make a test API call to verify authentication
      const response = await fetch('/api/order', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        logger.log('Session still valid');
        return true;
      } else if (response.status === 401) {
        logger.warn('Session expired - logging out');
        this.logout();
        return false;
      } else {
        logger.warn('Session check failed with status:', response.status);
        return false;
      }
    } catch (error) {
      logger.error('Session check error:', error);
      return false;
    }
  }

  /**
   * Cleanup method for when component unmounts
   */
  destroy() {
    this.stopSessionMonitoring();
  }
}

export const authService = AuthService.getInstance();

// React Hook for using auth service

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to auth state changes
    const updateAuthState = () => {
      setAuthState(authService.getAuthState());
    };

    // Check auth state on mount
    updateAuthState();

    // Set up interval to check for auth changes
    const interval = setInterval(updateAuthState, 1000);

    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
  };

  const extendSession = async () => {
    return await authService.extendSession();
  };

  return {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading,
    isAdmin: authService.isAdmin(),
    hasRole: (role: string) => authService.hasRole(role),
    login,
    logout,
    extendSession,
    getTokenTimeRemaining: () => authService.getTokenTimeRemaining()
  };
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    authService.destroy();
  });
}

