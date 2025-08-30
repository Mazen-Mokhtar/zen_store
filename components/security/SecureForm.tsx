'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSecurity } from './UnifiedSecurityProvider';
import { logger } from '../../lib/utils';
import { memoryOptimizer } from '../../lib/memory-optimization';

interface SecureFormProps {
  children: React.ReactNode;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>, formData: FormData) => void | Promise<void>;
  action?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  encType?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
  autoComplete?: 'on' | 'off';
  noValidate?: boolean;
  className?: string;
  id?: string;
  sanitizeInputs?: boolean;
  validateCSRF?: boolean;
  rateLimitCheck?: boolean;
  maxFileSize?: number; // in bytes
  allowedFileTypes?: string[];
  onSecurityEvent?: (event: SecurityFormEvent) => void;
}

interface SecurityFormEvent {
  type: 'csrf_invalid' | 'input_sanitized' | 'file_rejected' | 'rate_limited' | 'suspicious_activity';
  message: string;
  data?: any;
}

interface FormValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData: Record<string, any>;
}

export const SecureForm: React.FC<SecureFormProps> = ({
  children,
  onSubmit,
  action,
  method = 'POST',
  encType = 'application/x-www-form-urlencoded',
  autoComplete = 'off',
  noValidate = false,
  className = '',
  id,
  sanitizeInputs = true,
  validateCSRF = true,
  rateLimitCheck = true,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
  onSecurityEvent
}) => {
  const { state, actions } = useSecurity();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  // Security event handler
  const handleSecurityEvent = useCallback((event: SecurityFormEvent) => {
    logger.warn('Form security event:', event);
    
    // Report to security monitoring
    actions.reportSecurityEvent(event.type, {
      formId: id,
      formAction: action,
      ...event.data
    });

    // Call custom handler if provided
    if (onSecurityEvent) {
      onSecurityEvent(event);
    }
  }, [actions, id, action, onSecurityEvent]);

  // Validate form data
  const validateFormData = useCallback((formData: FormData): FormValidationResult => {
    const errors: string[] = [];
    const sanitizedData: Record<string, any> = {};

    // Check for duplicate submission (basic protection)
    const now = Date.now();
    if (now - lastSubmitTime < 1000) { // 1 second cooldown
      errors.push('Please wait before submitting again');
      handleSecurityEvent({
        type: 'suspicious_activity',
        message: 'Rapid form submission detected',
        data: { timeDiff: now - lastSubmitTime }
      });
    }

    // Validate and sanitize form inputs
    formData.forEach((value, key) => {
      if (key === 'csrf_token' || key === '_timestamp') {
        return; // Skip security tokens
      }

      if (value instanceof File) {
        // File validation
        if (value.size > maxFileSize) {
          errors.push(`File ${value.name} is too large (max ${maxFileSize / 1024 / 1024}MB)`);
          handleSecurityEvent({
            type: 'file_rejected',
            message: 'File size exceeded limit',
            data: { fileName: value.name, size: value.size, maxSize: maxFileSize }
          });
          return;
        }

        if (!allowedFileTypes.includes(value.type)) {
          errors.push(`File type ${value.type} is not allowed`);
          handleSecurityEvent({
            type: 'file_rejected',
            message: 'File type not allowed',
            data: { fileName: value.name, type: value.type, allowedTypes: allowedFileTypes }
          });
          return;
        }

        sanitizedData[key] = value;
      } else {
        // String input validation and sanitization
        const stringValue = value.toString();
        
        if (sanitizeInputs) {
          const sanitized = actions.sanitizeInput(stringValue);
          
          if (sanitized !== stringValue) {
            handleSecurityEvent({
              type: 'input_sanitized',
              message: 'Input was sanitized',
              data: {
                field: key,
                original: stringValue.substring(0, 100),
                sanitized: sanitized.substring(0, 100)
              }
            });
          }
          
          sanitizedData[key] = sanitized;
        } else {
          sanitizedData[key] = stringValue;
        }

        // Check for suspicious patterns
        const suspiciousPatterns = [
          /<script[^>]*>/i,
          /javascript:/i,
          /on\w+\s*=/i,
          /union.*select/i,
          /drop.*table/i,
          /insert.*into/i,
          /delete.*from/i
        ];

        const suspiciousPattern = suspiciousPatterns.find(pattern => pattern.test(stringValue));
        if (suspiciousPattern) {
          errors.push(`Suspicious content detected in ${key}`);
          handleSecurityEvent({
            type: 'suspicious_activity',
            message: 'Suspicious input pattern detected',
            data: {
              field: key,
              pattern: suspiciousPattern.toString(),
              value: stringValue.substring(0, 100)
            }
          });
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }, [lastSubmitTime, maxFileSize, allowedFileTypes, sanitizeInputs, actions, handleSecurityEvent]);

  // Handle form submission
  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (isSubmitting) {
      return; // Prevent double submission
    }

    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);

      // CSRF validation
      if (validateCSRF && method !== 'GET') {
        const csrfToken = formData.get('csrf_token') as string;
        
        if (!csrfToken || !actions.validateCSRFToken(csrfToken)) {
          const error = 'Invalid or missing CSRF token';
          setValidationErrors([error]);
          
          handleSecurityEvent({
            type: 'csrf_invalid',
            message: error,
            data: { hasToken: !!csrfToken, tokenLength: csrfToken?.length }
          });
          
          return;
        }
      }

      // Rate limit check
      if (rateLimitCheck) {
        const endpoint = action || window.location.pathname;
        const isAllowed = await actions.checkRateLimit(endpoint);
        
        if (!isAllowed) {
          const error = 'Rate limit exceeded. Please try again later.';
          setValidationErrors([error]);
          
          handleSecurityEvent({
            type: 'rate_limited',
            message: error,
            data: { endpoint, remaining: state.rateLimitStatus.remaining }
          });
          
          return;
        }
      }

      // Validate and sanitize form data
      const validation = validateFormData(formData);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Update last submit time
      setLastSubmitTime(Date.now());

      // Create sanitized FormData
      const sanitizedFormData = new FormData();
      Object.entries(validation.sanitizedData).forEach(([key, value]) => {
        if (value instanceof File) {
          sanitizedFormData.append(key, value);
        } else {
          sanitizedFormData.append(key, value.toString());
        }
      });

      // Add security tokens
      if (validateCSRF && method !== 'GET') {
        sanitizedFormData.append('csrf_token', state.csrfToken);
        sanitizedFormData.append('_timestamp', Date.now().toString());
      }

      // Call the onSubmit handler
      if (onSubmit) {
        await onSubmit(event, sanitizedFormData);
      } else if (action) {
        // Default form submission
        const response = await fetch(action, {
          method,
          body: encType === 'application/x-www-form-urlencoded' 
            ? new URLSearchParams(sanitizedFormData as any)
            : sanitizedFormData,
          headers: {
            ...(encType === 'application/x-www-form-urlencoded' && {
              'Content-Type': 'application/x-www-form-urlencoded'
            })
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      logger.info('Form submitted successfully', {
        formId: id,
        action,
        method,
        fieldsCount: Array.from(sanitizedFormData.keys()).length
      });

    } catch (error) {
      logger.error('Form submission error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setValidationErrors([errorMessage]);
      
      handleSecurityEvent({
        type: 'suspicious_activity',
        message: 'Form submission failed',
        data: { error: errorMessage }
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    validateCSRF,
    method,
    rateLimitCheck,
    actions,
    state.csrfToken,
    state.rateLimitStatus.remaining,
    validateFormData,
    onSubmit,
    action,
    encType,
    id,
    handleSecurityEvent
  ]);

  // Enhanced children with security features
  const enhancedChildren = useMemo(() => {
    const processChildren = (children: React.ReactNode): React.ReactNode => {
      return React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) {
          return child;
        }

        // Add security attributes to input elements
        if (child.type === 'input' || child.type === 'textarea' || child.type === 'select') {
          const props = child.props as any;
          
          return React.cloneElement(child, {
            ...props,
            // Add security attributes
            autoComplete: props.autoComplete || autoComplete,
            // Add input event handlers for real-time sanitization
            onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
              if (sanitizeInputs && event.target.value) {
                const sanitized = actions.sanitizeInput(event.target.value);
                if (sanitized !== event.target.value) {
                  event.target.value = sanitized;
                }
              }
              
              // Call original onChange if exists
              if (props.onChange) {
                props.onChange(event);
              }
            }
          });
        }

        // Recursively process children
        if (child.props && child.props.children) {
          return React.cloneElement(child, {
            ...child.props,
            children: processChildren(child.props.children)
          });
        }

        return child;
      });
    };

    return processChildren(children);
  }, [children, autoComplete, sanitizeInputs, actions]);

  return (
    <>
      <form
        id={id}
        action={action}
        method={method}
        encType={encType}
        autoComplete={autoComplete}
        noValidate={noValidate}
        className={className}
        onSubmit={handleSubmit}
      >
        {enhancedChildren}
        
        {/* Hidden security fields */}
        {validateCSRF && method !== 'GET' && (
          <>
            <input
              type="hidden"
              name="csrf_token"
              value={state.csrfToken}
              readOnly
            />
            <input
              type="hidden"
              name="_timestamp"
              value={Date.now().toString()}
              readOnly
            />
          </>
        )}
      </form>

      {/* Validation errors display */}
      {validationErrors.length > 0 && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md dark:bg-red-900 dark:border-red-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Security Validation Errors
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission status */}
      {isSubmitting && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-md dark:bg-blue-900 dark:border-blue-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Submitting form securely...
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SecureForm;