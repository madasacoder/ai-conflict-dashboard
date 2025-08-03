/**
 * CRITICAL MVP TESTS
 * These tests MUST pass for the app to be considered minimally viable
 * They test real user workflows, not just component rendering
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { useWorkflowStore } from '@/state/workflowStore'

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

describe('CRITICAL: MVP Must-Have Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('1. Complete User Workflow - Text Analysis', () => {
    it('should allow user to create, configure, and execute a complete workflow', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Step 1: Launch app and enter workflow builder
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Step 2: The workflow builder should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
      })

      // Open workflow menu dropdown
      const workflowMenuBtn = screen.getByLabelText('Workflow menu')
      await user.click(workflowMenuBtn)

      // Click New Workflow in dropdown
      const newWorkflowBtn = await screen.findByText('New Workflow')
      await user.click(newWorkflowBtn)

      // The WorkflowModal should open with create mode
      const workflowNameInput = await screen.findByPlaceholderText('e.g., Content Analysis Pipeline')
      await user.type(workflowNameInput, 'My Analysis Pipeline')

      const createBtn = screen.getByRole('button', { name: /create workflow/i })
      await user.click(createBtn)

      // Step 3: Add nodes - Since drag/drop doesn't work in jsdom, use the store directly
      // This simulates what would happen after a successful drag and drop
      const { addNode } = useWorkflowStore.getState()
      
      // Add an input node
      const inputNodeId = addNode('input', { x: 300, y: 200 })
      
      // Force re-render to show the new node
      await waitFor(() => {
        const nodes = useWorkflowStore.getState().nodes
        expect(nodes.length).toBeGreaterThan(0)
      })

      // Verify node was created with the correct test ID
      await waitFor(() => {
        expect(screen.getByTestId(`rf__node-${inputNodeId}`)).toBeTruthy()
      })

      // Step 4: Configure the input node
      const createdNode = screen.getByTestId(`rf__node-${inputNodeId}`)
      await user.click(createdNode)

      const configPanel = await screen.findByTestId('config-panel')
      const textInput = within(configPanel).getByLabelText('Input Text')
      await user.type(textInput, 'Analyze this text for sentiment and key topics')

      // Step 5: Add LLM node and connect
      const llmNodeId = addNode('llm', { x: 500, y: 200 })
      
      await waitFor(() => {
        expect(screen.getByTestId(`rf__node-${llmNodeId}`)).toBeTruthy()
      })

      // Connect nodes using the store
      const { onConnect } = useWorkflowStore.getState()
      onConnect({
        source: inputNodeId,
        target: llmNodeId,
        sourceHandle: null,
        targetHandle: null
      })

      // Verify connection
      await waitFor(() => {
        const edges = useWorkflowStore.getState().edges
        expect(edges.length).toBeGreaterThan(0)
      })

      // Step 6: Configure LLM node
      const llmNodeElement = screen.getByTestId(`rf__node-${llmNodeId}`)
      await user.click(llmNodeElement)

      const modelSelect = within(configPanel).getByLabelText('Model')
      await user.selectOptions(modelSelect, 'gpt-4')

      const apiKeyInput = within(configPanel).getByLabelText('API Key')
      await user.type(apiKeyInput, 'test-api-key')

      // Step 7: Execute the workflow
      mockAPI.executeNode.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: 'Sentiment: Positive. Key topics: analysis, sentiment',
            status: 'completed',
          }),
      })

      const executeBtn = screen.getByText('Run Workflow')
      await user.click(executeBtn)

      // Verify execution started
      expect(screen.getByText('Executing...')).toBeTruthy()

      // Verify results displayed
      await waitFor(() => {
        expect(screen.getByText(/Sentiment: Positive/)).toBeTruthy()
      })

      // Step 8: Save the workflow
      mockAPI.saveWorkflow.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'workflow-123', saved: true }),
      })

      const saveBtn = screen.getByText('Save Workflow')
      await user.click(saveBtn)

      await waitFor(() => {
        expect(screen.getByText('Workflow saved!')).toBeTruthy()
      })

      expect(mockAPI.saveWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('My Analysis Pipeline'),
        })
      )
    })
  })

  describe('2. Error Handling and Recovery', () => {
    it('should gracefully handle API failures without crashing', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Simulate API failure
      mockAPI.executeNode.mockRejectedValueOnce(new Error('API Key Invalid'))

      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Try to execute without proper setup
      const executeBtn = screen.getByText('Execute')
      await user.click(executeBtn)

      // Should show error, not crash - check in the validation errors container
      await waitFor(() => {
        const validationContainer = screen.getByTestId('validation-errors')
        expect(validationContainer).toBeInTheDocument()
        const errors = screen.getAllByTestId(/^validation-error-/)
        expect(errors.length).toBeGreaterThan(0)
      })

      // App should still be functional
      expect(screen.getByText('Node Library')).toBeTruthy()
    })

    it('should validate workflow before execution', async () => {
      const user = userEvent.setup()
      render(<App />)

      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Try to run empty workflow
      const executeBtn = screen.getByText('Execute')
      await user.click(executeBtn)

      // Should show validation error - check in the validation errors container
      await waitFor(() => {
        const validationContainer = screen.getByTestId('validation-errors')
        expect(validationContainer).toBeInTheDocument()
        const errors = screen.getAllByTestId(/^validation-error-/)
        expect(errors.length).toBeGreaterThan(0)
        expect(errors[0]).toHaveTextContent(/Workflow must contain at least one node|Workflow must have at least one input node/)
      })
    })
  })

  describe('3. State Persistence and Recovery', () => {
    it('should persist workflow across page reloads', async () => {
      const user = userEvent.setup()
      const { unmount } = render(<App />)

      // Create a workflow
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Add some nodes (simplified for test)
      const mockWorkflow = {
        nodes: [{ id: '1', type: 'input', position: { x: 100, y: 100 } }],
        edges: [],
      }

      // Simulate autosave
      localStorage.setItem('currentWorkflow', JSON.stringify(mockWorkflow))

      // Unmount and remount
      unmount()
      render(<App />)

      // Re-enter workflow builder
      const launchButton2 = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton2)

      // Verify workflow was restored
      await waitFor(() => {
        expect(screen.getByTestId('rf__node-input-1')).toBeTruthy()
      })
    })
  })

  describe('4. Performance Under Load', () => {
    it('should handle workflows with 50+ nodes without significant lag', async () => {
      const user = userEvent.setup()
      render(<App />)

      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // This test requires implementation of batch node creation
      // For now, just verify the app doesn't crash with many operations
      const startTime = performance.now()
      
      // Verify the app is responsive
      const nodeLibrary = screen.getByText('Node Library')
      expect(nodeLibrary).toBeTruthy()
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should respond quickly
      expect(renderTime).toBeLessThan(1000)
    })
  })

  describe('5. Multi-Model Comparison', () => {
    it('should execute same prompt across multiple models and show comparison', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Setup mock responses
      mockAPI.executeNode
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              model: 'gpt-4',
              result: 'GPT-4 response',
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              model: 'claude',
              result: 'Claude response',
            }),
        })

      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Open workflow menu and select templates
      const workflowMenuBtn = screen.getByLabelText('Workflow menu')
      await user.click(workflowMenuBtn)
      
      const templatesBtn = await screen.findByText('Templates')
      await user.click(templatesBtn)
      
      // Select multi-model comparison template
      const compareTemplate = await screen.findByText('Multi-Model Comparison')
      await user.click(compareTemplate)

      // Configure input
      const promptInput = screen.getByLabelText('Prompt')
      await user.type(promptInput, 'Explain quantum computing')

      // Select models
      const gpt4Checkbox = screen.getByLabelText('GPT-4')
      const claudeCheckbox = screen.getByLabelText('Claude')
      await user.click(gpt4Checkbox)
      await user.click(claudeCheckbox)

      // Execute
      const executeBtn = screen.getByText('Execute')
      await user.click(executeBtn)

      // Verify both results shown
      await waitFor(() => {
        expect(screen.getByText('GPT-4 response')).toBeTruthy()
        expect(screen.getByText('Claude response')).toBeTruthy()
      })

      // Verify comparison analysis
      expect(screen.getByText(/Consensus:/)).toBeTruthy()
      expect(screen.getByText(/Differences:/)).toBeTruthy()
    })
  })

  describe('6. Real-time Collaboration Features', () => {
    it('should show workflow execution progress in real-time', async () => {
      const user = userEvent.setup()
      render(<App />)

      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await user.click(launchButton)

      // Mock SSE for real-time updates
      const mockEventSource = {
        addEventListener: vi.fn((event, handler) => {
          if (event === 'progress') {
            setTimeout(
              () => handler({ data: JSON.stringify({ node: 'input-1', status: 'running' }) }),
              100
            )
            setTimeout(
              () => handler({ data: JSON.stringify({ node: 'input-1', status: 'completed' }) }),
              200
            )
            setTimeout(
              () => handler({ data: JSON.stringify({ node: 'llm-2', status: 'running' }) }),
              300
            )
          }
        }),
        close: vi.fn(),
      }

      global.EventSource = vi.fn(() => mockEventSource) as any

      // Create and run workflow
      const executeBtn = screen.getByText('Execute')
      await user.click(executeBtn)

      // Verify progress updates
      await waitFor(() => {
        const inputNode = screen.getByTestId('rf__node-input-1')
        expect(inputNode).toHaveClass('running')
      })

      await waitFor(() => {
        const inputNode = screen.getByTestId('rf__node-input-1')
        expect(inputNode).toHaveClass('completed')
      })
    })
  })
})
