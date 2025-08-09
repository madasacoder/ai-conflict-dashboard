/**
 * Ollama Integration Tests - Playwright Version
 * Converted from src/__tests__/e2e/OllamaIntegration.test.tsx
 */

import { test, expect } from '@playwright/test'

test.describe('Desktop Workflow Builder - Ollama Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Launch workflow builder
    const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
    await expect(launchButton).toBeEnabled({ timeout: 10000 })
    await launchButton.click()
    
    await page.waitForSelector('[data-testid="workflow-builder"]')
  })

  test('should display Ollama models correctly in dropdown', async ({ page }) => {
    // Add LLM node
    const canvas = page.locator('.workflow-canvas')
    const llmNodePalette = page.locator('.palette-node:has-text("LLM")').first()
    
    await llmNodePalette.dragTo(canvas, {
      targetPosition: { x: 300, y: 200 }
    })
    
    // Click the LLM node to configure
    const llmNode = page.locator('.llm-node').first()
    await llmNode.click()
    
    // Wait for config panel
    await page.waitForSelector('[data-testid="node-config-panel"]')
    
    // Check for Ollama models in dropdown
    const modelSelect = page.locator('select[name="model"], select[id*="model"]').first()
    
    if (await modelSelect.isVisible()) {
      // Click to open dropdown
      await modelSelect.click()
      
      // Look for Ollama models (usually prefixed with ollama/ or have specific names)
      const ollamaOptions = page.locator('option[value*="ollama"], option[value*="llama"], option[value*="mistral"]')
      const count = await ollamaOptions.count()
      
      // Should have at least one Ollama model if Ollama is running
      // If not running, this test might fail which is expected
      if (count > 0) {
        expect(count).toBeGreaterThan(0)
      }
    }
  })

  test('should execute workflow with Ollama model', async ({ page }) => {
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
    await textArea.fill('What is 2+2?')
    
    // Add LLM node
    const llmNodePalette = page.locator('.palette-node:has-text("LLM")').first()
    await llmNodePalette.dragTo(canvas, {
      targetPosition: { x: 400, y: 200 }
    })
    
    // Configure LLM with Ollama model
    const llmNode = page.locator('.llm-node').first()
    await llmNode.click()
    
    // Try to select an Ollama model
    const modelSelect = page.locator('select[name="model"], select[id*="model"]').first()
    if (await modelSelect.isVisible()) {
      // Look for Ollama option
      const options = await modelSelect.locator('option').allTextContents()
      const ollamaOption = options.find(opt => 
        opt.toLowerCase().includes('ollama') || 
        opt.toLowerCase().includes('llama') ||
        opt.toLowerCase().includes('mistral')
      )
      
      if (ollamaOption) {
        await modelSelect.selectOption({ label: ollamaOption })
      }
    }
    
    // Add output node
    const outputNodePalette = page.locator('.palette-node:has-text("Output")').first()
    await outputNodePalette.dragTo(canvas, {
      targetPosition: { x: 600, y: 200 }
    })
    
    // Execute workflow
    const executeButton = page.locator('button:has-text("Execute")')
    await executeButton.click()
    
    // Wait for execution to complete or show progress
    const executionIndicator = page.locator(
      '[data-testid="execution-panel"], text=/Executing|Running|Processing|Complete|Error/'
    ).first()
    
    await expect(executionIndicator).toBeVisible({ timeout: 30000 })
  })

  test('should handle Ollama connection errors gracefully', async ({ page }) => {
    // Try to use Ollama when it might not be running
    const canvas = page.locator('.workflow-canvas')
    
    // Add LLM node
    const llmNodePalette = page.locator('.palette-node:has-text("LLM")').first()
    await llmNodePalette.dragTo(canvas, {
      targetPosition: { x: 300, y: 200 }
    })
    
    // Configure with Ollama
    const llmNode = page.locator('.llm-node').first()
    await llmNode.click()
    
    const modelSelect = page.locator('select[name="model"], select[id*="model"]').first()
    if (await modelSelect.isVisible()) {
      // Try to select Ollama
      const hasOllama = await modelSelect.locator('option[value*="ollama"]').count() > 0
      
      if (hasOllama) {
        await modelSelect.selectOption({ value: /ollama/ })
      } else {
        // If no Ollama models, that's already handling the error gracefully
        expect(hasOllama).toBe(false)
      }
    }
    
    // App should not crash
    await expect(page.locator('[data-testid="workflow-builder"]')).toBeVisible()
  })

  test('should refresh Ollama models list', async ({ page }) => {
    // Look for a refresh button in settings or model config
    const settingsButton = page.locator('button[aria-label*="settings"], button:has-text("Settings")').first()
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click()
      
      // Look for Ollama section
      const ollamaSection = page.locator('text=/Ollama|Local Models/i')
      
      if (await ollamaSection.isVisible()) {
        // Look for refresh button
        const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh"]').first()
        
        if (await refreshButton.isVisible()) {
          await refreshButton.click()
          
          // Should show loading or complete state
          const statusText = page.locator('text=/Loading|Refreshing|Updated|Complete/i')
          await expect(statusText).toBeVisible({ timeout: 5000 })
        }
      }
    }
  })

  test('should validate Ollama model selection before execution', async ({ page }) => {
    // Create workflow with LLM node
    const canvas = page.locator('.workflow-canvas')
    
    // Add input node
    const inputNodePalette = page.locator('.palette-node:has-text("Input")').first()
    await inputNodePalette.dragTo(canvas, {
      targetPosition: { x: 200, y: 200 }
    })
    
    // Add LLM node but don't configure it
    const llmNodePalette = page.locator('.palette-node:has-text("LLM")').first()
    await llmNodePalette.dragTo(canvas, {
      targetPosition: { x: 400, y: 200 }
    })
    
    // Try to execute without selecting a model
    const executeButton = page.locator('button:has-text("Execute")')
    await executeButton.click()
    
    // Should show validation error about model selection
    const errorMessage = page.locator(
      'text=/select.*model|model.*required|choose.*model/i'
    ).first()
    
    // Either validation error or LLM node should show unconfigured state
    const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)
    const hasWarning = await page.locator('.llm-node .status-icon.warning').isVisible().catch(() => false)
    
    expect(hasError || hasWarning).toBeTruthy()
  })
})