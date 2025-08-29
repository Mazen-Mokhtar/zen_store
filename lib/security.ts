import { logger } from './utils';

export interface SecurityConfig {
  enableCSP: boolean;
  enableXSSProtection: boolean;
  enableHTTPSOnly: boolean;
  enableSecureCookies: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableCSP: true,
  enableXSSProtection: true,
  enableHTTPSOnly: true,
  enableSecureCookies: true,
  maxLoginAttempts: 5,
  sessionTimeout: 3600000, // 1 hour
};

class SecurityManager {
  private config: SecurityConfig;
  private loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private blockedIPs: Set<string> = new Set();

  constructor() {
    this.config = { ...DEFAULT_SECURITY_CONFIG };
    this.initializeSecurityHeaders();
  }

  private initializeSecurityHeaders(): void {
    if (typeof window === 'undefined') return;

    // Set security headers
    this.setSecurityHeaders();
    
    // Monitor for security events
    this.monitorSecurityEvents();
  }

  private setSecurityHeaders(): void {
    // Note: In a real application, these headers would be set on the server side
    // This is just for demonstration purposes
    logger.log('Security headers would be set here');
  }

  private monitorSecurityEvents(): void {
    // Monitor for XSS attempts
    this.monitorXSSAttempts();
    
    // Monitor for CSRF attempts
    this.monitorCSRFAttempts();
    
    // Monitor for clickjacking attempts
    this.monitorClickjackingAttempts();
  }

