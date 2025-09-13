'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import type { Game } from '@/lib/api';
import type { PopularSectionProps } from './types';

// Memoized Game Card Component
const GameCard = memo<{
  item: Game;
  isSelected: boolean;
  onGameClick: (gameId: string) => void;
  onWhatsAppPurchase: (item: Game) => void;
  onClose: () => void;
  t: any;
  router: any;
}>(({ item, isSelected, onGameClick, onWhatsAppPurchase, onClose, t, router }) => {
  const handleCardClick = useCallback(() => {
    onGameClick(item._id);
  }, [onGameClick, item._id]);

  const handleWhatsAppPurchase = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onWhatsAppPurchase(item);
  }, [onWhatsAppPurchase, item]);

  const handleViewDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/steam/${item.slug || item._id}`);
  }, [router, item.slug, item._id]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);

  const discountPercentage = useMemo(() => {
    if (item.originalPrice && item.price && item.originalPrice > item.price) {
      return Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
    }
    return 0;
  }, [item.originalPrice, item.price]);

  return (
    <div
      onClick={handleCardClick}
      className={`relative bg-[#18181c] rounded-xl md:rounded-2xl shadow flex flex-col items-stretch overflow-hidden cursor-pointer transition-all duration-300 group ${
        isSelected ? 'ring-2 ring-green-500 scale-105 z-10' : 'hover:scale-105'
      }`}
    >
      <Image
        src={item.image?.secure_url || '/placeholder-game.svg'}
        alt={item.name}
        width={200}
        height={200}
        className="w-full aspect-[3/4] object-cover rounded-xl md:rounded-2xl group-hover:brightness-110 transition-all"
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 200px"
        loading="lazy"
      />
      
      {/* Game Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-2 md:px-3 py-3 md:py-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <span className="text-white font-semibold text-xs md:text-base drop-shadow text-center block" title={item.name}>
          {item.name}
        </span>
        {/* Price Display */}
        <div className="flex flex-col items-center justify-center mt-1 md:mt-2 space-y-1">
          {item.price ? (
            <>
              {/* Original Price (if there's a discount) */}
              {item.originalPrice && item.originalPrice > item.price && (
                <div className="text-gray-400 text-[10px] md:text-xs line-through">
                  {item.originalPrice} {item.currency || 'EGP'}
                </div>
              )}
              {/* Current Price */}
              <div className="bg-green-600 text-white font-bold text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg shadow-md">
                {item.price} {item.currency || 'EGP'}
              </div>
              {/* Discount Badge */}
              {discountPercentage > 0 && (
                <div className="bg-red-500 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full">
                  -{discountPercentage}%
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-400 text-[10px] md:text-xs bg-gray-800/50 px-2 py-1 rounded-lg">
              {t('dashboard.priceNotAvailable')}
            </div>
          )}
        </div>
      </div>
      
      {/* Badges */}
      {item.offer && (
        <div className="absolute top-1.5 left-1.5 md:top-3 md:left-3 bg-green-400 text-black text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
          {item.offer}
        </div>
      )}
      {item.isPopular && (
        <div className="absolute top-1.5 right-1.5 md:top-3 md:right-3 bg-red-500 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
          🔥
        </div>
      )}
      
      {/* Buy Now Overlay - Only show when selected */}
      {isSelected && (
        <div className="absolute inset-0 bg-black/80 rounded-xl md:rounded-2xl flex flex-col items-center justify-center p-3 md:p-4">
          <div className="bg-[#232329] rounded-lg md:rounded-xl p-3 md:p-4 max-w-xs w-full mx-2 md:mx-4">
            <h4 className="text-white font-bold text-center mb-3 text-sm md:text-base">
              {item.name}
            </h4>
            <div className="text-white text-center">
              <div className="text-base md:text-lg font-bold mb-3">
                {item.price} {item.currency || 'EGP'}
              </div>
              {item.type === 'steam' ? (
                <button 
                  onClick={handleViewDetails}
                  className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-2 px-4 md:px-6 rounded-lg md:rounded-full transition-colors transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#232329] text-sm md:text-base"
                >
                  View Details
                </button>
              ) : (
                <button 
                  onClick={handleWhatsAppPurchase}
                  className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-2 px-4 md:px-6 rounded-lg md:rounded-full transition-colors transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-[#232329] text-sm md:text-base"
                >
                  {t('dashboard.buyNow')}
                </button>
              )}
              <button
                onClick={handleClose}
                className="w-full mt-2 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white py-2 px-3 rounded-lg text-xs md:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-[#232329]"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

GameCard.displayName = 'GameCard';

export const PopularSection: React.FC<PopularSectionProps> = memo(({
  items, 
  selectedGame, 
  onGameClick, 
  gamePackages, 
  loadingPackages,
  onWhatsAppPurchase
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  const handleCloseSelection = useCallback(() => {
    onGameClick('');
  }, [onGameClick]);

  // Early return if no items
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      <div className="bg-[#232329] rounded-2xl md:rounded-3xl shadow-lg px-4 md:px-6 py-4 md:py-6">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
          <div className="w-1.5 md:w-2 h-6 md:h-8 bg-green-500 rounded-full"></div>
          {t('dashboard.popular')}
        </h2>
        
        {/* Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {items.map((item) => {
            const isSelected = selectedGame === item._id;
            
            return (
              <GameCard
                key={item._id}
                item={item}
                isSelected={isSelected}
                onGameClick={onGameClick}
                onWhatsAppPurchase={onWhatsAppPurchase}
                onClose={handleCloseSelection}
                t={t}
                router={router}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
});

PopularSection.displayName = 'PopularSection';

export default PopularSection;