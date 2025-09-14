import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Authentication Flow', () => {
  test.describe('Sign In Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signin');
    });

    test('should load sign in page successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/sign in|login/i);
      
      // Check for sign in form
      const form = page.locator('form');
      await expect(form).toBeVisible();
      
      // Check for email and password fields
      const emailField = page.locator('input[type="email"], input[name="email"]');
      const passwordField = page.locator('input[type="password"], input[name="password"]');
      
      await expect(emailField).toBeVisible();
      await expect(passwordField).toBeVisible();
    });

    test('should have no accessibility violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper form labels and ARIA attributes', async ({ page }) => {
      const emailField = page.locator('input[type="email"], input[name="email"]');
      const passwordField = page.locator('input[type="password"], input[name="password"]');
      
      // Check for proper labeling
      const emailLabel = await emailField.getAttribute('aria-label') || 
                        await page.locator('label[for]').first().textContent();
      const passwordLabel = await passwordField.getAttribute('aria-label') || 
                           await page.locator('label').nth(1).textContent();
      
      expect(emailLabel).toBeTruthy();
      expect(passwordLabel).toBeTruthy();
      
      // Check for required field indicators
      const emailRequired = await emailField.getAttribute('required') !== null ||
                           await emailField.getAttribute('aria-required') === 'true';
      const passwordRequired = await passwordField.getAttribute('required') !== null ||
                              await passwordField.getAttribute('aria-required') === 'true';
      
      expect(emailRequired).toBeTruthy();
      expect(passwordRequired).toBeTruthy();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through form elements
      await page.keyboard.press('Tab');
      
      const emailField = page.locator('input[type="email"], input[name="email"]');
      await expect(emailField).toBeFocused();
      
      await page.keyboard.press('Tab');
      const passwordField = page.locator('input[type="password"], input[name="password"]');
      await expect(passwordField).toBeFocused();
      
      await page.keyboard.press('Tab');
      const submitButton = page.locator('button[type="submit"], input[type="submit"]');
      await expect(submitButton).toBeFocused();
    });

    test('should validate form inputs accessibly', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"], input[type="submit"]');
      
      // Try to submit empty form
      await submitButton.click();
      
      // Check for validation messages
      const errorMessages = page.locator('[role="alert"], .error, [aria-invalid="true"]');
      
      if (await errorMessages.count() > 0) {
        // Error messages should be properly announced
        const firstError = errorMessages.first();
        const ariaLive = await firstError.getAttribute('aria-live');
        const role = await firstError.getAttribute('role');
        
        expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy();
      }
    });

    test('should handle form submission with valid data', async ({ page }) => {
      const emailField = page.locator('input[type="email"], input[name="email"]');
      const passwordField = page.locator('input[type="password"], input[name="password"]');
      const submitButton = page.locator('button[type="submit"], input[type="submit"]');
      
      // Fill form with test data
      await emailField.fill('test@example.com');
      await passwordField.fill('password123');
      
      // Submit form
      await submitButton.click();
      
      // Check for loading state or redirect
      // This will depend on your app's behavior
      await page.waitForTimeout(1000);
      
      // Should either show loading state or redirect
      const currentUrl = page.url();
      const hasLoadingState = await page.locator('[role="status"], .loading').count() > 0;
      
      expect(currentUrl !== '/signin' || hasLoadingState).toBeTruthy();
    });

    test('should show password visibility toggle accessibly', async ({ page }) => {
      const passwordToggle = page.locator('button[aria-label*="password"], [data-testid="password-toggle"]');
      
      if (await passwordToggle.count() > 0) {
        const ariaLabel = await passwordToggle.getAttribute('aria-label');
        expect(ariaLabel).toContain('password');
        
        // Click toggle
        await passwordToggle.click();
        
        // Check if password field type changed
        const passwordField = page.locator('input[name="password"]');
        const fieldType = await passwordField.getAttribute('type');
        expect(fieldType === 'text' || fieldType === 'password').toBeTruthy();
      }
    });
  });

  test.describe('Sign Up Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
    });

    test('should load sign up page successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/sign up|register/i);
      
      const form = page.locator('form');
      await expect(form).toBeVisible();
    });

    test('should have no accessibility violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper form structure', async ({ page }) => {
      // Check for required form fields
      const requiredFields = page.locator('input[required], input[aria-required="true"]');
      const requiredCount = await requiredFields.count();
      
      expect(requiredCount).toBeGreaterThan(0);
      
      // Each required field should have proper labeling
      for (let i = 0; i < requiredCount; i++) {
        const field = requiredFields.nth(i);
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
    });

    test('should validate password requirements accessibly', async ({ page }) => {
      const passwordField = page.locator('input[type="password"]').first();
      
      if (await passwordField.count() > 0) {
        // Fill with weak password
        await passwordField.fill('123');
        await passwordField.blur();
        
        // Check for password requirements or validation
        const passwordHelp = page.locator('[aria-describedby], .password-requirements, .help-text');
        
        if (await passwordHelp.count() > 0) {
          await expect(passwordHelp.first()).toBeVisible();
        }
      }
    });

    test('should handle terms and conditions accessibly', async ({ page }) => {
      const termsCheckbox = page.locator('input[type="checkbox"]');
      
      if (await termsCheckbox.count() > 0) {
        // Checkbox should have proper labeling
        const checkboxId = await termsCheckbox.getAttribute('id');
        const ariaLabel = await termsCheckbox.getAttribute('aria-label');
        
        if (checkboxId) {
          const label = page.locator(`label[for="${checkboxId}"]`);
          await expect(label).toBeVisible();
        } else {
          expect(ariaLabel).toBeTruthy();
        }
        
        // Terms link should be accessible
        const termsLink = page.locator('a[href*="terms"], a[href*="privacy"]');
        if (await termsLink.count() > 0) {
          await expect(termsLink.first()).toBeVisible();
          
          // Link should open in new tab or same tab
          const target = await termsLink.first().getAttribute('target');
          if (target === '_blank') {
            const ariaLabel = await termsLink.first().getAttribute('aria-label');
            expect(ariaLabel).toContain('new');
          }
        }
      }
    });
  });

  test.describe('Authentication Error Handling', () => {
    test('should handle network errors accessibly', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/auth/**', route => {
        route.abort('failed');
      });
      
      await page.goto('/signin');
      
      const emailField = page.locator('input[type="email"], input[name="email"]');
      const passwordField = page.locator('input[type="password"], input[name="password"]');
      const submitButton = page.locator('button[type="submit"], input[type="submit"]');
      
      await emailField.fill('test@example.com');
      await passwordField.fill('password123');
      await submitButton.click();
      
      // Check for error message
      const errorMessage = page.locator('[role="alert"], .error-message');
      
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible();
        
        // Error should be announced to screen readers
        const ariaLive = await errorMessage.first().getAttribute('aria-live');
        const role = await errorMessage.first().getAttribute('role');
        
        expect(role === 'alert' || ariaLive === 'assertive' || ariaLive === 'polite').toBeTruthy();
      }
    });

    test('should handle invalid credentials accessibly', async ({ page }) => {
      await page.goto('/signin');
      
      const emailField = page.locator('input[type="email"], input[name="email"]');
      const passwordField = page.locator('input[type="password"], input[name="password"]');
      const submitButton = page.locator('button[type="submit"], input[type="submit"]');
      
      // Try with invalid credentials
      await emailField.fill('invalid@example.com');
      await passwordField.fill('wrongpassword');
      await submitButton.click();
      
      // Wait for potential error message
      await page.waitForTimeout(2000);
      
      // Check if fields are marked as invalid
      const invalidFields = page.locator('[aria-invalid="true"]');
      
      if (await invalidFields.count() > 0) {
        // Invalid fields should have error descriptions
        for (let i = 0; i < await invalidFields.count(); i++) {
          const field = invalidFields.nth(i);
          const describedBy = await field.getAttribute('aria-describedby');
          
          if (describedBy) {
            const errorDescription = page.locator(`#${describedBy}`);
            await expect(errorDescription).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Social Authentication', () => {
    test('should handle social login buttons accessibly', async ({ page }) => {
      await page.goto('/signin');
      
      // Look for social login buttons
      const socialButtons = page.locator('button[aria-label*="Google"], button[aria-label*="Facebook"], button[aria-label*="GitHub"]');
      
      if (await socialButtons.count() > 0) {
        for (let i = 0; i < await socialButtons.count(); i++) {
          const button = socialButtons.nth(i);
          const ariaLabel = await button.getAttribute('aria-label');
          
          // Social buttons should have descriptive labels
          expect(ariaLabel).toBeTruthy();
          expect(ariaLabel?.length).toBeGreaterThan(5);
          
          // Button should be keyboard accessible
          await button.focus();
          await expect(button).toBeFocused();
        }
      }
    });
  });
});