'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Search, ArrowLeft, Shield } from 'lucide-react';
import { Footer } from '@/components/ui/footer-section';
import { SharedNavbar } from '@/components/ui/shared-navbar';

const NotFoundPage = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Clear any sensitive data from localStorage/sessionStorage
    if (typeof window !== 'undefined') {
      // Clear any cached user data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      
      // Clear any admin-related data
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminUser');
    }
  }, []);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    // Safely navigate back, but not to admin pages
    if (typeof window !== 'undefined' && window.history.length > 1) {
      const referrer = document.referrer;
      // Check if referrer contains admin paths or sensitive routes
      if (referrer && (
        referrer.includes('/admin') || 
        referrer.includes('/api/') ||
        referrer.includes('/profile/admin') ||
        referrer.includes('/order/admin')
      )) {
        router.push('/');
      } else {
        router.back();
      }
    } else {
      router.push('/');
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col" suppressHydrationWarning>
        {/* Loading state that matches the final render */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      <SharedNavbar title="خطأ 404" />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Animation */}
          <div className="relative mb-8">
            <div className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-500 to-yellow-500 animate-pulse">
              404
            </div>
            <div className="absolute inset-0 text-8xl md:text-9xl font-bold text-gray-800/20 blur-sm">
              404
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              الصفحة غير متوفرة
            </h1>
            <p className="text-gray-400 text-lg mb-2">
              عذراً، لا يمكن العثور على الصفحة المطلوبة
            </p>
            <p className="text-gray-500 text-sm">
              تأكد من صحة الرابط أو ارجع إلى الصفحة الرئيسية
            </p>
          </div>

          {/* Security Notice */}
          <div className="mb-8 p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Shield className="text-blue-400 mr-2" size={20} />
              <span className="text-blue-400 font-medium text-sm">إشعار أمني</span>
            </div>
            <p className="text-gray-400 text-xs">
              تم تسجيل محاولة الوصول هذه لأغراض الأمان
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGoHome}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Home size={20} />
              <span>الصفحة الرئيسية</span>
            </button>
            
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft size={20} />
              <span>العودة</span>
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-12 p-6 bg-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-center mb-4">
              <Search className="text-gray-400" size={24} />
            </div>
            <h3 className="text-white font-semibold mb-2">تحتاج مساعدة؟</h3>
            <p className="text-gray-400 text-sm mb-4">
              تصفح المحتوى المتاح أو تواصل مع فريق الدعم
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs cursor-pointer hover:bg-gray-600 transition-colors" onClick={handleGoHome}>الألعاب</span>
              <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs cursor-pointer hover:bg-gray-600 transition-colors" onClick={handleGoHome}>الحزم</span>
              <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs cursor-pointer hover:bg-gray-600 transition-colors" onClick={handleGoHome}>الفئات</span>
              <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs cursor-pointer hover:bg-gray-600 transition-colors" onClick={handleGoHome}>الدعم</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default NotFoundPage;