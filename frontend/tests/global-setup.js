/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */

import { chromium } from '@playwright/test';

async function globalSetup() {
  console.log('🚀 Starting global setup for E2E tests...');

  // Start browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for backend to be available
    console.log('⏳ Waiting for backend to be ready...');
    await page.goto('http://localhost:8000/health', { timeout: 30000 });

    // Wait for frontend to be ready
    console.log('⏳ Waiting for frontend to be ready...');
    await page.goto('http://localhost:8080', { timeout: 30000 });

    // Clear any existing localStorage/sessionStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
