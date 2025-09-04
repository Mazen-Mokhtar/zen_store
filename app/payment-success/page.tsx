"use client";
// Add dynamic export to prevent static prerendering
export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { AuthStatus } from '@/components/ui/auth-status';
import { Logo } from '@/components/ui/logo';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // استخراج معرف الطلب من URL
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // يمكن هنا جلب تفاصيل الطلب من Stripe
      setOrderId(sessionId);
    }
    setLoading(false);
  }, [searchParams]);

  const handleViewOrders = () => {
    router.push('/orders');
  };

  const handleContinueShopping = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="bg-[#0D0E12] min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00e6c0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>جاري التحقق من الدفع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D0E12] min-h-screen text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#1b2631]">
        <Logo size="lg" textSize="lg" />
        <AuthStatus />
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center max-w-md mx-auto px-6">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">تم الدفع بنجاح!</h1>
            <p className="text-gray-400 mb-6">
              شكراً لك على الشراء. سيتم معالجة طلبك قريباً.
            </p>
          </div>

          {/* Order Details */}
          {orderId && (
            <div className="bg-[#232329] rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-6 h-6 text-[#00e6c0]" />
                <h2 className="text-lg font-semibold">تفاصيل الطلب</h2>
              </div>
              <div className="text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">رقم الطلب:</span>
                  <span className="font-mono text-sm">#{orderId.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">الحالة:</span>
                  <span className="text-green-400 font-semibold">مدفوع</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">تاريخ الدفع:</span>
                  <span className="text-sm">{new Date().toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleViewOrders}
              className="w-full bg-[#00e6c0] text-[#151e2e] font-bold py-3 px-6 rounded-lg hover:bg-[#00e6c0]/90 transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              عرض طلباتي
            </button>
            
            <button
              onClick={handleContinueShopping}
              className="w-full border border-[#00e6c0] text-[#00e6c0] font-bold py-3 px-6 rounded-lg hover:bg-[#00e6c0] hover:text-[#151e2e] transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              متابعة التسوق
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-sm text-gray-500">
            <p>سيتم إرسال تفاصيل الطلب إلى بريدك الإلكتروني</p>
            <p className="mt-2">للمساعدة، تواصل معنا على support@endex.com</p>
          </div>
        </div>
      </main>
    </div>
  );
}











