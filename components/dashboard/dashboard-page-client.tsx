'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Image from 'next/image';
import type { Game } from '@/lib/api';
import { Footer } from '@/components/ui/footer-section';
import { SkeletonSpinner } from '@/components/ui/skeleton';
import { ErrorMessage } from '@/components/ui/error-message';
import { NotificationToast } from '@/components/ui/notification-toast';
import { CategoryHeader } from '@/components/category-dashboard';
import { useTranslation } from '@/lib/i18n';
import { authService } from '@/lib/auth';
import { logger } from '@/lib/utils';

interface DashboardPageClientProps {
  initialGames: Game[];
}

// Dynamic imports for better performance
const CategoryHeader_Dynamic = dynamic(() => import('@/components/category-dashboard/CategoryHeader'), {
  loading: () => <div className="h-16 bg-[#1A1B20]/80 animate-pulse" />,
  ssr: false
});

// صور خلفية داكنة بسيطة بدون نصوص
const heroImages = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1920&q=80"
];

// Memoized Game Card Component
const GameCard = memo<{
  game: Game;
  onClick: () => void;
}>(({ game, onClick }) => (
  <div 
    onClick={onClick}
    className="w-full h-48 sm:h-56 md:h-64 bg-[#18181c] rounded-xl md:rounded-2xl shadow flex flex-col items-stretch relative overflow-hidden cursor-pointer transition-all duration-300 group hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
    role="button"
    tabIndex={0}
    aria-label={`View ${game.name} packages`}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
  >
    <Image 
      src={game.image?.secure_url || '/placeholder-game.svg'} 
      alt={`${game.name} game cover`}
      fill
      className="object-cover rounded-xl md:rounded-2xl group-hover:brightness-110 transition-all" 
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      loading="lazy"
    />
    <div className="absolute bottom-0 left-0 right-0 px-2 md:px-3 py-3 md:py-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
      <span className="text-white font-semibold text-xs sm:text-sm drop-shadow text-center block">{game.name}</span>
    </div>
    {game.offer && (
      <div className="absolute top-2 md:top-3 left-2 md:left-3 bg-green-400 text-black text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded">
        {game.offer}
      </div>
    )}
  </div>
));

GameCard.displayName = 'GameCard';

// Popular Games Section Component
const PopularSection = memo(function PopularSection({ 
  items, 
  onGameClick 
}: { 
  items: Game[];
  onGameClick: (game: Game) => void;
}) {
  const { t } = useTranslation();

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="max-w-6xl mx-auto mt-6 md:mt-10 rounded-2xl md:rounded-3xl bg-[#232329] shadow-lg px-4 md:px-6 py-4 md:py-6" aria-labelledby="popular-games-heading">
      <h2 id="popular-games-heading" className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">{t('dashboard.popular')}</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {items.map((item) => (
          <GameCard
            key={item._id}
            game={item}
            onClick={() => onGameClick(item)}
          />
        ))}
      </div>
    </section>
  );
});

// Mobile Games Section Component
const MobileGamesSection = memo(function MobileGamesSection({ 
  games, 
  showAllGames, 
  onToggleShowAll,
  onGameClick
}: { 
  games: Game[];
  showAllGames: boolean;
  onToggleShowAll: () => void;
  onGameClick: (game: Game) => void;
}) {
  const { t } = useTranslation();

  if (!games || games.length === 0) {
    return null;
  }

  const INITIAL_DISPLAY_LIMIT = 6;
  const gamesToDisplay = showAllGames ? games : games.slice(0, INITIAL_DISPLAY_LIMIT);
  const shouldShowSeeAllButton = games.length > INITIAL_DISPLAY_LIMIT;

  return (
    <section className="max-w-6xl mx-auto mt-6 md:mt-10 rounded-2xl md:rounded-3xl bg-[#232329] shadow-lg px-4 md:px-6 py-4 md:py-6" aria-labelledby="mobile-games-heading">
      <h2 id="mobile-games-heading" className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center justify-between">
        <span>{t('dashboard.mobileGames')}</span>
        <span className="text-sm text-gray-400 font-normal">({games.length})</span>
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
        {gamesToDisplay.map((game) => (
          <GameCard
            key={game._id}
            game={game}
            onClick={() => onGameClick(game)}
          />
        ))}
      </div>
      
      {shouldShowSeeAllButton && (
        <div className="flex justify-center mt-6 md:mt-8">
          <button 
            onClick={onToggleShowAll}
            className="px-6 md:px-8 py-2 md:py-3 rounded-full border border-gray-400 text-white bg-[#232329] hover:bg-[#18181c] hover:border-green-500 transition-all font-semibold transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
            aria-label={showAllGames ? 'Show fewer games' : 'Show all games'}
          >
            {showAllGames ? t('dashboard.showLess') : t('dashboard.seeAll')}
          </button>
        </div>
      )}
    </section>
  );
});

