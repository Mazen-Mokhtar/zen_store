import * as React from 'react';
import { X, Check, XCircle, CreditCard, User, Package, Calendar, DollarSign, Info, Shield, Image as ImageIcon, Hash, Clock } from 'lucide-react';
import { Order } from './types';
import { statusColors, statusLabels, paymentStatusColors, paymentStatusLabels } from './constants';
import Image from 'next/image';

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
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-2xl" style={{zIndex: 3}}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  تفاصيل الطلب #{order.id.slice(-8)}
                </h2>
                <p className="text-blue-100 text-sm">معلومات شاملة عن الطلب</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-blue-200 dark:border-gray-600">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">حالة الطلب</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">حالة الطلب:</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    statusColors[order.status] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">حالة الدفع:</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    (order.paymentStatus && paymentStatusColors[order.paymentStatus]) || 'bg-gray-100 text-gray-800'
                  }`}>
                    {(order.paymentStatus && paymentStatusLabels[order.paymentStatus]) || order.paymentStatus || 'غير محدد'}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-green-200 dark:border-gray-600">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">معلومات العميل</h3>
              </div>
              <div className="space-y-3">
                {/* Customer ID */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-xs font-bold">#</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">معرف العميل</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {order.userId?._id || order.id?.slice(0, 8) || 'غير محدد'}
                    </p>
                  </div>
                </div>
                
                {/* Customer Name */}
                {(order.userName || order.userId?.email) && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">اسم العميل</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {order.userName || order.userId?.email?.split('@')[0] || 'غير محدد'}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-xs font-bold">@</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">البريد الإلكتروني</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {order.userId?.email || order.userEmail || 'غير محدد'}
                    </p>
                  </div>
                </div>
                
                {/* Phone Number */}
                {order.userId?.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400 text-xs font-bold">📱</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">رقم الهاتف</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{order.userId.phone}</p>
                    </div>
                  </div>
                )}
                
                {/* User Review Status */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">حالة المراجعة</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {order.isReviewed ? 'تمت المراجعة' : 'لم تتم المراجعة'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game and Package Information Card */}
          {(order.gameId || order.packageId) && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-indigo-200 dark:border-gray-600 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">معلومات اللعبة والحزمة</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.gameId && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-indigo-100 dark:border-gray-600 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">🎮</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">اسم اللعبة</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{order.gameId.name}</p>
                        {order.gameId.type && (
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">النوع: {order.gameId.type}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {order.packageId && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-indigo-100 dark:border-gray-600 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">اسم الحزمة</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{order.packageId.title}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Dates Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-purple-200 dark:border-gray-600 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">التواريخ المهمة</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-gray-600 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">تاريخ الطلب</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
              {order.updatedAt && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-gray-600 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">آخر تحديث</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(order.updatedAt).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {order.__v !== undefined && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-gray-600 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">v</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">إصدار البيانات</p>
                      <p className="font-semibold text-gray-900 dark:text-white">الإصدار {order.__v}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-blue-200 dark:border-gray-600 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">عناصر الطلب</h3>
            </div>
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div key={item.id || index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-gray-600 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-gray-600 rounded-full flex items-center justify-center mt-1">
                          <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white text-lg">{item.name}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">الكمية:</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">{item.quantity}</span>
                            </div>
                            {item.id && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">المعرف:</span>
                                <span className="font-mono text-xs text-gray-600 dark:text-gray-300">{item.id.slice(-8)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-green-600 dark:text-green-400 text-lg">{item.price} ر.س</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          المجموع: {(item.price * item.quantity).toFixed(2)} ر.س
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-blue-100 dark:border-gray-600 shadow-sm text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">لا توجد عناصر في هذا الطلب</p>
                </div>
              )}
            </div>
            
            {/* Payment Method */}
            <div className="mt-6 pt-4 border-t border-blue-200 dark:border-gray-600">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-gray-600 shadow-sm mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">طريقة الدفع</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {order.paymentMethod === 'wallet-transfer' ? 'تحويل محفظة إلكترونية' :
                       order.paymentMethod === 'card' ? 'بطاقة ائتمان' :
                       order.paymentMethod === 'cash' ? 'نقداً' :
                       order.paymentMethod === 'insta-transfer' ? 'تحويل إنستا' :
                       order.paymentMethod === 'fawry-transfer' ? 'تحويل فوري' :
                       order.paymentMethod || 'غير محدد'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Total Amount */}
              <div className="flex justify-between items-center bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-white" />
                  <span className="font-bold text-lg text-white">المجموع الكلي:</span>
                </div>
                <span className="font-bold text-2xl text-white">{order.totalAmount} ر.س</span>
              </div>
            </div>
          </div>
          
          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-teal-200 dark:border-gray-600 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📍</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">عنوان الشحن</h3>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-teal-100 dark:border-gray-600 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">الشارع</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{order.shippingAddress.street}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">المدينة</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{order.shippingAddress.city}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">الدولة</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{order.shippingAddress.country}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">الرمز البريدي</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{order.shippingAddress.postalCode}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Information Card */}
          {order.accountInfo && order.accountInfo.length > 0 && (
            <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-orange-200 dark:border-gray-600 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">معلومات الحساب</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.accountInfo.map((info, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-100 dark:border-gray-600 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <Info className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{info.fieldName}</p>
                        <p className="font-semibold text-gray-900 dark:text-white break-all">{info.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wallet Transfer Information */}
          {(order.paymentMethod === 'wallet-transfer' || order.paymentMethod === 'insta-transfer' || order.paymentMethod === 'fawry-transfer') && (order.walletTransferImage || order.walletTransferNumber || order.walletTransferSubmittedAt || order.nameOfInsta || order.instaTransferSubmittedAt) && (
            <div className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-purple-200 dark:border-gray-600 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">معلومات التحويل المصرفي</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Transfer Number */}
                {order.walletTransferNumber && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-gray-600 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <Hash className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">رقم التحويل</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{order.walletTransferNumber}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Instagram Name for insta-transfer */}
                {order.paymentMethod === 'insta-transfer' && order.nameOfInsta && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-gray-600 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">اسم إنستا</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{order.nameOfInsta}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Transfer Date */}
                {(order.walletTransferSubmittedAt || order.instaTransferSubmittedAt) && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-gray-600 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">تاريخ إرسال التحويل</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {new Date(order.walletTransferSubmittedAt || order.instaTransferSubmittedAt).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Transfer Image */}
              {order.walletTransferImage && (
                <div className="mt-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-gray-600 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">صورة إيصال التحويل</p>
                    </div>
                    <div className="relative group">
                      <Image 
                        src={order.walletTransferImage.secure_url} 
                        alt="إيصال التحويل المصرفي"
                        width={400}
                        height={300}
                        className="w-full max-w-md mx-auto rounded-lg border border-purple-200 dark:border-gray-600 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                        onClick={() => window.open(order.walletTransferImage?.secure_url, '_blank')}
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
                            <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">انقر على الصورة لعرضها بحجم أكبر</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin Note */}
          {order.adminNote && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-yellow-200 dark:border-gray-600 mt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">ملاحظة الإدارة</h3>
              </div>
              <p className="text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg p-4 border border-yellow-100 dark:border-gray-600">{order.adminNote}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
            {order.status === 'processing' && (
              <button
                onClick={() => handleUpdateStatus('delivered')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                disabled={loading}
              >
                <Check className="w-4 h-4" />
                تسليم الطلب
              </button>
            )}

            {order.paymentStatus === 'pending' && (
              <button
                onClick={() => handleUpdateStatus(order.status, 'تم تأكيد الدفع')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                disabled={loading}
              >
                <CreditCard className="w-4 h-4" />
                تأكيد الدفع
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-slate-600 text-white rounded-xl hover:from-gray-600 hover:to-slate-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              <X className="w-4 h-4" />
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;