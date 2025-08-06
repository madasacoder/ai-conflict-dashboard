/**
 * Unit tests for utility functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { syncModelSelections } from '../js/main.js';

const setupDOM = () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <select id="openaiModel">
          <option value="gpt-3.5">GPT-3.5</option>
          <option value="gpt-4">GPT-4</option>
        </select>
        <select id="openaiModelDisplay">
          <option value="gpt-3.5">GPT-3.5</option>
          <option value="gpt-4">GPT-4</option>
        </select>
        <select id="claudeModel">
          <option value="claude-3">Claude 3</option>
          <option value="claude-2">Claude 2</option>
        </select>
        <select id="claudeModelDisplay">
          <option value="claude-3">Claude 3</option>
          <option value="claude-2">Claude 2</option>
        </select>
        <select id="geminiModel"></select>
        <select id="geminiModelDisplay"></select>
        <select id="grokModel"></select>
        <select id="grokModelDisplay"></select>
      </body>
    </html>`, { url: "http://localhost" });

  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => {
        store[key] = value.toString();
      },
      clear: () => {
        store = {};
      },
      removeItem: (key) => {
        delete store[key];
      }
    };
  })();
  
  global.document = dom.window.document;
  Object.defineProperty(dom.window, 'localStorage', { value: localStorageMock });
  global.localStorage = dom.window.localStorage;
  
  return dom.window;
};


describe('syncModelSelections', () => {
  beforeEach(() => {
    setupDOM();
  });

  it('should sync settings dropdown to display dropdown', () => {
    syncModelSelections();
    
    const settingsDropdown = document.getElementById('openaiModel');
    const displayDropdown = document.getElementById('openaiModelDisplay');

    settingsDropdown.value = 'gpt-4';
    const event = new document.defaultView.Event('change', { bubbles: true });
    settingsDropdown.dispatchEvent(event);

    expect(displayDropdown.value).toBe('gpt-4');
    expect(localStorage.getItem('openaiModel')).toBe('gpt-4');
  });

  it('should sync display dropdown to settings dropdown', () => {
    syncModelSelections();
    
    const settingsDropdown = document.getElementById('claudeModel');
    const displayDropdown = document.getElementById('claudeModelDisplay');

    displayDropdown.value = 'claude-2';
    const event = new document.defaultView.Event('change', { bubbles: true });
    displayDropdown.dispatchEvent(event);

    expect(settingsDropdown.value).toBe('claude-2');
    expect(localStorage.getItem('claudeModel')).toBe('claude-2');
  });
});
