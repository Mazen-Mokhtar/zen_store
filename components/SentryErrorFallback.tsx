'use client';

import React from 'react';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function SentryErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-6">We apologize for the inconvenience. Please try refreshing the page.</p>
        <button
          onClick={resetError}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}