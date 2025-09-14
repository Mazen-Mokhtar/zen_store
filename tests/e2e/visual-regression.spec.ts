import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.describe('Skeleton States', () => {
    test('should capture skeleton loading states on home page', async ({ page }) => {
      // Intercept API calls to delay responses and capture skeleton states
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 2000); // Delay API responses
      });
      
      await page.goto('/');
      
      // Wait a moment for skeletons to appear
      await page.waitForTimeout(500);
      
      // Take screenshot of skeleton states
      await expect(page).toHaveScreenshot('home-skeleton-loading.png', {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.2
      });
    });

    test('should capture skeleton states on packages page', async ({ page }) => {
      // Intercept API calls to show skeleton states
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 2000);
      });
      
      await page.goto('/packages');
      
      // Wait for skeleton components to render
      await page.waitForTimeout(500);
      
      // Take screenshot of package skeleton grid
      await expect(page).toHaveScreenshot('packages-skeleton-grid.png', {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.2
      });
    });

    test('should capture skeleton states on dashboard', async ({ page }) => {
      // Intercept API calls
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 2000);
      });
      
      await page.goto('/dashboard');
      
      // Wait for skeleton components
      await page.waitForTimeout(500);
      
      // Take screenshot of dashboard skeleton
      await expect(page).toHaveScreenshot('dashboard-skeleton.png', {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.2
      });
    });

    test('should capture skeleton states on orders page', async ({ page }) => {
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 2000);
      });
      
      await page.goto('/orders');
      
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('orders-skeleton.png', {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.2
      });
    });

    test('should capture individual skeleton components', async ({ page }) => {
      // Create a test page with skeleton components
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Skeleton Components Test</title>
          <style>
            body { font-family: system-ui; padding: 20px; background: #f5f5f5; }
            .skeleton-container { margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
            .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: loading 1.5s infinite; }
            @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
            .skeleton-text { height: 16px; border-radius: 4px; margin: 8px 0; }
            .skeleton-title { height: 24px; border-radius: 4px; margin: 12px 0; }
            .skeleton-circular { width: 48px; height: 48px; border-radius: 50%; }
            .skeleton-card { height: 200px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="skeleton-container">
            <h2>Text Skeletons</h2>
            <div class="skeleton skeleton-title" style="width: 60%;"></div>
            <div class="skeleton skeleton-text" style="width: 100%;"></div>
            <div class="skeleton skeleton-text" style="width: 80%;"></div>
            <div class="skeleton skeleton-text" style="width: 90%;"></div>
          </div>
          
          <div class="skeleton-container">
            <h2>Circular Skeletons</h2>
            <div style="display: flex; gap: 16px; align-items: center;">
              <div class="skeleton skeleton-circular"></div>
              <div style="flex: 1;">
                <div class="skeleton skeleton-text" style="width: 40%;"></div>
                <div class="skeleton skeleton-text" style="width: 60%;"></div>
              </div>
            </div>
          </div>
          
          <div class="skeleton-container">
            <h2>Card Skeletons</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
              <div class="skeleton skeleton-card"></div>
              <div class="skeleton skeleton-card"></div>
              <div class="skeleton skeleton-card"></div>
            </div>
          </div>
        </body>
        </html>
      `);
      
      // Wait for animations to start
      await page.waitForTimeout(500);
      
      // Take screenshot of skeleton components
      await expect(page).toHaveScreenshot('skeleton-components.png', {
        fullPage: true,
        animations: 'allow', // Allow animations for skeleton loading effect
        threshold: 0.3
      });
    });
  });

  test.describe('Above-the-fold Content', () => {
    test('should capture above-the-fold content on home page', async ({ page }) => {
      await page.goto('/');
      
      // Wait for above-the-fold content to load
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of viewport only (above-the-fold)
      await expect(page).toHaveScreenshot('home-above-fold.png', {
        fullPage: false, // Only capture viewport
        animations: 'disabled',
        threshold: 0.1
      });
    });

    test('should capture above-the-fold content on packages page', async ({ page }) => {
      await page.goto('/packages');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('packages-above-fold.png', {
        fullPage: false,
        animations: 'disabled',
        threshold: 0.1
      });
    });

    test('should capture above-the-fold content on dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('dashboard-above-fold.png', {
        fullPage: false,
        animations: 'disabled',
        threshold: 0.1
      });
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      test(`should capture ${viewport.name} layout`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`home-${viewport.name}.png`, {
          fullPage: true,
          animations: 'disabled',
          threshold: 0.1
        });
      });

      test(`should capture ${viewport.name} packages layout`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        await page.goto('/packages');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`packages-${viewport.name}.png`, {
          fullPage: true,
          animations: 'disabled',
          threshold: 0.1
        });
      });
    }
  });

  test.describe('Dark Mode', () => {
    test('should capture dark mode home page', async ({ page }) => {
      // Set dark mode preference
      await page.emulateMedia({ colorScheme: 'dark' });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for dark mode toggle and activate it if available
      const darkModeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="dark"]');
      
      if (await darkModeToggle.count() > 0) {
        await darkModeToggle.click();
        await page.waitForTimeout(500); // Wait for theme transition
      }
      
      await expect(page).toHaveScreenshot('home-dark-mode.png', {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.2
      });
    });

    test('should capture dark mode skeleton states', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      
      // Intercept API calls to show skeleton states
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 2000);
      });
      
      await page.goto('/packages');
      
      // Activate dark mode if toggle exists
      const darkModeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="dark"]');
      
      if (await darkModeToggle.count() > 0) {
        await darkModeToggle.click();
        await page.waitForTimeout(500);
      }
      
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('packages-dark-skeleton.png', {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.2
      });
    });
  });

  test.describe('Error States', () => {
    test('should capture 404 error page', async ({ page }) => {
      await page.goto('/non-existent-page');
      
      // Wait for 404 page to load
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('404-error.png', {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.1
      });
    });

    test('should capture network error states', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => {
        route.abort('failed');
      });
      
      await page.goto('/packages');
      
      // Wait for error state to appear
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('network-error.png', {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.2
      });
    });
  });

  test.describe('Loading States', () => {
    test('should capture initial page load', async ({ page }) => {
      // Slow down network to capture loading states
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 1000);
      });
      
      const responsePromise = page.waitForResponse('**/*');
      await page.goto('/');
      
      // Take screenshot during loading
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('initial-loading.png', {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.3
      });
      
      // Wait for page to fully load
      await responsePromise;
    });

    test('should capture lazy loading states', async ({ page }) => {
      await page.goto('/');
      
      // Scroll to trigger lazy loading
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      
      // Wait for lazy components to start loading
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('lazy-loading.png', {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.2
      });
    });
  });

  test.describe('Focus States', () => {
    test('should capture focus indicators', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Tab through focusable elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Take screenshot with focus indicators
      await expect(page).toHaveScreenshot('focus-indicators.png', {
        fullPage: false,
        animations: 'disabled',
        threshold: 0.1
      });
    });

    test('should capture keyboard navigation states', async ({ page }) => {
      await page.goto('/packages');
      await page.waitForLoadState('networkidle');
      
      // Navigate with keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Activate focused element
      
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('keyboard-navigation.png', {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.2
      });
    });
  });
});