/**
 * Test Connection Visual Feedback
 * Verifies that connection creation provides proper visual feedback
 */

import { test, expect } from '@playwright/test';

test('connection visual feedback', async ({ page }) => {
  test.setTimeout(60000); // 1 minute

  // Go to workflow builder
  await page.goto('http://localhost:3000/workflow-builder.html');
  await page.waitForLoadState('networkidle');

  console.log('\n🎯 Testing Connection Visual Feedback');
  console.log('═'.repeat(70));

  // Create two nodes
  console.log('\n1️⃣ Creating nodes...');

  // Create input node
  await page.locator('div[data-node-type="input"]').click();
  await page.waitForTimeout(500);

  // Create LLM node
  await page.locator('div[data-node-type="llm"]').click();
  await page.waitForTimeout(500);

  console.log('✅ Nodes created');

  // Test 1: Hover effects on connection points
  console.log('\n2️⃣ Testing connection point hover effects...');

  // Find output point on first node
  const outputPoint = page.locator('.drawflow-node').first().locator('.output').first();
  await outputPoint.hover();
  await page.waitForTimeout(500);

  // Check if hover state is applied
  const outputStyle = await outputPoint.evaluate((el) => {
    return window.getComputedStyle(el);
  });

  console.log('Output point hover state:', {
    cursor: outputStyle.cursor,
    transform: outputStyle.transform,
  });

  // Take screenshot of hover state
  await page.screenshot({
    path: 'test-results/connection-hover-state.png',
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 },
  });

  // Test 2: Connection creation visual feedback
  console.log('\n3️⃣ Testing connection creation feedback...');

  // Create connection programmatically and observe visual feedback
  const connectionCreated = await page.evaluate(() => {
    // Listen for visual changes
    const visualChanges = [];

    // Create connection
    if (window.workflowBuilder && window.workflowBuilder.editor) {
      // Monitor node classes
      const node1 = document.getElementById('node-1');
      const node2 = document.getElementById('node-2');

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            visualChanges.push({
              nodeId: mutation.target.id,
              classes: mutation.target.className,
            });
          }
        });
      });

      if (node1) observer.observe(node1, { attributes: true });
      if (node2) observer.observe(node2, { attributes: true });

      // Create connection
      window.workflowBuilder.editor.addConnection(1, 2, 'output_1', 'input_1');

      // Stop observing after a short delay
      setTimeout(() => {
        observer.disconnect();
      }, 1000);

      return true;
    }
    return false;
  });

  expect(connectionCreated).toBe(true);
  await page.waitForTimeout(1500); // Wait for visual feedback

  // Test 3: Connection line styling
  console.log('\n4️⃣ Testing connection line styling...');

  // Check if connection line exists
  const connectionLine = page.locator('svg .connection').first();
  const connectionExists = await connectionLine.isVisible();
  expect(connectionExists).toBe(true);

  // Get connection styles
  const connectionStyles = await connectionLine.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    return {
      stroke: styles.stroke,
      strokeWidth: styles.strokeWidth,
      opacity: styles.opacity,
    };
  });

  console.log('Connection line styles:', connectionStyles);

  // Test 4: Node visual feedback after connection
  console.log('\n5️⃣ Checking node visual feedback...');

  const nodeClasses = await page.evaluate(() => {
    const node1 = document.getElementById('node-1');
    const node2 = document.getElementById('node-2');
    return {
      node1: node1?.className || '',
      node2: node2?.className || '',
    };
  });

  console.log('Node classes after connection:', nodeClasses);

  // Take final screenshot
  await page.screenshot({
    path: 'test-results/connection-visual-feedback.png',
    fullPage: true,
  });

  // Test 5: Connection hover effect
  console.log('\n6️⃣ Testing connection hover effect...');

  await connectionLine.hover();
  await page.waitForTimeout(500);

  const hoverStyles = await connectionLine.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    return {
      stroke: styles.stroke,
      strokeWidth: styles.strokeWidth,
      opacity: styles.opacity,
    };
  });

  console.log('Connection hover styles:', hoverStyles);

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('VISUAL FEEDBACK TEST SUMMARY:');
  console.log('═'.repeat(70));
  console.log('Connection created:', connectionExists ? '✅' : '❌');
  console.log('Connection styled:', connectionStyles.stroke ? '✅' : '❌');
  console.log('Hover effects:', outputStyle.cursor === 'crosshair' ? '✅' : '❌');
  console.log('Screenshots saved:', '✅');
  console.log('═'.repeat(70));
});
