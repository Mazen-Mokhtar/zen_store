"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Eye, Calendar, CreditCard, Banknote, Info } from 'lucide-react';
import { Footer } from '@/components/ui/footer-section';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { NotificationToast } from '@/components/ui/notification-toast';
import { LanguageSelector } from '@/components/ui/language-selector';
import { OrderDetailsModal } from '@/components/ui/order-details-modal';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import { authService } from '@/lib/auth';
import { AuthStatus } from '@/components/ui/auth-status';

interface Order {
  _id: string;
  gameId: {
    _id: string;
    name: string;
    image: {
      secure_url: string;
    };
  };
  packageId: {
    _id: string;
    title: string;
    price: number;
    currency: string;
  };
  accountInfo: { fieldName: string; value: string }[];
  status: 'pending' | 'paid' | 'delivered' | 'rejected';
  paymentMethod: 'card' | 'cash';
  totalAmount: number;
  adminNote?: string;
  createdAt: string;
  paidAt?: string;
  refundAmount?: number;
  refundDate?: string;
}

const statusConfig = {
  pending: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    borderColor: 'border-yellow-400/20',
    icon: Clock,
    label: 'قيد الانتظار'
  },
  paid: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
    icon: CheckCircle,
    label: 'مدفوع'
  },
  delivered: {
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/20',
    icon: CheckCircle,
    label: 'تم التسليم'
  },
  rejected: {
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    borderColor: 'border-red-400/20',
    icon: XCircle,
    label: 'مرفوض'
  }
};

