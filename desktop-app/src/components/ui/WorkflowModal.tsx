/**
 * WorkflowModal - Workflow Creation and Management Modal
 * 
 * Provides an interface for creating new workflows, managing existing ones,
 * and loading templates with a professional, polished design.
 */

import React, { useState, useEffect } from 'react'
import { X, Save, Copy, Trash2, Download, Upload, Sparkles, Clock, FolderPlus } from 'lucide-react'
import { useWorkflowStore, WorkflowMetadata } from '@/state/workflowStore'
import './WorkflowModal.css'

interface WorkflowModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'manage' | 'templates'
}

interface WorkflowFormData {
  name: string
  description: string
  icon: string
  color: string
  tags: string[]
}

const DEFAULT_ICONS = ['🔄', '⚡', '🚀', '🎯', '🔧', '📊', '🤖', '💡', '🔮', '⭐']
const DEFAULT_COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22']

export const WorkflowModal: React.FC<WorkflowModalProps> = ({ isOpen, onClose, mode }) => {
  const {
    workflow: currentWorkflow,
    templates,
    recentWorkflows,
    createNewWorkflow,
    loadTemplate,
    duplicateWorkflow,
    deleteWorkflow,
    saveAsTemplate,
    exportWorkflow,
    importWorkflow
  } = useWorkflowStore()

  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    icon: '🔄',
    color: '#3498db',
    tags: []
  })
  
  const [currentTag, setCurrentTag] = useState('')
  const [importText, setImportText] = useState('')
  const [activeTab, setActiveTab] = useState<'create' | 'recent' | 'templates'>('create')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mode === 'templates') {
      setActiveTab('templates')
    } else if (mode === 'manage') {
      setActiveTab('recent')
    } else {
      setActiveTab('create')
    }
  }, [mode])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '🔄',
      color: '#3498db',
      tags: []
    })
    setCurrentTag('')
    setImportText('')
    setErrors({})
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Workflow name is required'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Workflow name must be at least 3 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateWorkflow = () => {
    if (!validateForm()) return
    
    createNewWorkflow(formData.name.trim(), formData.description.trim())
    resetForm()
    onClose()
  }

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }))
      setCurrentTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleImportWorkflow = () => {
    try {
      importWorkflow(importText)
      setImportText('')
      onClose()
    } catch (error) {
      setErrors({ import: error instanceof Error ? error.message : 'Import failed' })
    }
  }

  const handleExportWorkflow = () => {
    const workflowData = exportWorkflow()
    const blob = new Blob([workflowData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentWorkflow?.name || 'workflow'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (!isOpen) return null

  return (
    <div className="workflow-modal-overlay" onClick={onClose}>
      <div className="workflow-modal" onClick={e => e.stopPropagation()}>
        <div className="workflow-modal-header">
          <h2>
            {mode === 'create' && 'Create New Workflow'}
            {mode === 'manage' && 'Manage Workflows'}
            {mode === 'templates' && 'Workflow Templates'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="workflow-tabs">
          <button
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <FolderPlus size={16} />
            Create New
          </button>
          <button
            className={`tab ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            <Clock size={16} />
            Recent ({recentWorkflows.length})
          </button>
          <button
            className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <Sparkles size={16} />
            Templates ({templates.length})
          </button>
        </div>

        <div className="workflow-modal-content">
          {/* Create New Tab */}
          {activeTab === 'create' && (
            <div className="create-workflow-form">
              <div className="form-group">
                <label htmlFor="workflow-name">Workflow Name *</label>
                <input
                  id="workflow-name"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Content Analysis Pipeline"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="workflow-description">Description</label>
                <textarea
                  id="workflow-description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this workflow does..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Icon</label>
                  <div className="icon-picker">
                    {DEFAULT_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <div className="color-picker">
                    {DEFAULT_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${formData.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div className="tag-input">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={e => setCurrentTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                  />
                  <button type="button" onClick={handleAddTag}>Add</button>
                </div>
                <div className="tags-display">
                  {formData.tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="primary-btn" onClick={handleCreateWorkflow}>
                  <Save size={16} />
                  Create Workflow
                </button>
              </div>

              <div className="import-section">
                <h3>Or Import Workflow</h3>
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="Paste workflow JSON here..."
                  rows={4}
                  className={errors.import ? 'error' : ''}
                />
                {errors.import && <span className="error-message">{errors.import}</span>}
                <button 
                  type="button" 
                  className="secondary-btn"
                  onClick={handleImportWorkflow}
                  disabled={!importText.trim()}
                >
                  <Upload size={16} />
                  Import
                </button>
              </div>
            </div>
          )}

          {/* Recent Workflows Tab */}
          {activeTab === 'recent' && (
            <div className="workflows-list">
              {recentWorkflows.length === 0 ? (
                <div className="empty-state">
                  <FolderPlus size={48} />
                  <h3>No Recent Workflows</h3>
                  <p>Create your first workflow to get started.</p>
                </div>
              ) : (
                recentWorkflows.map(workflow => (
                  <div key={workflow.id} className="workflow-item">
                    <div className="workflow-icon" style={{ backgroundColor: workflow.color }}>
                      {workflow.icon}
                    </div>
                    <div className="workflow-info">
                      <h4>{workflow.name}</h4>
                      <p>{workflow.description || 'No description'}</p>
                      <div className="workflow-meta">
                        <span>Modified {formatDate(workflow.modified)}</span>
                        {workflow.tags.length > 0 && (
                          <div className="workflow-tags">
                            {workflow.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="tag small">{tag}</span>
                            ))}
                            {workflow.tags.length > 3 && (
                              <span className="tag small">+{workflow.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="workflow-actions">
                      <button 
                        className="action-btn"
                        onClick={() => duplicateWorkflow()}
                        title="Duplicate"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        className="action-btn"
                        onClick={handleExportWorkflow}
                        title="Export"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        className="action-btn danger"
                        onClick={() => deleteWorkflow(workflow.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="workflows-list">
              <div className="templates-header">
                <button 
                  className="secondary-btn"
                  onClick={() => saveAsTemplate()}
                  disabled={!currentWorkflow}
                >
                  <Sparkles size={16} />
                  Save Current as Template
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="empty-state">
                  <Sparkles size={48} />
                  <h3>No Templates Available</h3>
                  <p>Save your workflow as a template to reuse it later.</p>
                </div>
              ) : (
                templates.map(template => (
                  <div key={template.id} className="workflow-item template">
                    <div className="workflow-icon" style={{ backgroundColor: template.color }}>
                      {template.icon}
                    </div>
                    <div className="workflow-info">
                      <h4>{template.name}</h4>
                      <p>{template.description || 'No description'}</p>
                      <div className="workflow-meta">
                        <span>Created {formatDate(template.created)}</span>
                        {template.tags.length > 0 && (
                          <div className="workflow-tags">
                            {template.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="tag small">{tag}</span>
                            ))}
                            {template.tags.length > 3 && (
                              <span className="tag small">+{template.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="workflow-actions">
                      <button 
                        className="primary-btn small"
                        onClick={() => {
                          loadTemplate(template.id)
                          onClose()
                        }}
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkflowModal