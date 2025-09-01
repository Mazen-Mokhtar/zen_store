"use client";

import React from 'react';
import { X, Package, CreditCard, User, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import type { SteamGame } from '@/lib/types';

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

interface SteamOrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  game: SteamGame;
  accountInfo: { fieldName: string; value: string }[];
  isLoading?: boolean;
}

export function SteamOrderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  game,
  accountInfo,
  isLoading = false
}: SteamOrderConfirmationModalProps) {
  // Security: Early return with validation
  if (!isOpen || !validateSteamGameProps(game)) return null;

  // Security: Safe property access with fallbacks
  const currentPrice = game?.isOffer && game?.finalPrice ? game.finalPrice : game?.price || 0;
  const hasDiscount = game?.isOffer && game?.originalPrice && game?.finalPrice && game.originalPrice > game.finalPrice;
  const gameName = sanitizeDisplayText(game?.name || '');

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
                    {currentPrice.toLocaleString()} EGP
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-gray-500 line-through">
                      {game.originalPrice?.toLocaleString()} EGP
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

          {/* Total */}
          <div className="bg-gradient-to-r from-[#00e6c0]/10 to-[#00e6c0]/5 rounded-xl p-4 border border-[#00e6c0]/20">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white">المجموع الكلي</span>
              <span className="text-2xl font-bold text-[#00e6c0]">
                {currentPrice.toLocaleString()} EGP
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
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            disabled={isLoading}
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
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
                تأكيد الطلب
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SteamOrderConfirmationModal;