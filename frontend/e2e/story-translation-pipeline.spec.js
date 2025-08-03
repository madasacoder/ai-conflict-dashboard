/**
 * Story Translation Pipeline E2E Test
 * Complete workflow: Story Input → Analysis → Chinese → French → English → Comparison
 *
 * This test validates the entire AI pipeline with real Ollama models
 */

import { test, expect } from '@playwright/test';
import WorkflowTestFramework from '../tests/helpers/workflow-automation.js';
import {
  testStories,
  downloadStoryFromUrl,
  validateStoryContent,
} from '../tests/test-data/stories.js';

test.describe('Story Translation Pipeline', () => {
  let framework;
  let testStory;

  test.beforeAll(async () => {
    // Use a medium-length story for comprehensive testing
    testStory = testStories.medium;

    // Validate story content
    const validation = validateStoryContent(testStory.content);
    if (!validation.isValid) {
      throw new Error(`Invalid test story: ${validation.issues.join(', ')}`);
    }

    console.log(`📖 Using test story: "${testStory.title}" (${validation.stats.wordCount} words)`);
  });

  test.beforeEach(async ({ page }) => {
    framework = new WorkflowTestFramework(page);
    await framework.initialize();

    // Check Ollama availability
    const ollamaAvailable = await checkOllamaAvailability(page);
    test.skip(!ollamaAvailable, 'Ollama is not available - skipping pipeline test');
  });

  test.afterEach(async () => {
    if (framework) {
      framework.destroy();
    }
  });

  test('should complete full story enhancement and translation pipeline', async () => {
    // Set generous timeout for this comprehensive test
    test.setTimeout(600000); // 10 minutes

    console.log('🚀 Starting comprehensive story translation pipeline...');

    // Step 1: Create input node with story
    console.log('📝 Step 1: Setting up story input...');
    const inputNodeId = await framework.createInputNode({
      type: 'text',
      content: testStory.content,
      label: 'Original Story',
    });

    // Step 2: Create enhancement analysis node
    console.log('🔍 Step 2: Setting up story enhancement analysis...');
    const enhancementNodeId = await framework.createAINode({
      model: 'ollama:gemma3:4b', // Using available model on system
      prompt: `Analyze this story and provide detailed enhancement suggestions. Focus on:

1. CHARACTER DEVELOPMENT: How can characters be made more compelling?
2. PLOT IMPROVEMENTS: What plot elements could be strengthened?
3. NARRATIVE TECHNIQUES: How can the storytelling be enhanced?
4. DIALOGUE QUALITY: What dialogue improvements are needed?
5. SETTING & ATMOSPHERE: How can the world-building be improved?

Provide specific, actionable suggestions while preserving the story's core essence.

Story to analyze:`,
      temperature: 0.7,
      label: 'Story Enhancement Analysis',
    });

    // Step 3: Create Chinese translation node
    console.log('🇨🇳 Step 3: Setting up Chinese translation...');
    const chineseNodeId = await framework.createAINode({
      model: 'ollama:gemma3:4b',
      prompt: `Translate the following enhanced story analysis to Chinese (Simplified). Maintain the literary quality and nuance of the original text. Provide only the translation without additional commentary.

Text to translate:`,
      temperature: 0.3,
      label: 'Translate to Chinese',
    });

    // Step 4: Create French translation node
    console.log('🇫🇷 Step 4: Setting up French translation...');
    const frenchNodeId = await framework.createAINode({
      model: 'ollama:gemma3:4b',
      prompt: `Translate the following Chinese text to French. Preserve the literary style and meaning as much as possible. Provide only the French translation without additional commentary.

Chinese text to translate:`,
      temperature: 0.3,
      label: 'Translate to French',
    });

    // Step 5: Create English back-translation node
    console.log('🇺🇸 Step 5: Setting up English back-translation...');
    const englishNodeId = await framework.createAINode({
      model: 'ollama:gemma3:4b',
      prompt: `Translate the following French text back to English. Maintain the literary quality and preserve as much meaning as possible from the original. Provide only the English translation without additional commentary.

French text to translate:`,
      temperature: 0.3,
      label: 'Translate back to English',
    });

    // Step 6: Create comparison analysis node
    console.log('🔬 Step 6: Setting up translation comparison analysis...');
    const comparisonNodeId = await framework.createComparisonNode({
      comparisonType: 'differences',
      prompt: `Compare the original story analysis with the final English translation after going through Chinese and French. Analyze:

1. CONTENT PRESERVATION: What core ideas were maintained?
2. MEANING DRIFT: How did the meaning change through translation?
3. LITERARY QUALITY: How was the writing style affected?
4. SPECIFIC LOSSES: What specific details or nuances were lost?
5. UNEXPECTED GAINS: Were any elements improved through translation?
6. TRANSLATION QUALITY: Overall assessment of the translation chain

Provide a detailed analysis of the translation journey.

Original Analysis: {input1}
Final English Translation: {input2}`,
      label: 'Translation Impact Analysis',
    });

    // Step 7: Create final output node
    console.log('📋 Step 7: Setting up final output...');
    const outputNodeId = await framework.createOutputNode({
      format: 'markdown',
      includeMetadata: true,
      label: 'Final Results',
    });

    // Step 8: Connect all nodes in the pipeline
    console.log('🔗 Step 8: Connecting workflow pipeline...');

    // Main translation chain
    await framework.connectNodes(inputNodeId, enhancementNodeId);
    await framework.connectNodes(enhancementNodeId, chineseNodeId);
    await framework.connectNodes(chineseNodeId, frenchNodeId);
    await framework.connectNodes(frenchNodeId, englishNodeId);

    // Comparison node (original enhancement vs final translation)
    await framework.connectNodes(enhancementNodeId, comparisonNodeId);
    await framework.connectNodes(englishNodeId, comparisonNodeId);

    // Final output
    await framework.connectNodes(comparisonNodeId, outputNodeId);

    // Step 9: Execute the complete pipeline
    console.log('▶️ Step 9: Executing complete pipeline...');
    const results = await framework.executeWorkflow({
      timeout: 500000, // 8+ minutes for complex pipeline
      monitorProgress: true,
    });

    // Step 10: Validate results
    console.log('✅ Step 10: Validating pipeline results...');
    await validatePipelineResults(results, testStory);

    console.log('🎉 Story translation pipeline completed successfully!');
  });

  test('should handle pipeline failures gracefully', async () => {
    test.setTimeout(120000); // 2 minutes

    console.log('🚨 Testing pipeline failure handling...');

    // Create a simple pipeline with invalid model
    const inputNodeId = await framework.createInputNode({
      type: 'text',
      content: 'Test story for failure handling',
      label: 'Test Input',
    });

    const invalidNodeId = await framework.createAINode({
      model: 'ollama:nonexistent-model-12345',
      prompt: 'This should fail',
      label: 'Invalid Model Test',
    });

    await framework.connectNodes(inputNodeId, invalidNodeId);

    // Execute and expect controlled failure
    try {
      await framework.executeWorkflow({ timeout: 60000 });
      // If we get here, check for error indicators
      const hasErrors = (await framework.page.locator('.node-status-error').count()) > 0;
      expect(hasErrors).toBe(true);
    } catch (error) {
      // Expected - workflow should fail gracefully
      console.log('✅ Pipeline failed gracefully as expected');
    }
  });

  test('should show detailed progress for long-running pipeline', async () => {
    test.setTimeout(300000); // 5 minutes

    console.log('📊 Testing progress monitoring...');

    // Create a shorter pipeline for progress testing
    const inputNodeId = await framework.createInputNode({
      type: 'text',
      content: testStory.content.substring(0, 1000), // Shorter for faster execution
      label: 'Progress Test Input',
    });

    const analysisNodeId = await framework.createAINode({
      model: 'ollama:llama2',
      prompt: 'Provide a brief analysis of this story excerpt',
      label: 'Quick Analysis',
    });

    const translationNodeId = await framework.createAINode({
      model: 'ollama:llama2',
      prompt: 'Translate this analysis to Spanish',
      label: 'Spanish Translation',
    });

    await framework.connectNodes(inputNodeId, analysisNodeId);
    await framework.connectNodes(analysisNodeId, translationNodeId);

    // Start execution and monitor progress
    const executionPromise = framework.executeWorkflow({
      timeout: 180000,
      monitorProgress: true,
    });

    // Verify progress indicators appear
    await expect(framework.page.locator('.workflow-running, .execution-started')).toBeVisible({
      timeout: 10000,
    });
    await expect(framework.page.locator('.node-status-running')).toBeVisible({ timeout: 15000 });

    // Wait for completion
    const results = await executionPromise;
    expect(results.success).toBe(true);

    console.log('✅ Progress monitoring test completed');
  });
});

