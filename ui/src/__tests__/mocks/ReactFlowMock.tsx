/**
 * React Flow Mock for Testing
 * 
 * Provides a complete mock of React Flow components to enable testing
 * without browser dependencies that cause issues in jsdom.
 */

import React from 'react'
import { vi } from 'vitest'

// Mock React Flow types
export interface MockNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: any
}

export interface MockEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

// Mock ReactFlow component
const MockReactFlow = React.forwardRef<any, any>((props, ref) => {
  const {
    nodes = [],
    edges = [],
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onNodeDoubleClick,
    onPaneClick,
    nodeTypes,
    children
  } = props

  React.useImperativeHandle(ref, () => ({
    fitView: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    setViewport: vi.fn(),
    getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    getNodes: vi.fn(() => nodes),
    getEdges: vi.fn(() => edges),
    addEdge: vi.fn(),
    addNode: vi.fn(),
    deleteNode: vi.fn(),
    deleteEdge: vi.fn()
  }))

  const handleNodeClick = (event: React.MouseEvent, node: MockNode) => {
    if (onNodeClick) onNodeClick(event, node)
  }

  const handleNodeDoubleClick = (event: React.MouseEvent, node: MockNode) => {
    if (onNodeDoubleClick) onNodeDoubleClick(event, node)
  }

  const handlePaneClick = (event: React.MouseEvent) => {
    if (onPaneClick) onPaneClick(event)
  }

  return (
    <div 
      className="react-flow__renderer"
      onClick={handlePaneClick}
      data-testid="react-flow-wrapper"
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {/* Render nodes */}
      {nodes.map((node: MockNode) => {
        const NodeComponent = nodeTypes?.[node.type] || DefaultNodeComponent
        return (
          <div
            key={node.id}
            className={`react-flow__node react-flow__node-${node.type}`}
            data-id={node.id}
            onClick={(e) => handleNodeClick(e, node)}
            onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
            style={{
              position: 'absolute',
              left: node.position.x,
              top: node.position.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <NodeComponent data={node.data} selected={false} />
          </div>
        )
      })}

      {/* Render edges */}
      {edges.map((edge: MockEdge) => (
        <div
          key={edge.id}
          className="react-flow__edge"
          data-testid={`edge-${edge.source}-${edge.target}`}
        >
          {/* Simple edge representation */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <line 
              x1="0%" 
              y1="0%" 
              x2="100%" 
              y2="100%" 
              stroke="#999" 
              strokeWidth="2"
            />
          </svg>
        </div>
      ))}

      {/* Render children (Background, Controls, etc.) */}
      {children}
    </div>
  )
})

MockReactFlow.displayName = 'MockReactFlow'

// Default node component
const DefaultNodeComponent: React.FC<{ data: any; selected: boolean }> = ({ data, selected }) => (
  <div className={`default-node ${selected ? 'selected' : ''}`}>
    <div className="node-content">
      {data.label || 'Node'}
    </div>
  </div>
)

// Mock ReactFlowProvider
const MockReactFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div data-testid="react-flow-provider">{children}</div>
}

// Mock Background component
const MockBackground: React.FC<any> = (props) => (
  <div className="react-flow__background" data-testid="react-flow-background" />
)

// Mock Controls component
const MockControls: React.FC<any> = (props) => (
  <div className="react-flow__controls" data-testid="react-flow-controls">
    <button data-testid="zoom-in">+</button>
    <button data-testid="zoom-out">-</button>
    <button data-testid="fit-view">⌂</button>
  </div>
)

// Mock MiniMap component
const MockMiniMap: React.FC<any> = (props) => (
  <div className="react-flow__minimap" data-testid="react-flow-minimap" />
)

// Mock Handle component
const MockHandle: React.FC<any> = ({ type, position, ...props }) => (
  <div 
    className={`react-flow__handle react-flow__handle-${type} ${type}-handle`}
    data-testid={`handle-${type}`}
    {...props}
  />
)

// Mock useReactFlow hook
const mockUseReactFlow = () => ({
  getNodes: vi.fn(() => []),
  getEdges: vi.fn(() => []),
  setNodes: vi.fn(),
  setEdges: vi.fn(),
  addNodes: vi.fn(),
  addEdges: vi.fn(),
  deleteNodes: vi.fn(),
  deleteEdges: vi.fn(),
  fitView: vi.fn(),
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  zoomTo: vi.fn(),
  setViewport: vi.fn(),
  getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
  getInternalNode: vi.fn(),
  project: vi.fn(),
  screenToFlowPosition: vi.fn()
})

// Mock utility functions
const mockApplyNodeChanges = vi.fn((changes, nodes) => nodes)
const mockApplyEdgeChanges = vi.fn((changes, edges) => edges)
const mockAddEdge = vi.fn((connection, edges) => [...edges, { 
  id: `${connection.source}-${connection.target}`, 
  ...connection 
}])

// Export all mocks
export {
  MockReactFlow as default,
  MockReactFlowProvider as ReactFlowProvider,
  MockBackground as Background,
  MockControls as Controls,
  MockMiniMap as MiniMap,
  MockHandle as Handle,
  mockUseReactFlow as useReactFlow,
  mockApplyNodeChanges as applyNodeChanges,
  mockApplyEdgeChanges as applyEdgeChanges,
  mockAddEdge as addEdge
}

// Mock enums
export const Position = {
  Top: 'top',
  Right: 'right',
  Bottom: 'bottom',
  Left: 'left'
}

export const ConnectionMode = {
  Strict: 'strict',
  Loose: 'loose'
}

export const BackgroundVariant = {
  Lines: 'lines',
  Dots: 'dots'
}