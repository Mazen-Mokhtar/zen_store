'use client';

import * as React from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NotificationToast } from '@/components/ui/notification-toast';
import { 
  OrdersHeader, 
  OrdersFilters, 
  OrdersTable, 
  OrderDetailsModal,
  useOrders 
} from '../../../components/admin/orders';

export default function AdminOrdersPage() {
  const {
    orders,
    filteredOrders,
    loading,
    accessChecked,
    filters,
    selectedOrder,
    showOrderModal,
    updateFilters,
    updateOrderStatus,
    viewOrderDetails,
    closeOrderModal,
    exportOrders,
    refreshOrders
  } = useOrders();

  // Show loading while checking access
  if (!accessChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ zoom: '80%' }}>
      <OrdersHeader 
        onExport={exportOrders}
        onRefresh={refreshOrders}
      />
      
      <OrdersFilters 
        filters={filters}
        onFiltersChange={updateFilters}
      />

      <OrdersTable 
        orders={filteredOrders}
        loading={loading}
        onViewOrder={viewOrderDetails}
        onUpdateStatus={updateOrderStatus}
      />

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder}
          onClose={closeOrderModal}
          onUpdateStatus={updateOrderStatus}
          loading={loading}
        />
      )}
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}
      
      {/* Notification */}
      <NotificationToast />
    </div>
  );
}