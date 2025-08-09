/**
 * WorkflowToolbar - Context-sensitive toolbar
 * 
 * Beautiful toolbar with workflow actions like save, execute, etc.
 */

import React, { useState } from 'react'
import { Play, Save, FileText, Settings, Moon, Sun, Pause, Plus, FolderOpen, Sparkles, ChevronDown, BarChart3 } from 'lucide-react'
import { useWorkflowStore } from '@/state/workflowStore'
import { WorkflowModal } from './WorkflowModal'
import toast from 'react-hot-toast'
import '@/styles/WorkflowToolbar.css'

export const WorkflowToolbar: React.FC = () => {
  const {
    workflow,
    currentTheme,
    isExecuting,
    executionProgress,
    executeWorkflow,
    stopExecution,
    saveWorkflow,
    setTheme,
    togglePalette,
    toggleExecutionPanel,
    isExecutionPanelOpen,
    validateWorkflow
  } = useWorkflowStore()

  const [showWorkflowModal, setShowWorkflowModal] = useState(false)
  const [workflowModalMode, setWorkflowModalMode] = useState<'create' | 'manage' | 'templates'>('create')
  const [showWorkflowMenu, setShowWorkflowMenu] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const openWorkflowModal = (mode: 'create' | 'manage' | 'templates') => {
    setWorkflowModalMode(mode)
    setShowWorkflowModal(true)
    setShowWorkflowMenu(false)
  }
  
  const handleExecuteClick = async () => {
    const validation = validateWorkflow()
    if (!validation.isValid) {
      // Show validation errors
      setValidationErrors(validation.errors)
      validation.errors.forEach(error => {
        toast.error(error)
      })
      // Clear errors after 5 seconds
      setTimeout(() => setValidationErrors([]), 5000)
      return
    }
    
    setValidationErrors([])
    
    if (isExecuting) {
      stopExecution()
    } else {
      try {
        await executeWorkflow()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Execution failed'
        toast.error(errorMessage)
        setValidationErrors([errorMessage])
      }
    }
  }

  return (
    <>
      <div className="workflow-toolbar">
        {/* Left Section - Workflow Management */}
        <div className="toolbar-section">
          <div className="workflow-info">
            {workflow ? (
              <div className="current-workflow">
                <span className="workflow-icon">{workflow.icon}</span>
                <span className="workflow-name">{workflow.name}</span>
              </div>
            ) : (
              <span className="no-workflow">No Workflow</span>
            )}
          </div>
          
          <div className="workflow-menu-container">
            <button
              className="toolbar-btn workflow-menu-btn"
              onClick={() => setShowWorkflowMenu(!showWorkflowMenu)}
              aria-label="Workflow menu"
            >
              <ChevronDown size={16} />
            </button>
            
            {showWorkflowMenu && (
              <div className="workflow-dropdown">
                <button
                  className="dropdown-item"
                  onClick={() => openWorkflowModal('create')}
                >
                  <Plus size={16} />
                  New Workflow
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => openWorkflowModal('manage')}
                >
                  <FolderOpen size={16} />
                  Open Workflow
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => openWorkflowModal('templates')}
                >
                  <Sparkles size={16} />
                  Templates
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center Section - Execution */}
        <div className="toolbar-section">
          <button
            className="toolbar-btn primary"
            data-testid="execute-workflow"
            onClick={handleExecuteClick}
            disabled={false}
            aria-label={isExecuting ? 'Stop workflow execution' : 'Execute workflow'}
          >
            {isExecuting ? <Pause size={16} /> : <Play size={16} />}
            {isExecuting ? 'Stop' : 'Execute'}
          </button>
          
          {isExecuting && executionProgress && (
            <>
              <div className="execution-progress">
                <div 
                  className="progress-bar"
                  style={{ width: `${executionProgress.percentage}%` }}
                />
              </div>
              <span data-testid="execution-status" className="hidden">executing</span>
            </>
          )}
          {executionProgress?.percentage === 100 && !isExecuting && (
            <span data-testid="execution-complete" className="hidden">completed</span>
          )}
        </div>

        {/* Right Section - Tools */}
        <div className="toolbar-section">
          <button
            className={`toolbar-btn ${isExecutionPanelOpen ? 'active' : ''}`}
            data-testid="execution-results"
            onClick={toggleExecutionPanel}
            aria-label="Show execution results"
          >
            <BarChart3 size={16} />
            Results
          </button>
          
          <button
            className="toolbar-btn"
            data-testid="save-workflow"
            onClick={saveWorkflow}
            disabled={!workflow}
            aria-label="Save workflow"
          >
            <Save size={16} />
            Save
          </button>
          
          <button
            className="toolbar-btn"
            onClick={togglePalette}
          >
            <FileText size={16} />
            Nodes
          </button>
          
          <button
            className="toolbar-btn"
            data-testid="theme-toggle"
            onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {currentTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Validation Errors (hidden but in DOM for tests) */}
      {validationErrors.length > 0 && (
        <div className="validation-errors" data-testid="validation-errors" style={{ position: 'absolute', left: '-9999px' }}>
          {validationErrors.map((error, index) => (
            <div key={index} className="validation-error" data-testid={`validation-error-${index}`}>
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Workflow Modal */}
      <WorkflowModal
        isOpen={showWorkflowModal}
        onClose={() => setShowWorkflowModal(false)}
        mode={workflowModalMode}
      />
    </>
  )
}