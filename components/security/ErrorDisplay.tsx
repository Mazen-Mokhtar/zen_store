'use client';

import React from 'react';
import { AppError, ErrorType, ErrorSeverity } from '../../lib/errorHandler';

interface ErrorDisplayProps {
  error?: AppError | Error | null;
  title?: string;
  message?: string;
  type?: 'error' | 'warning' | 'info';
  showRetry?: boolean;
  showDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title,
  message,
  type = 'error',
  showRetry = false,
  showDetails = false,
  onRetry,
  onDismiss,
  className = ''
}) => {
  // Don't render if no error and no custom message
  if (!error && !message) {
    return null;
  }

  const getErrorInfo = () => {
    if (error instanceof AppError) {
      return {
        title: title || getErrorTitle(error.type),
        message: message || error.message || 'An unexpected error occurred',
        severity: error.severity,
        canRetry: error.isOperational
      };
    }
    
    if (error instanceof Error) {
      return {
        title: title || 'Error',
        message: message || sanitizeErrorMessage(error.message),
        severity: ErrorSeverity.MEDIUM,
        canRetry: true
      };
    }
    
    return {
      title: title || 'Error',
      message: message || 'An unexpected error occurred',
      severity: ErrorSeverity.MEDIUM,
      canRetry: showRetry
    };
  };

  const getErrorTitle = (errorType: ErrorType): string => {
    switch (errorType) {
      case ErrorType.AUTHENTICATION:
        return 'Authentication Required';
      case ErrorType.AUTHORIZATION:
        return 'Access Denied';
      case ErrorType.VALIDATION:
        return 'Invalid Input';
      case ErrorType.NOT_FOUND:
        return 'Not Found';
      case ErrorType.RATE_LIMIT:
        return 'Too Many Requests';
      case ErrorType.SECURITY:
        return 'Security Error';
      case ErrorType.SERVER:
        return 'Server Error';
      case ErrorType.EXTERNAL_API:
        return 'External Service Error';
      case ErrorType.DATABASE:
        return 'Database Error';
      default:
        return 'Error';
    }
  };

  const sanitizeErrorMessage = (msg: string): string => {
    let sanitized = msg;
    
    // Remove sensitive patterns
    const sensitivePatterns = [
      /password/gi,
      /token/gi,
      /secret/gi,
      /key/gi,
      /auth/gi,
      /session/gi,
      /jwt/gi,
      /api[_-]?key/gi
    ];
    
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    
    // Remove file paths in production
    if (process.env.NODE_ENV === 'production') {
      sanitized = sanitized.replace(/\/[^\s]+\.(js|ts|jsx|tsx)/g, '[FILE]');
    }
    
    return sanitized;
  };

  const getIconAndColors = () => {
    switch (type) {
      case 'warning':
        return {
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-400',
          titleColor: 'text-yellow-800',
          textColor: 'text-yellow-700'
        };
      case 'info':
        return {
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-400',
          titleColor: 'text-blue-800',
          textColor: 'text-blue-700'
        };
      default: // error
        return {
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-400',
          titleColor: 'text-red-800',
          textColor: 'text-red-700'
        };
    }
  };

  const errorInfo = getErrorInfo();
  const { icon, bgColor, borderColor, iconColor, titleColor, textColor } = getIconAndColors();

  return (
    <div className={`rounded-md ${bgColor} ${borderColor} border p-4 ${className}`}>
      <div className="flex">
        <div className={`flex-shrink-0 ${iconColor}`}>
          {icon}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${titleColor}`}>
            {errorInfo.title}
          </h3>
          <div className={`mt-2 text-sm ${textColor}`}>
            <p>{errorInfo.message}</p>
          </div>
          
          {/* Development Details */}
          {showDetails && error && process.env.NODE_ENV !== 'production' && (
            <details className="mt-3">
              <summary className={`cursor-pointer text-xs font-medium ${titleColor}`}>
                Technical Details
              </summary>
              <div className={`mt-2 text-xs ${textColor} bg-white bg-opacity-50 rounded p-2`}>
                {error instanceof AppError && (
                  <div className="space-y-1">
                    <div><strong>Type:</strong> {error.type}</div>
                    <div><strong>Code:</strong> E{error.statusCode}</div>
                    <div><strong>Severity:</strong> {error.severity}</div>
                    {error.metadata && (
                      <div><strong>Context:</strong> {JSON.stringify(error.metadata, null, 2)}</div>
                    )}
                  </div>
                )}
                {error.stack && (
                  <div className="mt-2">
                    <strong>Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-xs">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
          
          {/* Action Buttons */}
          {(errorInfo.canRetry || onRetry || onDismiss) && (
            <div className="mt-4 flex space-x-2">
              {(errorInfo.canRetry || onRetry) && onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded ${titleColor} bg-white bg-opacity-75 hover:bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent transition-colors`}
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              )}
              
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded ${titleColor} bg-white bg-opacity-75 hover:bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent transition-colors`}
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Toast-style error display
export const ErrorToast: React.FC<ErrorDisplayProps & {
  isVisible?: boolean;
  autoHide?: boolean;
  duration?: number;
}> = ({
  isVisible = true,
  autoHide = true,
  duration = 5000,
  onDismiss,
  ...props
}) => {
  const [visible, setVisible] = React.useState(isVisible);

  React.useEffect(() => {
    setVisible(isVisible);
  }, [isVisible]);

  React.useEffect(() => {
    if (visible && autoHide) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, autoHide, duration, onDismiss]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="transform transition-all duration-300 ease-in-out">
        <ErrorDisplay
          {...props}
          onDismiss={() => {
            setVisible(false);
            onDismiss?.();
          }}
          className="shadow-lg"
        />
      </div>
    </div>
  );
};

export default ErrorDisplay;