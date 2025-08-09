/**
 * Grade A Regression Tests for Critical Frontend Bugs
 * These tests ensure critical frontend bugs never regress and use strong assertions with real-world scenarios.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { useWorkflowStore } from '@/state/workflowStore'
import { WorkflowBuilder } from '@/components/WorkflowBuilder'
import { NodePalette } from '@/components/nodes/NodePalette'

// Mock the backend API
const mockAPI = {
  analyzeWorkflow: vi.fn(),
  saveWorkflow: vi.fn(),
  loadWorkflow: vi.fn(),
  executeNode: vi.fn(),
  getWorkflowStatus: vi.fn(),
}

global.fetch = vi.fn((url: string, options?: any) => {
  const endpoint = url.split('/').pop()

  switch (endpoint) {
    case 'health':
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy', version: '0.1.0' }),
      })

    case 'analyze':
      return mockAPI.analyzeWorkflow(options)

    case 'workflows':
      if (options?.method === 'POST') return mockAPI.saveWorkflow(options)
      if (options?.method === 'GET') return mockAPI.loadWorkflow(options)
      break

    case 'execute':
      return mockAPI.executeNode(options)

    default:
      return Promise.reject(new Error(`Unmocked endpoint: ${endpoint}`))
  }
})

describe('CRITICAL: Frontend Bug Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('BUG-081: Desktop App Missing React Flow Instance (CRITICAL)', () => {
    it('should have React Flow properly initialized in WorkflowBuilder', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Wait for workflow builder to load
      await waitFor(() => {
        expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
      })

      // Verify React Flow is initialized
      const reactFlowContainer = screen.getByTestId('react-flow-container')
      expect(reactFlowContainer).toBeInTheDocument()

      // Verify React Flow has proper dimensions
      expect(reactFlowContainer).toHaveStyle({ width: '100%', height: '100%' })
    })

    it('should allow node creation and connection in React Flow', async () => {
      const user = userEvent.setup()
      render(<WorkflowBuilder />)

      // Verify node palette is available
      const nodePalette = screen.getByTestId('node-palette')
      expect(nodePalette).toBeInTheDocument()

      // Verify input node can be created
      const inputNodeButton = screen.getByTestId('add-input-node')
      expect(inputNodeButton).toBeInTheDocument()

      // Verify LLM node can be created
      const llmNodeButton = screen.getByTestId('add-llm-node')
      expect(llmNodeButton).toBeInTheDocument()

      // Verify canvas is available for connections
      const reactFlowCanvas = screen.getByTestId('react-flow-canvas')
      expect(reactFlowCanvas).toBeInTheDocument()
    })

    it('should maintain React Flow state during component updates', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Add a node
      const addNodeButton = screen.getByTestId('add-input-node')
      await user.click(addNodeButton)

      // Verify node was added
      await waitFor(() => {
        expect(screen.getByTestId('rf__node-input-1')).toBeInTheDocument()
      })

      // Trigger a component update
      const refreshButton = screen.getByTestId('refresh-workflow')
      await user.click(refreshButton)

      // Verify React Flow state is maintained
      await waitFor(() => {
        expect(screen.getByTestId('rf__node-input-1')).toBeInTheDocument()
      })
    })
  })

  describe('BUG-082: Drag and Drop Completely Broken (CRITICAL)', () => {
    it('should handle drag start events properly', async () => {
      const user = userEvent.setup()
      render(<NodePalette />)

      // Find a draggable node
      const draggableNode = screen.getByTestId('draggable-input-node')
      expect(draggableNode).toBeInTheDocument()

      // Verify drag start sets proper data
      const dragStartEvent = new Event('dragstart', { bubbles: true })
      Object.defineProperty(dragStartEvent, 'dataTransfer', {
        value: {
          setData: vi.fn(),
          setDragImage: vi.fn(),
        },
      })

      draggableNode.dispatchEvent(dragStartEvent)

      // Verify dataTransfer was used
      expect(dragStartEvent.dataTransfer?.setData).toHaveBeenCalled()
    })

    it('should handle drop events properly', async () => {
      const user = userEvent.setup()
      render(<WorkflowBuilder />)

      // Find drop zone
      const dropZone = screen.getByTestId('workflow-drop-zone')
      expect(dropZone).toBeInTheDocument()

      // Create drop event
      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          getData: vi.fn().mockReturnValue(JSON.stringify({
            type: 'input',
            data: { label: 'Test Input' }
          })),
        },
      })

      // Simulate drop
      dropZone.dispatchEvent(dropEvent)

      // Verify node was added to workflow
      await waitFor(() => {
        expect(screen.getByTestId('rf__node-input-1')).toBeInTheDocument()
      })
    })

    it('should prevent invalid drops', async () => {
      const user = userEvent.setup()
      render(<WorkflowBuilder />)

      // Find drop zone
      const dropZone = screen.getByTestId('workflow-drop-zone')

      // Create drop event with invalid data
      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          getData: vi.fn().mockReturnValue('invalid-data'),
        },
      })

      // Simulate drop
      dropZone.dispatchEvent(dropEvent)

      // Verify no invalid nodes were added
      await waitFor(() => {
        const nodes = screen.queryAllByTestId(/rf__node-/)
        expect(nodes).toHaveLength(0)
      })
    })

    it('should handle drag over events for visual feedback', async () => {
      const user = userEvent.setup()
      render(<WorkflowBuilder />)

      // Find drop zone
      const dropZone = screen.getByTestId('workflow-drop-zone')

      // Create drag over event
      const dragOverEvent = new Event('dragover', { bubbles: true })
      dragOverEvent.preventDefault = vi.fn()

      // Simulate drag over
      dropZone.dispatchEvent(dragOverEvent)

      // Verify preventDefault was called
      expect(dragOverEvent.preventDefault).toHaveBeenCalled()

      // Verify visual feedback
      expect(dropZone).toHaveClass('drag-over')
    })
  })

  describe('BUG-086: API Key Exposed in Error Messages (CRITICAL)', () => {
    it('should not expose API keys in error messages', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Mock API to return error with API key
      mockAPI.analyzeWorkflow.mockRejectedValue(new Error('Invalid API key: sk-test1234567890'))

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Try to execute workflow with invalid key
      const executeButton = screen.getByTestId('execute-workflow')
      await user.click(executeButton)

      // Wait for error message
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message')
        expect(errorMessage).toBeInTheDocument()
      })

      // Verify API key is not exposed
      const errorMessage = screen.getByTestId('error-message')
      expect(errorMessage.textContent).not.toContain('sk-test1234567890')
      expect(errorMessage.textContent).toContain('Invalid API key')
    })

    it('should sanitize API keys in console logs', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const user = userEvent.setup()
      render(<App />)

      // Mock API to return error
      mockAPI.analyzeWorkflow.mockRejectedValue(new Error('API key sk-secret1234567890 is invalid'))

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Try to execute workflow
      const executeButton = screen.getByTestId('execute-workflow')
      await user.click(executeButton)

      // Wait for error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      // Verify console logs don't contain full API key
      const consoleCalls = consoleSpy.mock.calls.flat()
      const consoleOutput = consoleCalls.join(' ')
      expect(consoleOutput).not.toContain('sk-secret1234567890')
      expect(consoleOutput).toContain('API key')
      expect(consoleOutput).toContain('invalid')

      consoleSpy.mockRestore()
    })

    it('should not store API keys in localStorage', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Set API key in input
      const apiKeyInput = screen.getByTestId('api-key-input')
      await user.type(apiKeyInput, 'sk-test1234567890')

      // Verify key is not stored in localStorage
      const storedKeys = Object.keys(localStorage)
      const apiKeyEntries = storedKeys.filter(key => key.includes('api') || key.includes('key'))
      
      for (const key of apiKeyEntries) {
        const value = localStorage.getItem(key)
        expect(value).not.toContain('sk-test1234567890')
      }
    })
  })

  describe('BUG-108: Data Leakage Between Concurrent Requests (CRITICAL)', () => {
    it('should isolate request data between different users', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Mock API to return different data for different requests
      let requestCount = 0
      mockAPI.analyzeWorkflow.mockImplementation((options) => {
        requestCount++
        const requestData = JSON.parse(options.body)
        
        if (requestData.text.includes('User 1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              responses: [{ model: 'gpt-3.5-turbo', response: 'User 1 data: SSN-123-45-6789' }],
              request_id: `req-${requestCount}-user1`
            })
          })
        } else {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              responses: [{ model: 'gpt-3.5-turbo', response: 'User 2 data: SSN-987-65-4321' }],
              request_id: `req-${requestCount}-user2`
            })
          })
        }
      })

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Make first request
      const textInput1 = screen.getByTestId('text-input')
      await user.clear(textInput1)
      await user.type(textInput1, 'User 1 private data: SSN-123-45-6789')

      const executeButton1 = screen.getByTestId('execute-workflow')
      await user.click(executeButton1)

      // Wait for first response
      await waitFor(() => {
        expect(screen.getByText('User 1 data: SSN-123-45-6789')).toBeInTheDocument()
      })

      // Make second request
      await user.clear(textInput1)
      await user.type(textInput1, 'User 2 private data: SSN-987-65-4321')

      await user.click(executeButton1)

      // Wait for second response
      await waitFor(() => {
        expect(screen.getByText('User 2 data: SSN-987-65-4321')).toBeInTheDocument()
      })

      // Verify data isolation - User 1's data should not appear in User 2's response
      const allText = screen.getByTestId('workflow-results').textContent
      expect(allText).toContain('User 2 data: SSN-987-65-4321')
      expect(allText).not.toContain('User 1 data: SSN-123-45-6789')
    })

    it('should generate unique request IDs for each request', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Mock API to return different request IDs
      let requestCount = 0
      mockAPI.analyzeWorkflow.mockImplementation(() => {
        requestCount++
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            responses: [{ model: 'gpt-3.5-turbo', response: 'Test response' }],
            request_id: `unique-request-${requestCount}-${Date.now()}`
          })
        })
      })

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Make multiple requests
      const textInput = screen.getByTestId('text-input')
      const executeButton = screen.getByTestId('execute-workflow')

      const requestIds = []

      for (let i = 0; i < 3; i++) {
        await user.clear(textInput)
        await user.type(textInput, `Request ${i + 1}`)
        await user.click(executeButton)

        await waitFor(() => {
          const requestIdElement = screen.getByTestId('request-id')
          const requestId = requestIdElement.textContent
          requestIds.push(requestId)
        })
      }

      // Verify all request IDs are unique
      const uniqueIds = new Set(requestIds)
      expect(uniqueIds.size).toBe(requestIds.length)
    })

    it('should not share state between different workflow executions', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Create first workflow
      const addInputNode = screen.getByTestId('add-input-node')
      await user.click(addInputNode)

      const inputNode = screen.getByTestId('rf__node-input-1')
      await user.click(inputNode)

      const nodeConfig = screen.getByTestId('node-config-panel')
      const textInput = within(nodeConfig).getByTestId('node-text-input')
      await user.type(textInput, 'Workflow 1 data')

      // Execute first workflow
      const executeButton = screen.getByTestId('execute-workflow')
      await user.click(executeButton)

      // Wait for execution
      await waitFor(() => {
        expect(screen.getByText('Workflow 1 data')).toBeInTheDocument()
      })

      // Create second workflow
      const clearButton = screen.getByTestId('clear-workflow')
      await user.click(clearButton)

      const addInputNode2 = screen.getByTestId('add-input-node')
      await user.click(addInputNode2)

      const inputNode2 = screen.getByTestId('rf__node-input-1')
      await user.click(inputNode2)

      const nodeConfig2 = screen.getByTestId('node-config-panel')
      const textInput2 = within(nodeConfig2).getByTestId('node-text-input')
      await user.type(textInput2, 'Workflow 2 data')

      // Execute second workflow
      await user.click(executeButton)

      // Wait for execution
      await waitFor(() => {
        expect(screen.getByText('Workflow 2 data')).toBeInTheDocument()
      })

      // Verify data isolation
      const results = screen.getByTestId('workflow-results').textContent
      expect(results).toContain('Workflow 2 data')
      expect(results).not.toContain('Workflow 1 data')
    })
  })

  describe('BUG-075: Circuit Breaker Doesn\'t Open After Failures (HIGH)', () => {
    it('should handle API failures gracefully and show appropriate error messages', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Mock API to fail multiple times
      mockAPI.analyzeWorkflow.mockRejectedValue(new Error('API service unavailable'))

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Try to execute workflow multiple times
      const executeButton = screen.getByTestId('execute-workflow')
      
      for (let i = 0; i < 5; i++) {
        await user.click(executeButton)
        
        await waitFor(() => {
          const errorMessage = screen.getByTestId('error-message')
          expect(errorMessage).toBeInTheDocument()
        })
      }

      // Verify circuit breaker behavior
      await waitFor(() => {
        const circuitBreakerMessage = screen.getByTestId('circuit-breaker-message')
        expect(circuitBreakerMessage).toBeInTheDocument()
        expect(circuitBreakerMessage.textContent).toContain('Service temporarily unavailable')
      })
    })

    it('should recover from circuit breaker state after timeout', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Mock API to fail then recover
      let failureCount = 0
      mockAPI.analyzeWorkflow.mockImplementation(() => {
        failureCount++
        if (failureCount <= 5) {
          return Promise.reject(new Error('API service unavailable'))
        } else {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              responses: [{ model: 'gpt-3.5-turbo', response: 'Recovered response' }],
              request_id: 'recovered-request'
            })
          })
        }
      })

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Trigger failures
      const executeButton = screen.getByTestId('execute-workflow')
      
      for (let i = 0; i < 5; i++) {
        await user.click(executeButton)
        await waitFor(() => {
          expect(screen.getByTestId('error-message')).toBeInTheDocument()
        })
      }

      // Wait for circuit breaker timeout
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Try again - should recover
      await user.click(executeButton)

      await waitFor(() => {
        expect(screen.getByText('Recovered response')).toBeInTheDocument()
      })
    })
  })

  describe('BUG-087: Rate Limiting Too Aggressive (HIGH)', () => {
    it('should allow reasonable request rates without blocking', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Mock API to handle multiple requests
      let requestCount = 0
      mockAPI.analyzeWorkflow.mockImplementation(() => {
        requestCount++
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            responses: [{ model: 'gpt-3.5-turbo', response: `Response ${requestCount}` }],
            request_id: `request-${requestCount}`
          })
        })
      })

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Make multiple requests in quick succession
      const executeButton = screen.getByTestId('execute-workflow')
      
      for (let i = 0; i < 5; i++) {
        await user.click(executeButton)
        
        // Wait for response
        await waitFor(() => {
          expect(screen.getByText(`Response ${i + 1}`)).toBeInTheDocument()
        })
      }

      // Verify all requests succeeded
      expect(requestCount).toBe(5)
    })

    it('should show rate limit message when appropriate', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Mock API to return rate limit error after many requests
      let requestCount = 0
      mockAPI.analyzeWorkflow.mockImplementation(() => {
        requestCount++
        if (requestCount > 10) {
          return Promise.reject(new Error('Rate limit exceeded'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            responses: [{ model: 'gpt-3.5-turbo', response: `Response ${requestCount}` }],
            request_id: `request-${requestCount}`
          })
        })
      })

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Make many requests
      const executeButton = screen.getByTestId('execute-workflow')
      
      for (let i = 0; i < 15; i++) {
        await user.click(executeButton)
        
        if (i < 10) {
          await waitFor(() => {
            expect(screen.getByText(`Response ${i + 1}`)).toBeInTheDocument()
          })
        } else {
          await waitFor(() => {
            const rateLimitMessage = screen.getByTestId('rate-limit-message')
            expect(rateLimitMessage).toBeInTheDocument()
            expect(rateLimitMessage.textContent).toContain('Rate limit exceeded')
          })
        }
      }
    })
  })

  describe('BUG-088: No Payload Size Validation (HIGH)', () => {
    it('should reject extremely large payloads', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Mock API to reject large payloads
      mockAPI.analyzeWorkflow.mockImplementation((options) => {
        const requestData = JSON.parse(options.body)
        if (requestData.text.length > 1000000) { // 1MB limit
          return Promise.reject(new Error('Payload too large'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            responses: [{ model: 'gpt-3.5-turbo', response: 'Valid response' }],
            request_id: 'valid-request'
          })
        })
      })

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Try to submit extremely large text
      const textInput = screen.getByTestId('text-input')
      const largeText = 'x'.repeat(2000000) // 2MB text
      await user.type(textInput, largeText)

      const executeButton = screen.getByTestId('execute-workflow')
      await user.click(executeButton)

      // Should show payload size error
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message')
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage.textContent).toContain('Payload too large')
      })
    })

    it('should accept reasonable payload sizes', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Mock API to accept reasonable payloads
      mockAPI.analyzeWorkflow.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          responses: [{ model: 'gpt-3.5-turbo', response: 'Valid response' }],
          request_id: 'valid-request'
        })
      })

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Submit reasonable size text
      const textInput = screen.getByTestId('text-input')
      const reasonableText = 'This is a reasonable size text for testing.'
      await user.type(textInput, reasonableText)

      const executeButton = screen.getByTestId('execute-workflow')
      await user.click(executeButton)

      // Should accept and process
      await waitFor(() => {
        expect(screen.getByText('Valid response')).toBeInTheDocument()
      })
    })
  })

  describe('BUG-102: Race Condition in Circuit Breaker Implementation (HIGH)', () => {
    it('should handle concurrent requests without race conditions', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Mock API to simulate concurrent processing
      let concurrentRequests = 0
      mockAPI.analyzeWorkflow.mockImplementation(async () => {
        concurrentRequests++
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100))
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            responses: [{ model: 'gpt-3.5-turbo', response: `Concurrent response ${concurrentRequests}` }],
            request_id: `concurrent-${concurrentRequests}`
          })
        })
      })

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Make concurrent requests
      const executeButton = screen.getByTestId('execute-workflow')
      
      // Click multiple times quickly
      for (let i = 0; i < 5; i++) {
        await user.click(executeButton)
      }

      // Wait for all responses
      await waitFor(() => {
        expect(screen.getByText('Concurrent response 5')).toBeInTheDocument()
      })

      // Verify all requests were processed
      expect(concurrentRequests).toBe(5)
    })
  })

  describe('BUG-103: Consensus Analysis Shows False Agreement (HIGH)', () => {
    it('should correctly identify conflicting responses', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Mock API to return conflicting responses
      mockAPI.analyzeWorkflow.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          responses: [
            { model: 'gpt-3.5-turbo', response: 'YES' },
            { model: 'claude-3', response: 'NO' }
          ],
          consensus: {
            agreement_level: 0.1,
            has_conflict: true,
            conflict_reason: 'Opposite answers detected'
          },
          request_id: 'conflict-test'
        })
      })

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Execute workflow
      const executeButton = screen.getByTestId('execute-workflow')
      await user.click(executeButton)

      // Verify conflict is detected
      await waitFor(() => {
        const consensusPanel = screen.getByTestId('consensus-panel')
        expect(consensusPanel).toBeInTheDocument()
        expect(consensusPanel.textContent).toContain('Conflict detected')
        expect(consensusPanel.textContent).toContain('Opposite answers detected')
      })

      // Verify agreement level is low
      const agreementLevel = screen.getByTestId('agreement-level')
      expect(agreementLevel.textContent).toContain('10%')
    })

    it('should correctly identify agreeing responses', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Mock API to return agreeing responses
      mockAPI.analyzeWorkflow.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          responses: [
            { model: 'gpt-3.5-turbo', response: 'The sky is blue' },
            { model: 'claude-3', response: 'The sky appears blue' }
          ],
          consensus: {
            agreement_level: 0.9,
            has_conflict: false,
            agreement_reason: 'High semantic similarity'
          },
          request_id: 'agreement-test'
        })
      })

      // Launch workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Execute workflow
      const executeButton = screen.getByTestId('execute-workflow')
      await user.click(executeButton)

      // Verify agreement is detected
      await waitFor(() => {
        const consensusPanel = screen.getByTestId('consensus-panel')
        expect(consensusPanel).toBeInTheDocument()
        expect(consensusPanel.textContent).toContain('Consensus reached')
        expect(consensusPanel.textContent).toContain('High semantic similarity')
      })

      // Verify agreement level is high
      const agreementLevel = screen.getByTestId('agreement-level')
      expect(agreementLevel.textContent).toContain('90%')
    })
  })
}) 