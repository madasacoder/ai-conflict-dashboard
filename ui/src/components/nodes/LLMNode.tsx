/**
 * LLMNode - AI Model Node Component
 * 
 * Beautiful node for configuring AI model analysis steps.
 * Features provider logos, model selection, and prompt configuration.
 */

import React, { memo, useState, useCallback } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { LLMNodeData, useWorkflowStore } from '@/state/workflowStore'
import { Brain, Settings, AlertCircle, CheckCircle } from 'lucide-react'
import NodeStatusIndicator from '@/components/ui/NodeStatusIndicator'

interface LLMNodeProps extends NodeProps {
  data: LLMNodeData
}

export const LLMNode = memo<LLMNodeProps>(({ data, selected, id }) => {
  const updateNodeData = useWorkflowStore(state => state.updateNodeData)
  const getNodeExecutionStatus = useWorkflowStore(state => state.getNodeExecutionStatus)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const isConfigured = data.isConfigured && data.models?.length > 0 && data.prompt?.trim() !== ''
  const executionStatus = getNodeExecutionStatus(id)
  
  // Handle model selection
  const handleModelChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const model = event.target.value
    updateNodeData(id, {
      models: model ? [model] : [],
      isConfigured: Boolean(model && data.prompt?.trim())
    })
  }, [id, updateNodeData, data.prompt])
  
  // Handle prompt change
  const handlePromptChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const prompt = event.target.value
    updateNodeData(id, {
      prompt,
      isConfigured: Boolean(prompt.trim() && data.models?.length > 0)
    })
  }, [id, updateNodeData, data.models])
  
  return (
    <div 
      className={`workflow-node llm-node ${selected ? 'selected' : ''} ${isConfigured ? 'configured' : 'unconfigured'} ${isExpanded ? 'expanded' : ''}`}
      data-testid={`rf__node-${id}`}
    >
      {/* Execution Status Indicator */}
      <NodeStatusIndicator status={executionStatus} size="small" />
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="workflow-handle input-handle target"
        isConnectable={true}
        id="input"
      />
      
      {/* Node Header */}
      <div className="node-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="node-icon">
          <Brain size={20} />
        </div>
        <div className="node-title">
          <h3>{data.label}</h3>
          <p className="node-subtitle">AI Analysis</p>
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
        {/* Model Pills */}
        <div className="model-pills">
          {data.models?.slice(0, 3).map((model, index) => (
            <div key={index} className="model-pill">
              <div className="model-logo">
                {getModelLogo(model)}
              </div>
              <span className="model-name">{getModelDisplayName(model)}</span>
            </div>
          ))}
          {data.models?.length > 3 && (
            <div className="model-pill more">
              +{data.models.length - 3}
            </div>
          )}
        </div>
        
        {/* Configuration Preview */}
        <div className="config-preview">
          <div className="config-item">
            <span className="config-label">Temperature:</span>
            <span className="config-value">{data.temperature}</span>
          </div>
          <div className="config-item">
            <span className="config-label">Max Tokens:</span>
            <span className="config-value">{data.maxTokens}</span>
          </div>
        </div>
        
        {/* Prompt Preview */}
        {data.prompt && (
          <div className="prompt-preview">
            <div className="prompt-label">Prompt:</div>
            <div className="prompt-text">
              {data.prompt?.length > 50 
                ? `${data.prompt.substring(0, 50)}...`
                : data.prompt
              }
            </div>
          </div>
        )}
        
        {!isExpanded && (
          <div className="expand-hint">
            Click to configure
          </div>
        )}
      </div>
      
      {/* Expanded Configuration */}
      {isExpanded && (
        <div className="node-config" onClick={(e) => e.stopPropagation()}>
          <div className="model-config">
            <label htmlFor={`model-${id}`}>Model:</label>
            <select
              id={`model-${id}`}
              name="model"
              value={data.models?.[0] || ''}
              onChange={handleModelChange}
              className="model-select"
            >
              <option value="">Select a model...</option>
              <optgroup label="OpenAI">
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </optgroup>
              <optgroup label="Claude">
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
              </optgroup>
              <optgroup label="Gemini">
                <option value="gemini-pro">Gemini Pro</option>
                <option value="gemini-flash">Gemini Flash</option>
              </optgroup>
              <optgroup label="Ollama">
                <option value="llama2">Llama 2</option>
                <option value="mistral">Mistral</option>
                <option value="codellama">Code Llama</option>
              </optgroup>
            </select>
          </div>
          
          <div className="prompt-config">
            <label htmlFor={`prompt-${id}`}>Prompt:</label>
            <textarea
              id={`prompt-${id}`}
              name="prompt"
              value={data.prompt || ''}
              onChange={handlePromptChange}
              placeholder="Enter your prompt here..."
              rows={4}
              className="prompt-input"
            />
          </div>
          
          <div className="advanced-config">
            <div className="config-row">
              <label htmlFor={`temperature-${id}`}>Temperature:</label>
              <input
                id={`temperature-${id}`}
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={data.temperature || 0.5}
                onChange={(e) => updateNodeData(id, { temperature: parseFloat(e.target.value) })}
                className="temperature-slider"
              />
              <span>{data.temperature || 0.5}</span>
            </div>
            
            <div className="config-row">
              <label htmlFor={`maxTokens-${id}`}>Max Tokens:</label>
              <input
                id={`maxTokens-${id}`}
                type="number"
                min="100"
                max="4000"
                step="100"
                value={data.maxTokens || 2000}
                onChange={(e) => updateNodeData(id, { maxTokens: parseInt(e.target.value, 10) })}
                className="max-tokens-input"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Settings Button */}
      <button className="node-settings-btn" onClick={() => setIsExpanded(!isExpanded)}>
        <Settings size={14} />
      </button>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="workflow-handle output-handle source"
        isConnectable={true}
        id="output"
      />
    </div>
  )
})

LLMNode.displayName = 'LLMNode'

// Helper functions
function getModelLogo(model: string): JSX.Element {
  const modelLower = model.toLowerCase()
  
  if (modelLower.includes('gpt') || modelLower.includes('openai')) {
    return <div className="logo openai">🤖</div>
  } else if (modelLower.includes('claude')) {
    return <div className="logo claude">🧠</div>
  } else if (modelLower.includes('gemini')) {
    return <div className="logo gemini">💎</div>
  } else if (modelLower.includes('grok')) {
    return <div className="logo grok">🚀</div>
  } else if (modelLower.includes('llama') || modelLower.includes('ollama')) {
    return <div className="logo ollama">🦙</div>
  } else {
    return <div className="logo default">🤖</div>
  }
}

function getModelDisplayName(model: string): string {
  const modelLower = model.toLowerCase()
  
  if (modelLower.includes('gpt-4')) return 'GPT-4'
  if (modelLower.includes('gpt-3.5')) return 'GPT-3.5'
  if (modelLower.includes('claude-3-opus')) return 'Claude Opus'
  if (modelLower.includes('claude-3-sonnet')) return 'Claude Sonnet'
  if (modelLower.includes('claude-3-haiku')) return 'Claude Haiku'
  if (modelLower.includes('gemini-pro')) return 'Gemini Pro'
  if (modelLower.includes('gemini-flash')) return 'Gemini Flash'
  if (modelLower.includes('grok')) return 'Grok'
  if (modelLower.includes('llama')) return 'Llama'
  
  return model
}