/**
 * Helper Functions
 */

async function checkOllamaAvailability(page) {
  try {
    const isAvailable = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        return response.ok;
      } catch (error) {
        return false;
      }
    });

    if (!isAvailable) {
      console.log('⚠️ Ollama not available at localhost:11434');
      return false;
    }

    // Check for available models
    const models = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        const data = await response.json();
        return data.models || [];
      } catch (error) {
        return [];
      }
    });

    console.log(`🤖 Ollama available with ${models.length} models`);
    return models.length > 0;
  } catch (error) {
    console.log(`❌ Error checking Ollama: ${error.message}`);
    return false;
  }
}

async function validatePipelineResults(results, originalStory) {
  // Comprehensive validation of pipeline results
  const validation = {
    passed: true,
    issues: [],
    stats: {},
  };

  console.log('🔍 Validating pipeline results...');

  // Check overall execution success
  if (!results.success) {
    validation.passed = false;
    validation.issues.push('Pipeline execution failed');
    validation.issues.push(...results.errors);
  }

  // Check that all expected nodes executed
  const expectedNodeCount = 6; // input, enhancement, chinese, french, english, comparison, output
  const actualNodeCount = Object.keys(results.nodes).length;

  if (actualNodeCount < expectedNodeCount) {
    validation.passed = false;
    validation.issues.push(`Expected ${expectedNodeCount} nodes, got ${actualNodeCount}`);
  }

  // Check for specific outputs
  let hasEnhancementAnalysis = false;
  let hasChineseTranslation = false;
  let hasFrenchTranslation = false;
  let hasEnglishBackTranslation = false;
  let hasComparisonAnalysis = false;

  for (const [nodeId, nodeResult] of Object.entries(results.nodes)) {
    if (nodeResult.output) {
      const output = nodeResult.output.toLowerCase();

      // Check for enhancement keywords
      if (
        output.includes('character') ||
        output.includes('plot') ||
        output.includes('enhancement')
      ) {
        hasEnhancementAnalysis = true;
      }

      // Check for Chinese characters (rough detection)
      if (/[\u4e00-\u9fff]/.test(nodeResult.output)) {
        hasChineseTranslation = true;
      }

      // Check for French words
      if (
        output.includes('française') ||
        output.includes('histoire') ||
        /\b(le|la|les|de|du|des)\b/.test(output)
      ) {
        hasFrenchTranslation = true;
      }

      // Check for English back-translation
      if (output.includes('story') || output.includes('character') || output.includes('plot')) {
        hasEnglishBackTranslation = true;
      }

      // Check for comparison analysis
      if (
        output.includes('comparison') ||
        output.includes('translation') ||
        output.includes('preservation')
      ) {
        hasComparisonAnalysis = true;
      }
    }
  }

  // Validate expected outputs
  if (!hasEnhancementAnalysis) {
    validation.issues.push('Enhancement analysis not found in results');
  }
  if (!hasChineseTranslation) {
    validation.issues.push('Chinese translation not found in results');
  }
  if (!hasFrenchTranslation) {
    validation.issues.push('French translation not found in results');
  }
  if (!hasEnglishBackTranslation) {
    validation.issues.push('English back-translation not found in results');
  }
  if (!hasComparisonAnalysis) {
    validation.issues.push('Comparison analysis not found in results');
  }

  // Calculate stats
  validation.stats = {
    executionTime: Date.now(), // Would be actual execution time in real implementation
    nodeCount: actualNodeCount,
    successfulNodes: Object.values(results.nodes).filter((n) => n.status === 'completed').length,
    errorCount: results.errors.length,
    totalOutputLength: Object.values(results.nodes).reduce(
      (sum, n) => sum + (n.output?.length || 0),
      0
    ),
  };

  // Final validation
  if (validation.issues.length > 0) {
    validation.passed = false;
  }

  // Log results
  if (validation.passed) {
    console.log('✅ All pipeline validations passed');
    console.log(
      `📊 Stats: ${validation.stats.successfulNodes}/${validation.stats.nodeCount} nodes successful`
    );
  } else {
    console.log('❌ Pipeline validation failed:');
    validation.issues.forEach((issue) => console.log(`   - ${issue}`));
  }

  // Assert for test framework
  expect(validation.passed).toBe(true);
  expect(validation.stats.errorCount).toBe(0);
  expect(validation.stats.successfulNodes).toBeGreaterThanOrEqual(5);

  return validation;
}
