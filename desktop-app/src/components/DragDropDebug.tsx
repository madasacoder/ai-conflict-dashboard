/**
 * DragDropDebug - Diagnostic component for drag-and-drop issues
 */

import React, { useState, useCallback } from 'react'

export const DragDropDebug: React.FC = () => {
  const [dragEvents, setDragEvents] = useState<string[]>([])
  const [dropData, setDropData] = useState<any>(null)

  const addEvent = (event: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1]
    const message = data ? `${timestamp} - ${event}: ${JSON.stringify(data)}` : `${timestamp} - ${event}`
    setDragEvents(prev => [...prev.slice(-19), message])
  }

  const onDragStart = useCallback((e: React.DragEvent) => {
    addEvent('dragStart', {
      dataTransfer: {
        effectAllowed: e.dataTransfer.effectAllowed,
        dropEffect: e.dataTransfer.dropEffect,
        types: Array.from(e.dataTransfer.types)
      }
    })
    
    // Set data in multiple ways
    e.dataTransfer.setData('text/plain', 'test-node')
    e.dataTransfer.setData('application/reactflow', 'test-node')
    e.dataTransfer.setData('text', 'test-node')
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    addEvent('dragOver', {
      clientX: e.clientX,
      clientY: e.clientY,
      dropEffect: e.dataTransfer.dropEffect,
      types: Array.from(e.dataTransfer.types)
    })
    
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Try all possible ways to get data
    const data = {
      textPlain: e.dataTransfer.getData('text/plain'),
      text: e.dataTransfer.getData('text'),
      reactflow: e.dataTransfer.getData('application/reactflow'),
      types: Array.from(e.dataTransfer.types),
      files: Array.from(e.dataTransfer.files).map(f => f.name),
      items: Array.from(e.dataTransfer.items).map(item => ({
        kind: item.kind,
        type: item.type
      }))
    }
    
    setDropData(data)
    addEvent('drop', data)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: 600,
      maxHeight: 400,
      background: 'rgba(0, 0, 0, 0.9)',
      color: '#0f0',
      padding: 20,
      borderRadius: 8,
      fontFamily: 'monospace',
      fontSize: 12,
      overflow: 'auto',
      zIndex: 9999
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Drag & Drop Debug</h3>
      
      <div style={{ marginBottom: 20 }}>
        <div
          draggable
          onDragStart={onDragStart}
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: '#333',
            border: '2px dashed #0f0',
            cursor: 'grab',
            marginRight: 20
          }}
        >
          Drag Me
        </div>
        
        <div
          onDragOver={onDragOver}
          onDrop={onDrop}
          style={{
            display: 'inline-block',
            padding: '20px 40px',
            background: '#222',
            border: '2px dashed #f0f',
            minHeight: 60
          }}
        >
          Drop Here
        </div>
      </div>
      
      {dropData && (
        <div style={{ marginBottom: 20 }}>
          <h4>Last Drop Data:</h4>
          <pre>{JSON.stringify(dropData, null, 2)}</pre>
        </div>
      )}
      
      <div>
        <h4>Event Log:</h4>
        {dragEvents.map((event, i) => (
          <div key={i} style={{ marginBottom: 2 }}>{event}</div>
        ))}
      </div>
    </div>
  )
}