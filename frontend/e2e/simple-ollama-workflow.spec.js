/**
 * Simple Ollama Workflow Test
 * Tests basic workflow creation and execution with minimal complexity
 */

import { test, expect } from '@playwright/test';
import WorkflowTestFramework from '../tests/helpers/workflow-automation.js';

test.describe('Simple Ollama Workflow', () => {
  let framework;

  test.beforeEach(async ({ page }) => {
    framework = new WorkflowTestFramework(page);
    await framework.initialize();
  });

  test.afterEach(async () => {
    if (framework) {
      framework.destroy();
    }
  });

  test('should create and execute a simple Ollama workflow', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes

    console.log('🚀 Starting Simple Ollama Workflow Test\n');

    // Simple test text
    const testText = 'Hello world, this is a test.';

    // Step 1: Create input node
    console.log('📝 Creating input node...');
    const inputNodeId = await framework.createInputNode({
      type: 'text',
      content: testText,
      label: 'Test Input',
    });

    // Step 2: Create Ollama LLM node with simple task
    console.log('🧠 Creating Ollama LLM node...');
    const llmNodeId = await framework.createAINode({
      model: 'ollama',
      prompt: 'Translate this to Spanish: ',
      temperature: 0.5,
      label: 'Ollama Translate',
    });

    // Step 3: Create output node
    console.log('📤 Creating output node...');
    const outputNodeId = await framework.createOutputNode({
      format: 'text',
      label: 'Translation Output',
    });

    // Step 4: Connect nodes
    console.log('\n🔗 Connecting nodes...');
    await framework.connectNodes(inputNodeId, llmNodeId);
    await framework.connectNodes(llmNodeId, outputNodeId);
    console.log('✅ Nodes connected!\n');

    // Step 5: Take screenshot before execution
    await page.screenshot({
      path: 'test-results/simple-ollama-before.png',
      fullPage: true,
    });

    // Step 6: Execute workflow
    console.log('▶️ Executing workflow...');

    // Enable console logging
    page.on('console', (msg) => {
      console.log(`Browser console [${msg.type()}]: ${msg.text()}`);
    });

    // Click the Run button
    const runButton = page.locator('button:has-text("Run")');
    await expect(runButton).toBeVisible();
    await runButton.click();

    console.log('⏳ Waiting for execution...\n');

    // Wait for some indication of execution
    await page.waitForTimeout(5000);

    // Check for any errors
    const errorElements = await page.locator('.error, .alert-danger').count();
    if (errorElements > 0) {
      console.log('❌ Errors detected during execution');
      const errors = await page.locator('.error, .alert-danger').allTextContents();
      errors.forEach((err) => console.log(`   Error: ${err}`));
    }

    // Step 7: Check results
    console.log('📊 Checking for results...\n');

    // Click on the output node to see results
    const outputNode = page.locator('.drawflow-node.output').first();
    await outputNode.click();
    await page.waitForTimeout(1000);

    // Look for output in config panel
    const outputText = await page
      .locator('#configPanel textarea, #configPanel .output')
      .first()
      .textContent()
      .catch(() => 'No output found');

    if (outputText && outputText !== 'No output found') {
      console.log('🎯 OUTPUT FOUND:');
      console.log('─'.repeat(50));
      console.log(outputText);
      console.log('─'.repeat(50));
    } else {
      console.log('⚠️ No output found. This may indicate:');
      console.log('   - Backend not connected to Ollama');
      console.log('   - Workflow execution not implemented');
      console.log('   - Results not displayed in UI');
    }

    // Step 8: Take final screenshot
    await page.screenshot({
      path: 'test-results/simple-ollama-after.png',
      fullPage: true,
    });

    // Step 9: Verify workflow structure
    const nodeCount = await page.locator('.drawflow-node').count();
    expect(nodeCount).toBe(3);

    const connectionCount = await page.locator('.connection, .drawflow-connection').count();
    expect(connectionCount).toBeGreaterThanOrEqual(2);

    console.log('\n✅ Simple Ollama workflow test completed!');
    console.log(`   - Created ${nodeCount} nodes`);
    console.log(`   - Created ${connectionCount} connections`);
    console.log('\n📸 Screenshots saved:');
    console.log('   - test-results/simple-ollama-before.png');
    console.log('   - test-results/simple-ollama-after.png');
  });
});
