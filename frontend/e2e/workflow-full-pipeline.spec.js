/**
 * Comprehensive E2E Workflow Pipeline Test
 * Tests: File Input → Analysis → Translation Chain → Comparison
 *
 * Flow: Story File → Enhancement Analysis (Ollama) → Chinese → French → English → Comparison
 * Purpose: Test complete multi-node workflow with real AI processing
 */

import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

test.describe('Full Pipeline Workflow E2E Tests', () => {
  let testStoryContent;
  let workflowId;

  test.beforeAll(async () => {
    // Download or create test story
    testStoryContent = await createTestStory();
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to workflow builder
    await page.goto('/workflow-builder.html');
    await page.waitForSelector('#drawflow', { state: 'visible' });

    // Ensure Ollama is running (prerequisite check)
    const ollamaStatus = await checkOllamaStatus(page);
    test.skip(!ollamaStatus, 'Ollama is not running - skipping pipeline test');
  });

  test('should complete full story translation and analysis pipeline', async ({ page }) => {
    // Set longer timeout for this comprehensive test
    test.setTimeout(300000); // 5 minutes

    console.log('🚀 Starting full pipeline test...');

    // Step 1: Create and configure input node
    console.log('📁 Setting up input node...');
    const inputNodeId = await createInputNode(page, testStoryContent);

    // Step 2: Create analysis node (Ollama)
    console.log('🧠 Setting up analysis node...');
    const analysisNodeId = await createAnalysisNode(page, {
      model: 'ollama:llama2', // Or your preferred Ollama model
      prompt: `Analyze this story and provide enhancement ideas. Consider:
      1. Character development opportunities
      2. Plot improvement suggestions  
      3. Narrative technique enhancements
      4. Dialogue improvements
      5. Setting and atmosphere refinements
      
      Story to analyze:`,
    });

    // Step 3: Create translation nodes
    console.log('🌐 Setting up translation chain...');
    const chineseNodeId = await createTranslationNode(
      page,
      'Chinese',
      'Translate this enhanced story to Chinese'
    );
    const frenchNodeId = await createTranslationNode(
      page,
      'French',
      'Translate this Chinese text to French'
    );
    const englishNodeId = await createTranslationNode(
      page,
      'English',
      'Translate this French text back to English'
    );

    // Step 4: Create comparison node
    console.log('🔍 Setting up comparison node...');
    const comparisonNodeId = await createComparisonNode(page, {
      prompt: `Compare these two English stories and analyze:
      1. How much the content changed through translation
      2. What story elements were preserved
      3. What was lost or gained in translation
      4. Overall translation quality assessment
      
      Original Story: {input1}
      Final Translated Story: {input2}`,
    });

    // Step 5: Connect all nodes in sequence
    console.log('🔗 Connecting workflow nodes...');
    await connectNodes(page, inputNodeId, analysisNodeId);
    await connectNodes(page, analysisNodeId, chineseNodeId);
    await connectNodes(page, chineseNodeId, frenchNodeId);
    await connectNodes(page, frenchNodeId, englishNodeId);

    // Connect comparison node (takes original input + final output)
    await connectNodes(page, inputNodeId, comparisonNodeId, 'input1');
    await connectNodes(page, englishNodeId, comparisonNodeId, 'input2');

    // Step 6: Execute the complete workflow
    console.log('▶️ Executing complete workflow...');
    const results = await executeWorkflow(page);

    // Step 7: Validate results
    console.log('✅ Validating results...');
    await validatePipelineResults(page, results, {
      originalStory: testStoryContent,
      expectedNodes: 6,
      expectedTranslations: 3,
    });

    console.log('🎉 Full pipeline test completed successfully!');
  });

  test('should handle pipeline failures gracefully', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes

    // Test with invalid model to trigger failure
    console.log('🚨 Testing failure handling...');

    const inputNodeId = await createInputNode(page, 'Short test story');
    const invalidNodeId = await createAnalysisNode(page, {
      model: 'ollama:nonexistent-model',
      prompt: 'This should fail',
    });

    await connectNodes(page, inputNodeId, invalidNodeId);

    // Execute and expect failure
    await expect(page.locator('.workflow-error')).toBeVisible({ timeout: 60000 });
    await expect(page.locator(':text("Model not found")')).toBeVisible();
  });

  test('should show progress during long pipeline execution', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes

    console.log('📊 Testing progress indicators...');

    // Create minimal pipeline
    const inputNodeId = await createInputNode(page, testStoryContent.substring(0, 500));
    const analysisNodeId = await createAnalysisNode(page, {
      model: 'ollama:llama2',
      prompt: 'Briefly analyze this story',
    });

    await connectNodes(page, inputNodeId, analysisNodeId);

    // Start execution and monitor progress
    await page.locator('button:has-text("Run Workflow")').click();

    // Should show progress indicators
    await expect(page.locator('.workflow-progress')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.node-status-running')).toBeVisible();

    // Wait for completion
    await expect(page.locator('.workflow-complete')).toBeVisible({ timeout: 120000 });
  });
});

/**
 * Helper Functions for Workflow Automation
 */

async function createTestStory() {
  // Create a sample story for testing
  return `The Old Lighthouse

  On a remote cliff overlooking the turbulent sea stood an old lighthouse that had guided ships safely to shore for over a century. Sarah, the lighthouse keeper's daughter, had grown up listening to the stories of brave sailors and tragic shipwrecks.

  One stormy night, she noticed a small boat struggling against the fierce waves. Without hesitation, she climbed to the top of the lighthouse and activated the powerful beam. Through the howling wind and driving rain, she guided the vessel to safety.

  As dawn broke, the grateful captain revealed he was carrying urgent medicine to the nearby island. Sarah's quick thinking had not only saved lives at sea but also helped save lives on land.

  The lighthouse stood as a symbol of hope, and Sarah understood why her father had dedicated his life to keeping its light burning bright.`;
}

