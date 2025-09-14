import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Running global teardown...');
  
  // Clean up any global resources
  // Remove auth state files if they exist
  try {
    const fs = require('fs');
    if (fs.existsSync('auth-state.json')) {
      fs.unlinkSync('auth-state.json');
      console.log('Cleaned up auth state');
    }
  } catch (error) {
    console.warn('Failed to clean up auth state:', error);
  }
  
  console.log('Global teardown completed');
}

export default globalTeardown;