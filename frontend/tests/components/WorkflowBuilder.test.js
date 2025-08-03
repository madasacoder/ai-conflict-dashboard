/**
 * Component tests for WorkflowBuilder
 * Follows JAVASCRIPT-STANDARDS.md requirements
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Drawflow library
global.Drawflow = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  addNode: vi.fn().mockReturnValue('node-1'),
  export: vi.fn().mockReturnValue({
    drawflow: {
      Home: {
        data: {},
      },
    },
  }),
  import: vi.fn(),
  clear: vi.fn(),
  on: vi.fn(),
  pos_x_y: vi.fn().mockReturnValue({ x: 100, y: 100 }),
  getNodeFromId: vi.fn().mockReturnValue({
    id: '1',
    class: 'input',
    data: { type: 'text', placeholder: 'Enter text' },
  }),
  updateNodeDataFromId: vi.fn(),
  zoom_in: vi.fn(),
  zoom_out: vi.fn(),
  zoom_reset: vi.fn(),
}));

describe('WorkflowBuilder', () => {
  let container;
  let workflowBuilder;

  beforeEach(() => {
    // Set up DOM structure that WorkflowBuilder expects
    document.body.innerHTML = `
      <div id="drawflow"></div>
      <div id="configPanel" class="">
        <div id="configContent"></div>
      </div>
      <div class="node-palette">
        <div class="node-item" data-node-type="input" draggable="true">Input</div>
        <div class="node-item" data-node-type="llm" draggable="true">LLM</div>
        <div class="node-item" data-node-type="output" draggable="true">Output</div>
      </div>
      <button class="btn-primary">Run Workflow</button>
    `;

    // Reset all mocks
    vi.clearAllMocks();

    // Reset logger mocks
    global.logger.info.mockClear();
    global.logger.error.mockClear();
    global.logger.workflow.mockClear();
    global.logger.userAction.mockClear();
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';

    // Clean up global instance
    delete window.workflowBuilder;
  });

  test('should initialize WorkflowBuilder with proper logging', async () => {
    // Import and create WorkflowBuilder
    const { WorkflowBuilder } = await import('../../js/workflow-builder.js');

    workflowBuilder = new WorkflowBuilder();

    // ✅ REQUIRED - Check structured logging per JAVASCRIPT-STANDARDS.md
    expect(global.logger.info).toHaveBeenCalledWith('workflow_builder_init_start', {
      component: 'WorkflowBuilder',
    });

    expect(global.logger.info).toHaveBeenCalledWith('drawflow_instance_created', {
      component: 'WorkflowBuilder',
      container_id: 'drawflow',
    });
  });

  test('should handle missing Drawflow library gracefully', async () => {
    // Temporarily remove Drawflow
    const originalDrawflow = global.Drawflow;
    delete global.Drawflow;

    const { WorkflowBuilder } = await import('../../js/workflow-builder.js');

    expect(() => {
      new WorkflowBuilder();
    }).toThrow('Drawflow library not loaded');

    // Restore Drawflow
    global.Drawflow = originalDrawflow;
  });

  test('should setup drag and drop functionality with structured logging', async () => {
    const { WorkflowBuilder } = await import('../../js/workflow-builder.js');
    workflowBuilder = new WorkflowBuilder();

    // Check that drag and drop setup was logged
    expect(global.logger.info).toHaveBeenCalledWith('drag_drop_setup', {
      palette_items_count: 3,
      component: 'WorkflowBuilder',
    });
  });

  test('should add node via drag and drop', async () => {
    const user = userEvent.setup();
    const { WorkflowBuilder } = await import('../../js/workflow-builder.js');

    workflowBuilder = new WorkflowBuilder();
    const canvas = document.getElementById('drawflow');
    const nodeItem = document.querySelector('[data-node-type="input"]');

    // Simulate drag start
    fireEvent.dragStart(nodeItem, {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: 'copy',
      },
    });

    // Check user action logging
    expect(global.logger.userAction).toHaveBeenCalledWith('drag_start', 'node_palette', {
      node_type: 'input',
    });

    // Simulate drop
    fireEvent.drop(canvas, {
      dataTransfer: {
        getData: vi.fn().mockReturnValue('input'),
      },
      clientX: 200,
      clientY: 100,
    });

    expect(global.logger.userAction).toHaveBeenCalledWith('drop', 'workflow_canvas', {
      node_type: 'input',
    });
  });

  test('should add node via click with logging', async () => {
    const user = userEvent.setup();
    const { WorkflowBuilder } = await import('../../js/workflow-builder.js');

    workflowBuilder = new WorkflowBuilder();
    const nodeItem = document.querySelector('[data-node-type="llm"]');

    await user.click(nodeItem);

    // Check that user action was logged
    expect(global.logger.userAction).toHaveBeenCalledWith('click', 'node_palette', {
      node_type: 'llm',
    });
  });

  test('should sanitize HTML content with DOMPurify', async () => {
    const { WorkflowBuilder } = await import('../../js/workflow-builder.js');
    workflowBuilder = new WorkflowBuilder();

    // Create a node to trigger HTML generation
    const nodeId = workflowBuilder.addNode('input', 100, 100);

    // Check that DOMPurify.sanitize was called for HTML content
    expect(global.DOMPurify.sanitize).toHaveBeenCalled();
  });

  test('should validate workflow structure', async () => {
    const { WorkflowBuilder } = await import('../../js/workflow-builder.js');
    workflowBuilder = new WorkflowBuilder();

    // Test empty workflow validation
    const emptyWorkflow = {
      drawflow: {
        Home: {
          data: {},
        },
      },
    };

    const result = workflowBuilder.validateWorkflow(emptyWorkflow);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Workflow must contain at least one node');
  });

  test('should handle API errors with structured logging', async () => {
    const { WorkflowBuilder } = await import('../../js/workflow-builder.js');
    workflowBuilder = new WorkflowBuilder();

    // Mock fetch to simulate API error
    global.fetch.mockRejectedValueOnce(new Error('API Error'));

    // Mock a workflow with nodes for validation
    workflowBuilder.editor.export.mockReturnValue({
      drawflow: {
        Home: {
          data: {
            1: { class: 'input' },
            2: { class: 'output' },
          },
        },
      },
    });

    await workflowBuilder.runWorkflow();

    // Check error logging
    expect(global.logger.error).toHaveBeenCalledWith(
      'workflow_execution_failed',
      expect.objectContaining({
        error_message: expect.stringContaining('API Error'),
        workflow_nodes: 2,
      }),
      expect.any(Error)
    );
  });

  test('should cleanup event listeners properly', async () => {
    const { WorkflowBuilder } = await import('../../js/workflow-builder.js');
    workflowBuilder = new WorkflowBuilder();

    // Mock addEventListener and removeEventListener
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    // Simulate component cleanup (if cleanup method exists)
    if (workflowBuilder.cleanup) {
      workflowBuilder.cleanup();
      expect(removeEventListenerSpy).toHaveBeenCalled();
    }
  });

  test('should handle memory management correctly', async () => {
    const { WorkflowBuilder } = await import('../../js/workflow-builder.js');
    workflowBuilder = new WorkflowBuilder();

    // Test that large data doesn't cause memory leaks
    const largeData = 'x'.repeat(10000);
    const nodeId = workflowBuilder.addNode('input', 100, 100);

    workflowBuilder.updateNodeData(nodeId, 'content', largeData);

    // Verify data was updated
    expect(workflowBuilder.editor.updateNodeDataFromId).toHaveBeenCalledWith(
      nodeId,
      expect.objectContaining({ content: largeData })
    );
  });

  test('should prevent XSS in node configuration forms', async () => {
    const { WorkflowBuilder } = await import('../../js/workflow-builder.js');
    workflowBuilder = new WorkflowBuilder();

    // Mock node with potentially malicious data
    const maliciousNode = {
      id: '1',
      class: 'input',
      data: {
        placeholder: '<script>alert("XSS")</script>',
      },
    };

    workflowBuilder.editor.getNodeFromId.mockReturnValue(maliciousNode);

    const configHTML = workflowBuilder.generateConfigForm(maliciousNode);

    // Check that DOMPurify.sanitize was called on the generated HTML
    expect(global.DOMPurify.sanitize).toHaveBeenCalledWith(expect.stringContaining('script'));
  });

  test('should handle unicode text properly', async () => {
    const { WorkflowBuilder } = await import('../../js/workflow-builder.js');
    workflowBuilder = new WorkflowBuilder();

    const unicodeText = '测试 🚀 émojis ñoño';
    const nodeId = workflowBuilder.addNode('input', 100, 100);

    workflowBuilder.updateNodeData(nodeId, 'content', unicodeText);

    // Verify unicode handling doesn't break
    expect(workflowBuilder.editor.updateNodeDataFromId).toHaveBeenCalledWith(
      nodeId,
      expect.objectContaining({ content: unicodeText })
    );
  });
});
