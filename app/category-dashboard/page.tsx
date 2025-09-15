"use client";

import React, { memo, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n';
import { Footer } from '@/components/ui/footer-section';
import { SkeletonSpinner } from '@/components/ui/skeleton';
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

// Dynamic imports for better code splitting
const DynamicFooter = dynamic(() => import('@/components/ui/footer-section').then(mod => ({ default: mod.Footer })), {
  loading: () => <div className="h-32 bg-[#1A1B20] animate-pulse" />
});





// Loading skeleton component
const LoadingSkeleton = memo(() => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-[#0D0E12] min-h-screen text-white font-sans">
      {/* Header Skeleton */}
      <header className="fixed top-0 left-0 right-0 bg-[#1A1B20]/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-8 bg-gray-700 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Skeleton */}
      <main className="pt-16">
        <div className="relative w-full h-[60vh] bg-gray-800 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <SkeletonSpinner size="lg" text={t('common.loading')} />
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="max-w-6xl mx-auto mt-6 md:mt-10 px-4 md:px-6 space-y-6">
          {/* Search Skeleton */}
          <div className="bg-[#232329] rounded-2xl p-6 animate-pulse">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="h-12 bg-gray-700 rounded-lg flex-1 max-w-md"></div>
              <div className="h-12 bg-gray-700 rounded-lg w-40"></div>
            </div>
          </div>
          
          {/* Popular Section Skeleton */}
          <div className="bg-[#232329] rounded-3xl p-6 animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-6 w-48"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 bg-gray-700 rounded-2xl"></div>
              ))}
            </div>
          </div>
          
          {/* Games Section Skeleton */}
          <div className="bg-[#232329] rounded-3xl p-6 animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-6 w-64"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-72 bg-gray-700 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Error component
const ErrorDisplay = memo(({ error }: { error: string }) => {
  return (
    <div className="bg-[#0D0E12] min-h-screen text-white font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#1A1B20]/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded"></div>
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
        <div className="max-w-6xl mx-auto mt-6 md:mt-10 px-4 md:px-6">
          <ErrorMessage message={error} />
        </div>
      </main>
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';

// Main component
const CategoryDashboardContent = memo(() => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Memoize URL parameters
  const { categoryId, categoryName } = useMemo(() => ({
    categoryId: searchParams.get('category'),
    categoryName: searchParams.get('name') || 'الفئة المحددة'
  }), [searchParams]);
  
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
    handleLoadMore,
    gamesPerPage,
    totalGamesCount,
    hasUsedLoadMore,
    isPaginationMode,
    INITIAL_GAMES_DISPLAY,
    LOAD_MORE_INCREMENT,
    PAGINATION_THRESHOLD
  } = useCategoryData(categoryId);
  
  const { handleGameClick } = useGamePackages(selectedGame, setState);

  // Memoize category type and hero images
  const { categoryType, heroImages } = useMemo(() => {
    const type = getCategoryType(categoryName);
    return {
      categoryType: type,
      heroImages: categoryHeroImages[type] || categoryHeroImages.default
    };
  }, [categoryName]);
  
  // Memoize handlers
  const handleOrdersClick = useMemo(() => () => router.push('/orders'), [router]);
  
  // Early returns for loading and error states
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} />;











  return (
    <div className="bg-[#0D0E12] min-h-screen text-white font-sans">
      {/* Notifications */}
      <NotificationToast />
      
      {/* Header */}
      <CategoryHeader 
        isAuth={isAuth}
        onOrdersClick={handleOrdersClick}
      />

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <CategoryHero
          categoryName={categoryName}
          heroImages={heroImages}
          current={current}
          gamesCount={totalGamesCount > 0 ? totalGamesCount : filteredAndSortedGames.length}
        />

        {/* Content Container with improved responsive spacing */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Filter Section */}
          <div className="mt-6 md:mt-8">
            <SearchFilters 
              searchTerm={searchTerm}
              sortBy={sortBy}
              onSearchChange={updateSearchTerm}
              onSortChange={updateSortBy}
            />
          </div>

          {/* Popular Games Section */}
          {popularItems.games.length > 0 && (
            <div className="mt-6 md:mt-10">
              <PopularSection 
                items={popularItems.games} 
                selectedGame={selectedGame}
                onGameClick={handleGameClick}
                gamePackages={gamePackages}
                loadingPackages={loadingPackages}
                onWhatsAppPurchase={handleWhatsAppPurchase}
              />
            </div>
          )}
          
          {/* Category Games Section */}
          <div className="mt-6 md:mt-10">
            <CategoryGamesSection 
              games={filteredAndSortedGames} 
              categoryName={categoryName}
              categoryId={categoryId || undefined}
              selectedGame={selectedGame}
              onGameClick={handleGameClick}
              gamePackages={gamePackages}
              loadingPackages={loadingPackages}
              onWhatsAppPurchase={handleWhatsAppPurchase}
              displayedGamesCount={displayedGamesCount}
              onLoadMore={handleLoadMore}
              showLoadMoreButton={true}
              isLoadingMore={isLoadingMore}
              gamesPerPage={gamesPerPage}
              totalGamesCount={totalGamesCount}
              hasUsedLoadMore={hasUsedLoadMore}
              isPaginationMode={isPaginationMode}
              INITIAL_GAMES_DISPLAY={INITIAL_GAMES_DISPLAY}
              LOAD_MORE_INCREMENT={LOAD_MORE_INCREMENT}
              PAGINATION_THRESHOLD={PAGINATION_THRESHOLD}
            />
          </div>
          
          {/* No Games Message */}
          {filteredAndSortedGames.length === 0 && (
            <div className="mt-6 md:mt-10">
              <div className="bg-[#232329] rounded-2xl p-6 md:p-8 text-center">
                <div className="text-gray-400 text-base md:text-lg mb-2">
                  {searchTerm ? t('dashboard.noGamesMatchSearch') : t('dashboard.noGamesInCategory')}
                </div>
                <div className="text-gray-500 text-sm md:text-base">
                  {searchTerm ? t('dashboard.tryDifferentSearch') : t('dashboard.tryDifferentCategory')}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer Section with Suspense */}
      <Suspense fallback={<div className="h-32 bg-[#1A1B20] animate-pulse" />}>
        <DynamicFooter />
      </Suspense>
    </div>
  );
});

CategoryDashboardContent.displayName = 'CategoryDashboardContent';

// Main exported component with Suspense wrapper
export default function CategoryDashboardPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CategoryDashboardContent />
    </Suspense>
  );
}