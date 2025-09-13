// Advanced code splitting utilities for Next.js

import { ComponentType, lazy, LazyExoticComponent } from 'react';
// Define types locally since they're not available in ./types
interface RouteConfig {
  path: string;
  component: () => Promise<any>;
  priority: ChunkPriority;
  preload?: boolean;
}

enum ChunkPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

interface CodeSplitConfig {
  preload?: boolean;
  priority?: ChunkPriority;
  timeout?: number;
  retries?: number;
  fallback?: ComponentType;
}

interface RouteBasedSplitConfig {
  routes: Record<string, string[]>; // route -> component paths
  preloadRules: Record<string, PreloadRule>;
}

interface PreloadRule {
  trigger: 'hover' | 'visible' | 'idle' | 'immediate';
  delay?: number;
  condition?: () => boolean;
}

// Route-based code splitting configuration
export const ROUTE_SPLIT_CONFIG: RouteBasedSplitConfig = {
  routes: {
    '/': [
      '@/components/ui/glare-card-demo',
      '@/components/ui/shape-landing-hero'
    ],
    '/dashboard': [
      '@/components/dashboard/DashboardHeader',
      '@/components/dashboard/GameGrid',
      '@/components/dashboard/FilterSection'
    ],
    '/category-dashboard': [
      '@/components/category-dashboard/CategoryHeader',
      '@/components/category-dashboard/CategoryHero',
      '@/components/category-dashboard/CategoryGamesSection'
    ],
    '/packages': [
      '@/components/packages/PackageGrid',
      '@/components/packages/PackageCard'
    ],
    '/orders': [
      '@/components/orders/OrdersList',
      '@/components/orders/OrderDetails'
    ],
    '/admin': [
      '@/components/admin/SecurityDashboard',
      '@/components/admin/SecurityMetrics',
      '@/components/admin/orders/OrdersManagement'
    ]
  },
  preloadRules: {
    '/dashboard': {
      trigger: 'hover',
      delay: 200
    },
    '/category-dashboard': {
      trigger: 'hover',
      delay: 200
    },
    '/packages': {
      trigger: 'visible',
      delay: 500
    },
    '/orders': {
      trigger: 'idle',
      condition: () => typeof window !== 'undefined' && 'requestIdleCallback' in window
    },
    '/admin': {
      trigger: 'immediate',
      condition: () => {
        // Only preload for admin users
        if (typeof window === 'undefined') return false;
        const userRole = localStorage.getItem('userRole');
        return userRole === 'admin';
      }
    }
  }
};

// Enhanced lazy loading with error boundaries and retries
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  config: CodeSplitConfig = {}
): LazyExoticComponent<T> => {
  const {
    preload = false,
    priority = 'low',
    timeout = 10000,
    retries = 3
  } = config;

  let importPromise: Promise<{ default: T }> | null = null;
  let retryCount = 0;

  const loadWithRetry = async (): Promise<{ default: T }> => {
    try {
      if (!importPromise) {
        importPromise = Promise.race([
          importFn(),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Component load timeout')), timeout);
          })
        ]);
      }
      return await importPromise;
    } catch (error) {
      importPromise = null;
      
      if (retryCount < retries) {
        retryCount++;
        console.warn(`Component load failed, retrying (${retryCount}/${retries}):`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        return loadWithRetry();
      }
      
      throw error;
    }
  };

  const LazyComponent = lazy(loadWithRetry);

  // Preload if configured
  if (preload) {
    if (priority === 'high') {
      // Immediate preload
      loadWithRetry().catch(console.warn);
    } else if (priority === 'medium') {
      // Preload on idle
      if (typeof window !== 'undefined') {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(() => loadWithRetry().catch(console.warn));
        } else {
          setTimeout(() => loadWithRetry().catch(console.warn), 1000);
        }
      }
    }
  }

  return LazyComponent;
};

// Route-based preloading manager
export class RoutePreloader {
  private preloadedRoutes = new Set<string>();
  private preloadPromises = new Map<string, Promise<void>>();

