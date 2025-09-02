'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { WalletTransferType } from './WalletTransferOptions';

interface WalletTransferFormProps {
  transferType: WalletTransferType;
  orderId?: string;
  totalAmount: number;
  gameId?: string;
  packageId?: string;
  accountInfo?: any;
  onSubmit: (data: WalletTransferData) => Promise<void>;
  onCreateOrderWithTransfer?: (orderData: any, transferData: WalletTransferData) => Promise<void>;
  onBack: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export interface WalletTransferData {
  walletTransferImage: File;
  walletTransferNumber: string;
  nameOfInsta?: string;
}

const WalletTransferForm: React.FC<WalletTransferFormProps> = ({
  transferType,
  orderId,
  totalAmount,
  gameId,
  packageId,
  accountInfo,
  onSubmit,
  onCreateOrderWithTransfer,
  onBack,
  onClose,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState({
    walletTransferNumber: '',
    nameOfInsta: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const transferTypeLabels = {
    'wallet-transfer': 'تحويل إلى محفظة',
    'insta-transfer': 'تحويل عبر إنستا باي',
    'fawry-transfer': 'تحويل عبر فوري'
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'يرجى اختيار ملف صورة صحيح' }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' }));
        return;
      }

      setSelectedImage(file);
      setErrors(prev => ({ ...prev, image: '' }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate image
    if (!selectedImage) {
      newErrors.image = 'صورة التحويل مطلوبة';
    }

    // Validate transfer number
    if (!formData.walletTransferNumber.trim()) {
      newErrors.walletTransferNumber = 'رقم التحويل مطلوب';
    } else if (formData.walletTransferNumber.length < 3) {
      newErrors.walletTransferNumber = 'رقم التحويل يجب أن يكون على الأقل 3 أرقام';
    } else if (!/^[0-9]+$/.test(formData.walletTransferNumber)) {
      newErrors.walletTransferNumber = 'رقم التحويل يجب أن يحتوي على أرقام فقط';
    }

    // Validate Instagram name for insta-transfer
    if (transferType === 'insta-transfer') {
      if (!formData.nameOfInsta.trim()) {
        newErrors.nameOfInsta = 'اسم الإنستا مطلوب لتحويل إنستا باي';
      } else if (formData.nameOfInsta.length < 2) {
        newErrors.nameOfInsta = 'اسم الإنستا يجب أن يكون على الأقل حرفين';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedImage) {
      return;
    }

    const transferData: WalletTransferData = {
      walletTransferImage: selectedImage,
      walletTransferNumber: formData.walletTransferNumber,
      ...(transferType === 'insta-transfer' && { nameOfInsta: formData.nameOfInsta })
    };

    try {
      if (!orderId && onCreateOrderWithTransfer && gameId && accountInfo) {
        const orderData = {
          gameId,
          packageId,
          accountInfo,
          paymentMethod: transferType,
          note: ''
        };
        await onCreateOrderWithTransfer(orderData, transferData);
      } else {
        await onSubmit(transferData);
      }
    } catch (error) {
      console.error('Error submitting transfer:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1f] rounded-2xl border border-gray-700 w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {transferTypeLabels[transferType]}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                المبلغ: {totalAmount.toLocaleString()} جنيه
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Target Number Display */}
          <div className="bg-[#232329] rounded-xl p-4 border border-gray-600">
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              الرقم المستهدف للتحويل:
            </h4>
            <div className="text-lg font-bold text-[#00e6c0] text-center">
              01234567890
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              صورة التحويل *
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={isSubmitting}
              />
              
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Transfer preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-500 transition-colors"
                  disabled={isSubmitting}
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-400">اضغط لاختيار صورة التحويل</span>
                  <span className="text-xs text-gray-500">PNG, JPG حتى 5MB</span>
                </button>
              )}
            </div>
            {errors.image && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.image}</span>
              </div>
            )}
          </div>

          {/* Transfer Number */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              آخر 3 أرقام أو الرقم كامل للتحويل *
            </label>
            <input
              type="text"
              value={formData.walletTransferNumber}
              onChange={(e) => handleInputChange('walletTransferNumber', e.target.value)}
              placeholder="مثال: 123 أو 1234567890"
              className="w-full px-4 py-3 bg-[#232329] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#00e6c0] focus:outline-none transition-colors"
              disabled={isSubmitting}
            />
            {errors.walletTransferNumber && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.walletTransferNumber}</span>
              </div>
            )}
          </div>

          {/* Instagram Name (only for insta-transfer) */}
          {transferType === 'insta-transfer' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                اسم الإنستا *
              </label>
              <input
                type="text"
                value={formData.nameOfInsta}
                onChange={(e) => handleInputChange('nameOfInsta', e.target.value)}
                placeholder="اسم المستخدم في إنستا باي"
                className="w-full px-4 py-3 bg-[#232329] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#00e6c0] focus:outline-none transition-colors"
                disabled={isSubmitting}
              />
              {errors.nameOfInsta && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.nameOfInsta}</span>
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-yellow-400 text-sm">
                <p className="font-medium mb-1">تنبيه مهم:</p>
                <ul className="space-y-1 text-xs">
                  <li>• تأكد من صحة البيانات المدخلة</li>
                  <li>• ستتم مراجعة التحويل من قبل الإدارة</li>
                  <li>• سيتم التواصل معك في حالة وجود مشكلة</li>
                </ul>
              </div>
            </div>
          </div>
        </form>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-medium transition-colors"
            disabled={isSubmitting}
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedImage || !formData.walletTransferNumber}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              isSubmitting || !selectedImage || !formData.walletTransferNumber
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-[#00e6c0] hover:bg-[#00d4aa] text-black'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                إرسال التحويل
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletTransferForm;