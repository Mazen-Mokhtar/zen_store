'use client';

import { createContext, useContext, useEffect, useState, useCallback, memo } from 'react';
import { 
  defaultLazyLoadingConfig, 
  criticalComponents, 
  idlePreloadComponents,
  performanceThresholds,
  type LazyLoadingConfig 
} from '@/components/performance/lazy-loading-config';

interface LazyLoadingContextType {
  config: LazyLoadingConfig;
  isComponentLoaded: (componentName: string) => boolean;
  markComponentAsLoaded: (componentName: string) => void;
  preloadComponent: (componentPath: string) => Promise<void>;
  getLoadingStats: () => {
    totalLoaded: number;
    totalPreloaded: number;
    averageLoadTime: number;
  };
}

const LazyLoadingContext = createContext<LazyLoadingContextType | null>(null);

interface LazyLoadingProviderProps {
  children: React.ReactNode;
  config?: Partial<LazyLoadingConfig>;
}

export const LazyLoadingProvider = memo<LazyLoadingProviderProps>(({ 
  children, 
  config: customConfig 
}) => {
  const [config] = useState<LazyLoadingConfig>({
    ...defaultLazyLoadingConfig,
    ...customConfig
  });
  
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set());
  const [preloadedComponents, setPreloadedComponents] = useState<Set<string>>(new Set());
  const [loadTimes, setLoadTimes] = useState<number[]>([]);
  const [currentLoads, setCurrentLoads] = useState<Set<string>>(new Set());

  // Preload critical components on mount
  useEffect(() => {
    const preloadCritical = async () => {
      if (!config.preloadCritical) return;
      
      try {
        const preloadPromises = criticalComponents.map(async (componentPath) => {
          const startTime = performance.now();
          await import(componentPath);
          const endTime = performance.now();
          
          setLoadTimes(prev => [...prev, endTime - startTime]);
          setPreloadedComponents(prev => new Set([...Array.from(prev), componentPath]));
        });
        
        await Promise.allSettled(preloadPromises);
        console.log('Critical components preloaded');
      } catch (error) {
        console.warn('Failed to preload critical components:', error);
      }
    };

    preloadCritical();
  }, [config.preloadCritical]);

  const preloadComponent = useCallback(async (componentPath: string): Promise<void> => {
    if (preloadedComponents.has(componentPath) || currentLoads.has(componentPath)) {
      return;
    }

    // Check concurrent load limit
    if (currentLoads.size >= config.maxConcurrentLoads) {
      console.warn('Max concurrent loads reached, queuing component:', componentPath);
      return;
    }

    setCurrentLoads(prev => new Set([...Array.from(prev), componentPath]));
    
    try {
      const startTime = performance.now();
      
      // Add timeout for loading
      const loadPromise = import(componentPath);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Load timeout')), config.loadTimeout);
      });
      
      await Promise.race([loadPromise, timeoutPromise]);
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      setLoadTimes(prev => [...prev, loadTime]);
      setPreloadedComponents(prev => new Set([...Array.from(prev), componentPath]));
      
      console.log(`Component preloaded: ${componentPath} (${loadTime.toFixed(2)}ms)`);
    } catch (error) {
      console.warn(`Failed to preload component: ${componentPath}`, error);
    } finally {
      setCurrentLoads(prev => {
        const newSet = new Set(prev);
        newSet.delete(componentPath);
        return newSet;
      });
    }
  }, [preloadedComponents, currentLoads, config.maxConcurrentLoads, config.loadTimeout]);

  // Preload components on idle
  useEffect(() => {
    const preloadOnIdle = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          idlePreloadComponents.forEach(componentPath => {
            if (!preloadedComponents.has(componentPath)) {
              preloadComponent(componentPath);
            }
          });
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          idlePreloadComponents.forEach(componentPath => {
            if (!preloadedComponents.has(componentPath)) {
              preloadComponent(componentPath);
            }
          });
        }, 1000);
      }
    };

    preloadOnIdle();
  }, [preloadedComponents, preloadComponent]);

  // Memory cleanup on threshold
  useEffect(() => {
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        if (memInfo.usedJSHeapSize > performanceThresholds.memoryThreshold) {
          // Trigger garbage collection if available
          if ('gc' in window) {
            (window as any).gc();
          }
          console.warn('Memory threshold exceeded, consider reducing loaded components');
        }
      }
    };

    const interval = setInterval(checkMemoryUsage, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const isComponentLoaded = useCallback((componentName: string): boolean => {
    return loadedComponents.has(componentName);
  }, [loadedComponents]);

  const markComponentAsLoaded = useCallback((componentName: string) => {
    setLoadedComponents(prev => new Set([...Array.from(prev), componentName]));
    setCurrentLoads(prev => {
      const newSet = new Set(prev);
      newSet.delete(componentName);
      return newSet;
    });
  }, []);

  const getLoadingStats = useCallback(() => {
    return {
      totalLoaded: loadedComponents.size,
      totalPreloaded: preloadedComponents.size,
      averageLoadTime: loadTimes.length > 0 
        ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
        : 0
    };
  }, [loadedComponents.size, preloadedComponents.size, loadTimes]);

  const contextValue: LazyLoadingContextType = {
    config,
    isComponentLoaded,
    markComponentAsLoaded,
    preloadComponent,
    getLoadingStats
  };

  return (
    <LazyLoadingContext.Provider value={contextValue}>
      {children}
    </LazyLoadingContext.Provider>
  );
});

LazyLoadingProvider.displayName = 'LazyLoadingProvider';

// Hook to use lazy loading context
export const useLazyLoading = (): LazyLoadingContextType => {
  const context = useContext(LazyLoadingContext);
  if (!context) {
    throw new Error('useLazyLoading must be used within a LazyLoadingProvider');
  }
  return context;
};

// Hook for component-specific lazy loading
export const useComponentLazyLoading = (componentName: string) => {
  const { isComponentLoaded, markComponentAsLoaded, preloadComponent, config } = useLazyLoading();
  
  const componentConfig = config.componentSettings[componentName];
  
  useEffect(() => {
    if (componentConfig?.preload) {
      // Preload if configured to do so
      const componentPath = `@/components/${componentName.toLowerCase()}`;
      preloadComponent(componentPath);
    }
  }, [componentName, componentConfig, preloadComponent]);
  
  return {
    isLoaded: isComponentLoaded(componentName),
    markAsLoaded: () => markComponentAsLoaded(componentName),
    shouldPreload: componentConfig?.preload || false,
    priority: componentConfig?.priority || 'low'
  };
};