'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../../lib/api';
import type { Game } from '../../lib/api';
import { handleApiError } from '../../lib/api-error';
import { useTranslation } from '../../lib/i18n';
import { authService } from '../../lib/auth';
import { isValidObjectId, generateWhatsAppPurchaseLink } from '../../lib/utils';
import { logger } from '../../lib/utils';
import type { CategoryDashboardState, SortBy } from './types';

export const useCategoryData = (categoryId: string | null) => {
  const { t } = useTranslation();
  
  // Constants for pagination
  const INITIAL_GAMES_LIMIT = 12;
  const LOAD_MORE_INCREMENT = 12;
  
  const [state, setState] = useState<CategoryDashboardState>({
    current: 0,
    popularItems: { games: [], packages: [] },
    categoryGames: [],
    loading: true,
    error: null,
    searchTerm: '',
    sortBy: 'name' as SortBy,
    selectedGame: null,
    gamePackages: [],
    loadingPackages: false,
    isAuth: false
  });
  
  // Pagination state
  const [displayedGamesCount, setDisplayedGamesCount] = useState(INITIAL_GAMES_LIMIT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch data function with useCallback to prevent unnecessary re-renders
  const fetchData = useCallback(async (selectedCategory: string | null) => {
    if (!selectedCategory) {
      setState(prev => ({
        ...prev,
        error: t('errors.categoryDashboard.categoryIdRequired'),
        loading: false
      }));
      return;
    }

    // Early validation for MongoDB ObjectId to avoid unnecessary API calls
    if (!isValidObjectId(selectedCategory)) {
      setState(prev => ({
        ...prev,
        error: t('errors.categoryDashboard.invalidCategoryId'),
        loading: false
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      logger.debug('🚀 fetchData called with category:', selectedCategory);
      
      const gamesData = await apiService.getPaidGamesByCategory(selectedCategory);
      const popularGames = gamesData.data.filter(game => game.isPopular);
      
      logger.debug('📊 Setting popularItems:', { 
        popularGames: popularGames?.length || 0,
        category: selectedCategory
      });
      
      setState(prev => ({
        ...prev,
        popularItems: {
          games: popularGames || [],
          packages: []
        },
        categoryGames: gamesData.data || [],
        loading: false
      }));

      if (!gamesData.success) {
        logger.warn('⚠️ API returned success: false');
        setState(prev => ({
          ...prev,
          error: t('errors.dataLoadFailed')
        }));
      } else if (gamesData.data.length === 0) {
        logger.warn('⚠️ No games found in category:', selectedCategory);
      }

    } catch (err) {
      logger.error('Error fetching data:', err);
      setState(prev => ({
        ...prev,
        error: handleApiError(err),
        loading: false
      }));
    }
  }, [t]);

  // Main data fetching effect
  useEffect(() => {
    fetchData(categoryId);
  }, [categoryId, fetchData]);

  // Check auth state on mount
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isAuth: authService.isAuthenticated()
    }));
  }, []);

  // Memoize filtered and sorted games calculation
  const filteredAndSortedGames = useMemo(() => 
    state.categoryGames
      .filter(game => 
        game.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        game.description?.toLowerCase().includes(state.searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        switch (state.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'popular':
            return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
          case 'newest':
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          default:
            return 0;
        }
      }), 
    [state.categoryGames, state.searchTerm, state.sortBy]
  );

  // Handle WhatsApp purchase
  const handleWhatsAppPurchase = useCallback((game: Game) => {
    const whatsappUrl = generateWhatsAppPurchaseLink(game);
    window.open(whatsappUrl, '_blank');
  }, []);

  // Update search term
  const updateSearchTerm = useCallback((searchTerm: string) => {
    setState(prev => ({ ...prev, searchTerm }));
  }, []);

  // Update sort by
  const updateSortBy = useCallback((sortBy: SortBy) => {
    setState(prev => ({ ...prev, sortBy }));
  }, []);

  // Update current carousel index
  const updateCurrent = useCallback((current: number) => {
    setState(prev => ({ ...prev, current }));
  }, []);

  // Handle load more games with security validation
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      
      // Security: Validate current state before proceeding
      if (displayedGamesCount >= 1000) {
        logger.warn('Maximum games limit reached for security');
        return;
      }
      
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDisplayedGamesCount(prev => {
        const newCount = prev + LOAD_MORE_INCREMENT;
        // Security: Cap the maximum number of displayed games
        return Math.min(newCount, 1000);
      });
    } catch (error) {
      logger.error('Error in handleLoadMore:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, LOAD_MORE_INCREMENT, displayedGamesCount]);

  // Reset displayed games count when search term or sort changes
  useEffect(() => {
    setDisplayedGamesCount(INITIAL_GAMES_LIMIT);
  }, [state.searchTerm, state.sortBy, INITIAL_GAMES_LIMIT]);

  return {
    ...state,
    filteredAndSortedGames,
    handleWhatsAppPurchase,
    updateSearchTerm,
    updateSortBy,
    updateCurrent,
    setState,
    displayedGamesCount,
    isLoadingMore,
    handleLoadMore
  };
};