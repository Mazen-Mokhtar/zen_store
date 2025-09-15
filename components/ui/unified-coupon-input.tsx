'use client';

import React, { useState } from 'react';
import { Loader2, Tag, Check, X, Percent } from 'lucide-react';
import { CouponValidationRequest, CouponValidationResponse, AppliedCoupon } from '@/lib/types';
import { cn } from '@/lib/utils';

interface UnifiedCouponInputProps {
  // For order-based validation
  orderAmount?: number;
  onCouponApplied?: (coupon: AppliedCoupon | null) => void;
  onCouponRemoved?: () => void;
  
  // For packages-based validation
  onCouponChange?: (couponCode: string) => void;
  
  // Common props
  className?: string;
  disabled?: boolean;
  mode?: 'order' | 'packages';
}

export function UnifiedCouponInput({
  orderAmount,
  onCouponApplied,
  onCouponRemoved,
  onCouponChange,
  className,
  disabled = false,
  mode = 'order'
}: UnifiedCouponInputProps) {
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
      if (mode === 'order') {
        // Order-based validation
        const validationRequest: CouponValidationRequest = {
          code: couponCode.trim(),
          orderAmount: orderAmount || 0
        };

        const response = await fetch('/api/coupon/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validationRequest),
        });

        const result: CouponValidationResponse = await response.json();

        if (result.success && result.data) {
          const appliedCouponData: AppliedCoupon = {
            code: result.data.code,
            discountAmount: result.data.discountAmount,
            discountPercentage: result.data.discountPercentage,
            type: result.data.type,
            description: result.data.description
          };
          
          setAppliedCoupon(appliedCouponData);
          setError(null);
          onCouponApplied?.(appliedCouponData);
        } else {
          setError(result.message || 'كوبون غير صالح');
          setAppliedCoupon(null);
          onCouponApplied?.(null);
        }
      } else {
        // Packages-based validation
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
      }
    } catch (error) {
      setError('حدث خطأ أثناء التحقق من الكوبون');
      setAppliedCoupon(null);
      if (mode === 'order') {
        onCouponApplied?.(null);
      } else {
        onCouponChange?.('');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setError(null);
    if (mode === 'order') {
      onCouponRemoved?.();
    } else {
      onCouponChange?.('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCouponCode(value);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating && couponCode.trim()) {
      validateCoupon();
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 text-sm font-medium transition-colors',
          'hover:text-green-600 focus:outline-none focus:text-green-600',
          disabled && 'opacity-50 cursor-not-allowed',
          appliedCoupon ? 'text-green-600' : 'text-gray-600'
        )}
      >
        <Tag className="h-4 w-4" />
        {appliedCoupon ? 'تم تطبيق الكوبون' : 'لديك كوبون خصم؟'}
        {appliedCoupon && <Check className="h-4 w-4 text-green-600" />}
      </button>

      {/* Applied Coupon Display */}
      {appliedCoupon && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-green-700">
              <Percent className="h-4 w-4" />
              <span className="font-medium">{appliedCoupon.code}</span>
            </div>
            <span className="text-sm text-green-600">
              {appliedCoupon.description || 'خصم مطبق'}
            </span>
          </div>
          <button
            type="button"
            onClick={removeCoupon}
            disabled={disabled}
            className="text-green-700 hover:text-green-800 focus:outline-none disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input Section */}
      {isExpanded && !appliedCoupon && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={couponCode}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="أدخل رمز الكوبون"
                disabled={disabled || isValidating}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent',
                  'disabled:bg-gray-50 disabled:cursor-not-allowed',
                  error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                )}
              />
            </div>
            <button
              type="button"
              onClick={validateCoupon}
              disabled={disabled || isValidating || !couponCode.trim()}
              className={cn(
                'px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium',
                'hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                'disabled:bg-gray-300 disabled:cursor-not-allowed',
                'transition-colors duration-200'
              )}
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'تطبيق'
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              <X className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export legacy components for backward compatibility
export const CouponInput = (props: Omit<UnifiedCouponInputProps, 'mode'>) => (
  <UnifiedCouponInput {...props} mode="order" />
);

export const PackagesCouponInput = (props: Omit<UnifiedCouponInputProps, 'mode'>) => (
  <UnifiedCouponInput {...props} mode="packages" />
);

export default UnifiedCouponInput;