import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  title?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  className = '',
  title = 'Error'
}) => {
  return (
    <div className={`bg-[#0D0E12] min-h-screen text-white font-sans flex items-center justify-center ${className}`} role="alert" aria-live="assertive">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-red-400" aria-hidden="true" />
        </div>
        <h2 className="text-lg md:text-xl font-bold text-red-400 mb-2">{title}</h2>
        <p className="text-gray-400 mb-6 text-sm md:text-base leading-relaxed">{message}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-green-500 text-black rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-[#0D0E12] text-sm md:text-base font-medium"
            aria-label="Retry the failed operation"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};