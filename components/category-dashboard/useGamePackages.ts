'use client';

import { useCallback } from 'react';
import { apiService } from '@/lib/api';
import { logger } from '@/lib/utils';
import type { CategoryDashboardState } from './types';

export const useGamePackages = (
  selectedGame: string | null,
  setState: React.Dispatch<React.SetStateAction<CategoryDashboardState>>
) => {
  // Function to fetch packages for a game
  const fetchGamePackages = useCallback(async (gameId: string) => {
    try {
      setState(prev => ({ ...prev, loadingPackages: true }));
      
      // Use centralized apiService to avoid hitting frontend routes
      const res = await apiService.getPackagesByGameId(gameId);
      
      if (res && res.success) {
        const packages = Array.isArray(res.data) ? res.data : [];
        setState(prev => ({ ...prev, gamePackages: packages }));
      } else {
        logger.warn('Failed to fetch packages');
        setState(prev => ({ ...prev, gamePackages: [] }));
      }
    } catch (error) {
      logger.error('Error fetching packages:', error);
      setState(prev => ({ ...prev, gamePackages: [] }));
    } finally {
      setState(prev => ({ ...prev, loadingPackages: false }));
    }
  }, [setState]);

  // Handle game selection
  const handleGameClick = useCallback((gameId: string) => {
    if (selectedGame === gameId) {
      // If same game clicked, deselect it
      setState(prev => ({
        ...prev,
        selectedGame: null,
        gamePackages: []
      }));
    } else {
      // Select new game and fetch its packages
      setState(prev => ({ ...prev, selectedGame: gameId }));
      fetchGamePackages(gameId);
    }
  }, [selectedGame, fetchGamePackages, setState]);

  return {
    fetchGamePackages,
    handleGameClick
  };
};