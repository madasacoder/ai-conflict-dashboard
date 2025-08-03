/**
 * OutputNodeConfig - Configuration form for Output nodes
 * 
 * Provides configuration options for output formatting, export settings,
 * and display preferences for Output nodes.
 */

import React from 'react'
import { FileOutput, FileText, Download, Eye, Settings } from 'lucide-react'
import { Node } from '@/types/workflow'

interface OutputNodeConfigProps {
  node: Node
  onUpdate: (key: string, value: any) => void
}

const OUTPUT_FORMATS = [
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Rich text with formatting, links, and structure',
    extension: '.md'
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'Structured data format for programmatic use',
    extension: '.json'
  },
  {
    id: 'text',
    name: 'Plain Text',
    description: 'Simple text without formatting',
    extension: '.txt'
  },
  {
    id: 'html',
    name: 'HTML',
    description: 'Web-ready formatted content',
    extension: '.html'
  },
  {
    id: 'csv',
    name: 'CSV',
    description: 'Comma-separated values for tabular data',
    extension: '.csv'
  }
]

const DISPLAY_MODES = [
  {
    id: 'full',
    name: 'Full Display',
    description: 'Show complete output with all formatting'
  },
  {
    id: 'preview',
    name: 'Preview Mode',
    description: 'Show truncated preview with expand option'
  },
  {
    id: 'summary',
    name: 'Summary Only',
    description: 'Show only key information and metrics'
  }
]

