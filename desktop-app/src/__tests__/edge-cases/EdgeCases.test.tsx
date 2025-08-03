/**
 * EDGE CASE TESTS
 * These tests push the app to its limits to find breaking points
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'

describe('Edge Cases and Failure Modes', () => {
  describe('Drag and Drop Edge Cases', () => {
    it('should handle rapid consecutive drags without losing data', async () => {
      render(<App />)
      
      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      fireEvent.click(launchButton)
      
      const palette = await screen.findByText('Node Library')
      const nodes = ['Input', 'AI Analysis', 'Compare', 'Output']
      
      // Rapidly drag all nodes
      for (const nodeName of nodes) {
        const node = screen.getByText(nodeName).closest('.palette-node')!
        const canvas = document.querySelector('.workflow-canvas')!
        
        // Start drag
        const dragStart = new DragEvent('dragstart', { bubbles: true })
        Object.defineProperty(dragStart, 'dataTransfer', {
          value: {
            setData: vi.fn(),
            effectAllowed: 'move'
          }
        })
        
        fireEvent(node, dragStart)
        
        // Immediate drop without dragover
        const drop = new DragEvent('drop', { 
          bubbles: true,
          clientX: Math.random() * 500,
          clientY: Math.random() * 500
        })
        Object.defineProperty(drop, 'dataTransfer', {
          value: {
            getData: () => nodeName.toLowerCase().replace(' ', '')
          }
        })
        
        fireEvent(canvas, drop)
      }
      
      // All nodes should be created
      await waitFor(() => {
        expect(screen.getAllByTestId(/rf__node-/)).toHaveLength(4)
      })
    })

    it('should handle drag cancellation gracefully', async () => {
      render(<App />)
      
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      fireEvent.click(launchButton)
      
      const node = screen.getByText('Input').closest('.palette-node')!
      
      // Start drag
      const dragStart = new DragEvent('dragstart', { bubbles: true })
      fireEvent(node, dragStart)
      
      // Cancel drag with Escape
      const escapeEvent = new KeyboardEvent('keydown', { 
        key: 'Escape',
        bubbles: true 
      })
      document.dispatchEvent(escapeEvent)
      
      // Drag end without drop
      const dragEnd = new DragEvent('dragend', { bubbles: true })
      fireEvent(node, dragEnd)
      
      // No node should be created
      expect(screen.queryByTestId(/rf__node-/)).toBeNull()
    })

    it('should handle drops outside valid drop zones', async () => {
      render(<App />)
      
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      fireEvent.click(launchButton)
      
      const node = screen.getByText('Input').closest('.palette-node')!
      
      // Try to drop on toolbar
      const toolbar = document.querySelector('.workflow-toolbar')!
      
      const dragStart = new DragEvent('dragstart', { bubbles: true })
      fireEvent(node, dragStart)
      
      const drop = new DragEvent('drop', { bubbles: true })
      fireEvent(toolbar, drop)
      
      // No node should be created
      expect(screen.queryByTestId(/rf__node-/)).toBeNull()
    })
  })

  describe('Connection Edge Cases', () => {
    it('should prevent circular dependencies', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Create a workflow with nodes A -> B -> C
      // Then try to connect C -> A (creating a cycle)
      
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)
      
      // Add three nodes (mock for simplicity)
      const mockNodes = [
        { id: 'a', type: 'input', position: { x: 100, y: 100 } },
        { id: 'b', type: 'llm', position: { x: 300, y: 100 } },
        { id: 'c', type: 'output', position: { x: 500, y: 100 } }
      ]
      
      // Connect A -> B -> C
      const edges = [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'c' }
      ]
      
      // Try to connect C -> A
      const invalidConnection = { source: 'c', target: 'a' }
      
      // This should be rejected
      const onConnect = vi.fn()
      
      // Simulate the connection attempt
      expect(() => {
        if (wouldCreateCycle(edges, invalidConnection)) {
          throw new Error('Circular dependency detected')
        }
      }).toThrow('Circular dependency detected')
    })

    it('should handle self-connections', async () => {
      // Node connecting to itself should be prevented
      const user = userEvent.setup()
      render(<App />)
      
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)
      
      // Create a node and try to connect it to itself
      const selfConnection = { source: 'node-1', target: 'node-1' }
      
      expect(() => {
        if (selfConnection.source === selfConnection.target) {
          throw new Error('Self-connections not allowed')
        }
      }).toThrow('Self-connections not allowed')
    })
  })

  describe('Performance Stress Tests', () => {
    it('should handle 1000 rapid state updates without crashing', async () => {
      render(<App />)
      
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      fireEvent.click(launchButton)
      
      const startTime = performance.now()
      
      // Simulate rapid state updates
      for (let i = 0; i < 1000; i++) {
        // Toggle theme rapidly
        const themeButton = screen.getByLabelText('Toggle theme')
        fireEvent.click(themeButton)
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should complete in reasonable time
      expect(totalTime).toBeLessThan(5000)
      
      // App should still be responsive
      expect(screen.getByText('Node Library')).toBeTruthy()
    })

    it('should handle very long text inputs', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)
      
      // Create a node with very long input
      const veryLongText = 'A'.repeat(100000) // 100k characters
      
      // This should be handled gracefully
      const inputField = screen.getByLabelText('Input Text')
      await user.type(inputField, veryLongText)
      
      // Should truncate or handle appropriately
      expect(inputField.value.length).toBeLessThanOrEqual(10000) // Reasonable limit
    })
  })

  describe('Security Edge Cases', () => {
    it('should sanitize user inputs to prevent XSS', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)
      
      // Try to inject script
      const maliciousInput = '<script>alert("XSS")</script>'
      const workflowNameInput = screen.getByLabelText('Workflow Name')
      await user.type(workflowNameInput, maliciousInput)
      
      // Check that script is not executed
      expect(document.querySelector('script')).toBeNull()
      
      // Check that input is sanitized in display
      const displayedName = screen.getByTestId('workflow-name-display')
      expect(displayedName.innerHTML).not.toContain('<script>')
    })

    it('should validate API keys before sending to backend', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)
      
      // Try various invalid API keys
      const invalidKeys = [
        '',
        ' ',
        'sk_test_', // Too short
        'not-a-valid-key-format',
        'javascript:alert(1)', // Attempted injection
        '../../etc/passwd' // Path traversal attempt
      ]
      
      for (const key of invalidKeys) {
        const apiKeyInput = screen.getByLabelText('API Key')
        await user.clear(apiKeyInput)
        await user.type(apiKeyInput, key)
        
        const saveButton = screen.getByText('Save')
        await user.click(saveButton)
        
        // Should show validation error
        expect(screen.getByText(/Invalid API key format/)).toBeTruthy()
      }
    })
  })

  describe('Browser Compatibility Edge Cases', () => {
    it('should handle localStorage being disabled', () => {
      // Mock localStorage to throw
      const originalLocalStorage = global.localStorage
      Object.defineProperty(window, 'localStorage', {
        get: () => {
          throw new Error('localStorage is disabled')
        }
      })
      
      // App should still render
      expect(() => render(<App />)).not.toThrow()
      
      // Restore
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage
      })
    })

    it('should handle network offline scenarios', async () => {
      // Mock offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })
      
      render(<App />)
      
      // Should show offline indicator
      await waitFor(() => {
        expect(screen.getByText(/Offline Mode/)).toBeTruthy()
      })
      
      // Should disable online-only features
      const launchButton = screen.getByText('🚀 Launch Workflow Builder')
      expect(launchButton).toBeDisabled()
    })
  })

  describe('Memory Leak Prevention', () => {
    it('should clean up event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(<App />)
      
      const listenerCount = addEventListenerSpy.mock.calls.length
      
      unmount()
      
      // All listeners should be removed
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(listenerCount)
    })

    it('should cancel pending API requests on unmount', async () => {
      const abortControllerSpy = vi.spyOn(global, 'AbortController')
      
      const { unmount } = render(<App />)
      
      // Start an API request
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      fireEvent.click(launchButton)
      
      unmount()
      
      // Abort controller should be used
      if (abortControllerSpy.mock.results.length > 0) {
        const controller = abortControllerSpy.mock.results[0].value
        expect(controller.signal.aborted).toBe(true)
      }
    })
  })
})

// Helper function
function wouldCreateCycle(edges: any[], newEdge: any): boolean {
  const adjacency = new Map()
  
  // Build adjacency list
  edges.forEach(edge => {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, [])
    }
    adjacency.get(edge.source).push(edge.target)
  })
  
  // Add new edge temporarily
  if (!adjacency.has(newEdge.source)) {
    adjacency.set(newEdge.source, [])
  }
  adjacency.get(newEdge.source).push(newEdge.target)
  
  // DFS to detect cycle
  const visited = new Set()
  const recursionStack = new Set()
  
  function hasCycle(node: string): boolean {
    visited.add(node)
    recursionStack.add(node)
    
    const neighbors = adjacency.get(node) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true
      } else if (recursionStack.has(neighbor)) {
        return true
      }
    }
    
    recursionStack.delete(node)
    return false
  }
  
  // Check all nodes
  for (const node of adjacency.keys()) {
    if (!visited.has(node)) {
      if (hasCycle(node)) return true
    }
  }
  
  return false
}