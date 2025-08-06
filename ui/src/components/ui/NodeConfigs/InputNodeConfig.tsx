/**
 * InputNodeConfig - Configuration form for Input nodes
 * 
 * Provides configuration options for input type, placeholder text,
 * and file upload settings for Input nodes.
 */

import React from 'react'
import { Type, Upload, Link, FileText } from 'lucide-react'
import { Node } from '@/types/workflow'

interface InputNodeConfigProps {
  node: Node
  onUpdate: (key: string, value: any) => void
}

export const InputNodeConfig: React.FC<InputNodeConfigProps> = ({ node, onUpdate }) => {
  const nodeData = node.data || {}
  const inputType = nodeData.inputType || 'text'
  const placeholder = nodeData.placeholder || ''
  const label = nodeData.label || ''

  const handleInputTypeChange = (type: string) => {
    onUpdate('inputType', type)
    
    // Set appropriate placeholder based on input type
    if (type === 'file') {
      onUpdate('placeholder', 'Select files to upload...')
    } else if (type === 'url') {
      onUpdate('placeholder', 'Enter URL to fetch content...')
    } else {
      onUpdate('placeholder', 'Enter your text here...')
    }
  }

  return (
    <div className="config-form">
      <div className="config-section">
        <h6 className="config-section-title">
          <Type size={16} />
          Input Configuration
        </h6>

        <div className="form-group">
          <label htmlFor="node-label">Node Label</label>
          <input
            id="node-label"
            type="text"
            className="form-control"
            value={label}
            onChange={(e) => onUpdate('label', e.target.value)}
            placeholder="Custom label for this input node"
          />
          <div className="help-text">
            This label will be displayed on the node in the workflow
          </div>
        </div>

        <div className="form-group">
          <label>Input Type</label>
          <div className="checkbox-group">
            <div className="form-check">
              <input
                type="radio"
                id="input-text"
                name="inputType"
                className="form-check-input"
                checked={inputType === 'text'}
                onChange={() => handleInputTypeChange('text')}
              />
              <label htmlFor="input-text" className="form-check-label">
                <Type size={16} />
                Text Input
              </label>
            </div>
            
            <div className="form-check">
              <input
                type="radio"
                id="input-file"
                name="inputType"
                className="form-check-input"
                checked={inputType === 'file'}
                onChange={() => handleInputTypeChange('file')}
              />
              <label htmlFor="input-file" className="form-check-label">
                <Upload size={16} />
                File Upload
              </label>
            </div>
            
            <div className="form-check">
              <input
                type="radio"
                id="input-url"
                name="inputType"
                className="form-check-input"
                checked={inputType === 'url'}
                onChange={() => handleInputTypeChange('url')}
              />
              <label htmlFor="input-url" className="form-check-label">
                <Link size={16} />
                URL Input
              </label>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="node-placeholder">Placeholder Text</label>
          <input
            id="node-placeholder"
            type="text"
            className="form-control"
            value={placeholder}
            onChange={(e) => onUpdate('placeholder', e.target.value)}
            placeholder="Placeholder text for the input field"
          />
          <div className="help-text">
            This text will be shown when the input field is empty
          </div>
        </div>

        {inputType === 'file' && (
          <div className="form-group">
            <label htmlFor="file-types">Accepted File Types</label>
            <input
              id="file-types"
              type="text"
              className="form-control"
              value={nodeData.acceptedTypes || '.txt,.pdf,.docx,.md'}
              onChange={(e) => onUpdate('acceptedTypes', e.target.value)}
              placeholder=".txt,.pdf,.docx,.md"
            />
            <div className="help-text">
              Comma-separated list of file extensions (e.g., .txt,.pdf,.docx)
            </div>
          </div>
        )}

        {inputType === 'file' && (
          <div className="form-group">
            <div className="form-check">
              <input
                type="checkbox"
                id="multiple-files"
                className="form-check-input"
                checked={nodeData.multiple || false}
                onChange={(e) => onUpdate('multiple', e.target.checked)}
              />
              <label htmlFor="multiple-files" className="form-check-label">
                Allow Multiple Files
              </label>
            </div>
            <div className="help-text">
              Allow users to select and upload multiple files at once
            </div>
          </div>
        )}

        {inputType === 'url' && (
          <div className="form-group">
            <div className="form-check">
              <input
                type="checkbox"
                id="auto-fetch"
                className="form-check-input"
                checked={nodeData.autoFetch || false}
                onChange={(e) => onUpdate('autoFetch', e.target.checked)}
              />
              <label htmlFor="auto-fetch" className="form-check-label">
                Auto-fetch Content
              </label>
            </div>
            <div className="help-text">
              Automatically fetch content when a URL is entered
            </div>
          </div>
        )}
      </div>

      <div className="config-divider" />

      <div className="config-section">
        <h6 className="config-section-title">
          <FileText size={16} />
          Content Settings
        </h6>

        <div className="form-group">
          <label htmlFor="default-content">Default Content</label>
          <textarea
            id="default-content"
            className="form-control textarea"
            value={nodeData.defaultContent || ''}
            onChange={(e) => onUpdate('defaultContent', e.target.value)}
            placeholder="Default content for this input (optional)"
            rows={4}
          />
          <div className="help-text">
            This content will be pre-filled in the input field
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="required-input"
              className="form-check-input"
              checked={nodeData.required || false}
              onChange={(e) => onUpdate('required', e.target.checked)}
            />
            <label htmlFor="required-input" className="form-check-label">
              Required Input
            </label>
          </div>
          <div className="help-text">
            Workflow execution will require this input to have content
          </div>
        </div>
      </div>
    </div>
  )
}

export default InputNodeConfig