async function checkOllamaStatus(page) {
  try {
    // Check if Ollama API is accessible
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:11434/api/tags');
        return res.ok;
      } catch (error) {
        return false;
      }
    });
    return response;
  } catch (error) {
    return false;
  }
}

async function createInputNode(page, content) {
  // Add input node
  await page.locator('[data-node-type="input"]').click();

  // Get the newly created node
  const nodes = page.locator('.drawflow-node');
  const nodeCount = await nodes.count();
  const newNode = nodes.nth(nodeCount - 1);

  // Configure input node
  await newNode.click();
  await expect(page.locator('#configPanel.open')).toBeVisible();

  // Set input type to text and add content
  await page.locator('select[onchange*="updateNodeData"]').selectOption('text');
  await page.locator('textarea, input[type="text"]').last().fill(content);

  // Close config panel
  await page.locator('#configPanel .close-btn, .config-close').click();

  return nodeCount; // Return node index as ID
}

async function createAnalysisNode(page, config) {
  // Add LLM analysis node
  await page.locator('[data-node-type="llm"]').click();

  const nodes = page.locator('.drawflow-node');
  const nodeCount = await nodes.count();
  const newNode = nodes.nth(nodeCount - 1);

  // Configure analysis node
  await newNode.click();
  await expect(page.locator('#configPanel.open')).toBeVisible();

  // Select Ollama model
  await page.locator('select:has(option:text-contains("Ollama"))').selectOption(config.model);

  // Set prompt
  await page.locator('textarea').fill(config.prompt);

  // Set temperature (optional)
  if (config.temperature) {
    await page.locator('input[type="range"]').fill(config.temperature.toString());
  }

  await page.locator('#configPanel .close-btn, .config-close').click();

  return nodeCount;
}

async function createTranslationNode(page, targetLanguage, prompt) {
  // Add translation node (using LLM node configured for translation)
  await page.locator('[data-node-type="llm"]').click();

  const nodes = page.locator('.drawflow-node');
  const nodeCount = await nodes.count();
  const newNode = nodes.nth(nodeCount - 1);

  // Configure translation node
  await newNode.click();
  await expect(page.locator('#configPanel.open')).toBeVisible();

  // Set translation prompt
  const translationPrompt = `${prompt}. Provide only the translation, no additional commentary.`;
  await page.locator('textarea').fill(translationPrompt);

  // Add label for identification
  await page
    .locator('input[placeholder*="label"], input[placeholder*="name"]')
    .fill(`Translate to ${targetLanguage}`);

  await page.locator('#configPanel .close-btn, .config-close').click();

  return nodeCount;
}

async function createComparisonNode(page, config) {
  // Add comparison node
  await page.locator('[data-node-type="compare"]').click();

  const nodes = page.locator('.drawflow-node');
  const nodeCount = await nodes.count();
  const newNode = nodes.nth(nodeCount - 1);

  // Configure comparison
  await newNode.click();
  await expect(page.locator('#configPanel.open')).toBeVisible();

  // Set comparison type and prompt
  await page.locator('select').selectOption('differences');
  await page.locator('textarea').fill(config.prompt);

  await page.locator('#configPanel .close-btn, .config-close').click();

  return nodeCount;
}

async function connectNodes(page, sourceNodeIndex, targetNodeIndex, targetInput = null) {
  // Get nodes by index
  const sourceNode = page.locator('.drawflow-node').nth(sourceNodeIndex);
  const targetNode = page.locator('.drawflow-node').nth(targetNodeIndex);

  // Find output point on source node
  const sourceOutput = sourceNode.locator('.output, .drawflow_output');

  // Find input point on target node (specific input if provided)
  const targetInputSelector = targetInput
    ? `.input[data-input="${targetInput}"], .drawflow_input[data-input="${targetInput}"]`
    : '.input, .drawflow_input';
  const targetInputEl = targetNode.locator(targetInputSelector);

  // Create connection by dragging from output to input
  await sourceOutput.hover();
  await page.mouse.down();

  await targetInputEl.hover();
  await page.mouse.up();

  // Verify connection was created
  await expect(page.locator('.connection, .drawflow-connection')).toBeVisible();
}

async function executeWorkflow(page) {
  // Start workflow execution
  await page.locator('button:has-text("Run Workflow"), .btn-run-workflow').click();

  // Wait for execution to complete (with generous timeout)
  await expect(page.locator('.workflow-complete, .execution-complete')).toBeVisible({
    timeout: 240000, // 4 minutes
  });

  // Get results
  const results = await page.locator('.workflow-results').textContent();
  return results;
}

async function validatePipelineResults(page, results, expectations) {
  // Validate that all expected nodes executed
  const executedNodes = await page.locator('.node-status-completed').count();
  expect(executedNodes).toBe(expectations.expectedNodes);

  // Check for translation outputs
  const translationResults = await page.locator('.translation-result').count();
  expect(translationResults).toBeGreaterThanOrEqual(expectations.expectedTranslations);

  // Validate comparison result exists
  await expect(page.locator('.comparison-result')).toBeVisible();

  // Check that final comparison contains analysis
  const comparisonText = await page.locator('.comparison-result').textContent();
  expect(comparisonText).toContain('translation');
  expect(comparisonText.length).toBeGreaterThan(100); // Substantial analysis

  // Validate no critical errors
  const errorNodes = await page.locator('.node-status-error').count();
  expect(errorNodes).toBe(0);

  console.log('✅ All pipeline validations passed');
}
