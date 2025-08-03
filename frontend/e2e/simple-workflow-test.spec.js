/**
 * Simple workflow test to verify basic functionality
 */

import { test, expect } from '@playwright/test';
import WorkflowTestFramework from '../tests/helpers/workflow-automation.js';

test.describe('Simple Workflow Test', () => {
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

  test('should create input and AI nodes', async ({ page }) => {
    console.log('🧪 Testing input and AI node creation...');

    // Step 1: Create input node
    const inputNodeId = await framework.createInputNode({
      type: 'text',
      content: 'Test story content for debugging',
      label: 'Debug Input',
    });

    console.log(`✅ Created input node: ${inputNodeId}`);

    // Step 2: Create AI node
    const aiNodeId = await framework.createAINode({
      model: 'gpt-4',
      prompt: 'Analyze this test content',
      label: 'Debug AI',
    });

    console.log(`✅ Created AI node: ${aiNodeId}`);

    // Verify nodes were created
    const nodeCount = await page.locator('.drawflow-node').count();
    expect(nodeCount).toBe(2);

    console.log('✅ Simple workflow test completed');
  });
});
