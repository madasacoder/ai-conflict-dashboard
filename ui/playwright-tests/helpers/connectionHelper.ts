/**
 * Alternative connection helper that uses the store API directly
 * This bypasses React Flow's drag-and-drop mechanics for testing
 */

import { Page } from '@playwright/test'

/**
 * Connect nodes programmatically via the store API
 */
export async function connectNodesProgrammatically(
  page: Page,
  sourceNodeId: string,
  targetNodeId: string,
  sourceHandleId: string = 'output',
  targetHandleId: string = 'input'
) {
  // Use the store API directly to create a connection
  const result = await page.evaluate(({ source, target, sourceHandle, targetHandle }) => {
    // Access the workflow store from window
    const store = (window as any).workflowStore
    if (!store) {
      throw new Error('Workflow store not available')
    }
    
    const state = store.getState()
    
    // Verify nodes exist
    const sourceNode = state.nodes.find((n: any) => n.id === source)
    const targetNode = state.nodes.find((n: any) => n.id === target)
    
    if (!sourceNode || !targetNode) {
      throw new Error(`Nodes not found: source=${source}, target=${target}`)
    }
    
    // Create the connection
    const connection = {
      source,
      target,
      sourceHandle,
      targetHandle,
      id: `edge-${source}-${target}`
    }
    
    // Call onConnect to add the edge
    state.onConnect(connection)
    
    // Return the new edge count
    return store.getState().edges.length
  }, {
    source: sourceNodeId,
    target: targetNodeId,
    sourceHandle: sourceHandleId,
    targetHandle: targetHandleId
  })
  
  return result
}

/**
 * Get node IDs from the page
 */
export async function getNodeIds(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const store = (window as any).workflowStore
    if (!store) return []
    
    const state = store.getState()
    return state.nodes.map((n: any) => n.id)
  })
}

/**
 * Connect nodes by their index using the store API
 */
export async function connectNodesByIndex(
  page: Page,
  sourceIndex: number,
  targetIndex: number
) {
  const nodeIds = await getNodeIds(page)
  
  if (sourceIndex >= nodeIds.length || targetIndex >= nodeIds.length) {
    throw new Error(`Invalid node indices: ${sourceIndex}, ${targetIndex}`)
  }
  
  return connectNodesProgrammatically(
    page,
    nodeIds[sourceIndex],
    nodeIds[targetIndex]
  )
}

/**
 * Verify edge exists between nodes
 */
export async function edgeExists(
  page: Page,
  sourceNodeId: string,
  targetNodeId: string
): Promise<boolean> {
  return await page.evaluate(({ source, target }) => {
    const store = (window as any).workflowStore
    if (!store) return false
    
    const state = store.getState()
    return state.edges.some((e: any) => 
      e.source === source && e.target === target
    )
  }, { source: sourceNodeId, target: targetNodeId })
}

/**
 * Get total edge count
 */
export async function getEdgeCount(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const store = (window as any).workflowStore
    if (!store) return 0
    return store.getState().edges.length
  })
}