import * as React from 'react';
import { X, Check, XCircle, CreditCard } from 'lucide-react';
import { Order } from './types';
import { statusColors, statusLabels, paymentStatusColors, paymentStatusLabels } from './constants';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: Order['status'], adminNote?: string) => Promise<void>;
  loading?: boolean;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
  loading = false
}) => {
  const handleUpdateStatus = async (newStatus: Order['status'], adminNote?: string) => {
    await onUpdateStatus(order.id, newStatus, adminNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              تفاصيل الطلب #{order.id.slice(-8)}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Order Status */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">حالة الطلب</h3>
              <div className="flex gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[order.status] || 'bg-gray-100 text-gray-800'
                }`}>
                  {statusLabels[order.status] || order.status}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  paymentStatusColors[order.paymentStatus] || 'bg-gray-100 text-gray-800'
                }`}>
                  {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">معلومات العميل</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">الاسم</p>
                    <p className="font-medium">{order.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                    <p className="font-medium">{order.userEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">عناصر الطلب</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">الكمية: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{item.price} ر.س</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-300">
                  <p className="font-bold text-lg">المجموع الكلي</p>
                  <p className="font-bold text-lg">{order.totalAmount} ر.س</p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            {order.accountInfo && order.accountInfo.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">معلومات الحساب</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.accountInfo.map((info, index) => (
                      <div key={index}>
                        <p className="text-sm text-gray-600">{info.fieldName}</p>
                        <p className="font-medium">{info.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Order Dates */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">تواريخ مهمة</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">تاريخ الطلب</p>
                    <p className="font-medium">{new Date(order.createdAt).toLocaleString('ar-EG')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">آخر تحديث</p>
                    <p className="font-medium">{new Date(order.updatedAt).toLocaleString('ar-EG')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Note */}
            {order.adminNote && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">ملاحظة الإدارة</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">{order.adminNote}</p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            {order.status === 'processing' && (
              <button
                onClick={() => handleUpdateStatus('delivered')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                <Check className="w-4 h-4" />
                تسليم الطلب
              </button>
            )}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <button
                onClick={() => handleUpdateStatus('cancelled')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={loading}
              >
                <XCircle className="w-4 h-4" />
                إلغاء الطلب
              </button>
            )}
            {order.paymentStatus === 'pending' && (
              <button
                onClick={() => handleUpdateStatus(order.status, 'تم تأكيد الدفع')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                disabled={loading}
              >
                <CreditCard className="w-4 h-4" />
                تأكيد الدفع
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;