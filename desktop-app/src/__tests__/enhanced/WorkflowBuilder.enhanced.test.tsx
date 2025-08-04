/**
 * Enhanced Grade A tests for WorkflowBuilder
 * 
 * Comprehensive testing including:
 * - Full user interaction flows
 * - Edge cases and error scenarios  
 * - Performance under load
 * - Accessibility validation
 * - State management verification
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import WorkflowBuilder from '@/components/WorkflowBuilder'
import { useWorkflowStore } from '@/state/workflowStore'
import { assertValidWorkflow, assertValidNode, assertValidEdge } from '../helpers/assertionHelpers'

describe('WorkflowBuilder Enhanced Tests - Grade A', () => {
  let user: ReturnType<typeof userEvent.setup>
  let performanceObserver: PerformanceObserver
  const performanceEntries: PerformanceEntry[] = []

  beforeEach(() => {
    user = userEvent.setup()
    // Reset store
    useWorkflowStore.getState().reset()
    
    // Set up performance monitoring
    performanceObserver = new PerformanceObserver((list) => {
      performanceEntries.push(...list.getEntries())
    })
    performanceObserver.observe({ entryTypes: ['measure'] })
  })

  afterEach(() => {
    performanceObserver.disconnect()
    performanceEntries.length = 0
  })

  describe('Complete User Workflow Testing', () => {
    it('should handle complete workflow creation from start to finish', async () => {
      const { container } = render(<WorkflowBuilder />)
      
      // Step 1: Verify initial state
      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument()
      expect(screen.getByTestId('node-library')).toBeInTheDocument()
      expect(screen.queryByTestId('workflow-node')).not.toBeInTheDocument()
      
      // Step 2: Add input node via drag and drop
      const inputNodeButton = screen.getByTestId('node-type-input')
      const canvas = screen.getByTestId('workflow-canvas')
      
      // Simulate drag start
      fireEvent.dragStart(inputNodeButton, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'copy'
        }
      })
      
      // Simulate drag over canvas
      fireEvent.dragOver(canvas, {
        clientX: 300,
        clientY: 200,
        dataTransfer: {
          dropEffect: 'copy'
        }
      })
      
      // Simulate drop
      const dropEvent = new DragEvent('drop', {
        clientX: 300,
        clientY: 200,
        dataTransfer: new DataTransfer()
      })
      dropEvent.dataTransfer?.setData('nodeType', 'input')
      fireEvent.drop(canvas, dropEvent)
      
      // Verify node was added
      await waitFor(() => {
        const nodes = useWorkflowStore.getState().nodes
        expect(nodes).toHaveLength(1)
        assertValidNode(nodes[0])
        expect(nodes[0].type).toBe('input')
        expect(nodes[0].position.x).toBeCloseTo(300, -1)
        expect(nodes[0].position.y).toBeCloseTo(200, -1)
      })
      
      // Step 3: Configure the input node
      const inputNode = await screen.findByTestId('workflow-node-input')
      await user.click(inputNode)
      
      // Should show configuration panel
      const configPanel = await screen.findByTestId('node-config-panel')
      expect(configPanel).toBeInTheDocument()
      
      const textInput = within(configPanel).getByLabelText(/input text/i)
      await user.clear(textInput)
      await user.type(textInput, 'Analyze this complex business problem')
      
      // Verify configuration was saved
      await waitFor(() => {
        const node = useWorkflowStore.getState().nodes[0]
        expect(node.data?.text).toBe('Analyze this complex business problem')
      })
      
      // Step 4: Add LLM node
      const llmNodeButton = screen.getByTestId('node-type-llm')
      fireEvent.dragStart(llmNodeButton, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'copy'
        }
      })
      
      fireEvent.drop(canvas, {
        clientX: 500,
        clientY: 200,
        dataTransfer: {
          getData: () => 'llm',
          types: ['nodeType']
        }
      })
      
      await waitFor(() => {
        expect(useWorkflowStore.getState().nodes).toHaveLength(2)
      })
      
      // Step 5: Connect nodes
      const outputPort = screen.getByTestId('node-output-port-0')
      const inputPort = screen.getByTestId('node-input-port-1')
      
      // Simulate connection drag
      fireEvent.mouseDown(outputPort)
      fireEvent.mouseMove(inputPort)
      fireEvent.mouseUp(inputPort)
      
      await waitFor(() => {
        const edges = useWorkflowStore.getState().edges
        expect(edges).toHaveLength(1)
        assertValidEdge(edges[0], useWorkflowStore.getState().nodes)
      })
      
      // Step 6: Validate workflow
      const workflow = useWorkflowStore.getState()
      assertValidWorkflow(workflow.nodes, workflow.edges)
      
      // Step 7: Execute workflow
      const executeButton = screen.getByTestId('execute-workflow')
      expect(executeButton).not.toBeDisabled()
      
      await user.click(executeButton)
      
      // Should show execution progress
      await waitFor(() => {
        expect(screen.getByTestId('execution-progress')).toBeInTheDocument()
      })
      
      // Verify execution states
      await waitFor(() => {
        const inputNodeElement = screen.getByTestId('workflow-node-input')
        expect(inputNodeElement).toHaveClass('executing')
      })
      
      await waitFor(() => {
        const inputNodeElement = screen.getByTestId('workflow-node-input')
        expect(inputNodeElement).toHaveClass('completed')
      }, { timeout: 5000 })
    })

    it('should handle complex multi-branch workflows', async () => {
      render(<WorkflowBuilder />)
      
      // Create a complex workflow: Input -> Splitter -> 3 LLMs -> Combiner -> Output
      const nodeTypes = ['input', 'splitter', 'llm', 'llm', 'llm', 'combiner', 'output']
      const positions = [
        { x: 100, y: 200 },
        { x: 250, y: 200 },
        { x: 400, y: 100 },
        { x: 400, y: 200 },
        { x: 400, y: 300 },
        { x: 550, y: 200 },
        { x: 700, y: 200 }
      ]
      
      // Add all nodes
      for (let i = 0; i < nodeTypes.length; i++) {
        const nodeButton = screen.getByTestId(`node-type-${nodeTypes[i]}`)
        const canvas = screen.getByTestId('workflow-canvas')
        
        fireEvent.dragStart(nodeButton)
        fireEvent.drop(canvas, {
          clientX: positions[i].x,
          clientY: positions[i].y,
          dataTransfer: {
            getData: () => nodeTypes[i],
            types: ['nodeType']
          }
        })
      }
      
      await waitFor(() => {
        expect(useWorkflowStore.getState().nodes).toHaveLength(7)
      })
      
      // Create connections
      const connections = [
        { source: 0, target: 1 }, // Input -> Splitter
        { source: 1, target: 2 }, // Splitter -> LLM1
        { source: 1, target: 3 }, // Splitter -> LLM2
        { source: 1, target: 4 }, // Splitter -> LLM3
        { source: 2, target: 5 }, // LLM1 -> Combiner
        { source: 3, target: 5 }, // LLM2 -> Combiner
        { source: 4, target: 5 }, // LLM3 -> Combiner
        { source: 5, target: 6 }  // Combiner -> Output
      ]
      
      for (const conn of connections) {
        const outputPort = screen.getByTestId(`node-output-port-${conn.source}`)
        const inputPort = screen.getByTestId(`node-input-port-${conn.target}`)
        
        fireEvent.mouseDown(outputPort)
        fireEvent.mouseMove(inputPort)
        fireEvent.mouseUp(inputPort)
      }
      
      await waitFor(() => {
        expect(useWorkflowStore.getState().edges).toHaveLength(8)
      })
      
      // Validate complex workflow
      const workflow = useWorkflowStore.getState()
      assertValidWorkflow(workflow.nodes, workflow.edges)
      
      // Verify no cycles
      const hasCycle = detectCycle(workflow.nodes, workflow.edges)
      expect(hasCycle).toBe(false)
      
      // Verify all paths lead to output
      const allPathsValid = validateAllPaths(workflow.nodes, workflow.edges)
      expect(allPathsValid).toBe(true)
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should prevent invalid node connections', async () => {
      render(<WorkflowBuilder />)
      
      // Add two output nodes (invalid to connect)
      const outputButton = screen.getByTestId('node-type-output')
      const canvas = screen.getByTestId('workflow-canvas')
      
      // Add first output node
      fireEvent.dragStart(outputButton)
      fireEvent.drop(canvas, {
        clientX: 200,
        clientY: 200,
        dataTransfer: {
          getData: () => 'output',
          types: ['nodeType']
        }
      })
      
      // Add second output node
      fireEvent.dragStart(outputButton)
      fireEvent.drop(canvas, {
        clientX: 400,
        clientY: 200,
        dataTransfer: {
          getData: () => 'output',
          types: ['nodeType']
        }
      })
      
      await waitFor(() => {
        expect(useWorkflowStore.getState().nodes).toHaveLength(2)
      })
      
      // Try to connect output to output (should fail)
      const outputPort1 = screen.getByTestId('node-output-port-0')
      const inputPort2 = screen.getByTestId('node-input-port-1')
      
      fireEvent.mouseDown(outputPort1)
      fireEvent.mouseMove(inputPort2)
      fireEvent.mouseUp(inputPort2)
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/cannot connect/i)).toBeInTheDocument()
      })
      
      // Connection should not be created
      expect(useWorkflowStore.getState().edges).toHaveLength(0)
    })

    it('should handle node deletion with connected edges', async () => {
      render(<WorkflowBuilder />)
      
      // Create connected nodes
      const { nodes, edges } = createConnectedNodes()
      
      // Select middle node
      const middleNode = screen.getByTestId('workflow-node-1')
      await user.click(middleNode)
      
      // Press delete key
      fireEvent.keyDown(document, { key: 'Delete' })
      
      // Confirm deletion dialog
      const confirmButton = await screen.findByText(/confirm delete/i)
      await user.click(confirmButton)
      
      await waitFor(() => {
        const currentNodes = useWorkflowStore.getState().nodes
        const currentEdges = useWorkflowStore.getState().edges
        
        // Node should be deleted
        expect(currentNodes).toHaveLength(2)
        expect(currentNodes.find(n => n.id === '1')).toBeUndefined()
        
        // Connected edges should also be deleted
        expect(currentEdges).toHaveLength(0)
      })
      
      // Verify workflow is still valid
      const workflow = useWorkflowStore.getState()
      if (workflow.nodes.length > 0) {
        assertValidWorkflow(workflow.nodes, workflow.edges)
      }
    })

    it('should recover from API failures gracefully', async () => {
      const mockExecute = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true })
      
      render(<WorkflowBuilder onExecute={mockExecute} />)
      
      // Create a simple workflow
      await createSimpleWorkflow()
      
      // First execution fails
      const executeButton = screen.getByTestId('execute-workflow')
      await user.click(executeButton)
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
        expect(screen.getByTestId('retry-button')).toBeInTheDocument()
      })
      
      // Retry should work
      const retryButton = screen.getByTestId('retry-button')
      await user.click(retryButton)
      
      await waitFor(() => {
        expect(screen.getByText(/execution successful/i)).toBeInTheDocument()
      })
      
      expect(mockExecute).toHaveBeenCalledTimes(2)
    })
  })

  describe('Performance Testing', () => {
    it('should handle 100+ nodes without significant lag', async () => {
      render(<WorkflowBuilder />)
      
      performance.mark('add-nodes-start')
      
      // Add 100 nodes programmatically
      act(() => {
        const store = useWorkflowStore.getState()
        for (let i = 0; i < 100; i++) {
          store.addNode('llm', {
            x: (i % 10) * 150,
            y: Math.floor(i / 10) * 150
          })
        }
      })
      
      performance.mark('add-nodes-end')
      performance.measure('add-100-nodes', 'add-nodes-start', 'add-nodes-end')
      
      await waitFor(() => {
        expect(useWorkflowStore.getState().nodes).toHaveLength(100)
      })
      
      // Verify performance
      const measure = performance.getEntriesByName('add-100-nodes')[0]
      expect(measure.duration).toBeLessThan(1000) // Should complete in under 1 second
      
      // Test interaction performance
      performance.mark('select-node-start')
      const firstNode = screen.getByTestId('workflow-node-0')
      await user.click(firstNode)
      performance.mark('select-node-end')
      performance.measure('select-node', 'select-node-start', 'select-node-end')
      
      const selectMeasure = performance.getEntriesByName('select-node')[0]
      expect(selectMeasure.duration).toBeLessThan(100) // Selection should be instant
      
      // Test rendering performance
      const fps = await measureFPS(async () => {
        // Simulate viewport pan
        const canvas = screen.getByTestId('workflow-canvas')
        for (let i = 0; i < 60; i++) {
          fireEvent.wheel(canvas, { deltaX: 10, deltaY: 10 })
          await new Promise(r => requestAnimationFrame(r))
        }
      })
      
      expect(fps).toBeGreaterThan(30) // Should maintain at least 30 FPS
    })

    it('should efficiently handle rapid state updates', async () => {
      render(<WorkflowBuilder />)
      
      const updateCount = 1000
      const updates: number[] = []
      
      performance.mark('rapid-updates-start')
      
      for (let i = 0; i < updateCount; i++) {
        const start = performance.now()
        
        act(() => {
          const store = useWorkflowStore.getState()
          store.updateNode(`node-${i % 10}`, {
            data: { value: i }
          })
        })
        
        updates.push(performance.now() - start)
      }
      
      performance.mark('rapid-updates-end')
      performance.measure('rapid-updates', 'rapid-updates-start', 'rapid-updates-end')
      
      // Calculate statistics
      const avgUpdate = updates.reduce((a, b) => a + b, 0) / updates.length
      const maxUpdate = Math.max(...updates)
      const p95Update = updates.sort((a, b) => a - b)[Math.floor(updates.length * 0.95)]
      
      // Performance assertions
      expect(avgUpdate).toBeLessThan(5) // Average update under 5ms
      expect(p95Update).toBeLessThan(10) // 95th percentile under 10ms
      expect(maxUpdate).toBeLessThan(50) // No update takes more than 50ms
    })
  })

  describe('Accessibility Compliance', () => {
    it('should be fully keyboard navigable', async () => {
      render(<WorkflowBuilder />)
      
      // Tab to node library
      await user.tab()
      expect(screen.getByTestId('node-library')).toHaveFocus()
      
      // Arrow keys to navigate node types
      await user.keyboard('{ArrowDown}')
      expect(screen.getByTestId('node-type-input')).toHaveFocus()
      
      // Enter to add node
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(useWorkflowStore.getState().nodes).toHaveLength(1)
      })
      
      // Tab to canvas
      await user.tab()
      expect(screen.getByTestId('workflow-canvas')).toHaveFocus()
      
      // Arrow keys to navigate nodes
      await user.keyboard('{ArrowRight}')
      expect(screen.getByTestId('workflow-node-0')).toHaveFocus()
      
      // Enter to select node
      await user.keyboard('{Enter}')
      expect(screen.getByTestId('node-config-panel')).toBeInTheDocument()
      
      // Escape to close config
      await user.keyboard('{Escape}')
      expect(screen.queryByTestId('node-config-panel')).not.toBeInTheDocument()
      
      // Delete to remove node
      await user.keyboard('{Delete}')
      
      // Confirm with Enter
      const confirmButton = await screen.findByText(/confirm/i)
      expect(confirmButton).toHaveFocus()
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(useWorkflowStore.getState().nodes).toHaveLength(0)
      })
    })

    it('should provide proper ARIA labels and roles', () => {
      const { container } = render(<WorkflowBuilder />)
      
      // Check main landmarks
      expect(container.querySelector('[role="main"]')).toBeInTheDocument()
      expect(container.querySelector('[role="navigation"]')).toBeInTheDocument()
      expect(container.querySelector('[role="toolbar"]')).toBeInTheDocument()
      
      // Check interactive elements have labels
      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        expect(
          button.getAttribute('aria-label') ||
          button.textContent ||
          button.querySelector('[aria-label]')
        ).toBeTruthy()
      })
      
      // Check form inputs have labels
      const inputs = container.querySelectorAll('input, select, textarea')
      inputs.forEach(input => {
        const id = input.getAttribute('id')
        if (id) {
          expect(container.querySelector(`label[for="${id}"]`)).toBeInTheDocument()
        } else {
          expect(input.getAttribute('aria-label')).toBeTruthy()
        }
      })
      
      // Check focus indicators
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusableElements.forEach(element => {
        expect(window.getComputedStyle(element).outlineStyle).not.toBe('none')
      })
    })

    it('should announce state changes to screen readers', async () => {
      render(<WorkflowBuilder />)
      
      // Check for live regions
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
      
      // Add a node and verify announcement
      const inputButton = screen.getByTestId('node-type-input')
      await user.click(inputButton)
      
      await waitFor(() => {
        const status = screen.getByRole('status')
        expect(status).toHaveTextContent(/node added/i)
      })
      
      // Delete node and verify announcement  
      const node = screen.getByTestId('workflow-node-0')
      await user.click(node)
      await user.keyboard('{Delete}')
      
      const confirmButton = await screen.findByText(/confirm/i)
      await user.click(confirmButton)
      
      await waitFor(() => {
        const status = screen.getByRole('status')
        expect(status).toHaveTextContent(/node deleted/i)
      })
    })
  })
})

// Helper functions
function detectCycle(nodes: any[], edges: any[]): boolean {
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  
  function dfs(nodeId: string): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)
    
    const outgoingEdges = edges.filter(e => e.source === nodeId)
    for (const edge of outgoingEdges) {
      if (!visited.has(edge.target)) {
        if (dfs(edge.target)) return true
      } else if (recursionStack.has(edge.target)) {
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

function validateAllPaths(nodes: any[], edges: any[]): boolean {
  const outputNodes = nodes.filter(n => n.type === 'output')
  if (outputNodes.length === 0) return true // No output nodes is valid
  
  const inputNodes = nodes.filter(n => n.type === 'input')
  if (inputNodes.length === 0) return false // Need input if there's output
  
  // Check each input can reach an output
  for (const input of inputNodes) {
    let canReachOutput = false
    const visited = new Set<string>()
    const queue = [input.id]
    
    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)
      
      const node = nodes.find(n => n.id === current)
      if (node?.type === 'output') {
        canReachOutput = true
        break
      }
      
      const outgoing = edges.filter(e => e.source === current)
      queue.push(...outgoing.map(e => e.target))
    }
    
    if (!canReachOutput) return false
  }
  
  return true
}

async function measureFPS(action: () => Promise<void>): Promise<number> {
  let frames = 0
  let startTime = performance.now()
  
  function countFrame() {
    frames++
    if (performance.now() - startTime < 1000) {
      requestAnimationFrame(countFrame)
    }
  }
  
  requestAnimationFrame(countFrame)
  await action()
  
  const duration = performance.now() - startTime
  return (frames / duration) * 1000
}

function createConnectedNodes() {
  const store = useWorkflowStore.getState()
  
  const node1 = store.addNode('input', { x: 100, y: 100 })
  const node2 = store.addNode('llm', { x: 300, y: 100 })
  const node3 = store.addNode('output', { x: 500, y: 100 })
  
  store.onConnect({
    source: node1,
    target: node2,
    sourceHandle: null,
    targetHandle: null
  })
  
  store.onConnect({
    source: node2,
    target: node3,
    sourceHandle: null,
    targetHandle: null
  })
  
  return {
    nodes: store.nodes,
    edges: store.edges
  }
}

async function createSimpleWorkflow() {
  const store = useWorkflowStore.getState()
  
  const input = store.addNode('input', { x: 100, y: 100 })
  const output = store.addNode('output', { x: 300, y: 100 })
  
  store.onConnect({
    source: input,
    target: output,
    sourceHandle: null,
    targetHandle: null
  })
}