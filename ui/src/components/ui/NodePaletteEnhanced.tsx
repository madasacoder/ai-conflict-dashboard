/**
 * NodePaletteEnhanced - Hybrid Drag & Click Node Library
 * 
 * Supports both drag-and-drop and click-to-add functionality
 * for maximum compatibility and user preference.
 */

import React, { useState } from 'react'
import { Brain, Type, Download, GitCompare, FileText, X, Plus, Move } from 'lucide-react'
import { useWorkflowStore } from '@/state/workflowStore'

interface NodePaletteEnhancedProps {
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

export const NodePaletteEnhanced: React.FC<NodePaletteEnhancedProps> = ({ className }) => {
  const { togglePalette, addNode } = useWorkflowStore()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [mode, setMode] = useState<'drag' | 'click'>('drag')

  // Drag handlers
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    console.log('Drag started for node type:', nodeType)
    
    // Set data in multiple formats for maximum compatibility
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.setData('text/plain', nodeType)
    event.dataTransfer.setData('text', nodeType)
    
    // Visual feedback
    event.dataTransfer.effectAllowed = 'copy'
    
    // Set drag image (optional)
    const dragImage = event.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.opacity = '0.8'
    dragImage.style.transform = 'rotate(2deg)'
    document.body.appendChild(dragImage)
    event.dataTransfer.setDragImage(dragImage, 50, 50)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  // Click handler for click-to-add mode
  const handleNodeClick = (nodeType: string) => {
    if (mode !== 'click') return
    
    setSelectedType(nodeType)
    setIsAdding(true)
    
    // Calculate position for new node
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const paletteWidth = 320 // Approximate palette width
    
    // Position in center of visible canvas area
    const centerX = (viewportWidth - paletteWidth) / 2
    const centerY = viewportHeight / 2
    
    // Add some randomness to avoid stacking
    const offsetX = (Math.random() - 0.5) * 200
    const offsetY = (Math.random() - 0.5) * 200
    
    addNode(nodeType as any, {
      x: centerX + offsetX,
      y: centerY + offsetY
    })
    
    // Visual feedback
    setTimeout(() => {
      setIsAdding(false)
      setSelectedType(null)
    }, 300)
  }

  return (
    <div 
      className={`node-palette enhanced ${className || ''}`}
      data-testid="node-palette"
    >
      {/* Header */}
      <div className="palette-header">
        <h3 className="palette-title">Node Library</h3>
        <div className="palette-mode-toggle">
          <button
            className={`mode-btn ${mode === 'drag' ? 'active' : ''}`}
            onClick={() => setMode('drag')}
            title="Drag and drop mode"
          >
            <Move size={14} />
          </button>
          <button
            className={`mode-btn ${mode === 'click' ? 'active' : ''}`}
            onClick={() => setMode('click')}
            title="Click to add mode"
          >
            <Plus size={14} />
          </button>
        </div>
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
                    className={`palette-node ${mode} ${
                      selectedType === nodeType.type && isAdding ? 'adding' : ''
                    }`}
                    draggable={mode === 'drag'}
                    onDragStart={(e) => mode === 'drag' && onDragStart(e, nodeType.type)}
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
                    <div className="palette-node-action">
                      {mode === 'drag' ? (
                        <div className="palette-node-drag-hint">⋮⋮</div>
                      ) : (
                        <Plus size={16} className="palette-node-add-icon" />
                      )}
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
          {mode === 'drag' 
            ? '💡 Drag nodes to the canvas to build your workflow'
            : '💡 Click any node to add it to your workflow'
          }
        </div>
        {isAdding && (
          <div className="palette-feedback">
            ✨ Adding {selectedType} node...
          </div>
        )}
      </div>

      {/* Mode indicator */}
      <div className="palette-mode-info">
        {mode === 'drag' ? (
          <span>🔄 Drag & Drop Mode</span>
        ) : (
          <span>👆 Click to Add Mode</span>
        )}
      </div>
    </div>
  )
}