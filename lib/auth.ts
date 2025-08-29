'use client';
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

export class AuthService {
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
      // Enhanced security validation
      if (!token || typeof token !== 'string') {
        logger.warn('Invalid token type provided');
        return null;
      }

      // Support tokens that may come prefixed (e.g., "Bearer " or role prefix like "user ")
      let raw = token.trim();
      
      // Security check: prevent extremely long tokens (potential DoS)
      if (raw.length > 4096) {
        logger.warn('Token exceeds maximum allowed length');
        return null;
      }
      
      // Remove Bearer prefix if present
      if (raw.startsWith('Bearer ')) {
        raw = raw.slice(7);
      }
      
      // Remove role prefix if present (user/admin/superAdmin followed by space)
      const rolePattern = /^(user|admin|superAdmin)\s+/i;
      if (rolePattern.test(raw)) {
        raw = raw.replace(rolePattern, '');
      }
      
      // Validate JWT structure
      const parts = raw.split('.');
      if (parts.length !== 3) {
        logger.warn('Invalid JWT structure - expected 3 parts');
        return null;
      }
      
      // Validate each part is base64url encoded
      const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
      if (!parts.every(part => base64UrlPattern.test(part))) {
        logger.warn('Invalid JWT - contains non-base64url characters');
        return null;
      }
      
      // Decode payload with enhanced error handling
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed
      const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
      
      const json = decodeURIComponent(
        atob(paddedBase64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(json) as JwtPayload;
      
      // Enhanced payload validation
      if (!this.validateJwtPayload(payload)) {
        logger.warn('JWT payload validation failed');
        return null;
      }
      
      return payload;
    } catch (error) {
      logger.warn('Failed to decode JWT payload:', error);
      return null;
    }
  }

