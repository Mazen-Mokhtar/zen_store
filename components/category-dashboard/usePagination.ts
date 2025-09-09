'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Game } from '@/lib/api';

interface UsePaginationProps {
  games: Game[];
  gamesPerPage?: number;
  initialPage?: number;
  totalGamesCount?: number;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  gamesPerPage: number;
  currentGames: Game[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
}

interface PaginationActions {
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
}

export const usePagination = ({
  games,
  gamesPerPage = 12,
  initialPage = 1,
  totalGamesCount
}: UsePaginationProps): PaginationState & PaginationActions => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Calculate pagination values
  const paginationData = useMemo(() => {
    const totalGames = totalGamesCount || games?.length || 0;
    const totalPages = Math.ceil(totalGames / gamesPerPage);
    const startIndex = (currentPage - 1) * gamesPerPage;
    const endIndex = Math.min(startIndex + gamesPerPage, totalGames);
    const currentGames = games?.slice(startIndex, endIndex) || [];
    
    return {
      totalPages,
      startIndex,
      endIndex,
      currentGames,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [games, currentPage, gamesPerPage, totalGamesCount]);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, paginationData.totalPages));
    setCurrentPage(validPage);
  }, [paginationData.totalPages]);

  const nextPage = useCallback(() => {
    if (paginationData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationData.hasNextPage]);

  const prevPage = useCallback(() => {
    if (paginationData.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationData.hasPrevPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(paginationData.totalPages);
  }, [paginationData.totalPages]);

  // Reset to first page only when category changes (not when games data updates)
  // This prevents unwanted page resets during pagination navigation

  return {
    currentPage,
    gamesPerPage,
    ...paginationData,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage
  };
};

export type { PaginationState, PaginationActions, UsePaginationProps };