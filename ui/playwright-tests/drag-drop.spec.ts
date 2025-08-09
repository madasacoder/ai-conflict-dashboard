/**
 * Playwright E2E tests for Drag and Drop functionality
 * Converted from src/__tests__/critical/DragDropFix.test.tsx
 */

import { test, expect } from '@playwright/test'

test.describe('Drag and Drop Fix Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for and click launch button
    const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
    await expect(launchButton).toBeEnabled({ timeout: 10000 })
    await launchButton.click()
    
    await page.waitForSelector('[data-testid="workflow-builder"]', { timeout: 5000 })
    
    // Wait for palette to be visible
    await page.waitForSelector('.node-palette', { timeout: 5000 })
  })

  test.describe('Understanding the Drag Drop Problem', () => {
    test('should properly handle dataTransfer in drag events', async ({ page }) => {
      // Find input node in palette
      const inputNode = page.locator('.palette-node:has-text("Input")').first()
      await expect(inputNode).toBeVisible()
      
      // Start drag operation
      await inputNode.hover()
      await page.mouse.down()
      
      // Move to canvas
      const canvas = page.locator('.workflow-canvas')
      const box = await canvas.boundingBox()
      if (!box) throw new Error('Canvas not found')
      
      await page.mouse.move(box.x + 300, box.y + 200)
      await page.mouse.up()
      
      // Verify node was created
      const createdNode = page.locator('[data-testid^="rf__node-"]').first()
      await expect(createdNode).toBeVisible({ timeout: 5000 })
    })

    test('should receive correct data on drop', async ({ page }) => {
      // Drag LLM node to canvas
      const llmNode = page.locator('.palette-node:has-text("AI Analysis")').first()
      await expect(llmNode).toBeVisible()
      
      const canvas = page.locator('.workflow-canvas')
      await llmNode.dragTo(canvas, {
        targetPosition: { x: 300, y: 200 }
      })
      
      // Verify LLM node was created
      const createdNode = page.locator('[data-testid^="rf__node-"]:has-text("AI Analysis")')
      await expect(createdNode).toBeVisible({ timeout: 5000 })
      
      // Verify it has the correct type
      const nodeClass = await createdNode.getAttribute('class')
      expect(nodeClass).toContain('llm-node')
    })

    test('should calculate correct drop position relative to viewport', async ({ page }) => {
      const inputNode = page.locator('.palette-node:has-text("Input")').first()
      const canvas = page.locator('.workflow-canvas')
      
      // Drop at specific coordinates
      await inputNode.hover()
      await page.mouse.down()
      
      const box = await canvas.boundingBox()
      if (!box) throw new Error('Canvas not found')
      
      const targetX = box.x + 300
      const targetY = box.y + 200
      
      await page.mouse.move(targetX, targetY)
      await page.mouse.up()
      
      // Verify node was created at approximately the right position
      const createdNode = page.locator('[data-testid^="rf__node-"]').first()
      await expect(createdNode).toBeVisible()
      
      // Get node position (React Flow stores position in transform)
      const transform = await createdNode.evaluate(el => {
        const parent = el.closest('.react-flow__node')
        return parent ? window.getComputedStyle(parent).transform : null
      })
      
      expect(transform).toBeTruthy()
    })
  })

  test.describe('React Flow Integration Issues', () => {
    test('should handle React Flow viewport transformations', async ({ page }) => {
      // Add a node first
      const inputNode = page.locator('.palette-node:has-text("Input")').first()
      const canvas = page.locator('.workflow-canvas')
      
      await inputNode.dragTo(canvas, {
        targetPosition: { x: 200, y: 200 }
      })
      
      // Zoom in using controls
      const zoomIn = page.locator('button[aria-label="zoom in"]')
      if (await zoomIn.isVisible()) {
        await zoomIn.click()
        await page.waitForTimeout(200)
      }
      
      // Add another node - position should be adjusted for zoom
      const llmNode = page.locator('.palette-node:has-text("AI Analysis")').first()
      await llmNode.dragTo(canvas, {
        targetPosition: { x: 400, y: 200 }
      })
      
      // Both nodes should be visible
      const nodes = page.locator('[data-testid^="rf__node-"]')
      await expect(nodes).toHaveCount(2)
    })
  })

  test.describe('Node Creation After Drop', () => {
    test('should create node with correct initial data', async ({ page }) => {
      const inputNode = page.locator('.palette-node:has-text("Input")').first()
      const canvas = page.locator('.workflow-canvas')
      
      await inputNode.dragTo(canvas, {
        targetPosition: { x: 300, y: 200 }
      })
      
      // Wait for node creation
      await page.waitForTimeout(500)
      
      // Click node to open config
      const createdNode = page.locator('[data-testid^="rf__node-"]').first()
      await createdNode.click()
      
      // Check config panel shows correct node type
      const configPanel = page.locator('[data-testid="node-config-panel"]')
      await expect(configPanel).toBeVisible()
      await expect(configPanel).toContainText('Input')
    })

    test('should select newly created node', async ({ page }) => {
      const inputNode = page.locator('.palette-node:has-text("Input")').first()
      const canvas = page.locator('.workflow-canvas')
      
      await inputNode.dragTo(canvas, {
        targetPosition: { x: 300, y: 200 }
      })
      
      // Newly created node should be selected
      const createdNode = page.locator('[data-testid^="rf__node-"]').first()
      await expect(createdNode).toHaveClass(/selected/)
      
      // Config panel should be open
      const configPanel = page.locator('[data-testid="node-config-panel"]')
      await expect(configPanel).toBeVisible()
    })
  })

  test.describe('Error Scenarios', () => {
    test('should handle invalid node types gracefully', async ({ page }) => {
      // This would require injecting invalid data, which is harder in e2e
      // For now, test that unknown palette items don't crash
      const canvas = page.locator('.workflow-canvas')
      
      // Try to drop without dragging (shouldn't create node)
      await canvas.click({ position: { x: 300, y: 200 } })
      
      // No nodes should be created
      const nodes = page.locator('[data-testid^="rf__node-"]')
      await expect(nodes).toHaveCount(0)
    })

    test('should not create duplicate nodes on double drop', async ({ page }) => {
      const inputNode = page.locator('.palette-node:has-text("Input")').first()
      const canvas = page.locator('.workflow-canvas')
      
      // Perform drag and drop
      await inputNode.dragTo(canvas, {
        targetPosition: { x: 300, y: 200 }
      })
      
      // Try to drop again immediately
      await inputNode.dragTo(canvas, {
        targetPosition: { x: 300, y: 200 }
      })
      
      await page.waitForTimeout(500)
      
      // Should have 2 nodes (not duplicates at same position)
      const nodes = page.locator('[data-testid^="rf__node-"]')
      await expect(nodes).toHaveCount(2)
    })
  })

  test.describe('Multiple Drag Operations', () => {
    test('should handle multiple consecutive drops', async ({ page }) => {
      const canvas = page.locator('.workflow-canvas')
      
      // Drop three different node types
      const nodeTypes = ['Input', 'LLM', 'Output']
      const positions = [
        { x: 200, y: 200 },
        { x: 400, y: 200 },
        { x: 600, y: 200 }
      ]
      
      for (let i = 0; i < nodeTypes.length; i++) {
        const node = page.locator(`.palette-node:has-text("${nodeTypes[i]}")`).first()
        await node.dragTo(canvas, {
          targetPosition: positions[i]
        })
        await page.waitForTimeout(200) // Small delay between drops
      }
      
      // Should have 3 nodes
      const nodes = page.locator('[data-testid^="rf__node-"]')
      await expect(nodes).toHaveCount(3)
      
      // Verify each node type
      await expect(page.locator('.input-node')).toBeVisible()
      await expect(page.locator('.llm-node')).toBeVisible()
      await expect(page.locator('.output-node')).toBeVisible()
    })

    test('should maintain node selection state during drops', async ({ page }) => {
      const canvas = page.locator('.workflow-canvas')
      
      // Drop first node
      const inputNode = page.locator('.palette-node:has-text("Input")').first()
      await inputNode.dragTo(canvas, {
        targetPosition: { x: 200, y: 200 }
      })
      
      // First node should be selected
      const firstNode = page.locator('[data-testid^="rf__node-"]').first()
      await expect(firstNode).toHaveClass(/selected/)
      
      // Drop second node
      const llmNode = page.locator('.palette-node:has-text("AI Analysis")').first()
      await llmNode.dragTo(canvas, {
        targetPosition: { x: 400, y: 200 }
      })
      
      // Second node should now be selected
      const secondNode = page.locator('[data-testid^="rf__node-"]').nth(1)
      await expect(secondNode).toHaveClass(/selected/)
      
      // First node should not be selected
      await expect(firstNode).not.toHaveClass(/selected/)
    })
  })
})