export const OutputNodeConfig: React.FC<OutputNodeConfigProps> = ({ node, onUpdate }) => {
  const nodeData = node.data || {}
  const outputFormat = nodeData.outputFormat || 'markdown'
  const includeMetadata = nodeData.includeMetadata || false
  const displayMode = nodeData.displayMode || 'full'
  const label = nodeData.label || ''
  const autoExport = nodeData.autoExport || false
  const filename = nodeData.filename || 'workflow-output'

  return (
    <div className="config-form">
      <div className="config-section">
        <h6 className="config-section-title">
          <FileOutput size={16} />
          Output Configuration
        </h6>

        <div className="form-group">
          <label htmlFor="output-label">Node Label</label>
          <input
            id="output-label"
            type="text"
            className="form-control"
            value={label}
            onChange={(e) => onUpdate('label', e.target.value)}
            placeholder="Custom label for this output node"
          />
          <div className="help-text">
            This label will be displayed on the node in the workflow
          </div>
        </div>

        <div className="form-group">
          <label>Output Format</label>
          <div className="checkbox-group">
            {OUTPUT_FORMATS.map((format) => (
              <div key={format.id} className="form-check">
                <input
                  type="radio"
                  id={`format-${format.id}`}
                  name="outputFormat"
                  className="form-check-input"
                  checked={outputFormat === format.id}
                  onChange={() => onUpdate('outputFormat', format.id)}
                />
                <label htmlFor={`format-${format.id}`} className="form-check-label">
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div>
                      <div>{format.name}</div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: 'var(--text-muted)',
                        fontWeight: 'normal',
                        marginTop: '2px'
                      }}>
                        {format.description}
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '11px', 
                      color: 'var(--text-muted)',
                      fontWeight: 'normal',
                      alignSelf: 'flex-start'
                    }}>
                      {format.extension}
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="config-divider" />

      <div className="config-section">
        <h6 className="config-section-title">
          <Eye size={16} />
          Display Settings
        </h6>

        <div className="form-group">
          <label>Display Mode</label>
          <div className="checkbox-group">
            {DISPLAY_MODES.map((mode) => (
              <div key={mode.id} className="form-check">
                <input
                  type="radio"
                  id={`display-${mode.id}`}
                  name="displayMode"
                  className="form-check-input"
                  checked={displayMode === mode.id}
                  onChange={() => onUpdate('displayMode', mode.id)}
                />
                <label htmlFor={`display-${mode.id}`} className="form-check-label">
                  <div>
                    <div>{mode.name}</div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: 'var(--text-muted)',
                      fontWeight: 'normal',
                      marginTop: '2px'
                    }}>
                      {mode.description}
                    </div>
                  </div>
                </label>
              </div>
            ))}
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
            Include execution time, model information, and other metadata in the output
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="show-timestamps"
              className="form-check-input"
              checked={nodeData.showTimestamps || false}
              onChange={(e) => onUpdate('showTimestamps', e.target.checked)}
            />
            <label htmlFor="show-timestamps" className="form-check-label">
              Show Timestamps
            </label>
          </div>
          <div className="help-text">
            Display when the output was generated
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="syntax-highlighting"
              className="form-check-input"
              checked={nodeData.syntaxHighlighting !== false}
              onChange={(e) => onUpdate('syntaxHighlighting', e.target.checked)}
            />
            <label htmlFor="syntax-highlighting" className="form-check-label">
              Syntax Highlighting
            </label>
          </div>
          <div className="help-text">
            Apply syntax highlighting for supported formats (JSON, Markdown, etc.)
          </div>
        </div>
      </div>

      <div className="config-divider" />

      <div className="config-section">
        <h6 className="config-section-title">
          <Download size={16} />
          Export Settings
        </h6>

        <div className="form-group">
          <label htmlFor="filename">Default Filename</label>
          <input
            id="filename"
            type="text"
            className="form-control"
            value={filename}
            onChange={(e) => onUpdate('filename', e.target.value)}
            placeholder="workflow-output"
          />
          <div className="help-text">
            Default filename for exported files (extension will be added automatically)
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="auto-export"
              className="form-check-input"
              checked={autoExport}
              onChange={(e) => onUpdate('autoExport', e.target.checked)}
            />
            <label htmlFor="auto-export" className="form-check-label">
              Auto-Export on Completion
            </label>
          </div>
          <div className="help-text">
            Automatically save the output to a file when workflow execution completes
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="include-inputs"
              className="form-check-input"
              checked={nodeData.includeInputs || false}
              onChange={(e) => onUpdate('includeInputs', e.target.checked)}
            />
            <label htmlFor="include-inputs" className="form-check-label">
              Include Original Inputs
            </label>
          </div>
          <div className="help-text">
            Include the original input data in the exported output
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="timestamp-filename"
              className="form-check-input"
              checked={nodeData.timestampFilename || false}
              onChange={(e) => onUpdate('timestampFilename', e.target.checked)}
            />
            <label htmlFor="timestamp-filename" className="form-check-label">
              Add Timestamp to Filename
            </label>
          </div>
          <div className="help-text">
            Append timestamp to filename to avoid overwriting previous exports
          </div>
        </div>
      </div>

      <div className="config-divider" />

      <div className="config-section">
        <h6 className="config-section-title">
          <Settings size={16} />
          Advanced Options
        </h6>

        <div className="form-group">
          <label htmlFor="max-preview-length">Preview Length Limit</label>
          <input
            id="max-preview-length"
            type="number"
            className="form-control"
            value={nodeData.maxPreviewLength || 1000}
            onChange={(e) => onUpdate('maxPreviewLength', parseInt(e.target.value) || 1000)}
            min="100"
            max="10000"
            placeholder="1000"
          />
          <div className="help-text">
            Maximum number of characters to show in preview mode
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="line-numbers">Display Options</label>
          <div className="form-check">
            <input
              type="checkbox"
              id="line-numbers"
              className="form-check-input"
              checked={nodeData.showLineNumbers || false}
              onChange={(e) => onUpdate('showLineNumbers', e.target.checked)}
            />
            <label htmlFor="line-numbers" className="form-check-label">
              Show Line Numbers
            </label>
          </div>
          <div className="form-check">
            <input
              type="checkbox"
              id="word-wrap"
              className="form-check-input"
              checked={nodeData.wordWrap !== false}
              onChange={(e) => onUpdate('wordWrap', e.target.checked)}
            />
            <label htmlFor="word-wrap" className="form-check-label">
              Word Wrap
            </label>
          </div>
          <div className="form-check">
            <input
              type="checkbox"
              id="copy-button"
              className="form-check-input"
              checked={nodeData.showCopyButton !== false}
              onChange={(e) => onUpdate('showCopyButton', e.target.checked)}
            />
            <label htmlFor="copy-button" className="form-check-label">
              Show Copy Button
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="custom-template">Custom Template</label>
          <textarea
            id="custom-template"
            className="form-control textarea"
            value={nodeData.customTemplate || ''}
            onChange={(e) => onUpdate('customTemplate', e.target.value)}
            placeholder="Custom formatting template (optional)..."
            rows={4}
          />
          <div className="help-text">
            Use <code>{'{content}'}</code> to reference the main output content. 
            Example: "# Results\n\n{'{content}'}\n\n---\nGenerated: {'{timestamp}'}"
          </div>
        </div>
      </div>
    </div>
  )
}

export default OutputNodeConfig