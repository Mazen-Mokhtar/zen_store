"use client";

import React, { useState } from 'react';
import { X, CheckCircle, User, Package, CreditCard, Wallet, Upload, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import type { SteamGame, AppliedCoupon } from '@/lib/types';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import WalletTransferOptions, { WalletTransferType } from '@/components/payment/WalletTransferOptions';
import WalletTransferForm from '@/components/payment/WalletTransferForm';
import type { WalletTransferData } from '@/components/payment/WalletTransferForm';
import { useScrollLock } from '@/hooks/useScrollLock';

// Security utility for sanitizing display text
const sanitizeDisplayText = (text: string): string => {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, 500); // Limit length and trim whitespace
};

// Security utility for sanitizing field names
const sanitizeFieldName = (fieldName: string): string => {
  if (typeof fieldName !== 'string') return '';
  // Allow only alphanumeric characters, spaces, and common symbols
  return fieldName.replace(/[^a-zA-Z0-9\s\u0600-\u06FF@._-]/g, '').slice(0, 100);
};

// Validation utility for checking required props
const validateSteamGameProps = (game: SteamGame): boolean => {
  return !!(game && game._id && game.name);
};

// Validation utility for account info
const validateAccountInfo = (accountInfo: { fieldName: string; value: string }[]): boolean => {
  if (!Array.isArray(accountInfo)) return false;
  return accountInfo.length <= 10; // Limit number of fields
};

type PaymentMethod = 'card' | 'wallet-transfer';

interface SteamOrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod?: 'card' | 'wallet-transfer') => void;
  onWalletTransferSubmit?: (data: WalletTransferData, transferType: WalletTransferType) => Promise<void>;
  onCreateOrderWithTransfer?: (orderData: any, transferData: WalletTransferData, transferType: WalletTransferType) => Promise<void>;
  game: SteamGame;
  accountInfo: { fieldName: string; value: string }[];
  isLoading?: boolean;
  appliedCoupon?: AppliedCoupon | null;
}

