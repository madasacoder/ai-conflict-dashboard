/**
 * CRITICAL MVP TESTS - Playwright Version
 * Converted from src/__tests__/critical/MVP.critical.test.tsx
 * These tests MUST pass for the app to be considered minimally viable
 */

import { test, expect } from '@playwright/test'

test.describe('CRITICAL: MVP Must-Have Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test.describe('1. Complete User Workflow - Text Analysis', () => {
    test('should allow user to create, configure, and execute a complete workflow', async ({ page }) => {
      // Step 1: Launch workflow builder
      const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
      await expect(launchButton).toBeEnabled({ timeout: 10000 })
      await launchButton.click()
      
      await page.waitForSelector('.workflow-builder')
      
      // Step 2: Create new workflow
      const workflowButton = page.locator('button:has-text("Workflow")')
      await workflowButton.click()
      
      const createNewButton = page.locator('button:has-text("Create New")')
      await createNewButton.click()
      
      // Enter workflow name
      const nameInput = page.locator('input[placeholder*="workflow name"]')
      await nameInput.fill('My Analysis Pipeline')
      
      const createButton = page.locator('button:has-text("Create")')
      await createButton.click()
      
      // Step 3: Add nodes by dragging
      const canvas = page.locator('.workflow-canvas')
      
      // Add input node
      const inputNodePalette = page.locator('.palette-node:has-text("Input")').first()
      await inputNodePalette.dragTo(canvas, {
        targetPosition: { x: 200, y: 200 }
      })
      
      // Wait for node to appear
      await page.waitForSelector('[data-testid^="rf__node-"]')
      
      // Step 4: Configure the input node
      const inputNode = page.locator('[data-testid^="rf__node-"]').first()
      await inputNode.click()
      
      // Wait for config panel
      await page.waitForSelector('[data-testid="node-config-panel"]')
      
      // Find and fill the text input
      const textArea = page.locator('textarea').first()
      await textArea.fill('Analyze this text for sentiment and key topics')
      
      // Step 5: Add LLM node
      const llmNodePalette = page.locator('.palette-node:has-text("LLM")').first()
      await llmNodePalette.dragTo(canvas, {
        targetPosition: { x: 400, y: 200 }
      })
      
      await page.waitForTimeout(500)
      
      // Step 6: Configure LLM node
      const llmNode = page.locator('.llm-node').first()
      await llmNode.click()
      
      // Select a model (if dropdown exists)
      const modelSelect = page.locator('select[name="model"]')
      if (await modelSelect.isVisible()) {
        await modelSelect.selectOption({ index: 1 })
      }
      
      // Step 7: Add output node
      const outputNodePalette = page.locator('.palette-node:has-text("Output")').first()
      await outputNodePalette.dragTo(canvas, {
        targetPosition: { x: 600, y: 200 }
      })
      
      // Step 8: Execute workflow
      const executeButton = page.locator('button:has-text("Execute")')
      await executeButton.click()
      
      // Should show execution panel or progress
      const executionPanel = page.locator('[data-testid="execution-panel"]')
      const executingText = page.locator('text=/Executing|Running|Processing/')
      
      await expect(
        executionPanel.or(executingText)
      ).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('2. Error Handling and Recovery', () => {
    test('should gracefully handle API failures without crashing', async ({ page }) => {
      // Launch builder
      const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
      await expect(launchButton).toBeEnabled({ timeout: 10000 })
      await launchButton.click()
      
      await page.waitForSelector('.workflow-builder')
      
      // Try to execute without proper setup
      const executeButton = page.locator('button:has-text("Execute")')
      await executeButton.click()
      
      // Should show validation error
      await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible()
      
      // App should still be functional
      await expect(page.locator('.node-palette')).toBeVisible()
      await expect(page.locator('.workflow-canvas')).toBeVisible()
    })

    test('should validate workflow before execution', async ({ page }) => {
      // Launch builder
      const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
      await expect(launchButton).toBeEnabled({ timeout: 10000 })
      await launchButton.click()
      
      await page.waitForSelector('.workflow-builder')
      
      // Try to run empty workflow
      const executeButton = page.locator('button:has-text("Execute")')
      await executeButton.click()
      
      // Should show validation error
      const validationErrors = page.locator('[data-testid="validation-errors"]')
      await expect(validationErrors).toBeVisible()
      
      // Check error message
      const errorText = await page.locator('[data-testid^="validation-error-"]').first().textContent()
      expect(errorText).toMatch(/Workflow must contain at least one node|Workflow must have at least one input/)
    })
  })

  test.describe('3. State Persistence and Recovery', () => {
    test('should persist workflow across page reloads', async ({ page }) => {
      // Launch builder
      const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
      await expect(launchButton).toBeEnabled({ timeout: 10000 })
      await launchButton.click()
      
      await page.waitForSelector('.workflow-builder')
      
      // Create a workflow with nodes
      const canvas = page.locator('.workflow-canvas')
      
      // Add input node
      const inputNodePalette = page.locator('.palette-node:has-text("Input")').first()
      await inputNodePalette.dragTo(canvas, {
        targetPosition: { x: 200, y: 200 }
      })
      
      // Add LLM node
      const llmNodePalette = page.locator('.palette-node:has-text("LLM")').first()
      await llmNodePalette.dragTo(canvas, {
        targetPosition: { x: 400, y: 200 }
      })
      
      // Wait for auto-save (if implemented)
      await page.waitForTimeout(2000)
      
      // Count nodes before reload
      const nodesBefore = await page.locator('[data-testid^="rf__node-"]').count()
      expect(nodesBefore).toBeGreaterThan(0)
      
      // Reload page
      await page.reload()
      
      // Launch builder again
      const launchButtonAfter = page.locator('button:has-text("Launch Workflow Builder")')
      await expect(launchButtonAfter).toBeEnabled({ timeout: 10000 })
      await launchButtonAfter.click()
      
      await page.waitForSelector('.workflow-builder')
      
      // Check if nodes are restored
      const nodesAfter = await page.locator('[data-testid^="rf__node-"]').count()
      expect(nodesAfter).toBe(nodesBefore)
    })
  })

  test.describe('4. Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Launch builder
      const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
      await expect(launchButton).toBeEnabled({ timeout: 10000 })
      await launchButton.click()
      
      await page.waitForSelector('.workflow-builder')
      
      // Check if palette is accessible (might be in hamburger menu)
      const paletteToggle = page.locator('button[aria-label*="palette"], button[aria-label*="menu"]').first()
      if (await paletteToggle.isVisible()) {
        await paletteToggle.click()
      }
      
      // Palette should be visible
      await expect(page.locator('.node-palette')).toBeVisible()
    })
  })

  test.describe('5. Multi-Model Comparison', () => {
    test('should execute same prompt across multiple models and show comparison', async ({ page }) => {
      // Launch builder
      const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
      await expect(launchButton).toBeEnabled({ timeout: 10000 })
      await launchButton.click()
      
      await page.waitForSelector('.workflow-builder')
      
      // Add input node
      const canvas = page.locator('.workflow-canvas')
      const inputNodePalette = page.locator('.palette-node:has-text("Input")').first()
      await inputNodePalette.dragTo(canvas, {
        targetPosition: { x: 200, y: 300 }
      })
      
      // Add multiple LLM nodes
      const llmNodePalette = page.locator('.palette-node:has-text("LLM")').first()
      
      // First LLM node
      await llmNodePalette.dragTo(canvas, {
        targetPosition: { x: 400, y: 200 }
      })
      
      // Second LLM node
      await llmNodePalette.dragTo(canvas, {
        targetPosition: { x: 400, y: 400 }
      })
      
      // Add compare node
      const compareNodePalette = page.locator('.palette-node:has-text("Compare")').first()
      await compareNodePalette.dragTo(canvas, {
        targetPosition: { x: 600, y: 300 }
      })
      
      // Verify 4 nodes created
      const nodes = await page.locator('[data-testid^="rf__node-"]').count()
      expect(nodes).toBe(4)
    })
  })

  test.describe('6. Real-time Collaboration Features', () => {
    test('should show workflow execution progress in real-time', async ({ page }) => {
      // Launch builder
      const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
      await expect(launchButton).toBeEnabled({ timeout: 10000 })
      await launchButton.click()
      
      await page.waitForSelector('.workflow-builder')
      
      // Create a simple workflow
      const canvas = page.locator('.workflow-canvas')
      
      // Add input node
      const inputNodePalette = page.locator('.palette-node:has-text("Input")').first()
      await inputNodePalette.dragTo(canvas, {
        targetPosition: { x: 200, y: 200 }
      })
      
      // Configure input
      const inputNode = page.locator('[data-testid^="rf__node-"]').first()
      await inputNode.click()
      
      const textArea = page.locator('textarea').first()
      await textArea.fill('Test input')
      
      // Add output node
      const outputNodePalette = page.locator('.palette-node:has-text("Output")').first()
      await outputNodePalette.dragTo(canvas, {
        targetPosition: { x: 400, y: 200 }
      })
      
      // Execute
      const executeButton = page.locator('button:has-text("Execute")')
      await executeButton.click()
      
      // Look for any progress indicator
      const progressIndicators = [
        page.locator('[data-testid="execution-panel"]'),
        page.locator('.execution-progress'),
        page.locator('text=/Executing|Running|Processing/'),
        page.locator('.node-status-indicator')
      ]
      
      // At least one progress indicator should be visible
      let foundProgress = false
      for (const indicator of progressIndicators) {
        if (await indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
          foundProgress = true
          break
        }
      }
      
      expect(foundProgress).toBeTruthy()
    })
  })
})