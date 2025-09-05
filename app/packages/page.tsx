"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import styles from './packages.module.css';
import { apiService } from '@/lib/api';
import type { Package, Game } from '@/lib/api';
import { orderApiService } from '@/lib/api';
import type { CreateOrderData } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { authService } from '@/lib/auth';
import { AuthStatus } from '@/components/ui/auth-status';
import { LoginRequiredModal } from '@/components/ui/login-required-modal';
import { OrderConfirmationModal } from '@/components/ui/order-confirmation-modal';
import { NotificationToast } from '@/components/ui/notification-toast';
import { notificationService } from '@/lib/notifications';
import { logger } from '@/lib/utils';
import { WalletTransferData } from '@/components/payment/WalletTransferForm';
import { WalletTransferType } from '@/components/payment/WalletTransferOptions';
import { Logo } from '@/components/ui/logo';
import Image from 'next/image';

export default function PackagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = searchParams.get('gameId');
  const gameName = searchParams.get('gameName');
  
  const [selected, setSelected] = useState<string | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State to hold dynamic account info fields values
  const [accountInfo, setAccountInfo] = useState<Record<string, string>>({});
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    setIsAuthenticated(authService.isAuthenticated());

    const fetchData = async () => {
      if (!gameId) {
        setError('Game ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const gameResponse = await apiService.getGameById(gameId);
        if (gameResponse.success && gameResponse.data) {
          setGame(gameResponse.data);
        }

        const packagesResponse = await apiService.getPackagesByGameId(gameId);
        if (packagesResponse.success) {
          setPackages(packagesResponse.data);
        } else {
          setError('Failed to fetch packages');
        }
      } catch (err) {
        logger.error('Error fetching data:', err);
        setError('Failed to load game data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameId, isClient]);

  const handleCreateOrder = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!selected || !game) {
      notificationService.showWarning('يرجى اختيار باقة أولاً');
      return;
    }

    const missingFields: string[] = [];
    const invalidEmailFields: string[] = [];
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (game.accountInfoFields) {
      game.accountInfoFields.forEach(field => {
        const fieldValue = accountInfo[field.fieldName];
        const fieldNameLower = field.fieldName.toLowerCase();
        
        if (field.isRequired && (!fieldValue || fieldValue.trim() === '')) {
          missingFields.push(field.fieldName);
        }
        
        if (fieldValue && fieldValue.trim() !== '' && 
            (fieldNameLower.includes('email') || fieldNameLower.includes('gmail'))) {
          if (!emailRegex.test(fieldValue.trim())) {
            invalidEmailFields.push(field.fieldName);
          }
        }
      });
    }

    if (missingFields.length > 0) {
      notificationService.showWarning(`يرجى ملء الحقول المطلوبة: ${missingFields.join(', ')}`);
      return;
    }
    
    if (invalidEmailFields.length > 0) {
      notificationService.showError(`تنسيق البريد الإلكتروني غير صحيح في الحقول: ${invalidEmailFields.join(', ')}`);
      return;
    }

    setShowConfirmationModal(true);
  };

  const handleConfirmOrder = async (paymentMethod: 'card' | 'wallet-transfer' = 'card') => {
    if (!selected || !game) return;

    try {
      setIsCreatingOrder(true);
      

      const orderData: CreateOrderData = {
        gameId: gameId as string,
        packageId: selected,
        accountInfo: Object.entries(accountInfo).map(([fieldName, value]) => ({
          fieldName,
          value: value ? value.toString() : '' // Ensure value is a non-null string
        })),
        paymentMethod: 'card',
        note: `طلب ${game.name} - ${packages.find(p => p._id === selected)?.title}`
      };

      const response = await orderApiService.createOrder(orderData);

      if (response.success) {
        notificationService.showSuccess('تم إنشاء الطلب بنجاح!');
        
        setCurrentOrderId(response.data._id);
        
        if (paymentMethod === 'card') {
          setShowConfirmationModal(false);
          
          try {
            const checkoutResponse = await orderApiService.checkout(response.data._id);
            
            if (checkoutResponse.success && checkoutResponse.data?.url) {
              window.location.href = checkoutResponse.data.url;
            } else {
              const errorMsg = checkoutResponse.error || 'فشل في إنشاء جلسة الدفع';
              notificationService.showError(errorMsg);
            }
          } catch (checkoutError) {
            notificationService.showError('حدث خطأ أثناء توجيهك إلى صفحة الدفع');
          }
        } else {
          // البقاء في الصفحة لإكمال wallet transfer
        }
      } else {
        const errorMsg = response.error || 'فشل في إنشاء الطلب';
        logger.error('❌ Order creation failed:', errorMsg);
        notificationService.showError(errorMsg);
      }
    } catch (error) {
      logger.error('❌ Error in handleConfirmOrder:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      let errorMessage = 'حدث خطأ أثناء إنشاء الطلب';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      notificationService.showError(errorMessage);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Handle creating order with wallet transfer in one step
  const handleCreateOrderWithTransfer = async (orderData: any, transferData: WalletTransferData, transferType: WalletTransferType): Promise<void> => {
    if (!selected || !game) {
      notificationService.error('خطأ', 'يرجى اختيار باقة أولاً');
      return;
    }

    const selectedPackage = packages.find(p => p._id === selected);
    if (!selectedPackage) {
      notificationService.error('خطأ', 'الباقة المحددة غير موجودة');
      return;
    }

    try {
      setIsCreatingOrder(true);

      
      // Create order data with correct structure
      const createOrderData: CreateOrderData = {
        gameId: game._id,
        packageId: selectedPackage._id,
        accountInfo: Object.entries(accountInfo).map(([fieldName, value]) => ({
          fieldName,
          value: value ? value.toString() : ''
        })),
        paymentMethod: transferType,
        note: ''
      };

      // Use the new API method to create order with transfer
      const response = await orderApiService.createOrderWithWalletTransfer(
        createOrderData,
        {
          walletTransferNumber: transferData.walletTransferNumber,
          ...(transferData.nameOfInsta && { nameOfInsta: transferData.nameOfInsta })
        },
        transferData.walletTransferImage
      );
      

      notificationService.success('نجح', 'تم إنشاء الطلب وإرسال بيانات التحويل بنجاح');
      setShowConfirmationModal(false);
    } catch (error) {
      console.error('❌ [Packages] خطأ في إنشاء الطلب مع التحويل:', error);
      logger.error('Error creating order with wallet transfer:', error);
      notificationService.error('خطأ', 'حدث خطأ أثناء إنشاء الطلب مع بيانات التحويل');
      throw error;
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Handle wallet transfer submission
  const handleWalletTransferSubmit = async (data: WalletTransferData, transferType: WalletTransferType): Promise<void> => {

    if (!selected || !game) {
      notificationService.error('خطأ', 'يرجى اختيار باقة أولاً');
      return;
    }

    const selectedPackage = packages.find(p => p._id === selected);
    if (!selectedPackage) {
      notificationService.error('خطأ', 'الباقة المحددة غير موجودة');
      return;
    }

    if (!currentOrderId) {

      notificationService.error('خطأ', 'لم يتم العثور على معرف الطلب');
      return;
    }

    try {
      setIsCreatingOrder(true);

      // Submit wallet transfer using the API service
      const response = await orderApiService.submitWalletTransfer(
        currentOrderId,
        {
          walletTransferNumber: data.walletTransferNumber,
          ...(data.nameOfInsta && { nameOfInsta: data.nameOfInsta })
        },
        data.walletTransferImage
      );
      

      notificationService.success('نجح', 'تم إرسال بيانات التحويل بنجاح');
      setShowConfirmationModal(false);
    } catch (error) {

      logger.error('Error submitting wallet transfer:', error);
      notificationService.error('خطأ', 'حدث خطأ أثناء إرسال بيانات التحويل');
      throw error;
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Show loading until client has mounted and gameId is checked
  if (!isClient || (!gameId && isClient)) {
    if (!isClient) {
      return (
        <div className={styles.customPackagesBg + " min-h-screen text-white flex items-center justify-center"}>
          <LoadingSpinner size="lg" text="جاري التحميل..." />
        </div>
      );
    }
    
    // Client has mounted but no gameId
    if (!gameId) {
      return (
        <div className={styles.customPackagesBg + " min-h-screen text-white flex items-center justify-center"}>
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">خطأ</h1>
            <p className="mb-4">لم يتم تحديد اللعبة</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-[#00e6c0] text-[#151e2e] px-6 py-2 rounded hover:bg-[#00e6c0]/80 transition"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      );
    }
  }

  if (loading) {
    return (
      <div className={styles.customPackagesBg + " min-h-screen text-white flex items-center justify-center"}>
        <LoadingSpinner size="lg" text="جاري تحميل الباقات..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.customPackagesBg + " min-h-screen text-white flex items-center justify-center"}>
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }

  return (
    <div className={styles.customPackagesBg + " min-h-screen text-white"} suppressHydrationWarning>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#131b28]/80 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <Logo size="xl" showText={false} />
          <div className="truncate">
            <div className="text-sm text-gray-300">الباقات</div>
            <div className="text-base md:text-lg font-semibold truncate">
              {gameName || game?.name || 'المتجر'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AuthStatus
            variant="compact"
            avatarUrl="https://res.cloudinary.com/dfvzhl8oa/image/upload/v1754848996/d2090ffb-1769-4853-916c-79c2a4ae2568_gmih9f.jpg"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col md:flex-row gap-4 px-2 md:px-4 py-4 max-w-5xl mx-auto">
        {/* Left: ID + Packages */}
        <section className="flex-1 min-w-0">
          {/* Step 1: User ID */}
          {/* تم حذف حقل الـ ID الثابت، كل الحقول ستأتي من accountInfoFields */}

          {/* Step 1.5: Dynamic Account Info Fields */}
          {game?.accountInfoFields && game.accountInfoFields.length > 0 && (
            <div className="mb-4">
              {game.accountInfoFields.map((field, idx) => (
                <div className="input-group mb-2" key={field.fieldName}>
                  <input
                    required={field.isRequired}
                    type="text"
                    name={field.fieldName}
                    autoComplete="off"
                    className="input"
                    placeholder={field.isRequired ? undefined : " "}
                    value={accountInfo[field.fieldName] || ''}
                    onChange={e => setAccountInfo(info => ({ ...info, [field.fieldName]: e.target.value }))}
                  />
                  <label className="user-label">
                    {field.fieldName}
                    {!field.isRequired && (
                      <span style={{ fontSize: '0.85em', color: '#aaa', marginRight: 6 }}>
                        (اختياري)
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          )}
          {/* Step 2: Packages */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="bg-[#232f47] text-[#00e6c0] rounded-full w-7 h-7 flex items-center justify-center font-bold">2</span>
              اختر الباقة
            </h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
               {packages.length > 0 ? (
                 packages.map((pkg) => (
                                       <div
                      key={pkg._id}
                      onClick={() => setSelected(pkg._id)}
                      className={`square-card bg-yellow-box cursor-pointer relative transition-all duration-300 ${selected === pkg._id ? "selected-card" : ""}`}
                    >
                      <Image
                        src={pkg.image?.secure_url || "/uc-icon.png"}
                        alt={pkg.title}
                        width={64}
                        height={64}
                        className="card-img"
                        onError={(e: any) => {
                          if (e?.target) e.target.src = "/uc-icon.png";
                        }}
                        unoptimized
                      />
                      <div className="card-title">{pkg.title}</div>
                      {pkg.isOffer && (
                        <div className="card-description">
                          عرض خاص
                        </div>
                      )}
                      <div className="card-price">
                        {(pkg.finalPrice || pkg.price).toLocaleString()} {pkg.currency || 'EGP'}
                      </div>
                      {pkg.originalPrice && pkg.originalPrice > (pkg.finalPrice || pkg.price) && (
                        <div className="card-oldprice">
                          {pkg.originalPrice.toLocaleString()} {pkg.currency || 'EGP'}
                        </div>
                      )}
                      {pkg.discountPercentage && pkg.discountPercentage > 0 && (
                        <span className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-300 text-[#232f47] text-xs font-bold px-2 py-1 rounded-full shadow border border-yellow-200">
                          {Math.round(pkg.discountPercentage)}%
                        </span>
                      )}
                      {selected === pkg._id && (
                        <span className="absolute top-3 right-3 bg-[#00e6c0] text-[#151e2e] text-xs px-2 py-1 rounded-full font-bold z-20">✓</span>
                      )}
                    </div>
                 ))
               ) : (
                 <div className="col-span-full text-center py-8">
                   <p className="text-gray-400 text-lg mb-2">لا توجد باقات متاحة لهذه اللعبة</p>
                   <p className="text-gray-500 text-sm">يرجى المحاولة لاحقاً أو التواصل مع الدعم</p>
                 </div>
               )}
             </div>
            {packages.length > 0 && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleCreateOrder}
                  className="buy-btn relative"
                  disabled={selected === null || isCreatingOrder}
                  style={{ 
                    opacity: selected === null || isCreatingOrder ? 0.5 : 1, 
                    cursor: selected === null || isCreatingOrder ? 'not-allowed' : 'pointer' 
                  }}
                >
                  {isCreatingOrder ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري الإنشاء...
                    </div>
                  ) : (
                    isAuthenticated ? 'شراء الباقة' : 'تسجيل دخول للشراء'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Login Required Modal */}
          <LoginRequiredModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLogin={() => {
              const current = typeof window !== 'undefined' 
                ? window.location.pathname + window.location.search 
                : '/packages';
              const returnUrl = encodeURIComponent(current);
              router.push(`/signin?returnUrl=${returnUrl}`);
            }}
          />

          {/* Order Confirmation Modal */}
          <OrderConfirmationModal
            isOpen={showConfirmationModal}
            onClose={() => setShowConfirmationModal(false)}
            onConfirm={handleConfirmOrder}
            onWalletTransferSubmit={handleWalletTransferSubmit}
            onCreateOrderWithTransfer={handleCreateOrderWithTransfer}
            game={game}
            selectedPackage={packages.find(p => p._id === selected) || null}
            accountInfo={accountInfo}
            isLoading={isCreatingOrder}
          />

        </section>

        {/* Right: Game Info */}
        <aside className="w-full md:w-72 flex flex-col items-center md:items-start bg-transparent rounded-xl p-4 mt-6 md:mt-0">
                     <Image
             src={game?.image?.secure_url || "/pubg.jpg"}
             alt={game?.name || "Game"}
             width={220}
             height={120}
             className="rounded mb-3 object-cover"
             unoptimized
           />
          <p className="text-xs text-gray-300 leading-relaxed mb-3">
            {game?.description || "وصف اللعبة غير متوفر"}
          </p>
          <div className="flex gap-2 w-full justify-center mt-auto">
            <a href="#" className="inline-block">
              <Image 
                src="/appstore.svg" 
                alt="App Store" 
                width={96} 
                height={32} 
                className="w-24" 
                unoptimized 
              />
            </a>
            <a href="#" className="inline-block">
              <Image 
                src="/googleplay.svg" 
                alt="Google Play" 
                width={96} 
                height={32} 
                className="w-24" 
                unoptimized 
              />
            </a>
          </div>
        </aside>
      </main>
      <NotificationToast />
    </div>
  );
}
