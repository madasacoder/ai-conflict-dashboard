/**
 * WorkflowToolbar - Context-sensitive toolbar
 * 
 * Beautiful toolbar with workflow actions like save, execute, etc.
 */

import React from 'react'
import { Play, Save, FileText, Settings, Moon, Sun, Pause } from 'lucide-react'
import { useWorkflowStore } from '@/state/workflowStore'

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
    togglePalette
  } = useWorkflowStore()

  return (
    <div className="workflow-toolbar">
      <div className="toolbar-section">
        <button
          className="toolbar-btn primary"
          data-testid="execute-workflow"
          onClick={isExecuting ? stopExecution : executeWorkflow}
          disabled={!workflow}
          aria-label={isExecuting ? 'Stop workflow execution' : 'Execute workflow'}
        >
          {isExecuting ? <Pause size={16} /> : <Play size={16} />}
          {isExecuting ? 'Stop' : 'Execute'}
        </button>
        
        {isExecuting && (
          <>
            <div className="execution-progress">
              <div 
                className="progress-bar"
                style={{ width: `${executionProgress}%` }}
              />
            </div>
            <span data-testid="execution-status" className="hidden">executing</span>
          </>
        )}
        {executionProgress === 100 && !isExecuting && (
          <span data-testid="execution-complete" className="hidden">completed</span>
        )}
      </div>

      <div className="toolbar-section">
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
      </div>

      <div className="toolbar-section">
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
  )
}