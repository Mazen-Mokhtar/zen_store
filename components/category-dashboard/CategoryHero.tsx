'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import type { CategoryHeroProps } from './types';

export const CategoryHero: React.FC<CategoryHeroProps> = ({
  categoryName,
  heroImages,
  current,
  gamesCount
}) => {
  const { t } = useTranslation();

  return (
    <section className="relative h-[60vh] overflow-hidden">
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
            <div className="absolute inset-0 bg-black/60"></div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center px-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            {categoryName}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 drop-shadow-md">
            {t('dashboard.exploreGames')}
          </p>
          
          {/* Carousel Indicators */}
          <div className="flex items-center justify-center space-x-2">
            {heroImages.map((_, idx) => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full ${
                  current === idx ? 'bg-white' : 'bg-white/50'
                }`}
              ></div>
            ))}
            <p className="text-xs text-gray-400 ml-2">
              {gamesCount} {t('dashboard.gamesAvailable')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryHero;