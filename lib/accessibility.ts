// Accessibility utilities and helpers
import { logger } from './utils';

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private announcements: HTMLElement | null = null;
  private focusHistory: HTMLElement[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeA11y();
    }
  }

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  private initializeA11y(): void {
    // Create live region for announcements
    this.createLiveRegion();
    
    // Add skip links
    this.addSkipLinks();
    
    // Enhance keyboard navigation
    this.enhanceKeyboardNavigation();
    
    // Monitor focus management
    this.monitorFocusManagement();
  }

  private createLiveRegion(): void {
    this.announcements = document.createElement('div');
    this.announcements.setAttribute('aria-live', 'polite');
    this.announcements.setAttribute('aria-atomic', 'true');
    this.announcements.className = 'sr-only';
    this.announcements.id = 'a11y-announcements';
    document.body.appendChild(this.announcements);
  }

  private addSkipLinks(): void {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50 focus:outline-none focus:ring-2 focus:ring-blue-500';
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    });
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  private enhanceKeyboardNavigation(): void {
    // Add keyboard navigation class when tab is used
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    // Remove keyboard navigation class on mouse interaction
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });

    // Escape key handling for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])');
        if (modal) {
          const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"]') as HTMLElement;
          closeButton?.click();
        }
      }
    });
  }

  private monitorFocusManagement(): void {
    // Track focus history for better focus restoration
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (target && target !== document.body) {
        this.focusHistory.push(target);
        // Keep only last 10 focused elements
        if (this.focusHistory.length > 10) {
          this.focusHistory.shift();
        }
      }
    });
  }

  // Public methods
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcements) return;

    this.announcements.setAttribute('aria-live', priority);
    this.announcements.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (this.announcements) {
        this.announcements.textContent = '';
      }
    }, 1000);
  }

  public focusElement(selector: string | HTMLElement): boolean {
    try {
      const element = typeof selector === 'string' 
        ? document.querySelector(selector) as HTMLElement
        : selector;
      
      if (element && typeof element.focus === 'function') {
        element.focus();
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Focus management error:', error);
      return false;
    }
  }

  public restoreFocus(): boolean {
    const lastFocused = this.focusHistory[this.focusHistory.length - 2];
    if (lastFocused && document.contains(lastFocused)) {
      return this.focusElement(lastFocused);
    }
    return false;
  }

  public trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  public checkColorContrast(foreground: string, background: string): {
    ratio: number;
    isAACompliant: boolean;
    isAAACompliant: boolean;
  } {
    // Simple contrast ratio calculation
    const getLuminance = (color: string): number => {
      // This is a simplified version - in production, use a proper color library
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const sRGB = [r, g, b].map(c => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    try {
      const fgLuminance = getLuminance(foreground);
      const bgLuminance = getLuminance(background);
      
      const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                   (Math.min(fgLuminance, bgLuminance) + 0.05);

      return {
        ratio: Math.round(ratio * 100) / 100,
        isAACompliant: ratio >= 4.5,
        isAAACompliant: ratio >= 7
      };
    } catch (error) {
      logger.error('Color contrast calculation error:', error);
      return { ratio: 0, isAACompliant: false, isAAACompliant: false };
    }
  }

  public validateHeadingStructure(): {
    isValid: boolean;
    issues: string[];
  } {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const issues: string[] = [];
    let isValid = true;

    // Check for h1
    const h1Count = headings.filter(h => h.tagName === 'H1').length;
    if (h1Count === 0) {
      issues.push('No H1 heading found');
      isValid = false;
    } else if (h1Count > 1) {
      issues.push('Multiple H1 headings found');
      isValid = false;
    }

    // Check heading hierarchy
    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (index === 0 && level !== 1) {
        issues.push('First heading should be H1');
        isValid = false;
      }
      
      if (level > previousLevel + 1) {
        issues.push(`Heading level skipped: ${heading.tagName} after H${previousLevel}`);
        isValid = false;
      }
      
      previousLevel = level;
    });

    return { isValid, issues };
  }

  public addLandmarkRoles(): void {
    // Add main landmark if not present
    if (!document.querySelector('main')) {
      const mainContent = document.querySelector('#main-content, .main-content, [data-main]');
      if (mainContent) {
        mainContent.setAttribute('role', 'main');
      }
    }

    // Add navigation landmarks
    const navElements = document.querySelectorAll('nav:not([role])');
    navElements.forEach((nav, index) => {
      nav.setAttribute('role', 'navigation');
      if (!nav.getAttribute('aria-label')) {
        nav.setAttribute('aria-label', `Navigation ${index + 1}`);
      }
    });

    // Add complementary landmarks for sidebars
    const sidebars = document.querySelectorAll('aside:not([role])');
    sidebars.forEach((aside) => {
      aside.setAttribute('role', 'complementary');
    });
  }
}

// Export singleton instance
export const a11yManager = AccessibilityManager.getInstance();

// React hooks are available in accessibility.tsx

// Accessibility testing utilities
export const a11yTesting = {
  // Check if element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    return focusableSelectors.some(selector => element.matches(selector));
  },

  // Get all focusable elements in container
  getFocusableElements: (container: HTMLElement = document.body): HTMLElement[] => {
    const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  },

  // Check if element has accessible name
  hasAccessibleName: (element: HTMLElement): boolean => {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent?.trim() ||
      element.getAttribute('title')
    );
  },

  // Run accessibility audit
  auditPage: (): {
    score: number;
    issues: string[];
    recommendations: string[];
  } => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check heading structure
    const headingCheck = a11yManager.validateHeadingStructure();
    if (!headingCheck.isValid) {
      issues.push(...headingCheck.issues);
      score -= 10;
      recommendations.push('Fix heading hierarchy');
    }

    // Check for alt text on images
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} images without alt text`);
      score -= 15;
      recommendations.push('Add alt text to all images');
    }

    // Check for form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    const inputsWithoutLabels = Array.from(inputs).filter(input => {
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledby = input.getAttribute('aria-labelledby');
      return !hasLabel && !hasAriaLabel && !hasAriaLabelledby;
    });
    
    if (inputsWithoutLabels.length > 0) {
      issues.push(`${inputsWithoutLabels.length} form controls without labels`);
      score -= 20;
      recommendations.push('Add labels to all form controls');
    }

    // Check for focus indicators
    const focusableElements = a11yTesting.getFocusableElements();
    const elementsWithoutFocus = focusableElements.filter(el => {
      const styles = getComputedStyle(el, ':focus');
      return styles.outline === 'none' && !styles.boxShadow.includes('inset');
    });
    
    if (elementsWithoutFocus.length > 0) {
      issues.push('Some focusable elements lack visible focus indicators');
      score -= 10;
      recommendations.push('Add visible focus indicators to all interactive elements');
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }
};

// React components are available in accessibility.tsx

export default AccessibilityManager;