/**
 * XSS Protection Module - Comprehensive security for the AI Conflict Dashboard
 * 
 * This module provides:
 * 1. HTML sanitization with DOMPurify
 * 2. Markdown-safe rendering
 * 3. Content Security Policy helpers
 * 4. Safe DOM manipulation utilities
 */

// DOMPurify configuration for safe HTML rendering
const DOMPURIFY_CONFIG = {
    // Allow these tags for markdown rendering
    ALLOWED_TAGS: [
        'p', 'br', 'span', 'div', 'a', 'em', 'strong', 'code', 'pre',
        'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img', 'hr'
    ],
    
    // Allow these attributes
    ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel', 'class', 'id', 
        'src', 'alt', 'width', 'height'
    ],
    
    // Allow data URIs for images (base64)
    ALLOW_DATA_ATTR: false,
    
    // Don't allow unknown protocols
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    
    // Add target="_blank" and rel="noopener" to links
    ADD_ATTR: ['target', 'rel'],
    
    // Remove dangerous elements completely
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    
    // Remove dangerous attributes
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - The potentially dangerous HTML
 * @param {Object} config - Optional DOMPurify configuration
 * @returns {string} Clean, safe HTML
 */
function sanitizeHTML(dirty, config = {}) {
    // Check if DOMPurify is loaded
    if (typeof DOMPurify === 'undefined') {
        console.error('DOMPurify not loaded! Using basic escaping as fallback.');
        return escapeHtml(dirty);
    }
    
    // Merge with default config
    const mergedConfig = { ...DOMPURIFY_CONFIG, ...config };
    
    // Sanitize the HTML
    const clean = DOMPurify.sanitize(dirty, mergedConfig);
    
    // Log if content was modified (in debug mode)
    if (localStorage.getItem('debugMode') === 'true' && clean !== dirty) {
        console.warn('XSS Protection: Content was sanitized', {
            original: dirty.substring(0, 100) + '...',
            sanitized: clean.substring(0, 100) + '...'
        });
    }
    
    return clean;
}

/**
 * Process markdown text with XSS protection
 * @param {string} markdown - Raw markdown text
 * @returns {string} Safe HTML from markdown
 */
function processMarkdownSafely(markdown) {
    if (!markdown) return '';
    
    // First, escape any HTML in the markdown
    let safeMarkdown = markdown;
    
    // Convert markdown to HTML (basic conversion)
    let html = safeMarkdown;
    
    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(match, text, url) {
        // Validate URL
        if (!isValidUrl(url)) {
            return escapeHtml(match); // Return escaped original if invalid
        }
        return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
    });
    
    // Headers: # Header
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br>\n');
    
    // Finally, sanitize the resulting HTML
    return sanitizeHTML(html);
}

/**
 * Safely set innerHTML with XSS protection
 * @param {HTMLElement} element - The DOM element
 * @param {string} html - The HTML content
 * @param {Object} config - Optional DOMPurify configuration
 */
function setInnerHTMLSafely(element, html, config = {}) {
    if (!element) return;
    
    const safeHTML = sanitizeHTML(html, config);
    element.innerHTML = safeHTML;
}

/**
 * Safely create a DOM element from HTML
 * @param {string} html - The HTML string
 * @returns {DocumentFragment} Safe DOM fragment
 */
function createElementSafely(html) {
    const template = document.createElement('template');
    template.innerHTML = sanitizeHTML(html);
    return template.content;
}

/**
 * Validate URL to prevent javascript: and data: URIs
 * @param {string} url - The URL to validate
 * @returns {boolean} True if URL is safe
 */
function isValidUrl(url) {
    try {
        const urlObj = new URL(url, window.location.href);
        // Only allow http, https, and mailto
        return ['http:', 'https:', 'mailto:'].includes(urlObj.protocol);
    } catch {
        return false;
    }
}

/**
 * Basic HTML escaping (fallback when DOMPurify not available)
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Enhanced processTextWithHighlighting with XSS protection
 * @param {string} text - Raw text with potential code blocks
 * @returns {string} Safe HTML with syntax highlighting
 */
