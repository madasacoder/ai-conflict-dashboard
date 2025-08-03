/**
 * Simple Connection Visual Feedback Test
 * Tests just the visual CSS without complex interactions
 */

import { test, expect } from '@playwright/test';

test('simple connection visual feedback test', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('http://localhost:3000/workflow-builder.html');
  await page.waitForLoadState('networkidle');

  console.log('\n🎯 Testing Connection Visual CSS');
  console.log('═'.repeat(70));

  // Create and position nodes manually
  console.log('\n1️⃣ Creating and positioning nodes...');

  await page.evaluate(() => {
    const editor = window.workflowBuilder.editor;

    // Add input node at position
    editor.addNode(
      'input',
      1,
      1,
      100,
      200,
      'input',
      {
        type: 'text',
        content: 'Test input',
      },
      `<div class="title"><span>📥</span><span>Input</span></div>`
    );

    // Add LLM node at position
    editor.addNode(
      'llm',
      1,
      1,
      400,
      200,
      'llm',
      {
        models: ['ollama'],
        prompt: 'Test prompt',
      },
      `<div class="title"><span>🧠</span><span>LLM</span></div>`
    );

    // Create connection
    editor.addConnection(1, 2, 'output_1', 'input_1');

    return true;
  });

  await page.waitForTimeout(1000);
  console.log('✅ Nodes created and connected');

  // Test CSS styles are applied
  console.log('\n2️⃣ Checking CSS styles...');

  // Check connection line styles
  const connectionStyles = await page.evaluate(() => {
    const connection = document.querySelector('svg .connection');
    if (!connection) return null;

    const styles = window.getComputedStyle(connection);
    return {
      stroke: styles.stroke,
      strokeWidth: styles.strokeWidth,
      opacity: styles.opacity,
      hasClass: connection.classList.contains('connection'),
    };
  });

  console.log('Connection styles:', connectionStyles);
  expect(connectionStyles).not.toBeNull();
  expect(connectionStyles.hasClass).toBe(true);

  // Check connection points
  const connectionPointStyles = await page.evaluate(() => {
    const output = document.querySelector('.drawflow .output');
    const input = document.querySelector('.drawflow .input');

    if (!output || !input) return null;

    const outputStyles = window.getComputedStyle(output);
    const inputStyles = window.getComputedStyle(input);

    return {
      output: {
        width: outputStyles.width,
        height: outputStyles.height,
        borderRadius: outputStyles.borderRadius,
        cursor: outputStyles.cursor,
        background: outputStyles.background,
      },
      input: {
        width: inputStyles.width,
        height: inputStyles.height,
        borderRadius: inputStyles.borderRadius,
        cursor: inputStyles.cursor,
        background: inputStyles.background,
      },
    };
  });

  console.log('\nConnection point styles:', connectionPointStyles);
  expect(connectionPointStyles).not.toBeNull();

  // Test hover simulation
  console.log('\n3️⃣ Testing hover state simulation...');

  await page.evaluate(() => {
    const connection = document.querySelector('svg .connection');
    if (connection) {
      // Simulate hover by adding class
      connection.classList.add('hover-test');
      connection.style.strokeWidth = '5px';
      connection.style.stroke = '#0056b3';
    }

    const output = document.querySelector('.drawflow .output');
    if (output) {
      output.style.transform = 'scale(1.3)';
      output.style.background = '#0056b3';
    }
  });

  await page.waitForTimeout(500);

  // Test connection feedback animation
  console.log('\n4️⃣ Testing connection feedback...');

  await page.evaluate(() => {
    // Test the showConnectionFeedback method
    if (window.workflowBuilder && window.workflowBuilder.showConnectionFeedback) {
      window.workflowBuilder.showConnectionFeedback(1, 2, 'success');
    }

    // Also test node highlighting
    const node1 = document.getElementById('node-1');
    const node2 = document.getElementById('node-2');

    if (node1) node1.classList.add('connection-source');
    if (node2) node2.classList.add('connection-target');
  });

  await page.waitForTimeout(1000);

  // Take screenshots
  await page.screenshot({
    path: 'test-results/connection-visual-css.png',
    fullPage: true,
  });

  // Check final state
  const visualState = await page.evaluate(() => {
    return {
      hasConnection: !!document.querySelector('svg .connection'),
      hasInputPoints: document.querySelectorAll('.input').length,
      hasOutputPoints: document.querySelectorAll('.output').length,
      node1Classes: document.getElementById('node-1')?.className || '',
      node2Classes: document.getElementById('node-2')?.className || '',
    };
  });

  console.log('\nFinal visual state:', visualState);

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('VISUAL FEEDBACK CSS TEST SUMMARY:');
  console.log('═'.repeat(70));
  console.log('Connection rendered:', visualState.hasConnection ? '✅' : '❌');
  console.log('Connection styled:', connectionStyles?.stroke ? '✅' : '❌');
  console.log('Input points:', visualState.hasInputPoints > 0 ? '✅' : '❌');
  console.log('Output points:', visualState.hasOutputPoints > 0 ? '✅' : '❌');
  console.log('Hover cursor:', connectionPointStyles?.output.cursor === 'crosshair' ? '✅' : '❌');
  console.log(
    'Node classes applied:',
    visualState.node1Classes.includes('drawflow-node') ? '✅' : '❌'
  );
  console.log('═'.repeat(70));
});
