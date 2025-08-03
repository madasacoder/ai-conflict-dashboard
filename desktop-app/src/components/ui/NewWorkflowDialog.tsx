/**
 * NewWorkflowDialog - Create New Workflow Modal
 * 
 * Modal dialog for creating a new workflow with name and description
 */

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useWorkflowStore } from '@/state/workflowStore'

interface NewWorkflowDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const NewWorkflowDialog: React.FC<NewWorkflowDialogProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { createNewWorkflow } = useWorkflowStore()

  if (!isOpen) return null

  const handleCreate = () => {
    if (name.trim()) {
      createNewWorkflow(name, description)
      setName('')
      setDescription('')
      onClose()
    }
  }

  const handleCancel = () => {
    setName('')
    setDescription('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Workflow</h2>
          <button className="modal-close" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="workflow-name">Workflow Name</label>
            <input
              id="workflow-name"
              type="text"
              placeholder="Enter workflow name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="workflow-description">Description (optional)</label>
            <textarea
              id="workflow-description"
              placeholder="Enter workflow description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}