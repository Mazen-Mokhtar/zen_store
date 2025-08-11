"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Bell, HelpCircle } from 'lucide-react';
import { Footer } from '@/components/ui/footer-section';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { NotificationToast } from '@/components/ui/notification-toast';
import { LanguageSelector } from '@/components/ui/language-selector';
import Image from 'next/image';
import { apiService, Game } from '@/lib/api';
import { handleApiError } from '@/lib/api-error';

import { useTranslation } from '@/lib/i18n';
import { authService } from '@/lib/auth';

// صور خلفية داكنة بسيطة بدون نصوص
const heroImages = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1920&q=80"
];

export default function EndexHeroPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryId = searchParams.get('category');
  
  // All Games category ID - يمكن تغييره من environment variable أو استخدام القيمة الافتراضية
  const ALL_GAMES_CATEGORY_ID = process.env.NEXT_PUBLIC_ALL_GAMES_CATEGORY_ID || '68847d21bcb9d10e1b12e76a';
  
  const [current, setCurrent] = useState(0);
  const [popularItems, setPopularItems] = useState<{ games: Game[]; packages: any[] }>({ games: [], packages: [] });
  const [mobileGames, setMobileGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);

  // Hero carousel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroImages.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check auth state on mount
  useEffect(() => {
    setIsAuth(authService.isAuthenticated());
  }, []);

  // Fetch data function with useCallback to prevent unnecessary re-renders
  const fetchData = useCallback(async (selectedCategory: string | null) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 fetchData called with category:', selectedCategory);
      
      let gamesData;
      let popularGames;
      
      // Always use a category - if none provided, use ALL_GAMES_CATEGORY_ID
      const categoryToUse = selectedCategory || ALL_GAMES_CATEGORY_ID;
      
      console.log('🎮 جلب الفئة مع الباقات:', categoryToUse);
      const withPackages = await apiService.getCategoryWithPackages(categoryToUse);
      gamesData = { success: withPackages.success, data: withPackages.data } as { success: boolean; data: Game[] };
      popularGames = withPackages.data.filter(game => game.isPopular);
      
      console.log('📊 Setting popularItems:', { 
        popularGames: popularGames?.length || 0,
        category: categoryToUse
      });
      
      setPopularItems({
        games: popularGames || [],
        packages: (withPackages as any).packages || []
      });
      
      console.log('📊 Setting mobileGames:', { 
        games: gamesData.data?.length || 0,
        category: categoryToUse
      });
      
      setMobileGames(gamesData.data || []);

      // Check if no data was returned
      if (!gamesData.success) {
        console.warn('⚠️ API returned success: false');
        setError('Failed to fetch games data');
      } else if (gamesData.data.length === 0) {
        console.warn('⚠️ No games found in category:', categoryToUse);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [ALL_GAMES_CATEGORY_ID]);

  // Main data fetching effect
  useEffect(() => {
    fetchData(categoryId);
  }, [categoryId, fetchData]);

  if (loading) {
    return (
      <div className="bg-[#0D0E12] min-h-screen text-white font-sans">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 bg-[#1A1B20]/80 backdrop-blur-sm z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSelector />
                {isAuth ? (
                  <div
                    onClick={() => router.push('/orders')}
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
                  <button className="text-sm font-semibold hover:text-gray-200">
                    {t('dashboard.enter')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Loading Content */}
        <main className="pt-16">
          <div className="relative w-full h-[600px] overflow-hidden bg-gray-800">
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
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSelector />
                {isAuth ? (
                  <div
                    onClick={() => router.push('/orders')}
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
                  <button className="text-sm font-semibold hover:text-gray-200">
                    {t('dashboard.enter')}
                  </button>
                )}
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
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              {isAuth ? (
                <div
                  onClick={() => router.push('/orders')}
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
                <button className="text-sm font-semibold hover:text-gray-200">
                  {t('dashboard.enter')}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-16">
        <div className="relative w-full h-[600px] overflow-hidden">
          {/* Carousel Images */}
          {heroImages.map((img, idx) => (
            <div
              key={img}
              className={`absolute inset-0 transition-opacity duration-700 ${current === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              style={{ backgroundImage: `url('${img}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-20" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center z-30">
            {/* Left Content */}
            <div className="w-1/2 flex flex-col items-start text-left">
                <div className='flex items-center mb-4'>
                    <p className='text-3xl font-bold italic tracking-wider'>{t('dashboard.bloodStrike')}</p>
                    <div className='w-px h-6 bg-gray-500 mx-4'></div>
                     <p className='text-2xl font-semibold'>{t('dashboard.endex')}</p>
                </div>
              <h1 className="text-6xl font-extrabold mb-4">{t('dashboard.bloodStrike')}</h1>
              <button className="border border-white/50 rounded-full px-8 py-3 text-sm font-semibold hover:bg-white/10 transition-colors">
                {t('dashboard.buyNow')}
              </button>
            </div>
          </div>
          {/* Carousel Dots */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/4 flex items-center gap-2 z-40">
            {heroImages.map((_, idx) => (
              <div key={idx} className={`w-2.5 h-2.5 rounded-full ${current === idx ? 'bg-white' : 'bg-white/50'}`}></div>
            ))}
            <p className="text-xs text-gray-400 ml-2">{t('dashboard.newUltraSkin')}</p>
          </div>
        </div>

        {/* Populares Section */}
        <PopularesSection items={popularItems.games} />
        
        {/* Mobile Games Section */}
        <MobileGamesSection games={mobileGames} />
        
        {/* No Games Message */}
        {(mobileGames?.length || 0) === 0 && !loading && (
          <div className="max-w-6xl mx-auto mt-6 px-6">
            <div className="bg-[#232329] rounded-2xl p-8 text-center">
              <div className="text-gray-400 text-lg mb-2">
                No games available at the moment
              </div>
              <div className="text-gray-500 text-sm">
                Please check back later or contact support
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

// إضافة مكون PopularesSection في نفس الملف
function PopularesSection({ items }: { items: Game[] }) {
  const { t } = useTranslation();
  const router = useRouter();

  // إذا لم تكن هناك عناصر، لا تعرض القسم
  if (!items || items.length === 0) {
    return null;
  }

  const handleGameClick = (game: Game) => {
    router.push(`/packages?gameId=${game._id}&gameName=${encodeURIComponent(game.name)}`);
  };

  return (
    <section className="max-w-6xl mx-auto mt-10 rounded-3xl bg-[#232329] shadow-lg px-6 py-6">
      <h2 className="text-2xl font-bold text-white mb-6">{t('dashboard.popular')}</h2>
      
      {/* العناصر بدون أسكرول */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item) => (
          <div
            key={item._id}
            onClick={() => handleGameClick(item)}
            className="w-48 min-w-[180px] h-72 bg-[#18181c] rounded-2xl shadow flex flex-col items-stretch relative overflow-hidden cursor-pointer hover:scale-105 transition-transform"
          >
            <Image
              src={item.image.secure_url}
              alt={item.name}
              width={200}
              height={200}
              className="w-full h-full object-cover rounded-2xl"
              unoptimized
            />
            <div className="absolute bottom-0 left-0 right-0 px-3 py-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <span className="text-white font-semibold text-base drop-shadow text-center block">{item.name}</span>
            </div>
            {item.offer && (
              <div className="absolute top-3 left-3 bg-green-400 text-black text-xs font-bold px-2 py-1 rounded">
                {item.offer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// إضافة مكون MobileGamesSection في نفس الملف
function MobileGamesSection({ games }: { games: Game[] }) {
  const { t } = useTranslation();
  const router = useRouter();

  // إذا لم تكن هناك ألعاب، لا تعرض القسم
  if (!games || games.length === 0) {
    return null;
  }

  const handleGameClick = (game: Game) => {
    router.push(`/packages?gameId=${game._id}&gameName=${encodeURIComponent(game.name)}`);
  };

  return (
    <section className="max-w-6xl mx-auto mt-10 rounded-3xl bg-[#232329] shadow-lg px-6 py-6">
      <h2 className="text-2xl font-bold text-white mb-6">{t('dashboard.mobileGames')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
        {games.map((game) => (
          <div 
            key={game._id} 
            onClick={() => handleGameClick(game)}
            className="w-full h-56 bg-[#18181c] rounded-2xl shadow flex flex-col items-stretch relative overflow-hidden cursor-pointer hover:scale-105 transition-transform"
          >
            <Image src={game.image.secure_url} alt={game.name} width={200} height={200} className="w-full h-full object-cover rounded-2xl" unoptimized />
            <div className="absolute bottom-0 left-0 right-0 px-3 py-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <span className="text-white font-semibold text-sm drop-shadow text-center block">{game.name}</span>
            </div>
            {game.offer && (
              <div className="absolute top-3 left-3 bg-green-400 text-black text-xs font-bold px-2 py-1 rounded">
                {game.offer}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-8">
        <button 
          className="px-8 py-2 rounded-full border border-gray-400 text-white bg-[#232329] hover:bg-[#18181c] transition font-semibold"
        >
          {t('dashboard.seeAll')}
        </button>
      </div>
    </section>
  );
} 