'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializePhase3, getInitializationStatus, getSystemHealth, isPhase3Ready, InitializationStatus } from '@/lib/phase3-initialization';

// Phase 3 Context
interface Phase3ContextType {
  status: InitializationStatus;
  health: ReturnType<typeof getSystemHealth>;
  isReady: boolean;
  isInitializing: boolean;
  error: string | null;
  reinitialize: () => Promise<void>;
}

const Phase3Context = createContext<Phase3ContextType | null>(null);

// Phase 3 Provider Component
export const Phase3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<InitializationStatus>({
    monitoring: false,
    errorTracking: false,
    accessibility: false,
    security: false,
    seo: false,
    bundleAnalysis: false,
    advancedCaching: false,
    performanceMonitoring: false,
    startTime: 0,
    errors: []
  });
  
  const [health, setHealth] = useState(getSystemHealth());
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Phase 3 systems
  const initialize = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      
      console.log('🚀 Starting Phase 3 initialization...');
      
      const initStatus = await initializePhase3({
        environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
        debug: process.env.NODE_ENV === 'development',
        enableMonitoring: true,
        enableErrorTracking: true,
        enableAccessibility: true,
        enableSecurity: true,
        enableSEO: true,
        enableBundleAnalysis: process.env.NODE_ENV === 'development',
        enableAdvancedCaching: true,
        enablePerformanceMonitoring: true
      });
      
      setStatus(initStatus);
      setHealth(getSystemHealth());
      setIsReady(isPhase3Ready());
      
      if (initStatus.errors.length > 0) {
        console.warn('⚠️ Phase 3 initialized with errors:', initStatus.errors);
        setError(`Initialization completed with ${initStatus.errors.length} errors`);
      } else {
        console.log('✅ Phase 3 initialization completed successfully');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during initialization';
      console.error('💥 Phase 3 initialization failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  };

  // Reinitialize function
  const reinitialize = async () => {
    console.log('🔄 Reinitializing Phase 3 systems...');
    await initialize();
  };

  // Initialize on mount (only on client side to prevent SSR hydration mismatch)
  useEffect(() => {
    // Only initialize on client side to prevent SSR hydration mismatch
    if (typeof window !== 'undefined') {
      initialize();
    }
  }, []);

  // Update status periodically
  useEffect(() => {
    if (!isInitializing) {
      const interval = setInterval(() => {
        setStatus(getInitializationStatus());
        setHealth(getSystemHealth());
        setIsReady(isPhase3Ready());
      }, 10000); // Update every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [isInitializing]);

  // Handle errors in child components
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Phase 3 Runtime Error:', event.error);
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Phase 3 Unhandled Promise Rejection:', event.reason);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const contextValue: Phase3ContextType = {
    status,
    health,
    isReady,
    isInitializing,
    error,
    reinitialize
  };

  return (
    <Phase3Context.Provider value={contextValue}>
      {children}
      {/* Phase 3 Status Indicator (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Phase3StatusIndicator />
      )}
    </Phase3Context.Provider>
  );
};

// Hook to use Phase 3 context
export const usePhase3 = (): Phase3ContextType => {
  const context = useContext(Phase3Context);
  if (!context) {
    throw new Error('usePhase3 must be used within a Phase3Provider');
  }
  return context;
};

// Phase 3 Status Indicator Component (Development Only)
const Phase3StatusIndicator: React.FC = () => {
  const { status, health, isReady, isInitializing, error } = usePhase3();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !isMounted) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`
          bg-white dark:bg-gray-800 border rounded-lg shadow-lg transition-all duration-300
          ${isExpanded ? 'w-80 h-auto' : 'w-12 h-12'}
        `}
      >
        {/* Status Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold
            ${isInitializing ? 'bg-yellow-500 animate-pulse' : 
              isReady ? 'bg-green-500' : 
              error ? 'bg-red-500' : 'bg-orange-500'}
          `}
          title={`Phase 3 Status: ${isInitializing ? 'Initializing' : isReady ? 'Ready' : error ? 'Error' : 'Partial'}`}
        >
          {isInitializing ? '⏳' : isReady ? '✅' : error ? '❌' : '⚠️'}
        </button>

        {/* Expanded Status Panel */}
        {isExpanded && (
          <div className="p-4 pt-2">
            <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Phase 3 Systems
            </h3>
            
            {/* Overall Status */}
            <div className={`
              text-xs px-2 py-1 rounded mb-2 text-center
              ${health.overall === 'healthy' ? 'bg-green-100 text-green-800' :
                health.overall === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'}
            `}>
              {health.overall.toUpperCase()}
              {isReady && ' - READY'}
            </div>

            {/* Systems Grid */}
            <div className="grid grid-cols-2 gap-1 text-xs mb-2">
              {Object.entries(health.systems).map(([system, isHealthy]) => (
                <div key={system} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 truncate">
                    {system.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <span>{isHealthy ? '✅' : '❌'}</span>
                </div>
              ))}
            </div>

            {/* Error Count */}
            {health.errors.length > 0 && (
              <div className="text-xs text-red-600 mb-2">
                {health.errors.length} error(s)
              </div>
            )}

            {/* Uptime */}
            <div className="text-xs text-gray-500">
              Uptime: {Math.floor(health.uptime / 1000)}s
            </div>

            {/* Actions */}
            <div className="mt-2 flex gap-1">
              <button
                onClick={() => {
                  const { debugPhase3 } = require('@/lib/phase3-initialization');
                  debugPhase3();
                }}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              >
                Debug
              </button>
              <button
                onClick={() => {
                  const { getPhase3Metrics } = require('@/lib/phase3-initialization');
                  console.log('Phase 3 Metrics:', getPhase3Metrics());
                }}
                className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
              >
                Metrics
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Phase 3 Ready Guard Component
export const Phase3ReadyGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireSystems?: string[];
}> = ({ children, fallback, requireSystems = [] }) => {
  const { status, isReady, isInitializing } = usePhase3();

  // Check if specific systems are required
  const hasRequiredSystems = requireSystems.length === 0 || 
    requireSystems.every(system => status[system as keyof InitializationStatus]);

  if (isInitializing) {
    return fallback || (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Initializing Phase 3 systems...</span>
      </div>
    );
  }

  if (!isReady || !hasRequiredSystems) {
    return fallback || (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-yellow-500 text-2xl mb-2">⚠️</div>
          <div className="text-gray-600">Phase 3 systems not ready</div>
          {requireSystems.length > 0 && (
            <div className="text-sm text-gray-500 mt-1">
              Required: {requireSystems.join(', ')}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Phase 3 System Status Hook
export const usePhase3System = (systemName: keyof InitializationStatus) => {
  const { status, health } = usePhase3();
  const systemKey = String(systemName);
  
  return {
    isEnabled: status[systemName],
    isHealthy: health.systems[systemKey as keyof typeof health.systems],
    hasErrors: health.errors.some(error => error.toLowerCase().includes(systemKey.toLowerCase()))
  };
};

// Export context for advanced usage
export { Phase3Context };
export type { Phase3ContextType };