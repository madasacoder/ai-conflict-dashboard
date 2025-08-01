/**
 * End-to-end tests for basic application flow
 */

import { test, expect } from '@playwright/test';

test.describe('Basic Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/AI Conflict Dashboard/);
    
    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('AI Conflict Dashboard');
    
    // Check key elements are visible
    await expect(page.locator('#inputText')).toBeVisible();
    await expect(page.locator('button:has-text("Analyze")')).toBeVisible();
  });

  test('should show/hide API settings', async ({ page }) => {
    const settingsSection = page.locator('#apiSettingsCollapse');
    const toggleButton = page.locator('[data-bs-target="#apiSettingsCollapse"]');
    
    // Initially might be collapsed or expanded based on localStorage
    const isInitiallyVisible = await settingsSection.isVisible();
    
    // Click to toggle
    await toggleButton.click();
    await page.waitForTimeout(500); // Wait for animation
    
    // Should be in opposite state
    if (isInitiallyVisible) {
      await expect(settingsSection).not.toBeVisible();
    } else {
      await expect(settingsSection).toBeVisible();
    }
    
    // Toggle back
    await toggleButton.click();
    await page.waitForTimeout(500);
    
    if (isInitiallyVisible) {
      await expect(settingsSection).toBeVisible();
    } else {
      await expect(settingsSection).not.toBeVisible();
    }
  });

  test('should show model selection section', async ({ page }) => {
    // Model selection should always be visible
    const modelSection = page.locator('text=Model Selection').first();
    await expect(modelSection).toBeVisible();
    
    // Check all provider cards
    await expect(page.locator('text=OpenAI')).toBeVisible();
    await expect(page.locator('text=Anthropic Claude')).toBeVisible();
    await expect(page.locator('text=Google Gemini')).toBeVisible();
    await expect(page.locator('text=xAI Grok')).toBeVisible();
    
    // Check dropdowns
    await expect(page.locator('#openaiModelDisplay')).toBeVisible();
    await expect(page.locator('#claudeModelDisplay')).toBeVisible();
    await expect(page.locator('#geminiModelDisplay')).toBeVisible();
    await expect(page.locator('#grokModelDisplay')).toBeVisible();
  });

  test('should update character and token counts', async ({ page }) => {
    const inputText = page.locator('#inputText');
    const charCount = page.locator('#charCount');
    const tokenCount = page.locator('#tokenCount');
    
    // Initially should be 0
    await expect(charCount).toHaveText('0');
    await expect(tokenCount).toHaveText('0');
    
    // Type some text
    await inputText.fill('Hello, this is a test message!');
    
    // Check counts updated
    await expect(charCount).toHaveText('30'); // Length of the text
    await expect(tokenCount).toHaveText('8'); // Math.ceil(30/4)
  });

  test('should show token warning for large text', async ({ page }) => {
    const inputText = page.locator('#inputText');
    const tokenWarning = page.locator('#tokenWarning');
    
    // Initially hidden
    await expect(tokenWarning).not.toBeVisible();
    
    // Add large text (>3000 tokens = >12000 chars)
    const largeText = 'x'.repeat(13000);
    await inputText.fill(largeText);
    
    // Warning should appear
    await expect(tokenWarning).toBeVisible();
    await expect(tokenWarning).toContainText('May exceed GPT-3.5 limit');
  });

  test('should handle file upload', async ({ page }) => {
    // Create a test file
    const fileContent = 'This is test file content';
    const fileName = 'test.txt';
    
    // Upload file
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent)
    });
    
    // Check file badge appears
    await expect(page.locator('.badge:has-text("test.txt")')).toBeVisible();
    
    // Check content in textarea
    const inputText = page.locator('#inputText');
    const content = await inputText.inputValue();
    expect(content).toContain(`--- File: ${fileName} ---`);
    expect(content).toContain(fileContent);
  });

  test('should handle multiple file uploads', async ({ page }) => {
    const files = [
      { name: 'file1.txt', content: 'Content of file 1' },
      { name: 'file2.md', content: '# Markdown file\nContent of file 2' },
      { name: 'file3.js', content: 'const x = 42;' }
    ];
    
    // Upload multiple files
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles(files.map(f => ({
      name: f.name,
      mimeType: 'text/plain',
      buffer: Buffer.from(f.content)
    })));
    
    // Check all file badges appear
    for (const file of files) {
      await expect(page.locator(`.badge:has-text("${file.name}")`)).toBeVisible();
    }
    
    // Check content in textarea
    const inputText = page.locator('#inputText');
    const content = await inputText.inputValue();
    
    for (const file of files) {
      expect(content).toContain(`--- File: ${file.name} ---`);
      expect(content).toContain(file.content);
    }
  });

  test('should validate input before analysis', async ({ page }) => {
    const analyzeButton = page.locator('button:has-text("Analyze")');
    
    // Click analyze without text
    await analyzeButton.click();
    
    // Should show error
    await expect(page.locator('#errorAlert')).toBeVisible();
    await expect(page.locator('#errorMessage')).toContainText('Please enter some text');
  });

  test('should validate API keys', async ({ page }) => {
    const inputText = page.locator('#inputText');
    const analyzeButton = page.locator('button:has-text("Analyze")');
    
    // Add text
    await inputText.fill('Test analysis');
    
    // Click analyze without API keys
    await analyzeButton.click();
    
    // Should show error about API keys
    await expect(page.locator('#errorAlert')).toBeVisible();
    await expect(page.locator('#errorMessage')).toContainText('Please provide at least one API key');
  });

  test('should toggle dark mode', async ({ page }) => {
    const darkModeButton = page.locator('button[onclick="toggleDarkMode()"]');
    const html = page.locator('html');
    
    // Get initial theme
    const initialTheme = await html.getAttribute('data-theme');
    
    // Toggle dark mode
    await darkModeButton.click();
    
    // Check theme changed
    const newTheme = await html.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
    
    // Toggle back
    await darkModeButton.click();
    
    // Should be back to original
    const finalTheme = await html.getAttribute('data-theme');
    expect(finalTheme).toBe(initialTheme);
  });

  test('should persist settings in localStorage', async ({ page }) => {
    // Expand settings if needed
    const settingsSection = page.locator('#apiSettingsCollapse');
    if (!(await settingsSection.isVisible())) {
      await page.locator('[data-bs-target="#apiSettingsCollapse"]').click();
      await page.waitForTimeout(500);
    }
    
    // Set API key
    const openaiKeyInput = page.locator('#openaiKey');
    await openaiKeyInput.fill('test-api-key');
    
    // Change model selection
    const openaiModelSelect = page.locator('#openaiModel');
    await openaiModelSelect.selectOption('gpt-4');
    
    // Reload page
    await page.reload();
    
    // Expand settings again if needed
    if (!(await settingsSection.isVisible())) {
      await page.locator('[data-bs-target="#apiSettingsCollapse"]').click();
      await page.waitForTimeout(500);
    }
    
    // Check values persisted
    await expect(openaiKeyInput).toHaveValue('test-api-key');
    await expect(openaiModelSelect).toHaveValue('gpt-4');
  });

  test('should sync model selections', async ({ page }) => {
    // Expand settings if needed
    const settingsSection = page.locator('#apiSettingsCollapse');
    if (!(await settingsSection.isVisible())) {
      await page.locator('[data-bs-target="#apiSettingsCollapse"]').click();
      await page.waitForTimeout(500);
    }
    
    // Change model in settings
    const settingsDropdown = page.locator('#claudeModel');
    await settingsDropdown.selectOption('claude-3-opus-20240229');
    
    // Check display dropdown updated
    const displayDropdown = page.locator('#claudeModelDisplay');
    await expect(displayDropdown).toHaveValue('claude-3-opus-20240229');
    
    // Change in display dropdown
    await displayDropdown.selectOption('claude-3-sonnet-20240229');
    
    // Check settings dropdown updated
    await expect(settingsDropdown).toHaveValue('claude-3-sonnet-20240229');
  });
});