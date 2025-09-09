'use client';

import { lazy, Suspense, ComponentType } from 'react';
import { LoadingSkeleton } from './ErrorBoundary';
import type { 
  OrdersTableProps, 
  OrdersFiltersProps, 
  PaginationProps, 
  OrderDetailsModalProps 
} from './types';

// Lazy load components for better bundle splitting
const LazyOrdersTable = lazy(() => import('./OrdersTable').then(module => ({ default: module.OrdersTable })));
const LazyVirtualizedOrdersTable = lazy(() => import('./VirtualizedOrdersTable'));
const LazyOrdersFilters = lazy(() => import('./OrdersFilters').then(module => ({ default: module.OrdersFilters })));
const LazyPagination = lazy(() => import('./Pagination').then(module => ({ default: module.default })));
const LazyOrderDetailsModal = lazy(() => import('./OrderDetailsModal'));

// Higher-order component for lazy loading with error boundary
function withLazyLoading<T extends object>(
  LazyComponent: ComponentType<T>,
  fallback?: React.ReactNode
) {
  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={fallback || <LoadingSkeleton />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Lazy-loaded components with proper typing
export const LazyOrdersTableComponent = withLazyLoading<OrdersTableProps>(
  LazyOrdersTable,
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded mb-4"></div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded"></div>
      ))}
    </div>
  </div>
);

export const LazyVirtualizedOrdersTableComponent = withLazyLoading<OrdersTableProps>(
  LazyVirtualizedOrdersTable,
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded mb-4"></div>
    <div className="h-96 bg-gray-100 rounded"></div>
  </div>
);

export const LazyOrdersFiltersComponent = withLazyLoading<OrdersFiltersProps>(
  LazyOrdersFilters,
  <div className="animate-pulse">
    <div className="flex gap-4 mb-6">
      <div className="h-10 bg-gray-200 rounded flex-1"></div>
      <div className="h-10 bg-gray-200 rounded w-32"></div>
      <div className="h-10 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
);

export const LazyPaginationComponent = withLazyLoading<PaginationProps>(
  LazyPagination,
  <div className="animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-8 bg-gray-200 rounded w-32"></div>
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-8 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="h-8 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
);

export const LazyOrderDetailsModalComponent = withLazyLoading<OrderDetailsModalProps>(
  LazyOrderDetailsModal,
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-100 rounded"></div>
        ))}
      </div>
      <div className="flex gap-2 mt-6">
        <div className="h-10 bg-gray-200 rounded flex-1"></div>
        <div className="h-10 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  </div>
);

// Preload functions for better UX
export const preloadOrdersTable = () => {
  import('./OrdersTable');
};

export const preloadVirtualizedTable = () => {
  import('./VirtualizedOrdersTable');
};

export const preloadOrdersFilters = () => {
  import('./OrdersFilters');
};

export const preloadPagination = () => {
  import('./Pagination');
};

export const preloadOrderDetailsModal = () => {
  import('./OrderDetailsModal');
};

// Preload all components
export const preloadAllComponents = () => {
  preloadOrdersTable();
  preloadVirtualizedTable();
  preloadOrdersFilters();
  preloadPagination();
  preloadOrderDetailsModal();
};

// Component registry for dynamic loading
export const componentRegistry = {
  OrdersTable: LazyOrdersTableComponent,
  VirtualizedOrdersTable: LazyVirtualizedOrdersTableComponent,
  OrdersFilters: LazyOrdersFiltersComponent,
  Pagination: LazyPaginationComponent,
  OrderDetailsModal: LazyOrderDetailsModalComponent,
} as const;

export type ComponentName = keyof typeof componentRegistry;

// Dynamic component loader
export function loadComponent(name: ComponentName) {
  return componentRegistry[name];
}