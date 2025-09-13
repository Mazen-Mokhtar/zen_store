'use client';

import React, { Suspense, lazy, ComponentType, memo } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { ErrorBoundary } from '@/components/security/ErrorBoundary';

interface LazyComponentWrapperProps {
  importFunc: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  props?: Record<string, any>;
  className?: string;
}

// Enhanced lazy loading wrapper with error boundaries and performance optimizations
export const LazyComponentWrapper = memo<LazyComponentWrapperProps>(({ 
  importFunc, 
  fallback, 
  errorFallback,
  props = {},
  className = ''
}) => {
  // Create lazy component with error handling
  const LazyComponent = lazy(importFunc);

  const defaultFallback = (
    <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
      <LoadingSpinner size="md" text="Loading component..." />
    </div>
  );

  const defaultErrorFallback = (
    <div className={className}>
      <ErrorMessage 
        message="Failed to load component. Please try again."
        onRetry={() => window.location.reload()}
      />
    </div>
  );

  return (
    <ErrorBoundary fallback={errorFallback || defaultErrorFallback}>
      <Suspense fallback={fallback || defaultFallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
});

LazyComponentWrapper.displayName = 'LazyComponentWrapper';

// Hook for creating optimized lazy components
export const useLazyComponent = (importFunc: () => Promise<{ default: ComponentType<any> }>) => {
  return memo((props: any) => (
    <LazyComponentWrapper importFunc={importFunc} props={props} />
  ));
};

// Utility function for creating lazy components with preloading
export const createLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options?: {
    preload?: boolean;
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
  }
) => {
  const LazyComponent = lazy(importFunc);
  
  // Preload component if requested
  if (options?.preload) {
    // Preload on idle or after a delay
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => importFunc());
      } else {
        setTimeout(() => importFunc(), 100);
      }
    }
  }

  return memo((props: React.ComponentProps<T>) => (
    <ErrorBoundary fallback={options?.errorFallback}>
      <Suspense fallback={options?.fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  ));
};

// Intersection Observer based lazy loading
export const useIntersectionLazyLoad = (
  importFunc: () => Promise<{ default: ComponentType<any> }>,
  options?: IntersectionObserverInit
) => {
  const [shouldLoad, setShouldLoad] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options]);

  return { ref, shouldLoad, LazyComponent: shouldLoad ? lazy(importFunc) : null };
};