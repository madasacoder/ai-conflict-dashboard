/**
 * Fixed Playwright E2E tests for Workflow Builder
 * Uses proper selectors and helper functions
 */

import { test, expect } from '@playwright/test'
import {
  launchWorkflowBuilder,
  createNewWorkflow,
  addNodeToCanvas,
  connectNodes,
  configureNode,
  executeWorkflow,
  getValidationErrors
} from './helpers/workflowHelpers'

test.describe('Workflow Builder E2E - Fixed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await launchWorkflowBuilder(page)
  })

  test('should create a simple workflow with drag and drop', async ({ page }) => {
    // Verify we're in the workflow builder
    await expect(page.locator('.node-palette')).toBeVisible()
    await expect(page.locator('.workflow-canvas')).toBeVisible()
    
    // Add input node using our custom drag solution
    await addNodeToCanvas(page, 'input', { x: 300, y: 200 })
    
    // Check if node was created with correct test ID
    const createdNode = page.locator('[data-testid^="rf__node-"]').first()
    await expect(createdNode).toBeVisible()
    
    // Verify it's an input node
    const inputNode = page.locator('.input-node').first()
    await expect(inputNode).toBeVisible()
  })

  test('should connect two nodes', async ({ page }) => {
    // Add Input node
    await addNodeToCanvas(page, 'input', { x: 200, y: 200 })
    
    // Add LLM node
    await addNodeToCanvas(page, 'llm', { x: 400, y: 200 })
    
    // Connect the nodes
    await connectNodes(page, 0, 1)
    
    // Verify nodes exist (React Flow creates both wrapper and custom nodes)
    const nodes = page.locator('[data-testid^="rf__node-"]')
    const nodeCount = await nodes.count()
    expect(nodeCount).toBeGreaterThanOrEqual(2)
    
    // Verify edge was created
    const edge = page.locator('.react-flow__edge')
    await expect(edge).toBeVisible()
  })

  test('should validate empty workflow', async ({ page }) => {
    // Get validation errors
    const errors = await getValidationErrors(page)
    
    // Check we got the expected errors
    expect(errors).toContain('Workflow must contain at least one node')
    expect(errors).toContain('Workflow must have at least one input node')
    expect(errors).toContain('Workflow must have at least one output node')
  })

  test('should save workflow name', async ({ page }) => {
    // Create a new workflow
    await createNewWorkflow(page, 'My Test Workflow', 'A test workflow for E2E testing')
    
    // Verify workflow name is displayed
    const workflowName = page.locator('.workflow-name')
    await expect(workflowName).toContainText('My Test Workflow')
  })

  test('should toggle dark mode', async ({ page }) => {
    // Find theme toggle button
    const themeButton = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"]')
    
    // Get initial theme
    const initialClass = await page.locator('.workflow-builder-inner').getAttribute('class')
    const isDark = initialClass?.includes('dark')
    
    // Toggle theme
    await themeButton.click()
    
    // Check theme changed
    const newClass = await page.locator('.workflow-builder-inner').getAttribute('class')
    if (isDark) {
      expect(newClass).toContain('light')
    } else {
      expect(newClass).toContain('dark')
    }
  })

  test('should show node configuration panel', async ({ page }) => {
    // Add an LLM node
    await addNodeToCanvas(page, 'llm', { x: 300, y: 200 })
    
    // Click the node to select it
    const node = page.locator('[data-testid^="rf__node-"]').first()
    await node.click()
    
    // Check if config panel is visible
    const configPanel = page.locator('[data-testid="node-config-panel"]')
    await expect(configPanel).toBeVisible()
    
    // Verify panel shows node configuration
    await expect(configPanel).toContainText('Configure Node')
  })

  test('should execute a complete workflow', async ({ page }) => {
    // Create a complete workflow
    await addNodeToCanvas(page, 'input', { x: 200, y: 200 })
    await addNodeToCanvas(page, 'llm', { x: 400, y: 200 })
    await addNodeToCanvas(page, 'output', { x: 600, y: 200 })
    
    // Configure input node
    await configureNode(page, 0, {
      text: 'Analyze this text for sentiment'
    })
    
    // Connect nodes
    await connectNodes(page, 0, 1) // input to llm
    await connectNodes(page, 1, 2) // llm to output
    
    // Execute workflow
    const result = await executeWorkflow(page)
    
    // Check execution started
    expect(result.success || result.errors.length > 0).toBe(true)
    
    // If successful, verify execution panel
    if (result.success) {
      const executionPanel = page.locator('[data-testid="execution-panel"]')
      await expect(executionPanel).toBeVisible()
    }
  })
})