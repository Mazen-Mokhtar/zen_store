'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import React from 'react';
import { memoryOptimizer } from './memory-optimization';
import { logger } from './utils';

// Optimized version of useAuth hook to prevent unnecessary re-renders
export function useOptimizedAuth() {
  const [authState, setAuthState] = useState(() => {
    if (typeof window === 'undefined') return { user: null, token: null, isAuthenticated: false };
    
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      return {
        user: user ? JSON.parse(user) : null,
        token,
        isAuthenticated: !!token
      };
    } catch {
      return { user: null, token: null, isAuthenticated: false };
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const lastUpdateRef = useRef(0);
  const THROTTLE_DELAY = 1000; // 1 second throttle
  
  // Throttled auth state update
  const updateAuthState = useCallback(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_DELAY) return;
    
    lastUpdateRef.current = now;
    
    if (typeof window === 'undefined') return;
    
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const newState = {
        user: user ? JSON.parse(user) : null,
        token,
        isAuthenticated: !!token
      };
      
      // Only update if state actually changed
      setAuthState(prevState => {
        if (JSON.stringify(prevState) !== JSON.stringify(newState)) {
          return newState;
        }
        return prevState;
      });
    } catch (error) {
      logger.error('Error updating auth state:', error);
    }
  }, []);
  
  // Use optimized interval instead of regular setInterval
  useEffect(() => {
    updateAuthState();
    
    const interval = memoryOptimizer.trackInterval(
      setInterval(updateAuthState, 5000) // Check every 5 seconds instead of 1 second
    );
    
    return () => memoryOptimizer.clearTrackedInterval(interval);
  }, [updateAuthState]);
  
  // Memoized login function
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        updateAuthState();
        return { success: true, data };
      }
      
      return { success: false, error: data.message };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  }, [updateAuthState]);
  
  // Memoized logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({ user: null, token: null, isAuthenticated: false });
  }, []);
  
  // Memoized computed values
  const computedValues = useMemo(() => ({
    isAdmin: authState.user?.role === 'admin' || authState.user?.role === 'superAdmin',
    hasRole: (role: string) => authState.user?.role === role || authState.user?.role === 'admin' || authState.user?.role === 'superAdmin'
  }), [authState.user?.role]);
  
  return {
    ...authState,
    isLoading,
    ...computedValues,
    login,
    logout
  };
}

// Optimized rate limit hook with better memory management
interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  isBlocked: boolean;
  retryAfter?: number;
}

export function useOptimizedRateLimit(endpoint: string = 'general') {
  const { user } = useOptimizedAuth();
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const lastCheckRef = useRef(0);
  const CHECK_THROTTLE = 5000; // 5 seconds
  
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    if (now - lastCheckRef.current < CHECK_THROTTLE) return;
    
    lastCheckRef.current = now;
    
    try {
      // Simulate rate limit check (replace with actual implementation)
      const remaining = Math.floor(Math.random() * 100);
      const resetTime = Date.now() + 60000;
      const isBlocked = remaining < 10;
      
      setRateLimitInfo({
        remaining,
        resetTime,
        isBlocked,
        retryAfter: isBlocked ? 60 : undefined
      });
    } catch (error) {
      logger.error('Error checking rate limit:', error);
    }
  }, [user, endpoint]);
  
  // Use optimized interval
  useEffect(() => {
    checkRateLimit();
    
    const interval = memoryOptimizer.trackInterval(
      setInterval(checkRateLimit, 30000) // Check every 30 seconds
    );
    
    return () => memoryOptimizer.clearTrackedInterval(interval);
  }, [checkRateLimit]);
  
  return {
    rateLimitInfo,
    checkRateLimit,
    isBlocked: rateLimitInfo?.isBlocked || false,
    remaining: rateLimitInfo?.remaining || 100
  };
}

// Optimized notification hook
interface Notification {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function useOptimizedNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationTimeouts = useRef(new Map<string, NodeJS.Timeout>());
  
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove with tracked timeout
    if (notification.duration !== 0) {
      const timeout = memoryOptimizer.trackTimeout(
        setTimeout(() => {
          removeNotification(id);
        }, notification.duration || 5000)
      );
      notificationTimeouts.current.set(id, timeout);
    }
    
