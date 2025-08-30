'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import type { Game } from '@/lib/api';
import type { PopularSectionProps } from './types';

export const PopularSection: React.FC<PopularSectionProps> = ({ 
  items, 
  selectedGame, 
  onGameClick, 
  gamePackages, 
  loadingPackages,
  onWhatsAppPurchase
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="max-w-6xl mx-auto mt-10 rounded-3xl bg-[#232329] shadow-lg px-6 py-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <div className="w-2 h-8 bg-green-500 rounded-full"></div>
        {t('dashboard.popular')}
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item) => {
          const isSelected = selectedGame === item._id;
          const gamePackage = Array.isArray(gamePackages) ? gamePackages.find(pkg => pkg.gameId === item._id) : null;
          
          return (
            <div
              key={item._id}
              onClick={() => onGameClick(item._id)}
              className={`w-48 min-w-[180px] h-72 bg-[#18181c] rounded-2xl shadow flex flex-col items-stretch relative overflow-hidden cursor-pointer transition-all duration-300 group ${
                isSelected ? 'ring-2 ring-green-500 scale-105' : 'hover:scale-105'
              }`}
            >
              <Image
                src={item.image?.secure_url || '/placeholder-game.svg'}
                alt={item.name}
                width={200}
                height={200}
                className="w-full h-full object-cover rounded-2xl group-hover:brightness-110 transition-all"
                unoptimized
              />
              
              {/* Game Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <span className="text-white font-semibold text-base drop-shadow text-center block">{item.name}</span>
                {/* Price Display */}
                <div className="flex flex-col items-center justify-center mt-2 space-y-1">
                  {item.price ? (
                    <>
                      {/* Original Price (if there's a discount) */}
                      {item.originalPrice && item.originalPrice > item.price && (
                        <div className="text-gray-400 text-xs line-through">
                          {item.originalPrice} EGP
                        </div>
                      )}
                      {/* Current Price */}
                      <div className="bg-green-600 text-white font-bold text-sm px-3 py-1.5 rounded-lg shadow-md">
                        {item.price} EGP
                      </div>
                      {/* Discount Badge */}
                      {item.originalPrice && item.originalPrice > item.price && (
                        <div className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-400 text-xs bg-gray-800/50 px-2 py-1 rounded-lg">
                      {t('dashboard.priceNotAvailable')}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Badges */}
              {item.offer && (
                <div className="absolute top-3 left-3 bg-green-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                  {item.offer}
                </div>
              )}
              {item.isPopular && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  🔥
                </div>
              )}
              
              {/* Buy Now Overlay - Only show when selected */}
              {isSelected && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4">
                  <div className="text-white text-center">
                    <div className="text-lg font-bold mb-2">
                      {item.price} EGP
                    </div>
                    {item.type === 'steam' ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/steam/${item.slug || item._id}`);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors transform hover:scale-105"
                      >
                        View Details
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onWhatsAppPurchase(item);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full transition-colors transform hover:scale-105"
                      >
                        {t('dashboard.buyNow')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PopularSection;