import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  className = '' 
}) => {
  return (
    <div className={`bg-[#0D0E12] min-h-screen text-white font-sans flex items-center justify-center ${className}`}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
        <p className="text-gray-400 mb-6">{message}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-black rounded hover:bg-green-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}; 