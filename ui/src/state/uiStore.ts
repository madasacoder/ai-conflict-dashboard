import { create } from 'zustand';
import { analyzeText, AnalyzeRequest } from '../services/api';

interface UIState {
  inputText: string;
  responses: Record<string, string>;
  isLoading: boolean;
  
  setInputText: (text: string) => void;
  setResponse: (provider: string, response: string) => void;
  setLoading: (isLoading: boolean) => void;
  clearResponses: () => void;
  analyzeText: () => Promise<void>;
}

export const useUIStore = create<UIState>((set, get) => ({
  inputText: '',
  responses: {},
  isLoading: false,
  
  setInputText: (text) => set({ inputText: text }),
  
  setResponse: (provider, response) => set((state) => ({
    responses: {
      ...state.responses,
      [provider]: response,
    },
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  clearResponses: () => set({ responses: {}, inputText: '' }),
  
  analyzeText: async () => {
    const { inputText } = get();
    if (!inputText) return;

    set({ isLoading: true, responses: {} });
    try {
      const request: AnalyzeRequest = { text: inputText };
      const response = await analyzeText(request);
      set({ responses: response.responses });
    } catch (error) {
      // We will handle errors more gracefully in a later step
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
