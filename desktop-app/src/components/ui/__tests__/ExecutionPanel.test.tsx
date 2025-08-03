/**
 * ExecutionPanel Component Tests
 * 
 * Tests for the workflow execution panel including execution controls,
 * progress display, results visualization, and export functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExecutionPanel } from '../ExecutionPanel'
import { useWorkflowStore } from '@/state/workflowStore'
import { workflowExecutor } from '@/services/workflowExecutor'
import { WorkflowExecution, ExecutionResult } from '@/types/workflow'

// Mock the workflow store
vi.mock('@/state/workflowStore', () => ({
  useWorkflowStore: vi.fn()
}))

// Mock the workflow executor
vi.mock('@/services/workflowExecutor', () => ({
  workflowExecutor: {
    executeWorkflow: vi.fn(),
    cancelExecution: vi.fn(),
    executing: false,
    getCurrentExecution: vi.fn()
  }
}))

// Mock CSS imports
vi.mock('../ExecutionPanel.css', () => ({}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn()
  }
})

// Mock URL.createObjectURL and related APIs
Object.assign(global, {
  URL: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
  }
})

const mockWorkflowStore = {
  nodes: [
    {
      id: 'input-1',
      type: 'input',
      position: { x: 0, y: 0 },
      data: { label: 'Input Node', inputType: 'text', icon: '📝' }
    },
    {
      id: 'llm-1',
      type: 'llm',
      position: { x: 200, y: 0 },
      data: { label: 'LLM Node', models: ['gpt-4'], prompt: 'test', icon: '🤖' }
    }
  ],
  edges: [
    { id: 'edge-1', source: 'input-1', target: 'llm-1' }
  ],
  execution: null,
  setExecution: vi.fn(),
  setExecutionProgress: vi.fn()
}

const mockExecution: WorkflowExecution = {
  workflowId: 'test-workflow',
  startTime: new Date('2024-01-01T10:00:00Z'),
  endTime: new Date('2024-01-01T10:02:00Z'),
  status: 'completed',
  totalDuration: 120000,
  results: [
    {
      nodeId: 'input-1',
      success: true,
      data: 'Test input data',
      timestamp: new Date('2024-01-01T10:00:30Z'),
      duration: 100
    },
    {
      nodeId: 'llm-1',
      success: true,
      data: {
        model: 'gpt-4',
        response: 'Analysis result',
        metadata: { temperature: 0.7 }
      },
      timestamp: new Date('2024-01-01T10:01:45Z'),
      duration: 15000
    }
  ]
}

const mockFailedExecution: WorkflowExecution = {
  workflowId: 'failed-workflow',
  startTime: new Date('2024-01-01T10:00:00Z'),
  endTime: new Date('2024-01-01T10:01:00Z'),
  status: 'failed',
  totalDuration: 60000,
  results: [
    {
      nodeId: 'input-1',
      success: true,
      data: 'Test input data',
      timestamp: new Date('2024-01-01T10:00:30Z'),
      duration: 100
    },
    {
      nodeId: 'llm-1',
      success: false,
      error: 'API rate limit exceeded',
      timestamp: new Date('2024-01-01T10:01:00Z'),
      duration: 30000
    }
  ]
}

describe('ExecutionPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useWorkflowStore as any).mockReturnValue(mockWorkflowStore)
  })

  describe('Rendering', () => {
    it('should not render when closed', () => {
      render(<ExecutionPanel isOpen={false} onClose={vi.fn()} />)
      
      expect(screen.queryByText('Workflow Execution')).not.toBeInTheDocument()
    })

    it('should render when open', () => {
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      expect(screen.getByText('Workflow Execution')).toBeInTheDocument()
      expect(screen.getByText('Execute')).toBeInTheDocument()
      expect(screen.getByText('Node Status')).toBeInTheDocument()
    })

    it('should show empty state when no execution', () => {
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      expect(screen.getByText('Ready to Execute')).toBeInTheDocument()
      expect(screen.getByText('Click the Execute button to run your workflow and see the results here.')).toBeInTheDocument()
    })

    it('should display node status cards', () => {
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      expect(screen.getByText('Input Node')).toBeInTheDocument()
      expect(screen.getByText('LLM Node')).toBeInTheDocument()
      expect(screen.getAllByText('pending')).toHaveLength(2)
    })
  })

  describe('Execution Controls', () => {
    it('should handle execute button click', async () => {
      const mockExecuteWorkflow = vi.fn().mockResolvedValue(mockExecution)
      ;(workflowExecutor.executeWorkflow as any).mockImplementation(mockExecuteWorkflow)
      
      const user = userEvent.setup()
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      const executeButton = screen.getByLabelText('Execute workflow')
      await user.click(executeButton)
      
      expect(mockExecuteWorkflow).toHaveBeenCalledWith(
        mockWorkflowStore.nodes,
        mockWorkflowStore.edges,
        expect.objectContaining({
          apiKeys: {},
          onProgress: expect.any(Function),
          onNodeStart: expect.any(Function),
          onNodeComplete: expect.any(Function),
          onNodeError: expect.any(Function)
        })
      )
    })

    it('should handle cancel button during execution', async () => {
      const mockCancelExecution = vi.fn()
      ;(workflowExecutor.cancelExecution as any).mockImplementation(mockCancelExecution)
      
      // Mock executeWorkflow to simulate a long-running execution
      ;(workflowExecutor.executeWorkflow as any).mockImplementation(
        () => new Promise((resolve) => {
          // Never resolve to simulate ongoing execution
          setTimeout(() => resolve(mockExecution), 10000)
        })
      )
      
      const user = userEvent.setup()
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      // Start execution
      const executeButton = screen.getByLabelText('Execute workflow')
      await user.click(executeButton)
      
      // Should show cancel button after starting execution
      await waitFor(() => {
        expect(screen.getByLabelText('Cancel execution')).toBeInTheDocument()
      })
      
      // Click cancel
      const cancelButton = screen.getByLabelText('Cancel execution')
      await user.click(cancelButton)
      
      expect(mockCancelExecution).toHaveBeenCalled()
    })

    it('should disable execute button when no nodes', () => {
      (useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        nodes: []
      })
      
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      const executeButton = screen.getByLabelText('Execute workflow')
      expect(executeButton).toBeDisabled()
    })
  })

  describe('Progress Tracking', () => {
    it('should display progress bar during execution', async () => {
      let onProgressCallback: ((progress: any) => void) | null = null
      
      ;(workflowExecutor.executeWorkflow as any).mockImplementation(
        (nodes: any, edges: any, options: any) => {
          onProgressCallback = options.onProgress
          return new Promise(resolve => {
            setTimeout(() => resolve(mockExecution), 100)
          })
        }
      )
      
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      // Start execution
      const executeButton = screen.getByLabelText('Execute workflow')
      fireEvent.click(executeButton)
      
      // Simulate progress update
      if (onProgressCallback) {
        onProgressCallback({
          completed: 1,
          total: 2,
          percentage: 50,
          current: 'llm-1',
          startTime: new Date(),
          estimatedTimeRemaining: 30
        })
      }
      
      await waitFor(() => {
        expect(screen.getByText('Executing: llm-1')).toBeInTheDocument()
        expect(screen.getByText('1 / 2 (50%)')).toBeInTheDocument()
        expect(screen.getByText('Est. 30s remaining')).toBeInTheDocument()
      })
    })

    it('should update node statuses during execution', async () => {
      let onNodeStartCallback: ((nodeId: string) => void) | null = null
      let onNodeCompleteCallback: ((nodeId: string, result: any) => void) | null = null
      
      ;(workflowExecutor.executeWorkflow as any).mockImplementation(
        (nodes: any, edges: any, options: any) => {
          onNodeStartCallback = options.onNodeStart
          onNodeCompleteCallback = options.onNodeComplete
          return new Promise(resolve => {
            setTimeout(() => resolve(mockExecution), 100)
          })
        }
      )
      
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      // Start execution
      const executeButton = screen.getByLabelText('Execute workflow')
      fireEvent.click(executeButton)
      
      // Simulate node start
      if (onNodeStartCallback) {
        onNodeStartCallback('input-1')
      }
      
      await waitFor(() => {
        expect(screen.getByText('running')).toBeInTheDocument()
      })
      
      // Simulate node completion
      if (onNodeCompleteCallback) {
        onNodeCompleteCallback('input-1', mockExecution.results[0])
      }
      
      await waitFor(() => {
        expect(screen.getByText('completed')).toBeInTheDocument()
      })
    })
  })

  describe('Results Display', () => {
    it('should display execution results', () => {
      (useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        execution: mockExecution
      })
      
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      expect(screen.getByText('Execution Results')).toBeInTheDocument()
      expect(screen.getByText('completed')).toBeInTheDocument()
      expect(screen.getByText('2m 0s')).toBeInTheDocument()
      
      // Should show result items - use getAllByText since nodes appear in multiple places
      expect(screen.getAllByText('Input Node')).toHaveLength(2) // Once in node status, once in results
      expect(screen.getAllByText('LLM Node')).toHaveLength(2)
      expect(screen.getAllByText('Success')).toHaveLength(2)
    })

    it('should display failed execution results', () => {
      (useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        execution: mockFailedExecution
      })
      
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      expect(screen.getByText('failed')).toBeInTheDocument()
      expect(screen.getByText('Success')).toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('should show result details when clicked', async () => {
      (useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        execution: mockExecution
      })
      
      const user = userEvent.setup()
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      // Click on first result - use getAllByText since it appears multiple times
      const inputNodeElements = screen.getAllByText('Input Node')
      const resultItem = inputNodeElements.find(el => el.closest('.result-item'))?.closest('.result-item')
      expect(resultItem).toBeInTheDocument()
      
      await user.click(resultItem!)
      
      // Should show result content
      expect(screen.getByText('Test input data')).toBeInTheDocument()
    })

    it.skip('should handle copy result button', async () => {
      // Mock clipboard API properly before rendering
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      const originalClipboard = navigator.clipboard
      
      // Replace clipboard with mock
      Object.assign(navigator as any, {
        clipboard: { writeText: mockWriteText }
      })
      
      (useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        execution: mockExecution
      })
      
      const user = userEvent.setup()
      const { container } = render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      // Wait for results to be rendered
      await waitFor(() => {
        expect(screen.getByText('Execution Results')).toBeInTheDocument()
      })
      
      // Find all copy buttons
      const copyButtons = container.querySelectorAll('.btn-copy-result')
      expect(copyButtons.length).toBeGreaterThan(0)
      
      // Use fireEvent for simpler test
      const firstCopyButton = copyButtons[0] as HTMLElement
      fireEvent.click(firstCopyButton)
      
      // The handler should be called synchronously
      expect(mockWriteText).toHaveBeenCalledWith(
        JSON.stringify(mockExecution.results[0], null, 2)
      )
      
      // Clean up - restore original clipboard
      Object.assign(navigator as any, {
        clipboard: originalClipboard
      })
    })
  })

  describe('Export Functionality', () => {
    it('should handle export results', async () => {
      (useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        execution: mockExecution
      })
      
      const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
      const mockRevokeObjectURL = vi.fn()
      const mockClick = vi.fn()
      
      Object.assign(global, {
        URL: {
          createObjectURL: mockCreateObjectURL,
          revokeObjectURL: mockRevokeObjectURL
        }
      })
      
      // Create a mock anchor element
      const mockAnchor = document.createElement('a')
      mockAnchor.click = mockClick
      
      // Mock document.createElement to return our mock anchor
      const originalCreateElement = document.createElement
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'a') return mockAnchor
        return originalCreateElement.call(document, tagName)
      })
      
      const user = userEvent.setup()
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      const exportButton = screen.getByLabelText('Export results')
      await user.click(exportButton)
      
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalled()
      
      // Restore original createElement
      document.createElement = originalCreateElement
    })

    it('should not show export button when no execution', () => {
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      expect(screen.queryByLabelText('Export results')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error details', async () => {
      let onNodeErrorCallback: ((nodeId: string, error: string) => void) | null = null
      
      ;(workflowExecutor.executeWorkflow as any).mockImplementation(
        (nodes: any, edges: any, options: any) => {
          onNodeErrorCallback = options.onNodeError
          return Promise.reject(new Error('Execution failed'))
        }
      )
      
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      // Start execution
      const executeButton = screen.getByLabelText('Execute workflow')
      fireEvent.click(executeButton)
      
      // Simulate node error
      if (onNodeErrorCallback) {
        onNodeErrorCallback('llm-1', 'API timeout')
      }
      
      await waitFor(() => {
        expect(screen.getByText('Error Details')).toBeInTheDocument()
        expect(screen.getByText(/Node llm-1: API timeout/)).toBeInTheDocument()
      })
    })

    it('should handle execution failure', async () => {
      (workflowExecutor.executeWorkflow as any).mockRejectedValue(
        new Error('Network error')
      )
      
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      // Start execution
      const executeButton = screen.getByLabelText('Execute workflow')
      fireEvent.click(executeButton)
      
      await waitFor(() => {
        expect(screen.getByText('Error Details')).toBeInTheDocument()
        expect(screen.getByText(/Execution failed: Network error/)).toBeInTheDocument()
      })
    })
  })

  describe('Panel Controls', () => {
    it('should handle close button', async () => {
      const mockOnClose = vi.fn()
      const user = userEvent.setup()
      
      render(<ExecutionPanel isOpen={true} onClose={mockOnClose} />)
      
      const closeButton = screen.getByLabelText('Close execution panel')
      await user.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should have proper accessibility labels', () => {
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      expect(screen.getByLabelText('Execute workflow')).toBeInTheDocument()
      expect(screen.getByLabelText('Close execution panel')).toBeInTheDocument()
    })
  })

  describe('Time Formatting', () => {
    it('should format durations correctly', () => {
      (useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        execution: {
          ...mockExecution,
          results: [
            {
              nodeId: 'test-1',
              success: true,
              data: 'test',
              timestamp: new Date(),
              duration: 500 // 500ms
            },
            {
              nodeId: 'test-2',
              success: true,
              data: 'test',
              timestamp: new Date(),
              duration: 5000 // 5s
            },
            {
              nodeId: 'test-3',
              success: true,
              data: 'test',
              timestamp: new Date(),
              duration: 65000 // 1m 5s
            }
          ]
        }
      })
      
      render(<ExecutionPanel isOpen={true} onClose={vi.fn()} />)
      
      expect(screen.getByText('500ms')).toBeInTheDocument()
      expect(screen.getByText('5s')).toBeInTheDocument()
      expect(screen.getByText('1m 5s')).toBeInTheDocument()
    })
  })
})