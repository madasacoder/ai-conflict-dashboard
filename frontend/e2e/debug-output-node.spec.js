/**
 * Debug test for output node creation
 */

import { test, expect } from '@playwright/test';
import WorkflowTestFramework from '../tests/helpers/workflow-automation.js';

test.describe('Debug Output Node', () => {
  let framework;

  test.beforeEach(async ({ page }) => {
    framework = new WorkflowTestFramework(page);
    await framework.initialize();
  });

  test.afterEach(async () => {
    if (framework) {
      framework.destroy();
    }
  });

  test('should create output node', async ({ page }) => {
    console.log('🧪 Testing output node creation...');

    // Take screenshot before
    await page.screenshot({ path: 'test-results/before-output-node.png' });

    // List all elements that contain "Output"
    const outputElements = await page.locator(':has-text("Output")').all();
    console.log(`Found ${outputElements.length} elements containing "Output":`);

    for (let i = 0; i < outputElements.length; i++) {
      const text = await outputElements[i].textContent();
      const tag = await outputElements[i].evaluate((el) => el.tagName);
      const classes = await outputElements[i].evaluate((el) => el.className);
      console.log(`  ${i}: ${tag}.${classes} - "${text?.trim()}"`);
    }

    // Click the output node using data-node-type
    await page.locator('div[data-node-type="output"].node-item').click();

    // Take screenshot after
    await page.screenshot({ path: 'test-results/after-output-node.png' });

    // Verify node was created
    const nodeCount = await page.locator('.drawflow-node').count();
    expect(nodeCount).toBe(1);

    console.log('✅ Output node created successfully');
  });
});
