'use client';

// Lazy loading utilities for heavy components to improve bundle size and performance
import * as React from 'react';
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import { logger } from './utils';

// Loading component for lazy-loaded components
const LoadingSpinner = () => React.createElement('div', 
  { className: 'flex items-center justify-center p-8' },
  React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-primary' })
);

// Error boundary for lazy-loaded components
const LazyErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div',
    { className: 'p-4 border border-red-200 rounded-lg bg-red-50' },
    React.createElement('p', { className: 'text-red-600 text-sm' }, 'Failed to load component. Please try again.'),
    children
  );
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
    loading = () => React.createElement(LoadingSpinner),
    ssr = false
  } = options;

  return dynamic(importFn, {
    loading: loading,
    ssr,
  });
}

// Pre-defined lazy components for common heavy components

// Chart components (heavy libraries)
// export const LazyChart = createLazyComponent(
//   () => import('@/components/ui/chart').catch(err => {
//     logger.warn('Failed to load Chart component:', err);
//     return { default: () => React.createElement('div', null, 'Chart unavailable') };
//   }),
//   { ssr: false }
// );

// Rich text editor (heavy component)
// export const LazyRichTextEditor = createLazyComponent(
//   () => import('@/components/ui/rich-text-editor').catch(err => {
//     logger.warn('Failed to load RichTextEditor component:', err);
//     return { default: () => React.createElement('div', null, 'Editor unavailable') };
//   }),
//   { ssr: false }
// );

// Image gallery with zoom (heavy component)
// export const LazyImageGallery = createLazyComponent(
//   () => import('@/components/ui/image-gallery').catch(err => {
//     logger.warn('Failed to load ImageGallery component:', err);
//     return { default: () => React.createElement('div', null, 'Gallery unavailable') };
//   }),
//   { ssr: false }
// );

// Video player (heavy component)
// export const LazyVideoPlayer = createLazyComponent(
//   () => import('@/components/ui/video-player').catch(err => {
//     logger.warn('Failed to load VideoPlayer component:', err);
//     return { default: () => React.createElement('div', null, 'Video player unavailable') };
//   }),
//   { ssr: false }
// );

// Code editor (very heavy component)
// export const LazyCodeEditor = createLazyComponent(
//   () => import('@/components/ui/code-editor').catch(err => {
//     logger.warn('Failed to load CodeEditor component:', err);
//     return { default: () => React.createElement('div', null, 'Code editor unavailable') };
//   }),
//   { ssr: false }
// );

// Admin dashboard components (heavy and not needed for regular users)
// export const LazyAdminDashboard = createLazyComponent(
//   () => import('@/components/admin/dashboard').catch(err => {
//     logger.warn('Failed to load AdminDashboard component:', err);
//     return { default: () => React.createElement('div', null, 'Dashboard unavailable') };
//   }),
//   { ssr: false }
// );

// export const LazyAdminAnalytics = createLazyComponent(
//   () => import('@/components/admin/analytics').catch(err => {
//     logger.warn('Failed to load AdminAnalytics component:', err);
//     return { default: () => React.createElement('div', null, 'Analytics unavailable') };
//   }),
//   { ssr: false }
// );

// Steam integration components (heavy API calls)
// export const LazySteamGameDetails = createLazyComponent(
//   () => import('@/components/steam/steam-game-details-client').catch(err => {
//     logger.warn('Failed to load SteamGameDetails component:', err);
//     return { default: () => React.createElement('div', null, 'Steam Game Details unavailable') };
//   }),
//   { ssr: false }
// );

// export const LazySteamGameList = createLazyComponent(
//   () => import('@/components/steam/steam-game-list').catch(err => {
//     logger.warn('Failed to load SteamGameList component:', err);
//     return { default: () => React.createElement('div', null, 'Steam Game List unavailable') };
//   }),
//   { ssr: false }
// );

// Payment components (sensitive and heavy)
// export const LazyPaymentForm = createLazyComponent(
//   () => import('@/components/payment/payment-form').catch(err => {
//     logger.warn('Failed to load PaymentForm component:', err);
//     return { default: () => React.createElement('div', null, 'Payment form unavailable') };
//   }),
//   { ssr: false }
// );

// export const LazyStripeCheckout = createLazyComponent(
//   () => import('@/components/payment/stripe-checkout').catch(err => {
//     logger.warn('Failed to load StripeCheckout component:', err);
//     return { default: () => React.createElement('div', null, 'Checkout unavailable') };
//   }),
//   { ssr: false }
// );

// Utility functions for lazy loading modules

// Lazy load utility functions
export const lazyLoadModule = async <T>(
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T> => {
  try {
    return await importFn();
  } catch (error) {
    logger.warn('Failed to lazy load module:', error);
    if (fallback) {
      return fallback;
    }
    throw error;
  }
};

// Preload components during idle time
export const preloadComponent = (importFn: () => Promise<any>) => {
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        importFn().catch(err => 
          logger.warn('Failed to preload component:', err)
        );
      });
    } else {
      setTimeout(() => {
        importFn().catch(err => 
          logger.warn('Failed to preload component:', err)
        );
      }, 1000);
    }
  }
};

// Intersection Observer based lazy loading
export const createIntersectionLazyLoader = (
  importFn: () => Promise<any>,
  options: IntersectionObserverInit = {}
) => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        importFn().catch(err => 
          logger.warn('Failed to lazy load on intersection:', err)
        );
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
};

// Route-based code splitting helpers
export const createRouteComponent = (importFn: () => Promise<any>) => {
  return dynamic(importFn, {
    loading: LoadingSpinner,
    ssr: false
  });
};

// Bundle size monitoring
export const getBundleInfo = () => {
  if (typeof window === 'undefined') return null;
  
  const performance = window.performance;
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
    totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
    resourceCount: performance.getEntriesByType('resource').length
  };
};

// Preload critical components on app start
export const preloadCriticalComponents = () => {
  // Only preload components that actually exist
  // preloadComponent(() => import('@/components/ui/dialog'));
  // preloadComponent(() => import('@/components/ui/toast'));
  // Add actual component imports here when they exist
};

// Initialize preloading when app starts
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Delay preloading to not interfere with initial page load
    setTimeout(preloadCriticalComponents, 2000);
  });
}