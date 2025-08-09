import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Play, 
  RefreshCw, 
  Server, 
  Database,
  Zap,
  ChevronRight,
  ChevronLeft,
  Activity,
  Key,
  Workflow,
  Terminal,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ServiceStatus {
  backend: 'running' | 'stopped' | 'error';
  ollama: 'running' | 'stopped' | 'error';
  frontend: 'running' | 'stopped' | 'error';
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  onViewChange: (view: 'workflow' | 'dashboard' | 'settings') => void;
  currentView: 'workflow' | 'dashboard' | 'settings';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  onViewChange,
  currentView 
}) => {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    backend: 'stopped',
    ollama: 'stopped',
    frontend: 'running'
  });
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);

  // Check service status
  const checkServices = async () => {
    // Check backend
    try {
      const backendRes = await fetch('http://localhost:8000/api/health');
      if (backendRes.ok) {
        const data = await backendRes.json();
        setServiceStatus(prev => ({
          ...prev,
          backend: 'running',
          ollama: data.ollama?.available ? 'running' : 'stopped'
        }));
        
        if (data.ollama?.models) {
          setOllamaModels(data.ollama.models);
        }
      } else {
        setServiceStatus(prev => ({ ...prev, backend: 'error' }));
      }
    } catch (error) {
      setServiceStatus(prev => ({ ...prev, backend: 'stopped' }));
    }
  };

  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const restartBackend = async () => {
    toast.loading('Restarting backend...');
    try {
      await fetch('http://localhost:8000/api/restart', { method: 'POST' });
      setTimeout(() => {
        checkServices();
        toast.success('Backend restarted successfully');
      }, 2000);
    } catch (error) {
      toast.error('Failed to restart backend');
    }
  };

  const getStatusIcon = (status: 'running' | 'stopped' | 'error') => {
    switch (status) {
      case 'running':
        return <CheckCircle size={16} className="text-success" />;
      case 'stopped':
        return <XCircle size={16} className="text-danger" />;
      case 'error':
        return <AlertCircle size={16} className="text-warning" />;
    }
  };

  const getStatusColor = (status: 'running' | 'stopped' | 'error') => {
    switch (status) {
      case 'running': return 'success';
      case 'stopped': return 'danger';
      case 'error': return 'warning';
    }
  };

  return (
    <div className="d-flex" style={{ height: '100vh' }}>
      {/* Sidebar */}
      <div 
        className={`bg-dark text-white d-flex flex-column ${sidebarCollapsed ? '' : 'p-3'}`}
        style={{
          width: sidebarCollapsed ? '60px' : '280px',
          transition: 'width 0.3s ease',
          overflow: 'hidden'
        }}
      >
        {/* Sidebar Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          {!sidebarCollapsed && (
            <h5 className="mb-0 d-flex align-items-center">
              <Zap size={24} className="me-2 text-warning" />
              AI Dashboard
            </h5>
          )}
          <button
            className="btn btn-sm btn-dark"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mb-4">
          <button
            className={`btn btn-dark w-100 text-start mb-2 ${currentView === 'workflow' ? 'bg-primary' : ''}`}
            onClick={() => onViewChange('workflow')}
          >
            <Workflow size={20} className={sidebarCollapsed ? '' : 'me-2'} />
            {!sidebarCollapsed && 'Workflow Builder'}
          </button>
          <button
            className={`btn btn-dark w-100 text-start mb-2 ${currentView === 'dashboard' ? 'bg-primary' : ''}`}
            onClick={() => onViewChange('dashboard')}
          >
            <Terminal size={20} className={sidebarCollapsed ? '' : 'me-2'} />
            {!sidebarCollapsed && 'Text Analysis'}
          </button>
          <button
            className={`btn btn-dark w-100 text-start ${currentView === 'settings' ? 'bg-primary' : ''}`}
            onClick={() => onViewChange('settings')}
          >
            <Settings size={20} className={sidebarCollapsed ? '' : 'me-2'} />
            {!sidebarCollapsed && 'Settings'}
          </button>
        </nav>

        {/* Service Status */}
        {!sidebarCollapsed && (
          <div className="border-top pt-3 mt-auto">
            <h6 className="text-muted mb-3">Service Status</h6>
            
            {/* Backend Status */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center">
                <Server size={16} className="me-2" />
                <span>Backend</span>
              </div>
              <div className="d-flex align-items-center">
                {getStatusIcon(serviceStatus.backend)}
                <button
                  className="btn btn-sm btn-outline-light ms-2 py-0"
                  onClick={restartBackend}
                  title="Restart Backend"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Ollama Status */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center">
                <Database size={16} className="me-2" />
                <span>Ollama</span>
              </div>
              <div className="d-flex align-items-center">
                {getStatusIcon(serviceStatus.ollama)}
                {serviceStatus.ollama === 'running' && (
                  <span className="badge bg-success ms-2">{ollamaModels.length}</span>
                )}
              </div>
            </div>

            {/* Frontend Status */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center">
                <Activity size={16} className="me-2" />
                <span>Frontend</span>
              </div>
              {getStatusIcon(serviceStatus.frontend)}
            </div>

            {/* Quick Actions */}
            <div className="mt-3 pt-3 border-top">
              <button
                className="btn btn-sm btn-outline-light w-100 mb-2"
                onClick={checkServices}
              >
                <RefreshCw size={14} className="me-1" />
                Refresh Status
              </button>
              
              {serviceStatus.ollama === 'stopped' && (
                <div className="alert alert-warning py-1 px-2 small">
                  <small>Run: <code>ollama serve</code></small>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Top Bar */}
        <div className="bg-light border-bottom px-4 py-2">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <h4 className="mb-0 me-3">
                {currentView === 'workflow' && '🔄 Workflow Builder'}
                {currentView === 'dashboard' && '📊 Text Analysis Dashboard'}
                {currentView === 'settings' && '⚙️ Settings & Configuration'}
              </h4>
              
              {/* Status Pills */}
              <div className="d-flex gap-2">
                <span className={`badge bg-${getStatusColor(serviceStatus.backend)}`}>
                  Backend: {serviceStatus.backend}
                </span>
                <span className={`badge bg-${getStatusColor(serviceStatus.ollama)}`}>
                  Ollama: {serviceStatus.ollama}
                  {serviceStatus.ollama === 'running' && ` (${ollamaModels.length} models)`}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="d-flex gap-2">
              {currentView === 'workflow' && (
                <>
                  <button className="btn btn-sm btn-success">
                    <Play size={16} className="me-1" />
                    Execute
                  </button>
                  <button className="btn btn-sm btn-outline-secondary">
                    Save
                  </button>
                </>
              )}
              
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow-1 overflow-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};