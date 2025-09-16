'use client';

import React, { Suspense, ComponentType, useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { logger } from '@/lib/utils';

// Loading component for lazy-loaded components
const DefaultLoadingComponent = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded mb-4"></div>
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-100 rounded"></div>
      ))}
    </div>
  </div>
);

// Error boundary for lazy-loaded components
const LazyErrorBoundary = ({ children, error }: { children: React.ReactNode; error?: Error }) => {
  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600 text-sm">Failed to load component. Please try again.</p>
      </div>
    );
  }
  return <>{children}</>;
};

// Intersection Observer hook for lazy loading
export const useIntersectionLazyLoad = (options: IntersectionObserverInit = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
  };
};

// Utility function to create lazy-loaded components with error handling
export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: {
    loading?: () => React.ReactNode;
    error?: ComponentType<{ error: Error; retry: () => void }>;
    ssr?: boolean;
  } = {}
) {
  const {
    loading = () => React.createElement(DefaultLoadingComponent),
    ssr = false
  } = options;

  return dynamic(importFn, {
    loading: loading,
    ssr,
  });
}

// Lazy component wrapper with intersection observer
export const LazyComponentWrapper = <T extends object>({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
} & T) => {
  const { elementRef, hasIntersected } = useIntersectionLazyLoad({
    threshold,
    rootMargin,
  });

  return (
    <div ref={elementRef as React.RefObject<HTMLDivElement>} {...props}>
      {hasIntersected ? (
        <Suspense fallback={fallback || <DefaultLoadingComponent />}>
          <LazyErrorBoundary>
            {children}
          </LazyErrorBoundary>
        </Suspense>
      ) : (
        fallback || <DefaultLoadingComponent />
      )}
    </div>
  );
};

// Hook for using lazy components with intersection observer
export const useLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    threshold?: number;
    rootMargin?: string;
    preload?: boolean;
  } = {}
) => {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { elementRef, hasIntersected } = useIntersectionLazyLoad({
    threshold: options.threshold || 0.1,
    rootMargin: options.rootMargin || '50px',
  });

  const loadComponent = useCallback(async () => {
    if (Component || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const module = await importFn();
      setComponent(() => module.default);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load component');
      setError(error);
      logger.warn('Failed to load lazy component:', error);
    } finally {
      setLoading(false);
    }
  }, [Component, loading, importFn]);

  useEffect(() => {
    if (options.preload) {
      loadComponent();
    }
  }, [options.preload, loadComponent]);

  useEffect(() => {
    if (hasIntersected && !Component && !loading) {
      loadComponent();
    }
  }, [hasIntersected, Component, loading, loadComponent]);

  return {
    Component,
    loading,
    error,
    elementRef,
    hasIntersected,
    retry: loadComponent,
  };
};

// Export types
export interface LazyComponentConfig {
  threshold?: number;
  rootMargin?: string;
  preload?: boolean;
  ssr?: boolean;
}

export interface LazyLoadingState {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
}