'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, ErrorType, ErrorSeverity } from '../../lib/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error securely
    this.logError(error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    // Log error (in production, send to monitoring service)
    console.error('🚨 React Error Boundary:', errorData);
    
    // In production, send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: errorMonitor.captureException(error, errorData);
    }
  }

  private sanitizeErrorMessage(error: Error): string {
    let message = error.message;
    
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
      message = message.replace(pattern, '[REDACTED]');
    });
    
    // Remove file paths
    message = message.replace(/\/[^\s]+\.(js|ts|jsx|tsx)/g, '[FILE]');
    
    return message;
  }

  private getErrorSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorSeverity.MEDIUM;
    }
    
    if (message.includes('chunk') || message.includes('loading')) {
      return ErrorSeverity.LOW;
    }
    
    if (message.includes('security') || message.includes('unauthorized')) {
      return ErrorSeverity.HIGH;
    }
    
    return ErrorSeverity.MEDIUM;
  }

  private retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private reportError = () => {
    if (this.state.error && this.state.errorId) {
      // In a real app, this would send the error report to your backend
      alert('Error report sent. Thank you!');
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.getErrorSeverity(this.state.error);
      const sanitizedMessage = this.sanitizeErrorMessage(this.state.error);
      const isProduction = process.env.NODE_ENV === 'production';
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {/* Error Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {severity === ErrorSeverity.HIGH ? 'Security Error' : 'Something went wrong'}
              </h2>
              
              {/* Error Message */}
              <p className="text-gray-600 mb-6">
                {isProduction 
                  ? 'We encountered an unexpected error. Please try again or contact support if the problem persists.'
                  : sanitizedMessage
                }
              </p>
              
              {/* Error ID */}
              {this.state.errorId && (
                <div className="bg-gray-100 rounded-lg p-3 mb-6">
                  <p className="text-xs text-gray-500 mb-1">Error ID (for support):</p>
                  <p className="text-sm font-mono text-gray-700">{this.state.errorId}</p>
                </div>
              )}
              
              {/* Development Details */}
              {!isProduction && this.props.showDetails && this.state.errorInfo && (
                <details className="text-left bg-gray-100 rounded-lg p-4 mb-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    Technical Details
                  </summary>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-all">{this.state.error.stack}</pre>
                    </div>
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-all">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  </div>
                </details>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.retry}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Go Home
                </button>
                
                {this.state.errorId && (
                  <button
                    onClick={this.reportError}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Report Error
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: any) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      ...errorInfo
    };

    console.error('🚨 Error Handler:', errorData);
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: errorMonitor.captureException(error, errorData);
    }
  };

  return { handleError };
}

// Higher-order component for error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;