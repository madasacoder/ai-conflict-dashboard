/**
 * Network Utilities
 * Handles timeout, retry, and slow network conditions
 */

import toast from 'react-hot-toast'

export interface NetworkConfig {
  timeout?: number
  retries?: number
  retryDelay?: number
  onRetry?: (attempt: number, error: Error) => void
  onTimeout?: () => void
  slowNetworkThreshold?: number
  onSlowNetwork?: () => void
}

const DEFAULT_CONFIG: NetworkConfig = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  slowNetworkThreshold: 5000 // 5 seconds
}

/**
 * Create an AbortController with timeout
 */
export function createTimeoutController(timeout: number): AbortController {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeout)
  return controller
}

/**
 * Fetch with timeout support
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const timeout = options.timeout || DEFAULT_CONFIG.timeout!
  const controller = createTimeoutController(timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } catch (error) {
    const e = error as any
    if (e && e.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw (error as Error)
  }
}

/**
 * Fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: NetworkConfig = {}
): Promise<Response> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= mergedConfig.retries!; attempt++) {
    try {
      // Add slow network detection
      const slowNetworkTimer = setTimeout(() => {
        if (mergedConfig.onSlowNetwork) {
          mergedConfig.onSlowNetwork()
        } else {
          toast.loading('Slow network detected... Please wait')
        }
      }, mergedConfig.slowNetworkThreshold!)
      
      const init: RequestInit & { timeout?: number } = { ...options }
      if (typeof mergedConfig.timeout !== 'undefined') {
        init.timeout = mergedConfig.timeout
      }
      const response = await fetchWithTimeout(url, init)
      
      clearTimeout(slowNetworkTimer)
      toast.dismiss() // Clear any loading toasts
      
      // Don't retry on successful responses
      if (response.ok) {
        return response
      }
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response
      }
      
      // Server error (5xx) - should retry
      throw new Error(`Server error: ${response.status} ${response.statusText}`)
      
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on the last attempt
      if (attempt === mergedConfig.retries) {
        break
      }
      
      // Call retry callback
      if (mergedConfig.onRetry) {
        mergedConfig.onRetry(attempt, lastError)
      } else {
        console.warn(`Retry attempt ${attempt}/${mergedConfig.retries} after error:`, lastError.message)
        toast.error(`Connection failed. Retrying... (${attempt}/${mergedConfig.retries})`)
      }
      
      // Wait before retrying with exponential backoff
      const delay = mergedConfig.retryDelay! * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  // All retries failed
  if (mergedConfig.onTimeout && lastError?.message.includes('timeout')) {
    mergedConfig.onTimeout()
  }
  
  throw lastError || new Error('Request failed after all retries')
}

/**
 * Create a race between multiple fetch requests
 */
export async function fetchRace(
  urls: string[],
  options: RequestInit = {}
): Promise<Response> {
  const promises = urls.map(url => fetchWithTimeout(url, options))
  
  try {
    const response = await Promise.race(promises)
    return response
  } catch (error) {
    throw new Error('All requests failed or timed out')
  }
}

/**
 * Batch fetch requests with concurrency control
 */
export async function fetchBatch<T>(
  requests: Array<{ url: string; options?: RequestInit }>,
  concurrency: number = 3
): Promise<Array<{ success: boolean; data?: T; error?: Error }>> {
  const results: Array<{ success: boolean; data?: T; error?: Error }> = []
  const queue = [...requests]
  const inProgress: Promise<void>[] = []
  
  while (queue.length > 0 || inProgress.length > 0) {
    // Start new requests up to concurrency limit
    while (inProgress.length < concurrency && queue.length > 0) {
      const request = queue.shift()!
      
      const promise = fetchWithRetry(request.url, request.options)
        .then(async response => {
          if (response.ok) {
            const data = await response.json()
            results.push({ success: true, data })
          } else {
            results.push({ 
              success: false, 
              error: new Error(`HTTP ${response.status}: ${response.statusText}`) 
            })
          }
        })
        .catch((error: any) => {
          results.push({ success: false, error: error as Error })
        })
      
      inProgress.push(promise)
      
      // Remove completed promises
      promise.finally(() => {
        const index = inProgress.indexOf(promise)
        if (index > -1) {
          inProgress.splice(index, 1)
        }
      })
    }
    
    // Wait for at least one to complete
    if (inProgress.length > 0) {
      await Promise.race(inProgress)
    }
  }
  
  return results
}

/**
 * Monitor network speed
 */
export class NetworkMonitor {
  private static instance: NetworkMonitor
  private isSlowNetwork: boolean = false
  private listeners: Set<(isSlow: boolean) => void> = new Set()
  
  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor()
    }
    return NetworkMonitor.instance
  }
  
  private constructor() {
    // Monitor network changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      connection.addEventListener('change', () => {
        this.checkNetworkSpeed()
      })
      
      this.checkNetworkSpeed()
    }
  }
  
  private checkNetworkSpeed() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      const effectiveType = connection.effectiveType
      
      // Consider 2g and slow-2g as slow
      const wasSlowNetwork = this.isSlowNetwork
      this.isSlowNetwork = effectiveType === '2g' || effectiveType === 'slow-2g'
      
      if (wasSlowNetwork !== this.isSlowNetwork) {
        this.notifyListeners()
      }
    }
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isSlowNetwork))
  }
  
  onNetworkChange(listener: (isSlow: boolean) => void) {
    this.listeners.add(listener)
    // Immediately notify of current state
    listener(this.isSlowNetwork)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }
  
  isNetworkSlow(): boolean {
    return this.isSlowNetwork
  }
  
  /**
   * Measure actual network latency
   */
  async measureLatency(url: string = '/api/health'): Promise<number> {
    const start = performance.now()
    
    try {
      await fetch(url, { method: 'HEAD' })
      const latency = performance.now() - start
      return latency
    } catch (error) {
      return -1 // Network error
    }
  }
  
  /**
   * Adaptive timeout based on network conditions
   */
  getAdaptiveTimeout(): number {
    if (this.isSlowNetwork) {
      return 60000 // 60 seconds for slow networks
    }
    return 30000 // 30 seconds for normal networks
  }
}

/**
 * Create a debounced network request
 */
export function createDebouncedFetch(
  fetchFn: (...args: any[]) => Promise<any>,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (...args: any[]): Promise<any> => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    // Create new promise
    const promise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fetchFn(...args)
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
        }
      }, delay)
    })
    
    return promise
  }
}

// Export singleton monitor instance
export const networkMonitor = NetworkMonitor.getInstance()