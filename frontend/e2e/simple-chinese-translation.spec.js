/**
 * Simple Chinese Translation Test
 * Just input -> Ollama Chinese translation -> show output
 */

import { test, expect } from '@playwright/test';
import WorkflowTestFramework from '../tests/helpers/workflow-automation.js';

test('translate text to Chinese using Ollama', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes

  const framework = new WorkflowTestFramework(page);
  await framework.initialize();

  // Monitor console
  page.on('console', (msg) => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  // Monitor API calls
  page.on('request', (request) => {
    if (request.url().includes('/api/workflows/execute')) {
      console.log('📤 API Request to:', request.url());
      console.log('   Method:', request.method());
      console.log('   Body:', request.postData());
    }
  });

  page.on('response', async (response) => {
    if (response.url().includes('/api/workflows/execute')) {
      console.log('📥 API Response:', response.status());
      const body = await response.text();
      console.log('   Body:', body);
    }
  });

  // INPUT TEXT TO TRANSLATE
  const inputText = 'Hello, how are you today?';
  console.log('\n📝 INPUT TEXT:', inputText);
  console.log('─'.repeat(50));

  // Step 1: Create input node with actual text
  console.log('\n1️⃣ Creating input node...');
  const inputNodeId = await framework.createInputNode({
    type: 'text',
    content: inputText,
    label: 'English Text',
  });
  console.log('   ✅ Input node created with text:', inputText);

  // Step 2: Create LLM node for Chinese translation
  console.log('\n2️⃣ Creating Ollama LLM node...');
  const llmNodeId = await framework.createAINode({
    model: 'ollama',
    prompt:
      'Translate the following text to Chinese (Simplified). Only provide the translation, no explanations:\n\n{input}',
    temperature: 0.3,
    label: 'Chinese Translation',
  });
  console.log('   ✅ LLM node created with Ollama selected');

  // Step 3: Connect the nodes
  console.log('\n3️⃣ Connecting nodes...');
  await framework.connectNodes(inputNodeId, llmNodeId);
  console.log('   ✅ Nodes connected');

  // Take screenshot before running
  await page.screenshot({
    path: 'test-results/chinese-translation-before.png',
    fullPage: true,
  });
  console.log('\n📸 Screenshot saved: test-results/chinese-translation-before.png');

  // Step 4: Click Run button
  console.log('\n4️⃣ CLICKING RUN BUTTON...');
  const runButton = page.locator('button:has-text("Run")');
  await expect(runButton).toBeVisible();
  await runButton.click();
  console.log('   ✅ Run button clicked');

  // Step 5: Wait for execution
  console.log('\n5️⃣ Waiting for Ollama to process...');

  // Wait for API call to complete
  await page
    .waitForResponse((response) => response.url().includes('/api/workflows/execute'), {
      timeout: 60000,
    })
    .catch(() => console.log('   ⚠️ No API response received'));

  // Additional wait for processing
  await page.waitForTimeout(10000);

  // Step 6: Get the output
  console.log('\n6️⃣ CHECKING FOR OUTPUT...');

  // Click on the LLM node to see results
  const llmNode = page.locator('.drawflow-node.llm').first();
  await llmNode.click();
  await page.waitForTimeout(2000);

  // Check config panel
  const configPanel = page.locator('#configPanel');
  if (await configPanel.isVisible()) {
    const panelText = await configPanel.textContent();
    console.log('\n📋 Config Panel Content:');
    console.log(panelText);

    // Look specifically for Chinese characters
    const hasChineseChars = /[\u4e00-\u9fa5]/.test(panelText);
    if (hasChineseChars) {
      console.log('\n✅ CHINESE TRANSLATION FOUND!');
      // Extract just the Chinese text
      const chineseMatch = panelText.match(/[\u4e00-\u9fa5]+[，。！？\u4e00-\u9fa5\s]*/);
      if (chineseMatch) {
        console.log('\n🇨🇳 CHINESE OUTPUT:');
        console.log('─'.repeat(50));
        console.log(chineseMatch[0]);
        console.log('─'.repeat(50));
      }
    }
  }

  // Also check for any output elements
  const outputElements = await page.locator('[class*="output"], [class*="result"]').all();
  for (const element of outputElements) {
    const text = await element.textContent();
    if (text && /[\u4e00-\u9fa5]/.test(text)) {
      console.log('\n🇨🇳 Found Chinese text in output element:');
      console.log(text);
    }
  }

  // Take final screenshot
  await page.screenshot({
    path: 'test-results/chinese-translation-after.png',
    fullPage: true,
  });
  console.log('\n📸 Screenshot saved: test-results/chinese-translation-after.png');

  // Final summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 TRANSLATION TEST SUMMARY:');
  console.log('═'.repeat(70));
  console.log('Input (English):', inputText);
  console.log('Expected: Chinese translation');
  console.log('Model: Ollama (gemma3:4b)');
  console.log('═'.repeat(70));

  framework.destroy();
});
