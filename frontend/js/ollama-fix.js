/**
 * Ollama Integration Fix
 * Enhances error handling to show specific error messages instead of generic "Error"
 *
 * Note: Requires logger.js to be loaded before this script
 */

(function () {
  // Store the original loadOllamaModels function
  const originalLoadOllamaModels = window.loadOllamaModels;

  // Enhanced version with better error handling
  window.loadOllamaModels = async function (retryCount = 0) {
    logger.info('ollama_enhanced_loader_activated', {
      component: 'ollama_fix',
      retry_count: retryCount,
    });

    const statusBadge = document.getElementById('ollamaStatusBadge');
    const modelSelect = document.getElementById('ollamaModelDisplay');

    // Add diagnostic info
    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      attempt: retryCount + 1,
      url: 'http://localhost:8000/api/ollama/models',
      environment: {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        port: window.location.port,
      },
    };

    logger.info('ollama_loading_diagnostic', {
      diagnostic_info: diagnosticInfo,
      component: 'ollama_fix',
    });

    try {
      // Call the original function
      if (originalLoadOllamaModels) {
        return await originalLoadOllamaModels.call(this, retryCount);
      }

      // If no original function, implement our own
      statusBadge.textContent = 'Connecting...';
      statusBadge.className = 'badge bg-warning';
      modelSelect.innerHTML = '<option value="">Connecting to Ollama...</option>';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Store timeout for cleanup
      if (window.appTimers) {
        window.appTimers.add(timeoutId);
      }

      const response = await fetch('http://localhost:8000/api/ollama/models', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Remove from cleanup tracker
      if (window.appTimers) {
        window.appTimers.delete(timeoutId);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.available && data.models && data.models.length > 0) {
        // Success
        statusBadge.textContent = `${data.models.length} models`;
        statusBadge.className = 'badge bg-success';
        statusBadge.title = `Ollama connected with ${data.models.length} models`;

        // Populate dropdown
        modelSelect.disabled = false;
        modelSelect.innerHTML = '<option value="dont_use">Don\'t use Ollama</option>';

        data.models.forEach((model) => {
          const option = document.createElement('option');
          option.value = model.name;
          option.textContent = model.name;
          if (model.size) {
            const sizeInGB = (model.size / (1024 * 1024 * 1024)).toFixed(1);
            option.textContent += ` (${sizeInGB}GB)`;
          }
          modelSelect.appendChild(option);
        });

        // Load saved selection
        const savedModel = localStorage.getItem('ollamaModel');
        if (savedModel && data.models.some((m) => m.name === savedModel)) {
          modelSelect.value = savedModel;
        }

        logger.info('ollama_models_loaded_successfully', {
          models_count: data.models.length,
          component: 'ollama_fix',
        });
      } else {
        // Ollama not running
        statusBadge.textContent = 'Not Running';
        statusBadge.className = 'badge bg-secondary';
        statusBadge.title = 'Ollama service not detected';
        modelSelect.innerHTML = '<option value="">Ollama not running</option>';
        modelSelect.disabled = true;
      }
    } catch (error) {
      logger.error(
        'ollama_loading_error',
        {
          error_message: error.message,
          error_type: error.name,
          component: 'ollama_fix',
        },
        error
      );

      // Enhanced error handling with specific messages
      let errorMessage = 'Unknown Error';
      let errorDetails = error.message;

      if (error.name === 'AbortError') {
        errorMessage = 'Timeout';
        errorDetails = 'Request timed out after 10 seconds';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network Error';
        errorDetails = 'Cannot connect to backend API';
      } else if (error.message.includes('HTTP 5')) {
        errorMessage = 'Server Error';
        errorDetails = error.message;
      } else if (error.message.includes('HTTP 4')) {
        errorMessage = 'API Error';
        errorDetails = error.message;
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Invalid Response';
        errorDetails = 'Backend returned invalid data';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS Blocked';
        errorDetails = 'Cross-origin request blocked';
      } else {
        // Instead of generic "Error", show more info
        errorMessage = 'Connection Failed';
        errorDetails = error.name + ': ' + error.message;
      }

      // Update UI with specific error
      statusBadge.textContent = errorMessage;
      statusBadge.className = 'badge bg-danger';
      statusBadge.title = errorDetails;

      // eslint-disable-next-line no-unsanitized/property
      modelSelect.innerHTML = DOMPurify.sanitize(
        `<option value="">${errorMessage}: ${errorDetails}</option>`
      );
      modelSelect.disabled = true;
      modelSelect.title = errorDetails;

      // Log detailed error info
      logger.error(
        'ollama_error_details',
        {
          error_type: error.name,
          error_message: error.message,
          displayed_message: errorMessage,
          displayed_details: errorDetails,
          component: 'ollama_fix',
        },
        error
      );

      // Add a help message
      if (errorMessage === 'Network Error' || errorMessage === 'Connection Failed') {
        logger.info('ollama_troubleshooting_tips', {
          tips: [
            'Ensure backend is running: cd backend && uvicorn main:app --reload',
            'Check if Ollama is running: curl http://localhost:11434/api/tags',
            'Try accessing: http://localhost:8000/api/ollama/models',
            'Run diagnostic: runOllamaDiagnostic()',
          ],
          component: 'ollama_fix',
        });
      }
    }
  };

  // Also add a manual refresh function
  window.refreshOllama = function () {
    logger.userAction('manual_refresh', 'ollama_integration', {
      component: 'ollama_fix',
    });
    window.loadOllamaModels(0);
  };

  // Add diagnostic command
  window.ollamaHelp = function () {
    const badge = document.getElementById('ollamaStatusBadge');
    logger.info('ollama_help_requested', {
      commands: [
        'runOllamaDiagnostic() - Run full diagnostic',
        'refreshOllama() - Manually refresh Ollama models',
        'localStorage.setItem("debugMode", "true") - Enable debug logging',
      ],
      current_badge_status: badge
        ? {
            text: badge.textContent,
            class: badge.className,
            title: badge.title,
          }
        : null,
      component: 'ollama_fix',
    });
  };

  logger.info('ollama_fix_loaded', {
    available_commands: ['ollamaHelp()', 'refreshOllama()'],
    component: 'ollama_fix',
  });
})();
