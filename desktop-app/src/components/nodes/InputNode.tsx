/**
 * InputNode - Input Source Node Component
 * 
 * Entry point for workflow data - text, files, or URLs.
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { InputNodeData } from '@/state/workflowStore'
import { FileText, Type, Link, CheckCircle, AlertCircle } from 'lucide-react'

interface InputNodeProps extends NodeProps {
  data: InputNodeData
}

export const InputNode = memo<InputNodeProps>(({ data, selected }) => {
  const isConfigured = data.isConfigured
  
  const getInputIcon = () => {
    switch (data.inputType) {
      case 'text': return <Type size={20} />
      case 'file': return <FileText size={20} />
      case 'url': return <Link size={20} />
      default: return <Type size={20} />
    }
  }
  
  const getInputTypeLabel = () => {
    switch (data.inputType) {
      case 'text': return 'Text Input'
      case 'file': return 'File Upload'
      case 'url': return 'URL Source'
      default: return 'Input'
    }
  }
  
  return (
    <div className={`workflow-node input-node ${selected ? 'selected' : ''} ${isConfigured ? 'configured' : 'unconfigured'}`}>
      {/* Node Header */}
      <div className="node-header">
        <div className="node-icon input-icon">
          {getInputIcon()}
        </div>
        <div className="node-title">
          <h3>{data.label}</h3>
          <p className="node-subtitle">{getInputTypeLabel()}</p>
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
        {data.placeholder && (
          <div className="placeholder-preview">
            {data.placeholder}
          </div>
        )}
        
        <div className="input-type-badge">
          {data.inputType.toUpperCase()}
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

InputNode.displayName = 'InputNode'