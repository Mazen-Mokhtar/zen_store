"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import type { Game } from "@/lib/api";

interface CategoryGamesSectionProps {
  games: Game[];
  categoryName: string;
  selectedGame: string | null;
  onGameClick: (gameId: string) => void;
  gamePackages: any[];
  loadingPackages: boolean;
  onWhatsAppPurchase: (game: Game) => void;
}

export function CategoryGamesSection({ 
  games, 
  categoryName, 
  selectedGame, 
  onGameClick, 
  gamePackages, 
  loadingPackages,
  onWhatsAppPurchase
}: CategoryGamesSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();

  if (!games || games.length === 0) {
    return null;
  }

  return (
    <section className="max-w-6xl mx-auto mt-10 rounded-3xl bg-[#232329] shadow-lg px-6 py-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
        {t('dashboard.allGamesInCategory')} {categoryName}
        <span className="text-sm text-gray-400 font-normal">({games.length})</span>
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
        {games.map((game) => {
          const isSelected = selectedGame === game._id;
          const gamePackage = Array.isArray(gamePackages) ? gamePackages.find(pkg => pkg.gameId === game._id) : null;
          
          return (
            <div 
              key={game._id} 
              onClick={() => onGameClick(game._id)}
              className={`w-full h-56 bg-[#18181c] rounded-2xl shadow flex flex-col items-stretch relative overflow-hidden cursor-pointer transition-all duration-300 group ${
                isSelected ? 'ring-2 ring-green-500 scale-105' : 'hover:scale-105'
              }`}
            >
              <Image 
                src={game.image?.secure_url || '/placeholder-game.svg'} 
                alt={game.name} 
                width={200} 
                height={200} 
                className="w-full h-full object-cover rounded-2xl group-hover:brightness-110 transition-all" 
                unoptimized 
              />
              
              {/* Game Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <span className="text-white font-semibold text-sm drop-shadow text-center block">{game.name}</span>
                {/* Price Display */}
                <div className="flex flex-col items-center justify-center mt-1 space-y-0.5">
                  {game.price ? (
                    <>
                      {/* Original Price (if there's a discount) */}
                      {game.originalPrice && game.originalPrice > game.price && (
                        <div className="text-gray-400 text-xs line-through">
                          {game.originalPrice} EGP
                        </div>
                      )}
                      {/* Current Price */}
                      <div className="bg-green-600 text-white font-bold text-xs px-2 py-1 rounded-lg shadow-md">
                        {game.price} EGP
                      </div>
                      {/* Discount Badge */}
                      {game.originalPrice && game.originalPrice > game.price && (
                        <div className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                          -{Math.round(((game.originalPrice - game.price) / game.originalPrice) * 100)}%
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
              {game.offer && (
                <div className="absolute top-3 left-3 bg-green-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                  {game.offer}
                </div>
              )}
              {game.isPopular && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  🔥
                </div>
              )}
              
              {/* Buy Now Overlay - Only show when selected */}
              {isSelected && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4">
                  <div className="text-white text-center">
                    <div className="text-lg font-bold mb-2">
                      {game.price} EGP
                    </div>
                    {game.type === 'steam' ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/steam/${game.slug || game._id}`);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors transform hover:scale-105"
                      >
                        View Details
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onWhatsAppPurchase(game);
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
      
      <div className="flex justify-center mt-8">
        <button 
          className="px-8 py-3 rounded-full border border-gray-400 text-white bg-[#232329] hover:bg-[#18181c] transition font-semibold hover:border-green-500"
        >
          {t('dashboard.loadMore')}
        </button>
      </div>
    </section>
  );
}