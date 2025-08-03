import { test, expect } from '@playwright/test';

/**
 * Playwright test to capture the REAL browser errors the user is experiencing
 * This replaces my previous failed attempts to debug browser-specific issues
 */

test.describe('Real Browser Error Detection', () => {
  let consoleMessages = [];
  let pageErrors = [];
  let networkFailures = [];

  test.beforeEach(async ({ page }) => {
    // Clear error arrays
    consoleMessages = [];
    pageErrors = [];
    networkFailures = [];

    // Capture ALL console messages (log, error, warn, etc.)
    page.on('console', (msg) => {
      const entry = {
        type: msg.type(),
        text: msg.text(),
        url: page.url(),
        timestamp: new Date().toISOString(),
      };
      consoleMessages.push(entry);
      console.log(`🔍 Browser Console [${msg.type().toUpperCase()}]: ${msg.text()}`);
    });

    // Capture uncaught JavaScript exceptions
    page.on('pageerror', (exception) => {
      const error = {
        message: exception.message,
        stack: exception.stack,
        url: page.url(),
        timestamp: new Date().toISOString(),
      };
      pageErrors.push(error);
      console.error(`❌ Uncaught Exception: ${exception.message}`);
      console.error(`📍 Stack: ${exception.stack}`);
    });

    // Capture failed network requests
    page.on('requestfailed', (request) => {
      const failure = {
        url: request.url(),
        method: request.method(),
        error: request.failure()?.errorText || 'Unknown error',
        timestamp: new Date().toISOString(),
      };
      networkFailures.push(failure);
      console.log(`🌐 Request Failed: ${request.method()} ${request.url()} - ${failure.error}`);
    });
  });

  test('Reproduce Ollama TypeError - Real Browser Test', async ({ page }) => {
    console.log('\n🧪 Testing Ollama Integration for TypeError...');

    // Navigate to main page where Ollama integration lives
    await page.goto('http://localhost:3000/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Look for Ollama-related elements
    const ollamaStatusBadge = page.locator('#ollamaStatusBadge');
    const ollamaModelDisplay = page.locator('#ollamaModelDisplay');

    // Check if elements exist
    if ((await ollamaStatusBadge.count()) > 0) {
      console.log('✅ Found Ollama status badge element');
      const statusText = await ollamaStatusBadge.textContent();
      console.log(`📊 Ollama Status: "${statusText}"`);
    } else {
      console.log('❌ Ollama status badge element NOT found');
    }

    if ((await ollamaModelDisplay.count()) > 0) {
      console.log('✅ Found Ollama model display element');
    } else {
      console.log('❌ Ollama model display element NOT found');
    }

    // Try to trigger Ollama loading (look for reload button or similar)
    const reloadButton = page.locator('button:has-text("reload"), button:has-text("refresh")');
    if ((await reloadButton.count()) > 0) {
      console.log('🔄 Found reload button, clicking to trigger Ollama load...');
      await reloadButton.click();
      await page.waitForTimeout(3000); // Wait for any async operations
    }

    // Wait a bit more for any async operations to complete
    await page.waitForTimeout(2000);

    // Check if there are any TypeError messages in console or on page
    const hasTypeError = consoleMessages.some(
      (msg) =>
        msg.text.toLowerCase().includes('typeerror') ||
        msg.text.toLowerCase().includes('type error')
    );

    const hasPageTypeError = pageErrors.some((error) =>
      error.message.toLowerCase().includes('typeerror')
    );

    if (hasTypeError || hasPageTypeError) {
      console.log('🎯 FOUND THE TYPEERROR! Details above in console output');
    } else {
      console.log('🤔 No TypeError found in this session - may be intermittent');
    }

    // Log summary
    console.log(`\n📋 Ollama Test Summary:`);
    console.log(`   Console Messages: ${consoleMessages.length}`);
    console.log(`   Page Errors: ${pageErrors.length}`);
    console.log(`   Network Failures: ${networkFailures.length}`);
  });

  test('Reproduce Workflow Builder Empty Page Error', async ({ page }) => {
    console.log('\n🧪 Testing Workflow Builder for Empty Page Error...');

    // Navigate to workflow builder page
    await page.goto('http://localhost:3000/workflow-builder.html');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if the page is actually empty or has error content
    const bodyContent = await page.locator('body').textContent();
    const hasDrawflowContainer = (await page.locator('#drawflow').count()) > 0;
    const hasErrorMessage = bodyContent.toLowerCase().includes('error');

    console.log(`📄 Page has content: ${bodyContent.length > 100}`);
    console.log(`🎨 Drawflow container exists: ${hasDrawflowContainer}`);
    console.log(`❌ Contains error text: ${hasErrorMessage}`);

    if (bodyContent.length < 100) {
      console.log('🚨 CONFIRMED: Page appears empty or minimal content');
    }

    if (hasErrorMessage) {
      console.log('🎯 CONFIRMED: Page contains error message');
      console.log(`📝 Content preview: ${bodyContent.substring(0, 200)}...`);
    }

    // Check if Drawflow library loaded
    const drawflowExists = await page.evaluate(() => {
      return typeof window.Drawflow !== 'undefined';
    });

    console.log(`📚 Drawflow library loaded: ${drawflowExists}`);

    // Check if WorkflowBuilder object exists
    const workflowBuilderExists = await page.evaluate(() => {
      return typeof window.workflowBuilder !== 'undefined';
    });

    console.log(`🛠️ WorkflowBuilder object exists: ${workflowBuilderExists}`);

    // Wait a bit more for any lazy loading
    await page.waitForTimeout(3000);

    // Log summary
    console.log(`\n📋 Workflow Builder Test Summary:`);
    console.log(`   Console Messages: ${consoleMessages.length}`);
    console.log(`   Page Errors: ${pageErrors.length}`);
    console.log(`   Network Failures: ${networkFailures.length}`);
    console.log(`   Page Empty: ${bodyContent.length < 100}`);
    console.log(`   Has Error Text: ${hasErrorMessage}`);
  });

  test.afterEach(async () => {
    // Print comprehensive error report
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE ERROR REPORT');
    console.log('='.repeat(60));

    if (consoleMessages.length > 0) {
      console.log(`\n🔍 Console Messages (${consoleMessages.length}):`);
      consoleMessages.forEach((msg, i) => {
        console.log(`  ${i + 1}. [${msg.type}] ${msg.text}`);
      });
    }

    if (pageErrors.length > 0) {
      console.log(`\n❌ Page Errors (${pageErrors.length}):`);
      pageErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.message}`);
        if (error.stack) {
          console.log(`     Stack: ${error.stack.split('\n')[1] || error.stack}`);
        }
      });
    }

    if (networkFailures.length > 0) {
      console.log(`\n🌐 Network Failures (${networkFailures.length}):`);
      networkFailures.forEach((failure, i) => {
        console.log(`  ${i + 1}. ${failure.method} ${failure.url} - ${failure.error}`);
      });
    }

    if (consoleMessages.length === 0 && pageErrors.length === 0 && networkFailures.length === 0) {
      console.log('\n✅ No errors detected in this test run');
    }

    console.log('='.repeat(60) + '\n');
  });
});
