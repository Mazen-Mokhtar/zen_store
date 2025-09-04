'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LanguageSelector } from '@/components/ui/language-selector';
import { Logo } from '@/components/ui/logo';
import { useTranslation } from '@/lib/i18n';
import type { CategoryHeaderProps } from './types';

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  isAuth,
  onOrdersClick
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#1A1B20]/80 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Logo size="xl" showText={false} />
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            {isAuth ? (
              <div
                onClick={onOrdersClick}
                role="button"
                title="طلباتي"
                className="w-8 h-8 rounded-full border border-gray-600 overflow-hidden cursor-pointer transition-shadow hover:ring-2 hover:ring-emerald-400 hover:ring-offset-2 hover:ring-offset-[#1A1B20]"
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
                className="text-sm font-semibold hover:text-gray-200" 
                onClick={() => router.push(`/signin?returnUrl=${encodeURIComponent('/category-dashboard')}`)}
              >
                {t('dashboard.enter')}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default CategoryHeader;