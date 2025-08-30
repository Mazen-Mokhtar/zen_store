'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { securityManager } from '../../lib/security';
import { rateLimiter, generateRateLimitKey } from '../../lib/rateLimiter';
import { securityMonitor } from '../../lib/securityMonitor';
import { memoryOptimizer } from '../../lib/memory-optimization';
import { logger } from '../../lib/utils';

// Security context types
interface SecurityState {
  csrfToken: string;
  isCSRFValid: boolean;
  rateLimitStatus: {
    remaining: number;
    resetTime: number;
    isBlocked: boolean;
    retryAfter?: number;
  };
  securityAlerts: SecurityAlert[];
  inputSanitization: {
    enabled: boolean;
    context: 'html' | 'attribute' | 'url' | 'css' | 'js' | 'database' | 'filename' | 'phone';
  };
  sessionSecurity: {
    isValid: boolean;
    expiresAt: number;
    lastActivity: number;
  };
}

interface SecurityAlert {
  id: string;
  type: 'csrf' | 'xss' | 'injection' | 'ratelimit' | 'session' | 'suspicious';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  metadata?: Record<string, any>;
}

interface SecurityActions {
  generateCSRFToken: () => Promise<string>;
  validateCSRFToken: (token: string) => boolean;
  sanitizeInput: (input: string, context?: string) => string;
  checkRateLimit: (endpoint: string) => Promise<boolean>;
  reportSecurityEvent: (type: string, data: any) => void;
  resolveAlert: (alertId: string) => void;
  clearResolvedAlerts: () => void;
  refreshSession: () => Promise<boolean>;
}

interface SecurityContextType {
  state: SecurityState;
  actions: SecurityActions;
}

// Security context
const SecurityContext = createContext<SecurityContextType | null>(null);

// Security provider props
interface UnifiedSecurityProviderProps {
  children: React.ReactNode;
  config?: {
    csrfAutoRefresh?: boolean;
    csrfRefreshInterval?: number;
    rateLimitMonitoring?: boolean;
    inputSanitizationEnabled?: boolean;
    sessionMonitoring?: boolean;
    alertsEnabled?: boolean;
    maxAlerts?: number;
  };
}

