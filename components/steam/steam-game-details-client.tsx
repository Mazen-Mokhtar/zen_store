"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ShoppingCart, 
  Star, 
  Calendar,
  Tag,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AuthStatus } from '@/components/ui/auth-status';
import { LanguageSelector } from '@/components/ui/language-selector';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NotificationToast } from '@/components/ui/notification-toast';
import { LoginRequiredModal } from '@/components/ui/login-required-modal';
import { SteamAccountInfoModal } from '@/components/steam/steam-account-info-modal';
import { SteamOrderConfirmationModal } from '@/components/ui/steam-order-confirmation-modal';
import { authService } from '@/lib/auth';
import { orderApiService } from '@/lib/api';
import { notificationService } from '@/lib/notifications';
import type { SteamGame } from '@/lib/types';
import { logger } from '@/lib/utils';
import { WalletTransferData } from '@/components/payment/WalletTransferForm';
import { WalletTransferType } from '@/components/payment/WalletTransferOptions';
import { Logo } from '@/components/ui/logo';
import { CouponInput } from '@/components/ui/coupon-input';
import type { AppliedCoupon } from '@/lib/types';

interface SteamGameDetailsClientProps {
  game: SteamGame;
}

export function SteamGameDetailsClient({ game }: SteamGameDetailsClientProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [pendingAccountInfo, setPendingAccountInfo] = useState<{ fieldName: string; value: string }[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);



  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
    
    // Track page view - lazy load monitoring only when needed
    import('@/lib/lazy-unified-monitoring').then(({ lazyUnifiedMonitoring }) => {
      lazyUnifiedMonitoring.trackPageView(`/steam/${game.slug || game._id}`, game.name);
    }).catch(err => logger.warn('Failed to load monitoring:', err));
  }, [game]);

  const handleBuyNow = useCallback(async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Track buy now click
    import('@/lib/lazy-unified-monitoring').then(({ lazyUnifiedMonitoring }) => {
      lazyUnifiedMonitoring.trackInteraction('click', 'steam_buy_now', { gameId: game._id, gameName: game.name });
    }).catch(err => logger.warn('Failed to load monitoring:', err));

    setShowAccountModal(true);
  }, [isAuthenticated, game]);

  const handleCreateOrder = useCallback(async (accountInfo: { fieldName: string; value: string }[]) => {
    setPendingAccountInfo(accountInfo);
    setShowAccountModal(false);
    setShowConfirmationModal(true);
  }, [currentOrderId]);

  const handleConfirmOrder = useCallback(async (paymentMethod: 'card' | 'wallet-transfer' = 'card') => {
    try {
      setIsCreatingOrder(true);
      
      console.log('Creating order with coupon:', appliedCoupon);
      
      const response = await orderApiService.createSteamOrder(
        game._id,
        pendingAccountInfo,
        appliedCoupon?.code
      );

      if (response.success) {
        setCurrentOrderId(response.data._id);
        
        if (paymentMethod === 'card') {
          setShowConfirmationModal(false);
          notificationService.success('تم إنشاء الطلب', 'جاري توجيهك إلى صفحة الدفع...');
          
          try {
            const checkoutResponse = await orderApiService.checkout(response.data._id);
            
            if (checkoutResponse.success && checkoutResponse.data?.url) {
              // Track purchase attempt
              import('@/lib/lazy-unified-monitoring').then(({ lazyUnifiedMonitoring }) => {
                lazyUnifiedMonitoring.trackPurchase(
                  game._id, 
                  '', 
                  game.isOffer && game.finalPrice ? game.finalPrice : game.price || 0, 
                  game.currency || 'EGP'
                );
              }).catch(err => logger.warn('Failed to load monitoring:', err));
              
              window.location.href = checkoutResponse.data.url;
            } else {
              throw new Error(checkoutResponse.error || 'فشل في إنشاء جلسة الدفع');
            }
          } catch (checkoutError) {
            logger.error('Checkout error:', checkoutError);
            notificationService.error('خطأ في الدفع', 'حدث خطأ أثناء توجيهك إلى صفحة الدفع');
          }
        } else {
          notificationService.success('نجح', 'تم إنشاء الطلب بنجاح!');
        }
      } else {
        throw new Error(response.error || 'فشل في إنشاء الطلب');
      }
    } catch (error) {
      logger.error('Order creation error:', error);
      notificationService.error(
        'خطأ في الطلب', 
        error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء الطلب'
      );
    } finally {
      setIsCreatingOrder(false);
    }
  }, [game, pendingAccountInfo, currentOrderId]);

  const handleWalletTransferSubmit = useCallback(async (data: WalletTransferData, transferType: WalletTransferType): Promise<void> => {
    if (!currentOrderId) {
      notificationService.error('خطأ', 'لم يتم العثور على معرف الطلب');
      return;
    }

    try {
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
      
      // Redirect to success page
      router.push(`/payment-success?orderId=${currentOrderId}`);
    } catch (error) {
      logger.error('Error submitting wallet transfer:', error);
      notificationService.error('خطأ', 'حدث خطأ أثناء إرسال بيانات التحويل');
      
      // Redirect to cancel page with error reason
      router.push(`/payment-cancel?orderId=${currentOrderId}&reason=transfer_failed`);
      throw error;
    }
  }, [currentOrderId, router]);

  const handleCreateOrderWithTransfer = useCallback(async (orderData: any, transferData: WalletTransferData, transferType: WalletTransferType): Promise<void> => {
    if (!pendingAccountInfo) {
      notificationService.error('خطأ', 'يرجى إدخال بيانات الحساب أولاً');
      return;
    }

    try {
      const createOrderData = {
        gameId: game._id,
        accountInfo: pendingAccountInfo,
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
      
      // Redirect to success page with the new order ID
      const orderId = response?.data?.orderId || response?.orderId;
      router.push(`/payment-success?orderId=${orderId}`);
    } catch (error) {
      logger.error('Error creating order with wallet transfer:', error);
      notificationService.error('خطأ', 'حدث خطأ أثناء إنشاء الطلب مع بيانات التحويل');
      
      // Redirect to cancel page with error reason
      router.push(`/payment-cancel?reason=order_creation_failed`);
      throw error;
    }
  }, [game, pendingAccountInfo, router]);

  const originalPrice = game.isOffer && game.finalPrice ? game.finalPrice : game.price || 0;
  const currentPrice = appliedCoupon 
    ? originalPrice - appliedCoupon.discountAmount
    : originalPrice;
  const hasDiscount = game.isOffer && game.originalPrice && game.finalPrice && game.originalPrice > game.finalPrice;

  return (
    <div className="min-h-screen bg-[#0D0E12] text-white" data-steam-page>
      <NotificationToast />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#0D0E12]/80 backdrop-blur-md z-40 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                aria-label="Go back to previous page"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="w-px h-6 bg-gray-600"></div>
              <Logo size="xl" showText={false} />
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <div className="hidden md:block">
                <LanguageSelector />
              </div>
              <AuthStatus
                variant="compact"
                avatarUrl="https://res.cloudinary.com/dfvzhl8oa/image/upload/v1754848996/d2090ffb-1769-4853-916c-79c2a4ae2568_gmih9f.jpg"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={game.backgroundImage?.secure_url || game.image?.secure_url || '/images/placeholder-game.jpg'}
            alt={game.name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E12] via-[#0D0E12]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0E12]/80 via-transparent to-transparent" />
        </div>
        
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl">
              {/* Game Tags */}
              {game.tags && game.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {game.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-sm text-blue-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Game Title */}
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 leading-tight">
                {game.name}
              </h1>
              
              {/* Price Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6">
                {hasDiscount && (
                  <div className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold w-fit">
                    -{Math.round(game.discountPercentage || 0)}%
                  </div>
                )}
                <div className="flex items-center gap-2 sm:gap-3">
                  {hasDiscount && (
                    <span className="text-gray-400 line-through text-sm sm:text-lg">
                      {game.originalPrice} {game.currency || 'EGP'}
                    </span>
                  )}
                  <span className="text-xl sm:text-3xl font-bold text-green-400">
                    {currentPrice} {game.currency || 'EGP'}
                  </span>
                </div>
              </div>
              
              {/* Description Preview */}
              <p className="text-sm sm:text-lg text-gray-300 mb-6 sm:mb-8 leading-relaxed">
                <span className="sm:hidden">{game.description.slice(0, 150)}...</span>
                <span className="hidden sm:inline">{game.description.slice(0, 200)}...</span>
              </p>
              
              {/* Coupon Input */}
              <div className="mb-6">
                <CouponInput
                  orderAmount={originalPrice}
                  onCouponApplied={setAppliedCoupon}
                  onCouponRemoved={() => setAppliedCoupon(null)}
                />
              </div>
              
              {/* Desktop Buy Button */}
              <div className="hidden md:block">
                <button
                  onClick={handleBuyNow}
                  disabled={isCreatingOrder}
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      Buy Now - {currentPrice} {game.currency || 'EGP'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="relative z-10 bg-[#0D0E12]">
        {/* Trailer Section */}
        {game.video && (
          <section className="py-8 sm:py-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8 text-center">Game Trailer</h2>
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900">
                <video
                  className="w-full h-full object-cover"
                  src={game.video.secure_url}
                  controls={videoPlaying}
                  muted={videoMuted}
                  loop
                  playsInline
                  onPlay={() => setVideoPlaying(true)}
                  onPause={() => setVideoPlaying(false)}
                />
                
                {!videoPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <button
                      onClick={() => {
                        const video = document.querySelector('video');
                        if (video) {
                          video.play();
                          setVideoPlaying(true);
                        }
                      }}
                      className="w-20 h-20 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Play size={32} className="text-white ml-1" />
                    </button>
                  </div>
                )}
                
                {/* Video Controls */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={() => setVideoMuted(!videoMuted)}
                    className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                  >
                    {videoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Image Gallery */}
        {game.images && game.images.length > 0 && (
          <section className="py-8 sm:py-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8 text-center">Screenshots</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                {game.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <Image
                      src={image.secure_url}
                      alt={`${game.name} screenshot ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Description Section */}
        <section className="py-8 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8">About This Game</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-sm sm:text-lg text-gray-300 leading-relaxed whitespace-pre-line">
                {game.description}
              </p>
            </div>
            
            {/* Game Info */}
            <div className="mt-6 sm:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              <div className="bg-[#1A1B20] rounded-xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Calendar size={18} className="sm:w-5 sm:h-5" />
                  Game Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white">Steam Game</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-green-400 font-bold">{currentPrice} {game.currency || 'EGP'}</span>
                  </div>
                  {hasDiscount && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Discount:</span>
                      <span className="text-green-400 font-bold">
                        {Math.round(game.discountPercentage || 0)}% OFF
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400">Available</span>
                  </div>
                </div>
              </div>
              
              {/* Required Account Info */}
              <div className="bg-[#1A1B20] rounded-xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Tag size={18} className="sm:w-5 sm:h-5" />
                  Required Information
                </h3>
                <div className="space-y-2">
                  {game.accountInfoFields && Array.isArray(game.accountInfoFields) ? game.accountInfoFields.map((field, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-gray-300">
                        {field.fieldName}
                        {field.isRequired && <span className="text-red-400 ml-1">*</span>}
                      </span>
                    </div>
                  )) : (
                    <div className="text-gray-400">
                      No account information required
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile Sticky Buy Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1A1B20]/95 backdrop-blur-md border-t border-gray-800 p-4 z-30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">Price</div>
            <div className="flex items-center gap-2">
              {hasDiscount && (
                <span className="text-gray-400 line-through text-sm">
                  {game.originalPrice} {game.currency || 'EGP'}
                </span>
              )}
              <span className="text-xl font-bold text-green-400">
                {currentPrice} {game.currency || 'EGP'}
              </span>
            </div>
          </div>
          <button
            onClick={handleBuyNow}
            disabled={isCreatingOrder}
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingOrder ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                Buy Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImageIndex !== null && game.images && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-5xl max-h-full">
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            {/* Navigation Buttons */}
            {game.images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(
                    selectedImageIndex > 0 ? selectedImageIndex - 1 : game.images!.length - 1
                  )}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setSelectedImageIndex(
                    selectedImageIndex < game.images!.length - 1 ? selectedImageIndex + 1 : 0
                  )}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            
            <Image
              src={game.images[selectedImageIndex].secure_url}
              alt={`${game.name} screenshot ${selectedImageIndex + 1}`}
              width={1200}
              height={675}
              className="max-w-full max-h-full object-contain rounded-lg"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            
            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-sm">
              {selectedImageIndex + 1} / {game.images.length}
            </div>
          </div>
        </div>
      )}

      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => {
          const current = `/steam/${game.slug || game._id}`;
          const returnUrl = encodeURIComponent(current);
          router.push(`/signin?returnUrl=${returnUrl}`);
        }}
      />

      {/* Account Info Modal */}
      <SteamAccountInfoModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        game={game}
        onSubmit={handleCreateOrder}
        isLoading={isCreatingOrder}
        appliedCoupon={appliedCoupon}
      />

      {/* Order Confirmation Modal */}
      <SteamOrderConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmOrder}
        onWalletTransferSubmit={handleWalletTransferSubmit}
        onCreateOrderWithTransfer={handleCreateOrderWithTransfer}
        game={game}
        accountInfo={pendingAccountInfo}
        isLoading={isCreatingOrder}
        appliedCoupon={appliedCoupon}
      />
    </div>
  );
}