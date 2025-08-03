import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ReactFlowProvider } from 'reactflow'
import { WorkflowBuilder } from '@/components/WorkflowBuilder'
import { NodePalette } from '@/components/ui/NodePalette'

// Mock the store with minimal setup
vi.mock('@/state/workflowStore', () => ({
  useWorkflowStore: () => ({
    nodes: [],
    edges: [],
    currentTheme: 'light',
    isPaletteOpen: true,
    isConfigPanelOpen: false,
    selectedNode: null,
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    onConnect: vi.fn(),
    addNode: vi.fn(),
    selectNode: vi.fn(),
    togglePalette: vi.fn()
  })
}))

// Mock React Flow with debugging
vi.mock('reactflow', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    useReactFlow: () => ({
      project: ({ x, y }: { x: number; y: number }) => {
        console.log('React Flow project called with:', { x, y })
        return { x, y }
      },
      fitView: vi.fn()
    }),
    ReactFlow: ({ onDrop, onDragOver, ...props }: any) => {
      // Create a mock React Flow that logs events
      return (
        <div 
          className="react-flow-mock"
          onDrop={(e) => {
            console.log('ReactFlow onDrop triggered')
            onDrop?.(e)
          }}
          onDragOver={(e) => {
            console.log('ReactFlow onDragOver triggered')
            onDragOver?.(e)
          }}
          data-testid="react-flow"
        >
          React Flow Mock
        </div>
      )
    }
  }
})

describe('Drag and Drop Debug Tests', () => {
  it('should trace drag and drop events step by step', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    
    const { container } = render(
      <ReactFlowProvider>
        <WorkflowBuilder />
      </ReactFlowProvider>
    )

    // Step 1: Find the workflow builder container
    const workflowBuilder = container.querySelector('.workflow-builder')
    console.log('Step 1 - Workflow builder found:', !!workflowBuilder)

    // Step 2: Find the canvas
    const canvas = container.querySelector('.workflow-canvas')
    console.log('Step 2 - Canvas found:', !!canvas)

    // Step 3: Check event handlers on workflow builder
    const workflowBuilderProps = workflowBuilder ? Object.keys(workflowBuilder) : []
    console.log('Step 3 - Workflow builder props:', workflowBuilderProps)

    // Step 4: Create and dispatch drag over event
    const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true })
    Object.defineProperty(dragOverEvent, 'dataTransfer', {
      value: { dropEffect: '' }
    })

    console.log('Step 4 - Dispatching dragover event')
    workflowBuilder?.dispatchEvent(dragOverEvent)

    // Step 5: Create and dispatch drop event
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as any
    dropEvent.clientX = 100
    dropEvent.clientY = 200
    dropEvent.dataTransfer = {
      getData: (type: string) => {
        console.log(`Step 5a - getData called with type: ${type}`)
        return type === 'application/reactflow' ? 'input' : ''
      },
      types: ['application/reactflow']
    }

    console.log('Step 5b - Dispatching drop event')
    workflowBuilder?.dispatchEvent(dropEvent)

    // Check console logs
    const logs = consoleSpy.mock.calls.map(call => call.join(' '))
    console.log('All console logs:', logs)

    expect(logs.some(log => log.includes('Drag over canvas'))).toBe(true)
    expect(logs.some(log => log.includes('Drop event fired!'))).toBe(true)
  })

  it('should test data transfer between palette and canvas', () => {
    // Render just the palette
    const { container: paletteContainer } = render(<NodePalette />)
    
    // Find a draggable node
    const inputNode = paletteContainer.querySelector('.palette-node')
    console.log('Palette node found:', !!inputNode)

    // Create drag start event
    let transferredData: Record<string, string> = {}
    const dragStartEvent = new Event('dragstart', { bubbles: true }) as any
    dragStartEvent.dataTransfer = {
      setData: (type: string, data: string) => {
        console.log(`setData called: ${type} = ${data}`)
        transferredData[type] = data
      },
      effectAllowed: ''
    }

    fireEvent(inputNode!, dragStartEvent)

    // Check what data was set
    expect(transferredData['application/reactflow']).toBe('input')
    expect(transferredData['text/plain']).toBe('input')

    // Now test if this data can be retrieved
    const mockGetData = (type: string) => transferredData[type] || ''
    
    // Simulate drop with the transferred data
    const dropData = mockGetData('application/reactflow')
    console.log('Retrieved drop data:', dropData)
    
    expect(dropData).toBe('input')
  })

  it('should verify React Flow receives events', () => {
    const { container } = render(
      <ReactFlowProvider>
        <WorkflowBuilder />
      </ReactFlowProvider>
    )

    // Find the React Flow mock
    const reactFlowMock = container.querySelector('[data-testid="react-flow"]')
    console.log('React Flow mock found:', !!reactFlowMock)

    if (reactFlowMock) {
      // Test drag over on React Flow directly
      const dragOverEvent = new Event('dragover', { bubbles: true })
      fireEvent(reactFlowMock, dragOverEvent)

      // Test drop on React Flow directly  
      const dropEvent = new Event('drop', { bubbles: true })
      fireEvent(reactFlowMock, dropEvent)
    }
  })

  it('should check event bubbling and capture', () => {
    const eventLog: string[] = []
    
    const TestComponent = () => {
      return (
        <div 
          className="outer"
          onDrop={(e) => {
            eventLog.push('outer-drop')
            e.preventDefault()
          }}
          onDragOver={(e) => {
            eventLog.push('outer-dragover')
            e.preventDefault()
          }}
        >
          <div 
            className="inner"
            onDrop={(e) => {
              eventLog.push('inner-drop')
              e.preventDefault()
            }}
            onDragOver={(e) => {
              eventLog.push('inner-dragover')
              e.preventDefault()
            }}
          >
            Drop Target
          </div>
        </div>
      )
    }

    const { container } = render(<TestComponent />)
    const inner = container.querySelector('.inner')!

    // Test drag over
    fireEvent.dragOver(inner)
    console.log('After dragOver:', eventLog)

    // Test drop
    fireEvent.drop(inner)
    console.log('After drop:', eventLog)

    // Both inner and outer should receive events due to bubbling
    expect(eventLog).toContain('inner-dragover')
    expect(eventLog).toContain('outer-dragover')
    expect(eventLog).toContain('inner-drop')
    expect(eventLog).toContain('outer-drop')
  })
})