/**
 * E2E test for Ollama model selection in workflow builder
 * Prevents regression of the [object Object] dropdown bug
 */
const { test, expect } = require('@playwright/test');

test.describe('Workflow Builder Ollama Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to workflow builder
    await page.goto('http://localhost:3000/workflow-builder.html');

    // Wait for the workflow builder to initialize
    await page.waitForSelector('#drawflow', { state: 'visible' });
  });

  test('should display Ollama models correctly in dropdown', async ({ page }) => {
    // Click on the LLM node in the palette to add it
    await page.click('[data-node="llm"]');

    // Wait for the node to be added to the canvas
    await page.waitForSelector('.drawflow-node.llm', { state: 'visible' });

    // Find the LLM provider dropdown in the new node
    const llmSelect = await page.locator('.drawflow-node.llm .node-llm-select');

    // Select Ollama from the dropdown
    await llmSelect.selectOption('ollama');

    // Wait for the Ollama model dropdown to appear
    await page.waitForSelector('.ollama-model-select', { state: 'visible' });

    // Wait for models to load (with timeout)
    const ollamaModelSelect = await page.locator('.ollama-model-select select');
    await page.waitForFunction(
      (selector) => {
        const select = document.querySelector(selector);
        return select && select.options.length > 0 && !select.options[0].text.includes('Loading');
      },
      '.ollama-model-select select',
      { timeout: 10000 }
    );

    // Get all options from the Ollama model dropdown
    const options = await ollamaModelSelect.locator('option').all();
    const optionTexts = await Promise.all(options.map((option) => option.textContent()));

    // Verify no [object Object] in any option
    for (const optionText of optionTexts) {
      expect(optionText).not.toContain('[object Object]');
      expect(optionText).not.toContain('object Object');
    }

    // Verify at least one model is shown with proper formatting
    if (optionTexts.length > 0 && !optionTexts[0].includes('Error')) {
      // Should have format like "model-name (size GB)"
      expect(optionTexts[0]).toMatch(/^[\w\-\.:]+\s+\(\d+\.\d+\s+GB\)$/);
    }
  });

  test('should handle Ollama service not running', async ({ page }) => {
    // Mock Ollama service being down
    await page.route('**/api/ollama/models', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          available: false,
          models: [],
          error: 'Ollama service not running',
        }),
      });
    });

    // Add LLM node
    await page.click('[data-node="llm"]');
    await page.waitForSelector('.drawflow-node.llm', { state: 'visible' });

    // Select Ollama
    const llmSelect = await page.locator('.drawflow-node.llm .node-llm-select');
    await llmSelect.selectOption('ollama');

    // Wait for the model dropdown
    await page.waitForSelector('.ollama-model-select', { state: 'visible' });

    // Check error message
    const ollamaModelSelect = await page.locator('.ollama-model-select select');
    const firstOption = await ollamaModelSelect.locator('option').first();
    const optionText = await firstOption.textContent();

    expect(optionText).toMatch(/No Ollama models found|Error loading models/);
    expect(optionText).not.toContain('[object Object]');
  });

  test('should remember selected Ollama model when exporting/importing workflow', async ({
    page,
  }) => {
    // Add LLM node and select Ollama
    await page.click('[data-node="llm"]');
    await page.waitForSelector('.drawflow-node.llm', { state: 'visible' });

    const llmSelect = await page.locator('.drawflow-node.llm .node-llm-select');
    await llmSelect.selectOption('ollama');

    // Wait for models to load
    await page.waitForSelector('.ollama-model-select', { state: 'visible' });
    await page.waitForTimeout(1000); // Allow time for models to load

    // Select a specific model if available
    const ollamaModelSelect = await page.locator('.ollama-model-select select');
    const options = await ollamaModelSelect.locator('option').all();

    if (options.length > 0) {
      const firstOptionValue = await options[0].getAttribute('value');

      // Verify the value is not [object Object]
      expect(firstOptionValue).not.toBe('[object Object]');
      expect(firstOptionValue).not.toContain('object Object');

      // Export workflow
      await page.click('button:has-text("Export")');

      // TODO: Add import and verification logic when import is implemented
    }
  });
});

// Test configuration for running against local dev server
test.use({
  baseURL: 'http://localhost:3000',

  // Extend timeout for Ollama model loading
  actionTimeout: 15000,

  // Video recording for debugging
  video: 'retain-on-failure',

  // Screenshot on failure
  screenshot: 'only-on-failure',
});
