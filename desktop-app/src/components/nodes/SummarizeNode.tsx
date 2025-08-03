/**
 * SummarizeNode - Summarization Node Component
 * 
 * Summarizes and consolidates multiple analysis results.
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { SummarizeNodeData } from '@/state/workflowStore'
import { FileText, CheckCircle, AlertCircle } from 'lucide-react'

interface SummarizeNodeProps extends NodeProps {
  data: SummarizeNodeData
}

export const SummarizeNode = memo<SummarizeNodeProps>(({ data, selected }) => {
  const isConfigured = data.isConfigured
  
  const getLengthIcon = () => {
    switch (data.length) {
      case 'short': return '📝'
      case 'medium': return '📄'
      case 'long': return '📚'
      default: return '📄'
    }
  }
  
  const getStyleIcon = () => {
    switch (data.style) {
      case 'bullets': return '•'
      case 'paragraph': return '¶'
      case 'technical': return '⚙️'
      default: return '¶'
    }
  }
  
  return (
    <div className={`workflow-node summarize-node ${selected ? 'selected' : ''} ${isConfigured ? 'configured' : 'unconfigured'}`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="workflow-handle input-handle"
        isConnectable={true}
      />
      
      {/* Node Header */}
      <div className="node-header">
        <div className="node-icon summarize-icon">
          <FileText size={20} />
        </div>
        <div className="node-title">
          <h3>{data.label}</h3>
          <p className="node-subtitle">Content Summary</p>
        </div>
        <div className="node-status">
          {isConfigured ? (
            <CheckCircle size={16} className="status-icon success" />
          ) : (
            <AlertCircle size={16} className="status-icon warning" />
          )}
        </div>
      </div>
      
      {/* Node Content */}
      <div className="node-content">
        <div className="summary-config">
          <div className="config-row">
            <span className="config-icon">{getLengthIcon()}</span>
            <span className="config-label">{data.length} length</span>
          </div>
          
          <div className="config-row">
            <span className="config-icon">{getStyleIcon()}</span>
            <span className="config-label">{data.style} style</span>
          </div>
        </div>
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="workflow-handle output-handle"
        isConnectable={true}
      />
    </div>
  )
})

SummarizeNode.displayName = 'SummarizeNode'