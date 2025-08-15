// إدارة حالة تسجيل الدخول والتوكن
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
      console.warn('Failed to decode JWT payload:', error);
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
      console.warn('JWT token has expired:', {
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
    console.warn('Session has expired, logging out user');
    
    // Import notification service dynamically to avoid circular dependencies
    if (typeof window !== 'undefined') {
      import('./notifications').then(({ notificationService }) => {
        notificationService.warning(
          'انتهت الجلسة',
          'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'
        );
      }).catch(() => {
        // Fallback notification
        console.warn('Session expired notification failed');
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
        console.warn('Notification service not available');
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
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          
          // Validate token before loading session
          if (this.isJwtExpired(token)) {
            console.warn('Expired token found in storage, clearing session');
            this.clearStorage();
            this.authState = { user: null, token: null, isAuthenticated: false };
            return;
          }
          
          this.authState = {
            user,
            token,
            isAuthenticated: true
          };
          
          console.log('Session loaded from storage successfully');
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          this.clearAuth();
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      if (this.authState.token && this.authState.user) {
        localStorage.setItem('auth_token', this.authState.token);
        localStorage.setItem('auth_user', JSON.stringify(this.authState.user));
      } else {
        this.clearStorage();
      }
    }
  }

  private clearStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }

  setAuth(token: string, user: User) {
    // Validate token before setting
    if (this.isJwtExpired(token)) {
      console.error('Attempted to set expired token');
      throw new Error('Cannot set expired authentication token');
    }
    
    this.authState = {
      user,
      token,
      isAuthenticated: true
    };
    
    this.saveToStorage();
    this.startSessionMonitoring();
    console.log('Authentication state updated successfully');
  }

  clearAuth() {
    this.authState = {
      user: null,
      token: null,
      isAuthenticated: false
    };
    
    this.clearStorage();
    this.stopSessionMonitoring();
    console.log('Authentication state cleared');
  }

  getAuthState(): AuthState {
    // Always validate current token state
    if (this.authState.token && this.isJwtExpired(this.authState.token)) {
      console.warn('Auth state contains expired token, clearing...');
      this.clearAuth();
    }
    
    return { ...this.authState };
  }

  isAuthenticated(): boolean {
    const hasValidToken = !!this.authState.token && !this.isJwtExpired(this.authState.token);
    
    // If token is invalid but state shows authenticated, clear the state
    if (!hasValidToken && this.authState.isAuthenticated) {
      this.clearAuth();
    }
    
    return hasValidToken;
  }

  getToken(): string | null {
    if (this.isJwtExpired(this.authState.token)) {
      this.clearAuth();
      return null;
    }
    
    return this.authState.token;
  }

  getUser(): User | null {
    // Only return user if authentication is valid
    return this.isAuthenticated() ? this.authState.user : null;
  }

  // دالة تسجيل الدخول
  async login(email: string, password: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // تحديد عنوان API بشكل صريح من متغيرات البيئة لتجنب إرسال الطلب إلى تطبيق Next.js
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const apiUrl = `${apiBase}/auth/login`;
      
      console.log('Attempting login to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        // نستخدم include فقط إذا كان الخادم يعتمد على الكوكيز، وإلا يمكن حذف هذا السطر
        // وفي حالتنا نستقبل accessToken في الـ body لذا لسنا بحاجة إلى الكوكيز
        // credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Login failed:', data);
        return {
          success: false,
          error: data.message || 'فشل في تسجيل الدخول'
        };
      }

      // حفظ بيانات المستخدم والتوكن
      const accessToken = data.data?.accessToken;
      
      if (!accessToken) {
        return {
          success: false,
          error: 'لم يتم العثور على رمز الوصول في الاستجابة'
        };
      }

      // Validate token before using it
      if (this.isJwtExpired(accessToken)) {
        return {
          success: false,
          error: 'تم استلام رمز وصول منتهي الصلاحية من الخادم'
        };
      }

      // استخدام المستخدم القادم من الخادم إن وجد، وإلا فfallback بسيط
      const serverUser: Partial<User> | undefined = data.data?.user;
      const user: User = {
        _id: serverUser?._id ?? '',
        email: serverUser?.email ?? email,
        name: serverUser?.name ?? (email.includes('@') ? email.split('@')[0] : email),
        role: serverUser?.role ?? 'user'
      };

      // حفظ التوكن والمستخدم في حالة المصادقة
      this.setAuth(accessToken, user);

      console.log('Login successful, session established');

      // إرجاع البيانات للاستخدام الفوري
      return {
        success: true,
        data: {
          ...data,
          user // إضافة بيانات المستخدم للاستخدام الفوري
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'حدث خطأ في الاتصال بالخادم'
      };
    }
  }

  // دالة تسجيل الخروج
  logout() {
    console.log('Logging out user');
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
   * Extend session - placeholder for future token refresh implementation
   */
  async extendSession(): Promise<boolean> {
    // TODO: Implement token refresh logic when backend supports it
    console.log('Session extension not implemented yet');
    return false;
  }

  /**
   * Cleanup method for when component unmounts
   */
  destroy() {
    this.stopSessionMonitoring();
  }
}

export const authService = AuthService.getInstance();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    authService.destroy();
  });
}

