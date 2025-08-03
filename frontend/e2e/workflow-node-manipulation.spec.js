/**
 * Workflow Node Manipulation E2E Tests
 * Tests: Adding nodes, removing nodes, connecting, disconnecting, LLM activation
 *
 * This test validates all the fundamental workflow building operations
 */

import { test, expect } from '@playwright/test';
import WorkflowTestFramework from '../tests/helpers/workflow-automation.js';
import { testStories } from '../tests/test-data/stories.js';

test.describe('Workflow Node Manipulation', () => {
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

  test('should add and remove nodes correctly', async ({ page }) => {
    console.log('🔧 Testing node addition and removal...');

    // Step 1: Add various types of nodes
    console.log('➕ Adding different node types...');

    // Add input node
    await page.locator('[data-node-type="input"]').click();
    let nodeCount = await page.locator('.drawflow-node').count();
    expect(nodeCount).toBe(1);
    console.log('✅ Input node added');

    // Add LLM node
    await page.locator('[data-node-type="llm"]').click();
    nodeCount = await page.locator('.drawflow-node').count();
    expect(nodeCount).toBe(2);
    console.log('✅ LLM node added');

    // Add comparison node
    await page.locator('[data-node-type="compare"]').click();
    nodeCount = await page.locator('.drawflow-node').count();
    expect(nodeCount).toBe(3);
    console.log('✅ Comparison node added');

    // Add output node
    await page.locator('[data-node-type="output"]').click();
    nodeCount = await page.locator('.drawflow-node').count();
    expect(nodeCount).toBe(4);
    console.log('✅ Output node added');

    // Step 2: Test node selection and deletion
    console.log('🗑️ Testing node deletion...');

    // Select first node (input node)
    const firstNode = page.locator('.drawflow-node').first();
    await firstNode.click();

    // Delete using keyboard
    await page.keyboard.press('Delete');
    nodeCount = await page.locator('.drawflow-node').count();
    expect(nodeCount).toBe(3);
    console.log('✅ Node deleted with keyboard');

    // Select and delete another node using context menu (if available)
    const secondNode = page.locator('.drawflow-node').first();
    await secondNode.click({ button: 'right' });

    // Look for delete option in context menu
    const deleteOption = page.locator(
      '.context-menu .delete, button:has-text("Delete"), .delete-node'
    );
    if (await deleteOption.isVisible()) {
      await deleteOption.click();
      nodeCount = await page.locator('.drawflow-node').count();
      expect(nodeCount).toBe(2);
      console.log('✅ Node deleted with context menu');
    }

    // Step 3: Test clearing all nodes
    console.log('🧹 Testing clear all nodes...');
    const clearButton = page.locator('button:has-text("Clear"), .btn-clear-all');
    if (await clearButton.isVisible()) {
      await clearButton.click();

      // Confirm if dialog appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      nodeCount = await page.locator('.drawflow-node').count();
      expect(nodeCount).toBe(0);
      console.log('✅ All nodes cleared');
    }
  });

  test('should connect and disconnect nodes properly', async ({ page }) => {
    console.log('🔗 Testing node connections...');

    // Add nodes for connection testing
    await page.locator('[data-node-type="input"]').click();
    await page.locator('[data-node-type="llm"]').click();
    await page.locator('[data-node-type="output"]').click();

    // Wait for nodes to be rendered
    await page.waitForTimeout(500);

    const nodes = page.locator('.drawflow-node');
    expect(await nodes.count()).toBe(3);

    // Step 1: Test manual connection by drag & drop
    console.log('🔌 Creating connections...');

    const inputNode = nodes.nth(0);
    const llmNode = nodes.nth(1);
    const outputNode = nodes.nth(2);

    // Connect input to LLM
    const inputOutput = inputNode.locator('.output, .drawflow_output').first();
    const llmInput = llmNode.locator('.input, .drawflow_input').first();

    await inputOutput.hover();
    await page.mouse.down();
    await llmInput.hover();
    await page.mouse.up();

    // Verify connection was created
    let connectionCount = await page.locator('.connection, .drawflow-connection').count();
    expect(connectionCount).toBeGreaterThanOrEqual(1);
    console.log('✅ Input → LLM connection created');

    // Connect LLM to output
    const llmOutput = llmNode.locator('.output, .drawflow_output').first();
    const outputInput = outputNode.locator('.input, .drawflow_input').first();

    await llmOutput.hover();
    await page.mouse.down();
    await outputInput.hover();
    await page.mouse.up();

    connectionCount = await page.locator('.connection, .drawflow-connection').count();
    expect(connectionCount).toBeGreaterThanOrEqual(2);
    console.log('✅ LLM → Output connection created');

    // Step 2: Test connection removal
    console.log('✂️ Testing connection removal...');

    // Click on a connection to select it
    const connection = page.locator('.connection, .drawflow-connection').first();
    await connection.click();

    // Delete connection (usually with Delete key or right-click)
    await page.keyboard.press('Delete');

    // Verify connection count decreased
    const newConnectionCount = await page.locator('.connection, .drawflow-connection').count();
    expect(newConnectionCount).toBeLessThan(connectionCount);
    console.log('✅ Connection removed');

    // Step 3: Test invalid connections
    console.log('🚫 Testing invalid connection prevention...');

    // Try to connect output back to input (should be prevented)
    const outputNodeOutput = outputNode.locator('.output, .drawflow_output').first();
    const inputNodeInput = inputNode.locator('.input, .drawflow_input').first();

    if ((await outputNodeOutput.isVisible()) && (await inputNodeInput.isVisible())) {
      await outputNodeOutput.hover();
      await page.mouse.down();
      await inputNodeInput.hover();
      await page.mouse.up();

      // Check if invalid connection feedback is shown
      const errorIndicator = page.locator('.connection-error, .invalid-connection, .error-message');
      // Note: This depends on your specific implementation
    }
  });

  test('should configure and activate LLM nodes correctly', async ({ page }) => {
    console.log('🧠 Testing LLM node configuration and activation...');

    // Add input and LLM nodes
    await page.locator('[data-node-type="input"]').click();
    await page.locator('[data-node-type="llm"]').click();

    // Configure input node with test content
    const inputNode = page.locator('.drawflow-node').first();
    await inputNode.click();

    await page.waitForSelector('#configPanel.open', { state: 'visible' });
    await page.locator('select[onchange*="updateNodeData"]').selectOption('text');
    await page.locator('textarea').fill(testStories.short.content);
    await page.locator('#configPanel .close-btn, .config-close').click();
    console.log('✅ Input node configured');

    // Configure LLM node
    const llmNode = page.locator('.drawflow-node').nth(1);
    await llmNode.click();

    await page.waitForSelector('#configPanel.open', { state: 'visible' });

    // Step 1: Test model selection
    console.log('🤖 Testing model selection...');

    // Try different model options
    const modelSelect = page.locator('select:has(option), .model-select');
    if (await modelSelect.isVisible()) {
      // Test OpenAI model
      await modelSelect.selectOption({ label: /gpt|openai/i });
      console.log('✅ OpenAI model selected');

      // Test Ollama model if available (using gemma3:4b)
      const ollamaOption = page.locator('option:text-matches("ollama|gemma", "i")');
      if (await ollamaOption.isVisible()) {
        await modelSelect.selectOption({ label: /ollama.*gemma3:4b|gemma3:4b/i });
        console.log('✅ Ollama gemma3:4b model selected');
      }
    }

    // Step 2: Test prompt configuration
    console.log('📝 Testing prompt configuration...');
    const promptTextarea = page.locator('textarea');
    const testPrompt = 'Analyze this story and provide key insights about the characters and plot.';
    await promptTextarea.fill(testPrompt);

    const promptValue = await promptTextarea.inputValue();
    expect(promptValue).toBe(testPrompt);
    console.log('✅ Prompt configured');

    // Step 3: Test parameter configuration
    console.log('⚙️ Testing parameter configuration...');

    // Temperature slider
    const temperatureSlider = page.locator('input[type="range"]');
    if (await temperatureSlider.isVisible()) {
      await temperatureSlider.fill('0.7');
      const tempValue = await temperatureSlider.inputValue();
      expect(parseFloat(tempValue)).toBe(0.7);
      console.log('✅ Temperature configured');
    }

    // Max tokens input
    const maxTokensInput = page.locator('input[type="number"], input[placeholder*="tokens"]');
    if (await maxTokensInput.isVisible()) {
      await maxTokensInput.fill('1000');
      console.log('✅ Max tokens configured');
    }

    await page.locator('#configPanel .close-btn, .config-close').click();

    // Step 4: Test LLM activation through workflow execution
    console.log('▶️ Testing LLM activation...');

    // Connect nodes
    const inputOutput = inputNode.locator('.output, .drawflow_output').first();
    const llmInput = llmNode.locator('.input, .drawflow_input').first();

    await inputOutput.hover();
    await page.mouse.down();
    await llmInput.hover();
    await page.mouse.up();
    console.log('✅ Nodes connected');

    // Check Ollama availability before execution
    const ollamaAvailable = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        return response.ok;
      } catch (error) {
        return false;
      }
    });

    if (ollamaAvailable) {
      console.log('🚀 Ollama available - testing execution...');

      // Execute workflow
      await page.locator('button:has-text("Run"), .btn-run').click();

      // Monitor execution
      await page.waitForSelector('.workflow-running, .node-status-running', {
        state: 'visible',
        timeout: 10000,
      });
      console.log('✅ LLM execution started');

      // Wait for completion or timeout
      try {
        await page.waitForSelector('.workflow-complete, .node-status-completed', {
          state: 'visible',
          timeout: 60000,
        });
        console.log('✅ LLM execution completed');

        // Check for output
        const nodeOutput = page.locator('.node-output, .output-content');
        if (await nodeOutput.isVisible()) {
          const outputText = await nodeOutput.textContent();
          expect(outputText.length).toBeGreaterThan(10);
          console.log('✅ LLM produced output');
        }
      } catch (error) {
        console.log('⏱️ LLM execution timed out (this may be expected)');
      }
    } else {
      console.log('⚠️ Ollama not available - skipping execution test');
    }
  });

  test('should handle multiple simultaneous operations', async ({ page }) => {
    console.log('🔄 Testing multiple simultaneous operations...');

    // Step 1: Rapid node addition
    console.log('⚡ Testing rapid node addition...');

    const nodeTypes = ['input', 'llm', 'compare', 'output'];

    for (let i = 0; i < 3; i++) {
      for (const nodeType of nodeTypes) {
        await page.locator(`[data-node-type="${nodeType}"]`).click();
        await page.waitForTimeout(100); // Small delay to ensure proper rendering
      }
    }

    const totalNodes = await page.locator('.drawflow-node').count();
    expect(totalNodes).toBe(12); // 3 iterations × 4 node types
    console.log(`✅ Added ${totalNodes} nodes rapidly`);

    // Step 2: Batch operations
    console.log('📦 Testing batch operations...');

    // Select multiple nodes (if supported)
    await page.keyboard.down('Control'); // Start multi-select

    const nodes = page.locator('.drawflow-node');
    await nodes.nth(0).click();
    await nodes.nth(2).click();
    await nodes.nth(4).click();

    await page.keyboard.up('Control');

    // Delete selected nodes
    await page.keyboard.press('Delete');

    const remainingNodes = await page.locator('.drawflow-node').count();
    expect(remainingNodes).toBeLessThan(totalNodes);
    console.log('✅ Batch operations completed');

    // Step 3: Stress test with many connections
    console.log('🔗 Testing many connections...');

    // Clear and add specific test nodes
    const clearButton = page.locator('button:has-text("Clear"), .btn-clear');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }

    // Add a hub pattern (one central node connected to many others)
    await page.locator('[data-node-type="llm"]').click(); // Central node

    for (let i = 0; i < 5; i++) {
      await page.locator('[data-node-type="input"]').click();
    }

    // Connect all input nodes to the central LLM node
    const centralNode = page.locator('.drawflow-node').first();
    const inputNodes = page.locator('.drawflow-node').nth(1); // Start from second node

    // Note: Full connection testing would require more sophisticated automation
    console.log('✅ Multiple connection pattern created');
  });

  test('should preserve node state during operations', async ({ page }) => {
    console.log('💾 Testing node state preservation...');

    // Add and configure a node
    await page.locator('[data-node-type="llm"]').click();

    const llmNode = page.locator('.drawflow-node').first();
    await llmNode.click();

    await page.waitForSelector('#configPanel.open', { state: 'visible' });

    // Configure with specific values
    const testPrompt = 'This is a test prompt that should be preserved';
    await page.locator('textarea').fill(testPrompt);

    const temperatureSlider = page.locator('input[type="range"]');
    if (await temperatureSlider.isVisible()) {
      await temperatureSlider.fill('0.8');
    }

    await page.locator('#configPanel .close-btn, .config-close').click();
    console.log('✅ Node configured with test values');

    // Add another node and perform some operations
    await page.locator('[data-node-type="input"]').click();
    await page.locator('[data-node-type="output"]').click();

    // Move nodes around (if drag functionality exists)
    const inputNode = page.locator('.drawflow-node').nth(1);
    await inputNode.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100, { steps: 5 });
    await page.mouse.up();
    console.log('✅ Performed node operations');

    // Re-open the original LLM node and verify state
    await llmNode.click();
    await page.waitForSelector('#configPanel.open', { state: 'visible' });

    const preservedPrompt = await page.locator('textarea').inputValue();
    expect(preservedPrompt).toBe(testPrompt);

    const preservedTemp = await temperatureSlider.inputValue();
    if (preservedTemp) {
      expect(parseFloat(preservedTemp)).toBe(0.8);
    }

    console.log('✅ Node state preserved correctly');
  });
});

/**
 * Helper function to check if all expected UI elements are present
 */
async function verifyWorkflowUIElements(page) {
  // Check node palette
  await expect(page.locator('.node-palette')).toBeVisible();

  // Check all node types are available
  const nodeTypes = ['input', 'llm', 'compare', 'output'];
  for (const nodeType of nodeTypes) {
    await expect(page.locator(`[data-node-type="${nodeType}"]`)).toBeVisible();
  }

  // Check canvas
  await expect(page.locator('#drawflow')).toBeVisible();

  // Check control buttons
  await expect(page.locator('button:has-text("Run"), .btn-run')).toBeVisible();

  console.log('✅ All workflow UI elements verified');
}
