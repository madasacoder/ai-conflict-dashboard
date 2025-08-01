/**
 * Unit tests for utility functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  updateCounts,
  processTextWithHighlighting,
  escapeHtml,
  syncModelSelections,
  handleFileUpload,
  showError,
  logger
} from '../js/utils.js';

describe('updateCounts', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <span id="charCount">0</span>
      <span id="tokenCount">0</span>
      <span id="tokenWarning" style="display: none;"></span>
    `;
  });

  it('should update character and token counts', () => {
    const result = updateCounts('Hello World');
    
    expect(result.length).toBe(11);
    expect(result.tokens).toBe(3); // Math.ceil(11/4)
    expect(document.getElementById('charCount').textContent).toBe('11');
    expect(document.getElementById('tokenCount').textContent).toBe('3');
  });

  it('should show warning for high token count', () => {
    const longText = 'x'.repeat(13000); // Will be >3000 tokens
    updateCounts(longText);
    
    const warning = document.getElementById('tokenWarning');
    expect(warning.style.display).toBe('inline');
    expect(warning.innerHTML).toContain('May exceed GPT-3.5 limit');
  });

  it('should show info for approaching limit', () => {
    const mediumText = 'x'.repeat(10500); // Will be ~2625 tokens
    updateCounts(mediumText);
    
    const warning = document.getElementById('tokenWarning');
    expect(warning.style.display).toBe('inline');
    expect(warning.innerHTML).toContain('Approaching GPT-3.5 limit');
  });

  it('should handle missing DOM elements gracefully', () => {
    document.body.innerHTML = ''; // No elements
    
    expect(() => updateCounts('Test')).not.toThrow();
    const result = updateCounts('Test');
    expect(result.length).toBe(4);
    expect(result.tokens).toBe(1);
  });
});

describe('processTextWithHighlighting', () => {
  it('should process code blocks with language', () => {
    const input = '```javascript\nconst x = 42;\n```';
    const result = processTextWithHighlighting(input);
    
    expect(result).toContain('<pre><code class="language-javascript">');
    expect(result).toContain('const x = 42;');
  });

  it('should handle code blocks without language', () => {
    const input = '```\nplain text\n```';
    const result = processTextWithHighlighting(input);
    
    expect(result).toContain('<pre><code class="language-plaintext">');
  });

  it('should map language aliases', () => {
    const input = '```js\nconst x = 1;\n```';
    const result = processTextWithHighlighting(input);
    
    expect(result).toContain('language-javascript');
  });

  it('should process inline code', () => {
    const input = 'Use `npm install` to install';
    const result = processTextWithHighlighting(input);
    
    expect(result).toContain('<code>npm install</code>');
  });

  it('should escape HTML in code blocks', () => {
    const input = '```\n<script>alert("XSS")</script>\n```';
    const result = processTextWithHighlighting(input);
    
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});

describe('escapeHtml', () => {
  it('should escape HTML entities', () => {
    expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert("XSS")&lt;/script&gt;'
    );
  });

  it('should escape quotes', () => {
    expect(escapeHtml('"quotes" & \'apostrophes\'')).toBe(
      '"quotes" &amp; \'apostrophes\''
    );
  });
});

describe('syncModelSelections', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="openaiModel"><option value="gpt-3.5">GPT-3.5</option></select>
      <select id="openaiModelDisplay"><option value="gpt-3.5">GPT-3.5</option></select>
      <select id="claudeModel"><option value="claude-3">Claude 3</option></select>
      <select id="claudeModelDisplay"><option value="claude-3">Claude 3</option></select>
    `;
  });

  it('should sync settings dropdown to display dropdown', () => {
    syncModelSelections();
    
    const settingsDropdown = document.getElementById('openaiModel');
    const displayDropdown = document.getElementById('openaiModelDisplay');
    
    settingsDropdown.value = 'gpt-4';
    triggerEvent(settingsDropdown, 'change');
    
    expect(displayDropdown.value).toBe('gpt-4');
    expect(localStorage.getItem('openaiModel')).toBe('gpt-4');
  });

  it('should sync display dropdown to settings dropdown', () => {
    syncModelSelections();
    
    const settingsDropdown = document.getElementById('claudeModel');
    const displayDropdown = document.getElementById('claudeModelDisplay');
    
    displayDropdown.value = 'claude-2';
    triggerEvent(displayDropdown, 'change');
    
    expect(settingsDropdown.value).toBe('claude-2');
    expect(localStorage.getItem('claudeModel')).toBe('claude-2');
  });
});

describe('handleFileUpload', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <textarea id="inputText"></textarea>
      <div id="filesList"></div>
    `;
  });

  it('should handle single file upload', async () => {
    const file = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
    const event = {
      target: {
        files: [file]
      }
    };
    
    handleFileUpload(event);
    
    // Wait for FileReader
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const textarea = document.getElementById('inputText');
    expect(textarea.value).toContain('--- File: test.txt ---');
    expect(textarea.value).toContain('Hello World');
  });

  it('should handle multiple file uploads', async () => {
    const file1 = new File(['Content 1'], 'file1.txt', { type: 'text/plain' });
    const file2 = new File(['Content 2'], 'file2.txt', { type: 'text/plain' });
    const event = {
      target: {
        files: [file1, file2]
      }
    };
    
    handleFileUpload(event);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const textarea = document.getElementById('inputText');
    expect(textarea.value).toContain('--- File: file1.txt ---');
    expect(textarea.value).toContain('Content 1');
    expect(textarea.value).toContain('--- File: file2.txt ---');
    expect(textarea.value).toContain('Content 2');
  });

  it('should append to existing content', async () => {
    const textarea = document.getElementById('inputText');
    textarea.value = 'Existing content';
    
    const file = new File(['New content'], 'new.txt', { type: 'text/plain' });
    const event = {
      target: {
        files: [file]
      }
    };
    
    handleFileUpload(event);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(textarea.value).toContain('Existing content');
    expect(textarea.value).toContain('--- File: new.txt ---');
    expect(textarea.value).toContain('New content');
  });

  it('should show success notification', async () => {
    const file = new File(['Test'], 'test.txt', { type: 'text/plain' });
    const event = {
      target: {
        files: [file]
      }
    };
    
    handleFileUpload(event);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const notification = document.querySelector('.alert-success');
    expect(notification).toBeTruthy();
    expect(notification.textContent).toContain('1 file(s) loaded successfully!');
  });
});

describe('showError', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="errorAlert" style="display: none;">
        <span id="errorMessage"></span>
      </div>
    `;
  });

  it('should display error message', () => {
    showError('Test error message');
    
    const errorMessage = document.getElementById('errorMessage');
    const errorAlert = document.getElementById('errorAlert');
    
    expect(errorMessage.textContent).toBe('Test error message');
    expect(errorAlert.style.display).toBe('block');
  });

  it('should auto-hide after 5 seconds', () => {
    vi.useFakeTimers();
    
    showError('Test error');
    
    const errorAlert = document.getElementById('errorAlert');
    expect(errorAlert.style.display).toBe('block');
    
    vi.advanceTimersByTime(5000);
    expect(errorAlert.style.display).toBe('none');
    
    vi.useRealTimers();
  });
});

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should log debug messages only in debug mode', () => {
    localStorage.setItem('debugMode', 'false');
    logger.debug('Test debug');
    expect(console.log).not.toHaveBeenCalled();
    
    localStorage.setItem('debugMode', 'true');
    logger.debug('Test debug 2');
    expect(console.log).toHaveBeenCalledWith('[DEBUG]', expect.any(String), 'Test debug 2');
  });

  it('should always log info messages', () => {
    logger.info('Test info');
    expect(console.log).toHaveBeenCalledWith('[INFO]', expect.any(String), 'Test info');
  });

  it('should save logs to localStorage', () => {
    logger.saveLog('error', 'Test error', { code: 500 });
    
    const logs = JSON.parse(localStorage.getItem('appLogs'));
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('error');
    expect(logs[0].message).toBe('Test error');
    expect(logs[0].data.code).toBe(500);
  });

  it('should limit logs to 50 entries', () => {
    for (let i = 0; i < 60; i++) {
      logger.saveLog('info', `Log ${i}`);
    }
    
    const logs = JSON.parse(localStorage.getItem('appLogs'));
    expect(logs).toHaveLength(50);
    expect(logs[0].message).toBe('Log 10'); // First 10 should be removed
  });
});