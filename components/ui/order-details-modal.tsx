"use client";

import React from 'react';
import { X, Package, Calendar, CreditCard, Banknote, User, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import type { Order } from '@/lib/types';
import { ORDER_STATUS_CONFIG } from '@/lib/types';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
}

// Icon mapping for order status
const statusIconMap = {
  pending: Clock,
  paid: CheckCircle,
  delivered: CheckCircle,
  rejected: XCircle
};

const OrderDetailsModalComponent: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose
}) => {
  const statusInfo = ORDER_STATUS_CONFIG[order.status];
  const StatusIcon = statusIconMap[order.status];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // تم إزالة دالة handleCancel

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1B20] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold text-white">تفاصيل الطلب</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Status */}
          <div className={`p-4 rounded-xl border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
            <div className="flex items-center gap-3 mb-2">
              <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
              <span className={`text-lg font-bold ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-gray-300 text-sm">{statusInfo.description}</p>
          </div>

          {/* Game and Package Info */}
          <div className="bg-[#232329] rounded-xl p-4">
            <h3 className="text-lg font-bold text_WHITE mb-4">معلومات المنتج</h3>
            <div className="flex items-center gap-4">
              <Image
                src={order.gameId.image.secure_url}
                alt={order.gameId.name}
                width={80}
                height={80}
                className="rounded-xl object-cover"
                unoptimized
              />
              <div className="flex-1">
                <h4 className="text-white font-bold text-lg mb-1">
                  {order.gameId.name}
                </h4>
                <p className="text-gray-400 mb-2">
                  {order.packageId ? order.packageId.title : 'Steam Game'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-400">
                    {order.totalAmount} {order.packageId ? order.packageId.currency : 'USD'}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    {order.paymentMethod === 'card' ? (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>بطاقة ائتمان</span>
                      </>
                    ) : (
                      <>
                        <Banknote className="w-4 h-4" />
                        <span>دفع نقدي</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-[#232329] rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-4">معلومات الحساب</h3>
            <div className="space-y-3">
              {order.accountInfo.map((info, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#18181c] rounded-lg">
                  <span className="text-gray-400">{info.fieldName}</span>
                  <span className="text-white font-medium">{info.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-[#232329] rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-4">تاريخ الطلب</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white font-medium">تم إنشاء الطلب</p>
                  <p className="text-gray-400 text-sm">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              {order.paidAt && (
                <div className="flex items_center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white font-medium">تم الدفع</p>
                    <p className="text-gray-400 text-sm">{formatDate(order.paidAt)}</p>
                  </div>
                </div>
              )}

              {order.status === 'delivered' && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white font-medium">تم التسليم</p>
                    <p className="text-gray-400 text-sm">تم تسليم طلبك بنجاح</p>
                  </div>
                </div>
              )}

              {order.status === 'rejected' && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white font-medium">تم الرفض/الإلغاء</p>
                    <p className="text-gray-400 text-sm">
                      {order.adminNote || 'تم إلغاء الطلب'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Note */}
          {order.adminNote && (
            <div className="bg-[#232329] rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-2">ملاحظة الإدارة</h3>
              <p className="text-gray-300">{order.adminNote}</p>
            </div>
          )}

          {/* Refund Info */}
          {order.refundAmount && order.refundDate && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <h3 className="text-lg font-bold text-red-400 mb-2">معلومات الاسترداد</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">مبلغ الاسترداد:</span>
                  <span className="text-red-400 font-bold">
                    {order.refundAmount} {order.packageId ? order.packageId.currency : 'USD'}
                  </span>
                </div>
                <div className="flex justify_between">
                  <span className="text-gray-400">تاريخ الاسترداد:</span>
                  <span className="text-gray-300">{formatDate(order.refundDate)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            رقم الطلب: #{order._id}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const OrderDetailsModal = React.memo(OrderDetailsModalComponent);
OrderDetailsModal.displayName = 'OrderDetailsModal';