/**
 * End-to-end tests for API integration
 */

import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Mock API responses
    await page.route('**/api/analyze', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Create mock response based on request
      const mockResponses = [];

      if (postData.openai_key) {
        mockResponses.push({
          model: 'openai',
          response: `OpenAI analyzed: "${postData.text}"`,
          error: null,
        });
      }

      if (postData.claude_key) {
        mockResponses.push({
          model: 'claude',
          response: `Claude analyzed: "${postData.text}"`,
          error: null,
        });
      }

      if (postData.gemini_key) {
        mockResponses.push({
          model: 'gemini',
          response: `Gemini analyzed: "${postData.text}"`,
          error: null,
        });
      }

      if (postData.grok_key) {
        mockResponses.push({
          model: 'grok',
          response: `Grok analyzed: "${postData.text}"`,
          error: null,
        });
      }

      await route.fulfill({
        status: 200,
        headers: {
          'X-Request-ID': 'test-request-123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: 'test-request-123',
          original_text: postData.text,
          responses: mockResponses,
          chunked: false,
        }),
      });
    });

    // Mock health check
    await page.route('**/api/health', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ status: 'healthy' }),
      });
    });
  });

  test('should analyze text with single provider', async ({ page }) => {
    // Expand settings
    const settingsSection = page.locator('#apiSettingsCollapse');
    if (!(await settingsSection.isVisible())) {
      await page.locator('[data-bs-target="#apiSettingsCollapse"]').click();
      await page.waitForTimeout(500);
    }

    // Set API key
    await page.locator('#openaiKey').fill('test-openai-key');

    // Enter text
    await page.locator('#inputText').fill('Explain quantum computing');

    // Click analyze
    await page.locator('button:has-text("Analyze")').click();

    // Wait for results
    await expect(page.locator('#resultsSection')).toBeVisible();

    // Check original text displayed
    await expect(page.locator('#originalText')).toContainText('Explain quantum computing');

    // Check OpenAI response
    await expect(page.locator('#openaiResponse')).toContainText(
      'OpenAI analyzed: "Explain quantum computing"'
    );
  });

  test('should analyze with multiple providers', async ({ page }) => {
    // Expand settings
    const settingsSection = page.locator('#apiSettingsCollapse');
    if (!(await settingsSection.isVisible())) {
      await page.locator('[data-bs-target="#apiSettingsCollapse"]').click();
      await page.waitForTimeout(500);
    }

    // Set multiple API keys
    await page.locator('#openaiKey').fill('test-openai-key');
    await page.locator('#claudeKey').fill('test-claude-key');
    await page.locator('#geminiKey').fill('test-gemini-key');
    await page.locator('#grokKey').fill('test-grok-key');

    // Enter text
    await page.locator('#inputText').fill('Compare AI models');

    // Click analyze
    await page.locator('button:has-text("Analyze")').click();

    // Wait for results
    await expect(page.locator('#resultsSection')).toBeVisible();

    // Check all responses (only OpenAI and Claude have dedicated columns)
    await expect(page.locator('#openaiResponse')).toContainText('OpenAI analyzed');
    await expect(page.locator('#claudeResponse')).toContainText('Claude analyzed');

    // Comparison should be visible when both OpenAI and Claude respond
    await expect(page.locator('#comparisonSection')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Override route to return error
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'X-Request-ID': 'error-test' },
        body: JSON.stringify({
          request_id: 'error-test',
          original_text: 'Test error',
          responses: [
            {
              model: 'openai',
              response: '',
              error: 'Rate limit exceeded',
            },
          ],
          chunked: false,
        }),
      });
    });

    // Expand settings and set key
    const settingsSection = page.locator('#apiSettingsCollapse');
    if (!(await settingsSection.isVisible())) {
      await page.locator('[data-bs-target="#apiSettingsCollapse"]').click();
      await page.waitForTimeout(500);
    }

    await page.locator('#openaiKey').fill('test-key');
    await page.locator('#inputText').fill('Test error handling');
    await page.locator('button:has-text("Analyze")').click();

    // Should show error in response
    await expect(page.locator('#openaiResponse')).toContainText('Error: Rate limit exceeded');
  });

  test('should show loading state during analysis', async ({ page }) => {
    // Add delay to route
    await page.route('**/api/analyze', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          request_id: 'test',
          original_text: 'Test',
          responses: [],
          chunked: false,
        }),
      });
    });

    // Set up for analysis
    const settingsSection = page.locator('#apiSettingsCollapse');
    if (!(await settingsSection.isVisible())) {
      await page.locator('[data-bs-target="#apiSettingsCollapse"]').click();
      await page.waitForTimeout(500);
    }

    await page.locator('#openaiKey').fill('test-key');
    await page.locator('#inputText').fill('Test loading');

    const analyzeButton = page.locator('button:has-text("Analyze")');
    const spinner = analyzeButton.locator('.spinner-border');

    // Initially no spinner
    await expect(spinner).not.toBeVisible();

    // Click analyze
    await analyzeButton.click();

    // Spinner should appear
    await expect(spinner).toBeVisible();

    // Button should be disabled
    await expect(analyzeButton).toBeDisabled();

    // Wait for completion
    await expect(spinner).not.toBeVisible({ timeout: 2000 });
    await expect(analyzeButton).not.toBeDisabled();
  });

  test('should handle network errors', async ({ page }) => {
    // Fail the route
    await page.route('**/api/analyze', async (route) => {
      await route.abort('failed');
    });

    // Set up for analysis
    const settingsSection = page.locator('#apiSettingsCollapse');
    if (!(await settingsSection.isVisible())) {
      await page.locator('[data-bs-target="#apiSettingsCollapse"]').click();
      await page.waitForTimeout(500);
    }

    await page.locator('#openaiKey').fill('test-key');
    await page.locator('#inputText').fill('Test network error');
    await page.locator('button:has-text("Analyze")').click();

    // Should show connection error
    await expect(page.locator('#errorAlert')).toBeVisible();
    await expect(page.locator('#errorMessage')).toContainText('Failed to connect to the server');
  });

  test('should save responses to history', async ({ page }) => {
    // Set up and analyze
    const settingsSection = page.locator('#apiSettingsCollapse');
    if (!(await settingsSection.isVisible())) {
      await page.locator('[data-bs-target="#apiSettingsCollapse"]').click();
      await page.waitForTimeout(500);
    }

    await page.locator('#openaiKey').fill('test-key');
    await page.locator('#inputText').fill('Test history saving');
    await page.locator('button:has-text("Analyze")').click();

    // Wait for results
    await expect(page.locator('#resultsSection')).toBeVisible();

    // Check history updated
    const historyList = page.locator('#historyList');
    await expect(historyList).toContainText('Test history saving');
    await expect(historyList).toContainText('1 successful response(s)');
  });

  test('should load from history', async ({ page }) => {
    // First create a history item
    const settingsSection = page.locator('#apiSettingsCollapse');
    if (!(await settingsSection.isVisible())) {
      await page.locator('[data-bs-target="#apiSettingsCollapse"]').click();
      await page.waitForTimeout(500);
    }

    await page.locator('#openaiKey').fill('test-key');
    await page.locator('#inputText').fill('Historical query');
    await page.locator('button:has-text("Analyze")').click();

    await expect(page.locator('#resultsSection')).toBeVisible();

    // Clear input
    await page.locator('#inputText').fill('');

    // Click on history item
    await page.locator('.history-item').first().click();

    // Should load the text
    await expect(page.locator('#inputText')).toHaveValue('Historical query');

    // Results should be displayed
    await expect(page.locator('#originalText')).toContainText('Historical query');
  });

  test('should search history', async ({ page }) => {
    // Create multiple history items
    const settingsSection = page.locator('#apiSettingsCollapse');
    if (!(await settingsSection.isVisible())) {
      await page.locator('[data-bs-target="#apiSettingsCollapse"]').click();
      await page.waitForTimeout(500);
    }

    await page.locator('#openaiKey').fill('test-key');

    // Create first item
    await page.locator('#inputText').fill('First query about Python');
    await page.locator('button:has-text("Analyze")').click();
    await page.waitForTimeout(500);

    // Create second item
    await page.locator('#inputText').fill('Second query about JavaScript');
    await page.locator('button:has-text("Analyze")').click();
    await page.waitForTimeout(500);

    // Search for Python
    await page.locator('#historySearch').fill('Python');
    await page.locator('#historySearch').press('Enter');

    // Should only show Python query
    const historyItems = page.locator('.history-item');
    await expect(historyItems).toHaveCount(1);
    await expect(historyItems.first()).toContainText('Python');
  });
});
