import { test, expect } from '@playwright/test'

test('simple drag test', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
  await launchButton.click()
  
  await page.waitForSelector('[data-testid="workflow-builder"]')
  await page.waitForSelector('.node-palette')
  
  // Try simple drag
  const inputNode = page.locator('.palette-node').filter({ hasText: 'Input' })
  const canvas = page.locator('.workflow-canvas')
  
  console.log('Input node visible:', await inputNode.isVisible())
  console.log('Canvas visible:', await canvas.isVisible())
  
  // Try drag and drop
  await inputNode.dragTo(canvas, {
    targetPosition: { x: 300, y: 200 }
  })
  
  // Wait a bit for React Flow to process
  await page.waitForTimeout(1000)
  
  // Check for any nodes
  const anyNodes = await page.locator('.react-flow__node').count()
  console.log('React Flow nodes count:', anyNodes)
  
  const rfNodes = await page.locator('[data-testid*="rf__node"]').count()
  console.log('RF test-id nodes count:', rfNodes)
  
  const reactFlowNodeElements = await page.locator('.react-flow__nodes').count()
  console.log('React Flow nodes container count:', reactFlowNodeElements)
})
