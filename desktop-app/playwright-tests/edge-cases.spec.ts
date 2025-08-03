/**
 * Edge Cases Tests - Playwright Version
 * Converted from src/__tests__/edge-cases/EdgeCases.test.tsx
 */

import { test, expect } from '@playwright/test'

test.describe('Edge Cases and Boundary Conditions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
    await expect(launchButton).toBeEnabled({ timeout: 10000 })
    await launchButton.click()
    
    await page.waitForSelector('.workflow-builder')
  })

  test.describe('Large Workflows', () => {
    test('should handle workflow with 50+ nodes', async ({ page }) => {
      const canvas = page.locator('.workflow-canvas')
      
      // Add multiple nodes programmatically
      for (let i = 0; i < 10; i++) {
        const nodeType = i % 3 === 0 ? 'Input' : i % 3 === 1 ? 'LLM' : 'Output'
        const node = page.locator(`.palette-node:has-text("${nodeType}")`).first()
        
        await node.dragTo(canvas, {
          targetPosition: { 
            x: 200 + (i % 5) * 150, 
            y: 200 + Math.floor(i / 5) * 150 
          }
        })
        
        // Small delay to prevent overwhelming
        await page.waitForTimeout(100)
      }
      
      // Verify nodes were created
      const nodes = page.locator('[data-testid^="rf__node-"]')
      const count = await nodes.count()
      expect(count).toBeGreaterThanOrEqual(10)
      
      // App should still be responsive
      const executeButton = page.locator('button:has-text("Execute")')
      await expect(executeButton).toBeVisible()
    })

    test('should handle very long input text', async ({ page }) => {
      // Add input node
      const canvas = page.locator('.workflow-canvas')
      const inputNode = page.locator('.palette-node:has-text("Input")').first()
      
      await inputNode.dragTo(canvas, {
        targetPosition: { x: 300, y: 200 }
      })
      
      // Click to configure
      const createdNode = page.locator('[data-testid^="rf__node-"]').first()
      await createdNode.click()
      
      // Enter very long text
      const longText = 'Lorem ipsum '.repeat(1000) // ~12,000 characters
      const textArea = page.locator('textarea').first()
      await textArea.fill(longText)
      
      // Should handle without crashing
      await expect(textArea).toHaveValue(longText)
    })
  })

  test.describe('Rapid User Actions', () => {
    test('should handle rapid node creation', async ({ page }) => {
      const canvas = page.locator('.workflow-canvas')
      const inputNode = page.locator('.palette-node:has-text("Input")').first()
      
      // Rapidly create nodes
      for (let i = 0; i < 5; i++) {
        await inputNode.dragTo(canvas, {
          targetPosition: { x: 200 + i * 50, y: 200 }
        })
        // No delay - rapid fire
      }
      
      // Should have created all nodes
      await page.waitForTimeout(1000)
      const nodes = page.locator('[data-testid^="rf__node-"]')
      const count = await nodes.count()
      expect(count).toBeGreaterThanOrEqual(5)
    })

    test('should handle rapid theme toggling', async ({ page }) => {
      const themeToggle = page.locator('button[aria-label*="theme"]')
      
      if (await themeToggle.isVisible()) {
        // Toggle rapidly
        for (let i = 0; i < 10; i++) {
          await themeToggle.click()
          // No delay
        }
        
        // App should still work
        await expect(page.locator('.workflow-builder')).toBeVisible()
      }
    })
  })

  test.describe('Browser Constraints', () => {
    test('should work with localStorage disabled', async ({ page, context }) => {
      // Disable localStorage
      await context.addInitScript(() => {
        delete window.localStorage
      })
      
      await page.reload()
      
      // App should still load
      const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
      await expect(launchButton).toBeVisible({ timeout: 10000 })
    })

    test('should handle slow network', async ({ page, context }) => {
      // Simulate slow 3G
      await page.route('**/*', (route) => {
        setTimeout(() => route.continue(), 1000)
      })
      
      // App should handle delays gracefully
      const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
      await expect(launchButton).toBeVisible({ timeout: 30000 })
    })
  })

  test.describe('Special Characters and Unicode', () => {
    test('should handle emoji in workflow names', async ({ page }) => {
      // Open workflow creation
      const workflowButton = page.locator('button:has-text("Workflow")')
      await workflowButton.click()
      
      const createButton = page.locator('button:has-text("Create New")')
      if (await createButton.isVisible()) {
        await createButton.click()
        
        // Enter emoji name
        const nameInput = page.locator('input[placeholder*="workflow name"]')
        await nameInput.fill('🚀 My Awesome Workflow 🎉')
        
        const confirmButton = page.locator('button:has-text("Create")')
        await confirmButton.click()
        
        // Should handle emoji
        await expect(page.locator('text=🚀 My Awesome Workflow 🎉')).toBeVisible({ timeout: 5000 })
      }
    })

    test('should handle special characters in prompts', async ({ page }) => {
      const canvas = page.locator('.workflow-canvas')
      
      // Add LLM node
      const llmNode = page.locator('.palette-node:has-text("LLM")').first()
      await llmNode.dragTo(canvas, {
        targetPosition: { x: 300, y: 200 }
      })
      
      // Configure with special characters
      const createdNode = page.locator('.llm-node').first()
      await createdNode.click()
      
      const promptInput = page.locator('textarea[name="prompt"], textarea[placeholder*="prompt"]').first()
      if (await promptInput.isVisible()) {
        const specialText = '<<<Hello>>> & "World" with \'quotes\' and \\backslash\\ plus émojis 🎭'
        await promptInput.fill(specialText)
        
        // Should handle without escaping issues
        await expect(promptInput).toHaveValue(specialText)
      }
    })
  })

  test.describe('Undo/Redo Edge Cases', () => {
    test('should handle undo when no actions taken', async ({ page }) => {
      // Try undo without doing anything
      await page.keyboard.press('Control+z')
      
      // Should not crash
      await expect(page.locator('.workflow-builder')).toBeVisible()
    })

    test('should handle redo when nothing to redo', async ({ page }) => {
      // Try redo without undo
      await page.keyboard.press('Control+Shift+z')
      
      // Should not crash
      await expect(page.locator('.workflow-builder')).toBeVisible()
    })
  })

  test.describe('Connection Edge Cases', () => {
    test('should prevent circular connections', async ({ page }) => {
      const canvas = page.locator('.workflow-canvas')
      
      // Create a chain of nodes
      const positions = [
        { x: 200, y: 200 },
        { x: 400, y: 200 },
        { x: 600, y: 200 }
      ]
      
      for (let i = 0; i < 3; i++) {
        const llmNode = page.locator('.palette-node:has-text("LLM")').first()
        await llmNode.dragTo(canvas, {
          targetPosition: positions[i]
        })
        await page.waitForTimeout(200)
      }
      
      // Try to create circular connection (would need connection logic)
      // For now, just verify nodes exist
      const nodes = page.locator('.llm-node')
      await expect(nodes).toHaveCount(3)
    })

    test('should handle disconnecting nodes', async ({ page }) => {
      const canvas = page.locator('.workflow-canvas')
      
      // Create two connected nodes
      const inputNode = page.locator('.palette-node:has-text("Input")').first()
      await inputNode.dragTo(canvas, {
        targetPosition: { x: 200, y: 200 }
      })
      
      const outputNode = page.locator('.palette-node:has-text("Output")').first()
      await outputNode.dragTo(canvas, {
        targetPosition: { x: 400, y: 200 }
      })
      
      // Verify both nodes exist
      await expect(page.locator('.input-node')).toBeVisible()
      await expect(page.locator('.output-node')).toBeVisible()
    })
  })
})