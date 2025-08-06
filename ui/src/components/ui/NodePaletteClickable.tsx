/**
 * NodePaletteClickable - Alternative palette with click-to-add
 * 
 * Since drag-and-drop has issues, this provides a click-based alternative
 */

import React, { useState } from 'react'
import { Brain, Type, Download, GitCompare, FileText, X, Plus } from 'lucide-react'
import { useWorkflowStore } from '@/state/workflowStore'

interface NodePaletteClickableProps {
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

export const NodePaletteClickable: React.FC<NodePaletteClickableProps> = ({ className }) => {
  const { togglePalette, addNode } = useWorkflowStore()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const handleNodeClick = (nodeType: string) => {
    setSelectedType(nodeType)
    setIsAdding(true)
    
    // Add node at center of viewport or at calculated position
    const centerX = window.innerWidth / 2 - 200 // Offset for palette
    const centerY = window.innerHeight / 2
    
    // Random offset to avoid stacking
    const offsetX = (Math.random() - 0.5) * 200
    const offsetY = (Math.random() - 0.5) * 200
    
    addNode(nodeType as any, {
      x: centerX + offsetX,
      y: centerY + offsetY
    })
    
    // Reset after animation
    setTimeout(() => {
      setIsAdding(false)
      setSelectedType(null)
    }, 300)
  }

  return (
    <div className={`node-palette ${className || ''}`}>
      {/* Header */}
      <div className="palette-header">
        <h3 className="palette-title">Node Library</h3>
        <div className="palette-subtitle">Click to add nodes</div>
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
                  <button
                    key={nodeType.type}
                    className={`palette-node-button ${
                      selectedType === nodeType.type && isAdding ? 'adding' : ''
                    }`}
                    onClick={() => handleNodeClick(nodeType.type)}
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
                    <div className="palette-node-add">
                      <Plus size={16} />
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer with tips */}
      <div className="palette-footer">
        <div className="palette-tip">
          💡 Click any node to add it to your workflow
        </div>
        {isAdding && (
          <div className="palette-feedback">
            ✨ Adding {selectedType} node...
          </div>
        )}
      </div>
    </div>
  )
}