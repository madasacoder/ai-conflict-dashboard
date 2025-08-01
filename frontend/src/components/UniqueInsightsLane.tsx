
import React from 'react';
import SuggestionCard from './SuggestionCard';

const UniqueInsightsLane: React.FC = () => {
  return (
    <div className="bg-yellow-50 p-4 rounded shadow">
      <h2 className="text-xl font-semibold text-yellow-700 mb-2">Unique Insights</h2>
      <SuggestionCard type="unique" />
    </div>
  );
};

export default UniqueInsightsLane;
