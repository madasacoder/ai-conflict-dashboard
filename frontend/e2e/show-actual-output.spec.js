/**
 * Show Actual Output Test
 * Step by step with real output display
 */

import { test, expect } from '@playwright/test';
import WorkflowTestFramework from '../tests/helpers/workflow-automation.js';

test('show actual Chinese translation output', async ({ page }) => {
  test.setTimeout(600000); // 10 minutes

  const framework = new WorkflowTestFramework(page);
  await framework.initialize();

  // Monitor everything
  page.on('console', msg => console.log(`[Console] ${msg.text()}`));
  
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`\n📤 API Request: ${request.method()} ${request.url()}`);
      if (request.method() === 'POST') {
        console.log('Request body:', request.postData());
      }
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      console.log(`\n📥 API Response: ${response.status()} ${response.url()}`);
      try {
        const body = await response.text();
        console.log('Response body:', body);
      } catch (e) {}
    }
  });

  // INPUT TEXT
  const INPUT_TEXT = "Hello, how are you?";
  const PROMPT = "Translate to Chinese: {input}";
  
  console.log('\n' + '═'.repeat(70));
  console.log('WORKFLOW TEST: English to Chinese Translation');
  console.log('═'.repeat(70));
  console.log('📝 INPUT:', INPUT_TEXT);
  console.log('📋 PROMPT:', PROMPT);
  console.log('🤖 MODEL: Ollama (gemma3:4b)');
  console.log('═'.repeat(70) + '\n');

  // Create workflow
  console.log('Creating workflow...\n');
  
  const inputNodeId = await framework.createInputNode({
    type: 'text',
    content: INPUT_TEXT,
    label: 'English Input',
  });

  const llmNodeId = await framework.createAINode({
    model: 'ollama',
    prompt: PROMPT,
    temperature: 0.3,
    label: 'Chinese Translator',
  });

  await framework.connectNodes(inputNodeId, llmNodeId);
  
  console.log('✅ Workflow created and connected\n');

  // Execute
  console.log('Executing workflow...');
  await page.locator('button:has-text("Run")').click();
  
  // Wait for response
  console.log('Waiting for Ollama response (60 seconds max)...\n');
  
  let responseReceived = false;
  try {
    await page.waitForResponse(
      response => {
        if (response.url().includes('/api/workflows/execute')) {
          responseReceived = true;
          return true;
        }
        return false;
      },
      { timeout: 60000 }
    );
  } catch (e) {
    console.log('❌ No API response received after 60 seconds');
  }

  // Wait additional time for UI update
  await page.waitForTimeout(5000);

  // Check for output in multiple places
  console.log('\n' + '─'.repeat(70));
  console.log('CHECKING FOR OUTPUT:');
  console.log('─'.repeat(70) + '\n');

  // 1. Check node visual state
  const nodes = await page.locator('.drawflow-node').all();
  for (let i = 0; i < nodes.length; i++) {
    const nodeClass = await nodes[i].getAttribute('class');
    const nodeType = nodeClass.includes('llm') ? 'LLM' : nodeClass.includes('input') ? 'Input' : 'Unknown';
    console.log(`Node ${i + 1} (${nodeType}): ${nodeClass}`);
    
    // Check for any status indicators
    const statusElements = await nodes[i].locator('[class*="status"], [class*="result"], [class*="output"]').all();
    for (const status of statusElements) {
      const text = await status.textContent();
      if (text) console.log(`  Status: ${text}`);
    }
  }

  // 2. Click LLM node and check config panel
  console.log('\nClicking LLM node to check for output...');
  await page.locator('.drawflow-node.llm').first().click();
  await page.waitForTimeout(2000);

  const configPanel = await page.locator('#configPanel').textContent();
  console.log('\nConfig Panel Content:');
  console.log(configPanel);

  // 3. Check for Chinese characters anywhere
  const pageContent = await page.content();
  const chineseRegex = /[\u4e00-\u9fa5]+/g;
  const chineseMatches = pageContent.match(chineseRegex);
  
  if (chineseMatches && chineseMatches.length > 0) {
    console.log('\n✅ FOUND CHINESE TEXT:');
    console.log('─'.repeat(70));
    chineseMatches.forEach(match => {
      console.log(match);
    });
    console.log('─'.repeat(70));
  } else {
    console.log('\n❌ NO CHINESE TEXT FOUND ON PAGE');
  }

  // 4. Take screenshot
  await page.screenshot({
    path: 'test-results/workflow-output-check.png',
    fullPage: true
  });

  // Final summary
  console.log('\n' + '═'.repeat(70));
  console.log('TEST SUMMARY:');
  console.log('═'.repeat(70));
  console.log('Workflow created:', inputNodeId && llmNodeId ? '✅' : '❌');
  console.log('API called:', responseReceived ? '✅' : '❌');
  console.log('Chinese output found:', chineseMatches ? '✅' : '❌');
  console.log('Screenshot:', 'test-results/workflow-output-check.png');
  console.log('═'.repeat(70) + '\n');

  framework.destroy();
});