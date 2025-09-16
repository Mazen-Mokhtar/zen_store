'use client';

import { createLazyComponent } from '@/components/performance/lazy-component-wrapper';
import { SkeletonSpinner } from '@/components/ui/skeleton';

import type { Game } from '@/lib/api';

interface DashboardPageClientProps {
  initialGames: Game[];
}

// Lazy load dashboard page component
export const LazyDashboardPageClient = createLazyComponent<DashboardPageClientProps>(
  () => import('./dashboard-page-client').then(module => ({ default: module.DashboardPageClient })),
  {
    loading: () => (
      <div className="bg-[#0D0E12] min-h-screen text-white">
        <div className="h-16 bg-[#1A1B20]/80 animate-pulse" />
        <div className="h-64 bg-gradient-to-r from-blue-900 to-purple-900 animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-800 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    ),
    ssr: false
  }
);

// Additional lazy components can be added here as needed
// For example, if FilterSection, GameGrid, or Pagination components are created later