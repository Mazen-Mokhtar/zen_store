'use client';

import React, { memo, useMemo } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import type { CategoryHeroProps } from './types';

export const CategoryHero: React.FC<CategoryHeroProps> = memo(({
  categoryName,
  heroImages,
  current,
  gamesCount
}) => {
  const { t } = useTranslation();

  // Memoize the games count text
  const gamesCountText = useMemo(() => 
    `${gamesCount} ${t('dashboard.gamesAvailable')}`, 
    [gamesCount, t]
  );

  return (
    <section className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[60vh] overflow-hidden">
      {/* Background Images Carousel */}
      <div className="absolute inset-0">
        {heroImages.map((image, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              current === idx ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image}
              alt={`${categoryName} background ${idx + 1}`}
              fill
              className="object-cover"
              priority={idx === 0}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60"></div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full px-4 sm:px-6">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 md:mb-6 drop-shadow-lg capitalize leading-tight">
            {categoryName}
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 mb-4 sm:mb-6 md:mb-8 drop-shadow-md max-w-2xl mx-auto leading-relaxed">
            {t('dashboard.exploreGames')}
          </p>
          
          {/* Additional category description for better UX */}
          <div className="hidden sm:block mb-4">
            <p className="text-xs md:text-sm text-gray-300 opacity-90">
              {t('dashboard.exploreCategory', 'Explore the best games in this category')}
            </p>
          </div>
          
          {/* Carousel Indicators */}
          {heroImages.length > 1 && (
            <div className="flex items-center justify-center space-x-1.5 sm:space-x-2">
              {heroImages.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                    current === idx ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/70'
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-label={`View image ${idx + 1} of ${heroImages.length}`}
                ></div>
              ))}
              <p className="text-xs text-gray-400 ml-2 hidden sm:block">
                {gamesCountText}
              </p>
            </div>
          )}
          
          {/* Mobile games count */}
          <div className="sm:hidden mt-2">
            <p className="text-xs text-gray-400">
              {gamesCountText}
            </p>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator for mobile */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 sm:hidden">
        <div className="animate-bounce">
          <svg 
            className="w-4 h-4 text-white/70" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
});

CategoryHero.displayName = 'CategoryHero';

export default CategoryHero;