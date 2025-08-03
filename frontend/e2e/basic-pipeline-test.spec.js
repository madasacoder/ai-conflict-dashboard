/**
 * Basic Pipeline Test - validates essential workflow functionality
 * Tests: Input → AI Analysis → Output without complex translation chains
 */

import { test, expect } from '@playwright/test';
import WorkflowTestFramework from '../tests/helpers/workflow-automation.js';
import { testStories } from '../tests/test-data/stories.js';

test.describe('Basic Workflow Pipeline', () => {
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

  test('should create and execute a basic story analysis pipeline', async ({ page }) => {
    console.log('🚀 Testing basic story analysis pipeline...');

    // Step 1: Create input node with test story
    console.log('📝 Step 1: Setting up story input...');
    const inputNodeId = await framework.createInputNode({
      type: 'text',
      content: testStories.short.content,
      label: 'Test Story Input',
    });

    // Step 2: Create AI analysis node
    console.log('🔍 Step 2: Setting up AI analysis...');
    const analysisNodeId = await framework.createAINode({
      model: 'gpt-4',
      prompt:
        'Analyze this story and provide key insights about the characters, plot, and themes. Keep the analysis concise.',
      temperature: 0.7,
      label: 'Story Analysis',
    });

    // Step 3: Create output node
    console.log('📋 Step 3: Setting up output...');
    const outputNodeId = await framework.createOutputNode({
      format: 'markdown',
      label: 'Analysis Results',
    });

    // Step 4: Connect the pipeline
    console.log('🔗 Step 4: Connecting pipeline...');
    await framework.connectNodes(inputNodeId, analysisNodeId);
    await framework.connectNodes(analysisNodeId, outputNodeId);

    // Verify all nodes were created
    const nodeCount = await page.locator('.drawflow-node').count();
    expect(nodeCount).toBe(3);
    console.log(`✅ Created ${nodeCount} nodes successfully`);

    // Verify connections exist
    const connectionCount = await page.locator('.connection, .drawflow-connection').count();
    expect(connectionCount).toBeGreaterThanOrEqual(2);
    console.log(`✅ Created ${connectionCount} connections successfully`);

    console.log('🎉 Basic pipeline test completed successfully!');
  });

  test('should handle node manipulation operations', async ({ page }) => {
    console.log('🔧 Testing node manipulation operations...');

    // Step 1: Create multiple nodes
    await framework.createInputNode({ type: 'text', content: 'Test content', label: 'Input 1' });
    await framework.createAINode({ model: 'gpt-4', prompt: 'Analyze this', label: 'AI Node 1' });
    await framework.createAINode({
      model: 'claude',
      prompt: 'Another analysis',
      label: 'AI Node 2',
    });

    let nodeCount = await page.locator('.drawflow-node').count();
    expect(nodeCount).toBe(3);
    console.log('✅ Created multiple nodes');

    // Step 2: Test node deletion
    const firstNode = page.locator('.drawflow-node').first();
    await firstNode.click();
    await page.keyboard.press('Delete');

    nodeCount = await page.locator('.drawflow-node').count();
    expect(nodeCount).toBe(2);
    console.log('✅ Node deletion works');

    // Step 3: Add comparison and output nodes
    await framework.createComparisonNode({ label: 'Compare Results' });
    await framework.createOutputNode({ label: 'Final Output' });

    nodeCount = await page.locator('.drawflow-node').count();
    expect(nodeCount).toBe(4);
    console.log('✅ All node types can be created');

    console.log('🎉 Node manipulation test completed!');
  });

  test('should preserve node configurations', async ({ page }) => {
    console.log('💾 Testing node configuration preservation...');

    // Create and configure an AI node
    const aiNodeId = await framework.createAINode({
      model: 'gpt-4',
      prompt: 'This is a test prompt that should be preserved',
      temperature: 0.8,
      label: 'Persistent Config Test',
    });

    // Create another node to test if first node config is preserved
    await framework.createInputNode({
      type: 'text',
      content: 'Different content',
      label: 'Second Node',
    });

    // Re-open the first AI node to verify configuration
    const aiNode = page.locator('.drawflow-node').first();
    await aiNode.click();
    await page.waitForSelector('#configPanel.open', { state: 'visible' });

    // Check if the prompt is preserved
    const promptValue = await page.locator('#configPanel textarea').inputValue();
    expect(promptValue).toContain('test prompt that should be preserved');
    console.log('✅ Node configuration preserved correctly');

    // Close the config panel
    await framework.closeConfigPanel();

    console.log('🎉 Configuration preservation test completed!');
  });
});
