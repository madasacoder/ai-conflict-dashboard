/**
 * Ollama Integration Diagnostic Tool
 * Helps identify why Ollama shows "error" in the UI
 *
 * Note: Requires logger.js to be loaded before this script
 */

class OllamaDiagnostic {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      environment: {
        userAgent: navigator.userAgent,
        localStorage: this.checkLocalStorage(),
        currentUrl: window.location.href,
        corsMode: this.checkCorsMode(),
      },
    };
  }

  checkLocalStorage() {
    try {
      const test = '__ollama_diagnostic_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return 'working';
    } catch (e) {
      return 'blocked';
    }
  }

  checkCorsMode() {
    // Check if we're in a CORS-restricted environment
    return {
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
      isLocalhost:
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    };
  }

  async runDiagnostic() {
    logger.info('ollama_diagnostic_start', {
      component: 'ollama_diagnostic',
      timestamp: new Date().toISOString(),
    });

    // Test 1: Direct Ollama Connection
    await this.testDirectOllama();

    // Test 2: Backend API Connection
    await this.testBackendAPI();

    // Test 3: Simulate Frontend Code
    await this.testFrontendCode();

    // Test 4: Network Issues
    await this.testNetworkIssues();

    // Test 5: Console Errors
    this.captureConsoleErrors();

    return this.generateReport();
  }

  async testDirectOllama() {
    const test = {
      name: 'Direct Ollama Connection',
      endpoint: 'http://localhost:11434/api/tags',
      result: null,
      error: null,
    };

    try {
      const response = await fetch(test.endpoint);
      test.result = {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      };

      if (response.ok) {
        const data = await response.json();
        test.result.modelCount = data.models?.length || 0;
        test.result.success = true;
      }
    } catch (error) {
      test.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
      test.result = { success: false };
    }

    this.results.tests.push(test);
  }

  async testBackendAPI() {
    const test = {
      name: 'Backend API Connection',
      endpoint: 'http://localhost:8000/api/ollama/models',
      result: null,
      error: null,
    };

    try {
      const response = await fetch(test.endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      test.result = {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      };

      const text = await response.text();
      test.result.responseLength = text.length;

      if (response.ok) {
        try {
          const data = JSON.parse(text);
          test.result.data = data;
          test.result.success = true;
        } catch (parseError) {
          test.result.parseError = parseError.message;
          test.result.rawResponse = text.substring(0, 200);
        }
      } else {
        test.result.errorResponse = text;
      }
    } catch (error) {
      test.error = {
        name: error.name,
        message: error.message,
        type: error.constructor.name,
        isCors: error.message.includes('CORS') || error.message.includes('cors'),
        isNetwork:
          error.message.includes('Failed to fetch') || error.message.includes('NetworkError'),
      };
      test.result = { success: false };
    }

    this.results.tests.push(test);
  }

  async testFrontendCode() {
    const test = {
      name: 'Frontend loadOllamaModels Simulation',
      steps: [],
      result: null,
      error: null,
    };

    try {
      // Step 1: Create mock elements
      const statusBadge = { textContent: '', className: '' };
      // Mock element used in test
      const modelSelect = { innerHTML: '', disabled: true }; // eslint-disable-line no-unused-vars

      test.steps.push({ step: 'Mock elements created', success: true });

      // Step 2: Make the request
      statusBadge.textContent = 'Connecting...';
      test.steps.push({ step: 'Status set to Connecting', status: statusBadge.textContent });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Store timeout for cleanup
      if (window.appTimers) {
        window.appTimers.add(timeoutId);
      }

      try {
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

        test.steps.push({
          step: 'Fetch completed',
          status: response.status,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        test.steps.push({
          step: 'JSON parsed',
          available: data.available,
          modelCount: data.models?.length,
        });

        if (data.available && data.models && data.models.length > 0) {
          statusBadge.textContent = `${data.models.length} models`;
          test.result = { success: true, finalStatus: statusBadge.textContent };
        } else {
          statusBadge.textContent = 'Not Running';
          test.result = { success: false, finalStatus: statusBadge.textContent };
        }
      } catch (error) {
        test.steps.push({
          step: 'Error caught',
          errorName: error.name,
          errorMessage: error.message,
        });

        if (error.name === 'AbortError') {
          statusBadge.textContent = 'Timeout';
        } else if (error.message.includes('Failed to fetch')) {
          statusBadge.textContent = 'Unreachable';
        } else {
          statusBadge.textContent = 'Error';
        }

        test.result = {
          success: false,
          finalStatus: statusBadge.textContent,
          wouldShowError: statusBadge.textContent === 'Error',
        };

        throw error;
      }
    } catch (error) {
      test.error = {
        name: error.name,
        message: error.message,
        wouldTriggerErrorDisplay: true,
      };
    }

    this.results.tests.push(test);
  }

  async testNetworkIssues() {
    const test = {
      name: 'Network Diagnostics',
      checks: [],
    };

    // Check if backend is reachable
    try {
      const response = await fetch('http://localhost:8000/docs');
      test.checks.push({
        name: 'Backend reachable',
        success: response.ok,
        status: response.status,
      });
    } catch (error) {
      test.checks.push({
        name: 'Backend reachable',
        success: false,
        error: error.message,
      });
    }

    // Check for mixed content issues
    if (window.location.protocol === 'https:') {
      test.checks.push({
        name: 'Mixed content warning',
        issue: 'Page served over HTTPS trying to access HTTP backend',
        impact: 'Requests will be blocked by browser',
      });
    }

    // Check for browser extensions
    test.checks.push({
      name: 'Browser extensions check',
      hint: 'Ad blockers or privacy extensions may interfere',
      suggestion: 'Try in incognito/private mode',
    });

    this.results.tests.push(test);
  }

  captureConsoleErrors() {
    // Override console.error temporarily
    const originalError = console.error;
    const errors = [];

    console.error = function (...args) {
      errors.push({
        timestamp: new Date().toISOString(),
        message: args.join(' '),
      });
      // Log to structured logger instead of original console
      logger.error('captured_console_error', {
        captured_args: args,
        component: 'ollama_diagnostic',
      });
    };

    // Restore after 100ms
    setTimeout(() => {
      console.error = originalError;
      this.results.consoleErrors = errors;
    }, 100);
  }

  generateReport() {
    const report = {
      ...this.results,
      summary: this.analyzeProblem(),
      recommendations: this.getRecommendations(),
    };

    logger.info('ollama_diagnostic_report_generated', {
      component: 'ollama_diagnostic',
      report_summary: report.summary,
      recommendations_count: report.recommendations.length,
      tests_count: report.tests.length,
    });

    return report;
  }

  analyzeProblem() {
    const backendTest = this.results.tests.find((t) => t.name === 'Backend API Connection');
    const frontendTest = this.results.tests.find(
      (t) => t.name === 'Frontend loadOllamaModels Simulation'
    );

    if (backendTest?.error?.isNetwork) {
      return 'Network issue: Cannot reach backend API';
    }

    if (backendTest?.error?.isCors) {
      return 'CORS issue: Browser blocking cross-origin requests';
    }

    if (frontendTest?.result?.wouldShowError) {
      return 'Frontend shows "Error" - likely due to unexpected response format or network issue';
    }

    if (backendTest?.result?.success && frontendTest?.result?.success) {
      return 'Both backend and frontend tests passed - issue may be intermittent';
    }

    return 'Unable to determine exact cause - check detailed test results';
  }

  getRecommendations() {
    const recommendations = [];

    // Check for common issues
    if (window.location.protocol === 'https:') {
      recommendations.push('Use HTTP instead of HTTPS for local development');
    }

    if (!this.results.environment.corsMode.isLocalhost) {
      recommendations.push(
        'Access the app via http://localhost:3000 instead of ' + window.location.hostname
      );
    }

    recommendations.push(
      'Check browser console for errors',
      'Verify backend is running: uvicorn main:app --reload',
      'Try in incognito mode to rule out extensions',
      'Check browser network tab for failed requests'
    );

    return recommendations;
  }
}

// Export for use in other scripts
window.OllamaDiagnostic = OllamaDiagnostic;

// Auto-run diagnostic function
window.runOllamaDiagnostic = async function () {
  const diagnostic = new OllamaDiagnostic();
  const report = await diagnostic.runDiagnostic();

  // Display summary in console
  logger.info('ollama_diagnostic_summary', {
    summary: report.summary,
    recommendations: report.recommendations,
    component: 'ollama_diagnostic',
  });

  return report;
};
