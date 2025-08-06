/**
 * NodePalette - Draggable Node Library
 * 
 * Beautiful palette of draggable nodes for building workflows.
 * Features categorized nodes with smooth animations.
 */

import React from 'react'
import { Brain, Type, Download, GitCompare, FileText, X } from 'lucide-react'
import { useWorkflowStore } from '@/state/workflowStore'

interface NodePaletteProps {
  className?: string
}

interface NodeTypeDefinition {
  type: string
  label: string
  description: string
  icon: React.ReactNode
  category: string
  color: string
}

const nodeTypes: NodeTypeDefinition[] = [
  {
    type: 'input',
    label: 'Input',
    description: 'Text, file, or URL input',
    icon: <Type size={20} />,
    category: 'Sources',
    color: '#3498db'
  },
  {
    type: 'llm',
    label: 'AI Analysis',
    description: 'Multi-model AI analysis',
    icon: <Brain size={20} />,
    category: 'Processing',
    color: '#e74c3c'
  },
  {
    type: 'compare',
    label: 'Compare',
    description: 'Find conflicts & consensus',
    icon: <GitCompare size={20} />,
    category: 'Processing',
    color: '#f39c12'
  },
  {
    type: 'summarize',
    label: 'Summarize',
    description: 'Consolidate results',
    icon: <FileText size={20} />,
    category: 'Processing',
    color: '#9b59b6'
  },
  {
    type: 'output',
    label: 'Output',
    description: 'Export results',
    icon: <Download size={20} />,
    category: 'Outputs',
    color: '#27ae60'
  }
]

const categories = ['Sources', 'Processing', 'Outputs']

export const NodePalette: React.FC<NodePaletteProps> = ({ className }) => {
  const { togglePalette } = useWorkflowStore()

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    console.log('Drag started for node type:', nodeType)
    
    // Set data in multiple formats for compatibility
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.setData('text/plain', nodeType)
    event.dataTransfer.setData('text', nodeType)
    
    // Log what we're setting
    console.log('Setting drag data:', {
      'application/reactflow': nodeType,
      'text/plain': nodeType,
      'text': nodeType
    })
    
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className={`node-palette ${className || ''}`} data-testid="node-palette">
      {/* Header */}
      <div className="palette-header">
        <h3 className="palette-title">Node Library</h3>
        <button 
          className="palette-close"
          onClick={togglePalette}
          aria-label="Close palette"
        >
          <X size={16} />
        </button>
      </div>

      {/* Categories */}
      <div className="palette-content">
        {categories.map((category) => (
          <div key={category} className="palette-category">
            <h4 className="category-title">{category}</h4>
            <div className="category-nodes">
              {nodeTypes
                .filter(node => node.category === category)
                .map((nodeType) => (
                  <div
                    key={nodeType.type}
                    className="palette-node"
                    data-testid={`node-palette-${nodeType.type}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, nodeType.type)}
                    style={{ '--node-color': nodeType.color } as React.CSSProperties}
                  >
                    <div className="palette-node-icon">
                      {nodeType.icon}
                    </div>
                    <div className="palette-node-info">
                      <div className="palette-node-label">
                        {nodeType.label}
                      </div>
                      <div className="palette-node-description">
                        {nodeType.description}
                      </div>
                    </div>
                    <div className="palette-node-drag-hint">
                      ⋮⋮
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer with tips */}
      <div className="palette-footer">
        <div className="palette-tip">
          💡 Drag nodes to the canvas to build your workflow
        </div>
      </div>
    </div>
  )
}