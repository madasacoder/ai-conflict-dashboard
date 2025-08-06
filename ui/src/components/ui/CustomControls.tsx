/**
 * CustomControls - Custom zoom controls with test-ids
 */

import React from 'react'
import { useReactFlow } from 'reactflow'
import { Plus, Minus, Maximize2 } from 'lucide-react'

export const CustomControls: React.FC = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div className="custom-controls">
      <button
        className="control-button"
        onClick={() => zoomIn()}
        data-testid="zoom-in"
        aria-label="Zoom in"
      >
        <Plus size={16} />
      </button>
      <button
        className="control-button"
        onClick={() => zoomOut()}
        data-testid="zoom-out"
        aria-label="Zoom out"
      >
        <Minus size={16} />
      </button>
      <button
        className="control-button"
        onClick={() => fitView()}
        data-testid="fit-view"
        aria-label="Fit view"
      >
        <Maximize2 size={16} />
      </button>
    </div>
  )
}