// Security provider component
export const UnifiedSecurityProvider: React.FC<UnifiedSecurityProviderProps> = ({
  children,
  config = {}
}) => {
  const {
    csrfAutoRefresh = true,
    csrfRefreshInterval = 30,
    rateLimitMonitoring = true,
    inputSanitizationEnabled = true,
    sessionMonitoring = true,
    alertsEnabled = true,
    maxAlerts = 50
  } = config || {};

  // Security state
  const [securityState, setSecurityState] = useState<SecurityState>({
    csrfToken: '',
    isCSRFValid: false,
    rateLimitStatus: {
      remaining: 100,
      resetTime: Date.now() + 3600000,
      isBlocked: false
    },
    securityAlerts: [],
    inputSanitization: {
      enabled: inputSanitizationEnabled,
      context: 'html'
    },
    sessionSecurity: {
      isValid: false,
      expiresAt: 0,
      lastActivity: Date.now()
    }
  });

  // Add security alert
  const addAlert = useCallback((alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>) => {
    if (!alertsEnabled) return;

    const newAlert: SecurityAlert = {
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      resolved: false
    };

    setSecurityState(prev => {
      const updatedAlerts = [newAlert, ...prev.securityAlerts];
      
      // Keep only the most recent alerts
      if (updatedAlerts.length > maxAlerts) {
        updatedAlerts.splice(maxAlerts);
      }

      return {
        ...prev,
        securityAlerts: updatedAlerts
      };
    });

    // Log critical alerts
    if (alert.severity === 'critical') {
      logger.error('Critical security alert:', alert.message, alert.metadata);
    }
  }, [alertsEnabled, maxAlerts]);

  // Generate CSRF token
  const generateCSRFToken = useCallback(async (): Promise<string> => {
    try {
      const token = securityManager.getCSRFToken();
      
      setSecurityState(prev => ({
        ...prev,
        csrfToken: token,
        isCSRFValid: true
      }));

      // Store in session storage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('csrf_token', token);
        sessionStorage.setItem('csrf_generated_at', Date.now().toString());
      }

      logger.info('CSRF token generated successfully');
      return token;
    } catch (error) {
      logger.error('Failed to generate CSRF token:', error);
      
      addAlert({
        type: 'csrf',
        severity: 'high',
        message: 'Failed to generate CSRF token',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      return '';
    }
  }, [addAlert]);

  // Validate CSRF token
  const validateCSRFToken = useCallback((token: string): boolean => {
    try {
      // Simple CSRF token validation - check if it's a valid hex string of correct length
      const isValid = token.length === 64 && /^[a-f0-9]+$/i.test(token);
      
      setSecurityState(prev => ({
        ...prev,
        isCSRFValid: isValid
      }));

      if (!isValid) {
        addAlert({
          type: 'csrf',
          severity: 'medium',
          message: 'Invalid CSRF token detected',
          metadata: { tokenLength: token.length }
        });
      }

      return isValid;
    } catch (error) {
      logger.error('CSRF token validation error:', error);
      return false;
    }
  }, [addAlert]);

  // Sanitize input
  const sanitizeInput = useCallback((input: string, context?: string): string => {
    if (!securityState.inputSanitization.enabled) {
      return input;
    }

    try {
      const sanitizationContext = context || securityState.inputSanitization.context;
      let sanitized: string;

      switch (sanitizationContext) {
        case 'database':
          sanitized = securityManager.sanitizeForDatabase(input);
          break;
        case 'filename':
          sanitized = securityManager.sanitizeFileName(input);
          break;
        case 'phone':
          sanitized = securityManager.sanitizePhoneNumber(input);
          break;
        default:
          sanitized = securityManager.sanitizeForContext(input, sanitizationContext as any);
      }

      // Check if sanitization changed the input
      if (sanitized !== input) {
        const suspiciousPatterns = [
          /<script/i,
          /javascript:/i,
          /on\w+\s*=/i,
          /union.*select/i,
          /drop.*table/i
        ];

        const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(input));
        
        if (isSuspicious) {
          addAlert({
            type: 'xss',
            severity: 'high',
            message: 'Suspicious input detected and sanitized',
            metadata: {
              original: input.substring(0, 100),
              sanitized: sanitized.substring(0, 100),
              context: sanitizationContext
            }
          });
        }
      }

      return sanitized;
    } catch (error) {
      logger.error('Input sanitization error:', error);
      return '';
    }
  }, [securityState.inputSanitization, addAlert]);

  // Check rate limit
  const checkRateLimit = useCallback(async (endpoint: string): Promise<boolean> => {
    if (!rateLimitMonitoring) return true;

    try {
      const ip = 'client'; // Client-side rate limiting
      const key = generateRateLimitKey.byIP(ip, endpoint);
      const result = rateLimiter.checkLimit(key, { maxRequests: 100, windowMs: 3600000 });

      setSecurityState(prev => ({
        ...prev,
        rateLimitStatus: {
          remaining: result.remaining,
          resetTime: result.resetTime,
          isBlocked: !result.allowed,
          retryAfter: result.retryAfter
        }
      }));

      if (!result.allowed) {
        addAlert({
          type: 'ratelimit',
          severity: 'medium',
          message: `Rate limit exceeded for ${endpoint}`,
          metadata: {
            endpoint,
            remaining: result.remaining,
            retryAfter: result.retryAfter
          }
        });
      }

      return result.allowed;
    } catch (error) {
      logger.error('Rate limit check error:', error);
      return true;
    }
  }, [rateLimitMonitoring, addAlert]);

  // Report security event
  const reportSecurityEvent = useCallback((type: string, data: any) => {
    try {
      securityMonitor.recordActivity({
        ipAddress: 'client',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        method: 'CLIENT',
        timestamp: new Date(),
        headers: {},
        body: data
      });

      logger.info('Security event reported:', { type, data });
    } catch (error) {
      logger.error('Failed to report security event:', error);
    }
  }, []);

  // Resolve alert
  const resolveAlert = useCallback((alertId: string) => {
    setSecurityState(prev => ({
      ...prev,
      securityAlerts: prev.securityAlerts.map(alert =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    }));
  }, []);

  // Clear resolved alerts
  const clearResolvedAlerts = useCallback(() => {
    setSecurityState(prev => ({
      ...prev,
      securityAlerts: prev.securityAlerts.filter(alert => !alert.resolved)
    }));
  }, []);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!sessionMonitoring) return true;

    try {
      // Check session validity
      const sessionData = typeof window !== 'undefined' ? 
        sessionStorage.getItem('session_data') : null;
      
      if (!sessionData) {
        setSecurityState(prev => ({
          ...prev,
          sessionSecurity: {
            isValid: false,
            expiresAt: 0,
            lastActivity: Date.now()
          }
        }));
        return false;
      }

      const session = JSON.parse(sessionData);
      const now = Date.now();
      const isValid = session.expiresAt > now;

      setSecurityState(prev => ({
        ...prev,
        sessionSecurity: {
          isValid,
          expiresAt: session.expiresAt,
          lastActivity: now
        }
      }));

      if (!isValid) {
        addAlert({
          type: 'session',
          severity: 'medium',
          message: 'Session expired',
          metadata: { expiresAt: session.expiresAt }
        });
      }

      return isValid;
    } catch (error) {
      logger.error('Session refresh error:', error);
      return false;
    }
  }, [sessionMonitoring, addAlert]);

  // Initialize security
  useEffect(() => {
    const initSecurity = async () => {
      // Generate initial CSRF token
      await generateCSRFToken();
      
      // Refresh session
      await refreshSession();
      
      // Set up CSRF auto-refresh
      if (csrfAutoRefresh) {
        const interval = memoryOptimizer.trackInterval(
          setInterval(() => {
            generateCSRFToken();
          }, csrfRefreshInterval * 60 * 1000)
        );
      }

      // Set up session monitoring
      if (sessionMonitoring) {
        const sessionInterval = memoryOptimizer.trackInterval(
          setInterval(() => {
            refreshSession();
          }, 60000) // Check every minute
        );
      }
    };

    initSecurity();
  }, [csrfAutoRefresh, csrfRefreshInterval, sessionMonitoring, generateCSRFToken, refreshSession]);

  // Security actions
  const actions: SecurityActions = useMemo(() => ({
    generateCSRFToken,
    validateCSRFToken,
    sanitizeInput,
    checkRateLimit,
    reportSecurityEvent,
    resolveAlert,
    clearResolvedAlerts,
    refreshSession
  }), [
    generateCSRFToken,
    validateCSRFToken,
    sanitizeInput,
    checkRateLimit,
    reportSecurityEvent,
    resolveAlert,
    clearResolvedAlerts,
    refreshSession
  ]);

  // Context value
  const contextValue: SecurityContextType = useMemo(() => ({
    state: securityState,
    actions
  }), [securityState, actions]);

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

