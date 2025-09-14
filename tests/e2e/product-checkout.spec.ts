import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Product and Checkout Flow', () => {
  test.describe('Product Page', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a product page - adjust URL based on your routing
      await page.goto('/packages');
      
      // Wait for products to load and click on first product
      const firstProduct = page.locator('[data-testid="product-card"], .product-card, .package-card').first();
      
      if (await firstProduct.count() > 0) {
        await firstProduct.click();
      } else {
        // Fallback to direct product URL if available
        await page.goto('/steam/counter-strike-2'); // Adjust based on your routes
      }
    });

    test('should load product page successfully', async ({ page }) => {
      // Check for product title
      const productTitle = page.locator('h1, [data-testid="product-title"]');
      await expect(productTitle).toBeVisible();
      
      // Check for product image
      const productImage = page.locator('img[alt*="product"], img[alt*="game"], .product-image img');
      if (await productImage.count() > 0) {
        await expect(productImage.first()).toBeVisible();
      }
      
      // Check for price information
      const priceElement = page.locator('[data-testid="price"], .price, .cost');
      if (await priceElement.count() > 0) {
        await expect(priceElement.first()).toBeVisible();
      }
    });

    test('should have no accessibility violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper product information structure', async ({ page }) => {
      // Check for proper heading hierarchy
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      
      // Product images should have alt text
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt).not.toBeNull();
      }
      
      // Check for product description
      const description = page.locator('[data-testid="description"], .description, .product-details');
      if (await description.count() > 0) {
        await expect(description.first()).toBeVisible();
      }
    });

    test('should support keyboard navigation for product interactions', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      let tabCount = 0;
      const maxTabs = 10;
      
      while (tabCount < maxTabs) {
        const focusedElement = page.locator(':focus');
        
        if (await focusedElement.count() > 0) {
          await expect(focusedElement).toBeVisible();
          
          // Check if it's a buy/add to cart button
          const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
          const text = await focusedElement.textContent();
          
          if (tagName === 'button' && text && (text.includes('Buy') || text.includes('Add') || text.includes('Purchase'))) {
            // Test button activation with keyboard
            await page.keyboard.press('Enter');
            break;
          }
        }
        
        await page.keyboard.press('Tab');
        tabCount++;
      }
    });

    test('should handle product variants accessibly', async ({ page }) => {
      // Look for product variants (size, color, etc.)
      const variantSelectors = page.locator('select, [role="radiogroup"], [role="listbox"]');
      
      if (await variantSelectors.count() > 0) {
        for (let i = 0; i < await variantSelectors.count(); i++) {
          const selector = variantSelectors.nth(i);
          
          // Should have proper labeling
          const ariaLabel = await selector.getAttribute('aria-label');
          const ariaLabelledBy = await selector.getAttribute('aria-labelledby');
          
          expect(ariaLabel || ariaLabelledBy).toBeTruthy();
          
          // Should be keyboard accessible
          await selector.focus();
          await expect(selector).toBeFocused();
        }
      }
    });

    test('should take visual regression screenshot', async ({ page }) => {
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of the product page
      await expect(page).toHaveScreenshot('product-page.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Checkout Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to packages and add item to cart
      await page.goto('/packages');
      
      // Find and click on a product
      const firstProduct = page.locator('[data-testid="product-card"], .product-card, .package-card').first();
      
      if (await firstProduct.count() > 0) {
        await firstProduct.click();
        
        // Look for buy/add to cart button
        const buyButton = page.locator('button:has-text("Buy"), button:has-text("Add"), button:has-text("Purchase")');
        
        if (await buyButton.count() > 0) {
          await buyButton.first().click();
        }
      }
    });

    test('should handle checkout process accessibly', async ({ page }) => {
      // Look for checkout form or modal
      const checkoutForm = page.locator('form, [data-testid="checkout"], .checkout');
      
      if (await checkoutForm.count() > 0) {
        await expect(checkoutForm.first()).toBeVisible();
        
        // Check for required fields
        const requiredFields = checkoutForm.locator('input[required], select[required], textarea[required]');
        const fieldCount = await requiredFields.count();
        
        for (let i = 0; i < fieldCount; i++) {
          const field = requiredFields.nth(i);
          
          // Each field should have proper labeling
          const fieldId = await field.getAttribute('id');
          const ariaLabel = await field.getAttribute('aria-label');
          
          if (fieldId) {
            const label = page.locator(`label[for="${fieldId}"]`);
            const hasLabel = await label.count() > 0;
            expect(hasLabel || ariaLabel).toBeTruthy();
          } else {
            expect(ariaLabel).toBeTruthy();
          }
        }
      }
    });

    test('should validate payment form accessibly', async ({ page }) => {
      // Look for payment form
      const paymentForm = page.locator('[data-testid="payment"], .payment-form, form');
      
      if (await paymentForm.count() > 0) {
        // Check for payment method selection
        const paymentMethods = paymentForm.locator('input[type="radio"], [role="radiogroup"]');
        
        if (await paymentMethods.count() > 0) {
          // Radio group should have proper labeling
          const radioGroup = paymentForm.locator('[role="radiogroup"]');
          
          if (await radioGroup.count() > 0) {
            const ariaLabel = await radioGroup.getAttribute('aria-label');
            const ariaLabelledBy = await radioGroup.getAttribute('aria-labelledby');
            
            expect(ariaLabel || ariaLabelledBy).toBeTruthy();
          }
        }
        
        // Check for form validation
        const submitButton = paymentForm.locator('button[type="submit"], input[type="submit"]');
        
        if (await submitButton.count() > 0) {
          await submitButton.click();
          
          // Look for validation messages
          const errorMessages = page.locator('[role="alert"], .error, [aria-invalid="true"]');
          
          if (await errorMessages.count() > 0) {
            const firstError = errorMessages.first();
            const role = await firstError.getAttribute('role');
            const ariaLive = await firstError.getAttribute('aria-live');
            
            expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy();
          }
        }
      }
    });

    test('should handle order confirmation accessibly', async ({ page }) => {
      // This test assumes successful checkout flow
      // You may need to mock payment processing
      
      // Look for order confirmation
      const confirmation = page.locator('[data-testid="confirmation"], .order-confirmation, .success');
      
      if (await confirmation.count() > 0) {
        await expect(confirmation.first()).toBeVisible();
        
        // Confirmation should be announced to screen readers
        const role = await confirmation.first().getAttribute('role');
        const ariaLive = await confirmation.first().getAttribute('aria-live');
        
        expect(role === 'status' || role === 'alert' || ariaLive === 'polite').toBeTruthy();
        
        // Should have order details
        const orderNumber = page.locator('[data-testid="order-number"], .order-id');
        
        if (await orderNumber.count() > 0) {
          await expect(orderNumber.first()).toBeVisible();
        }
      }
    });

    test('should support keyboard navigation through checkout', async ({ page }) => {
      // Tab through checkout form elements
      let tabCount = 0;
      const maxTabs = 15;
      
      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        
        const focusedElement = page.locator(':focus');
        
        if (await focusedElement.count() > 0) {
          await expect(focusedElement).toBeVisible();
          
          // Check if it's a form field
          const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
          
          if (['input', 'select', 'textarea', 'button'].includes(tagName)) {
            // Form elements should be properly labeled
            const ariaLabel = await focusedElement.getAttribute('aria-label');
            const id = await focusedElement.getAttribute('id');
            
            if (id) {
              const label = page.locator(`label[for="${id}"]`);
              const hasLabel = await label.count() > 0;
              expect(hasLabel || ariaLabel).toBeTruthy();
            }
          }
        }
        
        tabCount++;
      }
    });

    test('should take visual regression screenshot of checkout', async ({ page }) => {
      // Wait for checkout form to load
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of checkout process
      await expect(page).toHaveScreenshot('checkout-flow.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Shopping Cart', () => {
    test('should handle cart interactions accessibly', async ({ page }) => {
      await page.goto('/packages');
      
      // Look for cart icon or button
      const cartButton = page.locator('[data-testid="cart"], .cart, [aria-label*="cart"]');
      
      if (await cartButton.count() > 0) {
        // Cart should have proper labeling
        const ariaLabel = await cartButton.first().getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        
        // Should be keyboard accessible
        await cartButton.first().focus();
        await expect(cartButton.first()).toBeFocused();
        
        // Click to open cart
        await cartButton.first().click();
        
        // Cart content should be accessible
        const cartContent = page.locator('[role="dialog"], .cart-content, .cart-modal');
        
        if (await cartContent.count() > 0) {
          await expect(cartContent.first()).toBeVisible();
          
          // Should have proper ARIA attributes for modal
          const role = await cartContent.first().getAttribute('role');
          expect(role === 'dialog' || role === 'menu').toBeTruthy();
        }
      }
    });

    test('should handle quantity changes accessibly', async ({ page }) => {
      // This test assumes items are in cart
      const quantityControls = page.locator('[data-testid="quantity"], .quantity-control, input[type="number"]');
      
      if (await quantityControls.count() > 0) {
        const quantityInput = quantityControls.first();
        
        // Should have proper labeling
        const ariaLabel = await quantityInput.getAttribute('aria-label');
        const id = await quantityInput.getAttribute('id');
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          expect(hasLabel || ariaLabel).toBeTruthy();
        } else {
          expect(ariaLabel).toBeTruthy();
        }
        
        // Should support keyboard input
        await quantityInput.focus();
        await expect(quantityInput).toBeFocused();
      }
    });
  });
});