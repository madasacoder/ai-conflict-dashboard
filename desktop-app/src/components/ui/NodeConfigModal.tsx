/**
 * NodeConfigModal - Modal for configuring node properties
 * 
 * Provides forms for configuring different node types
 */

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useWorkflowStore } from '@/state/workflowStore'

interface NodeConfigModalProps {
  nodeId: string
  isOpen: boolean
  onClose: () => void
}

export const NodeConfigModal: React.FC<NodeConfigModalProps> = ({ 
  nodeId, 
  isOpen, 
  onClose 
}) => {
  const { nodes, updateNodeData } = useWorkflowStore()
  const node = nodes.find(n => n.id === nodeId)
  
  const [formData, setFormData] = useState<any>({})
  
  useEffect(() => {
    if (node) {
      setFormData(node.data)
    }
  }, [node])
  
  if (!isOpen || !node) return null
  
  const handleSave = () => {
    updateNodeData(nodeId, formData)
    onClose()
  }
  
  const renderInputConfig = () => (
    <>
      <div className="form-group">
        <label htmlFor="input-type">Input Type</label>
        <select
          id="input-type"
          data-testid="input-type-select"
          value={formData.inputType || 'text'}
          onChange={(e) => setFormData({ ...formData, inputType: e.target.value })}
        >
          <option value="text">Text</option>
          <option value="file">File</option>
          <option value="url">URL</option>
        </select>
      </div>
      
      {formData.inputType === 'text' && (
        <div className="form-group">
          <label htmlFor="input-content">Content</label>
          <textarea
            id="input-content"
            data-testid="input-content"
            value={formData.value || ''}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            rows={4}
          />
        </div>
      )}
      
      {formData.inputType === 'file' && (
        <div className="form-group">
          <label htmlFor="file-path">File Path</label>
          <input
            type="text"
            id="file-path"
            data-testid="input-file-path"
            value={formData.filePath || ''}
            onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
          />
        </div>
      )}
      
      {formData.inputType === 'url' && (
        <div className="form-group">
          <label htmlFor="url">URL</label>
          <input
            type="url"
            id="url"
            data-testid="input-url"
            value={formData.url || ''}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
        </div>
      )}
    </>
  )
  
  const renderLLMConfig = () => (
    <>
      <div className="form-group">
        <label htmlFor="prompt">Prompt</label>
        <textarea
          id="prompt"
          data-testid="prompt-input"
          value={formData.prompt || ''}
          onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
          rows={4}
          placeholder="Enter your prompt here. Use {input} to reference the input."
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="model">Model</label>
        <select
          id="model"
          data-testid="model-select"
          value={formData.models?.[0] || 'gpt-4'}
          onChange={(e) => setFormData({ ...formData, models: [e.target.value] })}
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="claude-3-opus">Claude 3 Opus</option>
          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
          <option value="gemini-pro">Gemini Pro</option>
          <option value="grok-beta">Grok Beta</option>
          <option value="ollama">Ollama (Local)</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="temperature">Temperature</label>
        <input
          type="number"
          id="temperature"
          data-testid="temperature-input"
          value={formData.temperature || 0.7}
          onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
          min="0"
          max="1"
          step="0.1"
        />
      </div>
    </>
  )
  
  const renderCompareConfig = () => (
    <>
      <div className="form-group">
        <label htmlFor="comparison-type">Comparison Type</label>
        <select
          id="comparison-type"
          data-testid="comparison-type-select"
          value={formData.comparisonType || 'conflicts'}
          onChange={(e) => setFormData({ ...formData, comparisonType: e.target.value })}
        >
          <option value="conflicts">Find Conflicts</option>
          <option value="consensus">Find Consensus</option>
          <option value="differences">Show All Differences</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="highlight-level">Highlight Level</label>
        <select
          id="highlight-level"
          data-testid="highlight-level-select"
          value={formData.highlightLevel || 'moderate'}
          onChange={(e) => setFormData({ ...formData, highlightLevel: e.target.value })}
        >
          <option value="minimal">Minimal</option>
          <option value="moderate">Moderate</option>
          <option value="detailed">Detailed</option>
        </select>
      </div>
    </>
  )
  
  const renderConfigByType = () => {
    switch (node.type) {
      case 'input':
        return renderInputConfig()
      case 'llm':
        return renderLLMConfig()
      case 'compare':
        return renderCompareConfig()
      default:
        return <p>Configuration for {node.type} nodes coming soon...</p>
    }
  }
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        data-testid="node-config-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Configure {node.data.label}</h3>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          {renderConfigByType()}
        </div>
        
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            data-testid="save-config"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}