import React, { Suspense } from "react";
import { Metadata } from 'next';
import { apiService } from '@/lib/api';
import type { Package, Game } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { PackagesPageClient } from '@/components/packages/packages-page-client';
import { logger } from '@/lib/utils';

// Enable ISR with 30 minutes revalidation
export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'Gaming Packages - Endex',
  description: 'Browse and purchase gaming packages with instant delivery.',
  keywords: 'gaming packages, game bundles, instant delivery',
};

async function getPackagesData(gameId?: string): Promise<{ packages: Package[]; games: Game[] } | null> {
  try {
    // If gameId is provided, fetch packages for that specific game
    const packagesPromise = gameId 
      ? apiService.getPackagesByGameId(gameId)
      : apiService.getPackages();
    
    const [packagesResponse, gamesResponse] = await Promise.all([
      packagesPromise,
      apiService.getGames()
    ]);

    // Return data even if one of the requests fails, with empty arrays as fallback
    return {
      packages: (packagesResponse.success ? packagesResponse.data : []) || [],
      games: (gamesResponse.success ? gamesResponse.data : []) || []
    };
  } catch (error) {
    logger.error('Error fetching packages data:', error);
    // Return empty data instead of null to prevent error message
    return {
      packages: [],
      games: []
    };
  }
}

export default async function PackagesPage({ searchParams }: { searchParams: Promise<{ gameId?: string }> }) {
  const params = await searchParams;
  const gameId = params?.gameId;
  const data = await getPackagesData(gameId);

  if (!data) {
    return (
      <ErrorMessage 
        message="Failed to load packages. Please try again later."
        title="Loading Error"
      />
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PackagesPageClient 
        initialPackages={data.packages}
        initialGames={data.games}
      />
    </Suspense>
  );
}