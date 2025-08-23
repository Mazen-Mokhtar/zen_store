// Lazy-loaded analytics module to improve app startup performance
// This module delays analytics initialization until first use

let analyticsModule: any = null;
let analyticsPromise: Promise<any> | null = null;

// Lazy load analytics module
async function loadAnalytics() {
  if (analyticsModule) {
    return analyticsModule;
  }

  if (analyticsPromise) {
    return analyticsPromise;
  }

  analyticsPromise = import('./analytics').then((module) => {
    analyticsModule = module;
    return module;
  });

  return analyticsPromise;
}

// Lazy analytics wrapper
export const lazyAnalytics = {
  async track(eventName: string, properties?: Record<string, any>) {
    const { trackEvent } = await loadAnalytics();
    return trackEvent(eventName, properties);
  },

  async trackPageView(page: string, title: string, referrer?: string) {
    const { trackPageView } = await loadAnalytics();
    return trackPageView(page, title, referrer);
  },

  async trackInteraction(type: 'click' | 'scroll' | 'form_submit' | 'search' | 'purchase', element?: string, value?: any) {
    const { trackInteraction } = await loadAnalytics();
    return trackInteraction(type, element, value);
  },

  async trackError(error: Error, context?: string) {
    const { trackError } = await loadAnalytics();
    return trackError(error, context);
  },

  async trackPurchase(gameId: string, packageId: string, amount: number, currency: string) {
    const { trackPurchase } = await loadAnalytics();
    return trackPurchase(gameId, packageId, amount, currency);
  },

  async trackSearch(query: string, results?: number) {
    const { trackSearch } = await loadAnalytics();
    return trackSearch(query, results);
  },

  async trackPerformance(metric: string, value: number) {
    const { analytics } = await loadAnalytics();
    return analytics.trackPerformance(metric, value);
  },

  async setUserId(userId: string) {
    const { analytics } = await loadAnalytics();
    return analytics.setUserId(userId);
  },

  async getSummary() {
    const { analytics } = await loadAnalytics();
    return analytics.getSummary();
  }
};

// Preload analytics module after page load (non-blocking)
export function preloadAnalytics() {
  if (typeof window !== 'undefined' && document.readyState === 'complete') {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        loadAnalytics().catch((err) => logger.warn('Failed to preload analytics module', err));
      });
    } else {
      setTimeout(() => {
        loadAnalytics().catch((err) => logger.warn('Failed to preload analytics module', err));
      }, 1000);
    }
  }
}

// Auto-preload when module is imported
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    preloadAnalytics();
  } else {
    window.addEventListener('load', preloadAnalytics);
  }
}
import { logger } from './utils';