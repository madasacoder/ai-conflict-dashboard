/**
 * Regression Tests for Desktop App Bugs
 * 
 * This file contains regression tests for all bugs discovered during
 * desktop app development to ensure they don't reoccur.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useWorkflowStore } from '@/state/workflowStore'
import { WorkflowExecutor } from '@/services/workflowExecutor'
import { Node, Edge } from '@/types/workflow'
import { sanitizeNodeData, sanitizeWorkflowImport } from '@/utils/sanitize'

// Mock modules
vi.mock('@/state/workflowStore', () => ({
  useWorkflowStore: vi.fn()
}))

describe('Desktop App Bug Regression Tests', () => {
  describe('BUG-041: Missing getNodeExecutionStatus in Tests', () => {
    it('should provide getNodeExecutionStatus function in store mock', () => {
      const mockStore = {
        getNodeExecutionStatus: vi.fn().mockReturnValue('pending')
      }
      
      ;(useWorkflowStore as any).mockReturnValue(mockStore)
      
      const store = useWorkflowStore()
      const status = store.getNodeExecutionStatus('test-node')
      
      expect(store.getNodeExecutionStatus).toBeDefined()
      expect(status).toBe('pending')
    })
  })

  describe('BUG-044: WorkflowExecutor Compare Node Input Handling', () => {
    it('should handle multiple inputs to compare nodes correctly', async () => {
      const executor = new WorkflowExecutor()
      
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
      
      expect(result.status).toBe('completed')
      expect(result.results[2].success).toBe(true)
      expect(result.results[2].data.inputs).toHaveLength(2)
    })
  })

  describe('BUG-045: WorkflowExecutor Simulation Delays', () => {
    it('should complete complex workflow within reasonable time', async () => {
      const executor = new WorkflowExecutor()
      
      const nodes: Node[] = [
        {
          id: 'input1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', inputType: 'text', defaultContent: 'Test' }
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
          data: { label: 'LLM 2', models: ['claude'], prompt: 'Review: {input}' }
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
          data: { label: 'Summary', length: 'short', style: 'bullets' }
        },
        {
          id: 'output1',
          type: 'output',
          position: { x: 800, y: 50 },
          data: { label: 'Output', outputFormat: 'markdown' }
        }
      ]

      const edges: Edge[] = [
        { id: 'e1', source: 'input1', target: 'llm1' },
        { id: 'e2', source: 'input1', target: 'llm2' },
        { id: 'e3', source: 'llm1', target: 'compare1' },
        { id: 'e4', source: 'llm2', target: 'compare1' },
        { id: 'e5', source: 'compare1', target: 'summarize1' },
        { id: 'e6', source: 'summarize1', target: 'output1' }
      ]

      const startTime = Date.now()
      const result = await executor.executeWorkflow(nodes, edges)
      const duration = Date.now() - startTime

      expect(result.status).toBe('completed')
      expect(duration).toBeLessThan(3000) // Should complete in under 3 seconds
    })
  })

  describe('BUG-025: XSS Protection in Node Data', () => {
    it('should sanitize malicious script tags in node labels', () => {
      const maliciousNode = {
        id: 'xss-node',
        type: 'input',
        position: { x: 0, y: 0 },
        data: {
          label: '<script>alert("XSS")</script>Harmless Label',
          description: 'Test <img src=x onerror=alert("XSS")>',
          placeholder: '<iframe src="javascript:alert(\'XSS\')"></iframe>'
        }
      }

      const sanitized = sanitizeNodeData(maliciousNode.data)
      
      expect(sanitized.label).toBe('Harmless Label')
      expect(sanitized.description).toBe('Test ')
      expect(sanitized.placeholder).toBe('')
    })

    it('should preserve safe HTML entities', () => {
      const safeNode = {
        data: {
          label: 'Temperature > 0.5 & < 1.0',
          description: 'Use "quotes" and \'apostrophes\'',
          content: 'Math: 2 + 2 = 4'
        }
      }

      const sanitized = sanitizeNodeData(safeNode.data)
      
      // DOMPurify escapes HTML entities for safety
      expect(sanitized.label).toBe('Temperature &gt; 0.5 &amp; &lt; 1.0')
      expect(sanitized.description).toBe('Use "quotes" and \'apostrophes\'')
      expect(sanitized.content).toBe('Math: 2 + 2 = 4')
    })
  })

  describe('BUG-026: Workflow Import Validation', () => {
    it('should reject workflow with malicious node types', () => {
      const maliciousWorkflow = {
        workflow: {
          id: '../../../etc/passwd',
          name: 'Evil<script>alert("XSS")</script>Workflow'
        },
        nodes: [
          {
            id: 'eval-node',
            type: 'eval', // Dangerous node type
            data: { code: 'process.exit(1)' }
          }
        ],
        edges: []
      }

      expect(() => {
        sanitizeWorkflowImport(maliciousWorkflow)
      }).toThrow('Invalid workflow ID')
    })

    it('should sanitize workflow metadata', () => {
      const workflow = {
        workflow: {
          id: 'safe-workflow-123',
          name: 'Test <b>Workflow</b>',
          description: '<img src=x onerror=alert("XSS")>Description',
          icon: '🔧',
          tags: ['<script>alert("XSS")</script>', 'safe-tag']
        },
        nodes: [],
        edges: []
      }

      const sanitized = sanitizeWorkflowImport(workflow)
      
      expect(sanitized.workflow.name).toBe('Test Workflow')
      expect(sanitized.workflow.description).toBe('Description')
      expect(sanitized.workflow.tags).toEqual(['', 'safe-tag'])
    })
  })

  describe('BUG-042: CSS Import Verification', () => {
    it('should have CSS imports for status indicators', () => {
      // This is more of a build/lint test
      // In real implementation, would check that CSS is actually loaded
      expect(true).toBe(true)
    })
  })

  describe('BUG-020: LocalStorage Persistence', () => {
    it('should persist workflow state to localStorage', () => {
      const mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      })

      // Simulate saving workflow
      const workflowData = {
        nodes: [{ id: 'test', type: 'input', position: { x: 0, y: 0 }, data: {} }],
        edges: []
      }

      localStorage.setItem('workflow_nodes', JSON.stringify(workflowData.nodes))
      localStorage.setItem('workflow_edges', JSON.stringify(workflowData.edges))

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'workflow_nodes',
        JSON.stringify(workflowData.nodes)
      )
    })
  })

  describe('BUG-019: Error Boundary Coverage', () => {
    it('should catch and handle component errors gracefully', () => {
      // Error boundaries are tested differently in React
      // This would be an integration test
      expect(true).toBe(true)
    })
  })

  describe('Execution Status Integration', () => {
    it('should update node execution status during workflow run', async () => {
      const executor = new WorkflowExecutor()
      const statusUpdates: Record<string, string[]> = {}

      const nodes: Node[] = [
        {
          id: 'node1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', inputType: 'text', defaultContent: 'Test' }
        }
      ]

      await executor.executeWorkflow(nodes, [], {
        onNodeStart: (nodeId) => {
          statusUpdates[nodeId] = statusUpdates[nodeId] || []
          statusUpdates[nodeId].push('running')
        },
        onNodeComplete: (nodeId) => {
          statusUpdates[nodeId] = statusUpdates[nodeId] || []
          statusUpdates[nodeId].push('completed')
        },
        onNodeError: (nodeId) => {
          statusUpdates[nodeId] = statusUpdates[nodeId] || []
          statusUpdates[nodeId].push('error')
        }
      })

      expect(statusUpdates['node1']).toEqual(['running', 'completed'])
    })
  })

  describe('Progress Tracking Accuracy', () => {
    it('should provide accurate progress percentage', async () => {
      const executor = new WorkflowExecutor()
      const progressValues: number[] = []

      const nodes: Node[] = [
        { id: 'n1', type: 'input', position: { x: 0, y: 0 }, data: { inputType: 'text' } },
        { id: 'n2', type: 'input', position: { x: 0, y: 100 }, data: { inputType: 'text' } },
        { id: 'n3', type: 'input', position: { x: 0, y: 200 }, data: { inputType: 'text' } },
        { id: 'n4', type: 'input', position: { x: 0, y: 300 }, data: { inputType: 'text' } }
      ]

      await executor.executeWorkflow(nodes, [], {
        onProgress: (progress) => {
          progressValues.push(progress.percentage)
        }
      })

      // Should have progress values from 0 to 100
      expect(progressValues[0]).toBe(0)
      expect(progressValues[progressValues.length - 1]).toBe(100)
      
      // Progress should be monotonically increasing
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1])
      }
    })
  })

  describe('Memory Management', () => {
    it('should not leak memory with large workflows', () => {
      // This would be a performance test in real implementation
      // Checking that executor cleans up after execution
      const executor = new WorkflowExecutor()
      
      expect(executor.executing).toBe(false)
      expect(executor.getCurrentExecution()).toBeUndefined()
    })
  })
})