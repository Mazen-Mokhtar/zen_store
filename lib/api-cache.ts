// API-specific caching layer with React Query-like functionality

import { useClientCache, preloadData, clearCache } from './client-data-cache';
import { apiService } from './api';
import type { Game, Package, Category } from './api';
import { logger } from './utils';

// API cache keys
export const API_KEYS = {
  GAMES: 'games',
  GAMES_BY_CATEGORY: (categoryId: string) => `games-category-${categoryId}`,
  PACKAGES: 'packages',
  PACKAGES_BY_GAME: (gameId: string) => `packages-game-${gameId}`,
  CATEGORIES: 'categories',
  STEAM_GAMES: 'steam-games',
  STEAM_GAME: (slug: string) => `steam-game-${slug}`,
  USER_PROFILE: 'user-profile',
  USER_ORDERS: 'user-orders',
} as const;

// Default cache options for different data types
const DEFAULT_OPTIONS = {
  // Static data that changes infrequently
  STATIC: {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 10 * 60 * 1000, // 10 minutes
    errorRetryCount: 2,
  },
  // Dynamic data that changes more frequently
  DYNAMIC: {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 2 * 60 * 1000, // 2 minutes
    errorRetryCount: 3,
  },
  // User-specific data
  USER: {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    errorRetryCount: 2,
    keepPreviousData: true,
  },
};

/**
 * Hook for fetching games with caching
 */
export function useGames(categoryId?: string) {
  const key = categoryId ? API_KEYS.GAMES_BY_CATEGORY(categoryId) : API_KEYS.GAMES;
  
  return useClientCache(
    key,
    () => apiService.getGames(categoryId),
    DEFAULT_OPTIONS.STATIC
  );
}

/**
 * Hook for fetching packages with caching
 */
export function usePackages(gameId?: string) {
  const key = gameId ? API_KEYS.PACKAGES_BY_GAME(gameId) : API_KEYS.PACKAGES;
  
  return useClientCache(
    key,
    () => gameId ? apiService.getPackagesByGameId(gameId) : apiService.getPackages(),
    DEFAULT_OPTIONS.STATIC
  );
}

/**
 * Hook for fetching categories with caching
 */
export function useCategories() {
  return useClientCache(
    API_KEYS.CATEGORIES,
    () => apiService.getCategories(),
    DEFAULT_OPTIONS.STATIC
  );
}

/**
 * Hook for fetching Steam games with caching
 */
export function useSteamGames() {
  return useClientCache(
    API_KEYS.STEAM_GAMES,
    () => apiService.getSteamGames(),
    DEFAULT_OPTIONS.STATIC
  );
}

/**
 * Hook for fetching a specific Steam game with caching
 */
export function useSteamGame(slug: string | null) {
  return useClientCache(
    slug ? API_KEYS.STEAM_GAME(slug) : null,
    slug ? () => apiService.getSteamGameBySlug(slug) : undefined,
    DEFAULT_OPTIONS.STATIC
  );
}

/**
 * Hook for fetching user profile with caching
 */
export function useUserProfile() {
  return useClientCache(
    API_KEYS.USER_PROFILE,
    () => apiService.getUserProfile(),
    DEFAULT_OPTIONS.USER
  );
}

/**
 * Hook for fetching user orders with caching
 */
export function useUserOrders() {
  return useClientCache(
    API_KEYS.USER_ORDERS,
    () => apiService.getUserOrders(),
    {
      ...DEFAULT_OPTIONS.USER,
      refreshInterval: 30 * 1000, // 30 seconds for orders (more dynamic)
    }
  );
}

/**
 * Preload critical data for better performance
 */
export async function preloadCriticalData() {
  try {
    // Preload categories and popular games
    await Promise.allSettled([
      preloadData(API_KEYS.CATEGORIES, () => apiService.getCategories()),
      preloadData(API_KEYS.GAMES, () => apiService.getGames()),
      preloadData(API_KEYS.PACKAGES, () => apiService.getPackages()),
    ]);
    
    logger.log('Critical data preloaded successfully');
  } catch (error) {
    logger.error('Failed to preload critical data:', error);
  }
}

/**
 * Invalidate and refresh specific data
 */
export function invalidateGames(categoryId?: string) {
  const key = categoryId ? API_KEYS.GAMES_BY_CATEGORY(categoryId) : API_KEYS.GAMES;
  clearCache(key);
}

export function invalidatePackages(gameId?: string) {
  const key = gameId ? API_KEYS.PACKAGES_BY_GAME(gameId) : API_KEYS.PACKAGES;
  clearCache(key);
}

export function invalidateUserData() {
  clearCache(API_KEYS.USER_PROFILE);
  clearCache(API_KEYS.USER_ORDERS);
}

/**
 * Clear all API cache
 */
export function clearAllApiCache() {
  Object.values(API_KEYS).forEach(key => {
    if (typeof key === 'string') {
      clearCache(key);
    }
  });
}

/**
 * Optimistic updates for better UX
 */
export class OptimisticUpdates {
  /**
   * Optimistically update user profile
   */
  static async updateUserProfile(updates: Partial<any>, actualUpdate: () => Promise<any>) {
    const { mutate } = useUserProfile();
    
    try {
      // Optimistic update
      await mutate((current) => ({ ...current, ...updates }), false);
      
      // Actual API call
      const result = await actualUpdate();
      
      // Update with real data
      await mutate(result, false);
      
      return result;
    } catch (error) {
      // Revert on error
      await mutate(undefined, true); // Revalidate to get fresh data
      throw error;
    }
  }
  
  /**
   * Optimistically add new order
   */
  static async addOrder(newOrder: any, actualCreate: () => Promise<any>) {
    const { mutate } = useUserOrders();
    
    try {
      // Optimistic update
      await mutate((current) => {
        const orders = Array.isArray(current?.data) ? current.data : [];
        return {
          ...current,
          data: [newOrder, ...orders]
        };
      }, false);
      
      // Actual API call
      const result = await actualCreate();
      
      // Refresh orders to get accurate data
      await mutate(undefined, true);
      
      return result;
    } catch (error) {
      // Revert on error
      await mutate(undefined, true);
      throw error;
    }
  }
}

/**
 * Background sync for offline support
 */
export class BackgroundSync {
  private static syncQueue: Array<{ key: string; action: () => Promise<any> }> = [];
  
  /**
   * Add action to sync queue
   */
  static addToQueue(key: string, action: () => Promise<any>) {
    this.syncQueue.push({ key, action });
  }
  
  /**
   * Process sync queue when online
   */
  static async processSyncQueue() {
    if (!navigator.onLine || this.syncQueue.length === 0) {
      return;
    }
    
    const queue = [...this.syncQueue];
    this.syncQueue = [];
    
    for (const { key, action } of queue) {
      try {
        await action();
        logger.log(`Background sync completed for ${key}`);
      } catch (error) {
        logger.error(`Background sync failed for ${key}:`, error);
        // Re-add to queue for retry
        this.syncQueue.push({ key, action });
      }
    }
  }
}

// Setup background sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    BackgroundSync.processSyncQueue();
  });
}