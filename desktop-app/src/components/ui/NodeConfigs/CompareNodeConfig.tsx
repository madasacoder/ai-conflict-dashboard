/**
 * CompareNodeConfig - Configuration form for Compare nodes
 * 
 * Provides configuration options for comparison types, analysis methods,
 * and output formatting for Compare nodes.
 */

import React from 'react'
import { GitCompare, Search, CheckCircle, AlertTriangle } from 'lucide-react'
import { Node } from '@/types/workflow'

interface CompareNodeConfigProps {
  node: Node
  onUpdate: (key: string, value: any) => void
}

const COMPARISON_TYPES = [
  {
    id: 'conflicts',
    name: 'Find Conflicts',
    description: 'Identify disagreements and contradictions between model responses',
    icon: AlertTriangle
  },
  {
    id: 'consensus',
    name: 'Find Consensus', 
    description: 'Find areas where all models agree or provide similar responses',
    icon: CheckCircle
  },
  {
    id: 'differences',
    name: 'All Differences',
    description: 'Highlight all differences between model responses, including nuances',
    icon: Search
  }
]

const ANALYSIS_METHODS = [
  {
    id: 'semantic',
    name: 'Semantic Analysis',
    description: 'Compare meaning and intent, not just exact text matches'
  },
  {
    id: 'structural',
    name: 'Structural Analysis', 
    description: 'Compare structure, format, and organization of responses'
  },
  {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description: 'Compare emotional tone and sentiment of responses'
  },
  {
    id: 'factual',
    name: 'Factual Analysis',
    description: 'Focus on factual claims and their consistency'
  }
]

