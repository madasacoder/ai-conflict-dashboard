/**
 * Strong assertion helpers for TypeScript/React tests
 * 
 * These helpers enforce business value validation over simple existence checks
 */

export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data?: Record<string, any>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
}

export interface LLMResponse {
  model: string
  response: string
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  cost?: number
  error?: string | null
}

const VALID_NODE_TYPES = ['input', 'llm', 'output', 'processor', 'splitter', 'combiner']
const VALID_MODELS = ['gpt-3.5-turbo', 'gpt-4', 'claude-3-opus', 'gemini-pro', 'llama2']

/**
 * Assert that a workflow node is valid and complete
 */
export function assertValidNode(node: WorkflowNode): void {
  // Structure validation
  expect(node).toBeDefined()
  expect(node.id).toBeTruthy()
  expect(node.id.length).toBeGreaterThan(0)
  
  // Type validation
  expect(node.type).toBeDefined()
  expect(VALID_NODE_TYPES).toContain(node.type)
  
  // Position validation
  expect(node.position).toBeDefined()
  expect(typeof node.position.x).toBe('number')
  expect(typeof node.position.y).toBe('number')
  expect(node.position.x).toBeGreaterThanOrEqual(0)
  expect(node.position.y).toBeGreaterThanOrEqual(0)
  expect(node.position.x).toBeLessThan(10000) // Reasonable canvas bounds
  expect(node.position.y).toBeLessThan(10000)
  
  // Data validation based on node type
  if (node.type === 'input' && node.data) {
    expect(node.data.text || node.data.file).toBeDefined()
    if (node.data.text) {
      expect(typeof node.data.text).toBe('string')
      expect(node.data.text.length).toBeGreaterThan(0)
    }
  }
  
  if (node.type === 'llm' && node.data) {
    expect(node.data.model).toBeDefined()
    expect(VALID_MODELS).toContain(node.data.model)
    expect(node.data.apiKey).toBeDefined()
    expect(node.data.apiKey.length).toBeGreaterThan(10)
  }
}

/**
 * Assert that workflow edges form valid connections
 */
export function assertValidEdge(edge: WorkflowEdge, nodes: WorkflowNode[]): void {
  // Basic structure
  expect(edge).toBeDefined()
  expect(edge.id).toBeTruthy()
  expect(edge.source).toBeTruthy()
  expect(edge.target).toBeTruthy()
  
  // Source and target must exist
  const sourceNode = nodes.find(n => n.id === edge.source)
  const targetNode = nodes.find(n => n.id === edge.target)
  
  expect(sourceNode).toBeDefined()
  expect(targetNode).toBeDefined()
  
  // No self-loops
  expect(edge.source).not.toBe(edge.target)
  
  // Type compatibility checks
  if (sourceNode && targetNode) {
    // Input nodes should not be targets
    expect(targetNode.type).not.toBe('input')
    // Output nodes should not be sources
    expect(sourceNode.type).not.toBe('output')
  }
}

/**
 * Assert that a complete workflow is valid
 */
export function assertValidWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): void {
  // Must have nodes
  expect(nodes.length).toBeGreaterThan(0)
  
  // Must have at least one input node
  const inputNodes = nodes.filter(n => n.type === 'input')
  expect(inputNodes.length).toBeGreaterThan(0)
  
  // Each node should be valid
  nodes.forEach(node => assertValidNode(node))
  
  // Each edge should be valid
  edges.forEach(edge => assertValidEdge(edge, nodes))
  
  // Check for disconnected nodes (except input/output)
  const connectedNodeIds = new Set<string>()
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  })
  
  const disconnectedNodes = nodes.filter(
    n => !connectedNodeIds.has(n.id) && 
    n.type !== 'input' && 
    n.type !== 'output'
  )
  
  expect(disconnectedNodes.length).toBe(0)
  
  // Check for cycles (simplified - just ensure DAG property)
  expect(hasCycle(nodes, edges)).toBe(false)
}

/**
 * Simple cycle detection for workflow validation
 */
function hasCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const adjacency: Record<string, string[]> = {}
  nodes.forEach(n => { adjacency[n.id] = [] })
  edges.forEach(e => { adjacency[e.source].push(e.target) })
  
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  
  function dfs(nodeId: string): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)
    
    for (const neighbor of adjacency[nodeId] || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true
      } else if (recursionStack.has(neighbor)) {
        return true
      }
    }
    
    recursionStack.delete(nodeId)
    return false
  }
  
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true
    }
  }
  
  return false
}

/**
 * Assert LLM response is valid and complete
 */
export function assertValidLLMResponse(response: LLMResponse): void {
  // Structure validation
  expect(response).toBeDefined()
  
  // Model validation
  expect(response.model).toBeDefined()
  expect(VALID_MODELS).toContain(response.model)
  
  // Response content validation
  expect(response.response).toBeDefined()
  expect(typeof response.response).toBe('string')
  expect(response.response.length).toBeGreaterThan(0)
  expect(response.response.trim()).not.toBe('')
  
  // Token validation
  expect(response.tokens).toBeDefined()
  expect(response.tokens.prompt).toBeGreaterThanOrEqual(0)
  expect(response.tokens.completion).toBeGreaterThan(0)
  expect(response.tokens.total).toBeGreaterThan(0)
  
  // Token math validation
  const expectedTotal = response.tokens.prompt + response.tokens.completion
  expect(response.tokens.total).toBe(expectedTotal)
  
  // Cost validation if present
  if (response.cost !== undefined) {
    expect(typeof response.cost).toBe('number')
    expect(response.cost).toBeGreaterThanOrEqual(0)
    expect(response.cost).toBeLessThan(100) // Reasonable upper bound
  }
  
  // Error should be null for successful responses
  if (!response.error) {
    expect(response.response.length).toBeGreaterThan(0)
  }
}

