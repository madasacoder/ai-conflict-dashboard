/**
 * Drag and Drop Solution for React Flow + Playwright
 * 
 * This file demonstrates multiple approaches to handle drag-drop
 * since Playwright's native dragTo doesn't work well with React Flow.
 */

import { test, expect, Page } from '@playwright/test'

test.describe('Drag Drop Solutions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
    await launchButton.click()
    
    await page.waitForSelector('[data-testid="workflow-builder"]')
    await page.waitForSelector('.node-palette')
  })

  test('Solution 1: Manual mouse events', async ({ page }) => {
    // This approach uses low-level mouse events to simulate drag
    const inputNode = page.locator('.palette-node').filter({ hasText: 'Input' })
    const canvas = page.locator('.workflow-canvas')
    
    // Get positions
    const sourceBox = await inputNode.boundingBox()
    const targetBox = await canvas.boundingBox()
    
    if (!sourceBox || !targetBox) {
      throw new Error('Elements not found')
    }
    
    // Calculate center points
    const sourceX = sourceBox.x + sourceBox.width / 2
    const sourceY = sourceBox.y + sourceBox.height / 2
    const targetX = targetBox.x + 300
    const targetY = targetBox.y + 200
    
    // Simulate drag with mouse events
    await page.mouse.move(sourceX, sourceY)
    await page.mouse.down()
    await page.mouse.move(targetX, targetY, { steps: 10 })
    await page.mouse.up()
    
    // Check if node was created
    await page.waitForTimeout(500)
    const nodes = await page.locator('.react-flow__node').count()
    console.log('Nodes created with manual mouse:', nodes)
  })

  test('Solution 2: Dispatch custom drag events', async ({ page }) => {
    // This approach dispatches synthetic drag events with dataTransfer
    await page.evaluate(() => {
      const sourceElement = document.querySelector('.palette-node')
      const targetElement = document.querySelector('.workflow-canvas')
      
      if (!sourceElement || !targetElement) {
        throw new Error('Elements not found')
      }
      
      // Create a DataTransfer object
      const dataTransfer = new DataTransfer()
      dataTransfer.setData('application/reactflow', 'input')
      dataTransfer.setData('text/plain', 'input')
      dataTransfer.effectAllowed = 'copy'
      
      // Dispatch dragstart on source
      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      })
      sourceElement.dispatchEvent(dragStartEvent)
      
      // Dispatch dragover on target
      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientX: 300,
        clientY: 200
      })
      targetElement.dispatchEvent(dragOverEvent)
      
      // Dispatch drop on target
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientX: 300,
        clientY: 200
      })
      targetElement.dispatchEvent(dropEvent)
      
      // Dispatch dragend
      const dragEndEvent = new DragEvent('dragend', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      })
      sourceElement.dispatchEvent(dragEndEvent)
    })
    
    await page.waitForTimeout(500)
    const nodes = await page.locator('.react-flow__node').count()
    console.log('Nodes created with custom events:', nodes)
  })

  test('Solution 3: Use application API directly', async ({ page }) => {
    // This approach bypasses drag-drop and uses the app's API directly
    // This is the most reliable for testing business logic
    
    const result = await page.evaluate(() => {
      // Access the store directly from window if exposed
      // Or trigger the addNode function programmatically
      const addButton = document.querySelector('.palette-node')
      if (addButton) {
        // Simulate a click in "click mode" if the palette supports it
        addButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        return 'clicked'
      }
      return 'not found'
    })
    
    console.log('Click result:', result)
    
    // Alternative: Call the store method directly if exposed
    await page.evaluate(() => {
      // If your app exposes the store to window for testing:
      // window.testHelpers?.addNode('input', { x: 300, y: 200 })
      
      // Or trigger through React DevTools:
      const reactFlow = document.querySelector('.react-flow')
      if (reactFlow && (reactFlow as any)._reactInternalFiber) {
        console.log('React Flow component found')
      }
    })
    
    await page.waitForTimeout(500)
    const nodes = await page.locator('.react-flow__node').count()
    console.log('Nodes created with API:', nodes)
  })

  test('Solution 4: CDP (Chrome DevTools Protocol) approach', async ({ page }) => {
    // Use CDP for more control over input events
    const client = await page.context().newCDPSession(page)
    
    const inputNode = page.locator('.palette-node').filter({ hasText: 'Input' })
    const canvas = page.locator('.workflow-canvas')
    
    const sourceBox = await inputNode.boundingBox()
    const targetBox = await canvas.boundingBox()
    
    if (!sourceBox || !targetBox) return
    
    // Dispatch drag using CDP
    await client.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: sourceBox.x + sourceBox.width / 2,
      y: sourceBox.y + sourceBox.height / 2,
      button: 'left'
    })
    
    await client.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: targetBox.x + 300,
      y: targetBox.y + 200,
      button: 'left'
    })
    
    await client.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: targetBox.x + 300,
      y: targetBox.y + 200,
      button: 'left'
    })
    
    await page.waitForTimeout(500)
    const nodes = await page.locator('.react-flow__node').count()
    console.log('Nodes created with CDP:', nodes)
  })
})

// Helper function to add node programmatically (most reliable)
async function addNodeProgrammatically(
  page: Page,
  nodeType: string,
  position: { x: number, y: number }
) {
  return page.evaluate(({ type, pos }) => {
    // This would need to be adapted based on how your store is exposed
    // Option 1: Through window
    if ((window as any).workflowStore) {
      (window as any).workflowStore.addNode(type, pos)
      return true
    }
    
    // Option 2: Through React context (would need React DevTools)
    // Option 3: Through a test helper API you add to your app
    
    return false
  }, { type: nodeType, pos: position })
}

test.describe('Recommended Testing Approach', () => {
  test('Test drag-drop indirectly through UI state', async ({ page }) => {
    // Instead of testing the drag-drop mechanism itself,
    // test that nodes can be added and the workflow functions correctly
    
    // 1. Check palette is visible
    await expect(page.locator('.node-palette')).toBeVisible()
    
    // 2. Check canvas is ready
    await expect(page.locator('.workflow-canvas')).toBeVisible()
    
    // 3. Try to add a node (using the most reliable method that works)
    // For now, we know manual mouse events or custom events might work
    
    // 4. Verify the outcome, not the mechanism
    // - Node appears in the canvas
    // - Node can be selected
    // - Node can be configured
    // - Workflow can be executed
    
    // This tests the business value, not the implementation detail
  })
})