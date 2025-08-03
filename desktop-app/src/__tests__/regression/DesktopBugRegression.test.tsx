/**
 * Regression Tests for Desktop App Bugs
 * 
 * This file contains tests to prevent regression of bugs found and fixed
 * in the desktop app. Each test is linked to a bug in DESKTOP_BUGS.md
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { WorkflowBuilder } from '../../components/WorkflowBuilder'

describe('Desktop Bug Regression Tests', () => {
  describe('DESKTOP-001: configModalNodeId State Variable', () => {
    it('should not crash due to missing configModalNodeId state', () => {
      // This test ensures the WorkflowBuilder renders without crashing
      // Previously failed with: ReferenceError: configModalNodeId is not defined
      expect(() => {
        render(<WorkflowBuilder />)
      }).not.toThrow()
    })

    it('should have configModalNodeId state properly initialized', () => {
      const { container } = render(<WorkflowBuilder />)
      
      // The component should render successfully
      expect(container.firstChild).toBeTruthy()
      
      // The React Flow canvas should be present
      expect(container.querySelector('.react-flow__renderer')).toBeTruthy()
    })
  })

  describe('DESKTOP-002: React Flow ResizeObserver Mock', () => {
    it('should not throw ResizeObserver errors in test environment', () => {
      // Verify ResizeObserver is mocked
      expect(global.ResizeObserver).toBeDefined()
      expect(typeof global.ResizeObserver).toBe('function')
      
      const observer = new ResizeObserver(() => {})
      expect(observer.observe).toBeDefined()
      expect(observer.disconnect).toBeDefined()
      expect(observer.unobserve).toBeDefined()
    })
  })

  describe('DESKTOP-003: DataTransfer API Mock', () => {
    it('should provide DataTransfer mock for drag-drop tests', () => {
      // Verify DataTransfer is available
      expect(global.DataTransfer).toBeDefined()
      
      const dataTransfer = new DataTransfer()
      expect(dataTransfer.setData).toBeDefined()
      expect(dataTransfer.getData).toBeDefined()
      expect(dataTransfer.clearData).toBeDefined()
    })

    it('should handle DataTransfer operations correctly', () => {
      const dataTransfer = new DataTransfer()
      
      // Test setting and getting data
      dataTransfer.setData('text/plain', 'test-data')
      expect(dataTransfer.getData('text/plain')).toBe('test-data')
      
      // Test types array
      expect(dataTransfer.types).toContain('text/plain')
      
      // Test clearing data
      dataTransfer.clearData('text/plain')
      expect(dataTransfer.getData('text/plain')).toBe('')
      expect(dataTransfer.types).not.toContain('text/plain')
    })

    it('should provide DragEvent mock', () => {
      expect(global.DragEvent).toBeDefined()
      
      const dragEvent = new DragEvent('dragstart')
      expect(dragEvent.dataTransfer).toBeDefined()
      expect(dragEvent.dataTransfer.setData).toBeDefined()
    })
  })

  describe('Browser API Mocks Comprehensive Test', () => {
    it('should have all required browser APIs mocked', () => {
      // ResizeObserver
      expect(global.ResizeObserver).toBeDefined()
      
      // IntersectionObserver
      expect(global.IntersectionObserver).toBeDefined()
      
      // DataTransfer
      expect(global.DataTransfer).toBeDefined()
      
      // DragEvent
      expect(global.DragEvent).toBeDefined()
      
      // window.matchMedia
      expect(window.matchMedia).toBeDefined()
    })

    it('should not break React Flow component mounting', () => {
      // This comprehensive test ensures React Flow can mount
      // without any browser API errors
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<WorkflowBuilder />)
      
      // Should not have any console errors related to missing APIs
      const errorCalls = consoleSpy.mock.calls.filter(call => 
        call.some(arg => 
          typeof arg === 'string' && 
          (arg.includes('ResizeObserver') || 
           arg.includes('DataTransfer') ||
           arg.includes('IntersectionObserver'))
        )
      )
      
      expect(errorCalls).toHaveLength(0)
      
      consoleSpy.mockRestore()
    })
  })

  describe('State Management Integration', () => {
    it('should handle modal state without crashing', () => {
      // Test that the component can handle modal state changes
      const { container } = render(<WorkflowBuilder />)
      
      // Component should render with proper structure
      expect(container.querySelector('.workflow-builder')).toBeTruthy()
      expect(container.querySelector('.react-flow__renderer')).toBeTruthy()
    })
  })
})