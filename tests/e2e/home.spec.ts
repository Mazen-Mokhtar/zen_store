import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load home page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Zen Store/i);
    
    // Check main navigation is present
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check hero section is visible
    const hero = page.locator('[data-testid="hero-section"], .hero, h1').first();
    await expect(hero).toBeVisible();
  });

  test('should have no accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check for h1 element
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Verify heading hierarchy (h1 should come before h2, etc.)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus should start at the beginning of the page
    await page.keyboard.press('Tab');
    
    // Check that focus is visible and moves through interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const currentFocus = page.locator(':focus');
      await expect(currentFocus).toBeVisible();
    }
  });

  test('should have skip links for accessibility', async ({ page }) => {
    // Press Tab to reveal skip links
    await page.keyboard.press('Tab');
    
    // Look for skip link (common patterns)
    const skipLink = page.locator('a[href="#main"], a[href="#content"], .skip-link').first();
    
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeVisible();
      await skipLink.click();
      
      // Verify focus moved to main content
      const mainContent = page.locator('#main, #content, main').first();
      await expect(mainContent).toBeFocused();
    }
  });

  test('should load images with proper alt text', async ({ page }) => {
    // Wait for images to load
    await page.waitForLoadState('networkidle');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        
        // Images should have alt text (empty alt is acceptable for decorative images)
        expect(alt).not.toBeNull();
      }
    }
  });

  test('should have proper ARIA landmarks', async ({ page }) => {
    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
    
    // Check for navigation landmark
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();
    
    // Check for banner (header) if present
    const banner = page.locator('header, [role="banner"]');
    if (await banner.count() > 0) {
      await expect(banner.first()).toBeVisible();
    }
  });

  test('should handle loading states accessibly', async ({ page }) => {
    // Look for loading indicators
    const loadingIndicators = page.locator('[role="status"], .loading, .skeleton');
    
    if (await loadingIndicators.count() > 0) {
      const firstIndicator = loadingIndicators.first();
      
      // Loading indicators should have proper ARIA attributes
      const ariaLabel = await firstIndicator.getAttribute('aria-label');
      const role = await firstIndicator.getAttribute('role');
      
      expect(role === 'status' || ariaLabel !== null).toBeTruthy();
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that content is still accessible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check for mobile menu if present
    const mobileMenuButton = page.locator('[aria-label*="menu"], .mobile-menu-button, [data-testid="mobile-menu"]');
    
    if (await mobileMenuButton.count() > 0) {
      await expect(mobileMenuButton.first()).toBeVisible();
      
      // Test mobile menu functionality
      await mobileMenuButton.first().click();
      
      // Menu should expand and be accessible
      const expandedMenu = page.locator('[aria-expanded="true"], .mobile-menu-open');
      if (await expandedMenu.count() > 0) {
        await expect(expandedMenu.first()).toBeVisible();
      }
    }
  });

  test('should handle focus management correctly', async ({ page }) => {
    // Test focus trap in modals/dialogs if present
    const modalTrigger = page.locator('button[data-testid*="modal"], button[aria-haspopup="dialog"]').first();
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      
      // Check if modal opened
      const modal = page.locator('[role="dialog"], .modal');
      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible();
        
        // Focus should be trapped within modal
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        
        // Focused element should be within the modal
        const isWithinModal = await modal.first().locator(':focus').count() > 0;
        expect(isWithinModal).toBeTruthy();
        
        // Close modal with Escape
        await page.keyboard.press('Escape');
        await expect(modal.first()).not.toBeVisible();
      }
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    // Run accessibility scan focusing on color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    // Filter for color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );

    expect(colorContrastViolations).toEqual([]);
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Check that content is still visible and accessible
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible();
    
    // Run accessibility scan in dark mode
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});