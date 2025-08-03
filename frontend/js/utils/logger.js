/**
 * Structured logging system for AI Conflict Dashboard frontend.
 * Replaces all console.log statements to comply with JAVASCRIPT-STANDARDS.md
 *
 * @author AI Assistant
 * @version 1.0.0
 */

/**
 * Generates a unique session ID for correlation between frontend and backend logs.
 * @returns {string} Unique session identifier
 */
function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generates a unique request ID for API call correlation.
 * @returns {string} Unique request identifier
 */
function generateRequestId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Structured logger class that sends logs to backend for correlation and analysis.
 * Replaces all console.log usage per zero-tolerance policy.
 */
class StructuredLogger {
  /**
   * Initialize the structured logger.
   * @param {Object} config - Configuration options
   * @param {string} config.backendURL - Backend logging endpoint
   * @param {string} config.environment - Environment (dev/prod)
   * @param {boolean} config.enableDebug - Enable debug logging
   */
  constructor(config = {}) {
    this.sessionId = generateSessionId();
    this.backendURL = config.backendURL || '/api/log';
    this.environment = config.environment || 'development';
    this.enableDebug = config.enableDebug !== false; // Default true for debugging
    this.logQueue = [];
    this.isOnline = navigator.onLine;

    // Track online/offline status for queue management
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Flush queue periodically
    this.flushInterval = setInterval(() => this.flushQueue(), 5000);

    // Store interval for cleanup
    if (window.appTimers) {
      window.appTimers.add(this.flushInterval);
    }

    // Flush queue before page unload
    window.addEventListener('beforeunload', () => this.flushQueue());
  }