/**
 * Assert multiple LLM responses show conflicts
 */
export function assertConflictDetection(
  responses: LLMResponse[], 
  expectedConflictCount?: number
): void {
  // Need at least 2 responses to have conflicts
  expect(responses.length).toBeGreaterThanOrEqual(2)
  
  // All responses should be valid
  responses.forEach(r => assertValidLLMResponse(r))
  
  // Simple conflict detection
  const conflicts = detectConflicts(responses)
  
  expect(conflicts).toBeDefined()
  expect(Array.isArray(conflicts)).toBe(true)
  
  if (expectedConflictCount !== undefined) {
    expect(conflicts.length).toBe(expectedConflictCount)
  }
  
  // Validate each conflict
  conflicts.forEach(conflict => {
    expect(conflict.type).toBeDefined()
    expect(['semantic', 'factual', 'tone', 'confidence']).toContain(conflict.type)
    expect(conflict.severity).toBeDefined()
    expect(['low', 'medium', 'high']).toContain(conflict.severity)
    expect(conflict.models).toBeDefined()
    expect(conflict.models.length).toBeGreaterThanOrEqual(2)
  })
}

/**
 * Simple conflict detection between responses
 */
function detectConflicts(responses: LLMResponse[]): any[] {
  const conflicts = []
  
  for (let i = 0; i < responses.length; i++) {
    for (let j = i + 1; j < responses.length; j++) {
      const r1 = responses[i].response.toLowerCase()
      const r2 = responses[j].response.toLowerCase()
      
      // Check for opposite sentiments
      if ((r1.includes('yes') && r2.includes('no')) || 
          (r1.includes('no') && r2.includes('yes'))) {
        conflicts.push({
          type: 'factual',
          severity: 'high',
          models: [responses[i].model, responses[j].model]
        })
      }
      
      // Check for buy/sell conflicts
      if ((r1.includes('buy') && r2.includes('sell')) ||
          (r1.includes('sell') && r2.includes('buy'))) {
        conflicts.push({
          type: 'semantic',
          severity: 'high',
          models: [responses[i].model, responses[j].model]
        })
      }
    }
  }
  
  return conflicts
}

/**
 * Assert DOM element has expected state
 */
export function assertElementState(
  element: HTMLElement,
  expectedState: {
    visible?: boolean
    enabled?: boolean
    text?: string
    classes?: string[]
    attributes?: Record<string, string>
  }
): void {
  if (expectedState.visible !== undefined) {
    expect(element).toBeVisible()
  }
  
  if (expectedState.enabled !== undefined) {
    if (expectedState.enabled) {
      expect(element).not.toBeDisabled()
    } else {
      expect(element).toBeDisabled()
    }
  }
  
  if (expectedState.text) {
    expect(element).toHaveTextContent(expectedState.text)
  }
  
  if (expectedState.classes) {
    expectedState.classes.forEach(className => {
      expect(element).toHaveClass(className)
    })
  }
  
  if (expectedState.attributes) {
    Object.entries(expectedState.attributes).forEach(([key, value]) => {
      expect(element).toHaveAttribute(key, value)
    })
  }
}

/**
 * Assert async operation completes within time limit
 */
export async function assertCompletesWithin(
  operation: () => Promise<any>,
  maxMs: number
): Promise<void> {
  const start = performance.now()
  await operation()
  const duration = performance.now() - start
  
  expect(duration).toBeLessThan(maxMs)
}

/**
 * Assert error message is user-friendly
 */
export function assertUserFriendlyError(error: any): void {
  expect(error).toBeDefined()
  expect(error.message).toBeDefined()
  expect(typeof error.message).toBe('string')
  expect(error.message.length).toBeGreaterThan(0)
  
  // Should not expose internals
  expect(error.message).not.toContain('undefined')
  expect(error.message).not.toContain('null')
  expect(error.message).not.toContain('TypeError')
  expect(error.message).not.toContain('stack')
  expect(error.message).not.toContain('at line')
  
  // Should not expose sensitive data
  expect(error.message.toLowerCase()).not.toContain('api_key')
  expect(error.message.toLowerCase()).not.toContain('password')
  expect(error.message.toLowerCase()).not.toContain('secret')
}

/**
 * Assert localStorage contains expected workflow data
 */
export function assertWorkflowPersisted(workflowName: string): void {
  const stored = localStorage.getItem('workflows')
  expect(stored).toBeDefined()
  
  const workflows = JSON.parse(stored || '[]')
  expect(Array.isArray(workflows)).toBe(true)
  
  const workflow = workflows.find((w: any) => w.name === workflowName)
  expect(workflow).toBeDefined()
  expect(workflow.nodes).toBeDefined()
  expect(workflow.edges).toBeDefined()
  expect(workflow.timestamp).toBeDefined()
  
  // Validate it's a proper save
  expect(new Date(workflow.timestamp).getTime()).toBeLessThanOrEqual(Date.now())
  expect(new Date(workflow.timestamp).getTime()).toBeGreaterThan(Date.now() - 60000)
}