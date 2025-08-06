/**
 * WorkflowBuilderFixed - Fixed implementation with proper React Flow drag-drop
 * 
 * This implementation properly handles the interaction between HTML5 drag-drop
 * and React Flow's internal systems.
 */

import React, { useCallback, useRef, useEffect, useState, DragEvent } from 'react'
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
  useStore,
  ReactFlowState
} from 'reactflow'
import { useWorkflowStore } from '@/state/workflowStore'
import { NodePaletteEnhanced } from './ui/NodePaletteEnhanced'
import { ConfigPanel } from './ui/ConfigPanel'
import { WorkflowToolbar } from './ui/WorkflowToolbar'
import { ConnectionLine } from './ui/ConnectionLine'
import { DragDropDebug } from './DragDropDebug'

// Custom node components
import { LLMNode } from './nodes/LLMNode'
import { CompareNode } from './nodes/CompareNode'
import { OutputNode } from './nodes/OutputNode'
import { InputNode } from './nodes/InputNode'
import { SummarizeNode } from './nodes/SummarizeNode'

// Import React Flow styles
import 'reactflow/dist/style.css'

// Node type mapping
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
  stroke: '#9CA3AF'
}

interface WorkflowBuilderProps {
  className?: string
}

const WorkflowBuilderContent: React.FC<WorkflowBuilderProps> = ({ className }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [isValidDrop, setIsValidDrop] = useState(false)
  
  // Get React Flow viewport state
  const transform = useStore((state: ReactFlowState) => state.transform)
  
  const {
    nodes,
    edges,
    currentTheme,
    isPaletteOpen,
    isConfigPanelOpen,
    selectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode
  } = useWorkflowStore()

  // Initialize React Flow
  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance)
    console.log('React Flow initialized with instance:', instance)
  }, [])

  // Enhanced drag over handler
  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    
    // Check if this is a valid node drag
    const isNodeDrag = event.dataTransfer.types.includes('application/reactflow') ||
                       event.dataTransfer.types.includes('text/plain')
    
    if (isNodeDrag) {
      event.dataTransfer.dropEffect = 'copy'
      setIsValidDrop(true)
    } else {
      event.dataTransfer.dropEffect = 'none'
      setIsValidDrop(false)
    }
  }, [])

  // Enhanced drop handler with better coordinate calculation
  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    
    console.log('=== DROP EVENT DEBUG ===')
    console.log('Event target:', event.target)
    console.log('Current target:', event.currentTarget)
    console.log('DataTransfer types:', Array.from(event.dataTransfer.types))
    
    // Get node type from drag data
    let nodeType = event.dataTransfer.getData('application/reactflow')
    if (!nodeType) {
      nodeType = event.dataTransfer.getData('text/plain')
    }
    if (!nodeType) {
      nodeType = event.dataTransfer.getData('text')
    }
    
    console.log('Extracted node type:', nodeType)
    
    if (!nodeType || nodeType.trim() === '') {
      console.error('No valid node type in drop data')
      setIsValidDrop(false)
      return
    }

    // Get the bounds of the react flow wrapper
    if (!reactFlowWrapper.current) {
      console.error('React flow wrapper ref not available')
      return
    }

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
    console.log('React Flow bounds:', reactFlowBounds)
    console.log('Drop coordinates:', { clientX: event.clientX, clientY: event.clientY })

    // Calculate position relative to the React Flow container
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    }

    console.log('Calculated position before projection:', position)

    // If we have a React Flow instance, use it to project the coordinates
    let finalPosition = position
    if (reactFlowInstance) {
      try {
        finalPosition = reactFlowInstance.project(position)
        console.log('Projected position:', finalPosition)
      } catch (error) {
        console.error('Error projecting position:', error)
      }
    } else {
      console.warn('React Flow instance not available, using raw coordinates')
      // Apply manual transform if React Flow instance is not ready
      if (transform) {
        finalPosition = {
          x: (position.x - transform[0]) / transform[2],
          y: (position.y - transform[1]) / transform[2]
        }
        console.log('Manually transformed position:', finalPosition)
      }
    }

    // Add the node
    console.log('Adding node of type:', nodeType, 'at position:', finalPosition)
    addNode(nodeType as any, finalPosition)
    
    setIsValidDrop(false)
  }, [reactFlowInstance, transform, addNode])

  // Drag leave handler
  const onDragLeave = useCallback(() => {
    setIsValidDrop(false)
  }, [])

  // Node click handler
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    selectNode(node.id)
  }, [selectNode])

  // Pane click handler
  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  // Auto-fit view when nodes change
  useEffect(() => {
    if (nodes.length > 0 && reactFlowInstance) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.1, includeHiddenNodes: false })
      }, 100)
    }
  }, [nodes.length, reactFlowInstance])

  return (
    <div className={`workflow-builder ${className || ''} ${currentTheme}`}>
      {/* Main Canvas with proper drop zone */}
      <div 
        className={`workflow-canvas ${isValidDrop ? 'valid-drop' : ''}`}
        ref={reactFlowWrapper}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{ width: '100%', height: '100%', position: 'relative' }}
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
          deleteKeyCode={['Backspace', 'Delete']}
          selectNodesOnDrag={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
        >
          <Background 
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={currentTheme === 'dark' ? '#374151' : '#E5E7EB'}
          />
          <Controls 
            className="workflow-controls"
            showZoom={true}
            showFitView={true}
            showInteractive={false}
          />
          <MiniMap 
            className="workflow-minimap"
            nodeColor={node => node.data?.color || '#9CA3AF'}
            maskColor={currentTheme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
            pannable
            zoomable
          />
        </ReactFlow>
        
        {/* Drop indicator overlay */}
        {isValidDrop && (
          <div className="drop-indicator">
            <div className="drop-message">Drop here to add node</div>
          </div>
        )}
      </div>

      {/* UI Components */}
      <WorkflowToolbar />
      {isPaletteOpen && <NodePaletteEnhanced />}
      {isConfigPanelOpen && selectedNode && <ConfigPanel nodeId={selectedNode} />}
      
      {/* Debug component - remove in production */}
      <DragDropDebug />
    </div>
  )
}

// Export with provider
export const WorkflowBuilderFixed: React.FC<WorkflowBuilderProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent {...props} />
    </ReactFlowProvider>
  )
}