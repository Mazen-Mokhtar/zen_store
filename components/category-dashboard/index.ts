// Components
export { CategoryHeader } from './CategoryHeader';
export { CategoryHero } from './CategoryHero';
export { default as SearchFilters } from './SearchFilters';
export { PopularSection } from './PopularSection';
export { CategoryGamesSection } from './CategoryGamesSection';

// Lazy Components for Performance
export {
  LazyCategoryHeader,
  LazyCategoryHero,
  LazySearchFilters,
  LazyPopularSection,
  LazyCategoryGamesSection,
  LazyGamesWithIntersection
} from './LazyComponents';

// Hooks
export { useCategoryData } from './useCategoryData';
export { useGamePackages } from './useGamePackages';

// Constants and Types
export * from './constants';
export * from './types';