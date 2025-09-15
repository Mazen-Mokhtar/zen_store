'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthStatus } from '@/components/ui/auth-status';
import { authService } from '@/lib/auth';
import { Logo } from '@/components/ui/logo';

interface SharedNavbarProps {
  title?: string;
  showBackButton?: boolean;
  className?: string;
}

export const SharedNavbar = ({ title, showBackButton = false, className = '' }: SharedNavbarProps) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  return (
    <header className={`bg-black/20 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Logo 
              size="xl" 
              showText={false} 
              className="flex items-center"
            />
            {title && (
              <div className="hidden md:flex items-center space-x-1 text-gray-400">
                <span className="text-sm">{title}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white transition-colors"
              >
                العودة
              </button>
            )}
            {isAuthenticated ? (
              <AuthStatus />
            ) : (
              <button
                onClick={() => router.push('  /signin')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                تسجيل الدخول
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};