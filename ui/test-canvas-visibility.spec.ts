import { test, expect } from '@playwright/test'

test('canvas visibility debug', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
  await launchButton.click()
  
  // Check workflow builder container
  const builder = page.locator('[data-testid="workflow-builder"]')
  await expect(builder).toBeVisible()
  const builderBox = await builder.boundingBox()
  console.log('Builder box:', builderBox)
  
  // Check canvas
  const canvas = page.locator('.workflow-canvas')
  await expect(canvas).toBeVisible()
  const canvasBox = await canvas.boundingBox()
  console.log('Canvas box:', canvasBox)
  
  // Check if canvas has height
  const canvasHeight = await canvas.evaluate(el => {
    const styles = window.getComputedStyle(el)
    return {
      height: styles.height,
      display: styles.display,
      visibility: styles.visibility,
      position: styles.position
    }
  })
  console.log('Canvas styles:', canvasHeight)
  
  // Check palette
  const palette = page.locator('.node-palette')
  const isPaletteVisible = await palette.isVisible()
  console.log('Palette visible:', isPaletteVisible)
  
  if (isPaletteVisible) {
    const paletteNodes = await page.locator('.palette-node').count()
    console.log('Palette nodes count:', paletteNodes)
  }
})
