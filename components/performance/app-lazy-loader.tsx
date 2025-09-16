'use client';

import { memo, useEffect, useState, useCallback } from 'react';
import { useIntersectionLazyLoad } from './lazy-component-wrapper';
import { SkeletonSpinner } from '@/components/ui/skeleton';

interface AppLazyLoaderProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  fallback?: React.ReactNode;
  preloadDelay?: number;
}

// Global lazy loading manager for the entire app
export const AppLazyLoader = memo<AppLazyLoaderProps>(({ 
  children, 
  threshold = 0.1, 
  rootMargin = '50px',
  fallback = <SkeletonSpinner size="lg" text="Loading..." />,
  preloadDelay = 100
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  
  // Use intersection observer for lazy loading
  const { elementRef, isIntersecting } = useIntersectionLazyLoad({
    threshold,
    rootMargin
  });

  // Handle visibility changes
  useEffect(() => {
    if (isIntersecting && !isVisible) {
      setIsVisible(true);
      // Add a small delay before loading to prevent rapid loading/unloading
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, preloadDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isIntersecting, isVisible, preloadDelay]);

  return (
    <div ref={elementRef as React.RefObject<HTMLDivElement>} className="w-full">
      {shouldLoad ? children : fallback}
    </div>
  );
});

AppLazyLoader.displayName = 'AppLazyLoader';

// Hook for managing lazy loading state across components
export const useLazyLoadingState = () => {
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set());
  const [loadingComponents, setLoadingComponents] = useState<Set<string>>(new Set());

  const markAsLoaded = useCallback((componentId: string) => {
    setLoadedComponents(prev => new Set([...Array.from(prev), componentId]));
    setLoadingComponents(prev => {
      const newSet = new Set(prev);
      newSet.delete(componentId);
      return newSet;
    });
  }, []);

  const markAsLoading = useCallback((componentId: string) => {
    setLoadingComponents(prev => new Set([...Array.from(prev), componentId]));
  }, []);

  const isLoaded = useCallback((componentId: string) => {
    return loadedComponents.has(componentId);
  }, [loadedComponents]);

  const isLoading = useCallback((componentId: string) => {
    return loadingComponents.has(componentId);
  }, [loadingComponents]);

  return {
    markAsLoaded,
    markAsLoading,
    isLoaded,
    isLoading,
    loadedCount: loadedComponents.size,
    loadingCount: loadingComponents.size
  };
};

// Performance monitoring for lazy loading
export const useLazyLoadingPerformance = () => {
  const [metrics, setMetrics] = useState({
    totalComponents: 0,
    loadedComponents: 0,
    averageLoadTime: 0,
    totalLoadTime: 0
  });

  const recordLoadStart = useCallback((componentId: string) => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      setMetrics(prev => ({
        totalComponents: prev.totalComponents + 1,
        loadedComponents: prev.loadedComponents + 1,
        totalLoadTime: prev.totalLoadTime + loadTime,
        averageLoadTime: (prev.totalLoadTime + loadTime) / (prev.loadedComponents + 1)
      }));
    };
  }, []);

  return {
    metrics,
    recordLoadStart
  };
};

// Preloader for critical components
export const ComponentPreloader = memo<{ componentPaths: string[] }>(({ componentPaths }) => {
  useEffect(() => {
    // Preload critical components in the background
    const preloadPromises = componentPaths.map(path => {
      return import(path).catch(error => {
        console.warn(`Failed to preload component: ${path}`, error);
      });
    });

    Promise.allSettled(preloadPromises).then(() => {
      console.log('Critical components preloaded');
    });
  }, [componentPaths]);

  return null;
});

ComponentPreloader.displayName = 'ComponentPreloader';