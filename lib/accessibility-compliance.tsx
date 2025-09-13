// Advanced accessibility compliance and ARIA standards implementation

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface AccessibilityConfig {
  enableKeyboardNavigation: boolean;
  enableScreenReaderSupport: boolean;
  enableHighContrast: boolean;
  enableFocusManagement: boolean;
  enableAriaLiveRegions: boolean;
  enableColorBlindnessSupport: boolean;
  enableMotionReduction: boolean;
  announcePageChanges: boolean;
  announceErrors: boolean;
  announceSuccess: boolean;
}

interface AccessibilityState {
  isHighContrast: boolean;
  isReducedMotion: boolean;
  isScreenReaderActive: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme: 'light' | 'dark' | 'high-contrast';
  keyboardNavigation: boolean;
}

interface AriaLiveRegion {
  id: string;
  politeness: 'polite' | 'assertive' | 'off';
  atomic: boolean;
  relevant: string;
}

interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  originalTabIndex?: number;
}

interface AccessibilityAuditResult {
  score: number;
  issues: AccessibilityIssue[];
  recommendations: string[];
  compliance: {
    wcag2AA: boolean;
    wcag2AAA: boolean;
    section508: boolean;
  };
}

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  description: string;
  element?: HTMLElement;
  severity: 'low' | 'medium' | 'high' | 'critical';
  wcagLevel: 'A' | 'AA' | 'AAA';
  fix?: string;
}

// Default accessibility configuration
export const ACCESSIBILITY_CONFIG: AccessibilityConfig = {
  enableKeyboardNavigation: true,
  enableScreenReaderSupport: true,
  enableHighContrast: true,
  enableFocusManagement: true,
  enableAriaLiveRegions: true,
  enableColorBlindnessSupport: true,
  enableMotionReduction: true,
  announcePageChanges: true,
  announceErrors: true,
  announceSuccess: true
};

// Main accessibility compliance class
export class AccessibilityManager {
  private config: AccessibilityConfig;
  private state: AccessibilityState;
  private liveRegions: Map<string, AriaLiveRegion> = new Map();
  private focusHistory: HTMLElement[] = [];
  private keyboardTrapStack: { element: HTMLElement; handler: (e: KeyboardEvent) => void }[] = [];
  private isInitialized = false;
  private observers: {
    mutation?: MutationObserver;
    intersection?: IntersectionObserver;
  } = {};

  constructor(config: AccessibilityConfig = ACCESSIBILITY_CONFIG) {
    this.config = { ...ACCESSIBILITY_CONFIG, ...config };
    this.state = this.initializeState();
  }

  // Initialize accessibility state
  private initializeState(): AccessibilityState {
    if (typeof window === 'undefined') {
      return {
        isHighContrast: false,
        isReducedMotion: false,
        isScreenReaderActive: false,
        fontSize: 'medium',
        colorScheme: 'light',
        keyboardNavigation: false
      };
    }

    return {
      isHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
      isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      isScreenReaderActive: this.detectScreenReader(),
      fontSize: this.getFontSizePreference(),
      colorScheme: this.getColorSchemePreference(),
      keyboardNavigation: false
    };
  }

  // Initialize accessibility features
  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.setupMediaQueryListeners();
    
    if (this.config.enableKeyboardNavigation) {
      this.setupKeyboardNavigation();
    }
    
    if (this.config.enableScreenReaderSupport) {
      this.setupScreenReaderSupport();
    }
    
    if (this.config.enableFocusManagement) {
      this.setupFocusManagement();
    }
    
    if (this.config.enableAriaLiveRegions) {
      this.setupAriaLiveRegions();
    }
    
    if (this.config.enableHighContrast) {
      this.setupHighContrastMode();
    }
    
    if (this.config.enableMotionReduction) {
      this.setupMotionReduction();
    }

    this.setupAccessibilityObservers();
    this.applyAccessibilityStyles();
    
