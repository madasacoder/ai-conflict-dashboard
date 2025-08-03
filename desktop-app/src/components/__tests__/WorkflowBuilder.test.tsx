import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReactFlowProvider } from 'reactflow'
import { WorkflowBuilder } from '../WorkflowBuilder'
import { useWorkflowStore } from '@/state/workflowStore'

// Mock the store
vi.mock('@/state/workflowStore', () => ({
  useWorkflowStore: vi.fn()
}))

// Mock React Flow
vi.mock('reactflow', () => ({
  default: vi.fn(() => null), // ReactFlow as default export
  ReactFlowProvider: ({ children }: any) => children,
  useNodesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
  useEdgesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
  useReactFlow: () => ({
    project: ({ x, y }: { x: number; y: number }) => ({ x, y }),
    fitView: vi.fn()
  }),
  Controls: vi.fn(() => null),
  MiniMap: vi.fn(() => null),
  Background: vi.fn(() => null),
  Handle: vi.fn(() => null),
  Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
  ConnectionMode: { Loose: 'loose' },
  BackgroundVariant: { Dots: 'dots' }
}))

describe('WorkflowBuilder Drag and Drop', () => {
  const mockAddNode = vi.fn()
  const mockSelectNode = vi.fn()
  
  const defaultMockStore = {
    nodes: [],
    edges: [],
    currentTheme: 'light',
    isPaletteOpen: true,
    isConfigPanelOpen: false,
    selectedNode: null,
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    onConnect: vi.fn(),
    addNode: mockAddNode,
    selectNode: mockSelectNode,
    togglePalette: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useWorkflowStore as any).mockReturnValue(defaultMockStore)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should handle drag over event', () => {
    const { container } = render(
      <ReactFlowProvider>
        <WorkflowBuilder />
      </ReactFlowProvider>
    )

    const workflowBuilder = container.querySelector('.workflow-builder')
    expect(workflowBuilder).toBeTruthy()

    // Create a drag over event
    const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true })
    Object.defineProperty(dragOverEvent, 'dataTransfer', {
      value: {
        dropEffect: ''
      }
    })

    // Spy on preventDefault
    const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault')
    
    // Fire the event
    workflowBuilder!.dispatchEvent(dragOverEvent)

    // Check that preventDefault was called
    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('should handle drop event with valid node type', async () => {
    const { container } = render(
      <ReactFlowProvider>
        <WorkflowBuilder />
      </ReactFlowProvider>
    )

    const workflowBuilder = container.querySelector('.workflow-builder')
    expect(workflowBuilder).toBeTruthy()

    // Create a drop event with data
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as any
    dropEvent.clientX = 100
    dropEvent.clientY = 200
    dropEvent.dataTransfer = {
      getData: (type: string) => {
        if (type === 'application/reactflow') return 'llm'
        if (type === 'text/plain') return 'llm'
        return ''
      },
      types: ['application/reactflow', 'text/plain']
    }

    const preventDefaultSpy = vi.spyOn(dropEvent, 'preventDefault')
    
    // Fire the event
    workflowBuilder!.dispatchEvent(dropEvent)

    // Wait for async operations
    await waitFor(() => {
      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(mockAddNode).toHaveBeenCalledWith('llm', expect.any(Object))
    })
  })

  it('should not add node if no type in drop data', async () => {
    const { container } = render(
      <ReactFlowProvider>
        <WorkflowBuilder />
      </ReactFlowProvider>
    )

    const workflowBuilder = container.querySelector('.workflow-builder')
    expect(workflowBuilder).toBeTruthy()

    // Create a drop event without data
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as any
    dropEvent.clientX = 100
    dropEvent.clientY = 200
    dropEvent.dataTransfer = {
      getData: () => '',
      types: []
    }

    workflowBuilder!.dispatchEvent(dropEvent)

    await waitFor(() => {
      expect(mockAddNode).not.toHaveBeenCalled()
    })
  })

  it('should display error when drop fails', async () => {
    const { container } = render(
      <ReactFlowProvider>
        <WorkflowBuilder />
      </ReactFlowProvider>
    )

    const workflowBuilder = container.querySelector('.workflow-builder')
    
    // Create a drop event without proper data
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as any
    dropEvent.dataTransfer = {
      getData: () => '',
      types: []
    }

    workflowBuilder!.dispatchEvent(dropEvent)

    // Check for error display
    await waitFor(() => {
      const errorElement = screen.queryByText(/No node type found in drag data/i)
      expect(errorElement).toBeTruthy()
    })
  })

  it('should calculate correct drop position', async () => {
    const { container } = render(
      <ReactFlowProvider>
        <WorkflowBuilder />
      </ReactFlowProvider>
    )

    const canvas = container.querySelector('.workflow-canvas')
    
    // Mock getBoundingClientRect
    canvas!.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 50,
      top: 100,
      right: 450,
      bottom: 500,
      width: 400,
      height: 400
    })

    const workflowBuilder = container.querySelector('.workflow-builder')
    
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as any
    dropEvent.clientX = 150
    dropEvent.clientY = 250
    dropEvent.dataTransfer = {
      getData: () => 'input',
      types: ['application/reactflow']
    }

    workflowBuilder!.dispatchEvent(dropEvent)

    await waitFor(() => {
      expect(mockAddNode).toHaveBeenCalledWith('input', { x: 100, y: 150 })
    })
  })
})