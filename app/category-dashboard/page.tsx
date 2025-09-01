"use client";

import * as React from 'react';
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from '@/lib/i18n';
import { Footer } from '@/components/ui/footer-section';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { NotificationToast } from '@/components/ui/notification-toast';
import { LanguageSelector } from '@/components/ui/language-selector';
import { AuthStatus } from '@/components/ui/auth-status';
import { 
  CategoryHeader, 
  CategoryHero, 
  SearchFilters, 
  PopularSection, 
  CategoryGamesSection,
  useCategoryData,
  useGamePackages,
  categoryHeroImages,
  getCategoryType
} from '@/components/category-dashboard';





export default function CategoryDashboardPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryId = searchParams.get('category');
  const categoryName = searchParams.get('name') || 'الفئة المحددة';
  
  // Use custom hooks
  const {
    popularItems,
    categoryGames,
    loading,
    error,
    searchTerm,
    sortBy,
    isAuth,
    current,
    selectedGame,
    gamePackages,
    loadingPackages,
    filteredAndSortedGames,
    handleWhatsAppPurchase,
    updateSearchTerm,
    updateSortBy,
    setState,
    displayedGamesCount,
    isLoadingMore,
    handleLoadMore
  } = useCategoryData(categoryId);
  
  const {
    handleGameClick
  } = useGamePackages(selectedGame, setState);

  const categoryType = getCategoryType(categoryName);
  const heroImages = categoryHeroImages[categoryType as keyof typeof categoryHeroImages] || categoryHeroImages.default;











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
                <AuthStatus 
                  variant="compact"
                  avatarUrl="https://res.cloudinary.com/dfvzhl8oa/image/upload/v1754848996/d2090ffb-1769-4853-916c-79c2a4ae2568_gmih9f.jpg"
                />
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
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSelector />
                <AuthStatus 
                  variant="compact"
                  avatarUrl="https://res.cloudinary.com/dfvzhl8oa/image/upload/v1754848996/d2090ffb-1769-4853-916c-79c2a4ae2568_gmih9f.jpg"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Error Content */}
        <main className="pt-16">
          <div className="max-w-6xl mx-auto mt-10 px-6">
            <ErrorMessage 
              message={error} 
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
      <CategoryHeader 
        isAuth={isAuth}
        onOrdersClick={() => router.push('/orders')}
      />

      {/* Hero Section */}
      <main className="pt-16">
        <CategoryHero
          categoryName={categoryName}
          heroImages={heroImages}
          current={current}
          gamesCount={filteredAndSortedGames.length}
        />

        {/* Search and Filter Section */}
        <SearchFilters 
          searchTerm={searchTerm}
          sortBy={sortBy}
          onSearchChange={updateSearchTerm}
          onSortChange={updateSortBy}
        />

        {/* Popular Games Section */}
        <PopularSection 
          items={popularItems.games} 
          selectedGame={selectedGame}
          onGameClick={handleGameClick}
          gamePackages={gamePackages}
          loadingPackages={loadingPackages}
          onWhatsAppPurchase={handleWhatsAppPurchase}
        />
        
        {/* Category Games Section */}
        <CategoryGamesSection 
          games={filteredAndSortedGames} 
          categoryName={categoryName}
          selectedGame={selectedGame}
          onGameClick={handleGameClick}
          gamePackages={gamePackages}
          loadingPackages={loadingPackages}
          onWhatsAppPurchase={handleWhatsAppPurchase}
          displayedGamesCount={displayedGamesCount}
          onLoadMore={handleLoadMore}
          showLoadMoreButton={true}
          isLoadingMore={isLoadingMore}
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