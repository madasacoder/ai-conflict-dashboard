/**
 * LLMNodeConfig - Configuration form for LLM nodes
 * 
 * Provides comprehensive configuration options for AI model selection,
 * prompts, temperature, token limits, and other LLM parameters.
 */

import React from 'react'
import { Brain, MessageSquare, Sliders, Hash } from 'lucide-react'
import { Node } from '@/types/workflow'

interface LLMNodeConfigProps {
  node: Node
  onUpdate: (key: string, value: any) => void
}

const AVAILABLE_MODELS = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
  { id: 'ollama', name: 'Ollama (Local)', provider: 'Local' }
]

export const LLMNodeConfig: React.FC<LLMNodeConfigProps> = ({ node, onUpdate }) => {
  const nodeData = node.data || {}
  const selectedModels = nodeData.models || ['gpt-4']
  const prompt = nodeData.prompt || 'Analyze the following:\n\n{input}'
  const temperature = nodeData.temperature || 0.7
  const maxTokens = nodeData.maxTokens || 2000
  const label = nodeData.label || ''

  const handleModelToggle = (modelId: string) => {
    const updatedModels = selectedModels.includes(modelId)
      ? selectedModels.filter((id: string) => id !== modelId)
      : [...selectedModels, modelId]
    
    onUpdate('models', updatedModels)
  }

  const handleTemperatureChange = (value: number) => {
    onUpdate('temperature', value)
  }

  const handleMaxTokensChange = (value: string) => {
    const numValue = parseInt(value) || 0
    onUpdate('maxTokens', numValue)
  }

  return (
    <div className="config-form">
      <div className="config-section">
        <h6 className="config-section-title">
          <Brain size={16} />
          LLM Configuration
        </h6>

        <div className="form-group">
          <label htmlFor="llm-label">Node Label</label>
          <input
            id="llm-label"
            type="text"
            className="form-control"
            value={label}
            onChange={(e) => onUpdate('label', e.target.value)}
            placeholder="Custom label for this LLM node"
          />
          <div className="help-text">
            This label will be displayed on the node in the workflow
          </div>
        </div>

        <div className="form-group">
          <label>Model Selection</label>
          <div className="checkbox-group">
            {AVAILABLE_MODELS.map((model) => (
              <div key={model.id} className="form-check">
                <input
                  type="checkbox"
                  id={`model-${model.id}`}
                  className="form-check-input"
                  checked={selectedModels.includes(model.id)}
                  onChange={() => handleModelToggle(model.id)}
                />
                <label htmlFor={`model-${model.id}`} className="form-check-label">
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>{model.name}</span>
                    <span style={{ 
                      fontSize: '11px', 
                      color: 'var(--text-muted)',
                      fontWeight: 'normal' 
                    }}>
                      {model.provider}
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </div>
          <div className="help-text">
            Select one or more models to analyze the input. Results will be compared across models.
          </div>
        </div>
      </div>

      <div className="config-divider" />

      <div className="config-section">
        <h6 className="config-section-title">
          <MessageSquare size={16} />
          Prompt Configuration
        </h6>

        <div className="form-group">
          <label htmlFor="llm-prompt">Prompt Template</label>
          <textarea
            id="llm-prompt"
            className="form-control textarea"
            value={prompt}
            onChange={(e) => onUpdate('prompt', e.target.value)}
            placeholder="Enter your prompt template here..."
            rows={8}
          />
          <div className="help-text">
            Use <code>{'{input}'}</code> to reference the input data. 
            Example: "Analyze the following text for sentiment: {'{input}'}"
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="system-prompt"
              className="form-check-input"
              checked={nodeData.useSystemPrompt || false}
              onChange={(e) => onUpdate('useSystemPrompt', e.target.checked)}
            />
            <label htmlFor="system-prompt" className="form-check-label">
              Use as System Prompt
            </label>
          </div>
          <div className="help-text">
            System prompts provide context that influences the model's behavior throughout the conversation
          </div>
        </div>
      </div>

      <div className="config-divider" />

      <div className="config-section">
        <h6 className="config-section-title">
          <Sliders size={16} />
          Model Parameters
        </h6>

        <div className="form-group">
          <label htmlFor="temperature">Temperature</label>
          <div className="range-container">
            <input
              id="temperature"
              type="range"
              className="form-range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
            />
            <div className="range-labels">
              <span>0 (Focused)</span>
              <div className="range-value">{temperature}</div>
              <span>1 (Creative)</span>
            </div>
          </div>
          <div className="help-text">
            Lower values make the output more focused and deterministic. 
            Higher values make it more creative and varied.
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="max-tokens">Max Tokens</label>
          <input
            id="max-tokens"
            type="number"
            className="form-control"
            value={maxTokens}
            onChange={(e) => handleMaxTokensChange(e.target.value)}
            min="1"
            max="8000"
            placeholder="2000"
          />
          <div className="help-text">
            Maximum number of tokens to generate. Higher values allow longer responses but use more resources.
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="stream-response"
              className="form-check-input"
              checked={nodeData.streamResponse || false}
              onChange={(e) => onUpdate('streamResponse', e.target.checked)}
            />
            <label htmlFor="stream-response" className="form-check-label">
              Stream Response
            </label>
          </div>
          <div className="help-text">
            Show the response as it's being generated for better user experience
          </div>
        </div>
      </div>

      <div className="config-divider" />

      <div className="config-section">
        <h6 className="config-section-title">
          <Hash size={16} />
          Advanced Settings
        </h6>

        <div className="form-group">
          <label htmlFor="top-p">Top P (Nucleus Sampling)</label>
          <input
            id="top-p"
            type="number"
            className="form-control"
            value={nodeData.topP || 1}
            onChange={(e) => onUpdate('topP', parseFloat(e.target.value) || 1)}
            min="0"
            max="1"
            step="0.1"
            placeholder="1"
          />
          <div className="help-text">
            Controls the diversity of the response. Lower values make responses more focused.
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="frequency-penalty">Frequency Penalty</label>
          <input
            id="frequency-penalty"
            type="number"
            className="form-control"
            value={nodeData.frequencyPenalty || 0}
            onChange={(e) => onUpdate('frequencyPenalty', parseFloat(e.target.value) || 0)}
            min="-2"
            max="2"
            step="0.1"
            placeholder="0"
          />
          <div className="help-text">
            Reduces repetition in the response. Positive values discourage repetition.
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="retry-on-error"
              className="form-check-input"
              checked={nodeData.retryOnError !== false}
              onChange={(e) => onUpdate('retryOnError', e.target.checked)}
            />
            <label htmlFor="retry-on-error" className="form-check-label">
              Retry on Error
            </label>
          </div>
          <div className="help-text">
            Automatically retry the request if it fails due to temporary issues
          </div>
        </div>
      </div>
    </div>
  )
}

export default LLMNodeConfig