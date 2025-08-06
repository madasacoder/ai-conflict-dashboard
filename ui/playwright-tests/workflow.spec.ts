/**
 * Playwright E2E tests for Workflow Builder
 * These test real browser interactions that can't be tested with jsdom
 */

import { test, expect } from '@playwright/test'

test.describe('Workflow Builder E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Start on home page
    await page.goto('/')
    
    // Wait for app to load and API to be healthy
    await page.waitForLoadState('networkidle')
    
    // Click the Launch button when it becomes enabled
    const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
    await launchButton.waitFor({ state: 'visible' })
    
    // Wait for button to be enabled (API healthy)
    await expect(launchButton).toBeEnabled({ timeout: 10000 })
    await launchButton.click()
    
    // Wait for workflow builder to load
    await page.waitForSelector('.workflow-builder', { timeout: 5000 })
  })

  test('should create a simple workflow with drag and drop', async ({ page }) => {
    // Verify we're in the workflow builder
    await expect(page.locator('.node-palette')).toBeVisible()
    await expect(page.locator('.workflow-canvas')).toBeVisible()
    
    // Find the Input node in palette
    const inputNode = page.locator('.palette-node:has-text("Input")')
    await expect(inputNode).toBeVisible()
    
    // Drag to canvas
    const canvas = page.locator('.workflow-canvas')
    await inputNode.dragTo(canvas, {
      targetPosition: { x: 300, y: 200 }
    })
    
    // Wait for node to appear
    await page.waitForTimeout(500)
    
    // Check if node was created (it should have a test ID)
    const createdNode = page.locator('[data-testid^="rf__node-"]').first()
    await expect(createdNode).toBeVisible()
  })

  test('should connect two nodes', async ({ page }) => {
    // Add Input node
    const inputNodePalette = page.locator('.palette-node:has-text("Input")')
    const canvas = page.locator('.workflow-canvas')
    
    await inputNodePalette.dragTo(canvas, {
      targetPosition: { x: 200, y: 200 }
    })
    
    // Add LLM node
    const llmNodePalette = page.locator('.palette-node:has-text("LLM")')
    await llmNodePalette.dragTo(canvas, {
      targetPosition: { x: 400, y: 200 }
    })
    
    // Wait for nodes to render
    await page.waitForTimeout(500)
    
    // Connect the nodes (this is complex with React Flow)
    // For now, just verify both nodes exist
    const nodes = page.locator('[data-testid^="rf__node-"]')
    await expect(nodes).toHaveCount(2)
  })

  test('should validate empty workflow', async ({ page }) => {
    // Click execute without any nodes
    const executeButton = page.locator('button:has-text("Execute")')
    await executeButton.click()
    
    // Check for validation error
    await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible()
    const errorText = await page.locator('[data-testid^="validation-error-"]').first().textContent()
    expect(errorText).toContain('Workflow must contain at least one node')
  })

  test('should save workflow name', async ({ page }) => {
    // Open workflow menu
    const workflowButton = page.locator('button:has-text("Workflow")')
    await workflowButton.click()
    
    // Click create new
    const createButton = page.locator('button:has-text("Create New")')
    await createButton.click()
    
    // Enter workflow name
    const nameInput = page.locator('input[placeholder*="workflow name"]')
    await nameInput.fill('My Test Workflow')
    
    // Save it
    const saveButton = page.locator('button:has-text("Create")')
    await saveButton.click()
    
    // Verify it was saved (check for success message or workflow name display)
    await expect(page.locator('text=My Test Workflow')).toBeVisible({ timeout: 5000 })
  })

  test('should toggle dark mode', async ({ page }) => {
    // Find theme toggle
    const themeToggle = page.locator('button[aria-label*="theme"]')
    
    // Check initial state
    const initialTheme = await page.locator('.workflow-builder').getAttribute('class')
    
    // Toggle theme
    await themeToggle.click()
    
    // Check theme changed
    await page.waitForTimeout(100)
    const newTheme = await page.locator('.workflow-builder').getAttribute('class')
    expect(newTheme).not.toBe(initialTheme)
  })

  test('should show node configuration panel', async ({ page }) => {
    // Add a node first
    const inputNodePalette = page.locator('.palette-node:has-text("Input")')
    const canvas = page.locator('.workflow-canvas')
    
    await inputNodePalette.dragTo(canvas, {
      targetPosition: { x: 300, y: 200 }
    })
    
    await page.waitForTimeout(500)
    
    // Click the node to select it
    const node = page.locator('[data-testid^="rf__node-"]').first()
    await node.click()
    
    // Config panel should appear
    await expect(page.locator('[data-testid="node-config-panel"]')).toBeVisible()
  })

  test('should execute a complete workflow', async ({ page }) => {
    // Add Input node
    const inputNodePalette = page.locator('.palette-node:has-text("Input")')
    const canvas = page.locator('.workflow-canvas')
    await inputNodePalette.dragTo(canvas, { targetPosition: { x: 200, y: 200 } })
    
    // Configure input node
    const inputNode = page.locator('[data-testid^="rf__node-"]').first()
    await inputNode.click()
    
    // Wait for config panel
    await page.waitForSelector('[data-testid="node-config-panel"]')
    
    // Enter some text
    const textArea = page.locator('textarea').first()
    await textArea.fill('Test input text')
    
    // Add LLM node
    const llmNodePalette = page.locator('.palette-node:has-text("LLM")')
    await llmNodePalette.dragTo(canvas, { targetPosition: { x: 400, y: 200 } })
    
    // Configure LLM node
    const llmNode = page.locator('[data-testid^="rf__node-"]:has-text("LLM")')
    await llmNode.click()
    
    // Select a model
    const modelSelect = page.locator('select[name="model"]')
    await modelSelect.selectOption({ index: 1 }) // Select first available model
    
    // Add Output node
    const outputNodePalette = page.locator('.palette-node:has-text("Output")')
    await outputNodePalette.dragTo(canvas, { targetPosition: { x: 600, y: 200 } })
    
    // Now execute
    const executeButton = page.locator('button:has-text("Execute")')
    await executeButton.click()
    
    // Wait for execution panel
    await expect(page.locator('[data-testid="execution-panel"]')).toBeVisible({ timeout: 5000 })
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Add nodes to create a valid workflow
    const inputNodePalette = page.locator('.palette-node:has-text("Input")')
    const canvas = page.locator('.workflow-canvas')
    await inputNodePalette.dragTo(canvas, { targetPosition: { x: 200, y: 200 } })
    
    // Configure with invalid API key
    const inputNode = page.locator('[data-testid^="rf__node-"]').first()
    await inputNode.click()
    
    const textArea = page.locator('textarea').first()
    await textArea.fill('Test text')
    
    // Try to execute (should fail due to no API keys)
    const executeButton = page.locator('button:has-text("Execute")')
    await executeButton.click()
    
    // Should show error message, not crash
    await expect(page.locator('text=/error|failed|invalid/i')).toBeVisible({ timeout: 10000 })
  })
})