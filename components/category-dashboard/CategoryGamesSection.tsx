"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import type { Game } from "@/lib/api";
import { sanitizeInput } from "@/lib/security";
import { usePagination } from './usePagination';
import { PaginationControls } from './PaginationControls';
import { useState, useEffect, useRef } from 'react';

interface CategoryGamesSectionProps {
  games: Game[];
  categoryName: string;
  selectedGame: string | null;
  onGameClick: (gameId: string) => void;
  gamePackages: any[];
  loadingPackages: boolean;
  onWhatsAppPurchase: (game: Game) => void;
  displayedGamesCount?: number;
  onLoadMore?: () => void;
  showLoadMoreButton?: boolean;
  isLoadingMore?: boolean;
  gamesPerPage?: number;

  totalGamesCount?: number;
  hasUsedLoadMore?: boolean;
  isPaginationMode?: boolean;
  INITIAL_GAMES_DISPLAY?: number;
  LOAD_MORE_INCREMENT?: number;
  PAGINATION_THRESHOLD?: number;
}

export function CategoryGamesSection({ 
  games, 
  categoryName, 
  selectedGame, 
  onGameClick, 
  gamePackages, 
  loadingPackages,
  onWhatsAppPurchase,
  displayedGamesCount = 12,
  onLoadMore,
  showLoadMoreButton = false,
  isLoadingMore = false,
  gamesPerPage = 12,

  totalGamesCount = 0,
  hasUsedLoadMore = false,
  isPaginationMode = false,
  INITIAL_GAMES_DISPLAY = 6,
  LOAD_MORE_INCREMENT = 6,
  PAGINATION_THRESHOLD = 12
}: CategoryGamesSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const gamesSectionRef = useRef<HTMLElement>(null);
  
  // Security: Validate and sanitize inputs
  const safeDisplayedGamesCount = Math.max(1, Math.min(displayedGamesCount, 100)); // Limit between 1-100
  
  // Remove duplicate games by _id as an additional safety layer
  const uniqueGames = games.filter((game, index, self) => 
    index === self.findIndex(g => g._id === game._id)
  );
  
  // Use pagination only when in pagination mode (after Load More was used)
  // Fixed: Simplified condition to only check pagination mode and load more usage
  const shouldUsePagination = isPaginationMode && hasUsedLoadMore;
  

  
  const {
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    goToPage,
    currentGames,
  } = usePagination({
    // Fixed: Always pass all games when in pagination mode, pass slice when not
    games: shouldUsePagination ? uniqueGames : uniqueGames.slice(0, safeDisplayedGamesCount),
    gamesPerPage: shouldUsePagination ? gamesPerPage : safeDisplayedGamesCount,
    totalGamesCount: shouldUsePagination ? totalGamesCount : undefined
  });
  

  
  // Track state changes for debugging
  useEffect(() => {
    // State tracking removed for production
  }, [isPaginationMode, hasUsedLoadMore, safeDisplayedGamesCount, shouldUsePagination]);
  
  // Handle smooth transitions when page changes
  const handlePageChange = async (pageChangeFunction: () => void) => {
    setIsTransitioning(true);
    
    try {
      pageChangeFunction();
      
      // Scroll to top of games section on small screens - always scroll to ensure user sees the games
      if (gamesSectionRef.current && window.innerWidth <= 768) {
        // Add a small delay to ensure page change is processed first
        setTimeout(() => {
          const element = gamesSectionRef.current;
          if (element) {
            // Get element position and scroll directly to avoid unwanted behavior
            const rect = element.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetPosition = rect.top + scrollTop - 20; // 20px offset from top
            
            window.scrollTo({
              top: Math.max(0, targetPosition),
              behavior: 'smooth'
            });
          }
        }, 100);
      }
      
      // Add small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Error changing page:', error);
    } finally {
      setIsTransitioning(false);
    }
  };
  
  // Wrap pagination functions with transition effects
  const wrappedOnNextPage = () => handlePageChange(nextPage);
  const wrappedOnPrevPage = () => handlePageChange(prevPage);
  const wrappedOnGoToFirstPage = () => handlePageChange(goToFirstPage);
  const wrappedOnGoToLastPage = () => handlePageChange(goToLastPage);
  const wrappedOnGoToPage = (page: number) => handlePageChange(() => goToPage(page));

  if (!uniqueGames || uniqueGames.length === 0) {
    return null;
  }

  const safeCategoryName = sanitizeInput(categoryName);
  
  // Display games based on the new scenario logic
  const gamesToDisplay = shouldUsePagination 
    ? currentGames
    : uniqueGames.slice(0, safeDisplayedGamesCount);
  
  // Check if Load More should be shown (only when displaying initial 6 games and there are more games available)
  // Show Load More only when not in pagination mode and haven't used Load More yet
  const shouldShowLoadMore = showLoadMoreButton && 
                            !isPaginationMode &&
                            !hasUsedLoadMore &&
                            safeDisplayedGamesCount === INITIAL_GAMES_DISPLAY && 
                            uniqueGames.length > INITIAL_GAMES_DISPLAY && 
                            onLoadMore && 
                            typeof onLoadMore === 'function';
  


  return (
    <section ref={gamesSectionRef} className="max-w-6xl mx-auto mt-10 rounded-3xl bg-[#232329] shadow-lg px-6 py-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
        {t('dashboard.allGamesInCategory')} {safeCategoryName}
        <span className="text-sm text-gray-400 font-normal">({totalGamesCount > 0 ? totalGamesCount : uniqueGames.length})</span>
      </h2>
      
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
        {gamesToDisplay.map((game) => {
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
                          {game.originalPrice} {game.currency || 'EGP'}
                        </div>
                      )}
                      {/* Current Price */}
                      <div className="bg-green-600 text-white font-bold text-xs px-2 py-1 rounded-lg shadow-md">
                        {game.price} {game.currency || 'EGP'}
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
                      {game.price} {game.currency || 'EGP'}
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
      
      {/* Pagination or Load More */}
      {(() => {
        if (shouldUsePagination) {
          return (
            <div className="flex justify-center mt-8">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                onNextPage={wrappedOnNextPage}
                onPrevPage={wrappedOnPrevPage}
                onGoToFirstPage={wrappedOnGoToFirstPage}
                onGoToLastPage={wrappedOnGoToLastPage}
                onGoToPage={wrappedOnGoToPage}
              />
            </div>
          );
        } else if (shouldShowLoadMore) {
          return (
            <div className="flex justify-center mt-8">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!isLoadingMore && onLoadMore && typeof onLoadMore === 'function') {
                    try {
                      onLoadMore();
                    } catch (error) {
                      console.error('Error loading more games:', error);
                    }
                  }
                }}
                disabled={isLoadingMore}
                aria-label={isLoadingMore ? t('loading') : t('loadMore')}
                className="px-8 py-3 rounded-full border border-gray-400 text-white bg-[#232329] hover:bg-[#18181c] hover:border-green-500 transition-all font-semibold transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {isLoadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
                    {t('loading')}
                  </>
                ) : (
                  t('loadMore')
                )}
              </button>
            </div>
          );
        } else {
          return null;
        }
      })()}
    </section>
  );
}