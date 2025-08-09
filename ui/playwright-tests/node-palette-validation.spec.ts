import { test, expect } from '@playwright/test'

test.describe('Node Palette Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
  })

  test('should have node palette visible with all node types', async ({ page }) => {
    // Wait for the workflow builder to be visible
    await page.waitForSelector('#workflow-builder', { timeout: 5000 })
    
    // Check if node palette exists
    const nodePalette = await page.locator('.node-palette')
    
    // If not visible, click the toggle button
    const isPaletteVisible = await nodePalette.isVisible().catch(() => false)
    if (!isPaletteVisible) {
      // Find and click the palette toggle button in toolbar
      const toggleButton = await page.locator('button').filter({ hasText: /node|palette|library/i }).first()
      if (await toggleButton.isVisible()) {
        await toggleButton.click()
        await page.waitForTimeout(500)
      }
    }
    
    // Now check if palette is visible
    await expect(nodePalette).toBeVisible()
    
    // Verify all node types are present
    const nodeTypes = [
      { label: 'Input', description: 'Text, file, or URL input' },
      { label: 'AI Analysis', description: 'Multi-model AI analysis' },
      { label: 'Compare', description: 'Find conflicts & consensus' },
      { label: 'Summarize', description: 'Consolidate results' },
      { label: 'Output', description: 'Export results' }
    ]
    
    for (const node of nodeTypes) {
      const nodeElement = await page.locator('.palette-node').filter({ hasText: node.label })
      await expect(nodeElement).toBeVisible()
      console.log(`✓ Found node: ${node.label}`)
    }
  })

  test('should switch between drag and click modes', async ({ page }) => {
    await page.waitForSelector('#workflow-builder', { timeout: 5000 })
    
    // Ensure palette is visible
    const nodePalette = await page.locator('.node-palette')
    if (!(await nodePalette.isVisible().catch(() => false))) {
      const toggleButton = await page.locator('button[title*="Node"]').first()
      if (await toggleButton.isVisible()) {
        await toggleButton.click()
      }
    }
    
    // Check for mode toggle buttons
    const dragModeBtn = await page.locator('.mode-btn[title*="Drag"]')
    const clickModeBtn = await page.locator('.mode-btn[title*="Click"]')
    
    await expect(dragModeBtn).toBeVisible()
    await expect(clickModeBtn).toBeVisible()
    
    // Test mode switching
    await clickModeBtn.click()
    await expect(clickModeBtn).toHaveClass(/active/)
    
    await dragModeBtn.click()
    await expect(dragModeBtn).toHaveClass(/active/)
  })

  test('should add node by clicking in click mode', async ({ page }) => {
    await page.waitForSelector('#workflow-builder', { timeout: 5000 })
    
    // Ensure palette is visible
    const nodePalette = await page.locator('.node-palette')
    if (!(await nodePalette.isVisible().catch(() => false))) {
      const toggleButton = await page.locator('button[title*="Node"]').first()
      if (await toggleButton.isVisible()) {
        await toggleButton.click()
      }
    }
    
    // Switch to click mode
    const clickModeBtn = await page.locator('.mode-btn[title*="Click"]')
    await clickModeBtn.click()
    
    // Click on Input node
    const inputNode = await page.locator('.palette-node').filter({ hasText: 'Input' }).first()
    await inputNode.click()
    
    // Wait for node to be created
    await page.waitForTimeout(500)
    
    // Check if a node was added to the canvas
    const canvasNode = await page.locator('.react-flow__node')
    await expect(canvasNode).toHaveCount(1)
  })
})