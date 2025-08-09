/**
 * WorkflowExecutor - Service for executing workflows with real-time progress tracking
 * 
 * Manages workflow execution, progress tracking, cancellation, and result collection.
 * Provides real-time updates via callbacks for UI components.
 */

import { Node, Edge, ExecutionResult, WorkflowExecution } from '@/types/workflow'

export interface ExecutionOptions {
  apiKeys?: Record<string, string>
  onProgress?: (progress: ExecutionProgress) => void
  onNodeStart?: (nodeId: string) => void
  onNodeComplete?: (nodeId: string, result: ExecutionResult) => void
  onNodeError?: (nodeId: string, error: string) => void
  signal?: AbortSignal
}

export interface ExecutionProgress {
  completed: number
  total: number
  current?: string
  percentage: number
  startTime: Date
  estimatedTimeRemaining?: number
}

export interface NodeExecutionContext {
  node: Node
  inputs: Record<string, any>
  previousResults: Record<string, ExecutionResult>
}

export class WorkflowExecutor {
  private isExecuting = false
  private abortController?: AbortController
  private execution?: WorkflowExecution

  /**
   * Execute a workflow with the given nodes and edges
   */
  async executeWorkflow(
    nodes: Node[],
    edges: Edge[],
    options: ExecutionOptions = {}
  ): Promise<WorkflowExecution> {
    if (this.isExecuting) {
      throw new Error('Workflow execution already in progress')
    }

    this.isExecuting = true
    this.abortController = new AbortController()
    
    const startTime = new Date()
    this.execution = {
      workflowId: `exec-${Date.now()}`,
      startTime,
      status: 'running',
      results: []
    }

    try {
      // Validate workflow
      this.validateWorkflow(nodes, edges)

      // Build execution order based on dependencies
      const executionOrder = this.buildExecutionOrder(nodes, edges)
      
      // Initialize progress tracking
      const progress: ExecutionProgress = {
        completed: 0,
        total: executionOrder.length,
        percentage: 0,
        startTime
      }

      options.onProgress?.(progress)

      // Execute nodes in order
      const results: ExecutionResult[] = []
      const nodeResults: Record<string, ExecutionResult> = {}

      for (let i = 0; i < executionOrder.length; i++) {
        // Check for cancellation
        if (this.abortController.signal.aborted || options.signal?.aborted) {
          this.execution.status = 'cancelled'
          break
        }

        const node = executionOrder[i]
        if (!node) continue
        progress.current = node.id
        progress.completed = i
        progress.percentage = Math.round((i / executionOrder.length) * 100)
        
        // Estimate time remaining
        if (i > 0) {
          const elapsed = Date.now() - startTime.getTime()
          const avgTimePerNode = elapsed / i
          const remainingNodes = executionOrder.length - i
          progress.estimatedTimeRemaining = Math.round(avgTimePerNode * remainingNodes / 1000) // seconds
        }

        options.onProgress?.(progress)
        options.onNodeStart?.(node!.id)

        try {
          // Get inputs for this node
          const inputs = this.getNodeInputs(node!, edges, nodeResults)
          
          // Execute the node
          const result = await this.executeNode({
            node: node!,
            inputs,
            previousResults: nodeResults
          }, options)

          results.push(result)
          nodeResults[node!.id] = result
          
          options.onNodeComplete?.(node!.id, result)
        } catch (error) {
          const errorResult: ExecutionResult = {
            nodeId: node!.id,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date(),
            duration: 0
          }
          
          results.push(errorResult)
          nodeResults[node!.id] = errorResult
          
          options.onNodeError?.(node!.id, errorResult.error!)
        }
      }

      // Final progress update
      progress.completed = executionOrder.length
      progress.percentage = 100
      delete progress.current
      options.onProgress?.(progress)

      // Complete execution
      this.execution.endTime = new Date()
      this.execution.totalDuration = this.execution.endTime.getTime() - startTime.getTime()
      this.execution.results = results
      this.execution.status = this.execution.status === 'cancelled' ? 'cancelled' : 
        results.every(r => r.success) ? 'completed' : 'failed'

      return this.execution

    } catch (error) {
      this.execution.status = 'failed'
      this.execution.endTime = new Date()
      this.execution.totalDuration = this.execution.endTime.getTime() - startTime.getTime()
      
      throw error
    } finally {
      this.isExecuting = false
      delete this.abortController
    }
  }