export const CompareNodeConfig: React.FC<CompareNodeConfigProps> = ({ node, onUpdate }) => {
  const nodeData = node.data || {}
  const comparisonType = nodeData.comparisonType || 'conflicts'
  const analysisMethods = nodeData.analysisMethods || ['semantic']
  const label = nodeData.label || ''
  const includeMetadata = nodeData.includeMetadata || false
  const confidenceThreshold = nodeData.confidenceThreshold || 0.7

  const handleComparisonTypeChange = (type: string) => {
    onUpdate('comparisonType', type)
  }

  const handleAnalysisMethodToggle = (methodId: string) => {
    const updatedMethods = analysisMethods.includes(methodId)
      ? analysisMethods.filter((id: string) => id !== methodId)
      : [...analysisMethods, methodId]
    
    onUpdate('analysisMethods', updatedMethods)
  }

  return (
    <div className="config-form">
      <div className="config-section">
        <h6 className="config-section-title">
          <GitCompare size={16} />
          Compare Configuration
        </h6>

        <div className="form-group">
          <label htmlFor="compare-label">Node Label</label>
          <input
            id="compare-label"
            type="text"
            className="form-control"
            value={label}
            onChange={(e) => onUpdate('label', e.target.value)}
            placeholder="Custom label for this compare node"
          />
          <div className="help-text">
            This label will be displayed on the node in the workflow
          </div>
        </div>

        <div className="form-group">
          <label>Comparison Type</label>
          <div className="checkbox-group">
            {COMPARISON_TYPES.map((type) => {
              const IconComponent = type.icon
              return (
                <div key={type.id} className="form-check">
                  <input
                    type="radio"
                    id={`comparison-${type.id}`}
                    name="comparisonType"
                    className="form-check-input"
                    checked={comparisonType === type.id}
                    onChange={() => handleComparisonTypeChange(type.id)}
                  />
                  <label htmlFor={`comparison-${type.id}`} className="form-check-label">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconComponent size={16} />
                      <div>
                        <div>{type.name}</div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: 'var(--text-muted)',
                          fontWeight: 'normal',
                          marginTop: '2px'
                        }}>
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="config-divider" />

      <div className="config-section">
        <h6 className="config-section-title">
          <Search size={16} />
          Analysis Methods
        </h6>

        <div className="form-group">
          <label>Analysis Approaches</label>
          <div className="checkbox-group">
            {ANALYSIS_METHODS.map((method) => (
              <div key={method.id} className="form-check">
                <input
                  type="checkbox"
                  id={`method-${method.id}`}
                  className="form-check-input"
                  checked={analysisMethods.includes(method.id)}
                  onChange={() => handleAnalysisMethodToggle(method.id)}
                />
                <label htmlFor={`method-${method.id}`} className="form-check-label">
                  <div>
                    <div>{method.name}</div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: 'var(--text-muted)',
                      fontWeight: 'normal',
                      marginTop: '2px'
                    }}>
                      {method.description}
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
          <div className="help-text">
            Select one or more analysis methods to apply during comparison
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confidence-threshold">Confidence Threshold</label>
          <div className="range-container">
            <input
              id="confidence-threshold"
              type="range"
              className="form-range"
              min="0"
              max="1"
              step="0.1"
              value={confidenceThreshold}
              onChange={(e) => onUpdate('confidenceThreshold', parseFloat(e.target.value))}
            />
            <div className="range-labels">
              <span>0 (Loose)</span>
              <div className="range-value">{confidenceThreshold}</div>
              <span>1 (Strict)</span>
            </div>
          </div>
          <div className="help-text">
            How confident the analysis should be before flagging differences or agreements
          </div>
        </div>
      </div>

      <div className="config-divider" />

      <div className="config-section">
        <h6 className="config-section-title">
          <CheckCircle size={16} />
          Output Settings
        </h6>

        <div className="form-group">
          <label htmlFor="output-format">Output Format</label>
          <select
            id="output-format"
            className="form-control form-select"
            value={nodeData.outputFormat || 'structured'}
            onChange={(e) => onUpdate('outputFormat', e.target.value)}
          >
            <option value="structured">Structured Analysis</option>
            <option value="summary">Summary Report</option>
            <option value="detailed">Detailed Comparison</option>
            <option value="table">Comparison Table</option>
          </select>
          <div className="help-text">
            Choose how the comparison results should be formatted
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="include-metadata"
              className="form-check-input"
              checked={includeMetadata}
              onChange={(e) => onUpdate('includeMetadata', e.target.checked)}
            />
            <label htmlFor="include-metadata" className="form-check-label">
              Include Metadata
            </label>
          </div>
          <div className="help-text">
            Include model names, timestamps, and other metadata in the output
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="highlight-differences"
              className="form-check-input"
              checked={nodeData.highlightDifferences !== false}
              onChange={(e) => onUpdate('highlightDifferences', e.target.checked)}
            />
            <label htmlFor="highlight-differences" className="form-check-label">
              Highlight Differences
            </label>
          </div>
          <div className="help-text">
            Use visual formatting to highlight differences in the output
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="include-scores"
              className="form-check-input"
              checked={nodeData.includeScores || false}
              onChange={(e) => onUpdate('includeScores', e.target.checked)}
            />
            <label htmlFor="include-scores" className="form-check-label">
              Include Confidence Scores
            </label>
          </div>
          <div className="help-text">
            Show numerical confidence scores for each comparison
          </div>
        </div>
      </div>

      <div className="config-divider" />

      <div className="config-section">
        <h6 className="config-section-title">
          <AlertTriangle size={16} />
          Advanced Options
        </h6>

        <div className="form-group">
          <label htmlFor="ignore-case">Text Processing</label>
          <div className="form-check">
            <input
              type="checkbox"
              id="ignore-case"
              className="form-check-input"
              checked={nodeData.ignoreCase || false}
              onChange={(e) => onUpdate('ignoreCase', e.target.checked)}
            />
            <label htmlFor="ignore-case" className="form-check-label">
              Ignore Case
            </label>
          </div>
          <div className="form-check">
            <input
              type="checkbox"
              id="ignore-punctuation"
              className="form-check-input"
              checked={nodeData.ignorePunctuation || false}
              onChange={(e) => onUpdate('ignorePunctuation', e.target.checked)}
            />
            <label htmlFor="ignore-punctuation" className="form-check-label">
              Ignore Punctuation
            </label>
          </div>
          <div className="form-check">
            <input
              type="checkbox"
              id="normalize-whitespace"
              className="form-check-input"
              checked={nodeData.normalizeWhitespace !== false}
              onChange={(e) => onUpdate('normalizeWhitespace', e.target.checked)}
            />
            <label htmlFor="normalize-whitespace" className="form-check-label">
              Normalize Whitespace
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="custom-instructions">Custom Instructions</label>
          <textarea
            id="custom-instructions"
            className="form-control textarea"
            value={nodeData.customInstructions || ''}
            onChange={(e) => onUpdate('customInstructions', e.target.value)}
            placeholder="Additional instructions for the comparison analysis..."
            rows={3}
          />
          <div className="help-text">
            Provide specific instructions to guide the comparison analysis
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompareNodeConfig