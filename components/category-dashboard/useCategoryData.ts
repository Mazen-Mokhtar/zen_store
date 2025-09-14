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
  
  // Constants for the new scenario
  const INITIAL_GAMES_DISPLAY = 6;  // Show 6 games initially
  const LOAD_MORE_INCREMENT = 6;    // Add 6 more games on Load More (total 12)
  const PAGINATION_THRESHOLD = 12;  // Start pagination after 12 games
  const GAMES_PER_PAGE = 12;        // Games per page in pagination mode
  
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
  
  // Pagination state for new scenario
  const [displayedGamesCount, setDisplayedGamesCount] = useState(INITIAL_GAMES_DISPLAY);
  const [gamesPerPage] = useState(GAMES_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasUsedLoadMore, setHasUsedLoadMore] = useState(false); // Track if Load More was used
  const [isPaginationMode, setIsPaginationMode] = useState(false); // Track pagination mode

  // State for total games count from server
  const [totalGamesCount, setTotalGamesCount] = useState(0);

  // Fetch data function with useCallback to prevent unnecessary re-renders
  const fetchData = useCallback(async (selectedCategory: string | null, page: number = 1, limit: number = 12) => {
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
      
      const gamesData = await apiService.getGamesByCategory(selectedCategory, page, limit);
      
      // Remove duplicate games based on _id
      const uniqueGames = gamesData.data.filter((game, index, self) => 
        index === self.findIndex(g => g._id === game._id)
      );
      
      const popularGames = uniqueGames.filter(game => game.isPopular);
      
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
        categoryGames: uniqueGames || [],
        loading: false
      }));

      // Update total games count from API response
      if (gamesData.pagination && gamesData.pagination.total) {
        setTotalGamesCount(gamesData.pagination.total);
      }

      if (!gamesData.success) {
        setState(prev => ({
          ...prev,
          error: t('errors.dataLoadFailed')
        }));
      }

      return gamesData.pagination;

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

  // Handle load more functionality for new scenario
  const handleLoadMore = useCallback(async () => {
    logger.debug('🔄 handleLoadMore called with state:', {
      isLoadingMore,
      categoryId,
      hasUsedLoadMore,
      displayedGamesCount,
      totalGames: state.categoryGames.length,
      INITIAL_GAMES_DISPLAY,
      LOAD_MORE_INCREMENT,
      PAGINATION_THRESHOLD
    });

    if (isLoadingMore || !categoryId) {
      logger.warn('⚠️ handleLoadMore blocked:', {
        isLoadingMore,
        categoryId: !!categoryId
      });
      return;
    }
    
    try {
      setIsLoadingMore(true);
      
      // In the new scenario, Load More only adds 6 games (from 6 to 12)
      if (displayedGamesCount === INITIAL_GAMES_DISPLAY && state.categoryGames.length > INITIAL_GAMES_DISPLAY && !hasUsedLoadMore) {
        const newCount = Math.min(INITIAL_GAMES_DISPLAY + LOAD_MORE_INCREMENT, state.categoryGames.length);
        
        // Update all states synchronously to avoid race conditions
        setDisplayedGamesCount(newCount);
        setHasUsedLoadMore(true);
        
        // Enable pagination mode synchronously if there are enough games
        if (state.categoryGames.length >= PAGINATION_THRESHOLD) {
          setIsPaginationMode(true);
        }
      }
    } catch (error) {
      logger.error('❌ Error in handleLoadMore:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, displayedGamesCount, categoryId, hasUsedLoadMore, INITIAL_GAMES_DISPLAY, LOAD_MORE_INCREMENT, PAGINATION_THRESHOLD, state.categoryGames.length]);



  // Reset pagination function
  const resetPagination = useCallback(() => {
    setDisplayedGamesCount(INITIAL_GAMES_DISPLAY);
    setHasUsedLoadMore(false);
    setIsPaginationMode(false);
  }, [INITIAL_GAMES_DISPLAY]);

  // Reset displayed games count when search term or sort changes
  useEffect(() => {
    resetPagination();
  }, [state.searchTerm, state.sortBy, resetPagination]);

  // Reset pagination when category changes
  useEffect(() => {
    resetPagination();
  }, [categoryId, resetPagination]);

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
    handleLoadMore,
    gamesPerPage,
    totalGamesCount,
    hasUsedLoadMore,
    isPaginationMode,
    resetPagination,
    INITIAL_GAMES_DISPLAY,
    LOAD_MORE_INCREMENT,
    PAGINATION_THRESHOLD
  };
};