    this.isInitialized = true;
  }

  // Detect screen reader
  private detectScreenReader(): boolean {
    // Check for common screen reader indicators
    const indicators = [
      'speechSynthesis' in window,
      navigator.userAgent.includes('NVDA'),
      navigator.userAgent.includes('JAWS'),
      navigator.userAgent.includes('VoiceOver'),
      navigator.userAgent.includes('TalkBack')
    ];
    
    return indicators.some(Boolean);
  }

  // Get font size preference
  private getFontSizePreference(): AccessibilityState['fontSize'] {
    const stored = localStorage.getItem('accessibility-font-size');
    if (stored && ['small', 'medium', 'large', 'extra-large'].includes(stored)) {
      return stored as AccessibilityState['fontSize'];
    }
    return 'medium';
  }

  // Get color scheme preference
  private getColorSchemePreference(): AccessibilityState['colorScheme'] {
    const stored = localStorage.getItem('accessibility-color-scheme');
    if (stored && ['light', 'dark', 'high-contrast'].includes(stored)) {
      return stored as AccessibilityState['colorScheme'];
    }
    
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  }

  // Setup media query listeners
  private setupMediaQueryListeners(): void {
    // High contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    highContrastQuery.addEventListener('change', (e) => {
      this.state.isHighContrast = e.matches;
      this.applyAccessibilityStyles();
    });

    // Reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', (e) => {
      this.state.isReducedMotion = e.matches;
      this.applyAccessibilityStyles();
    });

    // Color scheme preference
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    colorSchemeQuery.addEventListener('change', (e) => {
      if (this.state.colorScheme !== 'high-contrast') {
        this.state.colorScheme = e.matches ? 'dark' : 'light';
        this.applyAccessibilityStyles();
      }
    });
  }

  // Setup keyboard navigation
  private setupKeyboardNavigation(): void {
    let isTabbing = false;

    // Detect keyboard usage
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        isTabbing = true;
        this.state.keyboardNavigation = true;
        document.body.classList.add('keyboard-navigation');
      }
      
      // Handle escape key for modal/dialog dismissal
      if (e.key === 'Escape') {
        this.handleEscapeKey();
      }
      
      // Handle arrow keys for custom navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowKeyNavigation(e);
      }
    });

    // Detect mouse usage
    document.addEventListener('mousedown', () => {
      if (isTabbing) {
        isTabbing = false;
        this.state.keyboardNavigation = false;
        document.body.classList.remove('keyboard-navigation');
      }
    });

    // Skip links (only on client side to prevent SSR hydration mismatch)
    if (typeof window !== 'undefined') {
      this.createSkipLinks();
    }
  }

  // Create skip links (only after hydration to prevent SSR mismatch)
  private createSkipLinks(): void {
    // Check if skip links already exist to prevent duplicates
    if (document.querySelector('.skip-links')) {
      return;
    }
    
    // Only create skip links after the page is fully loaded to prevent hydration mismatch
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => this.createSkipLinks(), { once: true });
      return;
    }
    
    const skipLinksContainer = document.createElement('div');
    skipLinksContainer.className = 'skip-links';
    skipLinksContainer.setAttribute('aria-label', 'Skip navigation links');
    skipLinksContainer.style.position = 'absolute';
    skipLinksContainer.style.top = '-9999px';
    skipLinksContainer.style.left = '-9999px';
    
    const skipLinks = [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#navigation', text: 'Skip to navigation' },
      { href: '#footer', text: 'Skip to footer' }
    ];
    
    skipLinks.forEach(link => {
      const skipLink = document.createElement('a');
      skipLink.href = link.href;
      skipLink.textContent = link.text;
      skipLink.className = 'skip-link';
      skipLink.style.position = 'absolute';
      skipLink.style.top = '4px';
      skipLink.style.left = '4px';
      skipLink.style.zIndex = '9999';
      skipLink.style.padding = '8px 16px';
      skipLink.style.backgroundColor = '#0066cc';
      skipLink.style.color = 'white';
      skipLink.style.textDecoration = 'none';
      skipLink.style.borderRadius = '4px';
      skipLink.style.transform = 'translateY(-100%)';
      skipLink.style.transition = 'transform 0.2s';
      
      skipLink.addEventListener('focus', () => {
        skipLink.style.transform = 'translateY(0)';
      });
      
      skipLink.addEventListener('blur', () => {
        skipLink.style.transform = 'translateY(-100%)';
      });
      
      skipLinksContainer.appendChild(skipLink);
    });
    
    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
  }

  // Handle escape key
  private handleEscapeKey(): void {
    // Close modals, dialogs, dropdowns, etc.
    const activeModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
    if (activeModal) {
      this.closeModal(activeModal as HTMLElement);
      return;
    }
    
    const activeDropdown = document.querySelector('[aria-expanded="true"]');
    if (activeDropdown) {
      activeDropdown.setAttribute('aria-expanded', 'false');
      (activeDropdown as HTMLElement).focus();
    }
  }

  // Handle arrow key navigation
  private handleArrowKeyNavigation(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    const role = target.getAttribute('role');
    
    // Handle menu navigation
    if (role === 'menuitem' || target.closest('[role="menu"]')) {
      this.handleMenuNavigation(e);
    }
    
    // Handle tab navigation
    if (role === 'tab' || target.closest('[role="tablist"]')) {
      this.handleTabNavigation(e);
    }
    
    // Handle grid navigation
    if (role === 'gridcell' || target.closest('[role="grid"]')) {
      this.handleGridNavigation(e);
    }
  }

  // Handle menu navigation
  private handleMenuNavigation(e: KeyboardEvent): void {
    const menu = (e.target as HTMLElement).closest('[role="menu"]');
    if (!menu) return;
    
    const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
    const currentIndex = menuItems.indexOf(e.target as HTMLElement);
    
    let nextIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % menuItems.length;
        break;
      case 'ArrowUp':
        nextIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = menuItems.length - 1;
        break;
      default:
        return;
    }
    
    e.preventDefault();
    menuItems[nextIndex].focus();
  }

  // Handle tab navigation
  private handleTabNavigation(e: KeyboardEvent): void {
    const tablist = (e.target as HTMLElement).closest('[role="tablist"]');
    if (!tablist) return;
    
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]')) as HTMLElement[];
    const currentIndex = tabs.indexOf(e.target as HTMLElement);
    
    let nextIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    
    e.preventDefault();
    this.activateTab(tabs[nextIndex]);
  }

  // Handle grid navigation
  private handleGridNavigation(e: KeyboardEvent): void {
    const grid = (e.target as HTMLElement).closest('[role="grid"]');
    if (!grid) return;
    
    const rows = Array.from(grid.querySelectorAll('[role="row"]'));
    const currentCell = e.target as HTMLElement;
    const currentRow = currentCell.closest('[role="row"]');
    const currentRowIndex = rows.indexOf(currentRow!);
    const cellsInRow = Array.from(currentRow!.querySelectorAll('[role="gridcell"]')) as HTMLElement[];
    const currentCellIndex = cellsInRow.indexOf(currentCell);
    
    let targetCell: HTMLElement | null = null;
    
    switch (e.key) {
      case 'ArrowRight':
        targetCell = cellsInRow[currentCellIndex + 1] || null;
        break;
      case 'ArrowLeft':
        targetCell = cellsInRow[currentCellIndex - 1] || null;
        break;
      case 'ArrowDown':
        if (currentRowIndex < rows.length - 1) {
          const nextRowCells = Array.from(rows[currentRowIndex + 1].querySelectorAll('[role="gridcell"]')) as HTMLElement[];
          targetCell = nextRowCells[currentCellIndex] || null;
        }
        break;
      case 'ArrowUp':
        if (currentRowIndex > 0) {
          const prevRowCells = Array.from(rows[currentRowIndex - 1].querySelectorAll('[role="gridcell"]')) as HTMLElement[];
          targetCell = prevRowCells[currentCellIndex] || null;
        }
        break;
      default:
        return;
    }
    
    if (targetCell) {
      e.preventDefault();
      targetCell.focus();
    }
  }

  // Activate tab
  private activateTab(tab: HTMLElement): void {
    const tablist = tab.closest('[role="tablist"]');
    if (!tablist) return;
    
    // Deactivate all tabs
    const allTabs = tablist.querySelectorAll('[role="tab"]');
    allTabs.forEach(t => {
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    
    // Activate current tab
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    tab.focus();
    
    // Show corresponding tabpanel
    const tabpanelId = tab.getAttribute('aria-controls');
    if (tabpanelId) {
      const allTabpanels = document.querySelectorAll('[role="tabpanel"]');
      allTabpanels.forEach(panel => {
        panel.setAttribute('aria-hidden', 'true');
      });
      
      const activeTabpanel = document.getElementById(tabpanelId);
      if (activeTabpanel) {
        activeTabpanel.setAttribute('aria-hidden', 'false');
      }
    }
  }

  // Setup screen reader support
  private setupScreenReaderSupport(): void {
    // Add screen reader only text for important visual elements
    this.addScreenReaderText();
    
    // Setup live region announcements
    if (this.config.announcePageChanges) {
      this.announcePageChanges();
    }
  }

  // Add screen reader text
  private addScreenReaderText(): void {
    // Add sr-only class styles if not present
    if (!document.querySelector('style[data-accessibility="sr-only"]')) {
      const style = document.createElement('style');
      style.setAttribute('data-accessibility', 'sr-only');
      style.textContent = `
        .sr-only {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Announce page changes
  private announcePageChanges(): void {
    let currentPath = window.location.pathname;
    
    const checkForNavigation = () => {
      const newPath = window.location.pathname;
      if (newPath !== currentPath) {
        currentPath = newPath;
        const pageTitle = document.title;
        this.announce(`Navigated to ${pageTitle}`, 'polite');
      }
    };
    
    // Listen for navigation events
    window.addEventListener('popstate', checkForNavigation);
    
    // Override pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(checkForNavigation, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setTimeout(checkForNavigation, 0);
    };
  }

  // Setup focus management
  private setupFocusManagement(): void {
    // Track focus history
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      this.focusHistory.push(target);
      
      // Keep only last 10 focused elements
      if (this.focusHistory.length > 10) {
        this.focusHistory = this.focusHistory.slice(-10);
      }
    });
    
    // Ensure focus is visible
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      this.ensureFocusVisible(target);
    });
  }

  // Ensure focus is visible
  private ensureFocusVisible(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const isVisible = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
    
    if (!isVisible) {
      element.scrollIntoView({
        behavior: this.state.isReducedMotion ? 'auto' : 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }

  // Setup ARIA live regions
  private setupAriaLiveRegions(): void {
    // Create default live regions
    this.createLiveRegion('announcements', 'polite', true);
    this.createLiveRegion('alerts', 'assertive', true);
    this.createLiveRegion('status', 'polite', false);
  }

  // Create live region
  createLiveRegion(
    id: string,
    politeness: 'polite' | 'assertive' | 'off' = 'polite',
    atomic: boolean = true
  ): void {
    if (this.liveRegions.has(id)) return;
    
    const region: AriaLiveRegion = {
      id,
      politeness,
      atomic,
      relevant: 'additions text'
    };
    
    this.liveRegions.set(id, region);
    
    // Create DOM element
    const element = document.createElement('div');
    element.id = `live-region-${id}`;
    element.setAttribute('aria-live', politeness);
    element.setAttribute('aria-atomic', atomic.toString());
    element.setAttribute('aria-relevant', region.relevant);
    element.className = 'sr-only';
    
    document.body.appendChild(element);
  }

  // Announce message
  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    const regionId = politeness === 'assertive' ? 'alerts' : 'announcements';
    const element = document.getElementById(`live-region-${regionId}`);
    
    if (element) {
      // Clear previous message
      element.textContent = '';
      
      // Add new message after a brief delay to ensure it's announced
      setTimeout(() => {
        element.textContent = message;
      }, 100);
      
      // Clear message after announcement
      setTimeout(() => {
        element.textContent = '';
      }, 5000);
    }
  }

  // Setup high contrast mode
  private setupHighContrastMode(): void {
    if (this.state.isHighContrast || this.state.colorScheme === 'high-contrast') {
      document.body.classList.add('high-contrast');
    }
  }

  // Setup motion reduction
  private setupMotionReduction(): void {
    if (this.state.isReducedMotion) {
      document.body.classList.add('reduced-motion');
    }
  }

  // Setup accessibility observers
  private setupAccessibilityObservers(): void {
    // Mutation observer for dynamic content
    this.observers.mutation = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.auditElement(node as HTMLElement);
            }
          });
        }
      });
    });
    
    this.observers.mutation.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Intersection observer for lazy-loaded content
    this.observers.intersection = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.auditElement(entry.target as HTMLElement);
        }
      });
    });
  }

  // Apply accessibility styles
  private applyAccessibilityStyles(): void {
    const root = document.documentElement;
    
    // Font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[this.state.fontSize]);
    
    // Color scheme
    root.setAttribute('data-color-scheme', this.state.colorScheme);
    
    // High contrast
    if (this.state.isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (this.state.isReducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }

  // Audit element for accessibility issues
  private auditElement(element: HTMLElement): void {
    // Check for missing alt text on images
    if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
      console.warn('Accessibility: Image missing alt text', element);
    }
    
    // Check for missing labels on form controls
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
      const hasLabel = element.getAttribute('aria-label') ||
                     element.getAttribute('aria-labelledby') ||
                     document.querySelector(`label[for="${element.id}"]`);
      
      if (!hasLabel) {
        console.warn('Accessibility: Form control missing label', element);
      }
    }
    
    // Check for missing headings hierarchy
    if (/^H[1-6]$/.test(element.tagName)) {
      this.checkHeadingHierarchy(element);
    }
  }

  // Check heading hierarchy
  private checkHeadingHierarchy(heading: HTMLElement): void {
    const level = parseInt(heading.tagName.charAt(1));
    const previousHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .filter(h => h !== heading && h.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING);
    
    if (previousHeadings.length > 0) {
      const lastHeading = previousHeadings[previousHeadings.length - 1];
      const lastLevel = parseInt(lastHeading.tagName.charAt(1));
      
      if (level > lastLevel + 1) {
        console.warn(`Accessibility: Heading hierarchy skip from H${lastLevel} to H${level}`, heading);
      }
    }
  }

  // Trap focus within element
  trapFocus(element: HTMLElement): void {
    const focusableElements = this.getFocusableElements(element);
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    element.addEventListener('keydown', handleTabKey);
    this.keyboardTrapStack.push({ element, handler: handleTabKey });
    
    // Focus first element
    firstElement.focus();
  }

  // Release focus trap
  releaseFocusTrap(): void {
    const trapInfo = this.keyboardTrapStack.pop();
    if (trapInfo) {
      trapInfo.element.removeEventListener('keydown', trapInfo.handler);
    }
  }

  // Get focusable elements
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(el => {
        const element = el as HTMLElement;
        return element.offsetWidth > 0 && element.offsetHeight > 0;
      }) as HTMLElement[];
  }

  // Close modal
  private closeModal(modal: HTMLElement): void {
    modal.setAttribute('aria-hidden', 'true');
    
    // Return focus to trigger element
    const triggerId = modal.getAttribute('data-trigger-id');
    if (triggerId) {
      const trigger = document.getElementById(triggerId);
      if (trigger) {
        trigger.focus();
      }
    } else if (this.focusHistory.length > 0) {
      const lastFocused = this.focusHistory[this.focusHistory.length - 2];
      if (lastFocused && document.contains(lastFocused)) {
        lastFocused.focus();
      }
    }
    
    this.releaseFocusTrap();
  }

  // Perform accessibility audit
  performAudit(): AccessibilityAuditResult {
    const issues: AccessibilityIssue[] = [];
    const recommendations: string[] = [];
    
    // Check images
    document.querySelectorAll('img').forEach(img => {
      if (!img.getAttribute('alt')) {
        issues.push({
          type: 'error',
          rule: 'img-alt',
          description: 'Image missing alternative text',
          element: img,
          severity: 'high',
          wcagLevel: 'A',
          fix: 'Add descriptive alt attribute to image'
        });
      }
    });
    
    // Check form labels
    document.querySelectorAll('input, select, textarea').forEach(control => {
      const hasLabel = control.getAttribute('aria-label') ||
                      control.getAttribute('aria-labelledby') ||
                      document.querySelector(`label[for="${control.id}"]`);
      
      if (!hasLabel) {
        issues.push({
          type: 'error',
          rule: 'label',
          description: 'Form control missing label',
          element: control as HTMLElement,
          severity: 'high',
          wcagLevel: 'A',
          fix: 'Add label element or aria-label attribute'
        });
      }
    });
    
    // Check color contrast (simplified)
    document.querySelectorAll('*').forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        // This is a simplified check - in practice, you'd use a proper contrast ratio calculation
        const contrastRatio = this.calculateContrastRatio(color, backgroundColor);
        if (contrastRatio < 4.5) {
          issues.push({
            type: 'warning',
            rule: 'color-contrast',
            description: 'Insufficient color contrast',
            element: element as HTMLElement,
            severity: 'medium',
            wcagLevel: 'AA',
            fix: 'Increase color contrast to at least 4.5:1'
          });
        }
      }
    });
    
    // Generate recommendations
    if (issues.length === 0) {
      recommendations.push('Great! No major accessibility issues found.');
    } else {
      recommendations.push(`Found ${issues.length} accessibility issues that should be addressed.`);
      recommendations.push('Consider implementing ARIA landmarks for better navigation.');
      recommendations.push('Ensure all interactive elements are keyboard accessible.');
      recommendations.push('Test with screen readers for optimal user experience.');
    }
    
    const score = Math.max(0, 100 - (issues.length * 10));
    
    return {
      score,
      issues,
      recommendations,
      compliance: {
        wcag2AA: issues.filter(i => i.wcagLevel === 'AA' && i.type === 'error').length === 0,
        wcag2AAA: issues.filter(i => i.wcagLevel === 'AAA' && i.type === 'error').length === 0,
        section508: issues.filter(i => i.severity === 'high').length === 0
      }
    };
  }

  // Calculate contrast ratio (simplified)
  private calculateContrastRatio(color1: string, color2: string): number {
    // This is a simplified implementation
    // In practice, you'd convert colors to RGB and calculate proper contrast ratio
    return 4.5; // Placeholder
  }

  // Get current state
  getState(): AccessibilityState {
    return { ...this.state };
  }

  // Update font size
  setFontSize(size: AccessibilityState['fontSize']): void {
    this.state.fontSize = size;
    localStorage.setItem('accessibility-font-size', size);
    this.applyAccessibilityStyles();
    this.announce(`Font size changed to ${size}`);
  }

  // Update color scheme
  setColorScheme(scheme: AccessibilityState['colorScheme']): void {
    this.state.colorScheme = scheme;
    localStorage.setItem('accessibility-color-scheme', scheme);
    this.applyAccessibilityStyles();
    this.announce(`Color scheme changed to ${scheme}`);
  }

  // Toggle high contrast
  toggleHighContrast(): void {
    this.state.isHighContrast = !this.state.isHighContrast;
    this.applyAccessibilityStyles();
    this.announce(`High contrast ${this.state.isHighContrast ? 'enabled' : 'disabled'}`);
  }

  // Toggle reduced motion
  toggleReducedMotion(): void {
    this.state.isReducedMotion = !this.state.isReducedMotion;
    this.applyAccessibilityStyles();
    this.announce(`Reduced motion ${this.state.isReducedMotion ? 'enabled' : 'disabled'}`);
  }

  // Cleanup
  cleanup(): void {
    if (this.observers.mutation) {
      this.observers.mutation.disconnect();
    }
    if (this.observers.intersection) {
      this.observers.intersection.disconnect();
    }
  }
}

// Global accessibility manager instance
export const accessibilityManager = new AccessibilityManager();

// React hooks for accessibility
export const useAccessibility = () => {
  const [state, setState] = useState(accessibilityManager.getState());
  
  useEffect(() => {
    const updateState = () => setState(accessibilityManager.getState());
    
    // Listen for state changes (you'd implement this in the manager)
    const interval = setInterval(updateState, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const announce = (message: string, politeness?: 'polite' | 'assertive') => {
    accessibilityManager.announce(message, politeness);
  };
  
  const setFontSize = (size: AccessibilityState['fontSize']) => {
    accessibilityManager.setFontSize(size);
    setState(accessibilityManager.getState());
  };
  
  const setColorScheme = (scheme: AccessibilityState['colorScheme']) => {
    accessibilityManager.setColorScheme(scheme);
    setState(accessibilityManager.getState());
  };
  
  const toggleHighContrast = () => {
    accessibilityManager.toggleHighContrast();
    setState(accessibilityManager.getState());
  };
  
  const toggleReducedMotion = () => {
    accessibilityManager.toggleReducedMotion();
    setState(accessibilityManager.getState());
  };
  
  return {
    state,
    announce,
    setFontSize,
    setColorScheme,
    toggleHighContrast,
    toggleReducedMotion
  };
};

// Focus management hook
export const useFocusManagement = () => {
  const trapFocus = (element: HTMLElement) => {
    accessibilityManager.trapFocus(element);
  };
  
  const releaseFocusTrap = () => {
    accessibilityManager.releaseFocusTrap();
  };
  
  return {
    trapFocus,
    releaseFocusTrap
  };
};

// Accessibility audit hook
export const useAccessibilityAudit = () => {
  const [auditResult, setAuditResult] = useState<AccessibilityAuditResult | null>(null);
  
  const performAudit = useCallback(() => {
    const result = accessibilityManager.performAudit();
    setAuditResult(result);
    return result;
  }, []);
  
  return {
    auditResult,
    performAudit
  };
};

// Initialize accessibility
export const initializeAccessibility = (config?: Partial<AccessibilityConfig>): void => {
  // Only initialize on client side to prevent SSR hydration mismatch
  if (typeof window === 'undefined') {
    return;
  }
  
  if (config) {
    Object.assign(accessibilityManager['config'], config);
  }
  accessibilityManager.initialize();
};

// Accessibility settings component
export const AccessibilitySettings: React.FC = () => {
  const { state, setFontSize, setColorScheme, toggleHighContrast, toggleReducedMotion } = useAccessibility();
  
  return (
    <div className="accessibility-settings" role="region" aria-labelledby="accessibility-heading">
      <h2 id="accessibility-heading">Accessibility Settings</h2>
      
      <div className="setting-group">
        <label htmlFor="font-size-select">Font Size:</label>
        <select
          id="font-size-select"
          value={state.fontSize}
          onChange={(e) => setFontSize(e.target.value as AccessibilityState['fontSize'])}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="extra-large">Extra Large</option>
        </select>
      </div>
      
      <div className="setting-group">
        <label htmlFor="color-scheme-select">Color Scheme:</label>
        <select
          id="color-scheme-select"
          value={state.colorScheme}
          onChange={(e) => setColorScheme(e.target.value as AccessibilityState['colorScheme'])}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="high-contrast">High Contrast</option>
        </select>
      </div>
      
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={state.isHighContrast}
            onChange={toggleHighContrast}
          />
          High Contrast Mode
        </label>
      </div>
      
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={state.isReducedMotion}
            onChange={toggleReducedMotion}
          />
          Reduce Motion
        </label>
      </div>
    </div>
  );
};

// Debug accessibility
export const debugAccessibility = (): void => {
  console.group('Accessibility Debug Info');
  
  const state = accessibilityManager.getState();
  console.log('Current State:', state);
  
  const audit = accessibilityManager.performAudit();
  console.log('Accessibility Audit:', audit);
  
  console.groupEnd();
};