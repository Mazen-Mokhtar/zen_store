'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { securityManager } from '../../lib/security';
import { logger } from '../../lib/utils';

interface CSRFProtectionProps {
  children: React.ReactElement;
  onTokenGenerated?: (token: string) => void;
  onTokenValidated?: (isValid: boolean) => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}

const CSRFProtection: React.FC<CSRFProtectionProps> = ({
  children,
  onTokenGenerated,
  onTokenValidated,
  autoRefresh = true,
  refreshInterval = 30 // 30 minutes default
}) => {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false);
  const [tokenGeneratedAt, setTokenGeneratedAt] = useState<number>(0);

  // Generate new CSRF token
  const generateToken = useCallback(async () => {
    try {
      const token = securityManager.getCSRFToken();
      setCsrfToken(token);
      setTokenGeneratedAt(Date.now());
      setIsTokenValid(true);
      
      // Store token in session storage for validation
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('csrf_token', token);
        sessionStorage.setItem('csrf_generated_at', Date.now().toString());
      }
      
      logger.info('CSRF token generated successfully');
      
      if (onTokenGenerated) {
        onTokenGenerated(token);
      }
      
      return token;
    } catch (error) {
      logger.error('Failed to generate CSRF token:', error);
      setIsTokenValid(false);
      return null;
    }
  }, [onTokenGenerated]);

  // Validate existing token
  const validateToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const isValid = token.length === 64 && /^[a-f0-9]+$/i.test(token);
      setIsTokenValid(isValid);
      
      if (onTokenValidated) {
        onTokenValidated(isValid);
      }
      
      if (!isValid) {
        logger.warn('CSRF token validation failed');
        // Generate new token if validation fails
        await generateToken();
      }
      
      return isValid;
    } catch (error) {
      logger.error('CSRF token validation error:', error);
      setIsTokenValid(false);
      return false;
    }
  }, [onTokenValidated, generateToken]);

  // Check if token needs refresh
  const shouldRefreshToken = useCallback((): boolean => {
    if (!tokenGeneratedAt || !autoRefresh) return false;
    
    const now = Date.now();
    const tokenAge = now - tokenGeneratedAt;
    const maxAge = refreshInterval * 60 * 1000; // Convert minutes to milliseconds
    
    return tokenAge > maxAge;
  }, [tokenGeneratedAt, autoRefresh, refreshInterval]);

  // Initialize token on component mount
  useEffect(() => {
    const initializeToken = async () => {
      // Check if token exists in session storage
      if (typeof window !== 'undefined') {
        const existingToken = sessionStorage.getItem('csrf_token');
        const generatedAt = sessionStorage.getItem('csrf_generated_at');
        
        if (existingToken && generatedAt) {
          const tokenAge = Date.now() - parseInt(generatedAt);
          const maxAge = refreshInterval * 60 * 1000;
          
          if (tokenAge < maxAge) {
            // Token is still valid, use it
            setCsrfToken(existingToken);
            setTokenGeneratedAt(parseInt(generatedAt));
            await validateToken(existingToken);
            return;
          }
        }
      }
      
      // Generate new token if none exists or expired
      await generateToken();
    };
    
    initializeToken();
  }, [generateToken, validateToken, refreshInterval]);

  // Auto-refresh token
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(async () => {
      if (shouldRefreshToken()) {
        logger.info('Auto-refreshing CSRF token');
        await generateToken();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [autoRefresh, shouldRefreshToken, generateToken]);

  // Handle form submission with CSRF protection
  const handleFormSubmit = (originalHandler?: (event: React.FormEvent) => void) => {
    return async (event: React.FormEvent) => {
      event.preventDefault();
      
      // Validate token before submission
      if (!csrfToken || !isTokenValid) {
        logger.error('CSRF token missing or invalid');
        
        // Log security event
        logger.warn('CSRF token missing or invalid', {
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        });
        
        // Try to generate new token
        const newToken = await generateToken();
        if (!newToken) {
          alert('Security error: Unable to generate CSRF token. Please refresh the page.');
          return;
        }
      }
      
      // Add CSRF token to form data
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      
      // Remove existing CSRF token if present
      formData.delete('csrf_token');
      formData.delete('_token');
      
      // Add current CSRF token
      formData.append('csrf_token', csrfToken);
      
      // Create new event with updated form data
      const newEvent = {
        ...event,
        preventDefault: event.preventDefault.bind(event),
        stopPropagation: event.stopPropagation.bind(event),
        target: {
          ...form,
          // Override form data access
          elements: form.elements,
          checkValidity: form.checkValidity.bind(form),
          reportValidity: form.reportValidity.bind(form)
        }
      };
      
      // Log security event for successful CSRF protection
      logger.info('Form submitted with CSRF protection', {
        tokenLength: csrfToken.length,
        formAction: form.action || 'unknown'
      });
      
      // Call original handler
      if (originalHandler) {
        originalHandler(newEvent as React.FormEvent);
      }
    };
  };

  // Clone form element and add CSRF protection
  const clonedChild = React.cloneElement(children, {
    onSubmit: handleFormSubmit(children.props.onSubmit),
    // Add hidden CSRF token input if form doesn't have one
    children: [
      // Original form children
      ...(Array.isArray(children.props.children) ? children.props.children : [children.props.children]),
      // Hidden CSRF token input
      <input
        key="csrf-token"
        type="hidden"
        name="csrf_token"
        value={csrfToken}
        readOnly
      />,
      // Additional security metadata
      <input
        key="csrf-timestamp"
        type="hidden"
        name="_timestamp"
        value={tokenGeneratedAt.toString()}
        readOnly
      />
    ].filter(Boolean)
  });

  return clonedChild;
};

export default CSRFProtection;

// Hook for manual CSRF token management
export const useCSRFToken = () => {
  const [token, setToken] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);

  const generateToken = useCallback((): string => {
    const newToken = securityManager.getCSRFToken();
    setToken(newToken);
    setIsValid(true);
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('csrf_token', newToken);
      sessionStorage.setItem('csrf_generated_at', Date.now().toString());
    }
    
    return newToken;
  }, []);

  const validateToken = useCallback((tokenToValidate: string): boolean => {
    // Simple CSRF token validation - check if it's a valid hex string of correct length
    const valid = tokenToValidate.length === 64 && /^[a-f0-9]+$/i.test(tokenToValidate);
    setIsValid(valid);
    return valid;
  }, []);

  const getTokenHeader = useCallback((): { [key: string]: string } => {
    return {
      'X-CSRF-Token': token,
      'X-Requested-With': 'XMLHttpRequest'
    };
  }, [token]);

  useEffect(() => {
    // Initialize token on mount
    if (typeof window !== 'undefined') {
      const existingToken = sessionStorage.getItem('csrf_token');
      if (existingToken && existingToken.length === 64 && /^[a-f0-9]+$/i.test(existingToken)) {
        setToken(existingToken);
        setIsValid(true);
      } else {
        generateToken();
      }
    }
  }, [generateToken]);

  return {
    token,
    isValid,
    generateToken,
    validateToken,
    getTokenHeader
  };
};

// Higher-order component for CSRF protection
export const withCSRFProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const CSRFProtectedComponent = (props: P) => {
    const { token, getTokenHeader } = useCSRFToken();

    const enhancedProps = {
      ...props,
      csrfToken: token,
      csrfHeaders: getTokenHeader()
    } as P & { csrfToken: string; csrfHeaders: { [key: string]: string } };

    return <WrappedComponent {...enhancedProps} />;
  };

  CSRFProtectedComponent.displayName = `withCSRFProtection(${WrappedComponent.displayName || WrappedComponent.name})`;

  return CSRFProtectedComponent;
};