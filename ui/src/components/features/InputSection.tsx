import React from 'react';
import { Button } from '../common/Button';
import { TextArea } from '../common/TextArea';
import { useUIStore } from '../../state/uiStore';

export const InputSection: React.FC = () => {
  const { inputText, setInputText, isLoading, clearResponses, analyzeText } = useUIStore();

  const handleAnalyze = async () => {
    await analyzeText();
  };

  const handleClear = () => {
    setInputText('');
    clearResponses();
  };

  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            <TextArea
              id="inputText"
              label="Enter your text:"
              rows={6}
              placeholder="Enter text to analyze or combine multiple files"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="d-flex justify-content-end align-items-center mt-2">
              <Button variant="secondary" className="me-2" onClick={handleClear}>Clear</Button>
              <Button variant="primary" onClick={handleAnalyze} isLoading={isLoading}>Analyze</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
