/**
 * Helper functions for drag and drop testing with React Flow
 * 
 * Since Playwright's native dragTo doesn't work with React Flow,
 * we use custom drag events that properly set dataTransfer.
 */

import { Page } from '@playwright/test'

/**
 * Drags a node from the palette to the canvas using custom drag events
 * @param page - Playwright page object
 * @param nodeType - Type of node to drag (e.g., 'input', 'llm', 'compare')
 * @param position - Target position on canvas
 */
export async function dragNodeToCanvas(
  page: Page,
  nodeType: string,
  position: { x: number, y: number } = { x: 300, y: 200 }
) {
  // Map node types to labels
  const nodeLabels: Record<string, string> = {
    'input': 'Input',
    'llm': 'AI Analysis',
    'compare': 'Compare',
    'output': 'Output',
    'summarize': 'Summarize'
  }
  
  const label = nodeLabels[nodeType] || nodeType
  
  // Execute drag operation in browser context
  return page.evaluate(({ nodeLabel, nodeType, targetX, targetY }) => {
    // Find the palette node
    const paletteNodes = Array.from(document.querySelectorAll('.palette-node'))
    const sourceElement = paletteNodes.find(node => 
      node.textContent?.includes(nodeLabel)
    )
    
    if (!sourceElement) {
      throw new Error(`Palette node with label "${nodeLabel}" not found`)
    }
    
    // Find the canvas
    const targetElement = document.querySelector('.workflow-canvas')
    if (!targetElement) {
      throw new Error('Canvas element not found')
    }
    
    // Get canvas bounds for position calculation
    const canvasBounds = targetElement.getBoundingClientRect()
    
    // Create DataTransfer object with node type
    const dataTransfer = new DataTransfer()
    dataTransfer.setData('application/reactflow', nodeType)
    dataTransfer.setData('text/plain', nodeType)
    dataTransfer.setData('text', nodeType)
    dataTransfer.effectAllowed = 'copy'
    
    // Dispatch dragstart on source
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      cancelable: true,
      dataTransfer
    })
    sourceElement.dispatchEvent(dragStartEvent)
    
    // Calculate absolute position
    const absoluteX = canvasBounds.left + targetX
    const absoluteY = canvasBounds.top + targetY
    
    // Dispatch dragover on target (required for drop to work)
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      dataTransfer,
      clientX: absoluteX,
      clientY: absoluteY
    })
    targetElement.dispatchEvent(dragOverEvent)
    
    // Dispatch drop on target
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer,
      clientX: absoluteX,
      clientY: absoluteY
    })
    targetElement.dispatchEvent(dropEvent)
    
    // Dispatch dragend on source (cleanup)
    const dragEndEvent = new DragEvent('dragend', {
      bubbles: true,
      cancelable: true,
      dataTransfer
    })
    sourceElement.dispatchEvent(dragEndEvent)
    
    return {
      success: true,
      nodeType,
      position: { x: targetX, y: targetY }
    }
  }, { nodeLabel: label, nodeType, targetX: position.x, targetY: position.y })
}

/**
 * Waits for a node to appear in the canvas
 * @param page - Playwright page object  
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForNode(page: Page, timeout: number = 5000) {
  await page.waitForSelector('.react-flow__node', { timeout })
}

/**
 * Gets the count of nodes in the canvas
 * @param page - Playwright page object
 */
export async function getNodeCount(page: Page): Promise<number> {
  return page.locator('.react-flow__node').count()
}

/**
 * Verifies a node was created with specific text
 * @param page - Playwright page object
 * @param nodeText - Text content to look for in the node
 */
export async function verifyNodeWithText(page: Page, nodeText: string) {
  const node = page.locator('.react-flow__node').filter({ hasText: nodeText })
  // Use count() to check if at least one exists, avoiding strict mode issues
  const count = await node.count()
  return count > 0
}

/**
 * Connects two nodes with an edge
 * @param page - Playwright page object
 * @param sourceNodeIndex - Index of source node (0-based)
 * @param targetNodeIndex - Index of target node (0-based)
 */
export async function connectNodes(
  page: Page,
  sourceNodeIndex: number,
  targetNodeIndex: number
) {
  // This would need to be implemented based on how React Flow handles connections
  // Typically involves dragging from a handle on one node to a handle on another
  
  return page.evaluate(({ sourceIdx, targetIdx }) => {
    const nodes = document.querySelectorAll('.react-flow__node')
    const sourceNode = nodes[sourceIdx]
    const targetNode = nodes[targetIdx]
    
    if (!sourceNode || !targetNode) {
      throw new Error('Nodes not found')
    }
    
    // Find handles
    const sourceHandle = sourceNode.querySelector('.source')
    const targetHandle = targetNode.querySelector('.target')
    
    if (!sourceHandle || !targetHandle) {
      throw new Error('Handles not found')
    }
    
    // Simulate connection (this is simplified - real implementation would need React Flow API)
    console.log('Would connect nodes:', sourceIdx, 'to', targetIdx)
    
    return { connected: false, message: 'Connection logic not yet implemented' }
  }, { sourceIdx: sourceNodeIndex, targetIdx: targetNodeIndex })
}