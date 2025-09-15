'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Home, AlertCircle, ArrowLeft, HelpCircle, RefreshCw, XCircle, ShoppingCart } from 'lucide-react';
import { Footer } from '@/components/ui/footer-section';
import { SharedNavbar } from '@/components/ui/shared-navbar';

export default function PaymentCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    // استخراج معرف الطلب والسبب من URL
    const orderIdParam = searchParams.get('orderId');
    const reasonParam = searchParams.get('reason');
    
    if (orderIdParam) {
      setOrderId(orderIdParam);
    }
    
    if (reasonParam) {
      setReason(reasonParam);
    }
    
    setLoading(false);
  }, [searchParams]);

  const handleViewOrders = () => {
    router.push('/orders');
  };

  const handleTryAgain = () => {
    router.push('/dashboard');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="bg-[#0D0E12] min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>جاري التحقق من حالة الطلب...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D0E12] min-h-screen text-white">
      <SharedNavbar title="إلغاء الدفع" />

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center max-w-md mx-auto px-6">
          {/* Error Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">تم إلغاء الطلب</h1>
            <p className="text-gray-400 mb-6">
              {reason ? reason : 'تم رفض أو إلغاء طلبك. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.'}
            </p>
          </div>

          {/* Order Details */}
          {orderId && (
            <div className="bg-[#232329] rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">تفاصيل الطلب</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">رقم الطلب:</span>
                  <span className="text-white font-mono">{orderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">الحالة:</span>
                  <span className="text-red-400 font-medium">مرفوض/ملغي</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">التاريخ:</span>
                  <span className="text-white">{new Date().toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8">
            <h4 className="text-yellow-400 font-medium mb-2">هل تحتاج مساعدة؟</h4>
            <p className="text-yellow-400/80 text-sm mb-3">
              إذا كنت تعتقد أن هناك خطأ، يرجى التواصل مع فريق الدعم.
            </p>
            <div className="text-yellow-400 text-sm">
              <p>📧 البريد الإلكتروني: support@zenstore.com</p>
              <p>📱 الواتساب: +20 123 456 7890</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleTryAgain}
              className="w-full bg-[#00e6c0] hover:bg-[#00d4aa] text-black font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              المحاولة مرة أخرى
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={handleViewOrders}
                className="flex-1 bg-[#232329] hover:bg-[#2a2a31] text-white font-medium py-3 px-6 rounded-xl transition-colors"
              >
                عرض طلباتي
              </button>
              
              <button
                onClick={handleGoHome}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                الرئيسية
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}