import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ReactFlowProvider } from 'reactflow';
import { WorkflowBuilderFixed } from './components/WorkflowBuilderFixed';
import { InputSection } from './components/features/InputSection';
import { ResultsSection } from './components/features/ResultsSection';
import { APIKeySection } from './components/features/APIKeySection';
import { DashboardLayout } from './components/layout/DashboardLayout';
import './styles/App.css';
import 'reactflow/dist/style.css';

function App(): JSX.Element {
  const [currentView, setCurrentView] = useState<'workflow' | 'dashboard' | 'settings'>('workflow');

  const renderContent = () => {
    switch (currentView) {
      case 'workflow':
        return (
          <ReactFlowProvider>
            <div 
              id="workflow-builder" 
              data-testid="workflow-builder" 
              className="workflow-builder-container"
              style={{ height: 'calc(100vh - 120px)', border: '1px solid #ddd', borderRadius: '8px' }}
            >
              <WorkflowBuilderFixed />
            </div>
          </ReactFlowProvider>
        );
      
      case 'dashboard':
        return (
          <>
            <InputSection />
            <ResultsSection />
          </>
        );
      
      case 'settings':
        return <APIKeySection />;
      
      default:
        return null;
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <DashboardLayout 
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        {renderContent()}
      </DashboardLayout>
    </>
  );
}

export default App;