/**
 * Working Drag and Drop Tests using Custom Events
 * This replaces the original drag-drop.spec.ts with a working implementation
 */

import { test, expect } from '@playwright/test'
import { dragNodeToCanvas, waitForNode, getNodeCount, verifyNodeWithText } from './helpers/dragDrop'

test.describe('Drag and Drop Tests (Working)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Launch workflow builder
    const launchButton = page.locator('button').filter({ hasText: /Launch Workflow Builder/i })
    await expect(launchButton).toBeEnabled({ timeout: 10000 })
    await launchButton.click()
    
    // Wait for builder and palette
    await page.waitForSelector('[data-testid="workflow-builder"]', { timeout: 5000 })
    await page.waitForSelector('.node-palette', { timeout: 5000 })
  })

  test('should drag and drop an Input node', async ({ page }) => {
    // Drag input node to canvas
    await dragNodeToCanvas(page, 'input', { x: 300, y: 200 })
    
    // Wait for node to appear
    await waitForNode(page)
    
    // Verify node was created
    const nodeCount = await getNodeCount(page)
    expect(nodeCount).toBe(1)
    
    // Verify it's an input node
    const hasInputNode = await verifyNodeWithText(page, 'Input')
    expect(hasInputNode).toBe(true)
  })

  test('should drag and drop multiple nodes', async ({ page }) => {
    // Add multiple nodes
    await dragNodeToCanvas(page, 'input', { x: 200, y: 200 })
    await page.waitForTimeout(200)
    
    await dragNodeToCanvas(page, 'llm', { x: 400, y: 200 })
    await page.waitForTimeout(200)
    
    await dragNodeToCanvas(page, 'output', { x: 600, y: 200 })
    await page.waitForTimeout(200)
    
    // Verify all nodes were created
    const nodeCount = await getNodeCount(page)
    expect(nodeCount).toBe(3)
  })

  test('should create nodes at different positions', async ({ page }) => {
    // Create nodes in a pattern
    const positions = [
      { x: 200, y: 100 },
      { x: 400, y: 100 },
      { x: 300, y: 300 }
    ]
    
    for (const pos of positions) {
      await dragNodeToCanvas(page, 'input', pos)
      await page.waitForTimeout(200)
    }
    
    // Verify nodes were created
    const nodeCount = await getNodeCount(page)
    expect(nodeCount).toBe(3)
  })

  test('should select newly created node', async ({ page }) => {
    // Add a node
    await dragNodeToCanvas(page, 'input', { x: 300, y: 200 })
    await waitForNode(page)
    
    // Check if node is selected (has selected class)
    const selectedNode = page.locator('.react-flow__node.selected')
    await expect(selectedNode).toBeVisible()
  })

  test('should open config panel when node is created', async ({ page }) => {
    // Add a node
    await dragNodeToCanvas(page, 'llm', { x: 300, y: 200 })
    await waitForNode(page)
    
    // Config panel should open automatically when node is created
    const configPanel = page.locator('[data-testid="node-config-panel"]')
    
    // Wait for config panel with proper timeout
    await expect(configPanel).toBeVisible({ timeout: 5000 })
    
    // Verify the config panel shows the correct node type
    const configContent = await configPanel.textContent()
    expect(configContent).toContain('Configure Node')
    expect(configContent).toContain('llm')
  })

  test('should handle different node types', async ({ page }) => {
    const nodeTypes = ['input', 'llm', 'compare', 'output']
    
    for (let i = 0; i < nodeTypes.length; i++) {
      await dragNodeToCanvas(page, nodeTypes[i], { x: 200 + i * 150, y: 200 })
      await page.waitForTimeout(200)
    }
    
    // Verify all nodes were created
    const nodeCount = await getNodeCount(page)
    expect(nodeCount).toBe(nodeTypes.length)
    
    // Verify we have different types
    const hasInput = await verifyNodeWithText(page, 'Input')
    const hasAI = await verifyNodeWithText(page, 'AI Analysis')
    const hasCompare = await verifyNodeWithText(page, 'Compare')
    const hasOutput = await verifyNodeWithText(page, 'Output')
    
    expect(hasInput).toBe(true)
    expect(hasAI).toBe(true)
    expect(hasCompare).toBe(true)
    expect(hasOutput).toBe(true)
  })

  test('should maintain node selection state', async ({ page }) => {
    // Add first node
    await dragNodeToCanvas(page, 'input', { x: 200, y: 200 })
    await waitForNode(page)
    
    // Wait for selection state to settle
    await page.waitForTimeout(100)
    
    // First node should be selected
    let selectedNodes = await page.locator('.react-flow__node.selected').count()
    expect(selectedNodes).toBe(1)
    
    // Add second node
    await dragNodeToCanvas(page, 'llm', { x: 400, y: 200 })
    await page.waitForTimeout(300) // Give more time for selection update
    
    // Only one node should be selected at a time
    selectedNodes = await page.locator('.react-flow__node.selected').count()
    expect(selectedNodes).toBe(1)
    
    // The second (most recently added) node should be selected
    const allNodes = await page.locator('.react-flow__node').all()
    const secondNodeClasses = await allNodes[1].getAttribute('class')
    expect(secondNodeClasses).toContain('selected')
  })
})

test.describe('Workflow Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const launchButton = page.locator('button').filter({ hasText: /Launch Workflow Builder/i })
    await launchButton.click()
    await page.waitForSelector('[data-testid="workflow-builder"]')
    await page.waitForSelector('.node-palette')
  })

  test('should show validation error for empty workflow', async ({ page }) => {
    // Click execute without any nodes
    const executeButton = page.locator('[data-testid="execute-workflow"]')
    await executeButton.click()
    
    // Should show validation error (via toast or inline)
    // The exact error display mechanism may vary
    await page.waitForTimeout(500)
    
    // Should show validation errors via react-hot-toast
    // React-hot-toast creates divs with role="status" and aria-live="polite"
    const toastErrors = page.locator('[aria-live="polite"]')
    
    // Wait for at least one error toast to appear
    await expect(toastErrors).toHaveCount(3, { timeout: 2000 })
    
    // Check that we have the expected validation errors
    const errorTexts = await toastErrors.allTextContents()
    expect(errorTexts.some(text => text.includes('Workflow must contain at least one node'))).toBe(true)
    expect(errorTexts.some(text => text.includes('Workflow must have at least one input node'))).toBe(true)
    expect(errorTexts.some(text => text.includes('Workflow must have at least one output node'))).toBe(true)
    
    // Execute button should still be enabled (per our fix)
    await expect(executeButton).toBeEnabled()
  })

  test('should allow execution with valid workflow', async ({ page }) => {
    // Create a simple workflow
    await dragNodeToCanvas(page, 'input', { x: 200, y: 200 })
    await page.waitForTimeout(200)
    
    await dragNodeToCanvas(page, 'llm', { x: 400, y: 200 })
    await page.waitForTimeout(200)
    
    await dragNodeToCanvas(page, 'output', { x: 600, y: 200 })
    await page.waitForTimeout(200)
    
    // Now execution should be possible
    const executeButton = page.locator('[data-testid="execute-workflow"]')
    await expect(executeButton).toBeEnabled()
    
    // Click should not produce validation errors
    await executeButton.click()
    
    // Should either start execution or ask for API keys
    // (depending on the implementation)
  })
})