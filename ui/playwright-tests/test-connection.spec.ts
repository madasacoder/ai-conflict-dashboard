import { test, expect } from '@playwright/test'
import { launchWorkflowBuilder, addNodeToCanvas } from './helpers/workflowHelpers'

test('test node connection manually', async ({ page }) => {
  await page.goto('/')
  await launchWorkflowBuilder(page)
  
  // Add two nodes
  await addNodeToCanvas(page, 'input', { x: 100, y: 100 })
  await addNodeToCanvas(page, 'llm', { x: 400, y: 100 })
  
  // Wait a bit for nodes to be fully rendered
  await page.waitForTimeout(500)
  
  // Get React Flow nodes
  const rfNodes = page.locator('.react-flow__node')
  const nodeCount = await rfNodes.count()
  console.log('React Flow nodes:', nodeCount)
  
  // Get the first node's output handle
  const firstNode = rfNodes.filter({ hasText: /input/i }).first()
  const sourceHandle = firstNode.locator('.react-flow__handle.source').first()
  
  // Get the second node's input handle
  const secondNode = rfNodes.filter({ hasText: /llm/i }).first()
  const targetHandle = secondNode.locator('.react-flow__handle.target').first()
  
  // Check if handles exist
  const sourceExists = await sourceHandle.isVisible()
  const targetExists = await targetHandle.isVisible()
  console.log('Source handle visible:', sourceExists)
  console.log('Target handle visible:', targetExists)
  
  if (sourceExists && targetExists) {
    // Get handle positions
    const sourceBox = await sourceHandle.boundingBox()
    const targetBox = await targetHandle.boundingBox()
    
    if (sourceBox && targetBox) {
      console.log('Source handle position:', sourceBox)
      console.log('Target handle position:', targetBox)
      
      // Try to connect with a more deliberate drag
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
      await page.waitForTimeout(100)
      await page.mouse.down()
      await page.waitForTimeout(100)
      
      // Move in steps to simulate a real drag
      const steps = 5
      for (let i = 1; i <= steps; i++) {
        const x = sourceBox.x + (targetBox.x - sourceBox.x) * (i / steps) + sourceBox.width / 2
        const y = sourceBox.y + (targetBox.y - sourceBox.y) * (i / steps) + sourceBox.height / 2
        await page.mouse.move(x, y)
        await page.waitForTimeout(50)
      }
      
      // Final position
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2)
      await page.waitForTimeout(100)
      await page.mouse.up()
      await page.waitForTimeout(500)
      
      // Check if edge was created
      const edges = await page.locator('.react-flow__edge').count()
      console.log('Edges created:', edges)
      
      // Check for connection line
      const connectionLine = await page.locator('.react-flow__connection').count()
      console.log('Connection lines:', connectionLine)
      
      // Check if any paths exist
      const svgPaths = await page.locator('.react-flow__edges path').count()
      console.log('SVG paths in edges:', svgPaths)
    }
  }
})