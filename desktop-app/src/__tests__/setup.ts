import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import './mocks/server' // Start MSW server for API mocking

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock DataTransfer for drag-and-drop tests
class DataTransferMock {
  data: Record<string, string> = {}
  effectAllowed: string = 'all'
  dropEffect: string = 'none'
  files: File[] = []
  items: DataTransferItem[] = []
  types: string[] = []

  setData(format: string, data: string): void {
    this.data[format] = data
    if (!this.types.includes(format)) {
      this.types.push(format)
    }
  }

  getData(format: string): string {
    return this.data[format] || ''
  }

  clearData(format?: string): void {
    if (format) {
      delete this.data[format]
      this.types = this.types.filter(t => t !== format)
    } else {
      this.data = {}
      this.types = []
    }
  }

  setDragImage(image: Element, x: number, y: number): void {
    // Mock implementation
  }
}

global.DataTransfer = DataTransferMock as any

// Mock DragEvent
global.DragEvent = class DragEvent extends Event {
  dataTransfer: DataTransfer

  constructor(type: string, eventInitDict?: DragEventInit) {
    super(type, eventInitDict)
    this.dataTransfer = new DataTransferMock() as any
  }
} as any

// Mock React Flow - inline to avoid path issues
vi.mock('reactflow', () => {
  const React = require('react')
  
  const MockReactFlow = React.forwardRef((props, ref) => {
    return React.createElement('div', {
      className: 'react-flow__renderer',
      'data-testid': 'react-flow-wrapper'
    })
  })
  
  const MockHandle = (props) => {
    return React.createElement('div', {
      className: `react-flow__handle react-flow__handle-${props.type}`,
      'data-testid': `handle-${props.type}`
    })
  }
  
  return {
    default: MockReactFlow,
    ReactFlowProvider: ({ children }) => React.createElement('div', {}, children),
    Background: () => React.createElement('div', { className: 'react-flow__background' }),
    Controls: () => React.createElement('div', { className: 'react-flow__controls' }),
    MiniMap: () => React.createElement('div', { className: 'react-flow__minimap' }),
    Handle: MockHandle,
    useReactFlow: () => ({
      fitView: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      getNodes: vi.fn(() => []),
      getEdges: vi.fn(() => [])
    }),
    applyNodeChanges: vi.fn((changes, nodes) => {
      return changes.reduce((updatedNodes, change) => {
        switch (change.type) {
          case 'position':
            return updatedNodes.map(node =>
              node.id === change.id 
                ? { ...node, position: change.position }
                : node
            )
          case 'remove':
            return updatedNodes.filter(node => node.id !== change.id)
          case 'select':
            return updatedNodes.map(node =>
              node.id === change.id
                ? { ...node, selected: change.selected }
                : node
            )
          default:
            return updatedNodes
        }
      }, nodes)
    }),
    applyEdgeChanges: vi.fn((changes, edges) => {
      return changes.reduce((updatedEdges, change) => {
        switch (change.type) {
          case 'remove':
            return updatedEdges.filter(edge => edge.id !== change.id)
          case 'select':
            return updatedEdges.map(edge =>
              edge.id === change.id
                ? { ...edge, selected: change.selected }
                : edge
            )
          default:
            return updatedEdges
        }
      }, edges)
    }),
    addEdge: vi.fn((connection, edges) => [...edges, { 
      id: `edge-${connection.source}-${connection.target}`, 
      ...connection 
    }]),
    Position: {
      Top: 'top',
      Right: 'right',
      Bottom: 'bottom',
      Left: 'left'
    },
    ConnectionMode: {
      Strict: 'strict',
      Loose: 'loose'
    },
    BackgroundVariant: {
      Lines: 'lines',
      Dots: 'dots'
    }
  }
})

// Add custom matchers
expect.extend({
  toBeValidNode(received: any) {
    const pass = received && 
      typeof received.id === 'string' &&
      typeof received.type === 'string' &&
      typeof received.position === 'object' &&
      typeof received.position.x === 'number' &&
      typeof received.position.y === 'number'

    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a valid node`
        : `expected ${received} to be a valid node with id, type, and position`
    }
  }
})