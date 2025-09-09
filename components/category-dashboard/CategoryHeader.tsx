'use client';

import React, { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LanguageSelector } from '@/components/ui/language-selector';
import { Logo } from '@/components/ui/logo';
import { useTranslation } from '@/lib/i18n';
import type { CategoryHeaderProps } from './types';

export const CategoryHeader: React.FC<CategoryHeaderProps> = memo(({
  isAuth,
  onOrdersClick
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  // Memoized navigation handler
  const handleSignInClick = useCallback(() => {
    router.push(`/signin?returnUrl=${encodeURIComponent('/category-dashboard')}`);
  }, [router]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#1A1B20]/90 backdrop-blur-md z-50 border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center min-w-0">
            <div className="flex-shrink-0">
              <Logo size="xl" showText={false} />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            {/* Language Selector - Hidden on very small screens */}
            <div className="hidden xs:block">
              <LanguageSelector />
            </div>
            
            {/* Auth Section */}
            {isAuth ? (
              <div
                onClick={onOrdersClick}
                role="button"
                title="طلباتي"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-600 overflow-hidden cursor-pointer transition-shadow hover:ring-2 hover:ring-emerald-400 hover:ring-offset-2 hover:ring-offset-[#1A1B20] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#1A1B20]"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOrdersClick();
                  }
                }}
              >
                <Image
                  src="https://res.cloudinary.com/dfvzhl8oa/image/upload/f_auto,q_auto,c_fill,g_face,w_64,h_64,dpr_2/v1754848996/d2090ffb-1769-4853-916c-79c2a4ae2568_gmih9f.jpg"
                  alt="Avatar"
                  width={32}
                  height={32}
                  sizes="32px"
                  className="w-full h-full object-cover"
                  unoptimized
                  priority
                />
              </div>
            ) : (
              <button 
                className="text-xs sm:text-sm font-semibold hover:text-gray-200 active:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#1A1B20] rounded px-2 py-1 whitespace-nowrap" 
                onClick={handleSignInClick}
                aria-label={t('dashboard.enter')}
              >
                <span className="hidden sm:inline">{t('dashboard.enter')}</span>
                <span className="sm:hidden">{t('dashboard.enterShort', 'Enter')}</span>
              </button>
            )}
            
            {/* Mobile Language Selector */}
            <div className="xs:hidden">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});

CategoryHeader.displayName = 'CategoryHeader';

export default CategoryHeader;