    return id;
  }, []);
  
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // Clear associated timeout
    const timeout = notificationTimeouts.current.get(id);
    if (timeout) {
      memoryOptimizer.clearTrackedTimeout(timeout);
      notificationTimeouts.current.delete(id);
    }
  }, []);
  
  const clearAll = useCallback(() => {
    // Clear all timeouts
    notificationTimeouts.current.forEach(timeout => {
      memoryOptimizer.clearTrackedTimeout(timeout);
    });
    notificationTimeouts.current.clear();
    
    setNotifications([]);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      notificationTimeouts.current.forEach(timeout => {
        memoryOptimizer.clearTrackedTimeout(timeout);
      });
      notificationTimeouts.current.clear();
    };
  }, []);
  
  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
}

// Optimized session manager hook
interface SessionInfo {
  expiresAt: number;
  timeUntilExpiry: number;
  isExpiring: boolean;
}

export function useOptimizedSession() {
  const { user, logout } = useOptimizedAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(0);
  const warningShownRef = useRef(false);
  
  const checkSession = useCallback(() => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Decode token to get expiry (simplified)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeLeft = expiryTime - currentTime;
      
      setTimeUntilExpiry(timeLeft);
      
      // Show warning 5 minutes before expiry
      const WARNING_TIME = 5 * 60 * 1000;
      if (timeLeft <= WARNING_TIME && timeLeft > 0 && !warningShownRef.current) {
        setShowWarning(true);
        warningShownRef.current = true;
      }
      
      // Auto logout when expired
      if (timeLeft <= 0) {
        logout();
      }
      
      setSessionInfo({
        expiresAt: expiryTime,
        timeUntilExpiry: timeLeft,
        isExpiring: timeLeft <= WARNING_TIME
      });
    } catch (error) {
      logger.error('Error checking session:', error);
    }
  }, [user, logout]);
  
  // Use optimized interval
  useEffect(() => {
    if (user) {
      checkSession();
      
      const interval = memoryOptimizer.trackInterval(
        setInterval(checkSession, 60000) // Check every minute
      );
      
      return () => memoryOptimizer.clearTrackedInterval(interval);
    }
  }, [user, checkSession]);
  
  const extendSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setShowWarning(false);
        warningShownRef.current = false;
        checkSession();
      }
    } catch (error) {
      logger.error('Error extending session:', error);
    }
  }, [checkSession]);
  
  return {
    sessionInfo,
    showWarning,
    timeUntilExpiry,
    extendSession,
    dismissWarning: () => setShowWarning(false)
  };
}

// Optimized API hook with caching
export function useOptimizedApi<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!url) return;
    
    // Check cache first
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    const cached = cacheRef.current.get(cacheKey);
    
    if (cached && !forceRefresh && Date.now() - cached.timestamp < 300000) { // 5 minutes cache
      setData(cached.data);
      return;
    }
    
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = memoryOptimizer.trackAbortController(new AbortController());
    abortControllerRef.current = controller;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!controller.signal.aborted) {
        setData(result);
        // Cache the result
        cacheRef.current.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        logger.error('API fetch error:', error);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [url, options]);
  
  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);
  
  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    clearCache: () => cacheRef.current.clear()
  };
}

// Optimized form hook
export function useOptimizedForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);
  
  const setFieldTouched = useCallback((name: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);
  
  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);
  
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);
  
  const handleSubmit = useCallback((onSubmit: (values: T) => Promise<void> | void) => {
    return async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        logger.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [values]);
  
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setFieldTouched,
    setFieldError,
    reset,
    handleSubmit
  };
}

// Export all optimized hooks
export {
  useOptimizedAuth as useAuth,
  useOptimizedRateLimit as useRateLimit,
  useOptimizedNotifications as useNotifications,
  useOptimizedSession as useSession,
  useOptimizedApi as useApi,
  useOptimizedForm as useForm
};