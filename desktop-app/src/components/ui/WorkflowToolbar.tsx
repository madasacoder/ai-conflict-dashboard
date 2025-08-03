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
          onClick={isExecuting ? stopExecution : executeWorkflow}
          disabled={!workflow}
        >
          {isExecuting ? <Pause size={16} /> : <Play size={16} />}
          {isExecuting ? 'Stop' : 'Execute'}
        </button>
        
        {isExecuting && (
          <div className="execution-progress">
            <div 
              className="progress-bar"
              style={{ width: `${executionProgress}%` }}
            />
          </div>
        )}
      </div>

      <div className="toolbar-section">
        <button
          className="toolbar-btn"
          onClick={saveWorkflow}
          disabled={!workflow}
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
          onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
        >
          {currentTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </div>
  )
}