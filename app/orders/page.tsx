"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Eye, Calendar, CreditCard, Banknote, Info } from 'lucide-react';
import { Footer } from '@/components/ui/footer-section';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { NotificationToast } from '@/components/ui/notification-toast';

import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import { authService } from '@/lib/auth';
import { AuthStatus } from '@/components/ui/auth-status';
import { orderApiService } from '@/lib/api';
import type { Order } from '@/lib/types';
import { ORDER_STATUS_CONFIG } from '@/lib/types';
import { Logo } from '@/components/ui/logo';

// Dynamic imports for better performance
const OrderDetailsModal = dynamic(() => import('@/components/ui/order-details-modal').then(mod => mod.OrderDetailsModal), {
  loading: () => <LoadingSpinner size="md" />,
  ssr: false
});

const statusConfig = ORDER_STATUS_CONFIG;

const STATUS_ICONS: Record<Order['status'], React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  processing: Clock,
  paid: CheckCircle,
  delivered: CheckCircle,
  rejected: XCircle,
};

// Memoized Order Item Component
const OrderItem = React.memo<{
  order: Order;
  onOrderClick: (order: Order) => void;
  formatDate: (dateString: string) => string;
}>(({ order, onOrderClick, formatDate }) => {
  const statusInfo = statusConfig[order.status];
  const StatusIcon = STATUS_ICONS[order.status];

  return (
    <article
      className="bg-[#18181c] rounded-lg p-3 md:p-4 border border-gray-700 hover:border-gray-600 transition-all duration-300 cursor-pointer hover:bg-[#1f1f23] focus:outline-none focus:ring-2 focus:ring-green-500"
      onClick={() => onOrderClick(order)}
      role="button"
      tabIndex={0}
      aria-label={`View order details for ${order.gameId.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOrderClick(order);
        }
      }}
    >
      {/* Mobile Layout */}
      <div className="block md:hidden space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <Image
              src={order.gameId.image?.secure_url || '/placeholder-game.jpg'}
              alt={`${order.gameId.name} game cover`}
              width={40}
              height={40}
              className="rounded-lg object-cover"
              sizes="40px"
              loading="lazy"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#232329] rounded-full p-1">
              {order.paymentMethod === 'card' ? (
                <CreditCard className="w-2 h-2 text-blue-400" />
              ) : (
                <Banknote className="w-2 h-2 text-green-400" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm truncate">
              {order.gameId.name}
            </h3>
            <p className="text-gray-400 text-xs truncate">
              {order.packageId ? order.packageId.title : 'Steam Game'}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.color} border`}>
              <StatusIcon className="w-3 h-3" />
              {statusInfo.label}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>#{order._id.slice(-6).toUpperCase()}</span>
          <span>{formatDate(order.createdAt)}</span>
          <span className="font-bold text-green-400">
            {order.totalAmount} {order.currency || 'EGP'}
          </span>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-6 gap-4 items-center">
        {/* Product Info */}
        <div className="col-span-2 flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <Image
              src={order.gameId.image?.secure_url || '/placeholder-game.jpg'}
              alt={`${order.gameId.name} game cover`}
              width={50}
              height={50}
              className="rounded-lg object-cover"
              sizes="50px"
              loading="lazy"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#232329] rounded-full p-1">
              {order.paymentMethod === 'card' ? (
                <CreditCard className="w-3 h-3 text-blue-400" />
              ) : (
                <Banknote className="w-3 h-3 text-green-400" />
              )}
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm truncate">
              {order.gameId.name}
            </h3>
            <p className="text-gray-400 text-xs truncate">
              {order.packageId ? order.packageId.title : 'Steam Game'}
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
          {order.totalAmount} {order.currency || 'EGP'}
        </div>
      </div>
    </article>
  );
});

OrderItem.displayName = 'OrderItem';

// Memoized User Info Component
const UserInfoBox = React.memo<{
  isAuthenticated: boolean;
  userData: { name: string; email: string };
  onBackToGames: () => void;
}>(({ isAuthenticated, userData, onBackToGames }) => (
  <section className="w-full py-6 md:py-8 px-4 md:px-6 bg-[#1A1B20] border-b border-gray-800" aria-label="User information">
    <div className="max-w-7xl mx-auto">
      <div className="bg-[#252630] rounded-lg p-4 md:p-6 shadow-lg border border-gray-700">
        {isAuthenticated ? (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg md:text-xl font-bold mb-2 truncate">{userData.name}</h2>
              <p className="text-gray-400 text-sm truncate">{userData.email}</p>
            </div>
            <button
              onClick={onBackToGames}
              className="w-full md:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Return to games"
            >
              <Package size={16} />
              العودة إلى الألعاب
            </button>
          </div>
        ) : null}
      </div>
    </div>
  </section>
));

UserInfoBox.displayName = 'UserInfoBox';

function OrdersPageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

      const result = await orderApiService.getUserOrders();
      if (result?.success) {
        setOrders(result.data || []);
      } else {
        setError('حدث خطأ أثناء جلب الطلبات');
      }
    } catch (err) {
      setError('حدث خطأ أثناء جلب الطلبات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOrderClick = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  }, []);

  const handleBackToGames = useCallback(() => {
    router.push('/category');
  }, [router]);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setSelectedOrder(null);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const renderedOrders = useMemo(() => 
    orders.map((order) => (
      <OrderItem
        key={order._id}
        order={order}
        onOrderClick={handleOrderClick}
        formatDate={formatDate}
      />
    )), 
    [orders, handleOrderClick, formatDate]
  );

  if (loading) {
    return (
      <>
        <Head>
          <title>My Orders - Zen Store</title>
          <meta name="description" content="View and manage your game orders" />
        </Head>
        <div className="min-h-screen bg-[#121218] text-white">
          <header className="fixed top-0 left-0 right-0 bg-[#121218]/80 backdrop-blur-md z-10 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-2 md:gap-4">
                  <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    aria-label="Go back"
                  >
                    <ArrowLeft size={16} />
                    {t('common.back')}
                  </button>
                  <div className="w-px h-6 bg-gray-600"></div>
                  <Logo size="xl" showText={false} />
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <AuthStatus
                    variant="compact"
                    avatarUrl="https://res.cloudinary.com/dfvzhl8oa/image/upload/v1754848996/d2090ffb-1769-4853-916c-79c2a4ae2568_gmih9f.jpg"
                  />
                </div>
              </div>
            </div>
          </header>

          <main className="pt-16">
            <UserInfoBox
              isAuthenticated={isAuthenticated}
              userData={userData}
              onBackToGames={handleBackToGames}
            />
            
            <div className="max-w-7xl mx-auto mt-6 md:mt-10 px-4 md:px-6 flex justify-center">
              <LoadingSpinner size="lg" text="جاري تحميل الطلبات..." />
            </div>
          </main>
        </div>
      </>
    );
  }

  if (error && orders.length === 0) {
    return (
      <>
        <Head>
          <title>My Orders - Error - Zen Store</title>
          <meta name="description" content="Error loading orders" />
        </Head>
        <div className="min-h-screen bg-[#121218] text-white">
          <header className="fixed top-0 left-0 right-0 bg-[#121218]/80 backdrop-blur-md z-10 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-2 md:gap-4">
                  <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={16} />
                    {t('common.back')}
                  </button>
                  <div className="w-px h-6 bg-gray-600"></div>
                  <Logo size="xl" showText={false} />
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <AuthStatus
                    variant="compact"
                    avatarUrl="https://res.cloudinary.com/dfvzhl8oa/image/upload/v1754848996/d2090ffb-1769-4853-916c-79c2a4ae2568_gmih9f.jpg"
                  />
                </div>
              </div>
            </div>
          </header>

          <main className="pt-16">
            <UserInfoBox
              isAuthenticated={isAuthenticated}
              userData={userData}
              onBackToGames={handleBackToGames}
            />
            
            <div className="max-w-7xl mx-auto mt-6 md:mt-10 px-4 md:px-6">
              <ErrorMessage 
                message={error} 
                onRetry={fetchOrders} 
              />
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My Orders ({orders.length}) - Zen Store</title>
        <meta name="description" content={`View and manage your ${orders.length} game orders. Track order status and delivery information.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={`My Orders (${orders.length}) - Zen Store`} />
        <meta property="og:description" content="View and manage your game orders" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/orders" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-[#121218] text-white">
        <NotificationToast />
        
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 bg-[#121218]/80 backdrop-blur-md z-10 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                  aria-label="Go back to previous page"
                >
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">{t('common.back')}</span>
                </button>
                <div className="w-px h-6 bg-gray-600"></div>
                <Logo size="xl" showText={false} />
              </div>
              <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
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
          <UserInfoBox
            isAuthenticated={isAuthenticated}
            userData={userData}
            onBackToGames={handleBackToGames}
          />

          {/* Orders Section */}
          <div className="max-w-7xl mx-auto mt-6 md:mt-8 px-4 md:px-6">
            {error && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6" role="alert">
                <p className="text-yellow-400 text-sm">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-[#232329] rounded-2xl md:rounded-3xl p-8 md:p-12 text-center">
                <Package className="w-12 md:w-16 h-12 md:h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-lg md:text-xl font-bold text-gray-400 mb-2">لا توجد طلبات</h2>
                <p className="text-gray-500 mb-4 md:mb-6 text-sm md:text-base">لم تقم بإنشاء أي طلبات بعد</p>
                <button 
                  onClick={() => router.push('/category')}
                  className="bg-green-500 hover:bg-green-600 text-black font-bold py-2 md:py-3 px-4 md:px-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                  aria-label="Browse available games"
                >
                  تصفح الألعاب
                </button>
              </div>
            ) : (
              <div className="bg-[#232329] rounded-2xl md:rounded-3xl p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
                    <div className="w-2 h-6 md:h-8 bg-green-500 rounded-full"></div>
                    طلباتي ({orders.length})
                  </h2>
                </div>
                
                <div className="mb-4 text-xs md:text-sm text-gray-400 flex items-start md:items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 md:mt-0" />
                  <p>ملاحظة: وقت الطلب معروض بتوقيت UTC-3، قد يختلف الوقت المعروض عن التوقيت المحلي الخاص بك.</p>
                </div>

                {/* Table Headers - Desktop Only */}
                <div className="hidden md:grid md:grid-cols-6 gap-4 mb-4 px-4 py-2 text-gray-400 text-sm font-medium border-b border-gray-700">
                  <div className="col-span-2">المنتج</div>
                  <div className="text-center">وقت الطلب</div>
                  <div className="text-center">رقم الطلب</div>
                  <div className="text-center">الحالة</div>
                  <div className="text-center">القيمة</div>
                </div>
                
                {/* Orders List */}
                <div className="space-y-2 md:space-y-3" role="list" aria-label="Your orders">
                  {renderedOrders}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Order Details Modal */}
        {showModal && selectedOrder && (
          <Suspense fallback={<LoadingSpinner size="md" />}>
            <OrderDetailsModal
              order={selectedOrder}
              onClose={handleModalClose}
            />
          </Suspense>
        )}

        <Footer />
      </div>
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121218] text-white flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading orders..." />
      </div>
    }>
      <OrdersPageContent />
    </Suspense>
  );
}