  /**
   * Validate JWT payload structure and content
   */
  private validateJwtPayload(payload: any): boolean {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    // Check for required fields
    const requiredFields = ['exp', 'iat'];
    for (const field of requiredFields) {
      if (!(field in payload)) {
        logger.warn(`Missing required JWT field: ${field}`);
        return false;
      }
    }

    // Validate timestamp fields
    if (typeof payload.exp !== 'number' || typeof payload.iat !== 'number') {
      logger.warn('Invalid timestamp fields in JWT');
      return false;
    }

    // Check if token was issued in the future (clock skew tolerance: 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const clockSkewTolerance = 300; // 5 minutes
    
    if (payload.iat > now + clockSkewTolerance) {
      logger.warn('JWT issued in the future');
      return false;
    }

    // Check if expiration is reasonable (not more than 24 hours from issue)
    const maxTokenLifetime = 24 * 60 * 60; // 24 hours
    if (payload.exp - payload.iat > maxTokenLifetime) {
      logger.warn('JWT has unreasonably long lifetime');
      return false;
    }

    // Validate user ID format if present
    if (payload.userId && typeof payload.userId !== 'string') {
      logger.warn('Invalid userId format in JWT');
      return false;
    }

    // Validate email format if present
    if (payload.email && !this.isValidEmail(payload.email)) {
      logger.warn('Invalid email format in JWT');
      return false;
    }

    // Validate role if present
    if (payload.role && !['user', 'admin', 'superAdmin'].includes(payload.role)) {
      logger.warn('Invalid role in JWT');
      return false;
    }

    return true;
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

  /**
   * Enhanced token validation with comprehensive security checks
   */
  public validateToken(token: string | null): boolean {
    if (!token) {
      logger.warn('Token validation failed: No token provided');
      return false;
    }

    try {
      // Decode and validate JWT payload
      const payload = this.decodeJwtPayload(token);
      if (!payload) {
        logger.warn('Token validation failed: Invalid JWT structure');
        return false;
      }

      // Check if token is expired
      if (this.isJwtExpired(token)) {
        logger.warn('Token validation failed: Token has expired');
        return false;
      }

      // Additional security checks
      const now = Math.floor(Date.now() / 1000);
      
      // Check not-before claim if present
      if (payload.nbf && payload.nbf > now) {
        logger.warn('Token validation failed: Token not yet valid (nbf claim)');
        return false;
      }

      // Check audience if present (should match our application)
      if (payload.aud && payload.aud !== window.location.origin) {
        logger.warn('Token validation failed: Invalid audience');
        return false;
      }

      // Check issuer if present (should match our backend)
      if (payload.iss && !this.isValidIssuer(payload.iss)) {
        logger.warn('Token validation failed: Invalid issuer');
        return false;
      }

      // Check token age (prevent very old tokens)
      const tokenAge = now - (payload.iat || 0);
      const maxTokenAge = 7 * 24 * 60 * 60; // 7 days
      if (tokenAge > maxTokenAge) {
        logger.warn('Token validation failed: Token too old');
        return false;
      }

      // Check for suspicious patterns in token
      if (this.detectSuspiciousTokenPatterns(token)) {
        logger.warn('Token validation failed: Suspicious token patterns detected');
        return false;
      }

      logger.log('Token validation successful');
      return true;

    } catch (error) {
      logger.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Check if issuer is valid
   */
  private isValidIssuer(issuer: string): boolean {
    // Define valid issuers for your application
    const validIssuers = [
      process.env.NEXT_PUBLIC_API_URL,
      'http://localhost:3000',
      'https://localhost:3000'
    ].filter(Boolean);

    return validIssuers.includes(issuer);
  }

  /**
   * Detect suspicious patterns in token
   */
  private detectSuspiciousTokenPatterns(token: string): boolean {
    // Check for common attack patterns
    const suspiciousPatterns = [
      /script/i,
      /<[^>]*>/,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /on\w+=/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(token));
  }

  /**
   * Enhanced role-based authorization check
   */
  public hasPermission(requiredRole: string, token?: string | null): boolean {
    const tokenToCheck = token || this.authState.token;
    
    if (!this.validateToken(tokenToCheck)) {
      return false;
    }

    const payload = this.getTokenPayload(tokenToCheck);
    if (!payload || !payload.role) {
      return false;
    }

    // Define role hierarchy
    const roleHierarchy: { [key: string]: number } = {
      'user': 1,
      'admin': 2,
      'superAdmin': 3
    };

    const userRoleLevel = roleHierarchy[payload.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      // Check for user data in URL parameters (from Google OAuth redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const userDataParam = urlParams.get('userData');
      
      if (userDataParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userDataParam));
          localStorage.setItem('auth_user', JSON.stringify(userData));
          
          // Set auth state with user data
          this.authState = {
            user: userData,
            token: null, // Token is in httpOnly cookie
            isAuthenticated: true
          };
          
          logger.log('User data loaded from URL parameter and saved to localStorage');
          
          // Clean up URL by removing userData parameter
          urlParams.delete('userData');
          const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
          window.history.replaceState({}, '', newUrl);
          
          return;
        } catch (error) {
          logger.error('Failed to parse user data from URL:', error);
        }
      }
      
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
      } else {
        // If no user in localStorage, check if we have a valid session via httpOnly cookie
        this.checkAuthStatus();
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

  /**
   * Set authentication state (used by AuthGuard for Google OAuth)
   */
  setAuthState(state: { user: any; token: string | null; isAuthenticated: boolean }) {
    this.authState = state;
    logger.log('Auth state updated externally');
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
   * Check authentication status by calling /api/auth/me with enhanced security
   */
  async checkAuthStatus(): Promise<boolean> {
    try {
      // Add timeout and abort controller for security
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
        headers: (() => {
          const baseHeaders: Record<string, string> = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          };
          const csrfToken = this.getCSRFToken();
          if (csrfToken) {
            baseHeaders['X-CSRF-Token'] = csrfToken;
          }
          return baseHeaders;
        })()
      });

      clearTimeout(timeoutId);

      // Enhanced response validation
      if (!response.ok) {
        if (response.status === 401) {
          logger.warn('Authentication failed - invalid or expired session');
          this.clearAuth();
          return false;
        } else if (response.status === 403) {
          logger.warn('Access forbidden - insufficient permissions');
          this.clearAuth();
          return false;
        } else if (response.status === 429) {
          logger.warn('Rate limit exceeded for auth check');
          return false;
        } else {
          logger.error(`Auth check failed with status: ${response.status}`);
          return false;
        }
      }

      // Validate response content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        logger.error('Invalid response content type from auth endpoint');
        return false;
      }

      const data = await response.json();
      
      // Enhanced data validation
      if (!this.validateAuthResponse(data)) {
        logger.error('Invalid auth response structure');
        this.clearAuth();
        return false;
      }

      if (data.success && data.data?.user) {
        // Validate user data structure
        if (!this.validateUserData(data.data.user)) {
          logger.error('Invalid user data received from server');
          this.clearAuth();
          return false;
        }

        // Update auth state with validated user data from server
        this.authState = {
          user: {
            _id: data.data.user._id,
            email: data.data.user.email,
            name: data.data.user.name,
            role: data.data.user.role
          },
          token: null, // Token is in httpOnly cookie
          isAuthenticated: true
        };
        
        // Save user data to localStorage for future loads
        this.saveToStorage();
        
        logger.log('Auth status successfully updated from server');
        return true;
      }
      
      logger.warn('Auth check returned unsuccessful response');
      this.clearAuth();
      return false;
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          logger.error('Auth status check timed out');
        } else if (error.name === 'TypeError') {
          logger.error('Network error during auth check:', error.message);
        } else {
          logger.error('Auth status check error:', error.message);
        }
      } else {
        logger.error('Unknown error during auth check:', error);
      }
      
      // Don't clear auth on network errors, only on explicit auth failures
      return false;
    }
  }

  /**
   * Validate authentication response structure
   */
  private validateAuthResponse(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (typeof data.success !== 'boolean') {
      return false;
    }

    if (data.success && (!data.data || typeof data.data !== 'object')) {
      return false;
    }

    return true;
  }

  /**
   * Validate user data structure
   */
  private validateUserData(user: any): boolean {
    if (!user || typeof user !== 'object') {
      return false;
    }

    // Check required fields
    const requiredFields = ['_id', 'email', 'name', 'role'];
    for (const field of requiredFields) {
      if (!user[field] || typeof user[field] !== 'string') {
        logger.warn(`Invalid or missing user field: ${field}`);
        return false;
      }
    }

    // Validate email format
    if (!this.isValidEmail(user.email)) {
      logger.warn('Invalid email format in user data');
      return false;
    }

    // Validate role
    if (!['user', 'admin', 'superAdmin'].includes(user.role)) {
      logger.warn('Invalid role in user data');
      return false;
    }

    // Validate ID format (accept MongoDB ObjectId or other valid ID formats)
    if (!user._id || user._id.length < 1) {
      logger.warn('Invalid user ID format');
      return false;
    }

    return true;
  }

  /**
   * Get CSRF token if available
   */
  private getCSRFToken(): string | null {
    if (typeof window !== 'undefined') {
      const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
      return metaTag ? metaTag.content : null;
    }
    return null;
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

  return {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading,
    isAdmin: authService.isAdmin(),
    hasRole: (role: string) => authService.hasRole(role),
    login,
    logout,
    getTokenTimeRemaining: () => authService.getTokenTimeRemaining()
  };
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    authService.destroy();
  });
}

