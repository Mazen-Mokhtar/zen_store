import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'border-green-500',
  text = 'Loading...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} role="status" aria-live="polite">
      <div 
        className={`animate-spin rounded-full border-b-2 ${color} ${sizeClasses[size]} mb-4`}
        aria-hidden="true"
      ></div>
      {text && (
        <p className="text-gray-400 text-sm text-center max-w-xs">
          <span className="sr-only">Loading: </span>
          {text}
        </p>
      )}
    </div>
  );
};