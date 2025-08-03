import React, { useState } from 'react'

export const TestDragDrop: React.FC = () => {
  const [dragEvents, setDragEvents] = useState<string[]>([])
  const [droppedItems, setDroppedItems] = useState<string[]>([])

  const addEvent = (event: string) => {
    setDragEvents(prev => [...prev, `${new Date().toISOString()}: ${event}`])
  }

  const onDragStart = (e: React.DragEvent, nodeType: string) => {
    addEvent(`dragStart: ${nodeType}`)
    e.dataTransfer.setData('application/reactflow', nodeType)
    e.dataTransfer.setData('text/plain', nodeType)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    addEvent('dragOver on drop zone')
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    const nodeType = e.dataTransfer.getData('application/reactflow') || 
                     e.dataTransfer.getData('text/plain')
    
    addEvent(`drop: ${nodeType || 'no data'}`)
    
    if (nodeType) {
      setDroppedItems(prev => [...prev, nodeType])
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Drag and Drop Test</h2>
      
      <div style={{ display: 'flex', gap: 20 }}>
        {/* Drag sources */}
        <div style={{ flex: 1 }}>
          <h3>Drag these:</h3>
          {['input', 'llm', 'output'].map(type => (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              style={{
                padding: 10,
                margin: 5,
                backgroundColor: '#3498db',
                color: 'white',
                cursor: 'move',
                borderRadius: 4
              }}
            >
              {type} node
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div style={{ flex: 2 }}>
          <h3>Drop here:</h3>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            style={{
              minHeight: 200,
              border: '2px dashed #ccc',
              borderRadius: 4,
              padding: 20,
              backgroundColor: '#f5f5f5'
            }}
          >
            <p>Dropped items:</p>
            {droppedItems.map((item, i) => (
              <div key={i} style={{ marginBottom: 5 }}>
                ✓ {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event log */}
      <div style={{ marginTop: 20 }}>
        <h3>Event Log:</h3>
        <div style={{
          height: 200,
          overflow: 'auto',
          border: '1px solid #ddd',
          padding: 10,
          fontSize: 12,
          fontFamily: 'monospace'
        }}>
          {dragEvents.map((event, i) => (
            <div key={i}>{event}</div>
          ))}
        </div>
      </div>
    </div>
  )
}