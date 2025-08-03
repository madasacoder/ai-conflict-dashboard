/**
 * OutputNode - Output Destination Node Component
 * 
 * Final destination for workflow results with format options.
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { OutputNodeData, useWorkflowStore } from '@/state/workflowStore'
import { Download, FileText, Code, CheckCircle, AlertCircle } from 'lucide-react'
import NodeStatusIndicator from '@/components/ui/NodeStatusIndicator'

interface OutputNodeProps extends NodeProps {
  data: OutputNodeData
}

export const OutputNode = memo<OutputNodeProps>(({ data, selected, id }) => {
  const getNodeExecutionStatus = useWorkflowStore(state => state.getNodeExecutionStatus)
  const isConfigured = data.isConfigured
  const executionStatus = getNodeExecutionStatus(id)
  
  const getFormatIcon = () => {
    switch (data.format) {
      case 'json': return <Code size={16} />
      case 'markdown': return <FileText size={16} />
      case 'text': return <FileText size={16} />
      default: return <FileText size={16} />
    }
  }
  
  return (
    <div className={`workflow-node output-node ${selected ? 'selected' : ''} ${isConfigured ? 'configured' : 'unconfigured'}`}>
      {/* Execution Status Indicator */}
      <NodeStatusIndicator status={executionStatus} size="small" />
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="workflow-handle input-handle"
        isConnectable={true}
      />
      
      {/* Node Header */}
      <div className="node-header">
        <div className="node-icon output-icon">
          <Download size={20} />
        </div>
        <div className="node-title">
          <h3>{data.label}</h3>
          <p className="node-subtitle">Results Output</p>
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
        <div className="format-info">
          <div className="format-badge">
            {getFormatIcon()}
            <span>{data.format.toUpperCase()}</span>
          </div>
          
          {data.includeMetadata && (
            <div className="metadata-badge">
              📊 With Metadata
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

OutputNode.displayName = 'OutputNode'