export function DashboardPageClient({ initialGames }: DashboardPageClientProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryId = searchParams.get('category');
  

  
  const [current, setCurrent] = useState(0);
  const [popularItems, setPopularItems] = useState<{ games: Game[], packages: any[] }>({ games: [], packages: [] });
  const [mobileGames, setMobileGames] = useState<Game[]>(initialGames);
  const [isAuth, setIsAuth] = useState(false);
  const [showAllGames, setShowAllGames] = useState(false);
  
  // Function to scroll to popular games section
  const scrollToGames = useCallback(() => {
    const popularSection = document.querySelector('[aria-labelledby="popular-games-heading"]');
    if (popularSection) {
      popularSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, []);

  // Hero carousel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Increased interval for better UX
    return () => clearInterval(interval);
  }, []);

  // Check auth state on mount
  useEffect(() => {
    setIsAuth(authService.isAuthenticated());
  }, []);

  // Set popular games from initial data
  useEffect(() => {
    const popularGames = initialGames.filter(game => game.isPopular);
    setPopularItems({
      games: popularGames,
      packages: []
    });
  }, [initialGames]);

  const handleToggleShowAllGames = useCallback(() => {
    try {
      setShowAllGames(prev => !prev);
    } catch (error) {
      console.error('Error toggling show all games:', error);
      setShowAllGames(false);
    }
  }, []);

  const handleGameClick = useCallback((game: Game) => {
    if (game.type === 'steam') {
      router.push(`/steam/${game.slug || game._id}`);
    } else {
      router.push(`/packages?gameId=${game._id}`);
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>Gaming Dashboard - Zen Store</title>
        <meta name="description" content="Discover the best gaming packages and deals. Browse popular games, mobile games, and exclusive offers." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Gaming Dashboard - Zen Store" />
        <meta property="og:description" content="Discover the best gaming packages and deals" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={heroImages[0]} />
        <link rel="canonical" href="/dashboard" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#0D0E12" />
      </Head>

      <div className="bg-[#0D0E12] min-h-screen text-white font-sans">
        <NotificationToast />
        
        <CategoryHeader_Dynamic 
          isAuth={isAuth}
          onOrdersClick={() => router.push('/orders')}
        />

        <main className="pt-16">
          {/* Hero Section */}
          <section className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden" aria-label="Featured content">
            {/* Carousel Images */}
            {heroImages.map((img, idx) => (
              <div
                key={img}
                className={`absolute inset-0 transition-opacity duration-700 ${current === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <Image
                  src={img}
                  alt={`Hero background ${idx + 1}`}
                  fill
                  className="object-cover"
                  priority={idx === 0}
                  sizes="100vw"
                />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-20" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center z-30">
              <div className="w-full md:w-1/2 flex flex-col items-start text-left">
                <div className='flex flex-col sm:flex-row items-start sm:items-center mb-4 gap-2 sm:gap-4'>
                  <h1 className='text-2xl sm:text-3xl font-bold italic tracking-wider'>{t('dashboard.bloodStrike')}</h1>
                  <div className='hidden sm:block w-px h-6 bg-gray-500'></div>
                  <h2 className='text-xl sm:text-2xl font-semibold'>{t('dashboard.endex')}</h2>
                </div>
                <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 md:mb-6">{t('dashboard.bloodStrike')}</h3>
                <button 
                  onClick={scrollToGames}
                  className="border border-white/50 rounded-full px-6 md:px-8 py-2 md:py-3 text-sm font-semibold hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Scroll to games section"
                >
                  {t('dashboard.buyNow')}
                </button>
              </div>
            </div>
            
            {/* Carousel Dots */}
            <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/4 flex items-center gap-2 z-40">
              {heroImages.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${current === idx ? 'bg-white' : 'bg-white/50'}`}
                  onClick={() => setCurrent(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
              <p className="text-xs text-gray-400 ml-2 hidden sm:block">{t('dashboard.newUltraSkin')}</p>
            </div>
          </section>

          {/* Popular Games Section */}
          <PopularSection items={popularItems.games} onGameClick={handleGameClick} />
          
          {/* Mobile Games Section */}
          <MobileGamesSection 
            games={mobileGames} 
            showAllGames={showAllGames}
            onToggleShowAll={handleToggleShowAllGames}
            onGameClick={handleGameClick}
          />
          
          {/* No Games Message */}
          {(mobileGames?.length || 0) === 0 && (
            <div className="max-w-6xl mx-auto mt-6 px-4 md:px-6">
              <div className="bg-[#232329] rounded-xl md:rounded-2xl p-6 md:p-8 text-center">
                <div className="text-gray-400 text-base md:text-lg mb-2">
                  No games available at the moment
                </div>
                <div className="text-gray-500 text-sm">
                  Please check back later or contact support
                </div>
              </div>
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </>
  );
}