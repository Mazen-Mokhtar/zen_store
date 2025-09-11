'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sessionMonitor } from '@/lib/sessionMonitor';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';
import { useScrollLock } from '@/hooks/useScrollLock';

interface SessionManagerProps {
  children: React.ReactNode;
}

export default function SessionManager({ children }: SessionManagerProps) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Prevent body scrolling when warning modal is open
  useScrollLock(showWarning);

  useEffect(() => {
    // Use the imported authService instance
    
    // Check if user is authenticated
    const checkAuth = async () => {
      const token = authService.getToken();
      const isValid = authService.validateToken(token);
      setIsAuthenticated(isValid);
      
      if (isValid) {
        // Start session monitoring for authenticated users
        sessionMonitor.start({
          onSessionExpired: handleSessionExpired,
          onSessionWarning: handleSessionWarning
        });
      }
    };

    checkAuth();

    // Cleanup on unmount
    return () => {
      sessionMonitor.stop();
    };
  }, []);

  const handleSessionExpired = () => {
    toast.error('جلستك انتهت، يرجى تسجيل الدخول مرة أخرى');
    
    // Clear any local auth state
    setIsAuthenticated(false);
    setShowWarning(false);
    
    // Redirect to login
    router.push('/auth/login');
  };

  const handleSessionWarning = (timeLeftMs: number) => {
    const minutes = Math.round(timeLeftMs / 60000);
    setTimeLeft(minutes);
    setShowWarning(true);
    
    // Show toast warning
    toast.warning(`ستنتهي جلستك خلال ${minutes} دقائق`);
  };

  const handleContinueSession = () => {
    // Simply dismiss the warning - the token is still valid
    setShowWarning(false);
    toast.success('تم الاستمرار في الجلسة');
  };

  const handleDismissWarning = () => {
    setShowWarning(false);
  };

  return (
    <>
      {children}
      
      {/* Session Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">تحذير انتهاء الجلسة</h3>
                <p className="text-sm text-gray-600">ستنتهي جلستك خلال {timeLeft} دقائق</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              هل تريد الاستمرار في جلستك أم تسجيل الخروج؟
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDismissWarning}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                تجاهل
              </button>
              <button
                onClick={handleSessionExpired}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                تسجيل الخروج
              </button>
              <button
                onClick={handleContinueSession}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                الاستمرار
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}