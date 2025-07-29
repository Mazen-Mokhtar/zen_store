"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Bell, HelpCircle, ArrowLeft, Filter } from 'lucide-react';
import { Footer } from '@/components/ui/footer-section';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { NotificationToast } from '@/components/ui/notification-toast';
import { LanguageSelector } from '@/components/ui/language-selector';
import Image from 'next/image';
import { apiService, Game } from '@/lib/api';
import { handleApiError } from '@/lib/api-error';
import { useTranslation } from '@/lib/i18n';

// صور خلفية مختلفة للفئات
const categoryHeroImages = {
  steam: [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=1920&q=80"
  ],
  action: [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=1920&q=80"
  ],
  adventure: [
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80"
  ],
  subscription: [
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1556742045-0cfed4f6a45d?auto=format&fit=crop&w=1920&q=80"
  ],
  default: [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1920&q=80"
  ]
};

export default function CategoryDashboardPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryId = searchParams.get('category');
  const categoryName = searchParams.get('name') || 'الفئة المحددة';
  
  const [current, setCurrent] = useState(0);
  const [popularItems, setPopularItems] = useState<{ games: Game[]; packages: any[] }>({ games: [], packages: [] });
  const [categoryGames, setCategoryGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'popular' | 'newest'>('name');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gamePackages, setGamePackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  // تحديد نوع الفئة للحصول على الصور المناسبة
  const getCategoryType = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('steam') || lowerName.includes('ستيم')) return 'steam';
    if (lowerName.includes('action') || lowerName.includes('قتال')) return 'action';
    if (lowerName.includes('adventure') || lowerName.includes('مغامرة')) return 'adventure';
    if (lowerName.includes('subscription') || lowerName.includes('اشتراك')) return 'subscription';
    return 'default';
  };

  const categoryType = getCategoryType(categoryName);
  const heroImages = categoryHeroImages[categoryType as keyof typeof categoryHeroImages] || categoryHeroImages.default;

  // Hero carousel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroImages.length);
    }, 3000); // أبطأ قليلاً للفئات
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Fetch data function with useCallback to prevent unnecessary re-renders
  const fetchData = useCallback(async (selectedCategory: string | null) => {
    if (!selectedCategory) {
      setError('Category ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 fetchData called with category:', selectedCategory);
      
      let gamesData;
      let popularGames;
      
      console.log('🎮 جلب الألعاب من الفئة:', selectedCategory);
      gamesData = await apiService.getGamesByCategory(selectedCategory);
      popularGames = gamesData.data.filter(game => game.isPopular);
      
      console.log('📊 Setting popularItems:', { 
        popularGames: popularGames?.length || 0,
        category: selectedCategory
      });
      
      setPopularItems({
        games: popularGames || [],
        packages: []
      });
      
      console.log('📊 Setting categoryGames:', { 
        games: gamesData.data?.length || 0,
        category: selectedCategory
      });
      
      setCategoryGames(gamesData.data || []);

      if (!gamesData.success) {
        console.warn('⚠️ API returned success: false');
        setError('Failed to fetch games data');
      } else if (gamesData.data.length === 0) {
        console.warn('⚠️ No games found in category:', selectedCategory);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Main data fetching effect
  useEffect(() => {
    fetchData(categoryId);
  }, [categoryId, fetchData]);

  // Function to fetch packages for a game
  const fetchGamePackages = useCallback(async (gameId: string) => {
    try {
      setLoadingPackages(true);
      const response = await fetch(`http://localhost:3000/packages?gameId=${gameId}`);
      if (response.ok) {
        const data = await response.json();
        setGamePackages(data.data || []);
      } else {
        console.warn('Failed to fetch packages');
        setGamePackages([]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setGamePackages([]);
    } finally {
      setLoadingPackages(false);
    }
  }, []);

  // Handle game selection
  const handleGameClick = useCallback((gameId: string) => {
    if (selectedGame === gameId) {
      // If same game clicked, deselect it
      setSelectedGame(null);
      setGamePackages([]);
    } else {
      // Select new game and fetch its packages
      setSelectedGame(gameId);
      fetchGamePackages(gameId);
    }
  }, [selectedGame, fetchGamePackages]);

  // Filter and sort games
  const filteredAndSortedGames = categoryGames
    .filter(game => 
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popular':
          return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="bg-[#0D0E12] min-h-screen text-white font-sans">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 bg-[#1A1B20]/80 backdrop-blur-sm z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-sm font-semibold hover:text-gray-200"
                >
                  <ArrowLeft size={16} />
                  {t('common.back')}
                </button>
                <div className="w-px h-6 bg-gray-600"></div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSelector />
                <button className="text-sm font-semibold hover:text-gray-200">
                  {t('dashboard.enter')}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Loading Content */}
        <main className="pt-16">
          <div className="relative w-full h-[500px] overflow-hidden bg-gray-800">
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="lg" text={t('common.loading')} />
            </div>
          </div>
          
          {/* Skeleton Loading for Sections */}
          <div className="max-w-6xl mx-auto mt-10 px-6">
            <div className="bg-[#232329] rounded-3xl p-6 animate-pulse">
              <div className="h-8 bg-gray-700 rounded mb-6 w-48"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-72 bg-gray-700 rounded-2xl"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0D0E12] min-h-screen text-white font-sans">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 bg-[#1A1B20]/80 backdrop-blur-sm z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-sm font-semibold hover:text-gray-200"
                >
                  <ArrowLeft size={16} />
                  {t('common.back')}
                </button>
                <div className="w-px h-6 bg-gray-600"></div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSelector />
                <button className="text-sm font-semibold hover:text-gray-200">
                  {t('dashboard.enter')}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Error Content */}
        <main className="pt-16">
          <div className="max-w-6xl mx-auto mt-10 px-6">
            <ErrorMessage 
              message={error} 
              onRetry={() => fetchData(categoryId)} 
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#0D0E12] min-h-screen text-white font-sans">
      {/* Notifications */}
      <NotificationToast />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#1A1B20]/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm font-semibold hover:text-gray-200 transition-colors"
              >
                <ArrowLeft size={16} />
                {t('common.back')}
              </button>
              <div className="w-px h-6 bg-gray-600"></div>
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <button className="text-sm font-semibold hover:text-gray-200">
                {t('dashboard.enter')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-16">
        <div className="relative w-full h-[500px] overflow-hidden">
          {/* Carousel Images */}
          {heroImages.map((img, idx) => (
            <div
              key={img}
              className={`absolute inset-0 transition-opacity duration-1000 ${current === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              style={{ backgroundImage: `url('${img}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-20" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center z-30">
            {/* Left Content */}
            <div className="w-1/2 flex flex-col items-start text-left">
              <div className='flex items-center mb-4'>
                <p className='text-2xl font-bold italic tracking-wider'>{categoryName}</p>
                <div className='w-px h-6 bg-gray-500 mx-4'></div>
                <p className='text-xl font-semibold'>{t('dashboard.endex')}</p>
              </div>
              <h1 className="text-5xl font-extrabold mb-4">{categoryName}</h1>
              <p className="text-lg text-gray-300 mb-6">
                {categoryType === 'steam' 
                  ? t('dashboard.steamDescription')
                  : `اكتشف أفضل الألعاب في فئة ${categoryName}`
                }
              </p>
              <button className="border border-white/50 rounded-full px-8 py-3 text-sm font-semibold hover:bg-white/10 transition-colors">
                {t('dashboard.exploreGames')}
              </button>
            </div>
          </div>
          
          {/* Carousel Dots */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/4 flex items-center gap-2 z-40">
            {heroImages.map((_, idx) => (
              <div key={idx} className={`w-2.5 h-2.5 rounded-full ${current === idx ? 'bg-white' : 'bg-white/50'}`}></div>
            ))}
                         <p className="text-xs text-gray-400 ml-2">{categoryGames.length} {t('dashboard.gamesAvailable')}</p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="max-w-6xl mx-auto mt-8 px-6">
          <div className="bg-[#232329] rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                 <input
                   type="text"
                   placeholder={t('dashboard.searchGames')}
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 bg-[#18181c] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                 />
              </div>
              
              {/* Sort */}
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-400" />
                                 <select
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value as 'name' | 'popular' | 'newest')}
                   className="bg-[#18181c] border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                 >
                   <option value="name">{t('dashboard.sortByName')}</option>
                   <option value="popular">{t('dashboard.sortByPopular')}</option>
                   <option value="newest">{t('dashboard.sortByNewest')}</option>
                 </select>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Games Section */}
        <PopularesSection 
          items={popularItems.games} 
          selectedGame={selectedGame}
          onGameClick={handleGameClick}
          gamePackages={gamePackages}
          loadingPackages={loadingPackages}
        />
        
        {/* Category Games Section */}
        <CategoryGamesSection 
          games={filteredAndSortedGames} 
          categoryName={categoryName}
          selectedGame={selectedGame}
          onGameClick={handleGameClick}
          gamePackages={gamePackages}
          loadingPackages={loadingPackages}
        />
        
                 {/* No Games Message */}
         {filteredAndSortedGames.length === 0 && !loading && (
           <div className="max-w-6xl mx-auto mt-6 px-6">
             <div className="bg-[#232329] rounded-2xl p-8 text-center">
               <div className="text-gray-400 text-lg mb-2">
                 {searchTerm ? t('dashboard.noGamesMatchSearch') : t('dashboard.noGamesInCategory')}
               </div>
               <div className="text-gray-500 text-sm">
                 {searchTerm ? t('dashboard.tryDifferentSearch') : t('dashboard.tryDifferentCategory')}
               </div>
             </div>
           </div>
         )}
      </main>
      
      {/* Footer Section */}
      <Footer />
    </div>
  );
}

// مكون PopularesSection محسن للفئات
function PopularesSection({ 
  items, 
  selectedGame, 
  onGameClick, 
  gamePackages, 
  loadingPackages 
}: { 
  items: Game[];
  selectedGame: string | null;
  onGameClick: (gameId: string) => void;
  gamePackages: any[];
  loadingPackages: boolean;
}) {
  const { t } = useTranslation();

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
          const gamePackage = gamePackages.find(pkg => pkg.gameId === item._id);
          
          return (
            <div
              key={item._id}
              onClick={() => onGameClick(item._id)}
              className={`w-48 min-w-[180px] h-72 bg-[#18181c] rounded-2xl shadow flex flex-col items-stretch relative overflow-hidden cursor-pointer transition-all duration-300 group ${
                isSelected ? 'ring-2 ring-green-500 scale-105' : 'hover:scale-105'
              }`}
            >
              <Image
                src={item.image.secure_url}
                alt={item.name}
                width={200}
                height={200}
                className="w-full h-full object-cover rounded-2xl group-hover:brightness-110 transition-all"
                unoptimized
              />
              
              {/* Game Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <span className="text-white font-semibold text-base drop-shadow text-center block">{item.name}</span>
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
                  {loadingPackages ? (
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                      <span className="text-sm">{t('dashboard.loading')}</span>
                    </div>
                  ) : gamePackage ? (
                    <div className="text-white text-center">
                      <div className="text-lg font-bold mb-2">
                        {gamePackage.finalPrice || gamePackage.price} {gamePackage.currency}
                      </div>
                      {gamePackage.isOffer && gamePackage.originalPrice && (
                        <div className="text-sm text-gray-400 line-through mb-2">
                          {gamePackage.originalPrice} {gamePackage.currency}
                        </div>
                      )}
                      <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition-colors">
                        {t('dashboard.buyNow')}
                      </button>
                    </div>
                  ) : (
                    <div className="text-white text-center">
                      <span className="text-sm text-gray-400">{t('dashboard.noPackagesAvailable')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// مكون CategoryGamesSection جديد
function CategoryGamesSection({ 
  games, 
  categoryName, 
  selectedGame, 
  onGameClick, 
  gamePackages, 
  loadingPackages 
}: { 
  games: Game[]; 
  categoryName: string;
  selectedGame: string | null;
  onGameClick: (gameId: string) => void;
  gamePackages: any[];
  loadingPackages: boolean;
}) {
  const { t } = useTranslation();

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
          const gamePackage = gamePackages.find(pkg => pkg.gameId === game._id);
          
          return (
            <div 
              key={game._id} 
              onClick={() => onGameClick(game._id)}
              className={`w-full h-56 bg-[#18181c] rounded-2xl shadow flex flex-col items-stretch relative overflow-hidden cursor-pointer transition-all duration-300 group ${
                isSelected ? 'ring-2 ring-green-500 scale-105' : 'hover:scale-105'
              }`}
            >
              <Image 
                src={game.image.secure_url} 
                alt={game.name} 
                width={200} 
                height={200} 
                className="w-full h-full object-cover rounded-2xl group-hover:brightness-110 transition-all" 
                unoptimized 
              />
              
              {/* Game Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <span className="text-white font-semibold text-sm drop-shadow text-center block">{game.name}</span>
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
                  {loadingPackages ? (
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                      <span className="text-sm">{t('dashboard.loading')}</span>
                    </div>
                  ) : gamePackage ? (
                    <div className="text-white text-center">
                      <div className="text-lg font-bold mb-2">
                        {gamePackage.finalPrice || gamePackage.price} {gamePackage.currency}
                      </div>
                      {gamePackage.isOffer && gamePackage.originalPrice && (
                        <div className="text-sm text-gray-400 line-through mb-2">
                          {gamePackage.originalPrice} {gamePackage.currency}
                        </div>
                      )}
                      <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition-colors">
                        {t('dashboard.buyNow')}
                      </button>
                    </div>
                  ) : (
                    <div className="text-white text-center">
                      <span className="text-sm text-gray-400">{t('dashboard.noPackagesAvailable')}</span>
                    </div>
                  )}
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