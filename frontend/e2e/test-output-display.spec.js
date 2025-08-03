/**
 * Test Output Display
 * Tests the new output display functionality without backend
 */

import { test, expect } from '@playwright/test';

test('test output display with mock data', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes

  // Go to workflow builder
  await page.goto('http://localhost:3000/workflow-builder.html');
  await page.waitForLoadState('networkidle');

  console.log('\n🎯 Testing Output Display with Mock Data');
  console.log('═'.repeat(70));

  // Create a simple workflow
  console.log('\n1️⃣ Creating workflow...');

  // Create input node
  await page.locator('div[data-node-type="input"]').click();
  await page.waitForTimeout(500);

  // Create LLM node
  await page.locator('div[data-node-type="llm"]').click();
  await page.waitForTimeout(500);

  // Connect nodes
  await page.evaluate(() => {
    window.workflowBuilder.editor.addConnection(1, 2, 'output_1', 'input_1');
  });

  console.log('✅ Workflow created');

  // Mock the showResults function to test display
  console.log('\n2️⃣ Testing results display...');

  await page.evaluate(() => {
    // Mock results data
    const mockResults = {
      status: 'success',
      results: {
        1: {
          type: 'input',
          status: 'success',
          result: 'Hello, how are you today?',
        },
        2: {
          type: 'llm',
          status: 'success',
          result: {
            ollama: {
              response: '你好，你今天怎么样？\n\n这是中文翻译。',
              error: null,
            },
          },
        },
      },
      node_count: 2,
      execution_time: Date.now(),
    };

    // Call showResults directly
    window.workflowBuilder.showResults(mockResults);
  });

  // Wait for modal to appear
  await page.waitForSelector('#resultsModal', { timeout: 5000 });
  console.log('\n✅ Results modal displayed!');

  // Check modal content
  const modalVisible = await page.locator('#resultsModal').isVisible();
  expect(modalVisible).toBe(true);

  // Get modal content
  const modalContent = await page.locator('#resultsModal .modal-body').textContent();
  console.log('\n📊 MODAL CONTENT:');
  console.log('─'.repeat(70));
  console.log(modalContent);
  console.log('─'.repeat(70));

  // Check for Chinese text
  const hasChineseChars = /[\u4e00-\u9fa5]/.test(modalContent);
  expect(hasChineseChars).toBe(true);
  console.log('\n✅ Chinese text found in modal!');

  // Check node visual state
  const successNodes = await page.locator('.execution-success').count();
  console.log(`\n✅ Nodes with execution-success class: ${successNodes}`);

  // Check for output preview on node
  const outputPreviews = await page.locator('.node-output-preview').all();
  console.log(`\n📝 Output preview elements: ${outputPreviews.length}`);

  if (outputPreviews.length > 0) {
    const previewText = await outputPreviews[0].textContent();
    console.log('Preview text:', previewText);
  }

  // Take screenshot
  await page.screenshot({
    path: 'test-results/output-display-test.png',
    fullPage: true,
  });

  console.log('\n📸 Screenshot: test-results/output-display-test.png');

  // Test error display
  console.log('\n3️⃣ Testing error display...');

  // Close modal first
  await page.locator('#resultsModal .btn-close').click();
  await page.waitForTimeout(500);

  // Test with error results
  await page.evaluate(() => {
    const errorResults = {
      status: 'success',
      results: {
        1: {
          type: 'input',
          status: 'success',
          result: 'Test input',
        },
        2: {
          type: 'llm',
          status: 'error',
          error: 'Failed to connect to Ollama',
        },
      },
    };

    window.workflowBuilder.showResults(errorResults);
  });

  await page.waitForSelector('#resultsModal', { timeout: 5000 });

  const errorBadge = await page.locator('.badge.bg-danger').count();
  console.log(`\n✅ Error badges found: ${errorBadge}`);

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('TEST SUMMARY:');
  console.log('═'.repeat(70));
  console.log('Modal functionality:', modalVisible ? '✅' : '❌');
  console.log('Chinese display:', hasChineseChars ? '✅' : '❌');
  console.log('Visual states:', successNodes > 0 ? '✅' : '❌');
  console.log('Output previews:', outputPreviews.length > 0 ? '✅' : '❌');
  console.log('Error handling:', errorBadge > 0 ? '✅' : '❌');
  console.log('═'.repeat(70));
});
