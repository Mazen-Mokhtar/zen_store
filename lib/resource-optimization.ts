// Resource optimization utilities for images, fonts, and other assets

import { logger } from './utils';

// Image optimization utilities
export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private imageCache = new Map<string, HTMLImageElement>();
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  // Preload critical images
  async preloadImage(src: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<HTMLImageElement> {
    if (typeof window === 'undefined') {
      // Return a mock HTMLImageElement during SSR
      return {} as HTMLImageElement;
    }
    
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src)!;
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      // Set loading priority
      if ('loading' in img) {
        img.loading = priority === 'high' ? 'eager' : 'lazy';
      }
      
      // Set fetch priority if supported
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = priority;
      }

      img.onload = () => {
        this.imageCache.set(src, img);
        this.loadingPromises.delete(src);
        resolve(img);
      };

      img.onerror = () => {
        this.loadingPromises.delete(src);
        logger.warn(`Failed to preload image: ${src}`);
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  // Generate responsive image srcSet
  generateSrcSet(baseUrl: string, sizes: number[] = [320, 640, 768, 1024, 1280, 1920]): string {
    return sizes
      .map(size => {
        // Assuming Cloudinary or similar service
        const optimizedUrl = baseUrl.includes('cloudinary.com')
          ? baseUrl.replace('/upload/', `/upload/w_${size},f_auto,q_auto/`)
          : `${baseUrl}?w=${size}&q=75`;
        return `${optimizedUrl} ${size}w`;
      })
      .join(', ');
  }

  // Generate sizes attribute for responsive images
  generateSizes(breakpoints: { [key: string]: string } = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '50vw',
    '(max-width: 1280px)': '33vw',
  }): string {
    const defaultSize = '25vw';
    const sizeEntries = Object.entries(breakpoints);
    const sizesArray = sizeEntries.map(([query, size]) => `${query} ${size}`);
    sizesArray.push(defaultSize);
    return sizesArray.join(', ');
  }

  // Lazy load images with Intersection Observer
  createLazyImageObserver(options: IntersectionObserverInit = {}): IntersectionObserver | null {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return null;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          const srcset = img.dataset.srcset;

          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }

          if (srcset) {
            img.srcset = srcset;
            img.removeAttribute('data-srcset');
          }

          img.classList.remove('lazy');
          img.classList.add('loaded');
          
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01,
      ...options
    });
    
    return observer;
  }

  // Clear image cache
  clearCache(): void {
    this.imageCache.clear();
    this.loadingPromises.clear();
  }
}

// Font optimization utilities
export class FontOptimizer {
  private static loadedFonts = new Set<string>();

  // Preload critical fonts
  static preloadFont(fontUrl: string, fontDisplay: 'auto' | 'block' | 'swap' | 'fallback' | 'optional' = 'swap'): void {
    if (typeof document === 'undefined' || this.loadedFonts.has(fontUrl)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = fontUrl;

    // Add font-display CSS
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-display: ${fontDisplay};
      }
    `;

    document.head.appendChild(link);
    document.head.appendChild(style);
    this.loadedFonts.add(fontUrl);
  }

  // Load Google Fonts optimally
  static loadGoogleFonts(families: string[], display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional' = 'swap'): void {
    if (typeof document === 'undefined') return;

    const fontUrl = `https://fonts.googleapis.com/css2?${families.map(family => `family=${encodeURIComponent(family)}`).join('&')}&display=${display}`;
    
    // Preconnect to Google Fonts
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    
    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';

    // Load fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;

    document.head.appendChild(preconnect1);
    document.head.appendChild(preconnect2);
    document.head.appendChild(link);
  }
}

// CSS optimization utilities
export class CSSOptimizer {
  // Remove unused CSS classes (basic implementation)
  static removeUnusedCSS(cssText: string, usedClasses: Set<string>): string {
    const lines = cssText.split('\n');
    const optimizedLines: string[] = [];
    let inRule = false;
    let currentRule = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('{')) {
        inRule = true;
        currentRule = trimmedLine;
      } else if (trimmedLine.includes('}')) {
        inRule = false;
        
        // Check if any class in the rule is used
        const classMatches = currentRule.match(/\.[a-zA-Z][a-zA-Z0-9_-]*/g);
        const isUsed = classMatches?.some(cls => usedClasses.has(cls.substring(1)));
        
        if (isUsed) {
          optimizedLines.push(currentRule);
          optimizedLines.push(line);
        }
        
        currentRule = '';
      } else if (inRule) {
        if (currentRule) {
          optimizedLines.push(currentRule);
          currentRule = '';
        }
        optimizedLines.push(line);
      } else if (!inRule && !trimmedLine.startsWith('.')) {
        optimizedLines.push(line);
      }
    }

    return optimizedLines.join('\n');
  }

  // Inline critical CSS
  static inlineCriticalCSS(criticalCSS: string): void {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    style.setAttribute('data-critical', 'true');
    document.head.appendChild(style);
  }

  // Load non-critical CSS asynchronously
  static loadNonCriticalCSS(href: string): void {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = () => {
      link.rel = 'stylesheet';
    };
    
    document.head.appendChild(link);
  }
}

