/**
 * Manual Chinese Translation Test
 * Shows each step visually with pauses
 */

import { test, expect } from '@playwright/test';

test('manually create and run Chinese translation workflow', async ({ page }) => {
  test.setTimeout(600000); // 10 minutes

  // Go to workflow builder
  await page.goto('http://localhost:3000/workflow-builder.html');
  await page.waitForLoadState('networkidle');
  
  console.log('🎯 MANUAL WORKFLOW CREATION TEST\n');
  console.log('I will pause after each step so you can see what\'s happening\n');

  // Step 1: Create Input Node
  console.log('STEP 1: Creating Input Node');
  console.log('─'.repeat(50));
  
  // Click on Input node in palette
  await page.locator('div[data-node-type="input"].node-item').click();
  await page.waitForTimeout(2000); // Pause to show node created
  
  console.log('✅ Input node created\n');

  // Step 2: Configure Input Node
  console.log('STEP 2: Configuring Input Node with text');
  console.log('─'.repeat(50));
  
  // Click on the input node to configure it
  const inputNode = page.locator('.drawflow-node.input').first();
  await inputNode.click();
  await page.waitForSelector('#configPanel.open');
  await page.waitForTimeout(1000);
  
  // Type the input text
  const inputText = "Hello, how are you today?";
  const textarea = page.locator('#configPanel textarea').first();
  await textarea.fill(inputText);
  
  console.log('✅ Typed input text:', inputText);
  await page.waitForTimeout(2000); // Pause to show text
  
  // Close config panel
  await page.evaluate(() => {
    document.getElementById('configPanel').classList.remove('open');
  });
  await page.waitForTimeout(1000);

  // Step 3: Create LLM Node
  console.log('\nSTEP 3: Creating LLM Node');
  console.log('─'.repeat(50));
  
  await page.locator('div[data-node-type="llm"].node-item').click();
  await page.waitForTimeout(2000); // Pause to show node created
  
  console.log('✅ LLM node created\n');

  // Step 4: Configure LLM Node
  console.log('STEP 4: Configuring LLM Node');
  console.log('─'.repeat(50));
  
  // Click on the LLM node
  const llmNode = page.locator('.drawflow-node.llm').first();
  await llmNode.click();
  await page.waitForSelector('#configPanel.open');
  await page.waitForTimeout(1000);
  
  // First, uncheck all models
  console.log('   Unchecking all models...');
  const checkboxes = page.locator('#configPanel input[type="checkbox"]');
  const count = await checkboxes.count();
  for (let i = 0; i < count; i++) {
    const checkbox = checkboxes.nth(i);
    if (await checkbox.isChecked()) {
      await checkbox.uncheck();
    }
  }
  await page.waitForTimeout(1000);
  
  // Check Ollama
  console.log('   Selecting Ollama...');
  const ollamaCheckbox = page.locator('#configPanel input[type="checkbox"][value="ollama"]');
  await ollamaCheckbox.check();
  await page.waitForTimeout(2000); // Pause to show selection
  
  // Set the prompt
  console.log('   Setting prompt...');
  const promptTextarea = page.locator('#configPanel textarea').first();
  const prompt = "Translate to Mandarin Chinese:\n\n{input}";
  await promptTextarea.fill(prompt);
  
  console.log('✅ Prompt set:', prompt);
  await page.waitForTimeout(3000); // Pause to show prompt
  
  // Close config panel
  await page.evaluate(() => {
    document.getElementById('configPanel').classList.remove('open');
  });
  await page.waitForTimeout(1000);

  // Step 5: Connect Nodes
  console.log('\nSTEP 5: Connecting Nodes');
  console.log('─'.repeat(50));
  console.log('   (Using programmatic connection due to drag-drop issues)\n');
  
  // Get node IDs and connect programmatically
  await page.evaluate(() => {
    const editor = window.workflowBuilder.editor;
    // Nodes are numbered starting from 1
    editor.addConnection(1, 2, 'output_1', 'input_1');
  });
  
  await page.waitForTimeout(2000);
  console.log('✅ Nodes connected\n');

  // Step 6: Run Workflow
  console.log('STEP 6: Running Workflow');
  console.log('─'.repeat(50));
  
  // Monitor console
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log(`   Browser: ${msg.text()}`);
    }
  });
  
  // Monitor API calls
  page.on('request', request => {
    if (request.url().includes('/api/workflows/execute')) {
      console.log('   📤 API Call:', request.method(), request.url());
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/workflows/execute')) {
      console.log('   📥 API Response:', response.status());
      try {
        const body = await response.json();
        console.log('   Response data:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('   Could not parse response body');
      }
    }
  });
  
  console.log('   Clicking Run button...');
  const runButton = page.locator('button:has-text("Run")');
  await runButton.click();
  
  console.log('   ⏳ Waiting for execution...\n');
  await page.waitForTimeout(30000); // Wait 30 seconds for Ollama
  
  // Step 7: Check Results
  console.log('\nSTEP 7: Checking Results');
  console.log('─'.repeat(50));
  
  // Click on LLM node to see results
  await llmNode.click();
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({
    path: 'test-results/manual-workflow-final.png',
    fullPage: true
  });
  
  console.log('📸 Final screenshot: test-results/manual-workflow-final.png');
  
  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('WORKFLOW SUMMARY:');
  console.log('═'.repeat(70));
  console.log('Input:', inputText);
  console.log('Prompt:', prompt);
  console.log('Model: Ollama');
  console.log('Expected: Chinese translation');
  console.log('═'.repeat(70));
});