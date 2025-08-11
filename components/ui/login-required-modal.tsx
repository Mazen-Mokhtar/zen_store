"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowRight } from 'lucide-react';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function LoginRequiredModal({ isOpen, onClose, onLogin }: LoginRequiredModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogin = () => {
    onLogin();
    onClose();
  };

  const handleSignup = () => {
    router.push('/signup');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#232329] rounded-2xl p-8 max-w-md w-full border border-gray-700">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">تسجيل الدخول مطلوب</h2>
          <p className="text-gray-400">
            يجب تسجيل الدخول أولاً لإتمام عملية الشراء
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
            <User className="w-5 h-5 text-[#00e6c0]" />
            <div>
              <h3 className="font-semibold text-white">حساب آمن</h3>
              <p className="text-sm text-gray-400">احتفظ بسجل طلباتك وتتبعها</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
            <ArrowRight className="w-5 h-5 text-[#00e6c0]" />
            <div>
              <h3 className="font-semibold text-white">شراء سريع</h3>
              <p className="text-sm text-gray-400">إتمام الطلبات بسهولة وأمان</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleLogin}
            className="w-full bg-[#00e6c0] text-[#151e2e] font-bold py-3 px-6 rounded-lg hover:bg-[#00e6c0]/90 transition-colors"
          >
            تسجيل الدخول
          </button>
          
          <button
            onClick={handleSignup}
            className="w-full border border-[#00e6c0] text-[#00e6c0] font-bold py-3 px-6 rounded-lg hover:bg-[#00e6c0] hover:text-[#151e2e] transition-colors"
          >
            إنشاء حساب جديد
          </button>
          
          <button
            onClick={onClose}
            className="w-full text-gray-400 hover:text-white transition-colors py-2"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}











