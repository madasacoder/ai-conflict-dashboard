# Bug Database - AI Conflict Dashboard

## Overview
This document tracks all discovered bugs, their severity, impact, and resolution status.

## Bug Severity Levels
- **CRITICAL**: Security vulnerabilities or issues affecting all users
- **HIGH**: Functionality broken or significant UX issues  
- **MEDIUM**: Minor functionality issues or edge cases
- **LOW**: Cosmetic or minor inconvenience

## Active Bugs

None! All bugs have been fixed.

## Fixed Bugs

### BUG-001: Global Circuit Breakers Affect All Users
- **Severity**: CRITICAL
- **Status**: FIXED (2025-08-01)
- **Component**: Backend (llm_providers.py)
- **Discovered**: 2025-08-01
- **Description**: Circuit breakers are global singletons. When one user triggers the circuit breaker (e.g., with invalid API key), ALL users receive "circuit breaker open" errors for 60 seconds.
- **Impact**: Complete service disruption for all users when one user has issues
- **Fix**: Implemented per-API-key circuit breakers in `llm_providers_fixed.py`
- **Solution**: Each API key gets its own circuit breaker instance

### BUG-002: CORS Allows All Origins (Security)
- **Severity**: CRITICAL
- **Status**: FIXED (2025-08-01)
- **Component**: Backend (main.py)
- **Discovered**: 2025-08-01
- **Description**: CORS is configured to allow all origins ("*"), enabling any website to use the API
- **Impact**: API can be abused from any domain if attacker has valid API keys
- **Fix**: Implemented environment-based CORS in `cors_config.py`
- **Solution**: Development allows localhost, production restricts to whitelisted domains

### BUG-003: No Rate Limiting
- **Severity**: CRITICAL
- **Status**: FIXED (2025-08-01)
- **Component**: Backend (API layer)
- **Discovered**: 2025-08-01
- **Description**: No rate limiting implemented, allowing unlimited requests
- **Impact**: 
  - Easy DoS attacks
  - Can exhaust OpenAI/Claude API quotas
  - No protection against abuse
- **Fix**: Implemented comprehensive rate limiting in `rate_limiting.py`
- **Solution**: Token bucket algorithm with multiple time windows (minute/hour/day)

### BUG-004: Code Blocks Split During Chunking
- **Severity**: HIGH
- **Status**: FIXED (2025-08-01)
- **Component**: Backend (token_utils.py)
- **Discovered**: 2025-08-01
- **Description**: Text chunking can split in the middle of code blocks, breaking syntax highlighting
- **Impact**: Code becomes unreadable when split across chunks
- **Fix**: Implemented smart chunking in `smart_chunking.py`
- **Solution**: Preserves code blocks, respects markdown structure, maintains paragraph boundaries

### BUG-005: Unicode Token Counting Incorrect
- **Severity**: HIGH
- **Status**: FIXED (2025-08-01)
- **Component**: Backend (token_utils.py)
- **Discovered**: 2025-08-01
- **Description**: Token estimation uses simple char/4 calculation, severely undercounting for emojis and non-ASCII
- **Impact**: 
  - Requests fail with "token limit exceeded"
  - Users confused why short emoji text fails
- **Examples**:
  - "👨‍👩‍👧‍👦" counted as 1 token, actually 7+ tokens
  - "你好世界" undercounted
- **Fix**: Enhanced token_utils.py with Unicode-aware token counting
- **Solution**: Proper handling of emojis, CJK characters, and composite Unicode

### BUG-006: API Keys May Appear in Logs
- **Severity**: HIGH
- **Status**: FIXED (2025-08-01)
- **Component**: Backend (structured_logging.py)
- **Discovered**: 2025-08-01
- **Description**: If users include API keys in their text, they get logged
- **Impact**: API keys exposed in log files
- **Example**: User text: "My API key is sk-1234..." gets fully logged
- **Fix**: Enhanced structured_logging.py with automatic API key sanitization
- **Solution**: Regex patterns detect and mask sensitive data before logging

### BUG-007: Duplicate Filenames Confusing
- **Severity**: MEDIUM
- **Status**: FIXED (2025-08-01)
- **Component**: Frontend (file upload)
- **Discovered**: 2025-08-01
- **Description**: When uploading files with same name from different directories, badges show identical names
- **Impact**: Users can't distinguish between files
- **Example**: Two "utils.py" files show identically
- **Fix**: Enhanced file upload handler in index.html
- **Solution**: Automatic numbering for duplicate filenames (e.g., "utils.py (1)", "utils.py (2)")

### BUG-008: Memory Leak Potential with Large Responses
- **Severity**: MEDIUM
- **Status**: FIXED (2025-08-01)
- **Component**: Backend
- **Discovered**: 2025-08-01
- **Description**: Large API responses may not be garbage collected properly
- **Impact**: Memory usage grows over time
- **Root Cause**: No cleanup of large objects, unbounded response sizes, no request context management
- **Fix**: Created comprehensive memory_management.py module
- **Solution**: 
  - Automatic memory monitoring and periodic cleanup
  - Response size limiting (10MB max)
  - Request context tracking with automatic resource cleanup
  - Memory usage endpoints for monitoring
  - Weak references for response caching

### BUG-009: XSS Risk with Markdown Rendering
- **Severity**: MEDIUM
- **Status**: FIXED (2025-08-01)
- **Component**: Frontend (processTextWithHighlighting)
- **Discovered**: 2025-08-01
- **Description**: Using innerHTML for markdown rendering poses XSS risk
- **Impact**: Potential for malicious scripts if markdown parser has vulnerabilities
- **Root Cause**: Direct innerHTML usage without sanitization
- **Fix**: Created xss-protection.js module with DOMPurify integration
- **Solution**:
  - DOMPurify for HTML sanitization
  - Safe innerHTML wrapper functions
  - Content Security Policy implementation
  - Input sanitization before API calls
  - XSS monitoring in debug mode

### BUG-010: No Request Timeout Handling
- **Severity**: MEDIUM
- **Status**: FIXED (2025-08-01)
- **Component**: Backend/Frontend
- **Discovered**: 2025-08-01
- **Description**: Some edge cases might exceed 30s timeout
- **Impact**: Requests could hang indefinitely
- **Root Cause**: No timeout mechanism at application level
- **Fix**: Created timeout_handler.py module with adaptive timeouts
- **Solution**:
  - Configurable timeouts for different operations
  - Retry logic with exponential backoff
  - Adaptive timeout adjustment based on response times
  - Frontend timeout with AbortController
  - Proper 504 Gateway Timeout error handling

## Bug Metrics

- **Total Bugs Found**: 10
- **Fixed**: 10 (100% fix rate!)
- **Open**: 0
- **By Severity**:
  - Critical: 3 found, 3 fixed ✅
  - High: 3 found, 3 fixed ✅
  - Medium: 4 found, 4 fixed ✅
  - Low: 0 found

## Testing That Found These Bugs

1. **Adversarial Testing**: Thinking like an attacker
2. **Load Testing**: Multiple concurrent requests
3. **Edge Case Testing**: Unicode, huge inputs, malformed data
4. **Security Testing**: CORS, XSS, injection attempts
5. **Code Review**: Architectural issues like global state

## Coding Standards Compliance

All bug fixes must follow:
1. Google-style docstrings
2. Type hints (Python 3.11+ syntax)
3. 90%+ test coverage for fixes
4. Security validation for inputs
5. Structured logging for debugging
6. No temporary/duplicate files
7. Fix root cause, not symptoms