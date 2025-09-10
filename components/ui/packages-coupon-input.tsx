'use client';

import React, { useState } from 'react';
import { Loader2, Tag, Check, X, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PackagesCouponInputProps {
  onCouponChange?: (couponCode: string) => void;
  className?: string;
  disabled?: boolean;
}

export function PackagesCouponInput({
  onCouponChange,
  className,
  disabled = false
}: PackagesCouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setError('يرجى إدخال رمز الكوبون');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch(`/api/coupon/details/${encodeURIComponent(couponCode.trim())}`);
      const result = await response.json();

      if (result.success && result.data && result.data.status?.isValid) {
        setAppliedCoupon(result.data);
        setError(null);
        onCouponChange?.(couponCode.trim());
      } else {
        setError('كوبون غير صالح أو منتهي الصلاحية');
        setAppliedCoupon(null);
        onCouponChange?.('');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setError('حدث خطأ أثناء التحقق من الكوبون');
      setAppliedCoupon(null);
      onCouponChange?.('');
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setError(null);
    onCouponChange?.('');
    setIsExpanded(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating && couponCode.trim()) {
      validateCoupon();
    }
  };

  if (appliedCoupon) {
    return (
      <div className={cn('bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/40 rounded-md backdrop-blur-sm p-3', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <div>
              <p className="text-green-400 font-medium text-sm">
                {appliedCoupon.code}
              </p>
              <p className="text-green-300 text-xs leading-tight">
                {appliedCoupon.type === 'percentage' 
                  ? `${appliedCoupon.value}% خصم`
                  : `${appliedCoupon.value} جنيه خصم`
                }
                {appliedCoupon.minOrderAmount > 0 && (
                  <span className="block text-green-300/80">
                    الحد الأدنى: {appliedCoupon.minOrderAmount} جنيه
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={removeCoupon}
            disabled={disabled}
            className="text-green-400 hover:text-green-300 transition-colors p-1 rounded disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-gray-600 rounded-md text-gray-400 hover:text-gray-300 hover:border-gray-500 transition-colors disabled:opacity-50"
        >
          <Tag className="w-4 h-4" />
          <span className="text-sm">إضافة كوبون خصم (اختياري)</span>
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="أدخل رمز الكوبون"
              disabled={disabled || isValidating}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00e6c0] focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={validateCoupon}
              disabled={disabled || isValidating || !couponCode.trim()}
              className="px-4 py-2 bg-[#00e6c0] text-black rounded-md font-medium hover:bg-[#00d4aa] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              تطبيق
            </button>
          </div>
          
          <button
            onClick={() => {
              setIsExpanded(false);
              setCouponCode('');
              setError(null);
            }}
            disabled={disabled}
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            إلغاء
          </button>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-900/20 border border-red-700/40 rounded-md">
          <X className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}

export default PackagesCouponInput;