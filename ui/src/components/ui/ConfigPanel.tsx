/**
 * ConfigPanel - Node Configuration Panel
 * 
 * Beautiful side panel for configuring selected nodes.
 */

import React from 'react'
import { X } from 'lucide-react'
import { useWorkflowStore } from '@/state/workflowStore'

interface ConfigPanelProps {
  className?: string
  nodeId: string
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ className, nodeId }) => {
  const { nodes, selectNode } = useWorkflowStore()
  
  const node = nodes.find(n => n.id === nodeId)
  
  if (!node) return null

  return (
    <div className={`config-panel ${className || ''}`} data-testid="node-config-panel">
      <div className="config-header">
        <h3>Configure Node</h3>
        <button
          className="config-close"
          onClick={() => selectNode(null)}
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="config-content">
        <div className="config-section">
          <h4>{node.data.label}</h4>
          <p>Node type: {node.type}</p>
          <p>Configuration panel coming soon...</p>
        </div>
      </div>
    </div>
  )
}