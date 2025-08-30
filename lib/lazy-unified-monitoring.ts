// Lazy-loaded unified monitoring module to improve app startup performance
// This module delays monitoring initialization until first use

import { logger } from './utils';

let monitoringModule: any = null;
let monitoringPromise: Promise<any> | null = null;

// Lazy load unified monitoring module
async function loadMonitoring() {
  if (monitoringModule) {
    return monitoringModule;
  }

  if (monitoringPromise) {
    return monitoringPromise;
  }

  monitoringPromise = import('./unified-monitoring').then((module) => {
    monitoringModule = module;
    return module;
  });

  return monitoringPromise;
}

// Lazy unified monitoring wrapper
export const lazyUnifiedMonitoring = {
  // Analytics methods
  async trackEvent(eventName: string, properties?: Record<string, any>) {
    const { trackEvent } = await loadMonitoring();
    return trackEvent(eventName, properties);
  },

  async trackPageView(page: string, title: string, referrer?: string) {
    const { trackPageView } = await loadMonitoring();
    return trackPageView(page, title, referrer);
  },

  async trackInteraction(type: 'click' | 'scroll' | 'form_submit' | 'search' | 'purchase', element?: string, value?: any) {
    const { trackInteraction } = await loadMonitoring();
    return trackInteraction(type, element, value);
  },

  async trackError(error: Error, context?: string) {
    const { trackError } = await loadMonitoring();
    return trackError(error, context);
  },

  async trackPurchase(gameId: string, packageId: string, amount: number, currency: string) {
    const { trackPurchase } = await loadMonitoring();
    return trackPurchase(gameId, packageId, amount, currency);
  },

  async trackSearch(query: string, results?: number) {
    const { trackSearch } = await loadMonitoring();
    return trackSearch(query, results);
  },

  async trackConversion(type: string, value?: number, currency?: string) {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.trackConversion(type, value, currency);
  },

  // Performance methods
  async recordPerformanceMetric(name: string, value: number, unit?: string, context?: Record<string, any>) {
    const { recordPerformanceMetric } = await loadMonitoring();
    return recordPerformanceMetric(name, value, unit, context);
  },

  // Observer methods
  async addObserver(observer: any) {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.addObserver(observer);
  },

  async removeObserver(observer: any) {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.removeObserver(observer);
  },

  // Data retrieval methods
  async getEvents(type?: 'analytics' | 'performance' | 'error' | 'interaction') {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.getEvents(type);
  },

  async getPerformanceMetrics(name?: string) {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.getPerformanceMetrics(name);
  },

  async getLatestMetric(name: string) {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.getLatestMetric(name);
  },

  async getPageViews() {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.getPageViews();
  },

  async getInteractions() {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.getInteractions();
  },

  async getSummary() {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.getSummary();
  },

  // Configuration methods
  async setUserId(userId: string) {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.setUserId(userId);
  },

  async setEnabled(enabled: boolean) {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.setEnabled(enabled);
  },

  async isMonitoringEnabled() {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.isMonitoringEnabled();
  },

  // Utility methods
  async debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.debounce(func, wait);
  },

  async throttle<T extends (...args: any[]) => any>(func: T, limit: number) {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.throttle(func, limit);
  },

  async preloadImage(src: string) {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.preloadImage(src);
  },

  async createIntersectionObserver(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.createIntersectionObserver(callback, options);
  },

  // Cleanup methods
  async clear() {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.clear();
  },

  async destroy() {
    const { unifiedMonitoring } = await loadMonitoring();
    return unifiedMonitoring.destroy();
  }
};

// Preload during idle time
export function preloadUnifiedMonitoring() {
  if (typeof window !== 'undefined' && document.readyState === 'complete') {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        loadMonitoring().catch((err) => 
          logger.warn('Failed to preload unified monitoring module', err)
        );
      });
    } else {
      setTimeout(() => {
        loadMonitoring().catch((err) => 
          logger.warn('Failed to preload unified monitoring module', err)
        );
      }, 1000);
    }
  }
}

// Auto-preload when appropriate - only in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Additional check to ensure we're in a proper browser environment
  if (window.document && window.navigator) {
    if (document.readyState === 'complete') {
      preloadUnifiedMonitoring();
    } else {
      window.addEventListener('load', preloadUnifiedMonitoring);
    }
  }
}

// Export convenience functions for backward compatibility
export const lazyTrackEvent = lazyUnifiedMonitoring.trackEvent;
export const lazyTrackPageView = lazyUnifiedMonitoring.trackPageView;
export const lazyTrackInteraction = lazyUnifiedMonitoring.trackInteraction;
export const lazyTrackError = lazyUnifiedMonitoring.trackError;
export const lazyTrackPurchase = lazyUnifiedMonitoring.trackPurchase;
export const lazyTrackSearch = lazyUnifiedMonitoring.trackSearch;
export const lazyRecordPerformanceMetric = lazyUnifiedMonitoring.recordPerformanceMetric;

// Legacy compatibility exports
export const lazyAnalytics = {
  track: lazyUnifiedMonitoring.trackEvent,
  trackPageView: lazyUnifiedMonitoring.trackPageView,
  trackInteraction: lazyUnifiedMonitoring.trackInteraction,
  trackError: lazyUnifiedMonitoring.trackError,
  trackPurchase: lazyUnifiedMonitoring.trackPurchase,
  trackSearch: lazyUnifiedMonitoring.trackSearch,
  trackPerformance: lazyUnifiedMonitoring.recordPerformanceMetric,
  setUserId: lazyUnifiedMonitoring.setUserId,
  getSummary: lazyUnifiedMonitoring.getSummary
};

export const lazyPerformance = {
  addObserver: lazyUnifiedMonitoring.addObserver,
  removeObserver: lazyUnifiedMonitoring.removeObserver,
  getMetrics: lazyUnifiedMonitoring.getPerformanceMetrics,
  getMetricsByName: lazyUnifiedMonitoring.getPerformanceMetrics,
  getLatestMetric: lazyUnifiedMonitoring.getLatestMetric,
  clearMetrics: lazyUnifiedMonitoring.clear,
  debounce: lazyUnifiedMonitoring.debounce,
  throttle: lazyUnifiedMonitoring.throttle,
  preloadImage: lazyUnifiedMonitoring.preloadImage,
  createIntersectionObserver: lazyUnifiedMonitoring.createIntersectionObserver,
  getPerformanceReport: lazyUnifiedMonitoring.getSummary
};