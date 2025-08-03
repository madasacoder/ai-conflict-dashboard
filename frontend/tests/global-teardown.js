/**
 * Global teardown for Playwright tests
 * Runs once after all tests
 */

import { chromium } from '@playwright/test';

async function globalTeardown() {
  console.log('🧹 Starting global teardown for E2E tests...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Clean up any test data
    await page.goto('http://localhost:8080');

    // Clear localStorage and sessionStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Log test completion
    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw - teardown failures shouldn't break the build
  } finally {
    await browser.close();
  }
}

export default globalTeardown;
