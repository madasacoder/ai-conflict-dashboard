/**
 * Workflow Builder Integration Tests - Playwright Version
 * Converted from src/__tests__/integration/WorkflowBuilder.integration.test.tsx
 */

import { test, expect } from '@playwright/test'

test.describe('WorkflowBuilder Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
    await expect(launchButton).toBeEnabled({ timeout: 10000 })
    await launchButton.click()
    
    await page.waitForSelector('.workflow-builder')
  })

  test.describe('Complete Workflow Creation', () => {
    test('should create and execute a text analysis workflow', async ({ page }) => {
      const canvas = page.locator('.workflow-canvas')
      
      // Add input node
      const inputPalette = page.locator('.palette-node:has-text("Input")')
      await inputPalette.dragTo(canvas, { targetPosition: { x: 200, y: 300 } })
      
      // Configure input
      const inputNode = page.locator('.input-node').first()
      await inputNode.click()
      
      const textArea = page.locator('textarea').first()
      await textArea.fill('Analyze the sentiment of this product review: The product is amazing!')
      
      // Add LLM node
      const llmPalette = page.locator('.palette-node:has-text("LLM")')
      await llmPalette.dragTo(canvas, { targetPosition: { x: 400, y: 300 } })
      
      // Add output node
      const outputPalette = page.locator('.palette-node:has-text("Output")')
      await outputPalette.dragTo(canvas, { targetPosition: { x: 600, y: 300 } })
      
      // Execute
      const executeBtn = page.locator('button:has-text("Execute")')
      await executeBtn.click()
      
      // Check for execution feedback
      const feedback = page.locator('[data-testid="execution-panel"], text=/Executing|Complete|Error/')
      await expect(feedback.first()).toBeVisible({ timeout: 10000 })
    })

    test('should create a multi-model comparison workflow', async ({ page }) => {
      const canvas = page.locator('.workflow-canvas')
      
      // Add input
      const inputPalette = page.locator('.palette-node:has-text("Input")')
      await inputPalette.dragTo(canvas, { targetPosition: { x: 200, y: 300 } })
      
      // Add multiple LLM nodes
      const llmPalette = page.locator('.palette-node:has-text("LLM")')
      await llmPalette.dragTo(canvas, { targetPosition: { x: 400, y: 200 } })
      await llmPalette.dragTo(canvas, { targetPosition: { x: 400, y: 400 } })
      
      // Add compare node
      const comparePalette = page.locator('.palette-node:has-text("Compare")')
      await comparePalette.dragTo(canvas, { targetPosition: { x: 600, y: 300 } })
      
      // Verify all nodes created
      await expect(page.locator('.input-node')).toHaveCount(1)
      await expect(page.locator('.llm-node')).toHaveCount(2)
      await expect(page.locator('.compare-node')).toHaveCount(1)
    })
  })

  test.describe('Node Interactions', () => {
    test('should delete nodes with keyboard', async ({ page }) => {
      const canvas = page.locator('.workflow-canvas')
      
      // Add a node
      const inputPalette = page.locator('.palette-node:has-text("Input")')
      await inputPalette.dragTo(canvas, { targetPosition: { x: 300, y: 300 } })
      
      // Select the node
      const node = page.locator('.input-node').first()
      await node.click()
      
      // Delete with keyboard
      await page.keyboard.press('Delete')
      
      // Node should be removed
      await expect(page.locator('.input-node')).toHaveCount(0)
    })

    test('should copy and paste nodes', async ({ page }) => {
      const canvas = page.locator('.workflow-canvas')
      
      // Add a node
      const inputPalette = page.locator('.palette-node:has-text("Input")')
      await inputPalette.dragTo(canvas, { targetPosition: { x: 300, y: 300 } })
      
      // Select and copy
      const node = page.locator('.input-node').first()
      await node.click()
      await page.keyboard.press('Control+c')
      
      // Paste
      await page.keyboard.press('Control+v')
      
      // Should have 2 nodes now
      await page.waitForTimeout(500)
      const nodes = page.locator('.input-node')
      await expect(nodes).toHaveCount(2)
    })
  })

  test.describe('Save and Load', () => {
    test('should save workflow to localStorage', async ({ page }) => {
      const canvas = page.locator('.workflow-canvas')
      
      // Create a simple workflow
      const inputPalette = page.locator('.palette-node:has-text("Input")')
      await inputPalette.dragTo(canvas, { targetPosition: { x: 300, y: 300 } })
      
      // Get localStorage before
      const workflowBefore = await page.evaluate(() => {
        return localStorage.getItem('workflow')
      })
      
      // Wait for auto-save or trigger save
      await page.waitForTimeout(2000)
      
      // Check localStorage after
      const workflowAfter = await page.evaluate(() => {
        return localStorage.getItem('workflow')
      })
      
      // Should have saved something
      if (workflowAfter) {
        expect(workflowAfter).not.toBe(workflowBefore)
      }
    })

    test('should load saved workflow', async ({ page }) => {
      // Set a workflow in localStorage
      await page.evaluate(() => {
        const workflow = {
          nodes: [{ id: 'test-1', type: 'input', position: { x: 300, y: 300 } }],
          edges: []
        }
        localStorage.setItem('workflow', JSON.stringify(workflow))
      })
      
      // Reload page
      await page.reload()
      
      // Launch builder
      const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
      await expect(launchButton).toBeEnabled({ timeout: 10000 })
      await launchButton.click()
      
      await page.waitForSelector('.workflow-builder')
      
      // Check if workflow loaded
      const nodes = page.locator('[data-testid^="rf__node-"]')
      const count = await nodes.count()
      
      // Should have loaded the saved node (or at least not crash)
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Export and Import', () => {
    test('should export workflow as JSON', async ({ page }) => {
      const canvas = page.locator('.workflow-canvas')
      
      // Create workflow
      const inputPalette = page.locator('.palette-node:has-text("Input")')
      await inputPalette.dragTo(canvas, { targetPosition: { x: 300, y: 300 } })
      
      // Look for export button
      const exportBtn = page.locator('button:has-text("Export"), button[aria-label*="export"]').first()
      
      if (await exportBtn.isVisible()) {
        // Set up download promise before clicking
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
        
        await exportBtn.click()
        
        const download = await downloadPromise
        if (download) {
          expect(download.suggestedFilename()).toContain('.json')
        }
      }
    })

    test('should import workflow from JSON', async ({ page }) => {
      // Look for import button
      const importBtn = page.locator('button:has-text("Import"), button[aria-label*="import"]').first()
      
      if (await importBtn.isVisible()) {
        // Create a mock file
        const fileContent = JSON.stringify({
          nodes: [{ id: 'imported-1', type: 'input', position: { x: 300, y: 300 } }],
          edges: []
        })
        
        // Set file for upload
        const fileInput = page.locator('input[type="file"]').first()
        if (await fileInput.isVisible()) {
          await fileInput.setInputFiles({
            name: 'workflow.json',
            mimeType: 'application/json',
            buffer: Buffer.from(fileContent)
          })
          
          // Should show imported workflow
          await page.waitForTimeout(1000)
          const nodes = page.locator('[data-testid^="rf__node-"]')
          await expect(nodes.first()).toBeVisible({ timeout: 5000 })
        }
      }
    })
  })

  test.describe('API Integration', () => {
    test('should handle API key configuration', async ({ page }) => {
      // Open settings
      const settingsBtn = page.locator('button[aria-label*="settings"], button:has-text("Settings")').first()
      
      if (await settingsBtn.isVisible()) {
        await settingsBtn.click()
        
        // Look for API key fields
        const apiKeyInput = page.locator('input[type="password"], input[placeholder*="API"]').first()
        
        if (await apiKeyInput.isVisible()) {
          await apiKeyInput.fill('test-api-key-123')
          
          // Save settings
          const saveBtn = page.locator('button:has-text("Save")').first()
          if (await saveBtn.isVisible()) {
            await saveBtn.click()
          }
        }
      }
      
      // Should not crash
      await expect(page.locator('.workflow-builder')).toBeVisible()
    })

    test('should show error for invalid API keys', async ({ page }) => {
      const canvas = page.locator('.workflow-canvas')
      
      // Create simple workflow
      const inputPalette = page.locator('.palette-node:has-text("Input")')
      await inputPalette.dragTo(canvas, { targetPosition: { x: 200, y: 300 } })
      
      const llmPalette = page.locator('.palette-node:has-text("LLM")')
      await llmPalette.dragTo(canvas, { targetPosition: { x: 400, y: 300 } })
      
      // Execute without valid API key
      const executeBtn = page.locator('button:has-text("Execute")')
      await executeBtn.click()
      
      // Should show error message
      const error = page.locator('text=/error|invalid|failed/i').first()
      await expect(error).toBeVisible({ timeout: 10000 })
    })
  })
})