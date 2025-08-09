import { test, expect } from '@playwright/test'

test.describe('Basic E2E Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')
    
    // Check for main application container
    await expect(page.locator('#root')).toBeVisible()
  })

  test('should have workflow builder visible', async ({ page }) => {
    await page.goto('/')
    
    // Click the launch button to show workflow builder
    const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
    await launchButton.click()
    
    // Look for workflow builder elements
    const workflowContainer = page.locator('[data-testid="workflow-builder"], .workflow-builder, #workflow-builder')
    await expect(workflowContainer.first()).toBeVisible({ timeout: 10000 })
  })

  test('should connect to backend API', async ({ page }) => {
    // Test API health endpoint
    const response = await page.request.get('http://localhost:8000/api/health')
    expect(response.ok()).toBeTruthy()
    
    const health = await response.json()
    expect(health.status).toBe('healthy')
  })

  test('should have node palette available', async ({ page }) => {
    await page.goto('/')
    
    // Click the launch button to show workflow builder
    const launchButton = page.locator('button:has-text("Launch Workflow Builder")')
    await launchButton.click()
    
    // Check for node palette or sidebar
    const palette = page.locator('[data-testid="node-palette"], .node-palette, .sidebar')
    await expect(palette.first()).toBeVisible({ timeout: 10000 })
  })
})