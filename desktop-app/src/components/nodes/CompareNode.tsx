/**
 * CompareNode - Comparison Analysis Node Component
 * 
 * Compares outputs from multiple AI models to find conflicts and consensus.
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { CompareNodeData, useWorkflowStore } from '@/state/workflowStore'
import { GitCompare, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import NodeStatusIndicator from '@/components/ui/NodeStatusIndicator'

interface CompareNodeProps extends NodeProps {
  data: CompareNodeData
}

export const CompareNode = memo<CompareNodeProps>(({ data, selected, id }) => {
  const getNodeExecutionStatus = useWorkflowStore(state => state.getNodeExecutionStatus)
  const isConfigured = data.isConfigured
  const executionStatus = getNodeExecutionStatus(id)
  
  const getComparisonIcon = () => {
    switch (data.comparisonType) {
      case 'conflicts': return '⚡'
      case 'consensus': return '🤝'
      case 'differences': return '🔍'
      default: return '⚖️'
    }
  }
  
  return (
    <div 
      className={`workflow-node compare-node ${selected ? 'selected' : ''} ${isConfigured ? 'configured' : 'unconfigured'}`}
      data-testid={`rf__node-${id}`}
    >
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
        <div className="node-icon compare-icon">
          <GitCompare size={20} />
        </div>
        <div className="node-title">
          <h3>{data.label}</h3>
          <p className="node-subtitle">Analysis Comparison</p>
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
        <div className="comparison-config">
          <div className="comparison-type">
            <span className="type-icon">{getComparisonIcon()}</span>
            <span className="type-label">{data.comparisonType.charAt(0).toUpperCase() + data.comparisonType.slice(1)}</span>
          </div>
          
          <div className="highlight-level">
            <Zap size={14} />
            <span>{data.highlightLevel} detail</span>
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

CompareNode.displayName = 'CompareNode'