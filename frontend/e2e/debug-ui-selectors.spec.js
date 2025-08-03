/**
 * Debug test to identify correct UI selectors
 */

import { test, expect } from '@playwright/test';

test.describe('Debug UI Selectors', () => {
  test('should identify workflow builder UI elements', async ({ page }) => {
    console.log('🔍 Debugging UI selectors...');

    // Go to workflow builder
    await page.goto('http://localhost:3000/workflow-builder.html');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-ui-elements.png', fullPage: true });

    // List all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons:`);
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const visible = await buttons[i].isVisible();
      if (visible && text && text.trim()) {
        console.log(`  Button ${i}: "${text.trim()}"`);
      }
    }

    // List all data attributes
    const dataElements = await page.locator('[data-*]').all();
    console.log(`Found ${dataElements.length} elements with data attributes:`);
    for (let i = 0; i < Math.min(10, dataElements.length); i++) {
      const attrs = await dataElements[i].evaluate((el) => {
        const attrs = {};
        for (const attr of el.attributes) {
          if (attr.name.startsWith('data-')) {
            attrs[attr.name] = attr.value;
          }
        }
        return attrs;
      });
      console.log(`  Element ${i}:`, attrs);
    }

    // Check for specific elements we expect
    const expectedSelectors = [
      '#drawflow',
      '.node-palette',
      '[data-node-type="input"]',
      'button:has-text("Text Input")',
      '.sources',
      '#configPanel',
    ];

    for (const selector of expectedSelectors) {
      const element = page.locator(selector);
      const exists = (await element.count()) > 0;
      const visible = exists ? await element.first().isVisible() : false;
      console.log(
        `  ${selector}: ${exists ? '✅ exists' : '❌ missing'} ${visible ? '(visible)' : '(hidden)'}`
      );
    }
  });
});
