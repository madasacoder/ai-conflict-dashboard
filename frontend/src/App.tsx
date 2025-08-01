
import React from 'react';
import ConsensusLane from './components/ConsensusLane';
import UniqueInsightsLane from './components/UniqueInsightsLane';
import ConflictLane from './components/ConflictLane';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">AI Conflict Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ConsensusLane />
        <UniqueInsightsLane />
        <ConflictLane />
      </div>
    </div>
  );
};

export default App;
