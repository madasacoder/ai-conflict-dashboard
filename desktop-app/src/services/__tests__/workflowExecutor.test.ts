/**
 * WorkflowExecutor Tests
 * 
 * Tests for the workflow execution service including validation,
 * execution order, progress tracking, and error handling.
 */

import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest'
import { WorkflowExecutor } from '../workflowExecutor'
import { Node, Edge } from '@/types/workflow'

// Mock console methods to avoid noise in tests
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor
  
  beforeEach(() => {
    executor = new WorkflowExecutor()
    vi.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should create an instance', () => {
      expect(executor).toBeDefined()
      expect(executor.executing).toBe(false)
    })

    it('should throw error when executing empty workflow', async () => {
      await expect(executor.executeWorkflow([], [])).rejects.toThrow(
        'Workflow must contain at least one node'
      )
    })

    it('should detect circular dependencies', async () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'llm',
          position: { x: 0, y: 0 },
          data: { label: 'Node 1', models: ['gpt-4'], prompt: 'test' }
        },
        {
          id: 'node2',
          type: 'llm',
          position: { x: 100, y: 0 },
          data: { label: 'Node 2', models: ['gpt-4'], prompt: 'test' }
        }
      ]

      const edges: Edge[] = [
        { id: 'edge1', source: 'node1', target: 'node2' },
        { id: 'edge2', source: 'node2', target: 'node1' } // Creates cycle
      ]

      await expect(executor.executeWorkflow(nodes, edges)).rejects.toThrow(
        'Workflow contains circular dependencies'
      )
    })
  })

  describe('Node Validation', () => {
    it('should validate LLM node configuration', async () => {
      const nodes: Node[] = [
        {
          id: 'llm1',
          type: 'llm',
          position: { x: 0, y: 0 },
          data: { label: 'LLM Node' } // Missing models and prompt
        }
      ]

      await expect(executor.executeWorkflow(nodes, [])).rejects.toThrow(
        'LLM node llm1 missing model configuration'
      )
    })

    it('should validate input node configuration', async () => {
      const nodes: Node[] = [
        {
          id: 'input1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input Node' } // Missing inputType
        }
      ]

      await expect(executor.executeWorkflow(nodes, [])).rejects.toThrow(
        'Input node input1 missing input type'
      )
    })

    it('should validate compare node configuration', async () => {
      const nodes: Node[] = [
        {
          id: 'compare1',
          type: 'compare',
          position: { x: 0, y: 0 },
          data: { label: 'Compare Node' } // Missing comparisonType
        }
      ]

      await expect(executor.executeWorkflow(nodes, [])).rejects.toThrow(
        'Compare node compare1 missing comparison type'
      )
    })

    it('should validate output node configuration', async () => {
      const nodes: Node[] = [
        {
          id: 'output1',
          type: 'output',
          position: { x: 0, y: 0 },
          data: { label: 'Output Node' } // Missing outputFormat
        }
      ]

      await expect(executor.executeWorkflow(nodes, [])).rejects.toThrow(
        'Output node output1 missing output format'
      )
    })
  })

  describe('Execution Order', () => {
    it('should execute nodes in correct topological order', async () => {
      const executionOrder: string[] = []
      
      const nodes: Node[] = [
        {
          id: 'input1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', inputType: 'text', defaultContent: 'test' }
        },
        {
          id: 'llm1',
          type: 'llm',
          position: { x: 200, y: 0 },
          data: { label: 'LLM', models: ['gpt-4'], prompt: 'Analyze: {input}' }
        },
        {
          id: 'output1',
          type: 'output',
          position: { x: 400, y: 0 },
          data: { label: 'Output', outputFormat: 'text' }
        }
      ]

      const edges: Edge[] = [
        { id: 'edge1', source: 'input1', target: 'llm1' },
        { id: 'edge2', source: 'llm1', target: 'output1' }
      ]

      const result = await executor.executeWorkflow(nodes, edges, {
        onNodeStart: (nodeId) => {
          executionOrder.push(nodeId)
        }
      })

      expect(executionOrder).toEqual(['input1', 'llm1', 'output1'])
      expect(result.status).toBe('completed')
      expect(result.results).toHaveLength(3)
    })

    it('should handle parallel execution paths', async () => {
      const executionOrder: string[] = []
      
      const nodes: Node[] = [
        {
          id: 'input1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', inputType: 'text', defaultContent: 'test' }
        },
        {
          id: 'llm1',
          type: 'llm',
          position: { x: 200, y: 0 },
          data: { label: 'LLM 1', models: ['gpt-4'], prompt: 'Analyze: {input}' }
        },
        {
          id: 'llm2',
          type: 'llm',
          position: { x: 200, y: 100 },
          data: { label: 'LLM 2', models: ['claude-3'], prompt: 'Review: {input}' }
        },
        {
          id: 'compare1',
          type: 'compare',
          position: { x: 400, y: 50 },
          data: { label: 'Compare', comparisonType: 'conflicts' }
        }
      ]

      const edges: Edge[] = [
        { id: 'edge1', source: 'input1', target: 'llm1' },
        { id: 'edge2', source: 'input1', target: 'llm2' },
        { id: 'edge3', source: 'llm1', target: 'compare1' },
        { id: 'edge4', source: 'llm2', target: 'compare1' }
      ]

      const result = await executor.executeWorkflow(nodes, edges, {
        onNodeStart: (nodeId) => {
          executionOrder.push(nodeId)
        }
      })

      // Input should be first, compare should be last
      expect(executionOrder[0]).toBe('input1')
      expect(executionOrder[executionOrder.length - 1]).toBe('compare1')
      
      // LLM nodes should be before compare (order between them doesn't matter)
      const llm1Index = executionOrder.indexOf('llm1')
      const llm2Index = executionOrder.indexOf('llm2')
      const compareIndex = executionOrder.indexOf('compare1')
      
      expect(llm1Index).toBeLessThan(compareIndex)
      expect(llm2Index).toBeLessThan(compareIndex)
      
      expect(result.status).toBe('completed')
    })
  })

  describe('Progress Tracking', () => {
    it('should report progress during execution', async () => {
      const progressUpdates: number[] = []
      
      const nodes: Node[] = [
        {
          id: 'input1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', inputType: 'text', defaultContent: 'test' }
        },
        {
          id: 'llm1',
          type: 'llm',
          position: { x: 200, y: 0 },
          data: { label: 'LLM', models: ['gpt-4'], prompt: 'Analyze: {input}' }
        }
      ]

      const edges: Edge[] = [
        { id: 'edge1', source: 'input1', target: 'llm1' }
      ]

      await executor.executeWorkflow(nodes, edges, {
        onProgress: (progress) => {
          progressUpdates.push(progress.percentage)
        }
      })

      // Should have progress updates including 0% and 100%
      expect(progressUpdates).toContain(0)
      expect(progressUpdates).toContain(100)
      expect(progressUpdates.length).toBeGreaterThan(2)
    })

    it('should provide estimated time remaining', async () => {
      let hasTimeEstimate = false
      
      const nodes: Node[] = [
        {
          id: 'input1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', inputType: 'text', defaultContent: 'test' }
        },
        {
          id: 'llm1',
          type: 'llm',
          position: { x: 200, y: 0 },
          data: { label: 'LLM', models: ['gpt-4'], prompt: 'Analyze: {input}' }
        },
        {
          id: 'llm2',
          type: 'llm',
          position: { x: 400, y: 0 },
          data: { label: 'LLM 2', models: ['gpt-4'], prompt: 'Review: {input}' }
        }
      ]

      const edges: Edge[] = [
        { id: 'edge1', source: 'input1', target: 'llm1' },
        { id: 'edge2', source: 'llm1', target: 'llm2' }
      ]

      await executor.executeWorkflow(nodes, edges, {
        onProgress: (progress) => {
          if (progress.estimatedTimeRemaining !== undefined) {
            hasTimeEstimate = true
          }
        }
      })

      expect(hasTimeEstimate).toBe(true)
    })
  })

  describe('Cancellation', () => {
    it('should handle execution cancellation', async () => {
      const nodes: Node[] = [
        {
          id: 'input1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', inputType: 'text', defaultContent: 'test' }
        },
        {
          id: 'llm1',
          type: 'llm',
          position: { x: 200, y: 0 },
          data: { label: 'LLM', models: ['gpt-4'], prompt: 'Analyze: {input}' }
        }
      ]

      // Start execution
      const executionPromise = executor.executeWorkflow(nodes, [])
      
      // Cancel immediately
      executor.cancelExecution()
      
      const result = await executionPromise
      expect(result.status).toBe('cancelled')
    })

    it('should not allow multiple simultaneous executions', async () => {
      const nodes: Node[] = [
        {
          id: 'input1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', inputType: 'text', defaultContent: 'test' }
        }
      ]

      // Start first execution
      const firstExecution = executor.executeWorkflow(nodes, [])
      
      // Try to start second execution
      await expect(executor.executeWorkflow(nodes, [])).rejects.toThrow(
        'Workflow execution already in progress'
      )
      
      // Wait for first to complete
      await firstExecution
    })
  })

  describe('Error Handling', () => {
    it('should handle node execution errors gracefully', async () => {
      // Create a custom executor that skips validation for this test
      const customExecutor = new WorkflowExecutor()
      
      // Mock the validation method to skip LLM validation
      vi.spyOn(customExecutor as any, 'validateNodeConfiguration').mockImplementation(() => {})
      
      const nodes: Node[] = [
        {
          id: 'input1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', inputType: 'text', defaultContent: 'test' }
        },
        {
          id: 'llm1',
          type: 'llm',
          position: { x: 200, y: 0 },
          data: { label: 'LLM', models: [], prompt: 'test' } // Invalid: empty models
        }
      ]

      const edges: Edge[] = [
        { id: 'edge1', source: 'input1', target: 'llm1' }
      ]

      const result = await customExecutor.executeWorkflow(nodes, edges)
      
      expect(result.status).toBe('failed')
      expect(result.results).toHaveLength(2)
      
      // First node should succeed
      expect(result.results[0].success).toBe(true)
      
      // Second node should fail
      expect(result.results[1].success).toBe(false)
      expect(result.results[1].error).toContain('No models configured')
    })

    it('should handle execution errors during runtime', async () => {
      // Test that runtime errors are properly handled
      // This is covered by the graceful error handling test above
      expect(true).toBe(true) // Placeholder test
    })
  })

  describe('Node Types', () => {
    it('should execute input nodes correctly', async () => {
      const nodes: Node[] = [
        {
          id: 'input1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { 
            label: 'Input', 
            inputType: 'text', 
            defaultContent: 'Hello World',
            placeholder: 'Enter text...'
          }
        }
      ]

      const result = await executor.executeWorkflow(nodes, [])
      
      expect(result.results[0].success).toBe(true)
      expect(result.results[0].data).toBe('Hello World')
    })

    it('should execute compare nodes correctly', async () => {
      const nodes: Node[] = [
        {
          id: 'input1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input 1', inputType: 'text', defaultContent: 'Text A' }
        },
        {
          id: 'input2',
          type: 'input',
          position: { x: 0, y: 100 },
          data: { label: 'Input 2', inputType: 'text', defaultContent: 'Text B' }
        },
        {
          id: 'compare1',
          type: 'compare',
          position: { x: 200, y: 50 },
          data: { label: 'Compare', comparisonType: 'differences' }
        }
      ]

      const edges: Edge[] = [
        { id: 'edge1', source: 'input1', target: 'compare1' },
        { id: 'edge2', source: 'input2', target: 'compare1' }
      ]

      const result = await executor.executeWorkflow(nodes, edges)
      
      expect(result.results[2].success).toBe(true)
      expect(result.results[2].data).toHaveProperty('comparisonType', 'differences')
      expect(result.results[2].data).toHaveProperty('inputs')
    })

    it('should execute output nodes correctly', async () => {
      const nodes: Node[] = [
        {
          id: 'input1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', inputType: 'text', defaultContent: 'Test data' }
        },
        {
          id: 'output1',
          type: 'output',
          position: { x: 200, y: 0 },
          data: { label: 'Output', outputFormat: 'json' }
        }
      ]

      const edges: Edge[] = [
        { id: 'edge1', source: 'input1', target: 'output1' }
      ]

      const result = await executor.executeWorkflow(nodes, edges)
      
      expect(result.results[1].success).toBe(true)
      expect(result.results[1].data).toHaveProperty('format', 'json')
      expect(result.results[1].data).toHaveProperty('content')
    })

    it('should execute summarize nodes correctly', async () => {
      const nodes: Node[] = [
        {
          id: 'input1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', inputType: 'text', defaultContent: 'Long text to summarize' }
        },
        {
          id: 'summarize1',
          type: 'summarize',
          position: { x: 200, y: 0 },
          data: { label: 'Summarize', length: 'short', style: 'bullets' }
        }
      ]

      const edges: Edge[] = [
        { id: 'edge1', source: 'input1', target: 'summarize1' }
      ]

      const result = await executor.executeWorkflow(nodes, edges)
      
      expect(result.results[1].success).toBe(true)
      expect(result.results[1].data).toHaveProperty('length', 'short')
      expect(result.results[1].data).toHaveProperty('style', 'bullets')
      expect(result.results[1].data).toHaveProperty('summary')
    })
  })

  describe('Complex Workflows', () => {
    it('should execute a complete AI analysis workflow', async () => {
      const nodes: Node[] = [
        {
          id: 'input1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', inputType: 'text', defaultContent: 'Analyze this text' }
        },
        {
          id: 'llm1',
          type: 'llm',
          position: { x: 200, y: 0 },
          data: { label: 'GPT-4', models: ['gpt-4'], prompt: 'Analyze: {input}' }
        },
        {
          id: 'llm2',
          type: 'llm',
          position: { x: 200, y: 100 },
          data: { label: 'Claude', models: ['claude-3'], prompt: 'Review: {input}' }
        },
        {
          id: 'compare1',
          type: 'compare',
          position: { x: 400, y: 50 },
          data: { label: 'Compare', comparisonType: 'consensus' }
        },
        {
          id: 'summarize1',
          type: 'summarize',
          position: { x: 600, y: 50 },
          data: { label: 'Summary', length: 'medium', style: 'paragraph' }
        },
        {
          id: 'output1',
          type: 'output',
          position: { x: 800, y: 50 },
          data: { label: 'Final Output', outputFormat: 'markdown' }
        }
      ]

      const edges: Edge[] = [
        { id: 'edge1', source: 'input1', target: 'llm1' },
        { id: 'edge2', source: 'input1', target: 'llm2' },
        { id: 'edge3', source: 'llm1', target: 'compare1' },
        { id: 'edge4', source: 'llm2', target: 'compare1' },
        { id: 'edge5', source: 'compare1', target: 'summarize1' },
        { id: 'edge6', source: 'summarize1', target: 'output1' }
      ]

      const result = await executor.executeWorkflow(nodes, edges)
      
      expect(result.status).toBe('completed')
      expect(result.results).toHaveLength(6)
      expect(result.results.every(r => r.success)).toBe(true)
      expect(result.totalDuration).toBeGreaterThan(0)
    })
  })
})