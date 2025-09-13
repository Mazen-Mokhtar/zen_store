// Performance optimization components and utilities

// Lazy loading components
export { 
  LazyComponentWrapper,
  useLazyComponent,
  createLazyComponent,
  useIntersectionLazyLoad 
} from './lazy-component-wrapper';

// Memory optimization
export {
  MemoryOptimizer,
  useMemoryOptimization
} from './memory-optimizer';

// App-level lazy loading
export {
  AppLazyLoader,
  useLazyLoadingState,
  useLazyLoadingPerformance,
  ComponentPreloader
} from './app-lazy-loader';

// Configuration and utilities
export {
  defaultLazyLoadingConfig,
  criticalComponents,
  idlePreloadComponents,
  routePreloadConfig,
  performanceThresholds,
  getComponentConfig,
  shouldPreloadComponent
} from './lazy-loading-config';

export type {
  LazyLoadingConfig,
  ComponentLazyConfig
} from './lazy-loading-config';