// Hook to use security context
export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within UnifiedSecurityProvider');
  }
  return context;
};

// Security alert component
interface SecurityAlertsProps {
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHide?: boolean;
  hideDelay?: number;
}

export const SecurityAlerts: React.FC<SecurityAlertsProps> = ({
  maxVisible = 5,
  position = 'top-right',
  autoHide = true,
  hideDelay = 5000
}) => {
  const { state, actions } = useSecurity();
  const [hiddenAlerts, setHiddenAlerts] = useState<Set<string>>(new Set());

  const visibleAlerts = useMemo(() => {
    return state.securityAlerts
      .filter(alert => !alert.resolved && !hiddenAlerts.has(alert.id))
      .slice(0, maxVisible);
  }, [state.securityAlerts, hiddenAlerts, maxVisible]);

  // Auto-hide alerts
  useEffect(() => {
    if (!autoHide) return;

    visibleAlerts.forEach(alert => {
      const timer = setTimeout(() => {
        setHiddenAlerts(prev => new Set(Array.from(prev).concat(alert.id)));
      }, hideDelay);

      memoryOptimizer.trackTimeout(timer);
    });
  }, [visibleAlerts, autoHide, hideDelay]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const severityClasses = {
    low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
    high: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
    critical: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
  };

  if (visibleAlerts.length === 0) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-2 max-w-sm`}>
      {visibleAlerts.map(alert => (
        <div
          key={alert.id}
          className={`p-3 rounded-lg border shadow-lg ${severityClasses[alert.severity]}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase">
                  {alert.type}
                </span>
                <span className="text-xs opacity-70">
                  {alert.severity}
                </span>
              </div>
              <p className="text-sm mt-1">{alert.message}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => actions.resolveAlert(alert.id)}
              className="ml-2 text-sm opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
      
      {state.securityAlerts.filter(a => a.resolved).length > 0 && (
        <button
          onClick={actions.clearResolvedAlerts}
          className="w-full text-xs text-center py-1 opacity-70 hover:opacity-100"
        >
          Clear Resolved ({state.securityAlerts.filter(a => a.resolved).length})
        </button>
      )}
    </div>
  );
};

// HOC for automatic input sanitization
export const withSecuritySanitization = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const SecuritySanitizedComponent = (props: P) => {
    const { actions } = useSecurity();

    const sanitizedProps = useMemo(() => {
      const newProps = { ...props };
      
      // Sanitize string props
      Object.keys(newProps).forEach(key => {
        const value = (newProps as any)[key];
        if (typeof value === 'string') {
          (newProps as any)[key] = actions.sanitizeInput(value);
        }
      });

      return newProps;
    }, [props, actions]);

    return <WrappedComponent {...sanitizedProps} />;
  };

  SecuritySanitizedComponent.displayName = `withSecuritySanitization(${WrappedComponent.displayName || WrappedComponent.name})`;

  return SecuritySanitizedComponent;
};

export default UnifiedSecurityProvider;