export function SteamOrderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  onWalletTransferSubmit,
  onCreateOrderWithTransfer,
  game,
  accountInfo,
  isLoading = false,
  appliedCoupon
}: SteamOrderConfirmationModalProps) {
  // Payment flow state
  const [currentStep, setCurrentStep] = useState<'confirmation' | 'payment-method' | 'wallet-options' | 'wallet-form'>('confirmation');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedTransferType, setSelectedTransferType] = useState<WalletTransferType>('wallet-transfer');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  
  // Prevent body scrolling when modal is open
  useScrollLock(isOpen);

  // Security: Early return with validation
  if (!isOpen || !validateSteamGameProps(game)) return null;

  // Security: Safe property access with fallbacks
  const originalPrice = game?.isOffer && game?.finalPrice ? game.finalPrice : game?.price || 0;
  const currentPrice = appliedCoupon ? originalPrice - appliedCoupon.discountAmount : originalPrice;
  const hasDiscount = game?.isOffer && game?.originalPrice && game?.finalPrice && game.originalPrice > game.finalPrice;
  const gameName = sanitizeDisplayText(game?.name || '');

  // Reset state when modal closes
  const handleClose = () => {
    setCurrentStep('confirmation');
    setSelectedPaymentMethod('card');
    setSelectedTransferType('wallet-transfer');
    setIsSubmittingTransfer(false);
    onClose();
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    if (method === 'card') {
      onConfirm('card');
    } else {
      // الانتقال مباشرة إلى خيارات التحويل بدون إنشاء الطلب
      setCurrentStep('wallet-options');
    }
  };

  // Handle wallet transfer type selection
  const handleTransferTypeSelect = (type: WalletTransferType) => {
    setSelectedTransferType(type);
    setCurrentStep('wallet-form');
  };

  // Handle wallet transfer submission
  const handleWalletTransferSubmit = async (data: WalletTransferData) => {
    if (!onWalletTransferSubmit) return;
    
    setIsSubmittingTransfer(true);
    try {
      const response = await onWalletTransferSubmit(data, selectedTransferType);
      // Don't close modal here - let the parent handle redirect
    } catch (error) {

    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // Handle confirm button click - go directly to payment method selection
  const handleConfirmClick = () => {
    setCurrentStep('payment-method');
  };

  // Render payment method selector
  if (currentStep === 'payment-method') {
    return (
      <PaymentMethodSelector
        selectedMethod={selectedPaymentMethod}
        onMethodChange={handlePaymentMethodSelect}
        onClose={handleClose}
        isLoading={isLoading || isSubmittingTransfer}
      />
    );
  }

  // Render wallet transfer options
  if (currentStep === 'wallet-options') {
    return (
      <WalletTransferOptions
        selectedOption={selectedTransferType}
        onOptionChange={handleTransferTypeSelect}
        onBack={() => setCurrentStep('payment-method')}
        onClose={handleClose}
        isLoading={isLoading || isSubmittingTransfer}
      />
    );
  }

  // Render wallet transfer form
  if (currentStep === 'wallet-form') {
    return (
      <WalletTransferForm
        transferType={selectedTransferType}
        totalAmount={currentPrice}
        currency={game.currency || 'EGP'}
        gameId={game?._id}
        accountInfo={accountInfo.reduce((acc, item) => ({ ...acc, [item.fieldName]: item.value }), {})}
        onSubmit={handleWalletTransferSubmit}
        onCreateOrderWithTransfer={onCreateOrderWithTransfer ? (orderData, transferData) => onCreateOrderWithTransfer(orderData, transferData, selectedTransferType) : undefined}
        onBack={() => setCurrentStep('wallet-options')}
        onClose={handleClose}
        isSubmitting={isSubmittingTransfer}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#18181c] rounded-2xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00e6c0]/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#00e6c0]" />
            </div>
            <h2 className="text-xl font-bold text-white">تأكيد الطلب</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
            disabled={isLoading}
          >
            <X className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Game Info */}
          <div className="bg-[#232329] rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#00e6c0]" />
              معلومات المنتج
            </h3>
            <div className="flex items-center gap-4">
              <Image
                src={game.image?.secure_url || "/steam-logo.png"}
                alt={game.name}
                width={60}
                height={60}
                className="rounded-lg object-cover"
                unoptimized
              />
              <div className="flex-1">
                <h4 className="text-white font-bold text-lg mb-1">
                  {gameName}
                </h4>
                <p className="text-gray-400 mb-2">
                  Steam Game
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#00e6c0]">
                    {currentPrice.toLocaleString()} {game.currency || 'EGP'}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-gray-500 line-through">
                      {game.originalPrice?.toLocaleString()} {game.currency || 'EGP'}
                    </span>
                  )}
                </div>
                {hasDiscount && game.discountPercentage && (
                  <div className="mt-1">
                    <span className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-300 text-[#232f47] text-xs font-bold px-2 py-1 rounded-full">
                      خصم {Math.round(game.discountPercentage)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Information */}
          {validateAccountInfo(accountInfo) && accountInfo.length > 0 && (
            <div className="bg-[#232329] rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#00e6c0]" />
                معلومات الحساب
              </h3>
              <div className="space-y-3">
                {accountInfo
                  .filter((info) => info.fieldName && info.value) // Filter out empty entries
                  .slice(0, 10) // Limit to 10 fields max
                  .map((info, index) => (
                  <div key={`${sanitizeFieldName(info.fieldName)}-${index}`} className="p-3 bg-[#18181c] rounded-lg">
                    <div className="flex flex-col gap-2">
                      <span className="text-gray-400 text-sm font-medium">
                        {sanitizeFieldName(info.fieldName)}
                      </span>
                      <span className="text-white font-medium break-all text-sm leading-relaxed">
                        {sanitizeDisplayText(info.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-[#232329] rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#00e6c0]" />
              طريقة الدفع
            </h3>
            <div className="flex items-center gap-3 p-3 bg-[#18181c] rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">بطاقة ائتمان</span>
            </div>
          </div>

          {/* Coupon Information */}
          {appliedCoupon && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-400" />
                كوبون الخصم
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">كود الكوبون:</span>
                  <span className="text-green-400 font-bold">{appliedCoupon.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">نوع الخصم:</span>
                  <span className="text-white">
                    {appliedCoupon.type === 'percentage' 
                       ? `${appliedCoupon.value}%` 
                       : `${appliedCoupon.value} ${game.currency || 'EGP'}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">قيمة الخصم:</span>
                  <span className="text-green-400 font-bold">-{appliedCoupon.discountAmount.toLocaleString()} {game.currency || 'EGP'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="bg-[#232329] rounded-xl p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">السعر الأصلي:</span>
                <span className="text-white font-medium">{originalPrice.toLocaleString()} {game.currency || 'EGP'}</span>
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">خصم الكوبون:</span>
                  <span className="text-green-400 font-medium">-{appliedCoupon.discountAmount.toLocaleString()} {game.currency || 'EGP'}</span>
                </div>
              )}
              <hr className="border-gray-600" />
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white">المجموع الكلي:</span>
                <span className="text-2xl font-bold text-[#00e6c0]">
                  {currentPrice.toLocaleString()} {game.currency || 'EGP'}
                </span>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <p className="text-blue-400 text-sm">
                بعد الضغط على &quot;المتابعة للدفع&quot; ستظهر لك خيارات الدفع المتاحة لإتمام عملية الشراء.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            disabled={isLoading}
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirmClick}
            className="flex-1 px-4 py-3 bg-[#00e6c0] hover:bg-[#00e6c0]/90 text-[#151e2e] font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#151e2e] border-t-transparent rounded-full animate-spin"></div>
                جاري المعالجة...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                المتابعة للدفع
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SteamOrderConfirmationModal;