import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReactFlowProvider } from 'reactflow'
import { WorkflowBuilder } from '@/components/WorkflowBuilder'
import { useWorkflowStore } from '@/state/workflowStore'

// More realistic React Flow mock
vi.mock('reactflow', () => {
  const MockReactFlow = ({ onDrop, onDragOver, children, ...props }: any) => {
    return (
      <div 
        className="react-flow"
        onDrop={onDrop}
        onDragOver={onDragOver}
        data-testid="react-flow"
        {...props}
      >
        <div className="react-flow__viewport">{children}</div>
        <div className="react-flow__nodes">
          {props.nodes?.map((node: any) => (
            <div key={node.id} className="react-flow__node" data-id={node.id}>
              {node.data.label}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return {
    default: MockReactFlow,
    ReactFlowProvider: ({ children }: any) => children,
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
    Handle: () => null,
    Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
    useReactFlow: () => ({
      project: (coords: { x: number; y: number }) => coords,
      getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
      fitView: vi.fn()
    }),
    ConnectionMode: { Loose: 'loose' },
    BackgroundVariant: { Dots: 'dots' }
  }
})

describe('Drag and Drop Fix Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useWorkflowStore.setState({
      nodes: [],
      edges: [],
      selectedNode: null,
      isPaletteOpen: true,
      isConfigPanelOpen: false,
      currentTheme: 'light'
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Understanding the Drag Drop Problem', () => {
    it('should properly handle dataTransfer in drag events', () => {
      const { container } = render(
        <ReactFlowProvider>
          <WorkflowBuilder />
        </ReactFlowProvider>
      )

      // Find palette node
      const inputNode = screen.getByText('Input').closest('.palette-node')
      expect(inputNode).toBeTruthy()

      // Create proper drag event with dataTransfer
      const dataTransfer = new DataTransfer()
      
      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        dataTransfer
      })

      // Spy on setData
      const setDataSpy = vi.spyOn(dataTransfer, 'setData')
      
      fireEvent(inputNode!, dragStartEvent)

      // Check that data was set
      expect(setDataSpy).toHaveBeenCalledWith('application/reactflow', 'input')
    })

    it('should receive correct data on drop', () => {
      const { container } = render(
        <ReactFlowProvider>
          <WorkflowBuilder />
        </ReactFlowProvider>
      )

      const reactFlow = screen.getByTestId('react-flow')
      
      // Create dataTransfer with data
      const dataTransfer = new DataTransfer()
      dataTransfer.setData('application/reactflow', 'llm')
      
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        dataTransfer,
        clientX: 300,
        clientY: 200
      })

      // Spy on store
      const store = useWorkflowStore.getState()
      const addNodeSpy = vi.spyOn(store, 'addNode')

      fireEvent(reactFlow, dropEvent)

      // Should call addNode with correct type
      expect(addNodeSpy).toHaveBeenCalledWith('llm', expect.any(Object))
    })

    it('should calculate correct drop position relative to viewport', () => {
      const { container } = render(
        <ReactFlowProvider>
          <WorkflowBuilder />
        </ReactFlowProvider>
      )

      const reactFlow = screen.getByTestId('react-flow')
      
      // Mock getBoundingClientRect
      reactFlow.getBoundingClientRect = vi.fn(() => ({
        left: 100,
        top: 50,
        right: 900,
        bottom: 650,
        width: 800,
        height: 600,
        x: 100,
        y: 50,
        toJSON: () => {}
      }))

      const dataTransfer = new DataTransfer()
      dataTransfer.setData('application/reactflow', 'input')
      
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        dataTransfer,
        clientX: 400, // 400 - 100 = 300 relative
        clientY: 250  // 250 - 50 = 200 relative
      })

      const store = useWorkflowStore.getState()
      const addNodeSpy = vi.spyOn(store, 'addNode')

      fireEvent(reactFlow, dropEvent)

      // Should calculate position relative to container
      expect(addNodeSpy).toHaveBeenCalledWith('input', { x: 300, y: 200 })
    })
  })

  describe('React Flow Integration Issues', () => {
    it('should handle React Flow viewport transformations', () => {
      const { container } = render(
        <ReactFlowProvider>
          <WorkflowBuilder />
        </ReactFlowProvider>
      )

      const reactFlow = screen.getByTestId('react-flow')
      
      // Simulate React Flow with zoom and pan
      const mockProject = vi.fn((coords) => ({
        x: coords.x / 1.5, // zoom level 1.5
        y: coords.y / 1.5
      }))

      // Override useReactFlow
      vi.mocked(vi.importActual('reactflow')).useReactFlow = () => ({
        project: mockProject,
        getViewport: () => ({ x: -100, y: -50, zoom: 1.5 }),
        fitView: vi.fn()
      })

      const dataTransfer = new DataTransfer()
      dataTransfer.setData('application/reactflow', 'llm')
      
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        dataTransfer,
        clientX: 450,
        clientY: 300
      })

      fireEvent(reactFlow, dropEvent)

      // Should call project function
      expect(mockProject).toHaveBeenCalled()
    })

    it('should prevent default behavior on drag over', () => {
      const { container } = render(
        <ReactFlowProvider>
          <WorkflowBuilder />
        </ReactFlowProvider>
      )

      const reactFlow = screen.getByTestId('react-flow')
      
      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true
      })

      const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault')
      
      fireEvent(reactFlow, dragOverEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Node Creation After Drop', () => {
    it('should create node with correct initial data', async () => {
      const { container } = render(
        <ReactFlowProvider>
          <WorkflowBuilder />
        </ReactFlowProvider>
      )

      const reactFlow = screen.getByTestId('react-flow')
      const store = useWorkflowStore.getState()
      
      const dataTransfer = new DataTransfer()
      dataTransfer.setData('application/reactflow', 'llm')
      
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        dataTransfer,
        clientX: 300,
        clientY: 200
      })

      fireEvent(reactFlow, dropEvent)

      await waitFor(() => {
        expect(store.nodes.length).toBe(1)
        expect(store.nodes[0]).toMatchObject({
          type: 'llm',
          position: expect.any(Object),
          data: expect.objectContaining({
            label: expect.any(String),
            isConfigured: false
          })
        })
      })
    })

    it('should select newly created node', async () => {
      const { container } = render(
        <ReactFlowProvider>
          <WorkflowBuilder />
        </ReactFlowProvider>
      )

      const reactFlow = screen.getByTestId('react-flow')
      const store = useWorkflowStore.getState()
      
      const dataTransfer = new DataTransfer()
      dataTransfer.setData('application/reactflow', 'compare')
      
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        dataTransfer,
        clientX: 300,
        clientY: 200
      })

      fireEvent(reactFlow, dropEvent)

      await waitFor(() => {
        expect(store.selectedNode).toBe(store.nodes[0]?.id)
        expect(store.isConfigPanelOpen).toBe(true)
      })
    })
  })

  describe('Error Scenarios', () => {
    it('should handle drops without node type', () => {
      const { container } = render(
        <ReactFlowProvider>
          <WorkflowBuilder />
        </ReactFlowProvider>
      )

      const reactFlow = screen.getByTestId('react-flow')
      const store = useWorkflowStore.getState()
      
      const dataTransfer = new DataTransfer()
      // No data set
      
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        dataTransfer,
        clientX: 300,
        clientY: 200
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      fireEvent(reactFlow, dropEvent)

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('No node type'))
      
      // Should not add node
      expect(store.nodes.length).toBe(0)

      consoleErrorSpy.mockRestore()
    })

    it('should handle invalid node types', () => {
      const { container } = render(
        <ReactFlowProvider>
          <WorkflowBuilder />
        </ReactFlowProvider>
      )

      const reactFlow = screen.getByTestId('react-flow')
      const store = useWorkflowStore.getState()
      
      const dataTransfer = new DataTransfer()
      dataTransfer.setData('application/reactflow', 'invalid-node-type')
      
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        dataTransfer,
        clientX: 300,
        clientY: 200
      })

      fireEvent(reactFlow, dropEvent)

      // Should still create node (store doesn't validate types)
      expect(store.nodes.length).toBe(1)
    })
  })

  describe('Multiple Drag Operations', () => {
    it('should handle multiple consecutive drops', async () => {
      const { container } = render(
        <ReactFlowProvider>
          <WorkflowBuilder />
        </ReactFlowProvider>
      )

      const reactFlow = screen.getByTestId('react-flow')
      const store = useWorkflowStore.getState()
      
      // Drop three nodes
      const nodeTypes = ['input', 'llm', 'output']
      
      for (let i = 0; i < nodeTypes.length; i++) {
        const dataTransfer = new DataTransfer()
        dataTransfer.setData('application/reactflow', nodeTypes[i])
        
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          dataTransfer,
          clientX: 200 + (i * 200),
          clientY: 200
        })

        fireEvent(reactFlow, dropEvent)
      }

      await waitFor(() => {
        expect(store.nodes.length).toBe(3)
        expect(store.nodes.map(n => n.type)).toEqual(nodeTypes)
      })
    })

    it('should handle drag cancel scenarios', () => {
      const { container } = render(
        <ReactFlowProvider>
          <WorkflowBuilder />
        </ReactFlowProvider>
      )

      const inputNode = screen.getByText('Input').closest('.palette-node')
      
      // Start drag
      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        dataTransfer: new DataTransfer()
      })
      
      fireEvent(inputNode!, dragStartEvent)

      // Cancel drag (dragend without drop)
      const dragEndEvent = new DragEvent('dragend', {
        bubbles: true,
        dataTransfer: dragStartEvent.dataTransfer
      })
      
      fireEvent(inputNode!, dragEndEvent)

      // No nodes should be created
      const store = useWorkflowStore.getState()
      expect(store.nodes.length).toBe(0)
    })
  })
})