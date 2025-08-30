'use client';

import React from 'react';
import { FiEye, FiCheck, FiX, FiClock, FiRefreshCw } from 'react-icons/fi';
import { Order } from './types';
import { statusColors, statusLabels, paymentStatusColors, paymentStatusLabels } from './constants';

interface OrdersTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: Order['status'], adminNote?: string) => void;
  loading?: boolean;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onViewOrder,
  onUpdateStatus,
  loading = false
}) => {
  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    onUpdateStatus(orderId, newStatus);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="mr-2 text-gray-600 dark:text-gray-400">جاري تحميل الطلبات...</span>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>لا توجد طلبات متاحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                رقم الطلب
              </th>
              <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                العميل
              </th>
              <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                اللعبة
              </th>
              <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                الحزمة
              </th>
              <th className="hidden xl:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                معلومات الحساب
              </th>
              <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                المبلغ الإجمالي
              </th>
              <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                الحالة
              </th>
              <th className="hidden xl:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                حالة الدفع
              </th>
              <th className="hidden xl:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                التاريخ
              </th>
              <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  #{order.id}
                </td>
                <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{order.userName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {typeof order.userId === 'object' ? order.userId.email : order.userEmail}
                    </div>
                    {typeof order.userId === 'object' && order.userId.phone && (
                      <div className="text-xs text-gray-400">{order.userId.phone}</div>
                    )}
                  </div>
                </td>
                <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {order.gameId?.name || 'غير محدد'}
                </td>
                <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {order.packageId?.title || 'غير محدد'}
                </td>
                <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                  {order.accountInfo && order.accountInfo.length > 0 ? (
                    <div className="text-xs">
                      {order.accountInfo.map((info, index) => (
                        <div key={info._id} className="mb-1">
                          <span className="font-medium text-gray-600 dark:text-gray-400">{info.fieldName}:</span>
                          <span className="text-gray-900 dark:text-white ml-1">{info.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">لا توجد معلومات</span>
                  )}
                </td>
                <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ${order.totalAmount.toFixed(2)}
                </td>
                <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 xl:gap-2">
                    {order.status === 'delivered' && (
                      <FiCheck className="w-4 h-4 text-green-500" />
                    )}
                    {order.status === 'pending' && (
                      <FiClock className="w-4 h-4 text-yellow-500" />
                    )}
                    {order.status === 'processing' && (
                      <FiRefreshCw className="w-4 h-4 text-blue-500" />
                    )}
                    {order.status === 'cancelled' && (
                      <FiX className="w-4 h-4 text-red-500" />
                    )}
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 ${statusColors[order.status]}`}
                    >
                      <option value="pending">في الانتظار</option>
                      <option value="processing">قيد المعالجة</option>
                      <option value="delivered">تم التسليم</option>
                      <option value="cancelled">ملغي</option>
                      <option value="rejected">مرفوض</option>
                    </select>
                  </div>
                </td>
                <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[order.paymentStatus]}`}>
                    {paymentStatusLabels[order.paymentStatus]}
                  </span>
                </td>
                <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                </td>
                <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onViewOrder(order)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    <FiEye className="w-4 h-4" />
                    <span className="hidden sm:inline">عرض</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};