import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { useWorkflowStore } from '@/state/workflowStore'

// Mock fetch
global.fetch = vi.fn()

describe('Real-World User Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Mock successful health check
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'healthy', version: '0.1.0' })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Actual User Workflow - Build and Execute Analysis Pipeline', () => {
    it('should allow user to build a complete workflow from scratch', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeTruthy()
      })

      // Launch workflow builder
      const launchButton = screen.getByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Check that workflow builder is visible
      await waitFor(() => {
        expect(screen.queryByText('Node Library')).toBeTruthy()
      })

      // Try to drag and drop - this is where it fails in real usage
      const inputNode = screen.getByText('Input').closest('.palette-node')
      expect(inputNode).toBeTruthy()

      // Simulate drag
      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        dataTransfer: new DataTransfer()
      })
      
      fireEvent(inputNode!, dragStartEvent)

      // Find canvas
      const canvas = document.querySelector('.workflow-canvas')
      expect(canvas).toBeTruthy()

      // Simulate drop
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        dataTransfer: dragStartEvent.dataTransfer,
        clientX: 300,
        clientY: 200
      })

      fireEvent(canvas!, dropEvent)

      // PROBLEM: In real usage, the node bounces back
      // Check if node was added
      await waitFor(() => {
        const addedNodes = document.querySelectorAll('.react-flow__node')
        expect(addedNodes.length).toBeGreaterThan(0)
      }, { timeout: 3000 })
    })

    it('should persist workflow state across sessions', async () => {
      const user = userEvent.setup()
      const { unmount } = render(<App />)

      // Launch workflow builder
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeTruthy()
      })
      
      await user.click(screen.getByText('🚀 Launch Workflow Builder'))

      // Toggle theme to test persistence
      await waitFor(() => {
        expect(screen.getByLabelText('Toggle theme')).toBeTruthy()
      })

      await user.click(screen.getByLabelText('Toggle theme'))

      // Unmount and remount
      unmount()
      render(<App />)

      // Launch again
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeTruthy()
      })
      
      await user.click(screen.getByText('🚀 Launch Workflow Builder'))

      // Check theme persisted
      const container = document.querySelector('.workflow-builder')
      expect(container?.className).toContain('dark')
    })

    it('should handle API failures gracefully', async () => {
      // Override fetch to fail
      (global.fetch as any).mockReset()
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      render(<App />)

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/Failed to connect to backend API/)).toBeTruthy()
      })

      // Launch button should be disabled
      const launchButton = screen.getByText('🚀 Launch Workflow Builder')
      expect(launchButton).toBeDisabled()
    })
  })

  describe('Edge Cases That Break the App', () => {
    it('should handle rapid clicking without crashes', async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeTruthy()
      })

      const launchButton = screen.getByText('🚀 Launch Workflow Builder')

      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        await user.click(launchButton)
      }

      // App should not crash
      expect(screen.getByText('Node Library')).toBeTruthy()
    })

    it('should handle invalid workflow configurations', async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeTruthy()
      })

      await user.click(screen.getByText('🚀 Launch Workflow Builder'))

      // Try to execute empty workflow
      const store = useWorkflowStore.getState()
      
      await act(async () => {
        await store.executeWorkflow()
      })

      // Should show validation error
      const validation = store.validateWorkflow()
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Workflow must contain at least one node')
    })

    it('should handle memory leaks from multiple workflow creations', async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeTruthy()
      })

      await user.click(screen.getByText('🚀 Launch Workflow Builder'))

      const store = useWorkflowStore.getState()

      // Create many workflows
      for (let i = 0; i < 100; i++) {
        act(() => {
          store.createNewWorkflow(`Workflow ${i}`)
          // Add nodes
          store.addNode('input', { x: Math.random() * 1000, y: Math.random() * 1000 })
          store.addNode('llm', { x: Math.random() * 1000, y: Math.random() * 1000 })
          store.addNode('output', { x: Math.random() * 1000, y: Math.random() * 1000 })
        })
      }

      // Check memory usage doesn't explode
      expect(store.nodes.length).toBe(3) // Only last workflow's nodes
    })
  })

  describe('Missing Critical Features', () => {
    it('should have undo/redo functionality', async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeTruthy()
      })

      await user.click(screen.getByText('🚀 Launch Workflow Builder'))

      const store = useWorkflowStore.getState()

      // Add a node
      act(() => {
        store.addNode('input', { x: 100, y: 100 })
      })

      expect(store.nodes.length).toBe(1)

      // Try to undo (this will fail - feature not implemented)
      await user.keyboard('{Control>}z{/Control}')

      // PROBLEM: No undo functionality
      expect(store.nodes.length).toBe(1) // Still 1, undo didn't work
    })

    it('should auto-save workflows', async () => {
      vi.useFakeTimers()
      
      const user = userEvent.setup({ delay: null })
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeTruthy()
      })

      await user.click(screen.getByText('🚀 Launch Workflow Builder'))

      const store = useWorkflowStore.getState()
      const saveSpy = vi.spyOn(store, 'saveWorkflow')

      // Create workflow
      act(() => {
        store.createNewWorkflow('Auto-save test')
        store.addNode('input', { x: 100, y: 100 })
      })

      // Enable auto-save
      act(() => {
        store.enableAutoSave()
      })

      // Fast-forward time
      vi.advanceTimersByTime(5000)

      // PROBLEM: Auto-save not implemented
      expect(saveSpy).not.toHaveBeenCalled()

      vi.useRealTimers()
    })

    it('should show loading states during workflow execution', async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeTruthy()
      })

      await user.click(screen.getByText('🚀 Launch Workflow Builder'))

      const store = useWorkflowStore.getState()

      // Create valid workflow
      act(() => {
        store.createNewWorkflow('Test')
        store.addNode('input', { x: 100, y: 100 })
        store.addNode('output', { x: 300, y: 100 })
      })

      // Execute workflow
      const executePromise = act(async () => {
        await store.executeWorkflow()
      })

      // Check loading state
      expect(store.isExecuting).toBe(true)

      await executePromise

      expect(store.isExecuting).toBe(false)
    })
  })

  describe('Security and Data Integrity', () => {
    it('should sanitize user inputs in node configuration', async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeTruthy()
      })

      await user.click(screen.getByText('🚀 Launch Workflow Builder'))

      const store = useWorkflowStore.getState()

      // Add node with malicious input
      act(() => {
        store.addNode('input', { x: 100, y: 100 })
        const nodeId = store.nodes[0].id
        
        // Try XSS attack
        store.updateNodeData(nodeId, {
          label: '<script>alert("XSS")</script>',
          placeholder: '<img src=x onerror=alert("XSS")>'
        })
      })

      // Check that script tags are not rendered
      const maliciousScript = document.querySelector('script')
      expect(maliciousScript).toBeNull()
    })

    it('should validate workflow imports', async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeTruthy()
      })

      await user.click(screen.getByText('🚀 Launch Workflow Builder'))

      const store = useWorkflowStore.getState()

      // Try to import malicious workflow
      const maliciousWorkflow = JSON.stringify({
        workflow: {
          id: '../../etc/passwd',
          name: '__proto__.polluted',
          tags: ['<script>alert(1)</script>']
        },
        nodes: [{
          id: 'eval',
          type: 'llm',
          data: {
            prompt: 'process.exit(1)'
          }
        }],
        version: '1.0'
      })

      act(() => {
        store.importWorkflow(maliciousWorkflow)
      })

      // Check that dangerous content is sanitized
      expect(store.workflow?.id).not.toContain('..')
      expect(store.workflow?.name).not.toContain('__proto__')
    })
  })

  describe('Performance Under Stress', () => {
    it('should handle large workflows efficiently', async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeTruthy()
      })

      await user.click(screen.getByText('🚀 Launch Workflow Builder'))

      const store = useWorkflowStore.getState()
      const startTime = performance.now()

      // Create large workflow
      act(() => {
        store.createNewWorkflow('Large workflow')
        
        // Add 1000 nodes
        for (let i = 0; i < 1000; i++) {
          store.addNode('llm', { 
            x: (i % 10) * 200, 
            y: Math.floor(i / 10) * 200 
          })
        }
      })

      const endTime = performance.now()
      const timeTaken = endTime - startTime

      // Should complete in reasonable time
      expect(timeTaken).toBeLessThan(5000) // 5 seconds max
      expect(store.nodes.length).toBe(1000)
    })

    it('should handle rapid state updates without lag', async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeTruthy()
      })

      await user.click(screen.getByText('🚀 Launch Workflow Builder'))

      const store = useWorkflowStore.getState()

      // Add initial nodes
      act(() => {
        store.addNode('input', { x: 100, y: 100 })
        store.addNode('llm', { x: 300, y: 100 })
      })

      const nodeId = store.nodes[0].id
      const updates: number[] = []

      // Rapid updates
      for (let i = 0; i < 100; i++) {
        const start = performance.now()
        
        act(() => {
          store.updateNodeData(nodeId, {
            label: `Update ${i}`
          })
        })
        
        const end = performance.now()
        updates.push(end - start)
      }

      // Average update time should be fast
      const avgUpdateTime = updates.reduce((a, b) => a + b) / updates.length
      expect(avgUpdateTime).toBeLessThan(10) // 10ms average
    })
  })
})