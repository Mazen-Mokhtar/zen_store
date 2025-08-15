export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

export interface PageView {
  page: string;
  title: string;
  referrer?: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

export interface UserInteraction {
  type: 'click' | 'scroll' | 'form_submit' | 'search' | 'purchase';
  element?: string;
  value?: any;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

class AnalyticsManager {
  private events: AnalyticsEvent[] = [];
  private pageViews: PageView[] = [];
  private interactions: UserInteraction[] = [];
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeAnalytics();
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private initializeAnalytics(): void {
    if (typeof window === 'undefined') return;

    // Listen for settings changes
    window.addEventListener('analytics-toggle', (event: any) => {
      this.isEnabled = event.detail;
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Auto-flush every 30 seconds
    setInterval(() => {
      this.flush();
    }, 30000);
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Track custom events
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.events.push(event);
    console.log('Analytics Event:', event);
  }

  // Track page views
  trackPageView(page: string, title: string, referrer?: string): void {
    if (!this.isEnabled) return;

    const pageView: PageView = {
      page,
      title,
      referrer,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.pageViews.push(pageView);
    console.log('Page View:', pageView);
  }

  // Track user interactions
  trackInteraction(type: UserInteraction['type'], element?: string, value?: any): void {
    if (!this.isEnabled) return;

    const interaction: UserInteraction = {
      type,
      element,
      value,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.interactions.push(interaction);
    console.log('User Interaction:', interaction);
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number): void {
    if (!this.isEnabled) return;

    this.track('performance_metric', {
      metric,
      value,
      url: window.location.href
    });
  }

  // Track errors
  trackError(error: Error, context?: string): void {
    if (!this.isEnabled) return;

    this.track('error', {
      message: error.message,
      stack: error.stack,
      context,
      url: window.location.href
    });
  }

  // Track conversions
  trackConversion(type: string, value?: number, currency?: string): void {
    if (!this.isEnabled) return;

    this.track('conversion', {
      type,
      value,
      currency,
      url: window.location.href
    });
  }

  // Track search
  trackSearch(query: string, results?: number): void {
    if (!this.isEnabled) return;

    this.trackInteraction('search', 'search_input', query);
    this.track('search', {
      query,
      results,
      url: window.location.href
    });
  }

  // Track purchases
  trackPurchase(gameId: string, packageId: string, amount: number, currency: string): void {
    if (!this.isEnabled) return;

    this.trackInteraction('purchase', 'buy_button', { gameId, packageId, amount });
    this.trackConversion('purchase', amount, currency);
    this.track('purchase', {
      gameId,
      packageId,
      amount,
      currency,
      url: window.location.href
    });
  }

  // Get analytics data
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getPageViews(): PageView[] {
    return [...this.pageViews];
  }

  getInteractions(): UserInteraction[] {
    return [...this.interactions];
  }

  // Get analytics summary
  getSummary(): {
    totalEvents: number;
    totalPageViews: number;
    totalInteractions: number;
    sessionDuration: number;
    topPages: { page: string; views: number }[];
    topEvents: { name: string; count: number }[];
  } {
    const now = Date.now();
    const sessionStart = Math.min(
      ...this.pageViews.map(pv => pv.timestamp),
      ...this.events.map(e => e.timestamp),
      ...this.interactions.map(i => i.timestamp)
    );

    // Top pages
    const pageViewCounts = this.pageViews.reduce((acc, pv) => {
      acc[pv.page] = (acc[pv.page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPages = Object.entries(pageViewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([page, views]) => ({ page, views }));

    // Top events
    const eventCounts = this.events.reduce((acc, e) => {
      acc[e.name] = (acc[e.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalEvents: this.events.length,
      totalPageViews: this.pageViews.length,
      totalInteractions: this.interactions.length,
      sessionDuration: now - sessionStart,
      topPages,
      topEvents
    };
  }

  // Flush data to server
  private async flush(): Promise<void> {
    if (!this.isEnabled) return;

    const data = {
      events: this.events,
      pageViews: this.pageViews,
      interactions: this.interactions,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now()
    };

    try {
      // In a real application, send to analytics service
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // });

      console.log('Analytics data flushed:', data);
      
      // Clear local data after successful flush
      this.events = [];
      this.pageViews = [];
      this.interactions = [];
    } catch (error) {
      console.error('Failed to flush analytics data:', error);
    }
  }

  // Clear all data
  clear(): void {
    this.events = [];
    this.pageViews = [];
    this.interactions = [];
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }
}

export const analytics = new AnalyticsManager();

// Auto-track page views for Next.js
if (typeof window !== 'undefined') {
  // Track initial page view
  analytics.trackPageView(window.location.pathname, document.title, document.referrer);

  // Track navigation changes
  let currentPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      analytics.trackPageView(currentPath, document.title);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Export analytics utilities
export const trackEvent = analytics.track.bind(analytics);
export const trackPageView = analytics.trackPageView.bind(analytics);
export const trackInteraction = analytics.trackInteraction.bind(analytics);
export const trackError = analytics.trackError.bind(analytics);
export const trackPurchase = analytics.trackPurchase.bind(analytics);
export const trackSearch = analytics.trackSearch.bind(analytics);