/**
 * ConnectionLine - Animated connection line component
 */

import React from 'react'
import { getSmoothStepPath, ConnectionLineComponentProps } from 'reactflow'

export const ConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  })

  return (
    <g>
      <path
        fill="none"
        stroke={connectionLineStyle?.stroke || '#3498db'}
        strokeWidth={connectionLineStyle?.strokeWidth || 2}
        strokeDasharray="5,5"
        d={edgePath}
        className="animated-connection-line"
      />
    </g>
  )
}