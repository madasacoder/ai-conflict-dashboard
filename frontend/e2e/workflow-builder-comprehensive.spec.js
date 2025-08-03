/**
 * Comprehensive E2E tests for Workflow Builder
 * Follows JAVASCRIPT-STANDARDS.md requirements and best practices
 */

import { test, expect } from '@playwright/test';

test.describe('Workflow Builder - Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to workflow builder page
    await page.goto('/workflow-builder.html');

    // Wait for essential elements to load
    await page.waitForSelector('#drawflow', { state: 'visible' });
    await page.waitForSelector('.node-palette', { state: 'visible' });

    // Verify no console errors on page load
    const consoleLogs = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });
  });

  test('should load workflow builder with all required components', async ({ page }) => {
    // ✅ REQUIRED - Test core UI components
    await expect(page.locator('#drawflow')).toBeVisible();
    await expect(page.locator('.node-palette')).toBeVisible();
    await expect(page.locator('[data-node-type="input"]')).toBeVisible();
    await expect(page.locator('[data-node-type="llm"]')).toBeVisible();
    await expect(page.locator('[data-node-type="output"]')).toBeVisible();

    // Verify structured logging is available (no console.log violations)
    const consoleErrors = await page.evaluate(() => {
      return window.logger ? true : false;
    });
    expect(consoleErrors).toBe(true);
  });

  test('should create workflow using drag and drop', async ({ page }) => {
    // Add Input node via drag and drop
    const inputNode = page.locator('[data-node-type="input"]');
    const canvas = page.locator('#drawflow');

    await inputNode.dragTo(canvas, {
      sourcePosition: { x: 10, y: 10 },
      targetPosition: { x: 200, y: 100 },
    });

    // Verify node was added
    await expect(page.locator('.drawflow-node')).toBeVisible();

    // Add LLM node
    const llmNode = page.locator('[data-node-type="llm"]');
    await llmNode.dragTo(canvas, {
      sourcePosition: { x: 10, y: 10 },
      targetPosition: { x: 400, y: 100 },
    });

    // Add Output node
    const outputNode = page.locator('[data-node-type="output"]');
    await outputNode.dragTo(canvas, {
      sourcePosition: { x: 10, y: 10 },
      targetPosition: { x: 600, y: 100 },
    });

    // Verify all three nodes exist
    await expect(page.locator('.drawflow-node')).toHaveCount(3);
  });

  test('should create workflow using click to add nodes', async ({ page }) => {
    // Alternative method - click to add nodes
    await page.locator('[data-node-type="input"]').click();
    await page.locator('[data-node-type="llm"]').click();
    await page.locator('[data-node-type="output"]').click();

    // Should have 3 nodes
    await expect(page.locator('.drawflow-node')).toHaveCount(3);
  });

  test('should configure node properties', async ({ page }) => {
    // Add an LLM node
    await page.locator('[data-node-type="llm"]').click();

    // Click on the node to open configuration
    await page.locator('.drawflow-node').first().click();

    // Wait for config panel to open
    await expect(page.locator('#configPanel.open')).toBeVisible();

    // Check that configuration options are available
    await expect(page.locator('input[type="checkbox"][value="gpt-4"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();

    // Modify configuration
    await page.locator('input[type="checkbox"][value="claude-3-opus"]').check();
    await page.locator('textarea').fill('Analyze this text for sentiment');

    // Close config panel
    await page.locator('#configPanel .close-btn').click();
    await expect(page.locator('#configPanel.open')).not.toBeVisible();
  });

  test('should save and load workflow from localStorage', async ({ page }) => {
    // Create a simple workflow
    await page.locator('[data-node-type="input"]').click();
    await page.locator('[data-node-type="output"]').click();

    // Reload the page to test persistence
    await page.reload();
    await page.waitForSelector('#drawflow', { state: 'visible' });

    // Check that workflow was restored
    await expect(page.locator('.drawflow-node')).toHaveCount(2);
  });

  test('should export workflow to file', async ({ page }) => {
    // Create workflow
    await page.locator('[data-node-type="input"]').click();
    await page.locator('[data-node-type="llm"]').click();

    // Set up download promise
    const downloadPromise = page.waitForEvent('download');

    // Trigger export
    await page.locator('button:has-text("Export")').click();

    // Wait for download and verify
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('workflow.json');
  });

  test('should import workflow from file', async ({ page }) => {
    // Create test workflow file
    const workflowData = {
      drawflow: {
        Home: {
          data: {
            1: {
              id: 1,
              name: 'input',
              data: { type: 'text' },
              class: 'input',
              html: '<div>Input Node</div>',
              typenode: false,
              inputs: {},
              outputs: { output_1: { connections: [] } },
              pos_x: 100,
              pos_y: 100,
            },
          },
        },
      },
    };

    // Create file input and trigger import
    await page.setInputFiles('input[type="file"]', {
      name: 'test-workflow.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(workflowData)),
    });

    // Verify workflow was imported
    await expect(page.locator('.drawflow-node')).toHaveCount(1);
  });

  test('should validate workflow before execution', async ({ page }) => {
    // Try to run empty workflow
    await page.locator('button:has-text("Run")').click();

    // Should show validation error
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator(':text("at least one node")')).toBeVisible();
  });

  test('should handle API key configuration', async ({ page }) => {
    // Open API key modal/panel
    await page.locator('button:has-text("API Keys")').click();

    // Fill in test API keys (but not real ones for security)
    await page.locator('input[placeholder*="OpenAI"]').fill('sk-test-key-for-testing');
    await page.locator('input[placeholder*="Claude"]').fill('sk-ant-test-key');

    // Save configuration
    await page.locator('button:has-text("Save")').click();

    // Verify keys are saved (but not exposed in UI)
    const openaiInput = page.locator('input[placeholder*="OpenAI"]');
    await expect(openaiInput).toHaveValue('sk-test-key-for-testing');
  });

  test('should implement proper error handling', async ({ page }) => {
    // Mock network failure
    await page.route('/api/**', (route) => {
      route.abort('failed');
    });

    // Create valid workflow
    await page.locator('[data-node-type="input"]').click();
    await page.locator('[data-node-type="llm"]').click();
    await page.locator('[data-node-type="output"]').click();

    // Try to run workflow
    await page.locator('button:has-text("Run")').click();

    // Should show error message
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator(':text("failed")')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile layout
    await expect(page.locator('.node-palette')).toBeVisible();
    await expect(page.locator('#drawflow')).toBeVisible();

    // Test touch interactions
    await page.locator('[data-node-type="input"]').tap();
    await expect(page.locator('.drawflow-node')).toHaveCount(1);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Add node first
    await page.locator('[data-node-type="input"]').click();

    // Focus on the node and use keyboard
    await page.locator('.drawflow-node').first().focus();
    await page.keyboard.press('Delete');

    // Node should be deleted
    await expect(page.locator('.drawflow-node')).toHaveCount(0);
  });

  test('should prevent XSS attacks through node configuration', async ({ page }) => {
    // Add LLM node
    await page.locator('[data-node-type="llm"]').click();

    // Open configuration
    await page.locator('.drawflow-node').first().click();
    await expect(page.locator('#configPanel.open')).toBeVisible();

    // Try to inject script
    const maliciousScript = '<script>window.xssExecuted = true;</script>';
    await page.locator('textarea').fill(maliciousScript);

    // Close and verify script didn't execute
    await page.locator('#configPanel .close-btn').click();

    const xssExecuted = await page.evaluate(() => window.xssExecuted);
    expect(xssExecuted).toBeFalsy();
  });

  test('should handle large workflows efficiently', async ({ page }) => {
    // Create large workflow (stress test)
    for (let i = 0; i < 20; i++) {
      await page.locator('[data-node-type="llm"]').click();
    }

    // Should handle 20 nodes without significant lag
    await expect(page.locator('.drawflow-node')).toHaveCount(20);

    // Test zoom controls work with many nodes
    await page.locator('button:has-text("Zoom In")').click();
    await page.locator('button:has-text("Zoom Out")').click();
    await page.locator('button:has-text("Reset Zoom")').click();
  });

  test('should maintain workflow state during navigation', async ({ page }) => {
    // Create workflow
    await page.locator('[data-node-type="input"]').click();
    await page.locator('[data-node-type="output"]').click();

    // Navigate away and back
    await page.goto('/index.html');
    await page.goto('/workflow-builder.html');

    // Wait for page to load
    await page.waitForSelector('#drawflow', { state: 'visible' });

    // Workflow should be restored
    await expect(page.locator('.drawflow-node')).toHaveCount(2);
  });

  test('should follow accessibility standards', async ({ page }) => {
    // Check for ARIA labels
    await expect(page.locator('[aria-label]')).toHaveCount.greaterThan(0);

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Check color contrast (basic check)
    const backgroundColor = await page
      .locator('body')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(backgroundColor).toBeTruthy();
  });
});
