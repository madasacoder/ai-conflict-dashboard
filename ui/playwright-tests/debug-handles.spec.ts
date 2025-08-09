import { test, expect } from '@playwright/test'
import { launchWorkflowBuilder, addNodeToCanvas } from './helpers/workflowHelpers'

test('debug handle detection', async ({ page }) => {
  await page.goto('/')
  await launchWorkflowBuilder(page)
  
  // Add two nodes
  await addNodeToCanvas(page, 'input', { x: 100, y: 100 })
  await addNodeToCanvas(page, 'llm', { x: 300, y: 100 })
  
  // Debug: Check what handles are actually present
  const nodes = page.locator('[data-testid^="rf__node-"]')
  const nodeCount = await nodes.count()
  console.log('Total nodes:', nodeCount)
  
  // Check first node (input)
  const firstNode = nodes.nth(0)
  
  // Try different handle selectors
  const handleSelectors = [
    '.react-flow__handle',
    '.workflow-handle',
    '[data-handleid]',
    '[data-nodeid]',
    '.source',
    '.target',
    '.output-handle',
    '.input-handle'
  ]
  
  for (const selector of handleSelectors) {
    const handles = await firstNode.locator(selector).count()
    if (handles > 0) {
      console.log(`First node has ${handles} elements matching: ${selector}`)
      const handleElement = firstNode.locator(selector).first()
      const classNames = await handleElement.getAttribute('class')
      console.log(`  Classes: ${classNames}`)
    }
  }
  
  // Check second node (llm)
  const secondNode = nodes.nth(1)
  
  for (const selector of handleSelectors) {
    const handles = await secondNode.locator(selector).count()
    if (handles > 0) {
      console.log(`Second node has ${handles} elements matching: ${selector}`)
      const handleElement = secondNode.locator(selector).first()
      const classNames = await handleElement.getAttribute('class')
      console.log(`  Classes: ${classNames}`)
    }
  }
  
  // Specifically check for target/input handles
  const targetHandle = await secondNode.locator('.target').count()
  const inputHandle = await secondNode.locator('.input-handle').count()
  console.log(`Second node target handles: ${targetHandle}, input handles: ${inputHandle}`)
  
  // Try to find handles globally
  const globalHandles = await page.locator('.react-flow__handle').count()
  console.log('Total handles in page:', globalHandles)
  
  // Print HTML of first node to see structure
  const firstNodeHTML = await firstNode.innerHTML()
  console.log('First node HTML (truncated):', firstNodeHTML.substring(0, 500))
  
  // Check node types
  for (let i = 0; i < nodeCount; i++) {
    const node = nodes.nth(i)
    const classes = await node.getAttribute('class')
    console.log(`Node ${i} classes: ${classes}`)
    
    // Check for all handles
    const allHandles = await node.locator('.react-flow__handle').count()
    const sourceHandles = await node.locator('.source').count()
    const targetHandles = await node.locator('.target').count()
    console.log(`  Handles - Total: ${allHandles}, Source: ${sourceHandles}, Target: ${targetHandles}`)
  }
})