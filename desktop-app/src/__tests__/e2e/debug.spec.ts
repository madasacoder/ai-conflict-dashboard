import { test } from '@playwright/test'

test('debug what is on the page', async ({ page }) => {
  await page.goto('/')
  
  // Take screenshot of initial page
  await page.screenshot({ path: 'initial-page.png' })
  
  // Log the page content
  const title = await page.title()
  console.log('Page title:', title)
  
  // Check if welcome screen is visible
  const welcomeText = await page.locator('text=Welcome').count()
  console.log('Welcome elements found:', welcomeText)
  
  // Check for Get Started button
  const getStartedButton = await page.locator('button').filter({ hasText: 'Get Started' }).count()
  console.log('Get Started button found:', getStartedButton)
  
  // Click Launch Workflow Builder
  const launchButton = await page.locator('button').filter({ hasText: 'Launch Workflow Builder' }).count()
  console.log('Launch button found:', launchButton)
  
  if (launchButton > 0) {
    await page.locator('button').filter({ hasText: 'Launch Workflow Builder' }).first().click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'after-launch.png' })
    
    // Check what's on the page after clicking
    const canvasFound = await page.locator('.workflow-canvas').count()
    const reactFlowFound = await page.locator('.react-flow__renderer').count()
    const workflowBuilderFound = await page.locator('.workflow-builder').count()
    
    console.log('After clicking launch:')
    console.log('- .workflow-canvas found:', canvasFound)
    console.log('- .react-flow__renderer found:', reactFlowFound)
    console.log('- .workflow-builder found:', workflowBuilderFound)
  }
  
  // List all visible elements
  const allButtons = await page.locator('button').allTextContents()
  console.log('All buttons:', allButtons)
  
  const allDivs = await page.locator('div[class]').evaluateAll(divs => 
    divs.slice(0, 10).map(div => div.className)
  )
  console.log('First 10 div classes:', allDivs)
})