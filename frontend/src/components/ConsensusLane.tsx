
import React from 'react';
import SuggestionCard from './SuggestionCard';

const ConsensusLane: React.FC = () => {
  return (
    <div className="bg-green-50 p-4 rounded shadow">
      <h2 className="text-xl font-semibold text-green-700 mb-2">Consensus Suggestions</h2>
      <SuggestionCard type="consensus" />
    </div>
  );
};

export default ConsensusLane;
