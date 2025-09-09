'use client';

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NotificationToast } from '@/components/ui/notification-toast';
import { 
  OrdersHeader, 
  ErrorBoundary,
  LoadingSkeleton,
  ErrorMessage,
  useOrders 
} from '../../../components/admin/orders';
import { sanitizeInput } from '@/lib/security';
import { 
  LazyOrdersFiltersComponent,
  LazyOrdersTableComponent,
  LazyVirtualizedOrdersTableComponent,
  LazyPaginationComponent,
  LazyOrderDetailsModalComponent,
  preloadAllComponents
} from '@/components/admin/orders/LazyComponents';

// Constants for pagination
const DEFAULT_ITEMS_PER_PAGE = 10;
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50, 100];

// Memoized components for better performance
const MemoizedOrdersHeader = React.memo(OrdersHeader);

export default function AdminOrdersPage() {
  const [error, setError] = useState<string | null>(null);

  const {
    orders,
    filteredOrders,
    loading,
    accessChecked,
    filters,
    selectedOrder,
    showOrderModal,
    pagination,
    updateFilters,
    updateOrderStatus,
    updatePagination,
    updateSort,
    viewOrderDetails,
    closeOrderModal,
    exportOrders,
    refreshOrders
  } = useOrders();

  // Preload components on mount for better UX
  React.useEffect(() => {
    preloadAllComponents();
  }, []);

  // Handle page change with server-side pagination
  const handlePageChange = useCallback(async (page: number) => {
    if (!pagination) return;
    
    const sanitizedPage = Math.max(1, Math.min(page, pagination.totalPages));
    setError(null);
    
    try {
      await updatePagination(sanitizedPage);
      // Scroll to top when page changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('حدث خطأ أثناء تغيير الصفحة');
    }
  }, [pagination, updatePagination]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback(async (newItemsPerPage: number) => {
    if (ITEMS_PER_PAGE_OPTIONS.includes(newItemsPerPage)) {
      setError(null);
      try {
        await updatePagination(1, newItemsPerPage); // Reset to first page with new limit
      } catch (err) {
        setError('حدث خطأ أثناء تغيير عدد العناصر');
      }
    }
  }, [updatePagination]);

  // Enhanced order status update with error handling
  const handleUpdateOrderStatus = useCallback(async (orderId: string, status: string, adminNote?: string) => {
    try {
      setError(null);
      const sanitizedOrderId = sanitizeInput(orderId);
      const sanitizedStatus = sanitizeInput(status);
      const sanitizedNote = adminNote ? sanitizeInput(adminNote) : undefined;
      
      await updateOrderStatus(sanitizedOrderId, sanitizedStatus as any, sanitizedNote);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث حالة الطلب';
      setError(errorMessage);
      console.error('Error updating order status:', err);
    }
  }, [updateOrderStatus]);

  // Enhanced filters update with error handling
  const handleFiltersChange = useCallback(async (newFilters: any) => {
    try {
      setError(null);
      await updateFilters(newFilters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء تطبيق المرشحات';
      setError(errorMessage);
      console.error('Error updating filters:', err);
    }
  }, [updateFilters]);

  // Enhanced refresh with error handling
  const handleRefresh = useCallback(async () => {
    try {
      setError(null);
      await refreshOrders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث البيانات';
      setError(errorMessage);
      console.error('Error refreshing orders:', err);
    }
  }, [refreshOrders]);

  // Enhanced export with error handling
  const handleExport = useCallback(async () => {
    try {
      setError(null);
      await exportOrders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء تصدير البيانات';
      setError(errorMessage);
      console.error('Error exporting orders:', err);
    }
  }, [exportOrders]);

  // Error boundary error handler
  const handleError = useCallback((error: Error, errorInfo: any) => {
    console.error('Admin Orders Page Error:', error, errorInfo);
    setError('حدث خطأ غير متوقع في الصفحة');
  }, []);

  // Retry error handler
  const handleRetryError = useCallback(() => {
    setError(null);
    handleRefresh();
  }, [handleRefresh]);

  // Show loading while checking access
  if (!accessChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Checking access permissions">
        <LoadingSpinner />
        <span className="sr-only">جاري التحقق من صلاحيات الوصول...</span>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={handleError}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">📋</span>
                  </div>
                  إدارة الطلبات
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  عرض وإدارة جميع طلبات العملاء
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <ErrorMessage 
                message={error} 
                onRetry={handleRetryError}
                className="mb-4"
              />
            )}

            {/* Orders Header */}
            <Suspense fallback={<LoadingSkeleton rows={1} />}>
              <MemoizedOrdersHeader 
                onExport={handleExport}
                onRefresh={handleRefresh}
              />
            </Suspense>
            
            {/* Orders Filters */}
            <Suspense fallback={<LoadingSkeleton rows={1} />}>
              <LazyOrdersFiltersComponent 
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </Suspense>

            {/* Orders Table - Always use regular table with server-side pagination */}
            <Suspense fallback={<LoadingSkeleton rows={5} />}>
              <LazyOrdersTableComponent 
                orders={filteredOrders}
                loading={loading}
                onViewOrder={viewOrderDetails}
                onUpdateStatus={handleUpdateOrderStatus}
                currentPage={pagination?.page || 1}
                itemsPerPage={pagination?.limit || 20}
              />
            </Suspense>

            {/* Pagination - Always show when we have pagination data */}
            {pagination && pagination.total > 0 && (
              <LazyPaginationComponent
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                disabled={loading}
              />
            )}

            {/* Order Details Modal */}
            {showOrderModal && selectedOrder && (
              <Suspense fallback={null}>
                <LazyOrderDetailsModalComponent 
                  order={selectedOrder}
                  onClose={closeOrderModal}
                  onUpdateStatus={handleUpdateOrderStatus}
                  loading={loading}
                />
              </Suspense>
            )}
          </div>
        </div>
        
        {/* Loading Overlay */}
        {loading && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            role="status"
            aria-label="Processing request"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
              <LoadingSpinner />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                جاري المعالجة...
              </p>
            </div>
          </div>
        )}
        
        {/* Notification */}
        <NotificationToast />
      </div>
    </ErrorBoundary>
  );
}
