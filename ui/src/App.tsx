import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ReactFlowProvider } from 'reactflow';
import { WorkflowBuilderFixed } from './components/WorkflowBuilderFixed';
import { InputSection } from './components/features/InputSection';
import { ResultsSection } from './components/features/ResultsSection';
import './styles/App.css';
import 'reactflow/dist/style.css';

function App(): JSX.Element {
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);

  return (
    <div className="container-fluid py-4">
      <Toaster position="top-right" />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="flex-grow-1">
          <h1 className="text-center mb-2">AI Conflict Dashboard</h1>
          <p className="text-center text-muted mb-0">
            Compare responses from multiple AI models side-by-side
          </p>
        </div>
      </div>
      
      {/* Launch button for workflow builder */}
      <div className="text-center mb-4">
        <button 
          className="btn btn-primary btn-lg"
          onClick={() => setShowWorkflowBuilder(!showWorkflowBuilder)}
        >
          {showWorkflowBuilder ? 'Hide' : 'Launch'} Workflow Builder
        </button>
      </div>

      {showWorkflowBuilder ? (
        <ReactFlowProvider>
          <div 
            id="workflow-builder" 
            data-testid="workflow-builder" 
            className="workflow-builder"
            style={{ height: '80vh', border: '1px solid #ddd', borderRadius: '8px' }}
          >
            <WorkflowBuilderFixed />
          </div>
        </ReactFlowProvider>
      ) : (
        <>
          <InputSection />
          <ResultsSection />
        </>
      )}
    </div>
  );
}

export default App;