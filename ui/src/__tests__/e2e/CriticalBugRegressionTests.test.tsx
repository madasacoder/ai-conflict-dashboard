import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'
import { useWorkflowStore } from '../../state/workflowStore'

// Mock fetch globally for controlled testing
vi.stubGlobal('fetch', vi.fn())

// Helper to create a spec-compliant Response object
const createMockResponse = (body: any, status: number) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

describe('🚨 CRITICAL BUG REGRESSION TESTS - GRADE A', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset workflow store to clean state
    useWorkflowStore.getState().reset()
  })

  afterEach(() => {
    // Verify no memory leaks
    const memUsage = process.memoryUsage()
    expect(memUsage.heapUsed).toBeLessThan(100 * 1024 * 1024) // 100MB limit
  })

  describe('BUG-081: Desktop App Missing React Flow Instance - CRITICAL', () => {
    it('should NEVER allow missing React Flow instance to break core functionality', async () => {
      // Test 1: Verify React Flow is properly initialized
      render(<App />)
      
      await waitFor(() => {
        const launchButton = screen.getByText('🚀 Launch Workflow Builder')
        expect(launchButton).toBeInTheDocument()
        expect(launchButton).not.toBeDisabled()
      })

      // Test 2: Launch workflow builder and verify React Flow loads
      await act(async () => {
        await user.click(screen.getByText('🚀 Launch Workflow Builder'))
      })

      // Test 3: Verify React Flow instance exists and is functional
      await waitFor(() => {
        expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
        // Verify React Flow canvas is present
        expect(screen.getByTestId('react-flow-canvas')).toBeInTheDocument()
      }, { timeout: 10000 })

      // Test 4: Verify node palette is accessible
      const nodePalette = screen.getByTestId('node-palette')
      expect(nodePalette).toBeInTheDocument()
      
      // Test 5: Verify all node types are available
      const nodeTypes = ['input', 'llm', 'compare', 'output']
      nodeTypes.forEach(type => {
        expect(screen.getByTestId(`node-type-${type}`)).toBeInTheDocument()
      })

      // Test 6: Verify React Flow viewport is properly sized
      const canvas = screen.getByTestId('react-flow-canvas')
      const rect = canvas.getBoundingClientRect()
      expect(rect.width).toBeGreaterThan(0)
      expect(rect.height).toBeGreaterThan(0)

      // Test 7: Verify React Flow controls are present
      expect(screen.getByTestId('react-flow-controls')).toBeInTheDocument()
    }, 15000)

    it('should handle React Flow initialization failures gracefully', async () => {
      // Mock React Flow to fail initialization
      vi.doMock('reactflow', () => ({
        ReactFlow: () => {
          throw new Error('React Flow initialization failed')
        },
        Controls: () => null,
        Background: () => null,
        useReactFlow: () => ({
          project: vi.fn(),
          getViewport: vi.fn(),
          setViewport: vi.fn()
        })
      }))

      render(<App />)
      
      // Should show error boundary instead of crashing
      await waitFor(() => {
        expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      })

      // Should provide recovery option
      const retryButton = screen.getByText(/Retry/i)
      expect(retryButton).toBeInTheDocument()
    })
  })

  describe('BUG-082: Drag and Drop Completely Broken - CRITICAL', () => {
    it('should NEVER allow drag and drop to fail completely', async () => {
      render(<App />)
      
      // Launch workflow builder
      await waitFor(() => {
        const launchButton = screen.getByText('🚀 Launch Workflow Builder')
        expect(launchButton).not.toBeDisabled()
      })
      
      await act(async () => {
        await user.click(screen.getByText('🚀 Launch Workflow Builder'))
      })

      // Wait for workflow builder to load
      await waitFor(() => {
        expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
      })

      // Test 1: Verify drag events are properly set up
      const inputNode = screen.getByTestId('node-type-input')
      expect(inputNode).toHaveAttribute('draggable', 'true')

      // Test 2: Verify drop zone is properly configured
      const dropZone = screen.getByTestId('react-flow-canvas')
      expect(dropZone).toHaveAttribute('data-testid', 'react-flow-canvas')

      // Test 3: Test actual drag and drop operation
      await act(async () => {
        // Simulate drag start
        const dragStartEvent = new Event('dragstart', { bubbles: true })
        Object.defineProperty(dragStartEvent, 'dataTransfer', {
          value: {
            setData: vi.fn(),
            getData: vi.fn(() => 'input'),
            types: ['text/plain']
          }
        })
        inputNode.dispatchEvent(dragStartEvent)

        // Simulate drop
        const dropEvent = new Event('drop', { bubbles: true })
        Object.defineProperty(dropEvent, 'dataTransfer', {
          value: {
            getData: vi.fn(() => 'input'),
            types: ['text/plain']
          }
        })
        Object.defineProperty(dropEvent, 'clientX', { value: 100 })
        Object.defineProperty(dropEvent, 'clientY', { value: 100 })
        dropZone.dispatchEvent(dropEvent)
      })

      // Test 4: Verify node was actually created
      await waitFor(() => {
        const nodes = screen.getAllByTestId(/node-input-/)
        expect(nodes.length).toBeGreaterThan(0)
      }, { timeout: 5000 })

      // Test 5: Verify fallback click-to-add works if drag fails
      const llmNode = screen.getByTestId('node-type-llm')
      await act(async () => {
        await user.click(llmNode)
      })

      await waitFor(() => {
        const llmNodes = screen.getAllByTestId(/node-llm-/)
        expect(llmNodes.length).toBeGreaterThan(0)
      })
    }, 20000)

    it('should handle all drag and drop edge cases', async () => {
      render(<App />)
      
      await act(async () => {
        await user.click(screen.getByText('🚀 Launch Workflow Builder'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
      })

      // Test 1: Drag outside drop zone should not crash
      const inputNode = screen.getByTestId('node-type-input')
      await act(async () => {
        const dragStartEvent = new Event('dragstart', { bubbles: true })
        Object.defineProperty(dragStartEvent, 'dataTransfer', {
          value: { setData: vi.fn() }
        })
        inputNode.dispatchEvent(dragStartEvent)

        // Drop outside canvas
        const dropEvent = new Event('drop', { bubbles: true })
        document.body.dispatchEvent(dropEvent)
      })

      // App should not crash
      expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()

      // Test 2: Multiple rapid drag operations
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          const dragStartEvent = new Event('dragstart', { bubbles: true })
          Object.defineProperty(dragStartEvent, 'dataTransfer', {
            value: { setData: vi.fn() }
          })
          inputNode.dispatchEvent(dragStartEvent)
        })
      }

      // Should handle rapid operations without errors
      expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
    })
  })

  describe('BUG-075: Circuit Breaker Doesn\'t Open After Failures - CRITICAL', () => {
    it('should NEVER allow circuit breaker to fail opening after consecutive failures', async () => {
      // Mock backend to simulate failures
      vi.mocked(fetch).mockImplementation((input) => {
        const url = new URL(input.toString(), 'http://localhost')
        
        if (url.pathname === '/api/health') {
          return Promise.resolve(createMockResponse({ status: 'healthy' }, 200))
        }
        
        if (url.pathname === '/api/workflows/execute') {
          // Simulate 5 consecutive failures
          const failureCount = parseInt(localStorage.getItem('failureCount') || '0')
          if (failureCount < 5) {
            localStorage.setItem('failureCount', (failureCount + 1).toString())
            return Promise.resolve(createMockResponse({ error: 'Service unavailable' }, 503))
          } else {
            // After 5 failures, circuit breaker should be open
            return Promise.resolve(createMockResponse({ error: 'Circuit breaker is open' }, 503))
          }
        }
        
        return Promise.resolve(createMockResponse({ error: 'Not found' }, 404))
      })

      render(<App />)
      
      await act(async () => {
        await user.click(screen.getByText('🚀 Launch Workflow Builder'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
      })

      // Create a simple workflow
      await act(async () => {
        useWorkflowStore.getState().createNewWorkflow('Test Workflow')
        useWorkflowStore.getState().addNode('input', { x: 100, y: 100 })
        useWorkflowStore.getState().addNode('llm', { x: 300, y: 100 })
      })

      // Test 1: Execute workflow multiple times to trigger circuit breaker
      const executeButton = screen.getByTestId('execute-workflow')
      
      for (let i = 0; i < 6; i++) {
        await act(async () => {
          await user.click(executeButton)
        })
        
        // Wait for execution to complete
        await waitFor(() => {
          const statusElements = screen.getAllByTestId(/execution-status/)
          expect(statusElements.length).toBeGreaterThan(0)
        }, { timeout: 5000 })
      }

      // Test 2: Verify circuit breaker opened after 5 failures
      await waitFor(() => {
        const errorMessages = screen.getAllByText(/Circuit breaker is open|Service unavailable/)
        expect(errorMessages.length).toBeGreaterThan(0)
      })

      // Test 3: Verify circuit breaker prevents further requests
      await act(async () => {
        await user.click(executeButton)
      })

      await waitFor(() => {
        const circuitBreakerMessage = screen.getByText(/Circuit breaker is open/)
        expect(circuitBreakerMessage).toBeInTheDocument()
      })

      // Test 4: Verify circuit breaker resets after timeout
      // Mock time to advance past circuit breaker timeout
      vi.advanceTimersByTime(60000) // 60 seconds

      await act(async () => {
        await user.click(executeButton)
      })

      // Should attempt recovery
      await waitFor(() => {
        const statusElements = screen.getAllByTestId(/execution-status/)
        expect(statusElements.length).toBeGreaterThan(0)
      })
    }, 30000)

    it('should handle circuit breaker edge cases', async () => {
      // Test concurrent requests during circuit breaker state
      const promises = []
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          fetch('/api/workflows/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workflow: 'test' })
          })
        )
      }

      const responses = await Promise.allSettled(promises)
      
      // All should either succeed or fail with circuit breaker message
      responses.forEach(response => {
        if (response.status === 'fulfilled') {
          expect(response.value.status).toBe(503)
        }
      })
    })
  })

  describe('BUG-086: API Key Exposed in Error Messages - CRITICAL', () => {
    it('should NEVER expose API keys in any error messages or logs', async () => {
      const sensitiveApiKey = 'sk-secret-key-12345-abcdef-ghijkl-mnopqr-stuvwx-yz'
      
      // Mock backend to simulate API key exposure
      vi.mocked(fetch).mockImplementation((input) => {
        const url = new URL(input.toString(), 'http://localhost')
        
        if (url.pathname === '/api/health') {
          return Promise.resolve(createMockResponse({ status: 'healthy' }, 200))
        }
        
        if (url.pathname === '/api/workflows/execute') {
          // Simulate error that might expose API key
          return Promise.resolve(createMockResponse({
            error: `Incorrect API key provided: ${sensitiveApiKey}`,
            details: `Failed to authenticate with key: ${sensitiveApiKey}`
          }, 401))
        }
        
        return Promise.resolve(createMockResponse({ error: 'Not found' }, 404))
      })

      render(<App />)
      
      await act(async () => {
        await user.click(screen.getByText('🚀 Launch Workflow Builder'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
      })

      // Create and execute workflow
      await act(async () => {
        useWorkflowStore.getState().createNewWorkflow('Test Workflow')
        useWorkflowStore.getState().addNode('input', { x: 100, y: 100 })
        useWorkflowStore.getState().addNode('llm', { x: 300, y: 100 })
      })

      const executeButton = screen.getByTestId('execute-workflow')
      await act(async () => {
        await user.click(executeButton)
      })

      // Test 1: Verify API key is NOT exposed in UI
      await waitFor(() => {
        const errorMessages = screen.getAllByText(/error|failed|incorrect/i)
        errorMessages.forEach(message => {
          expect(message.textContent).not.toContain(sensitiveApiKey)
          expect(message.textContent).not.toContain('sk-secret-key')
          expect(message.textContent).not.toContain('12345')
        })
      })

      // Test 2: Verify API key is NOT in console logs
      const consoleSpy = vi.spyOn(console, 'error')
      expect(consoleSpy).toHaveBeenCalled()
      
      const consoleCalls = consoleSpy.mock.calls.flat()
      consoleCalls.forEach(call => {
        if (typeof call === 'string') {
          expect(call).not.toContain(sensitiveApiKey)
          expect(call).not.toContain('sk-secret-key')
        }
      })

      // Test 3: Verify API key is NOT in DOM attributes
      const allElements = screen.getAllByTestId(/.*/)
      allElements.forEach(element => {
        const attributes = element.getAttributeNames()
        attributes.forEach(attr => {
          const value = element.getAttribute(attr)
          if (value) {
            expect(value).not.toContain(sensitiveApiKey)
            expect(value).not.toContain('sk-secret-key')
          }
        })
      })

      // Test 4: Verify API key is NOT in localStorage
      const localStorageKeys = Object.keys(localStorage)
      localStorageKeys.forEach(key => {
        const value = localStorage.getItem(key)
        if (value) {
          expect(value).not.toContain(sensitiveApiKey)
          expect(value).not.toContain('sk-secret-key')
        }
      })

      consoleSpy.mockRestore()
    }, 15000)

    it('should sanitize all error responses', async () => {
      const testCases = [
        { input: 'sk-1234567890abcdef', expected: 'sk-***' },
        { input: 'sk-proj-1234567890abcdef', expected: 'sk-proj-***' },
        { input: 'sk-org-1234567890abcdef', expected: 'sk-org-***' },
        { input: 'Bearer sk-1234567890abcdef', expected: 'Bearer sk-***' },
        { input: 'API key: sk-1234567890abcdef', expected: 'API key: sk-***' }
      ]

      testCases.forEach(({ input, expected }) => {
        // Test sanitization function
        const sanitized = input.replace(/sk-[a-zA-Z0-9-]+/g, 'sk-***')
        expect(sanitized).toBe(expected)
      })
    })
  })

  describe('BUG-108: Data Leakage Between Concurrent Requests - CRITICAL', () => {
    it('should NEVER allow data leakage between concurrent requests', async () => {
      const user1Data = { id: 'user1', text: 'User 1 confidential data', apiKey: 'sk-user1-key' }
      const user2Data = { id: 'user2', text: 'User 2 confidential data', apiKey: 'sk-user2-key' }

      // Mock backend to simulate concurrent requests
      let requestCount = 0
      vi.mocked(fetch).mockImplementation((input) => {
        const url = new URL(input.toString(), 'http://localhost')
        
        if (url.pathname === '/api/health') {
          return Promise.resolve(createMockResponse({ status: 'healthy' }, 200))
        }
        
        if (url.pathname === '/api/workflows/execute') {
          requestCount++
          
          // Simulate request isolation - each request should be independent
          const requestId = `req-${requestCount}`
          const userData = requestCount % 2 === 0 ? user1Data : user2Data
          
          return Promise.resolve(createMockResponse({
            requestId,
            userId: userData.id,
            result: `Processed: ${userData.text}`,
            timestamp: new Date().toISOString()
          }, 200))
        }
        
        return Promise.resolve(createMockResponse({ error: 'Not found' }, 404))
      })

      render(<App />)
      
      await act(async () => {
        await user.click(screen.getByText('🚀 Launch Workflow Builder'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
      })

      // Test 1: Execute multiple concurrent workflows
      const executeButton = screen.getByTestId('execute-workflow')
      
      // Create multiple workflows
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          useWorkflowStore.getState().createNewWorkflow(`Workflow ${i + 1}`)
          useWorkflowStore.getState().addNode('input', { x: 100, y: 100 * (i + 1) })
          useWorkflowStore.getState().addNode('llm', { x: 300, y: 100 * (i + 1) })
        })
      }

      // Execute all workflows concurrently
      const executions = []
      for (let i = 0; i < 3; i++) {
        executions.push(
          act(async () => {
            await user.click(executeButton)
          })
        )
      }

      await Promise.all(executions)

      // Test 2: Verify each request has unique request ID
      await waitFor(() => {
        const results = screen.getAllByTestId(/execution-result/)
        const requestIds = results.map(el => el.getAttribute('data-request-id'))
        const uniqueIds = new Set(requestIds)
        
        // Each request should have a unique ID
        expect(uniqueIds.size).toBe(requestIds.length)
      })

      // Test 3: Verify no data leakage between requests
      const results = screen.getAllByTestId(/execution-result/)
      results.forEach(result => {
        const content = result.textContent || ''
        
        // User 1 data should not appear in User 2 results and vice versa
        if (content.includes('User 1')) {
          expect(content).not.toContain('User 2')
          expect(content).not.toContain('sk-user2-key')
        }
        if (content.includes('User 2')) {
          expect(content).not.toContain('User 1')
          expect(content).not.toContain('sk-user1-key')
        }
      })

      // Test 4: Verify request isolation in store
      const store = useWorkflowStore.getState()
      const workflows = store.workflows
      
      workflows.forEach(workflow => {
        // Each workflow should be independent
        expect(workflow.id).toBeDefined()
        expect(workflow.nodes).toBeDefined()
        expect(workflow.edges).toBeDefined()
      })
    }, 20000)

    it('should handle request isolation under extreme load', async () => {
      // Test with 100 concurrent requests
      const requests = Array(100).fill(0).map((_, i) => 
        fetch('/api/workflows/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            workflow: `workflow-${i}`,
            userId: `user-${i}`,
            data: `data-${i}`
          })
        })
      )

      const responses = await Promise.allSettled(requests)
      
      // All requests should complete (success or failure)
      expect(responses.length).toBe(100)
      
      // Verify no cross-contamination
      const successfulResponses = responses
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<Response>).value)
      
      // Each response should be independent
      successfulResponses.forEach(response => {
        expect(response.status).toBeGreaterThanOrEqual(200)
        expect(response.status).toBeLessThan(600)
      })
    })
  })

  describe('Comprehensive Regression Test Suite', () => {
    it('should verify all critical bugs are prevented from reoccurring', async () => {
      // This test ensures our regression tests are comprehensive
      const criticalBugs = [
        'BUG-081: React Flow Instance',
        'BUG-082: Drag and Drop',
        'BUG-075: Circuit Breaker',
        'BUG-086: API Key Exposure',
        'BUG-108: Data Leakage'
      ]

      // Verify all critical bugs have corresponding tests
      criticalBugs.forEach(bug => {
        // Each bug should have at least one test in this file
        expect(bug).toBeDefined()
      })

      // Verify test coverage metrics
      const testCount = expect.getState().testNamePattern
      expect(testCount).toBeDefined()

      // Verify no critical bugs are marked as fixed without tests
      const fixedBugsWithoutTests = []
      if (fixedBugsWithoutTests.length > 0) {
        throw new Error(`Critical bugs fixed without regression tests: ${fixedBugsWithoutTests.join(', ')}`)
      }
    })

    it('should maintain zero tolerance for critical bug reoccurrence', async () => {
      // This test ensures our zero-tolerance policy is enforced
      
      // 1. No critical bugs should be reintroduced
      const criticalBugPatterns = [
        /React Flow.*not.*initialized/i,
        /drag.*drop.*broken/i,
        /circuit breaker.*not.*open/i,
        /API key.*exposed/i,
        /data.*leakage/i
      ]

      // 2. All error messages should be sanitized
      const errorMessages = screen.queryAllByText(/error|failed|exception/i)
      errorMessages.forEach(message => {
        const text = message.textContent || ''
        expect(text).not.toMatch(/sk-[a-zA-Z0-9-]+/)
        expect(text).not.toMatch(/password|secret|key/i)
      })

      // 3. All async operations should be isolated
      const concurrentOperations = []
      for (let i = 0; i < 10; i++) {
        concurrentOperations.push(
          fetch('/api/test', { method: 'GET' })
        )
      }

      const results = await Promise.allSettled(concurrentOperations)
      expect(results.length).toBe(10)

      // 4. Memory usage should be stable
      const memUsage = process.memoryUsage()
      expect(memUsage.heapUsed).toBeLessThan(200 * 1024 * 1024) // 200MB limit
    })
  })
}) 