
import React from 'react';

interface SuggestionCardProps {
  type: 'consensus' | 'unique' | 'conflict';
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ type }) => {
  const colors = {
    consensus: 'border-green-300',
    unique: 'border-yellow-300',
    conflict: 'border-red-300',
  };

  return (
    <div className={`border-l-4 ${colors[type]} p-3 bg-white shadow-sm rounded mb-3`}>
      <p className="text-sm">Original text example...</p>
      <p className="font-semibold">Suggested improvement...</p>
      <p className="text-xs text-gray-500">Reasoning provided by AI...</p>
    </div>
  );
};

export default SuggestionCard;