  /**
   * Core logging method that structures and sends log entries.
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} event - Event name for categorization
   * @param {Object} data - Additional structured data
   * @param {Error} error - Optional error object
   */
  async log(level, event, data = {}, error = null) {
    const logEntry = {
      level: level,
      event: event,
      data: this.sanitizeLogData(data),
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      url: window.location.href,
      user_agent: navigator.userAgent,
      environment: this.environment,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }),
    };

    // Add to queue for offline support
    this.logQueue.push(logEntry);

    // Attempt immediate send if online
    if (this.isOnline) {
      await this.sendToBackend(logEntry);
    }

    // Fallback to console only in development for debugging
    if (this.environment === 'development' && this.enableDebug) {
      this.fallbackConsoleLog(level, event, data, error);
    }
  }

  /**
   * Sanitize log data to prevent secret exposure.
   * @param {Object} data - Raw log data
   * @returns {Object} Sanitized log data
   */
  sanitizeLogData(data) {
    const sanitized = { ...data };

    // Remove or mask sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'api_key', 'secret', 'auth'];

    Object.keys(sanitized).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some((field) => lowerKey.includes(field))) {
        if (typeof sanitized[key] === 'string' && sanitized[key].length > 8) {
          sanitized[key] = sanitized[key].substring(0, 8) + '...';
        } else {
          sanitized[key] = '[REDACTED]';
        }
      }
    });

    return sanitized;
  }

  /**
   * Send log entry to backend for correlation with server logs.
   * @param {Object} logEntry - Structured log entry
   */
  async sendToBackend(logEntry) {
    try {
      await fetch(this.backendURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': generateRequestId(),
        },
        body: JSON.stringify(logEntry),
        timeout: 3000, // Quick timeout to avoid blocking
      });
    } catch (error) {
      // Backend logging failed - add to queue for retry
      // Don't use console.log here to avoid recursion
      if (this.environment === 'development') {
        console.warn('Backend logging failed:', error.message);
      }
    }
  }

  /**
   * Flush queued logs to backend when connection is restored.
   */
  async flushQueue() {
    if (!this.isOnline || this.logQueue.length === 0) {
      return;
    }

    const batch = this.logQueue.splice(0, 10); // Send in batches

    try {
      await fetch(this.backendURL + '/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': generateRequestId(),
        },
        body: JSON.stringify({ logs: batch }),
        timeout: 5000,
      });
    } catch (error) {
      // Re-add to queue for retry
      this.logQueue.unshift(...batch);
    }
  }

  /**
   * Fallback console logging for development debugging only.
   * @param {string} level - Log level
   * @param {string} event - Event name
   * @param {Object} data - Log data
   * @param {Error} error - Optional error
   */
  fallbackConsoleLog(level, event, data, error) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ${level.toUpperCase()} ${event}:`;

    switch (level) {
      case 'error':
        // eslint-disable-next-line no-console
        console.error(prefix, data, error);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(prefix, data);
        break;
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(prefix, data);
        break;
      default:
        // eslint-disable-next-line no-console
        console.info(prefix, data);
    }
  }

  /**
   * Log info level events.
   * @param {string} event - Event name
   * @param {Object} data - Additional data
   */
  info(event, data = {}) {
    return this.log('info', event, data);
  }

  /**
   * Log warning level events.
   * @param {string} event - Event name
   * @param {Object} data - Additional data
   */
  warn(event, data = {}) {
    return this.log('warn', event, data);
  }

  /**
   * Log error level events.
   * @param {string} event - Event name
   * @param {Object} data - Additional data
   * @param {Error} error - Error object
   */
  error(event, data = {}, error = null) {
    return this.log('error', event, data, error);
  }

  /**
   * Log debug level events.
   * @param {string} event - Event name
   * @param {Object} data - Additional data
   */
  debug(event, data = {}) {
    return this.log('debug', event, data);
  }

  /**
   * Log API call start with correlation ID.
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {string} Request ID for correlation
   */
  apiStart(endpoint, options = {}) {
    const requestId = generateRequestId();
    this.info('api_request_start', {
      endpoint: endpoint,
      method: options.method || 'GET',
      request_id: requestId,
      timestamp: Date.now(),
    });
    return requestId;
  }

  /**
   * Log API call completion.
   * @param {string} requestId - Request ID from apiStart
   * @param {string} endpoint - API endpoint
   * @param {number} status - HTTP status code
   * @param {number} duration - Request duration in ms
   */
  apiComplete(requestId, endpoint, status, duration) {
    this.info('api_request_complete', {
      request_id: requestId,
      endpoint: endpoint,
      status: status,
      duration_ms: duration,
      success: status >= 200 && status < 300,
    });
  }

  /**
   * Log API call failure.
   * @param {string} requestId - Request ID from apiStart
   * @param {string} endpoint - API endpoint
   * @param {Error} error - Error object
   * @param {number} duration - Request duration in ms
   */
  apiError(requestId, endpoint, error, duration) {
    this.error(
      'api_request_failed',
      {
        request_id: requestId,
        endpoint: endpoint,
        error_message: error.message,
        duration_ms: duration,
      },
      error
    );
  }

  /**
   * Log user interaction events.
   * @param {string} action - User action (click, drag, etc.)
   * @param {string} component - Component name
   * @param {Object} details - Additional details
   */
  userAction(action, component, details = {}) {
    this.info('user_action', {
      action: action,
      component: component,
      ...details,
      timestamp: Date.now(),
    });
  }

  /**
   * Log workflow events.
   * @param {string} action - Workflow action
   * @param {Object} workflowData - Workflow-specific data
   */
  workflow(action, workflowData = {}) {
    this.info('workflow_event', {
      action: action,
      ...workflowData,
      timestamp: Date.now(),
    });
  }

  /**
   * Cleanup logger resources.
   * Should be called when the application is being torn down.
   */
  cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      if (window.appTimers) {
        window.appTimers.delete(this.flushInterval);
      }
      this.flushInterval = null;
    }

    // Flush any remaining logs
    this.flushQueue();
  }
}

// Global logger instance
const logger = new StructuredLogger({
  backendURL: '/api/log',
  environment: window.location.hostname === 'localhost' ? 'development' : 'production',
  enableDebug: window.location.hostname === 'localhost',
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StructuredLogger, logger, generateRequestId, generateSessionId };
}

// Global access for legacy code
window.logger = logger;
window.generateRequestId = generateRequestId;
window.generateSessionId = generateSessionId;
