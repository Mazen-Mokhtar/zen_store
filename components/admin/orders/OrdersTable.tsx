'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { FiEye, FiCheck, FiX, FiClock, FiRefreshCw, FiUser, FiCalendar, FiDollarSign, FiChevronDown } from 'react-icons/fi';
import { Order, SortField, SortDirection } from './types';
import { statusColors, statusLabels, paymentStatusColors, paymentStatusLabels } from './constants';
import { sanitizeInput } from '@/lib/security';

interface OrdersTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: Order['status'], adminNote?: string) => void;
  loading?: boolean;
  currentPage?: number;
  itemsPerPage?: number;
  // Additional props for compatibility with types.ts
  onStatusUpdate?: (orderId: string, status: Order['status'], adminNote?: string) => Promise<void>;
  onViewDetails?: (order: Order) => void;
  sort?: { field: SortField; direction: SortDirection };
  onSortChange?: (sort: { field: SortField; direction: SortDirection }) => void;
}

// Mobile Order Card Component
const MobileOrderCard = memo<{
  order: Order;
  index: number;
  onViewOrder: (order: Order) => void;
  onStatusChange: (orderId: string, newStatus: Order['status']) => void;
}>(({ order, index, onViewOrder, onStatusChange }) => {
  const handleStatusChange = useCallback((newStatus: Order['status']) => {
    onStatusChange(order.id, newStatus);
  }, [order.id, onStatusChange]);

  const handleViewOrder = useCallback(() => {
    onViewOrder(order);
  }, [order, onViewOrder]);

  const statusIcon = useMemo(() => {
    switch (order.status) {
      case 'pending': return <FiClock className="w-4 h-4" />;
      case 'processing': return <FiRefreshCw className="w-4 h-4" />;
      case 'paid': return <FiCheck className="w-4 h-4" />;
      case 'delivered': return <FiCheck className="w-4 h-4" />;
      case 'rejected': return <FiX className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  }, [order.status]);

  const formattedDate = useMemo(() => {
    return new Date(order.createdAt).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [order.createdAt]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200"
         role="listitem"
         aria-label={`Order ${order.id.slice(-8)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm" aria-label={`Order ${index + 1}`}>#{index + 1}</span>
          </div>
          <div className="mr-3">
            <div className="text-sm font-bold text-gray-900 dark:text-white">#{order.id.slice(-8)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">معرف الطلب</div>
          </div>
        </div>
        <button
          onClick={handleViewOrder}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          aria-label={`View order ${order.id.slice(-8)}`}>
          عرض
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">العميل:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{order.userId?.email || 'غير محدد'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">المبلغ:</span>
          <span className="text-sm font-bold text-green-600 dark:text-green-400">${order.totalAmount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">التاريخ:</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">{formattedDate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">الحالة:</span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
            {statusIcon}
            <span className="mr-1">{statusLabels[order.status as keyof typeof statusLabels]}</span>
          </span>
        </div>
      </div>
    </div>
  );
});

MobileOrderCard.displayName = 'MobileOrderCard';

// Desktop Table Row Component
const DesktopOrderRow = memo<{
  order: Order;
  index: number;
  onViewOrder: (order: Order) => void;
  onStatusChange: (orderId: string, newStatus: Order['status']) => void;
}>(({ order, index, onViewOrder, onStatusChange }) => {
  const handleViewClick = useCallback(() => {
    onViewOrder(order);
  }, [order, onViewOrder]);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = sanitizeInput(e.target.value) as Order['status'];
    onStatusChange(order.id, newStatus);
  }, [order.id, onStatusChange]);

  const statusIcon = useMemo(() => {
    switch (order.status) {
      case 'pending': return <FiClock className="w-4 h-4" />;
      case 'processing': return <FiRefreshCw className="w-4 h-4" />;
      case 'paid': return <FiCheck className="w-4 h-4" />;
      case 'delivered': return <FiCheck className="w-4 h-4" />;
      case 'rejected': return <FiX className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  }, [order.status]);

  const formattedDate = useMemo(() => {
    return new Date(order.createdAt).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [order.createdAt]);

  return (
    <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200"
        role="row">
      <td className="px-6 py-5 whitespace-nowrap" role="gridcell">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm" aria-label={`Order ${index + 1}`}>#{index + 1}</span>
          </div>
          <div className="mr-4 min-w-0 flex-1">
            <div className="text-sm font-bold text-gray-900 dark:text-white truncate" title={order.id}>
              #{order.id.slice(-8)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              معرف الطلب
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 whitespace-nowrap" role="gridcell">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <FiUser className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="mr-4 min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={order.userId?.email || 'غير محدد'}>
              {order.userId?.email || 'غير محدد'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {order.userId?.phone || 'لا يوجد رقم هاتف'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 whitespace-nowrap" role="gridcell">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <FiDollarSign className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="mr-4">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              ${order.totalAmount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              المبلغ الإجمالي
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 whitespace-nowrap" role="gridcell">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
            <FiCalendar className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="mr-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {formattedDate}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              تاريخ الطلب
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 whitespace-nowrap" role="gridcell">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
          {statusIcon}
          <span className="mr-2">{statusLabels[order.status as keyof typeof statusLabels]}</span>
        </span>
      </td>
      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium" role="gridcell">
        <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
          <button
            onClick={handleViewClick}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            aria-label={`View order ${order.id.slice(-8)}`}>
            <FiEye className="w-4 h-4 ml-2" aria-hidden="true" />
            عرض
          </button>
        </div>
      </td>
    </tr>
  );
});

DesktopOrderRow.displayName = 'DesktopOrderRow';

export const OrdersTable: React.FC<OrdersTableProps> = memo(({
  orders,
  onViewOrder,
  onUpdateStatus,
  loading = false,
  currentPage = 1,
  itemsPerPage = 10
}) => {
  const handleStatusChange = useCallback((orderId: string, newStatus: Order['status']) => {
    onUpdateStatus(orderId, newStatus);
  }, [onUpdateStatus]);

  // Use orders directly since we're using server-side pagination
  const displayOrders = orders;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Mobile View */}
      <div className="block lg:hidden">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">الطلبات</h3>
          <div className="space-y-4" role="list" aria-label="Orders list">
            {displayOrders.map((order, index) => (
              <MobileOrderCard
                key={order.id}
                order={order}
                index={index}
                onViewOrder={onViewOrder}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" role="table">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr role="row">
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" role="columnheader">
                  معرف الطلب
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" role="columnheader">
                  العميل
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" role="columnheader">
                  المبلغ
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" role="columnheader">
                  التاريخ
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" role="columnheader">
                  الحالة
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" role="columnheader">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" role="rowgroup">
              {displayOrders.map((order, index) => (
                <DesktopOrderRow
                  key={order.id}
                  order={order}
                  index={index}
                  onViewOrder={onViewOrder}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <FiRefreshCw className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد طلبات</h3>
            <p className="text-sm">لم يتم العثور على أي طلبات في الوقت الحالي.</p>
          </div>
        </div>
      )}
    </div>
  );
});

OrdersTable.displayName = 'OrdersTable';