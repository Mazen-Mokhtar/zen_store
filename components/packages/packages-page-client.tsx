'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Head from 'next/head';
import { orderApiService } from '@/lib/api';
import { authService } from '@/lib/auth';
import { notificationService } from '@/lib/notifications';
import type { Package, Game, CreateOrderData } from '@/lib/api';
import type { WalletTransferData } from '@/components/payment/WalletTransferForm';
import type { WalletTransferType } from '@/components/payment/WalletTransferOptions';
import type { AppliedCoupon } from '@/lib/types';
import { SkeletonSpinner } from '@/components/ui/skeleton';
import { ErrorMessage } from '@/components/ui/error-message';
import { AuthStatus } from '@/components/ui/auth-status';
import { PackagesCouponInput } from '@/components/ui/unified-coupon-input';
import { LoginRequiredModal } from '@/components/ui/login-required-modal';
import { OrderConfirmationModal } from '@/components/ui/order-confirmation-modal';
import { NotificationToast } from '@/components/ui/notification-toast';
import { logger } from '@/lib/utils';
import styles from '@/app/packages/packages.module.css';

interface PackagesPageClientProps {
  initialPackages: Package[];
  initialGames: Game[];
}

export function PackagesPageClient({ initialPackages, initialGames }: PackagesPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = searchParams.get('gameId');
  const gameName = searchParams.get('gameName');
  
  const [selected, setSelected] = useState<string | null>(null);
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<Record<string, string>>({});
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showAllPackages, setShowAllPackages] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponDetails, setCouponDetails] = useState<any>(null);
  const [packagesWithCoupon, setPackagesWithCoupon] = useState<Package[]>(initialPackages);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize authentication status
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  // Find game by ID when gameId changes
  useEffect(() => {
    if (gameId) {
      const foundGame = initialGames.find(g => g._id === gameId);
      if (foundGame) {
        setGame(foundGame);
        // Since packages are already filtered by gameId from the API, use them directly
        setPackages(initialPackages);
        setPackagesWithCoupon(initialPackages);
      } else {
        setError('Game not found');
      }
    }
  }, [gameId, initialGames, initialPackages]);

  // Update packages with coupon when coupon details change
  useEffect(() => {
    if (couponDetails && couponDetails.status?.isValid) {
      const updatedPackages = packages.map(pkg => {
        const originalPrice = pkg.finalPrice || pkg.price;
        const discountedPrice = calculateDiscountedPrice(originalPrice, couponDetails);
        
        return {
          ...pkg,
          couponDiscountedPrice: discountedPrice,
          couponDiscountAmount: originalPrice - discountedPrice
        };
      });
      setPackagesWithCoupon(updatedPackages);
    } else {
      setPackagesWithCoupon(packages);
    }
  }, [packages, couponDetails]);

  // Update applied coupon when selection or coupon changes
  useEffect(() => {
    if (selected && couponDetails && couponDetails.status?.isValid) {
      const selectedPackage = packages.find(pkg => pkg._id === selected);
      if (selectedPackage) {
        const originalPrice = selectedPackage.finalPrice || selectedPackage.price;
        const discountedPrice = calculateDiscountedPrice(originalPrice, couponDetails);
        const discountAmount = originalPrice - discountedPrice;
        
        const appliedCouponData: AppliedCoupon = {
          code: couponDetails.code,
          type: couponDetails.type,
          value: couponDetails.value,
          discountAmount: discountAmount,
          originalAmount: originalPrice,
          finalAmount: discountedPrice
        };
        
        setAppliedCoupon(appliedCouponData);
      }
    } else {
      setAppliedCoupon(null);
    }
  }, [selected, couponDetails, packages]);

  const calculateDiscountedPrice = (originalPrice: number, coupon: any) => {
    if (!coupon || !coupon.status?.isValid) return originalPrice;
    
    if (originalPrice < coupon.minOrderAmount) return originalPrice;
    
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (originalPrice * coupon.value) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = coupon.value;
    }
    
    return Math.max(0, originalPrice - discountAmount);
  };

  const fetchCouponDetails = async (couponCode: string) => {
    try {
      const response = await fetch(`/api/coupon/details/${encodeURIComponent(couponCode)}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching coupon details:', error);
      return null;
    }
  };

  const handleCouponApplication = async (couponCode: string) => {
    if (!couponCode.trim()) {
      setCouponDetails(null);
      setAppliedCoupon(null);
      setPackagesWithCoupon(packages);
      return;
    }

    const details = await fetchCouponDetails(couponCode);
    if (details && details.status?.isValid) {
      setCouponDetails(details);
    } else {
      setCouponDetails(null);
      setAppliedCoupon(null);
      setPackagesWithCoupon(packages);
    }
  };

  const handleCreateOrder = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!selected || !game) {
      notificationService.showWarning('يرجى اختيار باقة أولاً');
      return;
    }

    // Validate required fields
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
          value: value ? value.toString() : ''
        })),
        paymentMethod: 'card',
        note: `طلب ${game.name} - ${packages.find(p => p._id === selected)?.title}`,
        ...(appliedCoupon?.code && { couponCode: appliedCoupon.code })
      };

      const response = await orderApiService.createOrder(orderData);

      if (response.success) {
        notificationService.showSuccess('تم إنشاء الطلب بنجاح!');
        
        // Mark recent order activity in session storage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('recentOrderCreated', Date.now().toString());
        }
        
        setCurrentOrderId(response.data._id);
        
        if (response.data.couponApplied) {
          const serverCouponData = response.data.couponApplied;
          const updatedAppliedCoupon: AppliedCoupon = {
            code: serverCouponData.code,
            type: appliedCoupon?.type || 'percentage',
            value: appliedCoupon?.value || 0,
            discountAmount: serverCouponData.discountAmount || response.data.discountAmount || 0,
            originalAmount: serverCouponData.originalAmount || response.data.originalAmount || 0,
            finalAmount: response.data.totalAmount || 0
          };
          setAppliedCoupon(updatedAppliedCoupon);
        }
        
        if (paymentMethod === 'card') {
          setShowConfirmationModal(false);
          notificationService.showSuccess('تم إنشاء الطلب - جاري توجيهك إلى صفحة الدفع...');
          
          try {
            const checkoutResponse = await orderApiService.checkout(response.data._id);
            
            if (checkoutResponse.success && checkoutResponse.data?.url) {
              // Track purchase attempt
              import('@/lib/lazy-unified-monitoring').then(({ lazyUnifiedMonitoring }) => {
                lazyUnifiedMonitoring.trackPurchase(
                  game._id, 
                  selected, 
                  packages.find(p => p._id === selected)?.price || 0, 
                  'EGP'
                );
              }).catch(err => logger.warn('Failed to load monitoring:', err));
              
              window.location.href = checkoutResponse.data.url;
            } else {
              const errorMsg = checkoutResponse.error || 'فشل في إنشاء جلسة الدفع';
              notificationService.showError(errorMsg);
              
              // Redirect to cancel page with error reason
              router.push(`/payment-cancel?orderId=${response.data._id}&reason=checkout_failed`);
            }
          } catch (checkoutError) {
            logger.error('Checkout error:', checkoutError);
            notificationService.showError('حدث خطأ أثناء توجيهك إلى صفحة الدفع');
            
            // Redirect to cancel page with error reason
            router.push(`/payment-cancel?orderId=${response.data._id}&reason=checkout_error`);
          }
        }
      } else {
        const errorMsg = response.error || 'فشل في إنشاء الطلب';
        logger.error('❌ Order creation failed:', errorMsg);
        notificationService.showError(errorMsg);
        
        // Redirect to cancel page with error reason
        router.push(`/payment-cancel?reason=order_creation_failed`);
      }
    } catch (error) {
      logger.error('❌ Error in handleConfirmOrder:', error);
      
      let errorMessage = 'حدث خطأ أثناء إنشاء الطلب';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      notificationService.showError(errorMessage);
      
      // Redirect to cancel page with error reason
      router.push(`/payment-cancel?reason=order_creation_failed`);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const submitWalletTransfer = async (data: WalletTransferData) => {
    try {
      setIsCreatingOrder(true);
      
      const { walletTransferImage, ...transferData } = data;
      
      const response = await orderApiService.submitWalletTransfer(
        currentOrderId!,
        transferData,
        walletTransferImage
      );
      
      if (response.success) {
        notificationService.showSuccess('تم إرسال إثبات التحويل بنجاح!');
        setShowConfirmationModal(false);
        
        // Redirect to success page
        if (game) {
          router.push(`/payment-success?orderId=${currentOrderId}&gameId=${game._id}&gameName=${encodeURIComponent(game.name)}&packageId=${selected}&packageName=${encodeURIComponent(packages.find(p => p._id === selected)?.title || '')}`);
        } else {
          router.push(`/payment-success?orderId=${currentOrderId}&packageId=${selected}&packageName=${encodeURIComponent(packages.find(p => p._id === selected)?.title || '')}`);
        }
      } else {
        notificationService.showError(response.error || 'فشل في إرسال إثبات التحويل');
        
        // Redirect to cancel page with error reason
        router.push(`/payment-cancel?orderId=${currentOrderId}&reason=transfer_failed`);
      }
    } catch (error) {
      logger.error('❌ Error submitting wallet transfer:', error);
      notificationService.showError('حدث خطأ أثناء إرسال إثبات التحويل');
      
      // Redirect to cancel page with error reason
      router.push(`/payment-cancel?orderId=${currentOrderId}&reason=transfer_failed`);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleCreateOrderWithTransfer = async (
    orderData: any,
    transferData: WalletTransferData,
    transferType: WalletTransferType
  ) => {
    try {
      setIsCreatingOrder(true);
      
      const fullOrderData = {
        gameId: gameId as string,
        packageId: selected!,
        accountInfo: Object.entries(accountInfo).map(([fieldName, value]) => ({
          fieldName,
          value: value ? value.toString() : ''
        })),
        paymentMethod: 'wallet-transfer' as const,
        note: `طلب ${game!.name} - ${packages.find(p => p._id === selected)?.title}`,
        ...(appliedCoupon?.code && { couponCode: appliedCoupon.code })
      };
      
      const { walletTransferImage, ...walletData } = transferData;
      
      const response = await orderApiService.createOrderWithWalletTransfer(
        fullOrderData,
        walletData,
        walletTransferImage
      );
      
      if (response.success) {
        // Mark recent order activity in session storage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('recentOrderCreated', Date.now().toString());
        }
        
        notificationService.showSuccess('تم إنشاء الطلب وإرسال إثبات التحويل بنجاح!');
        setShowConfirmationModal(false);
        
        // Redirect to success page with the new order ID
        const orderId = response.data.orderId || response.data._id;
        router.push(`/payment-success?orderId=${orderId}&gameId=${game!._id}&gameName=${encodeURIComponent(game!.name)}&packageId=${selected}&packageName=${encodeURIComponent(packages.find(p => p._id === selected)?.title || '')}`);
      } else {
        notificationService.showError(response.error || 'فشل في إنشاء الطلب');
        
        // Redirect to cancel page with error reason
        router.push(`/payment-cancel?reason=order_creation_failed`);
      }
    } catch (error) {
      logger.error('❌ Error creating order with transfer:', error);
      notificationService.showError('حدث خطأ أثناء إنشاء الطلب');
      
      // Redirect to cancel page with error reason
      router.push(`/payment-cancel?reason=order_creation_failed`);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Show error if no gameId
  if (!gameId) {
    return (
      <div className={styles.customPackagesBg + " min-h-screen text-white flex items-center justify-center"}>
        <div className="text-center px-4">
          <h1 className="text-xl md:text-2xl font-bold mb-4">خطأ</h1>
          <p className="mb-4 text-sm md:text-base">لم يتم تحديد اللعبة</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-[#00e6c0] text-[#151e2e] px-4 md:px-6 py-2 rounded hover:bg-[#00e6c0]/80 transition text-sm md:text-base"
          >
            العودة للرئيسية
          </button>
        </div>
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
    <>
      <Head>
        <title>{`${gameName || game?.name || 'Game'} Packages - Zen Store`}</title>
        <meta name="description" content={`Choose from various packages for ${gameName || game?.name || 'this game'}. Secure payment and instant delivery.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={`${gameName || game?.name || 'Game'} Packages`} />
        <meta property="og:description" content={`Choose from various packages for ${gameName || game?.name || 'this game'}`} />
        <meta property="og:type" content="website" />
        {game?.image?.secure_url && (
          <meta property="og:image" content={game.image.secure_url} />
        )}
        <link rel="canonical" href={`/packages?gameId=${gameId}`} />
      </Head>

      <div className={styles.customPackagesBg + " min-h-screen text-white"} suppressHydrationWarning>
        {/* Header */}
        <header className="flex flex-row items-start items-center justify-between px-3 md:px-4 py-3 bg-[#131b28]/80 backdrop-blur border-b border-white/5 gap-3 sm:gap-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => router.push('/category')}>
              <div className="flex items-center gap-0">
                <Image
                  alt="Wivz Logo 2"
                  width={64}
                  height={128}
                  className="object-contain"
                  src="/images/my-logo.png"
                />
                <Image
                  alt="Wivz Logo 1"
                  width={64}
                  height={128}
                  className="object-contain"
                  src="/images/logo-4-v1.png"
                />
              </div>
            </div>
            <div className="truncate hidden sm:block">
              <div className="text-xs md:text-sm text-gray-300">الباقات</div>
              <h1 className="text-sm md:text-base lg:text-lg font-semibold truncate">
                {gameName || game?.name || 'Fortnite'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <AuthStatus
                  variant="compact"
                  avatarUrl="https://res.cloudinary.com/dfvzhl8oa/image/upload/v1754848996/d2090ffb-1769-4853-916c-79c2a4ae2568_gmih9f.jpg"
                />
              ) : (
                <button 
                  className="border border-[#00e6c0] text-[#00e6c0] px-6 py-2 rounded hover:bg-[#00e6c0] hover:text-[#151e2e] transition"
                  onClick={() => router.push('/signin')}
                >
                  دخول
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-col lg:flex-row gap-4 px-2 md:px-4 py-4 max-w-6xl mx-auto">
          {/* Left: Account Info + Packages */}
          <section className="flex-1 min-w-0" role="main" aria-label="Package selection">
            {/* Dynamic Account Info Fields */}
            {game?.accountInfoFields && game.accountInfoFields.length > 0 && (
              <div className="mb-4 md:mb-6">
                <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2">
                  <span className="bg-[#232f47] text-[#00e6c0] rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center font-bold text-sm md:text-base">1</span>
                  أدخل معلومات الحساب
                </h2>
                <div className="space-y-2">
                  {game.accountInfoFields.map((field, idx) => (
                    <div key={`${field.fieldName}-${idx}`} className="input-group mb-2">
                      <input
                        required={field.isRequired}
                        type="text"
                        name={field.fieldName}
                        autoComplete="off"
                        className="input"
                        placeholder={field.isRequired ? undefined : " "}
                        value={accountInfo[field.fieldName] || ''}
                        onChange={(e) => setAccountInfo(info => ({ ...info, [field.fieldName]: e.target.value }))}
                        aria-label={field.fieldName}
                        aria-required={field.isRequired}
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
              </div>
            )}

            {/* Coupon Section */}
            <div className="mb-4 md:mb-6">
              <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2">
                <span className="bg-[#232f47] text-[#00e6c0] rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center font-bold text-sm md:text-base">2</span>
                كوبون الخصم (اختياري)
              </h2>
              <PackagesCouponInput
                onCouponChange={handleCouponApplication}
                className="w-full"
              />
            </div>

            {/* Packages Section */}
            <div>
              <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2">
                <span className="bg-[#232f47] text-[#00e6c0] rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center font-bold text-sm md:text-base">3</span>
                اختر الباقة
              </h2>
              
              {packagesWithCoupon.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6 lg:gap-8">
                    {(isMobile && !showAllPackages ? packagesWithCoupon.slice(0, 4) : packagesWithCoupon).map((pkg) => (
                      <div
                        key={pkg._id}
                        className={`square-card ${selected === pkg._id ? 'selected-card' : ''}`}
                        onClick={() => setSelected(pkg._id)}
                      >
                        <Image
                          src={pkg.image?.secure_url || "/uc-icon.png"}
                          alt={`${pkg.title} package icon`}
                          width={64}
                          height={64}
                          className="card-img"
                          onError={(e: any) => {
                            if (e?.target) e.target.src = "/uc-icon.png";
                          }}
                          sizes="64px"
                          loading="lazy"
                        />
                        <h3 className="card-title">{pkg.title}</h3>
                        {pkg.isOffer && (
                          <p className="card-description">
                            عرض خاص
                          </p>
                        )}
                        <div className="card-price">
                          {pkg.couponDiscountedPrice !== undefined 
                            ? pkg.couponDiscountedPrice.toLocaleString() 
                            : (pkg.finalPrice || pkg.price).toLocaleString()} {pkg.currency || 'EGP'}
                        </div>
                        {pkg.couponDiscountAmount && pkg.couponDiscountAmount > 0 && (
                          <div className="card-oldprice">
                            {(pkg.finalPrice || pkg.price).toLocaleString()} {pkg.currency || 'EGP'}
                          </div>
                        )}
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
                    ))}
                  </div>
                  
                  {isMobile && packagesWithCoupon.length > 4 && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => setShowAllPackages(!showAllPackages)}
                        className="px-4 py-2 bg-[#00e6c0] text-black rounded-lg font-medium hover:bg-[#00d4aa] transition-colors"
                      >
                        {showAllPackages ? 'عرض أقل' : `عرض المزيد (${packagesWithCoupon.length - 4}+)`}
                      </button>
                    </div>
                  )}
                  
                  <div className="flex justify-center mt-4 md:mt-6">
                    <button
                      onClick={handleCreateOrder}
                      className="buy-btn relative w-full sm:w-auto"
                      disabled={selected === null || isCreatingOrder}
                      style={{ 
                        opacity: selected === null || isCreatingOrder ? 0.5 : 1, 
                        cursor: selected === null || isCreatingOrder ? 'not-allowed' : 'pointer' 
                      }}
                      aria-label={isAuthenticated ? 'شراء الباقة المحددة' : 'تسجيل دخول للشراء'}
                    >
                      {isCreatingOrder ? (
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          جاري الإنشاء...
                        </div>
                      ) : (
                        isAuthenticated ? 'شراء الباقة' : 'تسجيل دخول للشراء'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 md:py-8">
                  <p className="text-gray-400 text-base md:text-lg mb-2">لا توجد باقات متاحة لهذه اللعبة</p>
                  <p className="text-gray-500 text-sm">يرجى المحاولة لاحقاً أو التواصل مع الدعم</p>
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
              onWalletTransferSubmit={submitWalletTransfer}
              onCreateOrderWithTransfer={handleCreateOrderWithTransfer}
              game={game}
              selectedPackage={packagesWithCoupon.find(p => p._id === selected) || packages.find(p => p._id === selected) || null}
              accountInfo={accountInfo}
              isLoading={isCreatingOrder}
              appliedCoupon={appliedCoupon}
            />
          </section>

          {/* Right: Game Info */}
          <aside className="w-full lg:w-72 flex flex-col items-center lg:items-start bg-transparent rounded-xl p-3 md:p-4 mt-4 lg:mt-0" role="complementary" aria-label="Game information">
            <Image
              src={game?.image?.secure_url || "/pubg.jpg"}
              alt={`${game?.name || "Game"} cover image`}
              width={220}
              height={120}
              className="rounded mb-3 object-cover w-full max-w-[220px]"
              sizes="(max-width: 1024px) 100vw, 220px"
              loading="lazy"
            />
            <p className="text-xs text-gray-300 leading-relaxed mb-3 text-center lg:text-left">
              {game?.description || "وصف اللعبة غير متوفر"}
            </p>
            <div className="flex gap-2 w-full justify-center mt-auto">
              <a href="#" className="inline-block" aria-label="Download from App Store">
                <Image 
                  src="/appstore.svg" 
                  alt="Download on App Store" 
                  width={96} 
                  height={32} 
                  className="w-20 md:w-24" 
                  loading="lazy"
                  sizes="96px"
                />
              </a>
              <a href="#" className="inline-block" aria-label="Get it on Google Play">
                <Image 
                  src="/googleplay.svg" 
                  alt="Get it on Google Play" 
                  width={96} 
                  height={32} 
                  className="w-20 md:w-24" 
                  loading="lazy"
                  sizes="96px"
                />
              </a>
            </div>
          </aside>
        </main>
        <NotificationToast />
      </div>
    </>
  );
}