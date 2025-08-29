'use client';

import React, { useState, useEffect } from 'react';
import { rateLimiter, generateRateLimitKey } from '../../lib/rateLimiter';
import { useAuth } from '../../lib/auth';

interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  isBlocked: boolean;
  retryAfter?: number;
}

interface RateLimitStatusProps {
  endpoint?: string;
  showDetails?: boolean;
  className?: string;
}

export default function RateLimitStatus({ 
  endpoint = 'general', 
  showDetails = false, 
  className = '' 
}: RateLimitStatusProps) {
  const { user } = useAuth();
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRateLimit = () => {
      try {
        // Generate appropriate key based on user authentication
        let key: string;
        if (user?._id) {
          key = generateRateLimitKey.byUser(user._id, endpoint);
        } else {
          // For client-side, we'll use a generic key since we can't get real IP
          key = generateRateLimitKey.byIP('client', endpoint);
        }

        const status = rateLimiter.getStatus(key);
        
        if (status) {
          const now = Date.now();
          const remaining = Math.max(0, 100 - status.count); // Assuming max 100 requests
          const isBlocked = status.blocked || status.count >= 100;
          const retryAfter = isBlocked ? Math.ceil((status.resetTime - now) / 1000) : undefined;

          setRateLimitInfo({
            remaining,
            resetTime: status.resetTime,
            isBlocked,
            retryAfter
          });
        } else {
          // No rate limit data available
          setRateLimitInfo({
            remaining: 100,
            resetTime: Date.now() + 60000,
            isBlocked: false
          });
        }
      } catch (error) {
        console.error('Error checking rate limit status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkRateLimit();
    
    // Update every 10 seconds
    const interval = setInterval(checkRateLimit, 10000);
    
    return () => clearInterval(interval);
  }, [user, endpoint]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  if (!rateLimitInfo) {
    return null;
  }

  const getStatusColor = () => {
    if (rateLimitInfo.isBlocked) return 'text-red-600';
    if (rateLimitInfo.remaining < 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (rateLimitInfo.isBlocked) return 'bg-red-500';
    if (rateLimitInfo.remaining < 10) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const progressPercentage = Math.max(0, (rateLimitInfo.remaining / 100) * 100);

  return (
    <div className={`rate-limit-status ${className}`}>
      {rateLimitInfo.isBlocked ? (
        <div className="flex items-center space-x-2 text-red-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">
            Rate limit exceeded
            {rateLimitInfo.retryAfter && (
              <span className="ml-1">- Retry in {rateLimitInfo.retryAfter}s</span>
            )}
          </span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <svg className={`w-4 h-4 ${getStatusColor()}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {rateLimitInfo.remaining} requests remaining
          </span>
        </div>
      )}
      
      {showDetails && (
        <div className="mt-2 space-y-2">
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {/* Additional details */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>Endpoint: {endpoint}</div>
            <div>Reset: {new Date(rateLimitInfo.resetTime).toLocaleTimeString()}</div>
            {user ? (
              <div className="text-green-600">✓ Authenticated (Higher limits)</div>
            ) : (
              <div className="text-yellow-600">⚠ Not authenticated (Lower limits)</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for programmatic rate limit checking
export function useRateLimit(endpoint: string = 'general') {
  const { user } = useAuth();
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);

  const checkRateLimit = React.useCallback(() => {
    try {
      let key: string;
      if (user?._id) {
        key = generateRateLimitKey.byUser(user._id, endpoint);
      } else {
        key = generateRateLimitKey.byIP('client', endpoint);
      }

      const status = rateLimiter.getStatus(key);
      
      if (status) {
        const now = Date.now();
        const remaining = Math.max(0, 100 - status.count);
        const isBlocked = status.blocked || status.count >= 100;
        const retryAfter = isBlocked ? Math.ceil((status.resetTime - now) / 1000) : undefined;

        setRateLimitInfo({
          remaining,
          resetTime: status.resetTime,
          isBlocked,
          retryAfter
        });
      }
    } catch (error) {
      console.error('Error checking rate limit:', error);
    }
  }, [user, endpoint]);

  useEffect(() => {
    checkRateLimit();
    const interval = setInterval(checkRateLimit, 10000);
    return () => clearInterval(interval);
  }, [checkRateLimit]);

  return {
    rateLimitInfo,
    checkRateLimit,
    isBlocked: rateLimitInfo?.isBlocked || false,
    remaining: rateLimitInfo?.remaining || 100
  };
}

// Component for displaying rate limit warnings
export function RateLimitWarning({ 
  threshold = 10, 
  className = '' 
}: { 
  threshold?: number; 
  className?: string; 
}) {
  const { rateLimitInfo } = useRateLimit();

  if (!rateLimitInfo || rateLimitInfo.remaining > threshold) {
    return null;
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-md p-3 ${className}`}>
      <div className="flex items-center">
        <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div>
          <h3 className="text-sm font-medium text-yellow-800">
            Rate Limit Warning
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            You have {rateLimitInfo.remaining} requests remaining. 
            Please slow down to avoid being temporarily blocked.
          </p>
        </div>
      </div>
    </div>
  );
}