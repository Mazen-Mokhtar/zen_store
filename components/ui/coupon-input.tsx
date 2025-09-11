'use client';

import React, { useState } from 'react';
import { Loader2, Tag, Check, X, Percent } from 'lucide-react';
import { CouponValidationRequest, CouponValidationResponse, AppliedCoupon } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CouponInputProps {
  orderAmount: number;
  onCouponApplied?: (coupon: AppliedCoupon | null) => void;
  onCouponRemoved?: () => void;
  className?: string;
  disabled?: boolean;
}

export function CouponInput({
  orderAmount,
  onCouponApplied,
  onCouponRemoved,
  className,
  disabled = false
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
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
      const validationRequest: CouponValidationRequest = {
        code: couponCode.trim(),
        orderAmount
      };

      const response = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validationRequest),
      });

      const result: CouponValidationResponse = await response.json();

      if (result.isValid && result.coupon && result.discountAmount !== undefined && result.finalAmount !== undefined) {
        const appliedCouponData: AppliedCoupon = {
          code: result.coupon.code,
          type: result.coupon.type,
          value: result.coupon.value,
          discountAmount: result.discountAmount,
          originalAmount: orderAmount,
          finalAmount: result.finalAmount
        };
        
        setAppliedCoupon(appliedCouponData);
        onCouponApplied?.(appliedCouponData);
        setError(null);
      } else {
        setError(result.error || 'كوبون غير صالح');
        setAppliedCoupon(null);
        onCouponApplied?.(null);
      }
    } catch (error) {

      setError('حدث خطأ أثناء التحقق من الكوبون');
      setAppliedCoupon(null);
      onCouponApplied?.(null);
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setError(null);
    onCouponApplied?.(null);
    onCouponRemoved?.();
    setIsExpanded(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating && couponCode.trim()) {
      validateCoupon();
    }
  };

  if (appliedCoupon) {
    return (
      <div className={cn('bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/40 rounded-md backdrop-blur-sm p-2', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Check className="w-3 h-3 text-green-400" />
            <div>
              <p className="text-green-400 font-medium text-xs">
                {appliedCoupon.code}
              </p>
              <p className="text-green-300 text-xs leading-tight">
                {appliedCoupon.type === 'percentage' 
                  ? `${appliedCoupon.value}% خصم`
                  : `${appliedCoupon.value} جنيه خصم`
                }
              </p>
            </div>
          </div>
          <button
            onClick={removeCoupon}
            disabled={disabled}
            className="text-green-400 hover:text-green-300 transition-colors p-0.5 rounded disabled:opacity-50"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('transition-all duration-200', className)}>
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors duration-200 disabled:opacity-50 group"
        >
          <Tag className="w-3 h-3 group-hover:scale-110 transition-transform" />
          <span className="underline decoration-dotted underline-offset-2">هل لديك كوبون خصم؟</span>
        </button>
      ) : (
        <div className="mt-1.5 p-2 bg-gray-900/40 backdrop-blur-sm border border-gray-700/40 rounded-md">
          <div className="flex items-center gap-1.5 mb-1.5">
            <input
              type="text"
              placeholder="أدخل رمز الكوبون"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setError(null);
              }}
              onKeyPress={handleKeyPress}
              disabled={disabled || isValidating}
              className={cn(
                'flex-1 px-2 py-1 text-xs bg-gray-800/60 border border-gray-600/40 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40',
                error && 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
              )}
              dir="ltr"
            />
            <button
              onClick={validateCoupon}
              disabled={disabled || isValidating || !couponCode.trim()}
              className="px-2 py-1 text-xs bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white rounded hover:from-blue-700/90 hover:to-purple-700/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isValidating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                'تطبيق'
              )}
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              disabled={disabled}
              className="text-xs text-gray-400 hover:text-gray-300 transition-colors px-1"
            >
              ✕
            </button>
          </div>
          
          {error && (
            <p className="text-red-400 text-xs leading-tight">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CouponInput;