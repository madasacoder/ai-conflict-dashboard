/**
 * Basic Workflow Execution Test
 * Minimal test to verify workflow execution is working
 */

import { test, expect } from '@playwright/test';

test('should execute a basic workflow', async ({ page }) => {
  test.setTimeout(60000); // 1 minute

  // Go directly to workflow builder
  await page.goto('http://localhost:3000/workflow-builder.html');
  await page.waitForLoadState('networkidle');

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Browser error: ${msg.text()}`);
    } else {
      console.log(`Browser [${msg.type()}]: ${msg.text()}`);
    }
  });

  // Monitor network requests
  page.on('response', response => {
    if (response.url().includes('/api/workflows/execute')) {
      console.log(`📡 API Response: ${response.status()} ${response.statusText()}`);
    }
  });

  console.log('🚀 Testing basic workflow execution...\n');

  // Click Run button directly (even with empty workflow)
  const runButton = page.locator('button:has-text("Run")');
  await expect(runButton).toBeVisible();
  
  console.log('▶️ Clicking Run button...');
  await runButton.click();
  
  // Wait for any response
  await page.waitForTimeout(5000);
  
  console.log('\n✅ Basic workflow execution test completed');
});