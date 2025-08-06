import { API_CONFIG } from './config.js';
import { logger } from './utils/logger.js';
import { loadOllamaModels, refreshOllama, ollamaHelp } from './ollama-fix.js';
import { runOllamaDiagnostic } from './ollama-diagnostic.js';

// Sync model selections between display and settings dropdowns
export function syncModelSelections() {
  // Sync from settings to display on load
  ['openai', 'claude', 'gemini', 'grok'].forEach((provider) => {
    const settingsDropdown = document.getElementById(`${provider}Model`);
    const displayDropdown = document.getElementById(`${provider}ModelDisplay`);

    if (settingsDropdown && displayDropdown) {
      // Settings dropdown changes update display dropdown
      const settingsHandler = function () {
        displayDropdown.value = this.value;
        localStorage.setItem(`${provider}Model`, this.value);
      };
      settingsDropdown.addEventListener('change', settingsHandler);
      if (window.appListeners) {
        const key = `${provider}-settings-sync-${Date.now()}`;
        window.appListeners.set(key, {
          element: settingsDropdown,
          event: 'change',
          handler: settingsHandler,
        });
      }

      // Display dropdown changes update settings dropdown
      const displayHandler = function () {
        settingsDropdown.value = this.value;
        localStorage.setItem(`${provider}Model`, this.value);
      };
      displayDropdown.addEventListener('change', displayHandler);
      if (window.appListeners) {
        const key = `${provider}-display-sync-${Date.now()}`;
        window.appListeners.set(key, {
          element: displayDropdown,
          event: 'change',
          handler: displayHandler,
        });
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Debug UI helper
  function addDebugUI() {
    const debugDiv = document.createElement('div');
    debugDiv.innerHTML = `
                <div style="position: fixed; bottom: 10px; right: 10px; background: #f0f0f0; padding: 10px; border-radius: 5px; font-size: 12px;">
                    <strong>Debug Mode</strong> | 
                    <a href="#" onclick="showLogs(); return false;">View Logs</a> | 
                    <a href="#" onclick="clearLogs(); return false;">Clear Logs</a>
                </div>
            `;
    document.body.appendChild(debugDiv);
  }

  function showLogs() {
    const logs = JSON.parse(localStorage.getItem('appLogs') || '[]');
    console.table(logs);
    alert(`${logs.length} logs in console (F12)`);
  }

  function clearLogs() {
    localStorage.removeItem('appLogs');
    logger.info('Logs cleared');
  }

  // Debug localStorage persistence
  window.checkLocalStoragePersistence = function () {
    const info = {
      origin: window.location.origin,
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      userAgent: navigator.userAgent,
      cookieEnabled: navigator.cookieEnabled,
      storage: {
        length: localStorage.length,
        keys: Object.keys(localStorage),
        apiKeys: {
          openai: localStorage.getItem('openaiKey') ? 'Set' : 'Not set',
          claude: localStorage.getItem('claudeKey') ? 'Set' : 'Not set',
          gemini: localStorage.getItem('geminiKey') ? 'Set' : 'Not set',
          grok: localStorage.getItem('grokKey') ? 'Set' : 'Not set',
        },
      },
    };

    logger.info('localstorage_persistence_check', {
      storage_info: info,
      component: 'index_page',
    });

    // Test write/read
    const testKey = 'test_' + Date.now();
    const testValue = 'test_value_' + Math.random();
    localStorage.setItem(testKey, testValue);
    const readValue = localStorage.getItem(testKey);
    const testPassed = readValue === testValue;
    localStorage.removeItem(testKey);

    logger.info('localstorage_write_read_test', {
      test_result: testPassed ? 'PASSED' : 'FAILED',
      component: 'index_page',
    });

    return info;
  };

  // Enable debug mode with: localStorage.setItem('debugMode', 'true')

  // Visual feedback for model selection dropdowns
  function setupModelVisualFeedback() {
    // Setup visual feedback for each provider
    ['openai', 'claude', 'gemini', 'grok'].forEach((provider) => {
      const displayDropdown = document.getElementById(`${provider}ModelDisplay`);
      if (displayDropdown) {
        const card = displayDropdown.closest('.border');
        if (card) {
          // Add change listener for visual feedback
          const feedbackHandler = function () {
            if (this.value === 'dont_use') {
              card.style.opacity = '0.5';
            } else {
              card.style.opacity = '1';
            }
          };
          displayDropdown.addEventListener('change', feedbackHandler);
          if (window.appListeners) {
            const key = `${provider}-model-feedback-${Date.now()}`;
            window.appListeners.set(key, {
              element: displayDropdown,
              event: 'change',
              handler: feedbackHandler,
            });
          }
        }
      }
    });
  }

  // Safe logger wrapper
  const safeLog = (level, message, data) => {
    if (typeof logger !== 'undefined' && logger[level]) {
      logger[level](message, data);
    }
  };

  // Assign functions to window for legacy access if needed (e.g., from HTML onclick)
  window.showLogs = showLogs;
  window.clearLogs = clearLogs;
  window.runOllamaDiagnostic = runOllamaDiagnostic;
  window.refreshOllama = refreshOllama;
  window.ollamaHelp = ollamaHelp;

  // Initial setup calls
  if (localStorage.getItem('debugMode') === 'true') {
    addDebugUI();
  }
  loadOllamaModels();
  setupModelVisualFeedback();
  syncModelSelections();
});
