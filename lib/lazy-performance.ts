// Lazy-loaded performance manager to reduce initial bundle and avoid early observers
// This wraps performanceManager and loads it on first use.

let performanceModule: any = null;
let performancePromise: Promise<any> | null = null;

async function loadPerformance() {
  if (performanceModule) return performanceModule;
  if (performancePromise) return performancePromise;

  performancePromise = import('./performance').then((module) => {
    performanceModule = module;
    return module;
  });

  return performancePromise;
}

export const lazyPerformance = {
  async addObserver(observer: any) {
    const { performanceManager } = await loadPerformance();
    return performanceManager.addObserver(observer);
  },
  async removeObserver(observer: any) {
    const { performanceManager } = await loadPerformance();
    return performanceManager.removeObserver(observer);
  },
  async getMetrics() {
    const { performanceManager } = await loadPerformance();
    return performanceManager.getMetrics();
  },
  async getMetricsByName(name: string) {
    const { performanceManager } = await loadPerformance();
    return performanceManager.getMetricsByName(name);
  },
  async getLatestMetric(name: string) {
    const { performanceManager } = await loadPerformance();
    return performanceManager.getLatestMetric(name);
  },
  async clearMetrics() {
    const { performanceManager } = await loadPerformance();
    return performanceManager.clearMetrics();
  },
  async debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    const { debounce } = await loadPerformance();
    return debounce(func, wait);
  },
  async throttle<T extends (...args: any[]) => any>(func: T, limit: number) {
    const { throttle } = await loadPerformance();
    return throttle(func, limit);
  },
  async preloadImage(src: string) {
    const { preloadImage } = await loadPerformance();
    return preloadImage(src);
  },
  async createIntersectionObserver(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    const { createIntersectionObserver } = await loadPerformance();
    return createIntersectionObserver(callback, options);
  },
  async setCacheHeaders(url: string, maxAge: number = 3600) {
    const { performanceManager } = await loadPerformance();
    return performanceManager.setCacheHeaders(url, maxAge);
  },
  async getPerformanceReport() {
    const { performanceManager } = await loadPerformance();
    return performanceManager.getPerformanceReport();
  }
};

// Preload during idle time
export function preloadPerformance() {
  if (typeof window !== 'undefined' && document.readyState === 'complete') {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        loadPerformance().catch((err) => logger.warn('Failed to preload performance module', err));
      });
    } else {
      setTimeout(() => {
        loadPerformance().catch((err) => logger.warn('Failed to preload performance module', err));
      }, 1000);
    }
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    preloadPerformance();
  } else {
    window.addEventListener('load', preloadPerformance);
  }
}
import { logger } from './utils';