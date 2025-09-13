import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { apiService } from '@/lib/api';
import type { Game } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { DashboardPageClient } from '@/components/dashboard/dashboard-page-client';
import { logger } from '@/lib/utils';

// Enable ISR with 15 minutes revalidation
export const revalidate = 900;

export const metadata: Metadata = {
  title: 'Gaming Dashboard - Endex',
  description: 'Browse and purchase gaming packages from top games with instant delivery.',
  keywords: 'gaming, packages, fortnite, pubg, free fire, instant delivery',
};

async function getDashboardData(categoryId?: string): Promise<{ games: Game[] } | null> {
  try {
    let gamesResponse;
    
    if (categoryId) {
      // Get games by specific category
      gamesResponse = await apiService.getGamesByCategory(categoryId);
    } else {
      // Get all games
      gamesResponse = await apiService.getGames();
    }

    if (gamesResponse.success) {
      return {
        games: gamesResponse.data || []
      };
    }

    return null;
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    return null;
  }
}

interface DashboardPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const categoryId = resolvedSearchParams.category;
  const data = await getDashboardData(categoryId);

  if (!data) {
    return (
      <ErrorMessage 
        message="Failed to load dashboard data. Please try again later."
        title="Loading Error"
      />
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardPageClient 
        initialGames={data.games}
      />
    </Suspense>
  );
}