/**
 * LLMNode - AI Model Node Component
 * 
 * Beautiful node for configuring AI model analysis steps.
 * Features provider logos, model selection, and prompt configuration.
 */

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { LLMNodeData } from '@/state/workflowStore'
import { Brain, Settings, AlertCircle, CheckCircle } from 'lucide-react'

interface LLMNodeProps extends NodeProps {
  data: LLMNodeData
}

export const LLMNode = memo<LLMNodeProps>(({ data, selected }) => {
  const isConfigured = data.isConfigured && data.models.length > 0 && data.prompt.trim() !== ''
  
  return (
    <div className={`workflow-node llm-node ${selected ? 'selected' : ''} ${isConfigured ? 'configured' : 'unconfigured'}`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="workflow-handle input-handle"
        isConnectable={true}
      />
      
      {/* Node Header */}
      <div className="node-header">
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
          {data.models.slice(0, 3).map((model, index) => (
            <div key={index} className="model-pill">
              <div className="model-logo">
                {getModelLogo(model)}
              </div>
              <span className="model-name">{getModelDisplayName(model)}</span>
            </div>
          ))}
          {data.models.length > 3 && (
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
              {data.prompt.length > 50 
                ? `${data.prompt.substring(0, 50)}...`
                : data.prompt
              }
            </div>
          </div>
        )}
      </div>
      
      {/* Settings Button */}
      <button className="node-settings-btn">
        <Settings size={14} />
      </button>
      
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