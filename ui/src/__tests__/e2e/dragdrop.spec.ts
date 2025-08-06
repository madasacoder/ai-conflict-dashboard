/**
 * End-to-end tests for drag and drop functionality
 * Tests run in a real browser environment using Playwright
 */

import { test, expect } from '@playwright/test'

test.describe('Drag and Drop Workflow Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    
    // Handle the welcome screen - click "Launch Workflow Builder" button
    const launchButton = page.locator('button').filter({ hasText: 'Launch Workflow Builder' })
    if (await launchButton.isVisible({ timeout: 2000 })) {
      await launchButton.click()
    }
    
    // Wait for the workflow builder to load
    await page.waitForSelector('.workflow-canvas, .react-flow__renderer', { timeout: 10000 })
  })

  test('should drag input node from palette to canvas', async ({ page }) => {
    // Find the input node in the palette
    const inputNodePalette = page.locator('.node-palette-item').filter({ hasText: 'Input' }).first()
    await expect(inputNodePalette).toBeVisible()

    // Get the canvas
    const canvas = page.locator('.react-flow__renderer')
    await expect(canvas).toBeVisible()

    // Get canvas bounding box for drop position
    const canvasBounds = await canvas.boundingBox()
    if (!canvasBounds) throw new Error('Canvas not found')

    // Drag from palette to canvas
    await inputNodePalette.dragTo(canvas, {
      targetPosition: { x: 200, y: 200 }
    })

    // Wait for node to appear
    await page.waitForSelector('.workflow-node.input-node', { timeout: 5000 })

    // Verify the node was created
    const createdNode = page.locator('.workflow-node.input-node').first()
    await expect(createdNode).toBeVisible()
    await expect(createdNode).toContainText('Input')
  })

  test('should drag multiple node types and connect them', async ({ page }) => {
    // Add Input node
    const inputNodePalette = page.locator('.node-palette-item').filter({ hasText: 'Input' }).first()
    const canvas = page.locator('.react-flow__renderer')
    
    await inputNodePalette.dragTo(canvas, {
      targetPosition: { x: 100, y: 100 }
    })
    await page.waitForSelector('.workflow-node.input-node')

    // Add LLM node
    const llmNodePalette = page.locator('.node-palette-item').filter({ hasText: 'LLM' }).first()
    await llmNodePalette.dragTo(canvas, {
      targetPosition: { x: 300, y: 100 }
    })
    await page.waitForSelector('.workflow-node.llm-node')

    // Add Output node
    const outputNodePalette = page.locator('.node-palette-item').filter({ hasText: 'Output' }).first()
    await outputNodePalette.dragTo(canvas, {
      targetPosition: { x: 500, y: 100 }
    })
    await page.waitForSelector('.workflow-node.output-node')

    // Connect nodes (this would require dragging from handle to handle)
    // Get source handle of input node
    const sourceHandle = page.locator('.workflow-node.input-node .react-flow__handle-right').first()
    const targetHandle = page.locator('.workflow-node.llm-node .react-flow__handle-left').first()
    
    // Drag from source to target handle
    await sourceHandle.dragTo(targetHandle)
    
    // Wait for edge to appear
    await page.waitForSelector('.react-flow__edge', { timeout: 5000 })
    
    // Verify connection was created
    const edges = await page.locator('.react-flow__edge').count()
    expect(edges).toBeGreaterThan(0)
  })

  test('should handle rapid consecutive drag operations', async ({ page }) => {
    const canvas = page.locator('.react-flow__renderer')
    
    // Perform rapid drag operations
    const nodeTypes = ['Input', 'LLM', 'Compare', 'Output']
    const positions = [
      { x: 100, y: 100 },
      { x: 300, y: 100 },
      { x: 100, y: 300 },
      { x: 300, y: 300 }
    ]

    for (let i = 0; i < nodeTypes.length; i++) {
      const nodePalette = page.locator('.node-palette-item').filter({ hasText: nodeTypes[i] }).first()
      await nodePalette.dragTo(canvas, {
        targetPosition: positions[i]
      })
    }

    // Wait for all nodes to appear
    await page.waitForTimeout(1000)

    // Verify all nodes were created
    const inputNodes = await page.locator('.workflow-node.input-node').count()
    const llmNodes = await page.locator('.workflow-node.llm-node').count()
    const compareNodes = await page.locator('.workflow-node.compare-node').count()
    const outputNodes = await page.locator('.workflow-node.output-node').count()

    expect(inputNodes).toBe(1)
    expect(llmNodes).toBe(1)
    expect(compareNodes).toBe(1)
    expect(outputNodes).toBe(1)
  })

  test('should maintain node position after drag', async ({ page }) => {
    const inputNodePalette = page.locator('.node-palette-item').filter({ hasText: 'Input' }).first()
    const canvas = page.locator('.react-flow__renderer')
    
    // Drop at specific position
    const dropX = 250
    const dropY = 150
    
    await inputNodePalette.dragTo(canvas, {
      targetPosition: { x: dropX, y: dropY }
    })
    
    // Wait for node to appear
    await page.waitForSelector('.workflow-node.input-node')
    
    // Get the created node
    const createdNode = page.locator('.workflow-node.input-node').first()
    
    // Get node position (might need to check transform or data attributes)
    const nodeBox = await createdNode.boundingBox()
    if (!nodeBox) throw new Error('Node not found')
    
    // Position should be approximately where we dropped it
    // Allow some tolerance for node dimensions and centering
    expect(nodeBox.x).toBeGreaterThan(dropX - 100)
    expect(nodeBox.x).toBeLessThan(dropX + 100)
    expect(nodeBox.y).toBeGreaterThan(dropY - 100)
    expect(nodeBox.y).toBeLessThan(dropY + 100)
  })

  test('should handle drag cancellation', async ({ page }) => {
    const inputNodePalette = page.locator('.node-palette-item').filter({ hasText: 'Input' }).first()
    
    // Start dragging
    await inputNodePalette.hover()
    await page.mouse.down()
    await page.mouse.move(200, 200)
    
    // Cancel drag with Escape key
    await page.keyboard.press('Escape')
    await page.mouse.up()
    
    // No node should be created
    const nodeCount = await page.locator('.workflow-node').count()
    expect(nodeCount).toBe(0)
  })

  test('should show visual feedback during drag', async ({ page }) => {
    const inputNodePalette = page.locator('.node-palette-item').filter({ hasText: 'Input' }).first()
    const canvas = page.locator('.react-flow__renderer')
    
    // Start dragging
    await inputNodePalette.hover()
    await page.mouse.down()
    
    // Move over canvas
    const canvasBounds = await canvas.boundingBox()
    if (!canvasBounds) throw new Error('Canvas not found')
    
    await page.mouse.move(canvasBounds.x + 200, canvasBounds.y + 200)
    
    // Check for drag-over class
    const isDraggingOver = await canvas.evaluate(el => el.classList.contains('dragging-over'))
    expect(isDraggingOver).toBe(true)
    
    // Complete the drop
    await page.mouse.up()
  })

  test('should prevent invalid drops outside canvas', async ({ page }) => {
    const inputNodePalette = page.locator('.node-palette-item').filter({ hasText: 'Input' }).first()
    
    // Try to drop outside the canvas (in the toolbar area)
    const toolbar = page.locator('.workflow-toolbar')
    
    await inputNodePalette.dragTo(toolbar)
    
    // No node should be created
    const nodeCount = await page.locator('.workflow-node').count()
    expect(nodeCount).toBe(0)
  })

  test('should handle edge creation via dragging', async ({ page }) => {
    // First, add two nodes
    const inputNodePalette = page.locator('.node-palette-item').filter({ hasText: 'Input' }).first()
    const llmNodePalette = page.locator('.node-palette-item').filter({ hasText: 'LLM' }).first()
    const canvas = page.locator('.react-flow__renderer')
    
    // Add input node
    await inputNodePalette.dragTo(canvas, {
      targetPosition: { x: 100, y: 200 }
    })
    await page.waitForSelector('.workflow-node.input-node')
    
    // Add LLM node
    await llmNodePalette.dragTo(canvas, {
      targetPosition: { x: 400, y: 200 }
    })
    await page.waitForSelector('.workflow-node.llm-node')
    
    // Connect them by dragging from output handle to input handle
    const outputHandle = page.locator('.workflow-node.input-node .react-flow__handle-right').first()
    const inputHandle = page.locator('.workflow-node.llm-node .react-flow__handle-left').first()
    
    await outputHandle.dragTo(inputHandle)
    
    // Verify edge was created
    await page.waitForSelector('.react-flow__edge')
    const edgeCount = await page.locator('.react-flow__edge').count()
    expect(edgeCount).toBe(1)
  })
})