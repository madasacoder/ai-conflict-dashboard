import React, { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import './styles/App.css'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState(null)

  useEffect(() => {
    // Check API health on startup
    checkApiHealth()
  }, [])

  const checkApiHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/health')
      const data = await response.json()
      setApiStatus(data)
      setIsLoading(false)
      toast.success('Connected to backend API')
    } catch (error) {
      console.error('API health check failed:', error)
      setApiStatus({ status: 'error', message: error.message })
      setIsLoading(false)
      toast.error('Failed to connect to backend API')
    }
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Initializing AI Conflict Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <Toaster position="top-right" />
      
      <header className="app-header">
        <h1>AI Conflict Dashboard</h1>
        <span className="version">v0.1.0 - Desktop Edition</span>
      </header>

      <main className="app-main">
        <div className="welcome-card">
          <h2>Welcome to AI Conflict Dashboard Desktop</h2>
          <p>
            A powerful tool for orchestrating multiple AI models with a visual workflow builder.
          </p>
          
          <div className="status-card">
            <h3>System Status</h3>
            <div className="status-item">
              <span className="status-label">API Status:</span>
              <span className={`status-value ${apiStatus?.status === 'healthy' ? 'healthy' : 'error'}`}>
                {apiStatus?.status || 'Unknown'}
              </span>
            </div>
            {apiStatus?.message && (
              <div className="status-item">
                <span className="status-label">Message:</span>
                <span className="status-value">{apiStatus.message}</span>
              </div>
            )}
          </div>

          <div className="quick-start">
            <h3>Quick Start</h3>
            <ol>
              <li>Add your API keys in Settings</li>
              <li>Create a new workflow or use a template</li>
              <li>Drag and drop nodes to build your workflow</li>
              <li>Run and compare results from multiple AI models</li>
            </ol>
          </div>

          <div className="features">
            <h3>Key Features</h3>
            <ul>
              <li>✨ Visual workflow builder with React Flow</li>
              <li>🤖 Support for OpenAI, Claude, Gemini, Grok, and Ollama</li>
              <li>💾 Local-first with SQLite storage</li>
              <li>🌐 Works offline with Ollama</li>
              <li>💰 Real-time cost tracking</li>
              <li>🎨 Beautiful, responsive UI</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>AI Conflict Dashboard © 2025</p>
      </footer>
    </div>
  )
}

export default App