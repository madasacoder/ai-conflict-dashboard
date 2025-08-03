/**
 * InputNode - Input Source Node Component
 * 
 * Entry point for workflow data - text, files, or URLs.
 */

import React, { memo, useState, useCallback } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { InputNodeData, useWorkflowStore } from '@/state/workflowStore'
import { FileText, Type, Link, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import FileUpload from '@/components/ui/FileUpload'
import { UploadedFile } from '@/utils/fileUpload'
import NodeStatusIndicator from '@/components/ui/NodeStatusIndicator'
import '@/components/ui/FileUpload.css'

interface InputNodeProps extends NodeProps {
  data: InputNodeData & {
    content?: string
    files?: UploadedFile[]
    url?: string
  }
}

export const InputNode = memo<InputNodeProps>(({ data, selected, id }) => {
  const updateNodeData = useWorkflowStore(state => state.updateNodeData)
  const getNodeExecutionStatus = useWorkflowStore(state => state.getNodeExecutionStatus)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const isConfigured = data.isConfigured || Boolean(data.content || data.files?.length || data.url)
  
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
  
  const getContentPreview = () => {
    if (data.inputType === 'file' && data.files?.length) {
      return `${data.files.length} file(s) uploaded`
    }
    if (data.inputType === 'url' && data.url) {
      return data.url.length > 30 ? data.url.substring(0, 30) + '...' : data.url
    }
    if (data.inputType === 'text' && data.content) {
      return data.content.length > 50 ? data.content.substring(0, 50) + '...' : data.content
    }
    return data.placeholder
  }
  
  // Handle file upload
  const handleFilesUploaded = useCallback((files: UploadedFile[], combinedContent: string) => {
    updateNodeData(id, {
      files,
      content: combinedContent,
      isConfigured: true
    })
  }, [id, updateNodeData])
  
  // Handle text input change
  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = event.target.value
    updateNodeData(id, {
      content,
      isConfigured: Boolean(content.trim())
    })
  }, [id, updateNodeData])
  
  // Handle URL input change
  const handleUrlChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value
    updateNodeData(id, {
      url,
      isConfigured: Boolean(url.trim())
    })
  }, [id, updateNodeData])
  
  const executionStatus = getNodeExecutionStatus(id)
  
  return (
    <div 
      className={`workflow-node input-node ${selected ? 'selected' : ''} ${isConfigured ? 'configured' : 'unconfigured'} ${isExpanded ? 'expanded' : ''}`}
      data-testid={`rf__node-${id}`}
    >
      {/* Execution Status Indicator */}
      <NodeStatusIndicator status={executionStatus} size="small" />
      
      {/* Node Header */}
      <div className="node-header" onClick={() => setIsExpanded(!isExpanded)}>
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
      
      {/* Node Content Preview */}
      <div className="node-content">
        <div className="content-preview">
          {getContentPreview()}
        </div>
        
        <div className="input-type-badge">
          {data.inputType.toUpperCase()}
        </div>
        
        {!isExpanded && (
          <div className="expand-hint">
            Click to configure
          </div>
        )}
      </div>
      
      {/* Expanded Configuration */}
      {isExpanded && (
        <div className="node-config" onClick={(e) => e.stopPropagation()}>
          {data.inputType === 'text' && (
            <div className="text-input-config">
              <label htmlFor={`text-${id}`}>Text Content:</label>
              <textarea
                id={`text-${id}`}
                value={data.content || ''}
                onChange={handleTextChange}
                placeholder={data.placeholder}
                rows={4}
                className="text-input"
              />
            </div>
          )}
          
          {data.inputType === 'file' && (
            <div className="file-input-config">
              <FileUpload
                onFilesUploaded={handleFilesUploaded}
                onError={(errors) => {
                  console.error('File upload errors:', errors)
                  // TODO: Add toast notification for errors
                }}
                className="compact"
              />
            </div>
          )}
          
          {data.inputType === 'url' && (
            <div className="url-input-config">
              <label htmlFor={`url-${id}`}>URL:</label>
              <input
                id={`url-${id}`}
                type="url"
                value={data.url || ''}
                onChange={handleUrlChange}
                placeholder="https://example.com/data.json"
                className="url-input"
              />
            </div>
          )}
        </div>
      )}
      
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