/**
 * WorkflowBuilder - Beautiful React Flow Interface
 * 
 * A premium, intuitive workflow builder with smooth animations,
 * smart interactions, and delightful user experience.
 */

import React, { useCallback, useRef, useEffect, useState } from 'react'
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowInstance,
  ConnectionMode,
  BackgroundVariant
} from 'reactflow'
import { useWorkflowStore } from '@/state/workflowStore'
import { NodePalette } from './ui/NodePalette'
import { NodeConfigPanel } from './ui/NodeConfigPanel'
import { WorkflowToolbar } from './ui/WorkflowToolbar'
import { ConnectionLine } from './ui/ConnectionLine'
import { NodeConfigModal } from './ui/NodeConfigModal'
import { CustomControls } from './ui/CustomControls'
import { ExecutionPanel } from './ui/ExecutionPanel'

// Custom node components
import { LLMNode } from './nodes/LLMNode'
import { CompareNode } from './nodes/CompareNode'
import { OutputNode } from './nodes/OutputNode'
import { InputNode } from './nodes/InputNode'
import { SummarizeNode } from './nodes/SummarizeNode'

import 'reactflow/dist/style.css'
import './WorkflowBuilder.css'

// Register custom node types
const nodeTypes = {
  llm: LLMNode,
  compare: CompareNode,
  output: OutputNode,
  input: InputNode,
  summarize: SummarizeNode
}

// Connection line style
const connectionLineStyle = {
  strokeWidth: 2,
  stroke: '#3498db'
}

interface WorkflowBuilderProps {
  className?: string
}

const WorkflowBuilderContent: React.FC<WorkflowBuilderProps> = ({ className }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [dragError, setDragError] = React.useState<string>('')
  const [isDraggingOver, setIsDraggingOver] = React.useState(false)
  const [configModalNodeId, setConfigModalNodeId] = useState<string | null>(null)
  
  const {
    nodes,
    edges,
    currentTheme,
    isPaletteOpen,
    selectedNode,
    isExecutionPanelOpen,
    setExecutionPanelOpen,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode
  } = useWorkflowStore()

  // Handle drop from node palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setIsDraggingOver(true)
    console.log('Drag over canvas')
  }, [])
  
  const onDragLeave = useCallback((event: React.DragEvent) => {
    setIsDraggingOver(false)
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      console.log('Drop event fired!')
      event.preventDefault()
      event.stopPropagation()
      setIsDraggingOver(false)

      // Debug all available data
      console.log('DataTransfer types:', Array.from(event.dataTransfer.types))
      console.log('DataTransfer items:', event.dataTransfer.items)
      
      // Try different ways to get the data
      let type = null
      
      // Method 1: Standard way
      type = event.dataTransfer.getData('application/reactflow')
      console.log('Method 1 (application/reactflow):', type)
      
      // Method 2: Text fallback
      if (!type) {
        type = event.dataTransfer.getData('text/plain')
        console.log('Method 2 (text/plain):', type)
      }
      
      // Method 3: Try text
      if (!type) {
        type = event.dataTransfer.getData('text')
        console.log('Method 3 (text):', type)
      }

      if (!type) {
        console.error('No node type found in drag data')
        setDragError('No node type found in drag data')
        return
      }

      if (!reactFlowWrapper.current) {
        console.error('React Flow wrapper not found')
        setDragError('React Flow wrapper not found')
        return
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      console.log('React Flow bounds:', reactFlowBounds)

      // Calculate position - use project if available, otherwise raw coords
      const position = reactFlowInstance 
        ? reactFlowInstance.project({
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
          })
        : {
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
          }

      console.log('Dropping node:', type, 'at position:', position)
      setDragError('') // Clear any errors
      
      // Ensure the node type is valid
      const validTypes = ['input', 'llm', 'compare', 'summarize', 'output']
      if (!validTypes.includes(type)) {
        console.error('Invalid node type:', type)
        setDragError('Invalid node type: ' + type)
        return
      }
      
      addNode(type as any, position)
    },
    [reactFlowInstance, addNode]
  )

  // Handle node selection
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      selectNode(node.id)
    },
    [selectNode]
  )

  // Handle clicking on empty space
  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  // Auto-fit view on mount
  useEffect(() => {
    if (nodes.length > 0 && reactFlowInstance) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 50 })
      }, 100)
    }
  }, [nodes.length, reactFlowInstance])

  // Initialize React Flow instance
  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance)
    console.log('React Flow initialized')
  }, [])

  return (
    <div className={`workflow-builder ${className || ''} ${currentTheme}`} data-testid="workflow-builder">
      {/* Main Canvas */}
      <div 
        className={`workflow-canvas ${isDraggingOver ? 'dragging-over' : ''}`}
        ref={reactFlowWrapper}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onInit={onInit}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          connectionLineStyle={connectionLineStyle}
          connectionLineComponent={ConnectionLine}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.1}
          maxZoom={2}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
          className="workflow-flow"
        >
          {/* Background with dots/grid pattern */}
          <Background 
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={currentTheme === 'dark' ? '#404040' : '#e1e1e1'}
          />
          
          {/* Custom Controls for zoom/fit */}
          <CustomControls />
          
          {/* Minimap for navigation */}
          <MiniMap
            position="top-right"
            className="workflow-minimap"
            nodeColor={(node) => {
              switch (node.type) {
                case 'llm': return '#e74c3c'
                case 'compare': return '#f39c12'
                case 'output': return '#27ae60'
                case 'input': return '#3498db'
                case 'summarize': return '#9b59b6'
                default: return '#95a5a6'
              }
            }}
            maskColor={currentTheme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'}
          />
        </ReactFlow>
      </div>

      {/* Toolbar */}
      <WorkflowToolbar />

      {/* Node Palette */}
      {isPaletteOpen && (
        <NodePalette className="workflow-palette" />
      )}

      {/* Node Configuration Panel */}
      <NodeConfigPanel />
      
      {/* Execution Panel */}
      <ExecutionPanel 
        isOpen={isExecutionPanelOpen}
        onClose={() => setExecutionPanelOpen(false)}
      />
      
      {/* Node Configuration Modal */}
      {configModalNodeId && (
        <NodeConfigModal
          nodeId={configModalNodeId}
          isOpen={true}
          onClose={() => setConfigModalNodeId(null)}
        />
      )}

      {/* Debug Error Display */}
      {dragError && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'red',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          Drag Error: {dragError}
        </div>
      )}
    </div>
  )
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent {...props} />
    </ReactFlowProvider>
  )
}