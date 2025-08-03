/**
 * NodeConfigPanel - Side panel for configuring node properties
 * 
 * Provides a comprehensive interface for editing node configurations
 * with support for different node types and real-time updates.
 */

import React from 'react'
import { X } from 'lucide-react'
import { useWorkflowStore } from '@/state/workflowStore'
import { InputNodeConfig } from './NodeConfigs/InputNodeConfig'
import { LLMNodeConfig } from './NodeConfigs/LLMNodeConfig'
import { CompareNodeConfig } from './NodeConfigs/CompareNodeConfig'
import { OutputNodeConfig } from './NodeConfigs/OutputNodeConfig'
import './NodeConfigPanel.css'

export const NodeConfigPanel: React.FC = () => {
  const { selectedNode, setSelectedNode, updateNodeData } = useWorkflowStore()

  if (!selectedNode) {
    return null
  }

  const handleClose = () => {
    setSelectedNode(null)
  }

  const handleUpdateNode = (key: string, value: any) => {
    if (selectedNode) {
      updateNodeData(selectedNode.id, key, value)
    }
  }

  const renderConfigForm = () => {
    switch (selectedNode.type) {
      case 'input':
        return (
          <InputNodeConfig
            node={selectedNode}
            onUpdate={handleUpdateNode}
          />
        )
      case 'llm':
        return (
          <LLMNodeConfig
            node={selectedNode}
            onUpdate={handleUpdateNode}
          />
        )
      case 'compare':
        return (
          <CompareNodeConfig
            node={selectedNode}
            onUpdate={handleUpdateNode}
          />
        )
      case 'output':
        return (
          <OutputNodeConfig
            node={selectedNode}
            onUpdate={handleUpdateNode}
          />
        )
      default:
        return (
          <div className="config-form">
            <p className="text-muted">
              Configuration not available for this node type.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="node-config-overlay" onClick={handleClose}>
      <div className="node-config-panel" onClick={(e) => e.stopPropagation()}>
        <div className="config-header">
          <div className="config-title">
            <div 
              className="node-icon" 
              style={{ backgroundColor: selectedNode.data?.color || '#3498db' }}
            >
              {selectedNode.data?.icon || '⚙️'}
            </div>
            <div>
              <h5>Node Configuration</h5>
              <p className="node-type">{selectedNode.type} Node</p>
            </div>
          </div>
          <button 
            className="close-btn"
            onClick={handleClose}
            aria-label="Close configuration panel"
          >
            <X size={20} />
          </button>
        </div>

        <div className="config-content">
          {renderConfigForm()}
        </div>
      </div>
    </div>
  )
}

export default NodeConfigPanel