/**
 * Utility functions for AI Conflict Dashboard
 *
 * Note: Requires logger.js to be loaded before this script
 */

// Character and token counting
export function updateCounts(text) {
  const length = text.length;
  const tokens = Math.ceil(length / 4);

  const charCountEl = document.getElementById('charCount');
  const tokenCountEl = document.getElementById('tokenCount');
  const tokenWarningEl = document.getElementById('tokenWarning');

  if (charCountEl) {
    charCountEl.textContent = length;
  }
  if (tokenCountEl) {
    tokenCountEl.textContent = tokens;
  }

  if (tokenWarningEl) {
    if (tokens > 3000) {
      tokenWarningEl.style.display = 'inline';
      // eslint-disable-next-line no-unsanitized/property
      tokenWarningEl.innerHTML = DOMPurify.sanitize(
        '<i class="bi bi-exclamation-triangle"></i> May exceed GPT-3.5 limit (3000 tokens)'
      );
      tokenWarningEl.className = 'text-warning ms-2';
    } else if (tokens > 2500) {
      tokenWarningEl.style.display = 'inline';
      // eslint-disable-next-line no-unsanitized/property
      tokenWarningEl.innerHTML = DOMPurify.sanitize(
        '<i class="bi bi-info-circle"></i> Approaching GPT-3.5 limit'
      );
      tokenWarningEl.className = 'text-info ms-2';
    } else {
      tokenWarningEl.style.display = 'none';
    }
  }

  return { length, tokens };
}

// Process text for syntax highlighting
export function processTextWithHighlighting(text) {
  // Safe regex - using lazy quantifier to prevent catastrophic backtracking
  // eslint-disable-next-line security/detect-unsafe-regex
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let processedText = text.replace(codeBlockRegex, (match, language, code) => {
    language = language || 'plaintext';

    const languageMap = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      rb: 'ruby',
      yml: 'yaml',
      sh: 'bash',
      shell: 'bash',
    };

    language = languageMap[language.toLowerCase()] || language.toLowerCase();

    return `<pre><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Convert inline code
  processedText = processedText.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert line breaks to <br> for non-code sections
  processedText = processedText
    .split('\n')
    .map((line) => {
      if (line.includes('<pre>') || line.includes('</pre>')) {
        return line;
      }
      return line;
    })
    .join('<br>\n');

  return processedText;
}

// Escape HTML to prevent XSS
export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Sync model selections between dropdowns
export function syncModelSelections() {
  ['openai', 'claude', 'gemini', 'grok'].forEach((provider) => {
    const settingsDropdown = document.getElementById(`${provider}Model`);
    const displayDropdown = document.getElementById(`${provider}ModelDisplay`);

    if (settingsDropdown && displayDropdown) {
      settingsDropdown.addEventListener('change', function () {
        displayDropdown.value = this.value;
        localStorage.setItem(`${provider}Model`, this.value);
      });

      displayDropdown.addEventListener('change', function () {
        settingsDropdown.value = this.value;
        localStorage.setItem(`${provider}Model`, this.value);
      });
    }
  });
}

// Handle file upload
export function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) {
    return;
  }

  const filesList = document.getElementById('filesList');
  const inputText = document.getElementById('inputText');

  if (filesList) {
    filesList.innerHTML = '';
  }

  const existingContent = inputText ? inputText.value : '';
  let combinedContent = existingContent ? existingContent + '\n\n' : '';
  let filesProcessed = 0;

  const filesContainer = document.createElement('div');
  filesContainer.className = 'd-flex flex-wrap gap-2';
  if (filesList) {
    filesList.appendChild(filesContainer);
  }

  Array.from(files).forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      const content = e.target.result;

      if (index > 0 || existingContent) {
        combinedContent += '\n\n';
      }
      combinedContent += `--- File: ${file.name} ---\n\n${content}`;

      const fileBadge = document.createElement('span');
      fileBadge.className = 'badge bg-primary';
      const badgeContent = `
        <i class="bi bi-file-text me-1"></i>${file.name}
        <button type="button" class="btn-close btn-close-white ms-2" style="font-size: 0.7rem;" 
                onclick="removeFile('${file.name.replace(/'/g, "\\'")}')"></button>
      `;
      // eslint-disable-next-line no-unsanitized/property
      fileBadge.innerHTML = DOMPurify.sanitize(badgeContent);
      filesContainer.appendChild(fileBadge);

      filesProcessed++;

      if (filesProcessed === files.length) {
        if (inputText) {
          inputText.value = combinedContent;
        }
        updateCounts(combinedContent);

        const notification = document.createElement('div');
        notification.className = 'alert alert-success alert-dismissible fade show mt-2';
        const notificationContent = `
          <strong>${files.length} file(s) loaded successfully!</strong>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        // eslint-disable-next-line no-unsanitized/property
        notification.innerHTML = DOMPurify.sanitize(notificationContent);
        if (filesList) {
          filesList.appendChild(notification);
        }

        const timeoutId = setTimeout(() => {
          notification.remove();
        }, 3000);

        // Store timeout for cleanup
        if (window.appTimers) {
          window.appTimers.add(timeoutId);
        }
      }
    };

    reader.onerror = function () {
      showError(`Failed to read file: ${file.name}`);
    };

    reader.readAsText(file);
  });
}

// Show error message
export function showError(message) {
  const errorMessage = document.getElementById('errorMessage');
  const errorAlert = document.getElementById('errorAlert');

  if (errorMessage) {
    errorMessage.textContent = message;
  }
  if (errorAlert) {
    errorAlert.style.display = 'block';
    const timeoutId = setTimeout(() => {
      errorAlert.style.display = 'none';
    }, 5000);

    // Store timeout for cleanup
    if (window.appTimers) {
      window.appTimers.add(timeoutId);
    }
  }
}

// Legacy logger utility - now uses global structured logger
export const legacyLogger = {
  debug: (...args) => {
    if (localStorage.getItem('debugMode') === 'true') {
      logger.debug('legacy_debug', {
        args: args,
        component: 'utils',
      });
    }
  },
  info: (...args) =>
    logger.info('legacy_info', {
      args: args,
      component: 'utils',
    }),
  error: (...args) =>
    logger.error('legacy_error', {
      args: args,
      component: 'utils',
    }),

  saveLog: (level, message, data = {}) => {
    logger.info('legacy_save_log', {
      level: level,
      message: message,
      data: data,
      component: 'utils',
    });
    // Still save to localStorage for backward compatibility
    const logs = JSON.parse(localStorage.getItem('appLogs') || '[]');
    logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    });
    if (logs.length > 50) {
      logs.shift();
    }
    localStorage.setItem('appLogs', JSON.stringify(logs));
  },
};
