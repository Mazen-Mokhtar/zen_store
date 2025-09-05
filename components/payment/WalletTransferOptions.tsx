'use client';

import React, { useState } from 'react';
import { Wallet, Instagram, CreditCard, ArrowRight } from 'lucide-react';

export type WalletTransferType = 'wallet-transfer' | 'insta-transfer' | 'fawry-transfer';

interface WalletTransferOptionsProps {
  selectedOption: WalletTransferType | null;
  onOptionChange: (option: WalletTransferType) => void;
  onBack: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

const WalletTransferOptions: React.FC<WalletTransferOptionsProps> = ({
  selectedOption,
  onOptionChange,
  onBack,
  onClose,
  isLoading = false
}) => {
  const [processingOption, setProcessingOption] = useState<WalletTransferType | null>(null);

  const handleOptionSelect = async (option: WalletTransferType) => {
    setProcessingOption(option);
    try {
      await onOptionChange(option);
    } finally {
      setProcessingOption(null);
    }
  };

  const transferOptions = [
    {
      id: 'wallet-transfer' as WalletTransferType,
      title: 'تحويل إلى محفظة',
      description: 'تحويل مباشر إلى المحفظة الإلكترونية',
      icon: Wallet,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/20',
      requirements: ['صورة التحويل', 'آخر 3 أرقام أو الرقم كامل']
    },
    {
      id: 'insta-transfer' as WalletTransferType,
      title: 'تحويل عبر إنستا باي',
      description: 'تحويل عبر تطبيق إنستا باي',
      icon: Instagram,
      color: 'text-pink-400',
      bgColor: 'bg-pink-400/20',
      requirements: ['صورة التحويل', 'آخر 3 أرقام أو الرقم كامل', 'اسم الإنستا']
    },
    {
      id: 'fawry-transfer' as WalletTransferType,
      title: 'تحويل عبر فوري',
      description: 'تحويل عبر خدمة فوري',
      icon: CreditCard,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/20',
      requirements: ['صورة التحويل', 'آخر 3 أرقام أو الرقم كامل']
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1f] rounded-2xl border border-gray-700 w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>
            <h2 className="text-xl font-bold text-white">
              اختر طريقة التحويل
            </h2>
          </div>
        </div>

        {/* Transfer Options */}
        <div className="p-6 space-y-4">
          {transferOptions.map((option) => {
            const IconComponent = option.icon;
            const isSelected = selectedOption === option.id;
            
            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                disabled={isLoading || processingOption !== null}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-right ${
                  isSelected
                    ? 'border-[#00e6c0] bg-[#00e6c0]/10'
                    : 'border-gray-600 bg-[#232329] hover:border-gray-500'
                } ${isLoading || processingOption !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    isSelected ? 'bg-[#00e6c0]/20' : option.bgColor
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      isSelected ? 'text-[#00e6c0]' : option.color
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {option.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">
                      {option.description}
                    </p>
                    
                    {/* Requirements */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-300 mb-2">
                        المتطلبات:
                      </p>
                      {option.requirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          <span className="text-xs text-gray-400">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {processingOption === option.id && (
                    <div className="w-5 h-5 border-2 border-[#00e6c0] border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Target Number Display */}
        <div className="px-6 pb-4">
          <div className="bg-[#232329] rounded-xl p-4 border border-gray-600">
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              الرقم المستهدف للتحويل:
            </h4>
            <div className="text-lg font-bold text-[#00e6c0] text-center">
              01234567890
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              يرجى التحويل إلى هذا الرقم وإرفاق صورة التحويل
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading || processingOption !== null}
            className={`flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-medium transition-colors ${
              isLoading || processingOption !== null ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            إلغاء
          </button>
          <button
            onClick={() => {
              if (selectedOption) {
                handleOptionSelect(selectedOption);
              }
            }}
            disabled={!selectedOption || isLoading || processingOption !== null}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              selectedOption && !isLoading && processingOption === null
                ? 'bg-[#00e6c0] hover:bg-[#00d4aa] text-black'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading || processingOption !== null ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
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

export default WalletTransferOptions;