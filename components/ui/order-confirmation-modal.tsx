"use client";

import React, { useState } from 'react';
import { X, CheckCircle, User, Package, CreditCard, Wallet, Upload, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import type { Package as PackageType, Game } from '@/lib/api';
import type { AppliedCoupon } from '@/lib/types';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import WalletTransferOptions, { WalletTransferType } from '@/components/payment/WalletTransferOptions';
import WalletTransferForm, { WalletTransferData } from '@/components/payment/WalletTransferForm';
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
const validateProps = (game: Game | null, selectedPackage: PackageType | null): boolean => {
  return !!(game && selectedPackage && game._id && selectedPackage._id);
};

// Validation utility for account info
const validateAccountInfo = (accountInfo: Record<string, string>): boolean => {
  if (!accountInfo || typeof accountInfo !== 'object') return false;
  return Object.keys(accountInfo).length <= 10; // Limit number of fields
};

type PaymentMethod = 'card' | 'wallet-transfer';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod?: 'card' | 'wallet-transfer') => void;
  onWalletTransferSubmit?: (data: WalletTransferData, transferType: WalletTransferType) => Promise<void>;
  onCreateOrderWithTransfer?: (orderData: any, transferData: WalletTransferData, transferType: WalletTransferType) => Promise<void>;
  game: Game | null;
  selectedPackage: PackageType | null;
  accountInfo: Record<string, string>;
  isLoading?: boolean;
  appliedCoupon?: AppliedCoupon | null;
}

export function OrderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  onWalletTransferSubmit,
  onCreateOrderWithTransfer,
  game,
  selectedPackage,
  accountInfo,
  isLoading = false,
  appliedCoupon = null
}: OrderConfirmationModalProps) {
  // Prevent body scrolling when modal is open
  useScrollLock(isOpen);
  // Payment flow state
  const [currentStep, setCurrentStep] = useState<'confirmation' | 'payment-method' | 'wallet-options' | 'wallet-form'>('confirmation');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedTransferType, setSelectedTransferType] = useState<WalletTransferType>('wallet-transfer');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Security: Early return with validation
  if (!isOpen || !validateProps(game, selectedPackage)) return null;

  // Security: Safe property access with fallbacks
  const originalAmount = selectedPackage?.finalPrice || selectedPackage?.price || 0;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const totalAmount = originalAmount - discountAmount;
  const currency = sanitizeDisplayText(selectedPackage?.currency || 'EGP');
  const gameName = sanitizeDisplayText(game?.name || '');
  const packageName = sanitizeDisplayText(selectedPackage?.title || '');

  // Reset state when modal closes
  const handleClose = () => {
    setCurrentStep('confirmation');
    setSelectedPaymentMethod('card');
    setSelectedTransferType('wallet-transfer');
    setIsSubmittingTransfer(false);
    onClose();
  };

  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    if (method === 'card') {
      onConfirm('card');
    } else {
      setCurrentStep('wallet-options');
    }
  };

  // Handle wallet transfer type selection
  const handleTransferTypeSelect = (type: WalletTransferType) => {
    setSelectedTransferType(type);
    setCurrentStep('wallet-form');
  };

  const handleWalletTransferSubmit = async (data: WalletTransferData) => {
    if (!onWalletTransferSubmit) return;
    
    setIsSubmittingTransfer(true);
    try {
      await onWalletTransferSubmit(data, selectedTransferType);
      // Don't close modal here - let the parent handle redirect
    } catch (error) {

      // Keep the modal open on error so user can retry
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
        totalAmount={totalAmount}
        gameId={game?._id}
        packageId={selectedPackage?._id}
        accountInfo={accountInfo}
        onSubmit={handleWalletTransferSubmit}
        onCreateOrderWithTransfer={onCreateOrderWithTransfer ? (orderData, transferData) => onCreateOrderWithTransfer(orderData, transferData, selectedTransferType) : undefined}
        onBack={() => setCurrentStep('wallet-options')}
        onClose={handleClose}
        isSubmitting={isSubmittingTransfer || isLoading}
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
                src={game?.image?.secure_url || "/pubg.jpg"}
                alt={game?.name || 'Game'}
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
                  {packageName}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-gray-400">السعر الأصلي:</span>
                    <span className="text-lg font-bold text-white">
                      {originalAmount.toLocaleString()} {currency}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-gray-400">الخصم:</span>
                      <span className="text-lg font-bold text-red-400">
                        -{discountAmount.toLocaleString()} {currency}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                    <span className="text-lg text-gray-400">المجموع:</span>
                    <span className="text-2xl font-bold text-[#00e6c0]">
                      {totalAmount.toLocaleString()} {currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coupon Information */}
          {appliedCoupon && (
            <div className="bg-[#232329] rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#00e6c0]" />
                تفاصيل الكوبون
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-[#18181c] rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">كود الكوبون</span>
                    <span className="text-[#00e6c0] font-bold text-lg">
                      {appliedCoupon.code}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">نوع الخصم</span>
                    <span className="text-white font-medium">
                      {appliedCoupon.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">قيمة الخصم</span>
                    <span className="text-green-400 font-bold">
                      {appliedCoupon.type === 'percentage' 
                        ? `${appliedCoupon.value}%` 
                        : `${appliedCoupon.value} ${currency}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">مبلغ الخصم المطبق</span>
                    <span className="text-red-400 font-bold">
                      -{appliedCoupon.discountAmount.toLocaleString()} {currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Information */}
          {validateAccountInfo(accountInfo) && Object.keys(accountInfo).length > 0 && (
            <div className="bg-[#232329] rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#00e6c0]" />
                معلومات الحساب
              </h3>
              <div className="space-y-3">
                {Object.entries(accountInfo)
                  .filter(([fieldName, value]) => fieldName && value) // Filter out empty entries
                  .slice(0, 10) // Limit to 10 fields max
                  .map(([fieldName, value]) => (
                  <div key={sanitizeFieldName(fieldName)} className="p-3 bg-[#18181c] rounded-lg">
                    <div className="flex flex-col gap-2">
                      <span className="text-gray-400 text-sm font-medium">
                        {sanitizeFieldName(fieldName)}
                      </span>
                      <span className="text-white font-medium break-all text-sm leading-relaxed">
                        {sanitizeDisplayText(value)}
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

          {/* Total */}
          <div className="bg-gradient-to-r from-[#00e6c0]/10 to-[#00e6c0]/5 rounded-xl p-4 border border-[#00e6c0]/20">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white">المجموع الكلي</span>
              <span className="text-2xl font-bold text-[#00e6c0]">
                {totalAmount.toLocaleString()} {currency}
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-yellow-400 text-sm text-center">
              يرجى التأكد من صحة البيانات المدخلة قبل المتابعة. لن يمكن تعديلها بعد تأكيد الطلب.
            </p>
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

export default OrderConfirmationModal;