  private monitorXSSAttempts(): void {
    // Monitor script injection attempts
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'SCRIPT' && !element.hasAttribute('data-safe')) {
              logger.warn('Potential XSS attempt detected');
              this.reportSecurityEvent('xss_attempt', {
                element: element.outerHTML,
                url: window.location.href
              });
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private monitorCSRFAttempts(): void {
    // Monitor for unauthorized form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const token = form.querySelector('input[name="csrf_token"]') as HTMLInputElement;
      
      if (!token || !this.validateCSRFToken(token.value)) {
        event.preventDefault();
        logger.warn('Potential CSRF attempt detected');
        this.reportSecurityEvent('csrf_attempt', {
          form: form.action,
          url: window.location.href
        });
      }
    });
  }

  private monitorClickjackingAttempts(): void {
    // Check if the page is being loaded in an iframe
    if (window.top !== window.self) {
      logger.warn('Potential clickjacking attempt detected');
      this.reportSecurityEvent('clickjacking_attempt', {
        referrer: document.referrer,
        url: window.location.href
      });
      
      // Prevent the page from being displayed in an iframe
      if (window.top !== null) {
        window.top.location.href = window.location.href;
      }
    }
  }

  // Input sanitization
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Enhanced XSS prevention with comprehensive character encoding
    return input
      .replace(/[<>"'&\/\\]/g, (match) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
          '/': '&#x2F;',
          '\\': '&#x5C;'
        };
        return entities[match] || match;
      })
      // Remove null bytes and control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Remove potential script injection patterns
      .replace(/javascript:/gi, 'blocked:')
      .replace(/vbscript:/gi, 'blocked:')
      .replace(/data:/gi, 'blocked:')
      .replace(/on\w+\s*=/gi, 'blocked=')
      // Limit length to prevent DoS
      .substring(0, 10000);
  }

  /**
   * Enhanced input sanitization for different contexts
   */
  sanitizeForContext(input: string, context: 'html' | 'attribute' | 'url' | 'css' | 'js'): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = this.sanitizeInput(input);

    switch (context) {
      case 'html':
        // Additional HTML context sanitization
        sanitized = sanitized
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
          .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
          .replace(/<embed[^>]*>/gi, '')
          .replace(/<link[^>]*>/gi, '')
          .replace(/<meta[^>]*>/gi, '');
        break;

      case 'attribute':
        // Strict attribute sanitization
        sanitized = sanitized
          .replace(/["'`]/g, '')
          .replace(/[\r\n\t]/g, ' ');
        break;

      case 'url':
        // URL sanitization
        try {
          const url = new URL(sanitized);
          if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
            return '';
          }
          sanitized = url.toString();
        } catch {
          return '';
        }
        break;

      case 'css':
        // CSS sanitization
        sanitized = sanitized
          .replace(/expression\s*\(/gi, 'blocked(')
          .replace(/javascript:/gi, 'blocked:')
          .replace(/vbscript:/gi, 'blocked:')
          .replace(/import/gi, 'blocked')
          .replace(/@import/gi, 'blocked');
        break;

      case 'js':
        // JavaScript context - very restrictive
        sanitized = sanitized
          .replace(/[<>"'&\/\\(){}\[\];]/g, '')
          .replace(/\b(eval|function|setTimeout|setInterval|alert|confirm|prompt)\b/gi, 'blocked');
        break;
    }

    return sanitized;
  }

  /**
   * SQL Injection prevention for search queries
   */
  sanitizeForDatabase(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      // Remove SQL injection patterns
      .replace(/['"`;\\]/g, '')
      .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .replace(/;/g, '')
      // Remove null bytes
      .replace(/\x00/g, '')
      // Limit length
      .substring(0, 1000)
      .trim();
  }

  /**
   * Sanitize file names and paths
   */
  sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return '';
    }

    return fileName
      // Remove dangerous characters
      .replace(/[<>:"\/\\|?*\x00-\x1f]/g, '')
      // Remove leading/trailing dots and spaces
      .replace(/^[\.\s]+|[\.\s]+$/g, '')
      // Remove reserved Windows names
      .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, 'file')
      // Limit length
      .substring(0, 255);
  }

  /**
   * Validate and sanitize phone numbers
   */
  sanitizePhoneNumber(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      return '';
    }

    // Remove all non-digit characters except + at the beginning
    let sanitized = phone.replace(/[^\d+]/g, '');
    
    // Ensure + is only at the beginning
    if (sanitized.includes('+')) {
      const parts = sanitized.split('+');
      sanitized = '+' + parts.join('');
    }

    // Validate length (international format)
    if (sanitized.length < 7 || sanitized.length > 15) {
      return '';
    }

    return sanitized;
  }

  // HTML sanitization
  sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  // URL validation
  isValidURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // Email validation
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Password strength validation
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one number');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one special character');
    }

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }

  // Login attempt tracking
  recordLoginAttempt(identifier: string, success: boolean): boolean {
    const now = Date.now();
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };

    if (success) {
      // Reset attempts on successful login
      this.loginAttempts.delete(identifier);
      return true;
    }

    // Check if too many attempts
    if (attempts.count >= this.config.maxLoginAttempts) {
      const timeSinceLastAttempt = now - attempts.lastAttempt;
      if (timeSinceLastAttempt < 300000) { // 5 minutes
        this.blockIP(identifier);
        return false;
      } else {
        // Reset attempts after timeout
        attempts.count = 0;
      }
    }

    attempts.count++;
    attempts.lastAttempt = now;
    this.loginAttempts.set(identifier, attempts);

    return attempts.count < this.config.maxLoginAttempts;
  }

  // IP blocking
  private blockIP(identifier: string): void {
    this.blockedIPs.add(identifier);
    this.reportSecurityEvent('ip_blocked', { identifier });
  }

  isIPBlocked(identifier: string): boolean {
    return this.blockedIPs.has(identifier);
  }

  unblockIP(identifier: string): void {
    this.blockedIPs.delete(identifier);
  }

  // CSRF token management
  private generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private validateCSRFToken(token: string): boolean {
    // In a real application, this would validate against a stored token
    return token.length === 64 && /^[a-f0-9]+$/i.test(token);
  }

  getCSRFToken(): string {
    return this.generateCSRFToken();
  }

  // Session management
  createSession(userId: string): string {
    const sessionId = this.generateSessionId();
    const sessionData = {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.config.sessionTimeout
    };

    // Store session data (in a real app, this would be in a secure database)
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
    
    return sessionId;
  }

  validateSession(sessionId: string): boolean {
    const sessionData = localStorage.getItem(`session_${sessionId}`);
    if (!sessionData) return false;

    try {
      const session = JSON.parse(sessionData);
      if (Date.now() > session.expiresAt) {
        this.destroySession(sessionId);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  destroySession(sessionId: string): void {
    localStorage.removeItem(`session_${sessionId}`);
  }

  private generateSessionId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Security event reporting
  private reportSecurityEvent(eventType: string, data: any): void {
    logger.warn(`Security event: ${eventType}`, data);
    
    // In a real application, this would send to a security monitoring service
    // fetch('/api/security/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ eventType, data, timestamp: Date.now() })
    // });
  }

  // Rate limiting
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();

  isRateLimited(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const rateLimit = this.rateLimits.get(key);

    if (!rateLimit || now > rateLimit.resetTime) {
      this.rateLimits.set(key, { count: 1, resetTime: now + windowMs });
      return false;
    }

    if (rateLimit.count >= limit) {
      return true;
    }

    rateLimit.count++;
    return false;
  }

  // Configuration
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Security audit
  runSecurityAudit(): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check for HTTPS
    if (window.location.protocol !== 'https:' && this.config.enableHTTPSOnly) {
      issues.push('Site is not served over HTTPS');
      score -= 20;
      recommendations.push('Enable HTTPS for all connections');
    }

    // Check for secure cookies
    if (this.config.enableSecureCookies) {
      const cookies = document.cookie.split(';');
      const hasSecureCookies = cookies.some(cookie => cookie.includes('Secure'));
      if (!hasSecureCookies) {
        issues.push('No secure cookies found');
        score -= 10;
        recommendations.push('Use secure cookies for sensitive data');
      }
    }

    // Check for CSP
    if (this.config.enableCSP) {
      const cspHeader = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (!cspHeader) {
        issues.push('No Content Security Policy found');
        score -= 15;
        recommendations.push('Implement Content Security Policy');
      }
    }

    return { score, issues, recommendations };
  }
}

export const securityManager = new SecurityManager();

// Export security utilities
export const sanitizeInput = securityManager.sanitizeInput.bind(securityManager);
export const sanitizeHTML = securityManager.sanitizeHTML.bind(securityManager);
export const isValidURL = securityManager.isValidURL.bind(securityManager);
export const isValidEmail = securityManager.isValidEmail.bind(securityManager);
export const validatePasswordStrength = securityManager.validatePasswordStrength.bind(securityManager);