// JavaScript optimization utilities
export class JSOptimizer {
  // Defer non-critical JavaScript
  static deferScript(src: string, priority: 'high' | 'low' = 'low'): void {
    if (typeof document === 'undefined') return;

    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    
    if (priority === 'low') {
      script.async = true;
    }

    document.head.appendChild(script);
  }

  // Load script with retry mechanism
  static loadScriptWithRetry(src: string, maxRetries: number = 3): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const loadScript = () => {
        const script = document.createElement('script');
        script.src = src;
        
        script.onload = () => resolve();
        script.onerror = () => {
          attempts++;
          if (attempts < maxRetries) {
            setTimeout(loadScript, 1000 * attempts); // Exponential backoff
          } else {
            reject(new Error(`Failed to load script after ${maxRetries} attempts: ${src}`));
          }
        };

        document.head.appendChild(script);
      };

      loadScript();
    });
  }
}

// Resource preloading manager
export class ResourcePreloader {
  private static preloadedResources = new Set<string>();

  // Preload critical resources
  static preloadResource(href: string, as: string, type?: string, crossorigin?: string): void {
    if (typeof document === 'undefined' || this.preloadedResources.has(href)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (type) link.type = type;
    if (crossorigin) link.crossOrigin = crossorigin;

    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }

  // Prefetch resources for future navigation
  static prefetchResource(href: string): void {
    if (typeof document === 'undefined' || this.preloadedResources.has(href)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;

    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }

  // Preconnect to external domains
  static preconnect(href: string, crossorigin: boolean = false): void {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    
    if (crossorigin) {
      link.crossOrigin = 'anonymous';
    }

    document.head.appendChild(link);
  }
}

// Performance monitoring for resources
export class ResourceMonitor {
  // Monitor resource loading performance
  static getResourceTimings(): PerformanceResourceTiming[] {
    if (typeof window === 'undefined' || !window.performance) {
      return [];
    }

    return window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  }

  // Get largest resources
  static getLargestResources(limit: number = 10): Array<{name: string, size: number, duration: number}> {
    const resources = this.getResourceTimings();
    
    return resources
      .map(resource => ({
        name: resource.name,
        size: resource.transferSize || 0,
        duration: resource.duration
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, limit);
  }

  // Get slowest resources
  static getSlowestResources(limit: number = 10): Array<{name: string, size: number, duration: number}> {
    const resources = this.getResourceTimings();
    
    return resources
      .map(resource => ({
        name: resource.name,
        size: resource.transferSize || 0,
        duration: resource.duration
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  // Monitor Core Web Vitals impact of resources
  static analyzeResourceImpact(): {
    totalSize: number;
    totalDuration: number;
    imageCount: number;
    scriptCount: number;
    styleCount: number;
  } {
    const resources = this.getResourceTimings();
    
    let totalSize = 0;
    let totalDuration = 0;
    let imageCount = 0;
    let scriptCount = 0;
    let styleCount = 0;

    resources.forEach(resource => {
      totalSize += resource.transferSize || 0;
      totalDuration += resource.duration;
      
      if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        imageCount++;
      } else if (resource.name.match(/\.(js|mjs)$/i)) {
        scriptCount++;
      } else if (resource.name.match(/\.css$/i)) {
        styleCount++;
      }
    });

    return {
      totalSize,
      totalDuration,
      imageCount,
      scriptCount,
      styleCount
    };
  }
}

// Initialize optimizations
export const initializeResourceOptimization = () => {
  if (typeof window === 'undefined') return;

  // Preconnect to common external domains
  ResourcePreloader.preconnect('https://fonts.googleapis.com');
  ResourcePreloader.preconnect('https://fonts.gstatic.com', true);
  ResourcePreloader.preconnect('https://res.cloudinary.com');
  
  // Load critical fonts
  FontOptimizer.loadGoogleFonts(['Inter:400,500,600,700'], 'swap');
  
  // Initialize lazy image loading
  const imageOptimizer = ImageOptimizer.getInstance();
  const lazyImageObserver = imageOptimizer.createLazyImageObserver();
  
  if (lazyImageObserver) {
    // Observe all images with lazy class
    document.querySelectorAll('img.lazy').forEach(img => {
      lazyImageObserver.observe(img);
    });
  }

  // Log resource performance after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const analysis = ResourceMonitor.analyzeResourceImpact();
      logger.log('Resource Analysis:', analysis);
      
      const largestResources = ResourceMonitor.getLargestResources(5);
      if (largestResources.length > 0) {
        logger.log('Largest Resources:', largestResources);
      }
    }, 1000);
  });
};

// Export singleton instances
export const imageOptimizer = ImageOptimizer.getInstance();