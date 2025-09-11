'use client';

import { authService } from './auth';

class SessionMonitor {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // Check every minute
  private readonly WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
  private isMonitoring = false;
  private onSessionExpired?: () => void;
  private onSessionWarning?: (timeLeft: number) => void;

  constructor() {
    // Bind methods to preserve context
    this.checkSession = this.checkSession.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  /**
   * Start monitoring the session
   */
  start(callbacks?: {
    onSessionExpired?: () => void;
    onSessionWarning?: (timeLeft: number) => void;
  }) {
    if (this.isMonitoring) {

      return;
    }

    this.onSessionExpired = callbacks?.onSessionExpired;
    this.onSessionWarning = callbacks?.onSessionWarning;
    

    this.isMonitoring = true;
    
    // Start periodic checks
    this.checkInterval = setInterval(this.checkSession, this.CHECK_INTERVAL);
    
    // Check immediately
    this.checkSession();
    
    // Listen for page visibility changes to check session when user returns
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  /**
   * Stop monitoring the session
   */
  stop() {

    this.isMonitoring = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  /**
   * Check session status and handle expiry
   */
  private async checkSession() {
    try {
      const token = authService.getToken();
      const isValid = authService.validateToken(token);
      
      if (!isValid) {

        this.handleSessionExpired();
        return;
      }
      
      // Check if session is close to expiry
      const tokenData = authService.getTokenPayload();
      if (tokenData?.exp) {
        const expiryTime = tokenData.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeLeft = expiryTime - currentTime;
        
        if (timeLeft <= this.WARNING_THRESHOLD && timeLeft > 0) {
  
          this.onSessionWarning?.(timeLeft);
        }
      }
      
    } catch (error) {

      // Don't logout on network errors, just log them
    }
  }

  /**
   * Handle page visibility changes
   */
  private handleVisibilityChange() {
    if (typeof document !== 'undefined' && !document.hidden && this.isMonitoring) {

      this.checkSession();
    }
  }

  /**
   * Handle session expiry
   */
  private handleSessionExpired() {
    this.stop();
    
    if (this.onSessionExpired) {
      this.onSessionExpired();
    } else {
      // Default behavior: redirect to login
      this.performLogout();
    }
  }

  /**
   * Perform logout and redirect
   */
  private async performLogout() {
    try {
      // Call logout API to clear cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {

    } finally {
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  }

  /**
   * Get current monitoring status
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

// Export singleton instance
export const sessionMonitor = new SessionMonitor();
export default sessionMonitor;