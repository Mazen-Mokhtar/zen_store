import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the development server to be ready
    console.log('Waiting for development server...');
    await page.goto(baseURL || 'http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Perform any global setup tasks
    console.log('Development server is ready');
    
    // You can add authentication setup here if needed
    // await page.goto('/signin');
    // await page.fill('[data-testid="email"]', 'test@example.com');
    // await page.fill('[data-testid="password"]', 'password');
    // await page.click('[data-testid="signin-button"]');
    // await page.context().storageState({ path: 'auth-state.json' });
    
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;