export default function OrdersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  // لا نعرض بيانات وهمية عند عدم تسجيل الدخول
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Update user data after component mounts (client-side only)
  useEffect(() => {
    const authState = authService.getAuthState();
    setIsAuthenticated(authState.isAuthenticated);
    if (authState.user) {
      setUserData({
        name: authState.user.name || '',
        email: authState.user.email || ''
      });
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the authService to get the token
      const token = authService.getToken();
      if (!token) {
        setError('يجب تسجيل الدخول لعرض الطلبات');
        setLoading(false);
        return;
      }

      console.log('🔍 Attempting to fetch orders with token:', {
        token: token ? 'Token exists' : 'No token',
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'N/A',
        timestamp: new Date().toISOString()
      });

      // استخدام نفس المنفذ للتغلب على مشكلة CORS
      const baseUrl = window.location.origin;
      const apiUrl = baseUrl.includes('localhost') 
        ? 'http://localhost:3000/order' 
        : `${baseUrl}/order`;
        
      console.log('🌐 Using API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // تغيير وضع الاعتماد لتجنب مشكلة CORS
        credentials: 'same-origin'
      });

      console.log('📡 Orders API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Orders API Error:', {
          status: response.status,
          error: errorData,
          timestamp: new Date().toISOString()
        });
        throw new Error(errorData.message || 'فشل في جلب الطلبات');
      }

      const data = await response.json();
      setOrders(data.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('حدث خطأ أثناء جلب الطلبات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const token = authService.getToken();
      if (!token) {
        alert('يجب تسجيل الدخول لإلغاء الطلب');
        return;
      }

      // استخدام نفس المنفذ للتغلب على مشكلة CORS
      const baseUrl = window.location.origin;
      const apiUrl = baseUrl.includes('localhost') 
        ? `http://localhost:3000/order/${orderId}/cancel` 
        : `${baseUrl}/order/${orderId}/cancel`;
      
      console.log('🌐 Using Cancel API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        // تحديث الطلب في القائمة
        setOrders(prev => prev.map(order => 
          order._id === orderId 
            ? { ...order, status: 'rejected' as const, adminNote: 'تم الإلغاء بواسطة المستخدم' }
            : order
        ));
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121218] text-white">
        <header className="fixed top-0 left-0 right-0 bg-[#121218]/80 backdrop-blur-md z-10 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={16} />
                  {t('common.back')}
                </button>
                <div className="w-px h-6 bg-gray-600"></div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded"></div>
                </div>
                <h1 className="text-xl font-bold">طلباتي</h1>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSelector />
                <AuthStatus
                  variant="compact"
                  avatarUrl="https://res.cloudinary.com/dfvzhl8oa/image/upload/v1754848996/d2090ffb-1769-4853-916c-79c2a4ae2568_gmih9f.jpg"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="pt-16">
          {/* User Info / Login Prompt */}
          <div className="w-full py-8 px-6 bg-[#1A1B20] border-b border-gray-800">
            <div className="max-w-7xl mx-auto">
              <div className="bg-[#252630] rounded-lg p-6 shadow-lg border border-gray-700">
                {isAuthenticated ? (
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold mb-2">{userData.name}</h2>
                      <p className="text-gray-400 text-sm">{userData.email}</p>
                    </div>
                    <button
                      onClick={() => router.push('/')}
                      className="px-4 py-2 bg-[#00e6c0]/10 text-[#00e6c0] border border-[#00e6c0]/30 rounded-lg hover:bg-[#00e6c0]/20 transition"
                    >
                      {t('common.back_to_home')}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold mb-2">{t('orders.login_required')}</h2>
                      <p className="text-gray-400 text-sm">{t('orders.please_login_to_continue')}</p>
                    </div>
                    <button
                      onClick={() => router.push('/signin')}
                      className="px-4 py-2 bg-[#00e6c0] text-[#151e2e] rounded-lg hover:opacity-90 transition"
                    >
                      {t('auth.login')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto mt-10 px-6 flex justify-center">
            <LoadingSpinner size="lg" text="جاري تحميل الطلبات..." />
          </div>
        </main>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#121218] text-white">
        <header className="fixed top-0 left-0 right-0 bg-[#121218]/80 backdrop-blur-md z-10 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={16} />
                  {t('common.back')}
                </button>
                <div className="w-px h-6 bg-gray-600"></div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded"></div>
                </div>
                <h1 className="text-xl font-bold">طلباتي</h1>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSelector />
                <AuthStatus
                  variant="compact"
                  avatarUrl="https://res.cloudinary.com/dfvzhl8oa/image/upload/v1754848996/d2090ffb-1769-4853-916c-79c2a4ae2568_gmih9f.jpg"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="pt-16">
          {/* User Info Box */}
          <div className="w-full py-8 px-6 bg-[#1A1B20] border-b border-gray-800">
            <div className="max-w-7xl mx-auto">
              <div className="bg-[#252630] rounded-lg p-6 shadow-lg border border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold mb-2">{userData.name}</h2>
                    <p className="text-gray-400 text-sm">{userData.email}</p>
                  </div>
                  <button
                    onClick={() => router.push('/')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium transition-colors flex items-center gap-2"
                  >
                    <Package size={16} />
                    العودة إلى الألعاب
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto mt-10 px-6">
            <ErrorMessage 
              message={error} 
              onRetry={fetchOrders} 
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121218] text-white">
      <NotificationToast />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#121218]/80 backdrop-blur-md z-10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                {t('common.back')}
              </button>
              <div className="w-px h-6 bg-gray-600"></div>
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded"></div>
              </div>
              <h1 className="text-xl font-bold">طلباتي</h1>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <AuthStatus
                variant="compact"
                avatarUrl="https://res.cloudinary.com/dfvzhl8oa/image/upload/v1754848996/d2090ffb-1769-4853-916c-79c2a4ae2568_gmih9f.jpg"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* User Info Box */}
        <div className="w-full py-8 px-6 bg-[#1A1B20] border-b border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="bg-[#252630] rounded-lg p-6 shadow-lg border border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold mb-2">{userData.name}</h2>
                  <p className="text-gray-400 text-sm">{userData.email}</p>
                </div>
                <button
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium transition-colors flex items-center gap-2"
                >
                  <Package size={16} />
                  العودة إلى الألعاب
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="max-w-7xl mx-auto mt-8 px-6">
          {error && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
              <p className="text-yellow-400 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-[#232329] rounded-3xl p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">لا توجد طلبات</h3>
              <p className="text-gray-500 mb-6">لم تقم بإنشاء أي طلبات بعد</p>
              <button 
                onClick={() => router.push('/dashboard')}
                className="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-full transition-colors"
              >
                تصفح الألعاب
              </button>
            </div>
          ) : (
            <div className="bg-[#232329] rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                  طلباتي ({orders.length})
                </h2>
              </div>
              
              <div className="mb-4 text-sm text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <p>ملاحظة: وقت الطلب معروض بتوقيت UTC-3، قد يختلف الوقت المعروض عن التوقيت المحلي الخاص بك.</p>
              </div>

              {/* Table Headers */}
              <div className="grid grid-cols-6 gap-4 mb-4 px-4 py-2 text-gray-400 text-sm font-medium border-b border-gray-700">
                <div className="col-span-2">المنتج</div>
                <div className="text-center">وقت الطلب</div>
                <div className="text-center">رقم الطلب</div>
                <div className="text-center">الحالة</div>
                <div className="text-center">القيمة</div>
              </div>
              
              {/* Orders List */}
              <div className="space-y-2">
                {orders.map((order) => {
                  const statusInfo = statusConfig[order.status];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={order._id}
                      className="grid grid-cols-6 gap-4 bg-[#18181c] rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all duration-300 cursor-pointer hover:bg-[#1f1f23] items-center"
                      onClick={() => handleOrderClick(order)}
                    >
                      {/* Product Info */}
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="relative">
                          <Image
                            src={order.gameId.image.secure_url}
                            alt={order.gameId.name}
                            width={50}
                            height={50}
                            className="rounded-lg object-cover"
                            unoptimized
                          />
                          <div className="absolute -bottom-1 -right-1 bg-[#232329] rounded-full p-1">
                            {order.paymentMethod === 'card' ? (
                              <CreditCard className="w-3 h-3 text-blue-400" />
                            ) : (
                              <Banknote className="w-3 h-3 text-green-400" />
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-bold text-white text-sm">
                            {order.gameId.name}
                          </h3>
                          <p className="text-gray-400 text-xs">
                            {order.packageId.title}
                          </p>
                        </div>
                      </div>

                      {/* Order Time */}
                      <div className="text-center text-sm text-gray-300">
                        {formatDate(order.createdAt)}
                      </div>

                      {/* Order ID */}
                      <div className="text-center font-mono text-sm text-gray-300">
                        {order._id.slice(-6).toUpperCase()}
                      </div>

                      {/* Status */}
                      <div className="text-center">
                        <div className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.color} border`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-center font-bold text-green-400">
                        {order.totalAmount} {order.packageId.currency}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowModal(false);
            setSelectedOrder(null);
          }}
          onCancel={handleCancelOrder}
        />
      )}

      <Footer />
    </div>
  );
}