import React from 'react';
import { useUIStore } from '../../state/uiStore';

export const ResultsSection: React.FC = () => {
  const { responses } = useUIStore();

  if (Object.keys(responses).length === 0) {
    return null;
  }

  return (
    <div className="row mt-4">
      {Object.entries(responses).map(([provider, response]) => (
        <div className="col-md-6 mb-4" key={provider}>
          <div className="card h-100">
            <div className="card-header">{provider}</div>
            <div className="card-body">
              <pre>{response}</pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
