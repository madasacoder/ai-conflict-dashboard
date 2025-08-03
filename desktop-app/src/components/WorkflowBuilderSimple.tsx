/**
 * WorkflowBuilderSimple - Simplified workflow builder with click-to-add
 * 
 * This implementation uses React Flow's built-in methods for adding nodes
 * without relying on HTML5 drag-and-drop API.
 */

import React, { useCallback, useState, useRef } from 'react'
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowInstance,
  ConnectionMode,
  BackgroundVariant,
  Node,
  Edge,
  Connection,
  addEdge
} from 'reactflow'
import { useWorkflowStore } from '@/state/workflowStore'
import { ConfigPanel } from './ui/ConfigPanel'
import { WorkflowToolbar } from './ui/WorkflowToolbar'
import { ConnectionLine } from './ui/ConnectionLine'

// Custom node components
import { LLMNode } from './nodes/LLMNode'
import { CompareNode } from './nodes/CompareNode'
import { OutputNode } from './nodes/OutputNode'
import { InputNode } from './nodes/InputNode'
import { SummarizeNode } from './nodes/SummarizeNode'

import 'reactflow/dist/style.css'

const nodeTypes = {
  llm: LLMNode,
  compare: CompareNode,
  output: OutputNode,
  input: InputNode,
  summarize: SummarizeNode
}

// Simple Node Palette Component
interface SimplePaletteProps {
  onNodeAdd: (type: string) => void
}

const SimplePalette: React.FC<SimplePaletteProps> = ({ onNodeAdd }) => {
  const nodeOptions = [
    { type: 'input', label: 'Input', color: '#3498db', icon: '📥' },
    { type: 'llm', label: 'AI Analysis', color: '#e74c3c', icon: '🧠' },
    { type: 'compare', label: 'Compare', color: '#f39c12', icon: '🔄' },
    { type: 'summarize', label: 'Summarize', color: '#9b59b6', icon: '📄' },
    { type: 'output', label: 'Output', color: '#27ae60', icon: '📤' }
  ]

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 12,
      padding: 16,
      zIndex: 10,
      boxShadow: 'var(--shadow-lg)'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Add Node</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {nodeOptions.map(option => (
          <button
            key={option.type}
            onClick={() => onNodeAdd(option.type)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: 'var(--bg-primary)',
              border: `1px solid ${option.color}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: 'var(--text-primary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = option.color
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-primary)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
          >
            <span style={{ fontSize: 20 }}>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
      <div style={{ 
        marginTop: 12, 
        fontSize: 12, 
        color: 'var(--text-muted)',
        textAlign: 'center'
      }}>
        Click to add nodes
      </div>
    </div>
  )
}

const WorkflowBuilderSimpleContent: React.FC = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const { 
    nodes,
    edges,
    currentTheme, 
    isConfigPanelOpen, 
    selectedNode, 
    selectNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    togglePalette,
    isPaletteOpen
  } = useWorkflowStore()
  
  // Add a new node using the store
  const onNodeAdd = useCallback((type: string) => {
    if (!reactFlowInstance) return

    // Get center of viewport
    const { x, y, zoom } = reactFlowInstance.getViewport()
    const centerX = (window.innerWidth / 2 - x) / zoom
    const centerY = (window.innerHeight / 2 - y) / zoom

    // Add some randomness to avoid stacking
    const offsetX = (Math.random() - 0.5) * 100
    const offsetY = (Math.random() - 0.5) * 100

    // Use the store's addNode method
    addNode(type as any, { 
      x: centerX + offsetX - 100, // Center the node
      y: centerY + offsetY - 50 
    })
  }, [reactFlowInstance, addNode])

  // Note: onConnect, onNodesChange, and onEdgesChange are now handled by the store

  // Node click handler
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    selectNode(node.id)
  }, [selectNode])

  // Pane click handler
  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  return (
    <div className={`workflow-builder simple ${currentTheme}`} style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={setReactFlowInstance}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionLineComponent={ConnectionLine}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={currentTheme === 'dark' ? '#374151' : '#E5E7EB'}
        />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* Simple Palette */}
      {isPaletteOpen && <SimplePalette onNodeAdd={onNodeAdd} />}

      {/* Toolbar */}
      <WorkflowToolbar />

      {/* Config Panel */}
      {isConfigPanelOpen && selectedNode && <ConfigPanel nodeId={selectedNode} />}

      {/* Instructions */}
      {nodes.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 18,
          pointerEvents: 'none'
        }}>
          <p>Click a node type in the palette to add it to your workflow</p>
          <p style={{ fontSize: 14, marginTop: 10 }}>Connect nodes by dragging from one handle to another</p>
        </div>
      )}
    </div>
  )
}

export const WorkflowBuilderSimple: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderSimpleContent />
    </ReactFlowProvider>
  )
}