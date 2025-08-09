/**
 * Ollama Service
 * Handles communication with local Ollama instance
 */

import toast from 'react-hot-toast'

export interface OllamaModel {
  name: string
  size: string
  digest: string
  modified: string
  details?: {
    family: string
    parameter_size: string
    quantization_level: string
  }
}

export interface OllamaResponse {
  model: string
  created_at: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

export class OllamaService {
  private baseUrl: string
  private isAvailable: boolean = false
  private models: OllamaModel[] = []
  
  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl
    this.checkAvailability()
  }
  
  /**
   * Check if Ollama is running and available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        this.models = data.models || []
        this.isAvailable = true
        console.log('Ollama is available with models:', this.models.map(m => m.name))
        return true
      }
    } catch (error) {
      console.warn('Ollama is not available:', error)
      this.isAvailable = false
    }
    
    return false
  }
  
  /**
   * Get list of available models
   */
  async getModels(): Promise<OllamaModel[]> {
    if (!this.isAvailable) {
      await this.checkAvailability()
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        this.models = data.models || []
        return this.models
      }
    } catch (error) {
      console.error('Failed to fetch Ollama models:', error)
    }
    
    return []
  }
  
  /**
   * Pull a model if not available
   */
  async pullModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      })
      
      if (response.ok) {
        // Stream the response to show progress
        const reader = response.body?.getReader()
        if (reader) {
          let done = false
          while (!done) {
            const { value, done: readerDone } = await reader.read()
            done = readerDone
            
            if (value) {
              const text = new TextDecoder().decode(value)
              const lines = text.split('\n').filter(Boolean)
              
              for (const line of lines) {
                try {
                  const data = JSON.parse(line)
                  if (data.status) {
                    console.log(`Pulling ${modelName}: ${data.status}`)
                    if (data.completed && data.total) {
                      const progress = Math.round((data.completed / data.total) * 100)
                      toast.loading(`Downloading ${modelName}: ${progress}%`)
                    }
                  }
                } catch (e) {
                  // Ignore JSON parse errors
                }
              }
            }
          }
        }
        
        toast.success(`Model ${modelName} is ready`)
        return true
      }
    } catch (error) {
      console.error('Failed to pull model:', error)
      toast.error(`Failed to download ${modelName}`)
    }
    
    return false
  }
  
  /**
   * Generate completion using Ollama
   */
  async generate(
    model: string,
    prompt: string,
    options?: {
      temperature?: number
      max_tokens?: number
      stream?: boolean
      context?: number[]
    }
  ): Promise<OllamaResponse> {
    if (!this.isAvailable) {
      const available = await this.checkAvailability()
      if (!available) {
        throw new Error('Ollama service is not available. Please ensure Ollama is running locally.')
      }
    }
    
    // Check if model exists
    const modelExists = this.models.some(m => m.name === model || m.name.startsWith(model))
    if (!modelExists) {
      toast.warning(`Model ${model} not found. Attempting to download...`)
      const pulled = await this.pullModel(model)
      if (!pulled) {
        throw new Error(`Failed to download model ${model}`)
      }
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: options?.stream || false,
          options: {
            temperature: options?.temperature || 0.7,
            num_predict: options?.max_tokens || 2048
          },
          context: options?.context
        })
      })
      
      if (!response.ok) {
        throw new Error(`Ollama generate failed: ${response.statusText}`)
      }
      
      if (options?.stream) {
        // Handle streaming response
        return this.handleStreamingResponse(response)
      } else {
        // Handle non-streaming response
        const data = await response.json()
        return data as OllamaResponse
      }
    } catch (error) {
      console.error('Ollama generation failed:', error)
      throw error
    }
  }
  
  /**
   * Handle streaming response from Ollama
   */
  private async handleStreamingResponse(response: Response): Promise<OllamaResponse> {
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }
    
    let fullResponse = ''
    let lastData: any = {}
    
    try {
      let done = false
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        
        if (value) {
          const text = new TextDecoder().decode(value)
          const lines = text.split('\n').filter(Boolean)
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              if (data.response) {
                fullResponse += data.response
              }
              lastData = { ...lastData, ...data }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
    
    return {
      ...lastData,
      response: fullResponse,
      done: true
    } as OllamaResponse
  }
  
  /**
   * Chat with Ollama (for conversational models)
   */
  async chat(
    model: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: {
      temperature?: number
      max_tokens?: number
      stream?: boolean
    }
  ): Promise<OllamaResponse> {
    if (!this.isAvailable) {
      const available = await this.checkAvailability()
      if (!available) {
        throw new Error('Ollama service is not available')
      }
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: options?.stream || false,
          options: {
            temperature: options?.temperature || 0.7,
            num_predict: options?.max_tokens || 2048
          }
        })
      })
      
      if (!response.ok) {
        throw new Error(`Ollama chat failed: ${response.statusText}`)
      }
      
      if (options?.stream) {
        return this.handleStreamingResponse(response)
      } else {
        const data = await response.json()
        return {
          model: data.model,
          created_at: data.created_at,
          response: data.message?.content || '',
          done: data.done || true
        } as OllamaResponse
      }
    } catch (error) {
      console.error('Ollama chat failed:', error)
      throw error
    }
  }
  
  /**
   * Get embeddings from Ollama
   */
  async embeddings(model: string, prompt: string): Promise<number[]> {
    if (!this.isAvailable) {
      await this.checkAvailability()
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt
        })
      })
      
      if (!response.ok) {
        throw new Error(`Ollama embeddings failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.embedding || []
    } catch (error) {
      console.error('Ollama embeddings failed:', error)
      throw error
    }
  }
  
  /**
   * Check if Ollama is available
   */
  getAvailability(): boolean {
    return this.isAvailable
  }
  
  /**
   * Get cached models
   */
  getCachedModels(): OllamaModel[] {
    return this.models
  }
  
  /**
   * Format model name for display
   */
  formatModelName(model: OllamaModel): string {
    const parts = model.name.split(':')
    const baseName = parts[0]
    const tag = parts[1] || 'latest'
    
    // Convert size to human-readable format
    const sizeInGB = model.size ? (parseInt(model.size) / 1e9).toFixed(1) : '?'
    
    return `${baseName} (${tag}, ${sizeInGB}GB)`
  }
}

// Export singleton instance
export const ollamaService = new OllamaService()