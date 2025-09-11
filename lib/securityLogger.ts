import { ErrorSeverity, ErrorType } from './errorHandler';

// Re-export for convenience
export { ErrorSeverity, ErrorType };

// Security event types
export enum SecurityEventType {
  AUTHENTICATION_FAILURE = 'auth_failure',
  AUTHORIZATION_FAILURE = 'authz_failure',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_INPUT = 'invalid_input',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt',
  PATH_TRAVERSAL_ATTEMPT = 'path_traversal_attempt',
  SESSION_HIJACK_ATTEMPT = 'session_hijack_attempt',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  MALICIOUS_FILE_UPLOAD = 'malicious_file_upload',
  SECURITY_SCAN_DETECTED = 'security_scan_detected',
  ACCOUNT_LOCKOUT = 'account_lockout',
  ACCESS_VIOLATION = 'access_violation'
}

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Security event interface
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: ErrorSeverity;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  payload?: any;
  message: string;
  context?: Record<string, any>;
  blocked: boolean;
  riskScore: number;
}

// Application log interface
export interface AppLog {
  id: string;
  level: LogLevel;
  timestamp: string;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class SecurityLogger {
  private static instance: SecurityLogger;
  private logs: AppLog[] = [];
  private securityEvents: SecurityEvent[] = [];
  private maxLogs = 1000;
  private maxSecurityEvents = 500;

  private constructor() {}

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Sanitize sensitive data
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'session',
      'jwt', 'apikey', 'api_key', 'authorization', 'cookie',
      'x-api-key', 'x-auth-token', 'bearer'
    ];

    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    });

    return sanitized;
  }

  // Calculate risk score based on event type and context
  private calculateRiskScore(type: SecurityEventType, context?: Record<string, any>): number {
    let baseScore = 0;

    switch (type) {
      case SecurityEventType.DATA_BREACH_ATTEMPT:
      case SecurityEventType.PRIVILEGE_ESCALATION:
        baseScore = 90;
        break;
      case SecurityEventType.SQL_INJECTION_ATTEMPT:
      case SecurityEventType.SESSION_HIJACK_ATTEMPT:
        baseScore = 80;
        break;
      case SecurityEventType.XSS_ATTEMPT:
      case SecurityEventType.BRUTE_FORCE_ATTEMPT:
        baseScore = 70;
        break;
      case SecurityEventType.CSRF_ATTEMPT:
      case SecurityEventType.PATH_TRAVERSAL_ATTEMPT:
        baseScore = 60;
        break;
      case SecurityEventType.MALICIOUS_FILE_UPLOAD:
      case SecurityEventType.SECURITY_SCAN_DETECTED:
        baseScore = 50;
        break;
      case SecurityEventType.RATE_LIMIT_EXCEEDED:
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        baseScore = 40;
        break;
      case SecurityEventType.AUTHORIZATION_FAILURE:
        baseScore = 30;
        break;
      case SecurityEventType.AUTHENTICATION_FAILURE:
      case SecurityEventType.INVALID_INPUT:
        baseScore = 20;
        break;
      default:
        baseScore = 10;
    }

    // Adjust score based on context
    if (context) {
      if (context.repeatOffender) baseScore += 20;
      if (context.multipleAttempts) baseScore += 15;
      if (context.adminTarget) baseScore += 25;
      if (context.sensitiveData) baseScore += 30;
    }

    return Math.min(100, baseScore);
  }

  // Log security event
  logSecurityEvent(
    type: SecurityEventType,
    message: string,
    context?: {
      userId?: string;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      url?: string;
      method?: string;
      headers?: Record<string, string>;
      payload?: any;
      blocked?: boolean;
      additionalContext?: Record<string, any>;
    }
  ): void {
    const riskScore = this.calculateRiskScore(type, context?.additionalContext);
    const severity = this.getSeverityFromRiskScore(riskScore);
    
    const event: SecurityEvent = {
      id: this.generateId(),
      type,
      severity,
      timestamp: new Date().toISOString(),
      userId: context?.userId,
      sessionId: context?.sessionId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      url: context?.url,
      method: context?.method,
      headers: context?.headers ? this.sanitizeData(context.headers) : undefined,
      payload: context?.payload ? this.sanitizeData(context.payload) : undefined,
      message,
      context: context?.additionalContext ? this.sanitizeData(context.additionalContext) : undefined,
      blocked: context?.blocked ?? false,
      riskScore
    };

    this.securityEvents.push(event);
    
    // Maintain max events limit
    if (this.securityEvents.length > this.maxSecurityEvents) {
      this.securityEvents = this.securityEvents.slice(-this.maxSecurityEvents);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      // Security event logged in development mode
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(event);
    }

    // Alert for high-risk events
    if (riskScore >= 70) {
      this.alertHighRiskEvent(event);
    }
  }

  // Log application event
  log(
    level: LogLevel,
    message: string,
    context?: {
      userId?: string;
      sessionId?: string;
      component?: string;
      action?: string;
      duration?: number;
      error?: Error;
      additionalContext?: Record<string, any>;
    }
  ): void {
    const log: AppLog = {
      id: this.generateId(),
      level,
      timestamp: new Date().toISOString(),
      message,
      context: context?.additionalContext ? this.sanitizeData(context.additionalContext) : undefined,
      userId: context?.userId,
      sessionId: context?.sessionId,
      component: context?.component,
      action: context?.action,
      duration: context?.duration,
      error: context?.error ? {
        name: context.error.name,
        message: context.error.message,
        stack: process.env.NODE_ENV === 'development' ? context.error.stack : undefined
      } : undefined
    };

    this.logs.push(log);
    
    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = this.getConsoleMethod(level);
      logMethod(`[${level.toUpperCase()}] ${message}`, context);
    }
  }

  // Convenience methods
  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: any): void {
    this.log(LogLevel.ERROR, message, context);
  }

  critical(message: string, context?: any): void {
    this.log(LogLevel.CRITICAL, message, context);
  }

  // Get severity from risk score
  private getSeverityFromRiskScore(riskScore: number): ErrorSeverity {
    if (riskScore >= 80) return ErrorSeverity.CRITICAL;
    if (riskScore >= 60) return ErrorSeverity.HIGH;
    if (riskScore >= 40) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  // Get console method for log level
  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return () => {};
      case LogLevel.INFO:
        return () => {};
      case LogLevel.WARN:
        return () => {};
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        return () => {};
      default:
        return () => {};
    }
  }

  // Send to monitoring service (placeholder)
  private async sendToMonitoringService(event: SecurityEvent): Promise<void> {
    try {
      // In a real application, send to your monitoring service
      // Example: await fetch('/api/monitoring/security-event', { ... });

    } catch (error) {

    }
  }

  // Alert for high-risk events
  private alertHighRiskEvent(event: SecurityEvent): void {
    // In a real application, send alerts via email, SMS, Slack, etc.
    // High-risk security event detected and logged
  }

  // Get recent security events
  getSecurityEvents(limit = 50): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  // Get recent logs
  getLogs(limit = 100): AppLog[] {
    return this.logs.slice(-limit);
  }

  // Get high-risk events
  getHighRiskEvents(minRiskScore = 70): SecurityEvent[] {
    return this.securityEvents.filter(event => event.riskScore >= minRiskScore);
  }

  // Clear logs (for testing)
  clearLogs(): void {
    this.logs = [];
    this.securityEvents = [];
  }

  // Export logs for analysis
  exportLogs(): { logs: AppLog[]; securityEvents: SecurityEvent[] } {
    return {
      logs: [...this.logs],
      securityEvents: [...this.securityEvents]
    };
  }
}

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance();

// Export helper functions
export function logSecurityEvent(
  type: SecurityEventType,
  message: string,
  context?: Parameters<typeof securityLogger.logSecurityEvent>[2]
): void {
  securityLogger.logSecurityEvent(type, message, context);
}

export function logError(error: Error, context?: any): void {
  securityLogger.error(error.message, { error, ...context });
}

export function logInfo(message: string, context?: any): void {
  securityLogger.info(message, context);
}

export function logWarn(message: string, context?: any): void {
  securityLogger.warn(message, context);
}

export function logDebug(message: string, context?: any): void {
  securityLogger.debug(message, context);
}

export default securityLogger;