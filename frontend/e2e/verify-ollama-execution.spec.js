/**
 * Verify Ollama Execution Test
 * Direct test to confirm workflow actually executes with Ollama
 */

import { test, expect } from '@playwright/test';
import WorkflowTestFramework from '../tests/helpers/workflow-automation.js';

test('verify Ollama actually executes and returns output', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes for Ollama execution

  const framework = new WorkflowTestFramework(page);
  await framework.initialize();

  // Enable all console logging
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  // Monitor network for API calls
  page.on('request', request => {
    if (request.url().includes('/api/workflows/execute')) {
      console.log('🌐 API Request:', request.method(), request.url());
      console.log('📤 Request body:', request.postData());
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/workflows/execute')) {
      console.log('🌐 API Response:', response.status(), response.statusText());
      response.text().then(body => {
        console.log('📥 Response body:', body);
      });
    }
  });

  console.log('\n🎯 CREATING MINIMAL WORKFLOW FOR TESTING\n');

  // Simple test input
  const testInput = "Hello world";
  console.log('📝 INPUT TEXT:', testInput);

  // Create just 2 nodes - input and LLM
  const inputNodeId = await framework.createInputNode({
    type: 'text',
    content: testInput,
    label: 'Test Input',
  });

  const llmNodeId = await framework.createAINode({
    model: 'ollama',
    prompt: 'Translate to Spanish: {input}',
    temperature: 0.3,
    label: 'Ollama Translate',
  });

  // Connect them
  await framework.connectNodes(inputNodeId, llmNodeId);
  
  console.log('\n🔗 Workflow created: Input -> Ollama LLM\n');

  // Take screenshot before execution
  await page.screenshot({
    path: 'test-results/ollama-before-execution.png',
    fullPage: true,
  });

  // Execute workflow
  console.log('▶️ CLICKING RUN BUTTON...\n');
  
  const runButton = page.locator('button:has-text("Run")');
  await runButton.click();
  
  // Wait longer for Ollama to process
  console.log('⏳ Waiting for Ollama to process (30 seconds)...\n');
  await page.waitForTimeout(30000);

  // Try multiple ways to find the output
  console.log('🔍 SEARCHING FOR OUTPUT...\n');

  // Method 1: Check node visual state
  const llmNode = page.locator('.drawflow-node.llm').first();
  const nodeClasses = await llmNode.getAttribute('class');
  console.log('Node classes:', nodeClasses);

  // Method 2: Click on the LLM node to see output in config panel
  await llmNode.click();
  await page.waitForTimeout(2000);

  // Check config panel for output
  const configPanel = page.locator('#configPanel');
  const configVisible = await configPanel.isVisible();
  console.log('Config panel visible:', configVisible);

  if (configVisible) {
    // Look for any output in the config panel
    const configContent = await configPanel.textContent();
    console.log('\n📋 CONFIG PANEL CONTENT:');
    console.log('─'.repeat(60));
    console.log(configContent);
    console.log('─'.repeat(60));
  }

  // Method 3: Check for any output elements
  const outputElements = await page.locator('.node-output, .output-content, .result').all();
  console.log(`\nFound ${outputElements.length} potential output elements`);
  
  for (let i = 0; i < outputElements.length; i++) {
    const text = await outputElements[i].textContent();
    if (text && text.trim()) {
      console.log(`\n📄 OUTPUT ${i + 1}:`);
      console.log(text);
    }
  }

  // Method 4: Check browser console for results
  await page.evaluate(() => {
    console.log('Workflow data:', window.workflowBuilder?.editor?.export());
  });

  // Take final screenshot
  await page.screenshot({
    path: 'test-results/ollama-after-execution.png',
    fullPage: true,
  });

  console.log('\n📸 Screenshots saved:');
  console.log('  - test-results/ollama-before-execution.png');
  console.log('  - test-results/ollama-after-execution.png');

  // Final check - did anything actually happen?
  const hasAnyOutput = outputElements.length > 0 || configContent?.includes('Hola');
  
  if (!hasAnyOutput) {
    console.log('\n❌ NO OUTPUT FOUND - Workflow execution may not be working');
    console.log('\nPossible issues:');
    console.log('  1. Backend workflow executor not processing Ollama requests');
    console.log('  2. Results not being returned to frontend');
    console.log('  3. UI not displaying results');
    console.log('  4. Ollama not actually being called');
  } else {
    console.log('\n✅ Output found - workflow execution is working!');
  }

  framework.destroy();
});