/**
 * localStorage utilities with error handling and type safety
 */

interface StorageOptions {
  defaultValue?: any
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

export class LocalStorage {
  /**
   * Get item from localStorage with type safety and error handling
   */
  static get<T>(key: string, options: StorageOptions = {}): T | null {
    try {
      const item = localStorage.getItem(key)
      
      if (item === null) {
        return options.defaultValue || null
      }
      
      const deserialize = options.deserialize || JSON.parse
      return deserialize(item)
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error)
      return options.defaultValue || null
    }
  }
  
  /**
   * Set item in localStorage with error handling
   */
  static set(key: string, value: any, options: StorageOptions = {}): boolean {
    try {
      const serialize = options.serialize || JSON.stringify
      localStorage.setItem(key, serialize(value))
      return true
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error)
      return false
    }
  }
  
  /**
   * Remove item from localStorage
   */
  static remove(key: string): boolean {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
      return false
    }
  }
  
  /**
   * Clear all localStorage
   */
  static clear(): boolean {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  }
  
  /**
   * Get all keys in localStorage
   */
  static keys(): string[] {
    try {
      return Object.keys(localStorage)
    } catch (error) {
      console.error('Error getting localStorage keys:', error)
      return []
    }
  }
}

// Storage keys for the app
export const STORAGE_KEYS = {
  CURRENT_WORKFLOW: 'aicd_current_workflow',
  WORKFLOW_NODES: 'aicd_workflow_nodes',
  WORKFLOW_EDGES: 'aicd_workflow_edges',
  UI_THEME: 'aicd_theme',
  UI_PALETTE_OPEN: 'aicd_palette_open',
  API_KEYS: 'aicd_api_keys',
  RECENT_WORKFLOWS: 'aicd_recent_workflows',
  WORKFLOW_TEMPLATES: 'aicd_templates',
  USER_PREFERENCES: 'aicd_preferences',
  EXECUTION_HISTORY: 'aicd_execution_history'
} as const

// Type-safe storage functions for specific data
export const WorkflowStorage = {
  saveWorkflow: (workflow: any, nodes: any[], edges: any[]) => {
    LocalStorage.set(STORAGE_KEYS.CURRENT_WORKFLOW, workflow)
    LocalStorage.set(STORAGE_KEYS.WORKFLOW_NODES, nodes)
    LocalStorage.set(STORAGE_KEYS.WORKFLOW_EDGES, edges)
  },
  
  loadWorkflow: () => {
    return {
      workflow: LocalStorage.get(STORAGE_KEYS.CURRENT_WORKFLOW),
      nodes: LocalStorage.get(STORAGE_KEYS.WORKFLOW_NODES, { defaultValue: [] }),
      edges: LocalStorage.get(STORAGE_KEYS.WORKFLOW_EDGES, { defaultValue: [] })
    }
  },
  
  clearWorkflow: () => {
    LocalStorage.remove(STORAGE_KEYS.CURRENT_WORKFLOW)
    LocalStorage.remove(STORAGE_KEYS.WORKFLOW_NODES)
    LocalStorage.remove(STORAGE_KEYS.WORKFLOW_EDGES)
  }
}

export const UIStorage = {
  saveTheme: (theme: 'light' | 'dark') => {
    LocalStorage.set(STORAGE_KEYS.UI_THEME, theme)
  },
  
  loadTheme: (): 'light' | 'dark' => {
    const theme = LocalStorage.get<string | null>(STORAGE_KEYS.UI_THEME, { defaultValue: 'dark' })
    return (theme === 'light' || theme === 'dark') ? theme : 'dark'
  },
  
  savePaletteState: (isOpen: boolean) => {
    LocalStorage.set(STORAGE_KEYS.UI_PALETTE_OPEN, isOpen)
  },
  
  loadPaletteState: (): boolean => {
    const value = LocalStorage.get<boolean | null>(STORAGE_KEYS.UI_PALETTE_OPEN, { defaultValue: true })
    return typeof value === 'boolean' ? value : true
  }
}