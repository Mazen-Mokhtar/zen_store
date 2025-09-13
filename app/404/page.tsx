'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/ui/footer-section';

const NotFoundPage = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Clear any sensitive data from browser history
    if (typeof window !== 'undefined') {
      // Replace current history entry to prevent back navigation to admin pages
      window.history.replaceState(null, '', '/404');
    }
  }, []);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    // Safely navigate back, but not to admin pages
    if (typeof window !== 'undefined' && window.history.length > 1) {
      const referrer = document.referrer;
      // Check if referrer contains admin paths
      if (referrer && (referrer.includes('/admin') || referrer.includes('/api/'))) {
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
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ZS</span>
              </div>
              <span className="text-white font-semibold text-lg">Zen Store</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Animation */}
          <div className="relative mb-8">
            <div className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse">
              404
            </div>
            <div className="absolute inset-0 text-8xl md:text-9xl font-bold text-gray-800/20 blur-sm">
              404
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              الصفحة غير موجودة
            </h1>
            <p className="text-gray-400 text-lg mb-2">
              عذراً، الصفحة التي تبحث عنها غير متوفرة
            </p>
            <p className="text-gray-500 text-sm">
              قد تكون الصفحة محذوفة أو تم تغيير الرابط
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGoHome}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Home size={20} />
              <span>العودة للرئيسية</span>
            </button>
            
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft size={20} />
              <span>الصفحة السابقة</span>
            </button>
          </div>

          {/* Search Suggestion */}
          <div className="mt-12 p-6 bg-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-center mb-4">
              <Search className="text-gray-400" size={24} />
            </div>
            <h3 className="text-white font-semibold mb-2">هل تبحث عن شيء محدد؟</h3>
            <p className="text-gray-400 text-sm mb-4">
              يمكنك تصفح الألعاب والحزم المتاحة من الصفحة الرئيسية
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">الألعاب</span>
              <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">الحزم</span>
              <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">الفئات</span>
              <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">العروض</span>
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