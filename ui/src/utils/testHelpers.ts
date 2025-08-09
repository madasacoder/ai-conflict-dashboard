/**
 * Test Helpers
 * 
 * Utility functions to help with testing complex interactions
 * like drag and drop in a jsdom environment
 */

import { fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

/**
 * Mock DataTransfer for drag and drop testing
 * jsdom doesn't properly implement DataTransfer, so we need to mock it
 */
export class MockDataTransfer implements DataTransfer {
  private data: Record<string, string> = {}
  public items: DataTransferItemList = {} as DataTransferItemList
  public types: readonly string[] = []
  public files: FileList = {} as FileList
  public dropEffect: DataTransfer['dropEffect'] = 'none'
  public effectAllowed: DataTransfer['effectAllowed'] = 'all'

  setData(format: string, data: string): void {
    this.data[format] = data
    this.types = Object.keys(this.data)
  }

  getData(format: string): string {
    return this.data[format] || ''
  }

  clearData(format?: string): void {
    if (format) {
      delete this.data[format]
    } else {
      this.data = {}
    }
    this.types = Object.keys(this.data)
  }

  setDragImage(_image: Element, _x: number, _y: number): void {
    // Mock implementation
  }
}

/**
 * Simulate drag and drop operation
 * @param source - The element being dragged
 * @param target - The drop target element
 * @param nodeType - The type of node being dragged
 * @param dropPosition - The position to drop at
 */
export function simulateDragAndDrop(
  source: Element,
  target: Element,
  nodeType: string,
  dropPosition: { x: number; y: number } = { x: 250, y: 250 }
): void {
  // Create mock DataTransfer
  const dataTransfer = new MockDataTransfer()

  // Simulate drag start
  const dragStartEvent = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true
  })
  Object.defineProperty(dragStartEvent, 'dataTransfer', {
    value: dataTransfer,
    writable: false
  })
  fireEvent(source, dragStartEvent)

  // Set the data after drag start (simulating what the component does)
  dataTransfer.setData('application/reactflow', nodeType)
  dataTransfer.setData('text/plain', nodeType)
  dataTransfer.setData('text', nodeType)

  // Simulate drag over
  const dragOverEvent = new DragEvent('dragover', {
    bubbles: true,
    cancelable: true,
    clientX: dropPosition.x,
    clientY: dropPosition.y
  })
  Object.defineProperty(dragOverEvent, 'dataTransfer', {
    value: dataTransfer,
    writable: false
  })
  fireEvent(target, dragOverEvent)

  // Simulate drop
  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    clientX: dropPosition.x,
    clientY: dropPosition.y
  })
  Object.defineProperty(dropEvent, 'dataTransfer', {
    value: dataTransfer,
    writable: false
  })
  fireEvent(target, dropEvent)

  // Simulate drag end
  const dragEndEvent = new DragEvent('dragend', {
    bubbles: true,
    cancelable: true
  })
  Object.defineProperty(dragEndEvent, 'dataTransfer', {
    value: dataTransfer,
    writable: false
  })
  fireEvent(source, dragEndEvent)
}

/**
 * Get node type from palette label
 */
export function getNodeTypeFromLabel(label: string): string {
  const typeMap: Record<string, string> = {
    'Input': 'input',
    'AI Analysis': 'llm',
    'Compare': 'compare',
    'Summarize': 'summarize',
    'Output': 'output'
  }
  return typeMap[label] || label.toLowerCase()
}

/**
 * Wait for React Flow to initialize
 */
export async function waitForReactFlow(timeout = 3000): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now()
    const check = () => {
      if (document.querySelector('.react-flow')) {
        resolve()
      } else if (Date.now() - start > timeout) {
        resolve() // Timeout but don't throw
      } else {
        setTimeout(check, 100)
      }
    }
    check()
  })
}

/**
 * Mock file for testing
 */
export function createMockFile(
  name: string,
  content: string,
  type: string = 'text/plain'
): File {
  const blob = new Blob([content], { type })
  return new File([blob], name, { type })
}

/**
 * Mock FileList for testing
 */
export function createMockFileList(files: File[]): FileList {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    *[Symbol.iterator] () {
      for (const file of files) {
        yield file
      }
    }
  }

  // Add numeric indexing
  files.forEach((file, index) => {
    (fileList as any)[index] = file
  })

  return fileList as unknown as FileList
}

/**
 * Wait for element to appear
 */
export async function waitForElement(
  selector: string,
  timeout = 3000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const start = Date.now()
    const check = () => {
      const element = document.querySelector(selector)
      if (element) {
        resolve(element)
      } else if (Date.now() - start > timeout) {
        resolve(null)
      } else {
        setTimeout(check, 100)
      }
    }
    check()
  })
}

/**
 * Mock localStorage for testing
 */
export class MockLocalStorage implements Storage {
  private store: Record<string, string> = {}

  get length(): number {
    return Object.keys(this.store).length
  }

  clear(): void {
    this.store = {}
  }

  getItem(key: string): string | null {
    return this.store[key] || null
  }

  setItem(key: string, value: string): void {
    this.store[key] = value
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store)
    return keys[index] || null
  }
}

/**
 * Setup mock localStorage
 */
export function setupMockLocalStorage(): MockLocalStorage {
  const mockStorage = new MockLocalStorage()
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true
  })
  return mockStorage
}

/**
 * Mock fetch for API testing
 */
export function mockFetch(responses: Array<{
  url: string | RegExp
  response: any
  status?: number
  delay?: number
}>): void {
  global.fetch = vi.fn(async (url: string, _options?: any) => {
    const urlString = url
    
    for (const mock of responses) {
      const matches = typeof mock.url === 'string'
        ? urlString.includes(mock.url)
        : mock.url.test(urlString)
      
      if (matches) {
        if (mock.delay) {
          await new Promise(resolve => setTimeout(resolve, mock.delay))
        }
        
        return {
          ok: mock.status ? mock.status >= 200 && mock.status < 300 : true,
          status: mock.status || 200,
          json: async () => mock.response,
          text: async () => JSON.stringify(mock.response),
          headers: new Headers()
        } as Response
      }
    }
    
    throw new Error(`No mock found for ${urlString}`)
  }) as any
}