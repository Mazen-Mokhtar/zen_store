// Configuration for lazy loading across the application

export interface LazyLoadingConfig {
  // Intersection Observer settings
  threshold: number;
  rootMargin: string;
  
  // Preloading settings
  preloadDelay: number;
  preloadCritical: boolean;
  
  // Performance settings
  maxConcurrentLoads: number;
  loadTimeout: number;
  
  // Component-specific settings
  componentSettings: Record<string, ComponentLazyConfig>;
}

export interface ComponentLazyConfig {
  preload: boolean;
  priority: 'high' | 'medium' | 'low';
  threshold?: number;
  rootMargin?: string;
  fallbackComponent?: string;
  loadTimeout?: number;
}

// Default configuration
export const defaultLazyLoadingConfig: LazyLoadingConfig = {
  threshold: 0.1,
  rootMargin: '50px',
  preloadDelay: 100,
  preloadCritical: true,
  maxConcurrentLoads: 3,
  loadTimeout: 5000,
  componentSettings: {
    // Critical components - load immediately
    'GlareCardDemo': {
      preload: true,
      priority: 'high',
      threshold: 0.2,
      rootMargin: '100px'
    },
    'NotificationToast': {
      preload: true,
      priority: 'high'
    },
    'LoadingSpinner': {
      preload: true,
      priority: 'high'
    },
    'ErrorMessage': {
      preload: true,
      priority: 'high'
    },
    
    // Dashboard components - medium priority
    'CategoryHeader': {
      preload: true,
      priority: 'medium',
      threshold: 0.15
    },
    'DashboardHeader': {
      preload: true,
      priority: 'medium'
    },
    'GameGrid': {
      preload: false,
      priority: 'medium',
      threshold: 0.1,
      rootMargin: '200px'
    },
    
    // Heavy components - low priority
    'CategoryHero': {
      preload: false,
      priority: 'low',
      threshold: 0.05,
      rootMargin: '300px'
    },
    'PopularSection': {
      preload: false,
      priority: 'low',
      threshold: 0.1,
      rootMargin: '150px'
    },
    'CategoryGamesSection': {
      preload: false,
      priority: 'low',
      threshold: 0.1,
      rootMargin: '200px'
    },
    'ImageGallery': {
      preload: false,
      priority: 'low',
      threshold: 0.05
    },
    'VideoPlayer': {
      preload: false,
      priority: 'low',
      threshold: 0.1,
      loadTimeout: 8000
    },
    'Chart': {
      preload: false,
      priority: 'low',
      threshold: 0.1
    }
  }
};

// Critical components that should be preloaded
export const criticalComponents = [
  '@/components/ui/loading-spinner',
  '@/components/ui/error-message',
  '@/components/ui/notification-toast'
];

// Components to preload on idle
export const idlePreloadComponents = [
  '@/components/ui/glare-card',
  '@/components/category-dashboard/CategoryHeader',
  '@/components/dashboard/DashboardHeader'
];

// Route-based preloading configuration
export const routePreloadConfig = {
  '/': {
    preload: ['@/components/ui/glare-card-demo'],
    priority: 'high'
  },
  '/dashboard': {
    preload: [
      '@/components/dashboard/DashboardHeader',
      '@/components/dashboard/GameGrid'
    ],
    priority: 'medium'
  },
  '/category-dashboard': {
    preload: [
      '@/components/category-dashboard/CategoryHeader',
      '@/components/category-dashboard/CategoryGamesSection'
    ],
    priority: 'medium'
  }
};

// Performance thresholds
export const performanceThresholds = {
  // Maximum time to wait for a component to load (ms)
  maxLoadTime: 5000,
  
  // Maximum number of components loading simultaneously
  maxConcurrentLoads: 3,
  
  // Minimum time between lazy loads to prevent overwhelming
  minLoadInterval: 50,
  
  // Memory usage threshold to trigger cleanup
  memoryThreshold: 100 * 1024 * 1024, // 100MB
  
  // Bundle size threshold for lazy loading
  bundleSizeThreshold: 50 * 1024 // 50KB
};

// Utility function to get component config
export const getComponentConfig = (componentName: string): ComponentLazyConfig => {
  return defaultLazyLoadingConfig.componentSettings[componentName] || {
    preload: false,
    priority: 'low',
    threshold: 0.1,
    rootMargin: '50px'
  };
};

// Utility function to check if component should be preloaded
export const shouldPreloadComponent = (componentName: string): boolean => {
  const config = getComponentConfig(componentName);
  return config.preload && config.priority === 'high';
};