  async preloadRoute(route: string): Promise<void> {
    if (this.preloadedRoutes.has(route)) {
      return;
    }

    if (this.preloadPromises.has(route)) {
      return this.preloadPromises.get(route);
    }

    const preloadPromise = this.executeRoutePreload(route);
    this.preloadPromises.set(route, preloadPromise);

    try {
      await preloadPromise;
      this.preloadedRoutes.add(route);
    } catch (error) {
      console.warn(`Failed to preload route ${route}:`, error);
    } finally {
      this.preloadPromises.delete(route);
    }
  }

  private async executeRoutePreload(route: string): Promise<void> {
    const componentPaths = ROUTE_SPLIT_CONFIG.routes[route];
    if (!componentPaths) {
      return;
    }

    const preloadPromises = componentPaths.map(async (componentPath) => {
      try {
        await import(componentPath);
        console.log(`Preloaded component: ${componentPath}`);
      } catch (error) {
        console.warn(`Failed to preload component ${componentPath}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  setupRoutePreloading(): void {
    if (typeof window === 'undefined') return;

    // Preload based on hover events
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        const url = new URL(link.href);
        const route = url.pathname;
        const rule = ROUTE_SPLIT_CONFIG.preloadRules[route];
        
        if (rule && rule.trigger === 'hover') {
          const delay = rule.delay || 0;
          setTimeout(() => {
            if (!rule.condition || rule.condition()) {
              this.preloadRoute(route);
            }
          }, delay);
        }
      }
    });

    // Preload on intersection (visible)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          const route = target.dataset.preloadRoute;
          
          if (route) {
            const rule = ROUTE_SPLIT_CONFIG.preloadRules[route];
            if (rule && rule.trigger === 'visible') {
              const delay = rule.delay || 0;
              setTimeout(() => {
                if (!rule.condition || rule.condition()) {
                  this.preloadRoute(route);
                }
              }, delay);
            }
          }
        }
      });
    });

    // Observe elements with preload routes
    document.querySelectorAll('[data-preload-route]').forEach((element) => {
      observer.observe(element);
    });

    // Preload on idle
    const preloadOnIdle = () => {
      Object.entries(ROUTE_SPLIT_CONFIG.preloadRules).forEach(([route, rule]) => {
        if (rule.trigger === 'idle') {
          if (!rule.condition || rule.condition()) {
            this.preloadRoute(route);
          }
        }
      });
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(preloadOnIdle);
    } else {
      setTimeout(preloadOnIdle, 2000);
    }

    // Immediate preloads
    Object.entries(ROUTE_SPLIT_CONFIG.preloadRules).forEach(([route, rule]) => {
      if (rule.trigger === 'immediate') {
        if (!rule.condition || rule.condition()) {
          this.preloadRoute(route);
        }
      }
    });
  }

  getPreloadStats(): {
    preloadedCount: number;
    totalRoutes: number;
    preloadedRoutes: string[];
  } {
    return {
      preloadedCount: this.preloadedRoutes.size,
      totalRoutes: Object.keys(ROUTE_SPLIT_CONFIG.routes).length,
      preloadedRoutes: Array.from(this.preloadedRoutes)
    };
  }
}

// Singleton instance
export const routePreloader = new RoutePreloader();

// Initialize route preloading
export const initializeRoutePreloading = (): void => {
  if (typeof window !== 'undefined') {
    routePreloader.setupRoutePreloading();
  }
};

// Utility for manual preloading
export const preloadComponents = async (componentPaths: string[]): Promise<void> => {
  const preloadPromises = componentPaths.map(async (path) => {
    try {
      await import(path);
      console.log(`Manually preloaded: ${path}`);
    } catch (error) {
      console.warn(`Failed to manually preload ${path}:`, error);
    }
  });

  await Promise.allSettled(preloadPromises);
};

// Hook for component-level code splitting
export const useCodeSplitting = () => {
  const preloadRoute = (route: string) => {
    return routePreloader.preloadRoute(route);
  };

  const getStats = () => {
    return routePreloader.getPreloadStats();
  };

  return {
    preloadRoute,
    getStats,
    preloadComponents
  };
};