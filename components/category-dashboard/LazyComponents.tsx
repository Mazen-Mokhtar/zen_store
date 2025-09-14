'use client';

import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { 
  CategoryHeroProps, 
  CategoryHeaderProps, 
  SearchFiltersProps, 
  PopularSectionProps, 
  CategoryGamesSectionProps 
} from './types';

// Generic props interface for lazy components
interface LazyComponentProps {
  [key: string]: any;
}

// Simplified lazy loaded category dashboard components
const LazyCategoryHeaderComponent = React.lazy(() => import('./CategoryHeader').then(module => ({ default: module.CategoryHeader })));

export const LazyCategoryHeader = (props: CategoryHeaderProps) => (
  <Suspense fallback={<div className="h-16 bg-[#1A1B20]/80 animate-pulse rounded-lg" />}>
    <LazyCategoryHeaderComponent {...props} />
  </Suspense>
);

const LazyCategoryHeroComponent = React.lazy(() => import('./CategoryHero'));
const LazySearchFiltersComponent = React.lazy(() => import('./SearchFilters'));
const LazyPopularSectionComponent = React.lazy(() => import('./PopularSection'));
const LazyCategoryGamesSectionComponent = React.lazy(() => import('./CategoryGamesSection').then(module => ({ default: module.CategoryGamesSection })));

export const LazyCategoryHero = (props: CategoryHeroProps) => (
  <Suspense fallback={<div className="h-64 bg-gradient-to-r from-gray-800 to-gray-900 animate-pulse rounded-lg" />}>
    <LazyCategoryHeroComponent {...props} />
  </Suspense>
);

export const LazySearchFilters = (props: SearchFiltersProps) => (
  <Suspense fallback={<div className="h-12 bg-gray-800 animate-pulse rounded-lg" />}>
    <LazySearchFiltersComponent {...props} />
  </Suspense>
);

export const LazyPopularSection = (props: PopularSectionProps) => (
  <Suspense fallback={
    <div className="space-y-4">
      <div className="h-8 bg-gray-800 animate-pulse rounded w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-800 animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  }>
    <LazyPopularSectionComponent {...props} />
  </Suspense>
);

export const LazyCategoryGamesSection = (props: CategoryGamesSectionProps) => (
  <Suspense fallback={
    <div className="space-y-4">
      <div className="h-8 bg-gray-800 animate-pulse rounded w-64" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-800 animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="flex justify-center">
        <div className="h-10 w-32 bg-gray-800 animate-pulse rounded-full" />
      </div>
    </div>
  }>
    <LazyCategoryGamesSectionComponent {...props} />
  </Suspense>
);

// Intersection observer based lazy loading for games section
export const LazyGamesWithIntersection = (props: CategoryGamesSectionProps) => (
  <Suspense fallback={
    <div className="min-h-[400px] flex items-center justify-center">
      <LoadingSpinner size="lg" text="Loading games..." />
    </div>
  }>
    <LazyCategoryGamesSectionComponent {...props} />
  </Suspense>
);