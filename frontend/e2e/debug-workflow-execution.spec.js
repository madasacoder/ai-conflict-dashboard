/**
 * Debug Workflow Execution
 * Find out why workflow isn't executing
 */

import { test, expect } from '@playwright/test';

test('debug why workflow execution is not working', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('http://localhost:3000/workflow-builder.html');
  await page.waitForLoadState('networkidle');

  // Check if workflowBuilder exists
  const hasWorkflowBuilder = await page.evaluate(() => {
    return typeof window.workflowBuilder !== 'undefined';
  });
  console.log('workflowBuilder exists:', hasWorkflowBuilder);

  // Check if runWorkflow function exists
  const hasRunWorkflow = await page.evaluate(() => {
    return typeof window.workflowBuilder?.runWorkflow === 'function';
  });
  console.log('runWorkflow function exists:', hasRunWorkflow);

  // Try calling runWorkflow directly
  console.log('\nCalling runWorkflow directly...');
  
  const result = await page.evaluate(async () => {
    try {
      if (window.workflowBuilder && window.workflowBuilder.runWorkflow) {
        console.log('Calling runWorkflow...');
        await window.workflowBuilder.runWorkflow();
        return 'Called successfully';
      } else {
        return 'workflowBuilder.runWorkflow not found';
      }
    } catch (error) {
      return `Error: ${error.message}`;
    }
  });
  
  console.log('Result:', result);

  // Check the Run button
  const runButton = page.locator('button:has-text("Run")');
  const buttonExists = await runButton.count();
  console.log('\nRun button exists:', buttonExists > 0);
  
  if (buttonExists > 0) {
    const onclick = await runButton.getAttribute('onclick');
    console.log('Button onclick:', onclick);
    
    // Check button HTML
    const buttonHTML = await runButton.evaluate(el => el.outerHTML);
    console.log('Button HTML:', buttonHTML);
  }

  // Monitor console for errors when clicking
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  // Try clicking the button
  console.log('\nClicking Run button...');
  await runButton.click();
  
  await page.waitForTimeout(3000);
  
  console.log('\nTest complete');
});