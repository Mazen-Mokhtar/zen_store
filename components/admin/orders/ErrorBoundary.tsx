'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service

    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/admin';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8" role="alert">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <FiAlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              حدث خطأ غير متوقع
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              نعتذر، حدث خطأ أثناء تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تفاصيل الخطأ (وضع التطوير)
                </summary>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                  </div>
                </div>
              </details>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                aria-label="Retry loading the page"
              >
                <FiRefreshCw className="w-4 h-4" aria-hidden="true" />
                إعادة المحاولة
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                aria-label="Go to admin dashboard"
              >
                <FiHome className="w-4 h-4" aria-hidden="true" />
                العودة للوحة التحكم
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading skeleton component
export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className = '' 
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden ${className}`} role="status" aria-label="Loading content">
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(rows)].map((_, i) => (
              <div key={i} className="flex space-x-4" aria-hidden="true">
                <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12 flex-shrink-0"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">جاري تحميل المحتوى...</span>
    </div>
  );
};

// Error message component for API errors
export const ErrorMessage: React.FC<{
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({ message, onRetry, className = '' }) => {
  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`} role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
        <div className="mr-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
            حدث خطأ
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300">
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100 focus:outline-none focus:underline transition-colors duration-200"
              aria-label="Retry the failed operation"
            >
              <FiRefreshCw className="w-4 h-4" aria-hidden="true" />
              إعادة المحاولة
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;