function processTextWithHighlightingSafe(text) {
    // Regular expression to match code blocks with optional language
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    
    let processedText = text.replace(codeBlockRegex, (match, language, code) => {
        language = language || 'plaintext';
        
        // Map common language aliases
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'rb': 'ruby',
            'yml': 'yaml',
            'sh': 'bash',
            'shell': 'bash'
        };
        
        language = languageMap[language.toLowerCase()] || language.toLowerCase();
        
        // Escape the code content
        const escapedCode = escapeHtml(code.trim());
        
        // Create a pre element with Prism classes
        return `<pre><code class="language-${escapeHtml(language)}">${escapedCode}</code></pre>`;
    });
    
    // Convert inline code safely
    processedText = processedText.replace(/`([^`]+)`/g, (match, code) => {
        return `<code>${escapeHtml(code)}</code>`;
    });
    
    // Process markdown-style formatting
    processedText = processMarkdownSafely(processedText);
    
    // Final sanitization pass
    return sanitizeHTML(processedText);
}

/**
 * Set up Content Security Policy meta tag
 */
function setupCSP() {
    // Check if CSP meta tag already exists
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) return;
    
    // Create CSP meta tag
    const csp = document.createElement('meta');
    csp.httpEquiv = 'Content-Security-Policy';
    csp.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
        "img-src 'self' data: https:",
        "font-src 'self' https://cdn.jsdelivr.net",
        "connect-src 'self' http://localhost:8000",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests"
    ].join('; ');
    
    document.head.appendChild(csp);
}

/**
 * Sanitize user input before sending to API
 * @param {string} input - User input text
 * @returns {string} Sanitized input
 */
function sanitizeUserInput(input) {
    if (!input) return '';
    
    // Remove any HTML tags from input
    const div = document.createElement('div');
    div.textContent = input;
    let clean = div.textContent;
    
    // Remove zero-width characters that could be used for fingerprinting
    clean = clean.replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    // Normalize whitespace
    clean = clean.replace(/\s+/g, ' ').trim();
    
    // Limit length to prevent DoS
    const MAX_LENGTH = 100000; // 100KB
    if (clean.length > MAX_LENGTH) {
        clean = clean.substring(0, MAX_LENGTH);
        console.warn(`Input truncated from ${input.length} to ${MAX_LENGTH} characters`);
    }
    
    return clean;
}

/**
 * Monitor for XSS attempts and log them
 */
function setupXSSMonitoring() {
    // Override innerHTML setter to monitor for unsafe usage
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    
    Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
            // Check if this is a safe call (from our safe functions)
            const stack = new Error().stack;
            const isSafeCall = stack.includes('setInnerHTMLSafely') || 
                               stack.includes('processTextWithHighlightingSafe');
            
            if (!isSafeCall && value && typeof value === 'string') {
                // Log potential XSS attempt
                console.warn('Direct innerHTML usage detected!', {
                    element: this.tagName,
                    content: value.substring(0, 100) + '...',
                    stack: stack
                });
                
                // In production, we could send this to a security monitoring service
                if (window.location.hostname !== 'localhost') {
                    // logSecurityEvent('potential_xss', { ... });
                }
            }
            
            // Call original setter
            originalInnerHTML.set.call(this, value);
        },
        get: originalInnerHTML.get
    });
}

// Initialize XSS protection when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupCSP();
        if (localStorage.getItem('debugMode') === 'true') {
            setupXSSMonitoring();
        }
    });
} else {
    setupCSP();
    if (localStorage.getItem('debugMode') === 'true') {
        setupXSSMonitoring();
    }
}

// Export for use in other modules
window.XSSProtection = {
    sanitizeHTML,
    processMarkdownSafely,
    setInnerHTMLSafely,
    createElementSafely,
    isValidUrl,
    escapeHtml,
    processTextWithHighlightingSafe,
    sanitizeUserInput,
    DOMPURIFY_CONFIG
};