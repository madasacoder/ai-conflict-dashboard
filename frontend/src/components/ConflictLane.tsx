
import React from 'react';
import SuggestionCard from './SuggestionCard';

const ConflictLane: React.FC = () => {
  return (
    <div className="bg-red-50 p-4 rounded shadow">
      <h2 className="text-xl font-semibold text-red-700 mb-2">Conflicts</h2>
      <SuggestionCard type="conflict" />
    </div>
  );
};

export default ConflictLane;
