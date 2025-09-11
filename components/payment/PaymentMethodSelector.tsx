'use client';

import React, { useState } from 'react';
import { CreditCard, Wallet } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';

export type PaymentMethodType = 'card' | 'wallet-transfer';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onMethodChange: (method: PaymentMethodType) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  onClose,
  isLoading = false
}) => {
  const [processingMethod, setProcessingMethod] = useState<PaymentMethodType | null>(null);
  
  // Prevent body scrolling when modal is open
  useScrollLock(true);

  const handleMethodSelect = async (method: PaymentMethodType) => {
    setProcessingMethod(method);
    try {
      await onMethodChange(method);
    } finally {
      setProcessingMethod(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1f] rounded-2xl border border-gray-700 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white text-center">
            اختر طريقة الدفع
          </h2>
        </div>

        {/* Payment Methods */}
        <div className="p-6 space-y-4">
          {/* Card Payment */}
          <button
            onClick={() => handleMethodSelect('card')}
            disabled={isLoading || processingMethod !== null}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
              selectedMethod === 'card'
                ? 'border-[#00e6c0] bg-[#00e6c0]/10'
                : 'border-gray-600 bg-[#232329] hover:border-gray-500'
            } ${isLoading || processingMethod !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                selectedMethod === 'card' ? 'bg-[#00e6c0]/20' : 'bg-gray-700'
              }`}>
                <CreditCard className={`w-6 h-6 ${
                  selectedMethod === 'card' ? 'text-[#00e6c0]' : 'text-gray-400'
                }`} />
              </div>
              <div className="text-right flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  الدفع العادي
                </h3>
                <p className="text-sm text-gray-400">
                  دفع فوري بالبطاقة الائتمانية
                </p>
              </div>
              {processingMethod === 'card' && (
                <div className="w-5 h-5 border-2 border-[#00e6c0] border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </button>

          {/* Wallet Transfer */}
          <button
            onClick={() => handleMethodSelect('wallet-transfer')}
            disabled={isLoading || processingMethod !== null}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
              selectedMethod === 'wallet-transfer'
                ? 'border-[#00e6c0] bg-[#00e6c0]/10'
                : 'border-gray-600 bg-[#232329] hover:border-gray-500'
            } ${isLoading || processingMethod !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                selectedMethod === 'wallet-transfer' ? 'bg-[#00e6c0]/20' : 'bg-gray-700'
              }`}>
                <Wallet className={`w-6 h-6 ${
                  selectedMethod === 'wallet-transfer' ? 'text-[#00e6c0]' : 'text-gray-400'
                }`} />
              </div>
              <div className="text-right flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  تحويل محفظة
                </h3>
                <p className="text-sm text-gray-400">
                  تحويل عبر المحفظة الإلكترونية أو إنستا باي أو فوري
                </p>
              </div>
              {processingMethod === 'wallet-transfer' && (
                <div className="w-5 h-5 border-2 border-[#00e6c0] border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading || processingMethod !== null}
            className={`flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-medium transition-colors ${
              isLoading || processingMethod !== null ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            إلغاء
          </button>
          <button
            onClick={() => handleMethodSelect(selectedMethod)}
            disabled={isLoading || processingMethod !== null}
            className={`flex-1 px-4 py-3 bg-[#00e6c0] hover:bg-[#00d4aa] text-black rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              isLoading || processingMethod !== null ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading || processingMethod !== null ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                جاري المعالجة...
              </>
            ) : (
              'متابعة'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;