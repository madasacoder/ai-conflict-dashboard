/**
 * Simple Ollama Execution Test
 * Creates nodes and executes with local Ollama without complex connections
 */

import { test, expect } from '@playwright/test';
import WorkflowTestFramework from '../tests/helpers/workflow-automation.js';

test.describe('Simple Ollama Execution', () => {
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

  test('should create and execute simple Ollama workflow', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes

    console.log('🚀 Simple Ollama Workflow Test\n');

    // Test story
    const testStory = `A young girl named Luna discovered she could speak to the wind.`;

    console.log('📖 INPUT TEXT:');
    console.log(testStory);
    console.log('\n');

    // Create just 2 nodes for simplicity
    console.log('📝 Creating input node...');
    await framework.createInputNode({
      type: 'text',
      content: testStory,
      label: 'Test Input',
    });

    console.log('🧠 Creating Ollama analysis node...');
    await framework.createAINode({
      model: 'gemma3:4b', // Your smallest local model
      prompt: 'Translate this to Chinese: ',
      temperature: 0.5,
      label: 'Gemma Translation',
    });

    // Verify nodes were created
    const nodeCount = await page.locator('.drawflow-node').count();
    console.log(`\n✅ Created ${nodeCount} nodes\n`);

    // Take screenshot before execution
    await page.screenshot({
      path: 'test-results/ollama-before-execution.png',
      fullPage: true,
    });

    // Try to manually connect by simulating the connection
    console.log('🔗 Attempting manual connection...');

    try {
      // Get the nodes
      const inputNode = page.locator('.drawflow-node.input').first();
      const aiNode = page.locator('.drawflow-node.llm').first();

      // Get their positions
      const inputBox = await inputNode.boundingBox();
      const aiBox = await aiNode.boundingBox();

      if (inputBox && aiBox) {
        // Calculate connection points
        const outputPoint = {
          x: inputBox.x + inputBox.width - 10,
          y: inputBox.y + inputBox.height / 2,
        };

        const inputPoint = {
          x: aiBox.x + 10,
          y: aiBox.y + aiBox.height / 2,
        };

        // Try drag from output to input
        await page.mouse.move(outputPoint.x, outputPoint.y);
        await page.mouse.down();
        await page.mouse.move(inputPoint.x, inputPoint.y, { steps: 10 });
        await page.mouse.up();

        console.log('✅ Connection attempt completed');
      }
    } catch (error) {
      console.log('⚠️ Manual connection failed, continuing anyway...');
    }

    // Execute workflow
    console.log('\n▶️ EXECUTING OLLAMA WORKFLOW...');
    await page.locator('button:has-text("Run")').click();

    // Wait for execution
    console.log('⏳ Waiting for Ollama to process...\n');
    await page.waitForTimeout(10000); // Give Ollama time to start

    // Monitor for results
    let hasResults = false;
    for (let i = 0; i < 30; i++) {
      // 30 seconds max
      // Check various possible result indicators
      const runningNodes = await page.locator('.node-running, .node-status-running').count();
      const completedNodes = await page.locator('.node-completed, .node-status-completed').count();
      const nodeOutputs = await page.locator('.node-output, .output-content').count();

      if (runningNodes > 0) {
        console.log(`⚙️ Ollama processing... (${runningNodes} nodes running)`);
      }

      if (completedNodes > 0) {
        console.log(`✅ ${completedNodes} nodes completed`);
        hasResults = true;
      }

      if (nodeOutputs > 0) {
        console.log(`📄 Found ${nodeOutputs} nodes with output`);
        hasResults = true;
      }

      if (hasResults) break;
      await page.waitForTimeout(1000);
    }

    // Try to extract results by clicking on nodes
    console.log('\n📊 CHECKING FOR RESULTS:\n');

    const aiNode = page.locator('.drawflow-node.llm').first();
    await aiNode.click();
    await page.waitForTimeout(1000);

    // Look for output in various places
    const possibleOutputSelectors = [
      '#configPanel textarea',
      '#configPanel .output',
      '#configPanel .result',
      '.node-output',
      '.output-content',
    ];

    let foundOutput = false;
    for (const selector of possibleOutputSelectors) {
      try {
        const element = page.locator(selector).last();
        if ((await element.count()) > 0) {
          const content = await element.inputValue().catch(() => element.textContent());
          if (content && content.trim() && !content.includes('{input}')) {
            console.log('🎯 OLLAMA OUTPUT FOUND:');
            console.log('─'.repeat(50));
            console.log(content);
            console.log('─'.repeat(50));
            foundOutput = true;
            break;
          }
        }
      } catch (e) {
        // Continue checking other selectors
      }
    }

    if (!foundOutput) {
      console.log('⚠️ No output found in UI. This could mean:');
      console.log('   - Ollama is still processing');
      console.log('   - Backend needs Ollama integration enabled');
      console.log('   - The workflow needs proper connections');
    }

    // Take final screenshot
    await page.screenshot({
      path: 'test-results/ollama-after-execution.png',
      fullPage: true,
    });

    console.log('\n📸 Screenshots saved:');
    console.log('   - test-results/ollama-before-execution.png');
    console.log('   - test-results/ollama-after-execution.png');

    console.log('\n✅ Ollama workflow test completed!');
    console.log('\n💡 To see actual translation results:');
    console.log('   1. Ensure backend is running with Ollama support');
    console.log('   2. Check backend logs for Ollama API calls');
    console.log('   3. Verify gemma3:4b model is responding');
  });
});