  /**
   * Cancel the current workflow execution
   */
  cancelExecution(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  /**
   * Check if workflow is currently executing
   */
  get executing(): boolean {
    return this.isExecuting
  }

  /**
   * Get current execution status
   */
  getCurrentExecution(): WorkflowExecution | undefined {
    return this.execution
  }

  /**
   * Validate workflow structure before execution
   */
  private validateWorkflow(nodes: Node[], edges: Edge[]): void {
    if (nodes.length === 0) {
      throw new Error('Workflow must contain at least one node')
    }

    // Check for cycles
    if (this.hasCycles(nodes, edges)) {
      throw new Error('Workflow contains circular dependencies')
    }

    // Validate node configurations
    for (const node of nodes) {
      this.validateNodeConfiguration(node)
    }

    // Validate connections
    for (const edge of edges) {
      const sourceNode = nodes.find(n => n.id === edge.source)
      const targetNode = nodes.find(n => n.id === edge.target)
      
      if (!sourceNode || !targetNode) {
        throw new Error(`Invalid connection: ${edge.source} -> ${edge.target}`)
      }
    }
  }

  /**
   * Build execution order using topological sort
   */
  private buildExecutionOrder(nodes: Node[], edges: Edge[]): Node[] {
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    const inDegree = new Map<string, number>()
    const adjacencyList = new Map<string, string[]>()

    // Initialize
    for (const node of nodes) {
      inDegree.set(node.id, 0)
      adjacencyList.set(node.id, [])
    }

    // Build graph
    for (const edge of edges) {
      adjacencyList.get(edge.source)!.push(edge.target)
      inDegree.set(edge.target, inDegree.get(edge.target)! + 1)
    }

    // Topological sort
    const queue: string[] = []
    const result: Node[] = []

    // Find nodes with no dependencies
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId)
      }
    }

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      const node = nodeMap.get(nodeId)!
      result.push(node)

      // Process neighbors
      for (const neighbor of adjacencyList.get(nodeId)!) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1)
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor)
        }
      }
    }

    if (result.length !== nodes.length) {
      throw new Error('Workflow contains circular dependencies')
    }

    return result
  }

  /**
   * Check for cycles in the workflow graph
   */
  private hasCycles(nodes: Node[], edges: Edge[]): boolean {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const adjacencyList = new Map<string, string[]>()

    // Build adjacency list
    for (const node of nodes) {
      adjacencyList.set(node.id, [])
    }
    for (const edge of edges) {
      adjacencyList.get(edge.source)!.push(edge.target)
    }

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId)
      recursionStack.add(nodeId)

      for (const neighbor of adjacencyList.get(nodeId) || []) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true
        } else if (recursionStack.has(neighbor)) {
          return true // Cycle found
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
   * Validate individual node configuration
   */
  private validateNodeConfiguration(node: Node): void {
    switch (node.type) {
      case 'input':
        if (!node.data['inputType']) {
          throw new Error(`Input node ${node.id} missing input type`)
        }
        break
      case 'llm':
        if (!node.data['models'] || node.data['models'].length === 0) {
          throw new Error(`LLM node ${node.id} missing model configuration`)
        }
        if (!node.data['prompt']) {
          throw new Error(`LLM node ${node.id} missing prompt`)
        }
        break
      case 'compare':
        if (!node.data['comparisonType']) {
          throw new Error(`Compare node ${node.id} missing comparison type`)
        }
        break
      case 'output':
        if (!node.data['outputFormat']) {
          throw new Error(`Output node ${node.id} missing output format`)
        }
        break
    }
  }

  /**
   * Get inputs for a node from connected edges and previous results
   */
  private getNodeInputs(
    node: Node,
    edges: Edge[],
    previousResults: Record<string, ExecutionResult>
  ): Record<string, any> {
    const inputs: Record<string, any> = {}

    // Find incoming edges
    const incomingEdges = edges.filter(edge => edge.target === node.id)

    for (let i = 0; i < incomingEdges.length; i++) {
      const edge = incomingEdges[i]
      if (!edge) continue
      const sourceResult = previousResults[edge.source]
      if (sourceResult && sourceResult.success && sourceResult.data) {
        // Use edge target handle as input key, fallback to indexed input
        const inputKey = edge!.targetHandle || `input${i + 1}`
        inputs[inputKey] = sourceResult.data
      }
    }

    return inputs
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    context: NodeExecutionContext,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    const startTime = Date.now()
    const { node, inputs } = context

    try {
      let result: any

      switch (node.type) {
        case 'input':
          result = await this.executeInputNode(node, inputs)
          break
        case 'llm':
          result = await this.executeLLMNode(node, inputs, options.apiKeys)
          break
        case 'compare':
          result = await this.executeCompareNode(node, inputs)
          break
        case 'output':
          result = await this.executeOutputNode(node, inputs)
          break
        case 'summarize':
          result = await this.executeSummarizeNode(node, inputs, options.apiKeys)
          break
        default:
          throw new Error(`Unsupported node type: ${node.type}`)
      }

      return {
        nodeId: node.id,
        success: true,
        data: result,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        nodeId: node.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Execute an input node
   */
  private async executeInputNode(node: Node, _inputs: Record<string, any>): Promise<any> {
    // Input nodes provide their configured data
    if (node.data['defaultContent']) {
      return node.data['defaultContent']
    }
    
    // If no default content, return placeholder or empty
    return node.data['placeholder'] || ''
  }

  /**
   * Execute an LLM node
   */
  private async executeLLMNode(
    node: Node,
    inputs: Record<string, any>,
    _apiKeys?: Record<string, string>
  ): Promise<any> {
    const models = node.data['models'] || []
    const prompt = node.data['prompt'] || ''
    
    if (models.length === 0) {
      throw new Error('No models configured for LLM node')
    }

    // Replace {input} placeholders in prompt
    let processedPrompt = prompt
    for (const [key, value] of Object.entries(inputs)) {
      processedPrompt = processedPrompt.replace(
        new RegExp(`{${key}}`, 'g'),
        String(value)
      )
    }

    // For now, simulate LLM API call
    // TODO: Integrate with actual backend API
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    
    return {
      model: models[0],
      prompt: processedPrompt,
      response: `Simulated response from ${models[0]} for prompt: ${processedPrompt.substring(0, 100)}...`,
      metadata: {
        temperature: node.data['temperature'] || 0.7,
        maxTokens: node.data['maxTokens'] || 1000
      }
    }
  }

  /**
   * Execute a compare node
   */
  private async executeCompareNode(node: Node, inputs: Record<string, any>): Promise<any> {
    const comparisonType = node.data['comparisonType'] || 'differences'
    const inputValues = Object.values(inputs)
    
    if (inputValues.length < 2) {
      throw new Error('Compare node requires at least 2 inputs')
    }

    // Simulate comparison processing
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))

    return {
      comparisonType,
      inputs: inputValues,
      result: `Comparison result using ${comparisonType} method`,
      differences: ['Difference 1', 'Difference 2'],
      similarities: ['Similarity 1', 'Similarity 2'],
      confidence: 0.85
    }
  }

  /**
   * Execute an output node
   */
  private async executeOutputNode(node: Node, inputs: Record<string, any>): Promise<any> {
    const outputFormat = node.data['outputFormat'] || 'text'
    const inputData = Object.values(inputs)[0] // Take first input

    // Format output based on configuration
    let formattedOutput: any

    switch (outputFormat) {
      case 'json':
        formattedOutput = JSON.stringify(inputData, null, 2)
        break
      case 'markdown':
        formattedOutput = typeof inputData === 'string' 
          ? inputData 
          : `## Output\n\n${JSON.stringify(inputData, null, 2)}`
        break
      case 'html':
        formattedOutput = `<div class="output">${String(inputData)}</div>`
        break
      default:
        formattedOutput = String(inputData)
    }

    return {
      format: outputFormat,
      content: formattedOutput,
      metadata: {
        timestamp: new Date().toISOString(),
        size: String(formattedOutput).length
      }
    }
  }

  /**
   * Execute a summarize node
   */
  private async executeSummarizeNode(
    node: Node,
    inputs: Record<string, any>,
    _apiKeys?: Record<string, string>
  ): Promise<any> {
    const length = node.data['length'] || 'medium'
    const style = node.data['style'] || 'paragraph'
    const inputText = String(Object.values(inputs)[0] || '')

    // Simulate summarization processing
    await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 150))

    return {
      original: inputText,
      summary: `${length} ${style} summary of: ${inputText.substring(0, 50)}...`,
      length,
      style,
      wordCount: inputText.split(' ').length,
      reductionRatio: 0.3
    }
  }
}

// Export singleton instance
export const workflowExecutor = new WorkflowExecutor()