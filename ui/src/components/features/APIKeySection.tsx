import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface APIKeys {
  openai: string;
  claude: string;
  gemini: string;
  grok: string;
}

export const APIKeySection: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKeys>({
    openai: '',
    claude: '',
    gemini: '',
    grok: ''
  });
  
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    openai: false,
    claude: false,
    gemini: false,
    grok: false
  });

  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaAvailable, setOllamaAvailable] = useState(false);

  // Load saved API keys from localStorage
  useEffect(() => {
    const savedKeys = {
      openai: localStorage.getItem('openai_api_key') || '',
      claude: localStorage.getItem('claude_api_key') || '',
      gemini: localStorage.getItem('gemini_api_key') || '',
      grok: localStorage.getItem('grok_api_key') || ''
    };
    setApiKeys(savedKeys);
    
    // Check Ollama availability
    checkOllama();
  }, []);

  const checkOllama = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/ollama/models');
      if (response.ok) {
        const data = await response.json();
        setOllamaAvailable(data.available);
        if (data.models) {
          setOllamaModels(data.models.map((m: any) => m.name));
        }
      }
    } catch (error) {
      console.error('Failed to check Ollama:', error);
      setOllamaAvailable(false);
    }
  };

  const handleKeyChange = (provider: keyof APIKeys, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const saveKeys = () => {
    // Save to localStorage
    Object.entries(apiKeys).forEach(([provider, key]) => {
      if (key) {
        localStorage.setItem(`${provider}_api_key`, key);
      } else {
        localStorage.removeItem(`${provider}_api_key`);
      }
    });
    
    toast.success('API keys saved successfully!');
  };

  const clearKeys = () => {
    if (confirm('Are you sure you want to clear all API keys?')) {
      setApiKeys({
        openai: '',
        claude: '',
        gemini: '',
        grok: ''
      });
      
      // Clear from localStorage
      ['openai', 'claude', 'gemini', 'grok'].forEach(provider => {
        localStorage.removeItem(`${provider}_api_key`);
      });
      
      toast.success('API keys cleared');
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <Key size={20} className="me-2" />
          API Configuration
        </h5>
        <div>
          <button className="btn btn-sm btn-outline-primary me-2" onClick={checkOllama}>
            <RefreshCw size={16} className="me-1" />
            Check Ollama
          </button>
          <button className="btn btn-sm btn-success me-2" onClick={saveKeys}>
            <Save size={16} className="me-1" />
            Save Keys
          </button>
          <button className="btn btn-sm btn-outline-danger" onClick={clearKeys}>
            Clear All
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="row">
          {/* Cloud API Keys */}
          <div className="col-md-6">
            <h6 className="mb-3">Cloud AI Models</h6>
            
            {/* OpenAI */}
            <div className="mb-3">
              <label className="form-label">OpenAI API Key</label>
              <div className="input-group">
                <input
                  type={showKeys.openai ? "text" : "password"}
                  className="form-control"
                  placeholder="sk-..."
                  value={apiKeys.openai}
                  onChange={(e) => handleKeyChange('openai', e.target.value)}
                />
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => toggleKeyVisibility('openai')}
                >
                  {showKeys.openai ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Claude */}
            <div className="mb-3">
              <label className="form-label">Claude API Key</label>
              <div className="input-group">
                <input
                  type={showKeys.claude ? "text" : "password"}
                  className="form-control"
                  placeholder="sk-ant-..."
                  value={apiKeys.claude}
                  onChange={(e) => handleKeyChange('claude', e.target.value)}
                />
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => toggleKeyVisibility('claude')}
                >
                  {showKeys.claude ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Gemini */}
            <div className="mb-3">
              <label className="form-label">Gemini API Key</label>
              <div className="input-group">
                <input
                  type={showKeys.gemini ? "text" : "password"}
                  className="form-control"
                  placeholder="AI..."
                  value={apiKeys.gemini}
                  onChange={(e) => handleKeyChange('gemini', e.target.value)}
                />
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => toggleKeyVisibility('gemini')}
                >
                  {showKeys.gemini ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Grok */}
            <div className="mb-3">
              <label className="form-label">Grok API Key</label>
              <div className="input-group">
                <input
                  type={showKeys.grok ? "text" : "password"}
                  className="form-control"
                  placeholder="xai-..."
                  value={apiKeys.grok}
                  onChange={(e) => handleKeyChange('grok', e.target.value)}
                />
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => toggleKeyVisibility('grok')}
                >
                  {showKeys.grok ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Ollama Status */}
          <div className="col-md-6">
            <h6 className="mb-3">Local AI Models (Ollama)</h6>
            
            {ollamaAvailable ? (
              <>
                <div className="alert alert-success">
                  <strong>✅ Ollama Connected</strong>
                  <p className="mb-0 mt-2">
                    {ollamaModels.length} models available
                  </p>
                </div>
                
                <div className="mt-3">
                  <label className="form-label">Available Models:</label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {ollamaModels.map(model => (
                      <div key={model} className="badge bg-primary me-2 mb-2">
                        {model}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="alert alert-warning">
                <strong>⚠️ Ollama Not Connected</strong>
                <p className="mb-0 mt-2">
                  Make sure Ollama is running on port 11434
                </p>
                <small>Run: <code>ollama serve</code></small>
              </div>
            )}
          </div>
        </div>

        {/* Status Summary */}
        <div className="mt-4 pt-3 border-top">
          <div className="row">
            <div className="col">
              <small className="text-muted">
                <strong>Configured APIs:</strong>{' '}
                {Object.entries(apiKeys).filter(([_, key]) => key).map(([provider]) => (
                  <span key={provider} className="badge bg-success me-1">
                    {provider}
                  </span>
                ))}
                {Object.entries(apiKeys).filter(([_, key]) => key).length === 0 && (
                  <span className="text-warning">None configured</span>
                )}
              </small>
            </div>
            <div className="col text-end">
              <small className="text-muted">
                {ollamaAvailable && (
                  <span className="text-success">
                    + {ollamaModels.length} Ollama models
                  </span>
                )}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};