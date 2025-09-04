'use client';

import React from 'react';
import { FiEye, FiCheck, FiX, FiClock, FiRefreshCw, FiUser, FiCalendar, FiDollarSign } from 'react-icons/fi';
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Mobile View */}
      <div className="block md:hidden">
        <div className="space-y-4 p-4">
          {orders.map((order, index) => (
            <div key={order.id} className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 border border-blue-200 dark:border-gray-600 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">رقم الطلب</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400">#{order.id.slice(-8)}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  statusColors[order.status] || 'bg-gray-100 text-gray-800'
                }`}>
                  {statusLabels[order.status] || order.status}
                </div>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <FiUser className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{order.userId?.email || 'غير محدد'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiDollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                  className={`flex-1 text-xs font-semibold rounded-lg px-2 py-1 border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${statusColors[order.status]}`}
                >
                  <option value="pending">في الانتظار</option>
                  <option value="processing">قيد المعالجة</option>
                  <option value="delivered">تم التسليم</option>
                  <option value="cancelled">ملغي</option>
                  <option value="rejected">مرفوض</option>
                </select>
                <button
                  onClick={() => onViewOrder(order)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold text-xs flex items-center gap-1"
                >
                  <FiEye className="w-3 h-3" />
                  عرض
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">
                <div className="flex items-center justify-end gap-2">
                  <span>رقم الطلب</span>
                  <FiUser className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">
                <div className="flex items-center justify-end gap-2">
                  <span>العميل</span>
                  <FiUser className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">
                <div className="flex items-center justify-end gap-2">
                  <span>المبلغ الإجمالي</span>
                  <FiDollarSign className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">
                الحالة
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">
                <div className="flex items-center justify-end gap-2">
                  <span>تاريخ الإنشاء</span>
                  <FiCalendar className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {orders.map((order, index) => (
              <tr key={order.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200">
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">#{index + 1}</span>
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">#{order.id.slice(-8)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">معرف الطلب</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <FiUser className="w-5 h-5 text-white" />
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {order.userId?.email || 'غير محدد'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {order.userId?.phone || 'لا يوجد رقم هاتف'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <FiDollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div className="mr-4">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">${order.totalAmount.toFixed(2)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">المبلغ الإجمالي</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {order.status === 'delivered' && (
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <FiCheck className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                      {order.status === 'pending' && (
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <FiClock className="w-5 h-5 text-yellow-600" />
                        </div>
                      )}
                      {order.status === 'processing' && (
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiRefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                        </div>
                      )}
                      {order.status === 'cancelled' && (
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <FiX className="w-5 h-5 text-red-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                        className={`text-sm font-semibold rounded-lg px-3 py-2 border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${statusColors[order.status]}`}
                      >
                        <option value="pending">في الانتظار</option>
                        <option value="processing">قيد المعالجة</option>
                        <option value="delivered">تم التسليم</option>
                        <option value="cancelled">ملغي</option>
                        <option value="rejected">مرفوض</option>
                      </select>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                      <FiCalendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <button
                    onClick={() => onViewOrder(order)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <FiEye className="w-4 h-4" />
                    <span>عرض التفاصيل</span>
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