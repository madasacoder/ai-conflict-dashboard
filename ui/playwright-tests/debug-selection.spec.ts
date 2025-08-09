import { test, expect } from '@playwright/test'
import { dragNodeToCanvas, waitForNode } from './helpers/dragDrop'

test('debug selection', async ({ page }) => {
  await page.goto('/')
  const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
  await launchButton.click()
  await page.waitForSelector('[data-testid="workflow-builder"]')
  await page.waitForSelector('.node-palette')
  
  // Add first node
  await dragNodeToCanvas(page, 'input', { x: 200, y: 200 })
  await waitForNode(page)
  
  // Check selection
  const firstNodeClasses = await page.locator('.react-flow__node').first().getAttribute('class')
  console.log('First node classes after creation:', firstNodeClasses)
  
  // Add second node
  await dragNodeToCanvas(page, 'llm', { x: 400, y: 200 })
  await page.waitForTimeout(500)
  
  // Check both nodes
  const firstNodeClassesAfter = await page.locator('.react-flow__node').first().getAttribute('class')
  const secondNodeClasses = await page.locator('.react-flow__node').nth(1).getAttribute('class')
  
  console.log('First node classes after second:', firstNodeClassesAfter)
  console.log('Second node classes:', secondNodeClasses)
  
  // Check config panel
  const configPanel = page.locator('[data-testid="node-config-panel"]')
  const isConfigVisible = await configPanel.isVisible()
  console.log('Config panel visible:', isConfigVisible)
  
  // Check store state
  const storeState = await page.evaluate(() => {
    // If store is exposed for debugging
    return {
      isConfigPanelOpen: (window as any).workflowStore?.isConfigPanelOpen,
      selectedNode: (window as any).workflowStore?.selectedNode
    }
  })
  console.log('Store state:', storeState)
})
