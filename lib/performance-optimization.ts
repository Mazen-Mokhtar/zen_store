// Performance optimization utilities for the target pages
import { logger } from './utils';

// Image optimization utilities
export const imageOptimization = {
  // Generate responsive image sizes for different breakpoints
  generateSizes: (breakpoints: Record<string, string> = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '50vw',
    '(max-width: 1280px)': '33vw',
  }): string => {
    const defaultSize = '25vw';
    const sizeEntries = Object.entries(breakpoints);
    const sizesArray = sizeEntries.map(([query, size]) => `${query} ${size}`);
    sizesArray.push(defaultSize);
    return sizesArray.join(', ');
  },

  // Preload critical images
  preloadCriticalImages: (images: string[]) => {
    if (typeof window === 'undefined') return;
    
    images.forEach((src, index) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      if (index === 0) link.fetchPriority = 'high';
      document.head.appendChild(link);
    });
  },

  // Lazy load images with intersection observer
  createLazyImageObserver: (options: IntersectionObserverInit = {}) => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return null;
    }

    return new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.remove('lazy');
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01,
      ...options
    });
  }
};

// Bundle optimization utilities
export const bundleOptimization = {
  // Dynamic import with error handling
  dynamicImport: async <T>(importFn: () => Promise<T>): Promise<T | null> => {
    try {
      return await importFn();
    } catch (error) {
      logger.error('Dynamic import failed:', error);
      return null;
    }
  },

  // Preload critical modules
  preloadModules: (modules: (() => Promise<any>)[]) => {
    if (typeof window === 'undefined') return;
    
    // Use requestIdleCallback if available
    const preload = () => {
      modules.forEach(async (moduleImport) => {
        try {
          await moduleImport();
        } catch (error) {
          logger.warn('Module preload failed:', error);
        }
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preload);
    } else {
      setTimeout(preload, 1000);
    }
  }
};

// Core Web Vitals optimization
export const coreWebVitals = {
  // Monitor and optimize LCP
  optimizeLCP: () => {
    if (typeof window === 'undefined') return;

    // Preload LCP image
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry && lastEntry.startTime > 2500) {
        logger.warn('LCP is slow:', lastEntry.startTime);
      }
    });
    
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      logger.warn('LCP monitoring not supported');
    }
  },

  // Optimize CLS by preventing layout shifts
  preventLayoutShift: () => {
    if (typeof window === 'undefined') return;

    // Add aspect ratio containers for images
    const images = document.querySelectorAll('img[data-prevent-cls]');
    images.forEach((img) => {
      const container = img.parentElement;
      if (container) {
        container.style.aspectRatio = '16/9'; // Default aspect ratio
      }
    });
  },

  // Monitor FID
  monitorFID: () => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fid = (entry as any).processingStart - entry.startTime;
        if (fid > 100) {
          logger.warn('FID is slow:', fid);
        }
      });
    });
    
    try {
      observer.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      logger.warn('FID monitoring not supported');
    }
  }
};

// Memory optimization for large lists
export const memoryOptimization = {
  // Virtual scrolling for large order lists
  createVirtualScroller: (
    containerRef: React.RefObject<HTMLElement>,
    itemHeight: number,
    items: any[]
  ) => {
    if (!containerRef.current) return { visibleItems: items, startIndex: 0 };

    const containerHeight = containerRef.current.clientHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Buffer
    const scrollTop = containerRef.current.scrollTop;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount, items.length);

    return {
      visibleItems: items.slice(startIndex, endIndex),
      startIndex,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  },

  // Debounce search input
  debounceSearch: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
};

// Accessibility optimization
export const accessibilityOptimization = {
  // Add ARIA labels and roles
  enhanceAccessibility: () => {
    if (typeof window === 'undefined') return;

    // Add skip links
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Enhance focus management
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  },

  // Announce dynamic content changes
  announceToScreenReader: (message: string) => {
    if (typeof window === 'undefined') return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
};

// SEO optimization utilities
export const seoOptimization = {
  // Generate structured data for games
  generateGameStructuredData: (game: any) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: game.name,
      description: game.description,
      image: game.image?.secure_url,
      offers: {
        '@type': 'Offer',
        price: game.price || game.finalPrice,
        priceCurrency: 'EGP',
        availability: 'https://schema.org/InStock'
      },
      brand: {
        '@type': 'Brand',
        name: 'Zen Store'
      }
    };
  },

  // Generate breadcrumb structured data
  generateBreadcrumbData: (breadcrumbs: { name: string; url: string }[]) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    };
  }
};

// Initialize optimizations
export const initializeOptimizations = () => {
  if (typeof window === 'undefined') return;

  // Core Web Vitals monitoring
  coreWebVitals.optimizeLCP();
  coreWebVitals.monitorFID();
  coreWebVitals.preventLayoutShift();

  // Accessibility enhancements
  accessibilityOptimization.enhanceAccessibility();

  // Preload critical resources
  const criticalImages = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80'
  ];
  imageOptimization.preloadCriticalImages(criticalImages);

  logger.info('Performance optimizations initialized');
};

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOptimizations);
  } else {
    initializeOptimizations();
  }
}