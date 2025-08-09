// Removed unused UIState import to satisfy strict type-check

export interface AnalyzeRequest {
  text: string;
  // We will add model selections and API keys here later
}

export interface AnalyzeResponse {
  responses: Record<string, string>;
}

export const analyzeText = async (request: AnalyzeRequest): Promise<AnalyzeResponse> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Analysis failed');
  }

  return response.json();
};
