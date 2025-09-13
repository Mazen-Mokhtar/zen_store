'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { getServiceWorkerState, checkForUpdates } from '@/lib/sw-registration';

interface OfflineIndicatorProps {
  className?: string;
  showOnlineStatus?: boolean;
  autoHide?: boolean;
  hideDelay?: number;
}

interface NetworkState {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType?: string;
  downlink?: number;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showOnlineStatus = false,
  autoHide = true,
  hideDelay = 3000
}) => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [swState, setSwState] = useState(getServiceWorkerState());

  useEffect(() => {
    // Update visibility based on online status
    if (!networkState.isOnline) {
      setIsVisible(true);
    } else if (autoHide && !showOnlineStatus) {
      const timer = setTimeout(() => setIsVisible(false), hideDelay);
      return () => clearTimeout(timer);
    } else if (showOnlineStatus) {
      setIsVisible(true);
      if (autoHide) {
        const timer = setTimeout(() => setIsVisible(false), hideDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [networkState.isOnline, autoHide, showOnlineStatus, hideDelay]);

  useEffect(() => {
    const handleOnline = () => {
      setNetworkState(prev => ({ ...prev, isOnline: true }));
      setSwState(getServiceWorkerState());
    };

    const handleOffline = () => {
      setNetworkState(prev => ({ ...prev, isOnline: false }));
    };

    // Network connection listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConnectionInfo = () => {
        setNetworkState(prev => ({
          ...prev,
          isSlowConnection: connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g',
          effectiveType: connection.effectiveType,
          downlink: connection.downlink
        }));
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      // Check for service worker updates
      await checkForUpdates();
      
      // Try to fetch a simple resource to test connectivity
      await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      // If successful, the online event should fire automatically
      setTimeout(() => {
        if (navigator.onLine) {
          setNetworkState(prev => ({ ...prev, isOnline: true }));
        }
      }, 1000);
    } catch (error) {
      console.log('Retry failed, still offline');
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusMessage = () => {
    if (!networkState.isOnline) {
      return 'You are currently offline';
    }
    
    if (networkState.isSlowConnection) {
      return `Slow connection detected (${networkState.effectiveType})`;
    }
    
    if (showOnlineStatus) {
      return 'Connected';
    }
    
    return '';
  };

  const getStatusIcon = () => {
    if (isRetrying) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    
    if (!networkState.isOnline) {
      return <WifiOff className="w-4 h-4" />;
    }
    
    if (networkState.isSlowConnection) {
      return <AlertCircle className="w-4 h-4" />;
    }
    
    return <Wifi className="w-4 h-4" />;
  };

  const getStatusColor = () => {
    if (!networkState.isOnline) {
      return 'bg-red-500 text-white';
    }
    
    if (networkState.isSlowConnection) {
      return 'bg-yellow-500 text-white';
    }
    
    return 'bg-green-500 text-white';
  };

  if (!isVisible && (!showOnlineStatus || networkState.isOnline)) {
    return null;
  }

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
          ${getStatusColor()}
          backdrop-blur-sm
        `}
      >
        {getStatusIcon()}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {getStatusMessage()}
          </p>
          
          {networkState.downlink && (
            <p className="text-xs opacity-90">
              Speed: {networkState.downlink} Mbps
            </p>
          )}
          
          {swState.isRegistered && !networkState.isOnline && (
            <p className="text-xs opacity-90">
              Some content available offline
            </p>
          )}
        </div>
        
        {!networkState.isOnline && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="
              flex items-center justify-center
              w-8 h-8 rounded-full
              bg-white/20 hover:bg-white/30
              transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            aria-label="Retry connection"
            title="Retry connection"
          >
            <RefreshCw 
              className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} 
            />
          </button>
        )}
        
        <button
          onClick={() => setIsVisible(false)}
          className="
            flex items-center justify-center
            w-8 h-8 rounded-full
            bg-white/20 hover:bg-white/30
            transition-colors duration-200
            ml-2
          "
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      </div>
      
      {/* Progress bar for slow connections */}
      {networkState.isSlowConnection && networkState.isOnline && (
        <div className="mt-2 bg-white/20 rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-1000 ease-out"
            style={{ 
              width: networkState.downlink 
                ? `${Math.min((networkState.downlink / 10) * 100, 100)}%` 
                : '30%'
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Hook for using offline status in components
 */
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType,
    isSlowConnection: connectionType === '2g' || connectionType === 'slow-2g'
  };
};

/**
 * Compact version for mobile/small screens
 */
export const CompactOfflineIndicator: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { isOnline, isSlowConnection } = useOfflineStatus();
  const [isVisible, setIsVisible] = useState(!isOnline);

  useEffect(() => {
    setIsVisible(!isOnline || isSlowConnection);
  }, [isOnline, isSlowConnection]);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed bottom-4 left-4 z-50
        flex items-center gap-2 px-3 py-2
        rounded-full shadow-lg text-sm font-medium
        ${!isOnline 
          ? 'bg-red-500 text-white' 
          : 'bg-yellow-500 text-white'
        }
        ${className}
      `}
    >
      {!isOnline ? (
        <WifiOff className="w-4 h-4" />
      ) : (
        <AlertCircle className="w-4 h-4" />
      )}
      
      <span>
        {!isOnline ? 'Offline' : 'Slow'}
      </span>
    </div>
  );
};

export default OfflineIndicator;