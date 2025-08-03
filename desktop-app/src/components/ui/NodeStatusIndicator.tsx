/**
 * NodeStatusIndicator - Visual status indicator for workflow execution
 * 
 * Shows the current execution status of a node with appropriate colors and icons.
 */

import React from 'react'
import { CheckCircle, AlertCircle, Clock, PlayCircle } from 'lucide-react'
import './NodeStatusIndicator.css'

export type NodeExecutionStatus = 'pending' | 'running' | 'completed' | 'error'

interface NodeStatusIndicatorProps {
  status: NodeExecutionStatus
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  className?: string
}

export const NodeStatusIndicator: React.FC<NodeStatusIndicatorProps> = ({
  status,
  size = 'medium',
  showLabel = false,
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock size={size === 'small' ? 12 : size === 'medium' ? 16 : 20} />
      case 'running':
        return <PlayCircle size={size === 'small' ? 12 : size === 'medium' ? 16 : 20} />
      case 'completed':
        return <CheckCircle size={size === 'small' ? 12 : size === 'medium' ? 16 : 20} />
      case 'error':
        return <AlertCircle size={size === 'small' ? 12 : size === 'medium' ? 16 : 20} />
      default:
        return <Clock size={size === 'small' ? 12 : size === 'medium' ? 16 : 20} />
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'running':
        return 'Running'
      case 'completed':
        return 'Completed'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return '#95a5a6'
      case 'running':
        return '#3498db'
      case 'completed':
        return '#27ae60'
      case 'error':
        return '#e74c3c'
      default:
        return '#95a5a6'
    }
  }

  return (
    <div 
      className={`node-status-indicator ${status} ${size} ${className}`}
      title={getStatusLabel()}
      style={{ color: getStatusColor() }}
    >
      <div className={`status-icon ${status === 'running' ? 'spinning' : ''}`}>
        {getStatusIcon()}
      </div>
      {showLabel && (
        <span className="status-label">
          {getStatusLabel()}
        </span>
      )}
    </div>
  )
}

export default NodeStatusIndicator