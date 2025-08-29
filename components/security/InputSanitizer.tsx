'use client';

import React, { useState, useEffect } from 'react';
import { securityManager } from '../../lib/security';
import { logger } from '../../lib/utils';

interface InputSanitizerProps {
  children: React.ReactElement;
  context?: 'html' | 'attribute' | 'url' | 'css' | 'js' | 'database' | 'filename' | 'phone';
  onSanitized?: (originalValue: string, sanitizedValue: string) => void;
  enableRealTimeValidation?: boolean;
  maxLength?: number;
}

const InputSanitizer: React.FC<InputSanitizerProps> = ({
  children,
  context = 'html',
  onSanitized,
  enableRealTimeValidation = true,
  maxLength
}) => {
  const [lastSanitizedValue, setLastSanitizedValue] = useState<string>('');

  const sanitizeValue = (value: string): string => {
    if (!value || typeof value !== 'string') {
      return '';
    }

    let sanitized: string;

    switch (context) {
      case 'database':
        sanitized = securityManager.sanitizeForDatabase(value);
        break;
      case 'filename':
        sanitized = securityManager.sanitizeFileName(value);
        break;
      case 'phone':
        sanitized = securityManager.sanitizePhoneNumber(value);
        break;
      case 'html':
      case 'attribute':
      case 'url':
      case 'css':
      case 'js':
        sanitized = securityManager.sanitizeForContext(value, context);
        break;
      default:
        sanitized = securityManager.sanitizeInput(value);
    }

    // Apply max length if specified
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // Log security events if sanitization changed the value
    if (sanitized !== value) {
      logger.warn('Input sanitized', {
        context,
        original: value.substring(0, 100), // Log first 100 chars only
        sanitized: sanitized.substring(0, 100),
        removed: value.length - sanitized.length
      });

      // Log potential security threat
      if (value.includes('<script') || value.includes('javascript:') || value.includes('on')) {
        logger.warn('Suspicious input detected', {
          context,
          suspiciousContent: value.substring(0, 200),
          url: typeof window !== 'undefined' ? window.location.href : 'unknown'
        });
      }
    }

    return sanitized;
  };

  const handleInputChange = (originalHandler: (event: any) => void) => {
    return (event: any) => {
      const originalValue = event.target.value;
      const sanitizedValue = sanitizeValue(originalValue);

      // Update the event with sanitized value
      if (sanitizedValue !== originalValue) {
        event.target.value = sanitizedValue;
        setLastSanitizedValue(sanitizedValue);
        
        if (onSanitized) {
          onSanitized(originalValue, sanitizedValue);
        }
      }

      // Call original handler with sanitized event
      if (originalHandler) {
        originalHandler(event);
      }
    };
  };

  const handleInputBlur = (originalHandler?: (event: any) => void) => {
    return (event: any) => {
      // Final sanitization on blur
      const originalValue = event.target.value;
      const sanitizedValue = sanitizeValue(originalValue);

      if (sanitizedValue !== originalValue) {
        event.target.value = sanitizedValue;
        setLastSanitizedValue(sanitizedValue);
        
        if (onSanitized) {
          onSanitized(originalValue, sanitizedValue);
        }
      }

      if (originalHandler) {
        originalHandler(event);
      }
    };
  };

  // Clone the child element and add sanitization handlers
  const clonedChild = React.cloneElement(children, {
    onChange: handleInputChange(children.props.onChange),
    onBlur: handleInputBlur(children.props.onBlur),
    onPaste: (event: ClipboardEvent) => {
      // Sanitize pasted content
      setTimeout(() => {
        const target = event.target as HTMLInputElement;
        if (target && target.value) {
          const sanitizedValue = sanitizeValue(target.value);
          if (sanitizedValue !== target.value) {
            target.value = sanitizedValue;
            if (onSanitized) {
              onSanitized(target.value, sanitizedValue);
            }
          }
        }
      }, 0);
      
      if (children.props.onPaste) {
        children.props.onPaste(event);
      }
    },
    // Add security attributes
    autoComplete: children.props.autoComplete || 'off',
    spellCheck: children.props.spellCheck !== undefined ? children.props.spellCheck : false,
    // Add max length if not already specified
    maxLength: children.props.maxLength || maxLength || (context === 'phone' ? 15 : undefined)
  });

  return clonedChild;
};

export default InputSanitizer;

// Hook for manual sanitization
export const useSanitizer = (context: InputSanitizerProps['context'] = 'html') => {
  const sanitize = (value: string): string => {
    switch (context) {
      case 'database':
        return securityManager.sanitizeForDatabase(value);
      case 'filename':
        return securityManager.sanitizeFileName(value);
      case 'phone':
        return securityManager.sanitizePhoneNumber(value);
      case 'html':
      case 'attribute':
      case 'url':
      case 'css':
      case 'js':
        return securityManager.sanitizeForContext(value, context);
      default:
        return securityManager.sanitizeInput(value);
    }
  };

  return { sanitize };
};

// Validation hook
export const useInputValidation = () => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateInput = (name: string, value: string, rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  }): boolean => {
    const newErrors = { ...errors };

    // Required validation
    if (rules.required && (!value || value.trim() === '')) {
      newErrors[name] = 'هذا الحقل مطلوب';
      setErrors(newErrors);
      return false;
    }

    // Length validations
    if (rules.minLength && value.length < rules.minLength) {
      newErrors[name] = `يجب أن يكون الحد الأدنى ${rules.minLength} أحرف`;
      setErrors(newErrors);
      return false;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      newErrors[name] = `يجب أن يكون الحد الأقصى ${rules.maxLength} أحرف`;
      setErrors(newErrors);
      return false;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      newErrors[name] = 'تنسيق غير صحيح';
      setErrors(newErrors);
      return false;
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        newErrors[name] = customError;
        setErrors(newErrors);
        return false;
      }
    }

    // Clear error if validation passes
    delete newErrors[name];
    setErrors(newErrors);
    return true;
  };

  const clearErrors = () => setErrors({});
  const clearError = (name: string) => {
    const newErrors = { ...errors };
    delete newErrors[name];
    setErrors(newErrors);
  };

  return {
    errors,
    validateInput,
    clearErrors,
    clearError,
    hasErrors: Object.keys(errors).length > 0
  };
};