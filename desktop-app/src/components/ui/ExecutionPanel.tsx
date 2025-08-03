/**
 * ExecutionPanel - Display workflow execution results and progress
 * 
 * Shows real-time execution progress, node statuses, results, and errors
 * with beautiful visualizations and export capabilities.
 */

import React, { useState, useEffect } from 'react'
import { X, Play, Square, Download, Copy, RefreshCw } from 'lucide-react'
import { useWorkflowStore } from '@/state/workflowStore'
import { workflowExecutor, ExecutionProgress } from '@/services/workflowExecutor'
import { WorkflowExecution, ExecutionResult } from '@/types/workflow'
import './ExecutionPanel.css'

interface ExecutionPanelProps {
  isOpen: boolean
  onClose: () => void
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ isOpen, onClose }) => {
  const { nodes, edges, execution, setExecution, setExecutionProgress } = useWorkflowStore()
  const [isExecuting, setIsExecuting] = useState(false)
  const [progress, setProgress] = useState<ExecutionProgress | null>(null)
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, 'pending' | 'running' | 'completed' | 'error'>>({})
  const [selectedResult, setSelectedResult] = useState<ExecutionResult | null>(null)
  const [errorDetails, setErrorDetails] = useState<string>('')

  // Initialize node statuses
  useEffect(() => {
    const statuses: Record<string, 'pending' | 'running' | 'completed' | 'error'> = {}
    nodes.forEach(node => {
      statuses[node.id] = 'pending'
    })
    setNodeStatuses(statuses)
  }, [nodes])

  // Handle workflow execution
  const handleExecute = async () => {
    if (isExecuting) return

    setIsExecuting(true)
    setProgress(null)
    setSelectedResult(null)
    setErrorDetails('')

    // Reset node statuses
    const resetStatuses: Record<string, 'pending' | 'running' | 'completed' | 'error'> = {}
    nodes.forEach(node => {
      resetStatuses[node.id] = 'pending'
    })
    setNodeStatuses(resetStatuses)

    try {
      const result = await workflowExecutor.executeWorkflow(nodes, edges, {
        apiKeys: {}, // TODO: Get API keys from settings
        onProgress: (progressData) => {
          setProgress(progressData)
          setExecutionProgress(progressData)
        },
        onNodeStart: (nodeId) => {
          setNodeStatuses(prev => ({
            ...prev,
            [nodeId]: 'running'
          }))
        },
        onNodeComplete: (nodeId, result) => {
          setNodeStatuses(prev => ({
            ...prev,
            [nodeId]: result.success ? 'completed' : 'error'
          }))
        },
        onNodeError: (nodeId, error) => {
          setNodeStatuses(prev => ({
            ...prev,
            [nodeId]: 'error'
          }))
          setErrorDetails(prev => prev + `Node ${nodeId}: ${error}\n`)
        }
      })

      setExecution(result)
    } catch (error) {
      setErrorDetails(`Execution failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsExecuting(false)
      setProgress(null)
      setExecutionProgress(null)
    }
  }

  // Handle execution cancellation
  const handleCancel = () => {
    workflowExecutor.cancelExecution()
    setIsExecuting(false)
    setProgress(null)
  }

  // Copy result to clipboard
  const handleCopyResult = (result: ExecutionResult) => {
    const text = JSON.stringify(result, null, 2)
    navigator.clipboard.writeText(text)
  }

  // Export all results
  const handleExportResults = () => {
    if (!execution) return

    const data = {
      workflow: execution.workflowId,
      startTime: execution.startTime,
      endTime: execution.endTime,
      status: execution.status,
      duration: execution.totalDuration,
      results: execution.results
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-results-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Format duration
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#27ae60'
      case 'running': return '#3498db'
      case 'error': case 'failed': return '#e74c3c'
      case 'cancelled': return '#f39c12'
      default: return '#95a5a6'
    }
  }

  // Render result content
  const renderResultContent = (result: ExecutionResult) => {
    if (!result.success) {
      return (
        <div className="result-error">
          <p className="error-message">{result.error}</p>
        </div>
      )
    }

    if (!result.data) {
      return <div className="result-empty">No data</div>
    }

    // Handle different data types
    if (typeof result.data === 'string') {
      return <pre className="result-text">{result.data}</pre>
    }

    if (typeof result.data === 'object') {
      return <pre className="result-json">{JSON.stringify(result.data, null, 2)}</pre>
    }

    return <div className="result-raw">{String(result.data)}</div>
  }

  if (!isOpen) return null

  return (
    <div className="execution-panel-overlay">
      <div className="execution-panel">
        {/* Header */}
        <div className="execution-header">
          <div className="header-title">
            <Play size={20} />
            <h3>Workflow Execution</h3>
          </div>
          <div className="header-actions">
            {isExecuting ? (
              <button 
                className="btn-cancel"
                onClick={handleCancel}
                aria-label="Cancel execution"
              >
                <Square size={16} />
                Cancel
              </button>
            ) : (
              <button 
                className="btn-execute"
                onClick={handleExecute}
                disabled={nodes.length === 0}
                aria-label="Execute workflow"
              >
                <Play size={16} />
                Execute
              </button>
            )}
            {execution && (
              <button 
                className="btn-export"
                onClick={handleExportResults}
                aria-label="Export results"
              >
                <Download size={16} />
                Export
              </button>
            )}
            <button 
              className="btn-close"
              onClick={onClose}
              aria-label="Close execution panel"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="execution-progress">
            <div className="progress-header">
              <span className="progress-text">
                {progress.current ? `Executing: ${progress.current}` : 'Preparing...'}
              </span>
              <span className="progress-stats">
                {progress.completed} / {progress.total} ({progress.percentage}%)
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            {progress.estimatedTimeRemaining && (
              <div className="progress-eta">
                Est. {progress.estimatedTimeRemaining}s remaining
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="execution-content">
          {/* Node Status Overview */}
          <div className="nodes-overview">
            <h4>Node Status</h4>
            <div className="nodes-grid">
              {nodes.map(node => (
                <div 
                  key={node.id}
                  className={`node-status-card ${nodeStatuses[node.id]}`}
                >
                  <div className="node-icon">
                    {node.data.icon || '⚙️'}
                  </div>
                  <div className="node-info">
                    <div className="node-label">
                      {node.data.label || node.type}
                    </div>
                    <div 
                      className="node-status"
                      style={{ color: getStatusColor(nodeStatuses[node.id]) }}
                    >
                      {nodeStatuses[node.id]}
                      {nodeStatuses[node.id] === 'running' && (
                        <RefreshCw size={12} className="spinning" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Execution Results */}
          {execution && (
            <div className="execution-results">
              <div className="results-header">
                <h4>Execution Results</h4>
                <div className="execution-summary">
                  <span 
                    className="execution-status"
                    style={{ color: getStatusColor(execution.status) }}
                  >
                    {execution.status}
                  </span>
                  <span className="execution-duration">
                    {execution.totalDuration ? formatDuration(execution.totalDuration) : ''}
                  </span>
                  <span className="execution-time">
                    {execution.startTime.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="results-content">
                <div className="results-list">
                  {execution.results.map((result, index) => {
                    const node = nodes.find(n => n.id === result.nodeId)
                    return (
                      <div
                        key={result.nodeId}
                        className={`result-item ${result.success ? 'success' : 'error'} ${
                          selectedResult?.nodeId === result.nodeId ? 'selected' : ''
                        }`}
                        onClick={() => setSelectedResult(result)}
                      >
                        <div className="result-header">
                          <div className="result-node">
                            <span className="result-icon">
                              {node?.data.icon || '⚙️'}
                            </span>
                            <span className="result-label">
                              {node?.data.label || result.nodeId}
                            </span>
                          </div>
                          <div className="result-meta">
                            <span 
                              className="result-status"
                              style={{ color: getStatusColor(result.success ? 'completed' : 'error') }}
                            >
                              {result.success ? 'Success' : 'Error'}
                            </span>
                            <span className="result-duration">
                              {formatDuration(result.duration)}
                            </span>
                            <button
                              className="btn-copy-result"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyResult(result)
                              }}
                              aria-label="Copy result"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>
                        {selectedResult?.nodeId === result.nodeId && (
                          <div className="result-preview">
                            {renderResultContent(result)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Error Details */}
          {errorDetails && (
            <div className="error-details">
              <h4>Error Details</h4>
              <pre className="error-log">{errorDetails}</pre>
            </div>
          )}

          {/* Empty State */}
          {!execution && !isExecuting && (
            <div className="empty-state">
              <Play size={48} className="empty-icon" />
              <h4>Ready to Execute</h4>
              <p>Click the Execute button to run your workflow and see the results here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExecutionPanel