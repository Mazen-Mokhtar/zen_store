'use client';

// Dynamic import utilities for tree shaking and performance optimization
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

import React from 'react';

// Loading component for dynamic imports
const LoadingSpinner = () => React.createElement('div', 
  { className: 'flex items-center justify-center p-8' },
  React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-primary' })
);

// Error fallback component
const ErrorFallback = ({ error }: { error?: string }) => React.createElement('div',
  { className: 'flex items-center justify-center p-8 text-red-500' },
  React.createElement('p', null, `Failed to load component: ${error || 'Unknown error'}`)
);

// Steam components - heavy API integrations
export const DynamicSteamGameDetails = dynamic(
  () => import('@/components/steam/steam-game-details-client').then(mod => ({
    default: mod.SteamGameDetailsClient
  })),
  {
    loading: LoadingSpinner,
    ssr: false
  }
);

// Performance monitoring components - only load when needed
export const DynamicPerformanceMonitor = dynamic(
  () => import('@/lib/performance-monitoring').then(mod => ({
    default: mod.PerformanceMonitor
  })),
  {
    loading: LoadingSpinner,
    ssr: false
  }
);

// Analytics components - defer loading
export const DynamicAnalytics = dynamic(
  () => import('@/lib/monitoring-analytics').then(mod => ({
    default: mod.MonitoringAnalytics
  })),
  {
    loading: LoadingSpinner,
    ssr: false
  }
);

// Heavy UI components
export const DynamicOrderDetailsModal = dynamic(
  () => import('@/components/ui/order-details-modal').then(mod => ({
    default: mod.OrderDetailsModal
  })),
  {
    loading: LoadingSpinner,
    ssr: false
  }
);

// Admin components - only load for admin users
export const DynamicAdminOrdersTable = dynamic(
  () => import('@/components/admin/orders/OrdersTable').then(mod => ({
    default: mod.OrdersTable
  })),
  {
    loading: LoadingSpinner,
    ssr: false
  }
);

export const DynamicVirtualizedOrdersTable = dynamic(
  () => import('@/components/admin/orders/VirtualizedOrdersTable').then(mod => ({
    default: mod.VirtualizedOrdersTable
  })),
  {
    loading: LoadingSpinner,
    ssr: false
  }
);

// Category dashboard components - load on demand
export const DynamicCategoryGamesSection = dynamic(
  () => import('@/components/category-dashboard/CategoryGamesSection').then(mod => ({
    default: mod.CategoryGamesSection
  })),
  {
    loading: LoadingSpinner,
    ssr: true // This can be server-rendered
  }
);

// Utility function to create dynamic imports with consistent options
export const createDynamicImport = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    ssr?: boolean;
    loading?: ComponentType;
  } = {}
) => {
  return dynamic(importFn, {
    loading: options.loading || LoadingSpinner,
    ssr: options.ssr ?? false
  });
};

// Preload functions for critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be needed soon
  import('@/components/ui/order-details-modal');
  import('@/components/steam/steam-game-details-client');
};

// Preload admin components when user is admin
export const preloadAdminComponents = () => {
  import('@/components/admin/orders/OrdersTable');
  import('@/components/admin/orders/VirtualizedOrdersTable');
  import('@/components/admin/orders/OrdersFilters');
};

// Route-based preloading
export const preloadRouteComponents = (route: string) => {
  switch (route) {
    case '/admin/orders':
      preloadAdminComponents();
      break;
    case '/steam':
      import('@/components/steam/steam-game-details-client');
      break;
    case '/orders':
      import('@/components/ui/order-details-modal');
      break;
    default:
      break;
  }
};

// Bundle splitting configuration
export const bundleSplitConfig = {
  // Heavy libraries that should be in separate chunks
  heavyLibraries: [
    'framer-motion',
    'react-icons',
    'lucide-react',
    '@radix-ui/react-label',
    '@radix-ui/react-separator',
    '@radix-ui/react-slot'
  ],
  
  // Admin-only components
  adminComponents: [
    '@/components/admin',
    '@/lib/admin'
  ],
  
  // Performance monitoring
  performanceComponents: [
    '@/lib/performance-monitoring',
    '@/lib/monitoring-analytics',
    '@/components/performance'
  ]
};