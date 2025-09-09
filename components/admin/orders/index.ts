// Core components
export { OrdersTable } from './OrdersTable';
export { VirtualizedOrdersTable } from './VirtualizedOrdersTable';
export { OrdersFilters } from './OrdersFilters';
export { OrdersHeader } from './OrdersHeader';
export { OrderDetailsModal } from './OrderDetailsModal';
export { default as Pagination } from './Pagination';
export { default as ErrorBoundary, LoadingSkeleton, ErrorMessage } from './ErrorBoundary';

// Lazy-loaded components for bundle optimization
export {
  LazyOrdersTableComponent,
  LazyVirtualizedOrdersTableComponent,
  LazyOrdersFiltersComponent,
  LazyPaginationComponent,
  LazyOrderDetailsModalComponent,
  preloadOrdersTable,
  preloadVirtualizedTable,
  preloadOrdersFilters,
  preloadPagination,
  preloadOrderDetailsModal,
  preloadAllComponents,
  componentRegistry,
  loadComponent
} from './LazyComponents';

// Hooks and utilities
export { useOrders } from './useOrders';

// Types
export * from './types';
export * from './constants';