import React from 'react';
import { Toaster } from 'react-hot-toast';
import { InputSection } from './components/features/InputSection';
import { ResultsSection } from './components/features/ResultsSection';
import './styles/App.css';

function App(): JSX.Element {
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
      <InputSection />
      <ResultsSection />
    </div>
  );
}

export default App;
