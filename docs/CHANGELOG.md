# Changelog

All notable changes to the AI Conflict Dashboard project will be documented in this file.

## [2025-08-01] - Phase 3 Security Hardening Complete

### Security Enhancements
- **Per-User Circuit Breakers**
  - Fixed critical bug where one user's API failure affected all users
  - Each API key now gets its own circuit breaker instance
  - Complete fault isolation between users
  - Implemented in `llm_providers_fixed.py`

- **Rate Limiting Implementation**
  - Token bucket algorithm with burst handling
  - Limits: 60 requests/minute, 600/hour, 10,000/day
  - Per-user tracking via API key or IP address
  - Middleware integration in `main.py`

- **Secure CORS Configuration**
  - Fixed vulnerability allowing requests from any origin
  - Environment-based whitelisting (dev/prod)
  - Centralized configuration in `cors_config.py`

- **Memory Management System**
  - Automatic garbage collection
  - 10MB response size limits
  - Request context tracking
  - Memory usage monitoring endpoints

- **Timeout Handling**
  - Adaptive timeout system with retry logic
  - Configurable timeouts for different operations
  - Frontend integration with AbortController
  - Proper 504 Gateway Timeout errors

- **XSS Protection**
  - DOMPurify integration for safe HTML rendering
  - Content Security Policy implementation
  - Input sanitization before API calls
  - XSS monitoring in debug mode

### Bug Fixes (10/10 Fixed - 100% Fix Rate)
- **CRITICAL**: BUG-001 - Global circuit breakers affecting all users
- **CRITICAL**: BUG-002 - CORS allowing all origins
- **CRITICAL**: BUG-003 - No rate limiting vulnerability
- **HIGH**: BUG-004 - Code blocks split during chunking
- **HIGH**: BUG-005 - Unicode token counting incorrect
- **HIGH**: BUG-006 - API keys appearing in logs
- **MEDIUM**: BUG-007 - Duplicate filenames confusing
- **MEDIUM**: BUG-008 - Memory leak potential
- **MEDIUM**: BUG-009 - XSS risk with markdown rendering
- **MEDIUM**: BUG-010 - No request timeout handling

### Enhanced Features
- **Smart Text Chunking**
  - Preserves code blocks intact
  - Respects markdown structure
  - Maintains paragraph boundaries
  - Configurable overlap between chunks

- **Log Sanitization**
  - Automatic API key masking
  - Sensitive data detection
  - Safe logging practices

- **Unicode Support**
  - Proper token counting for emojis
  - CJK character support
  - Composite Unicode handling

### Testing
- **Security Test Suite**
  - 22 comprehensive security tests added
  - All tests passing
  - Coverage for OWASP Top 10
  - Adversarial testing approach

- **Test Coverage**
  - Increased to 92.23%
  - 100+ total tests
  - Security-focused test cases

### New Files Added
- `cors_config.py` - Secure CORS configuration
- `rate_limiting.py` - Token bucket rate limiter
- `memory_management.py` - Memory lifecycle management
- `timeout_handler.py` - Adaptive timeout system
- `smart_chunking.py` - Intelligent text splitting
- `llm_providers_fixed.py` - Fixed provider with per-user breakers
- `token_utils_fixed.py` - Unicode-aware token counting
- `structured_logging_fixed.py` - Log sanitization
- `xss-protection.js` - Frontend XSS prevention
- `file-upload-fix.js` - Enhanced file handling
- `test_security_comprehensive.py` - Security test suite
- `test_adversarial.py` - Adversarial test cases
- `test_real_bugs.py` - Bug reproduction tests

### Documentation Updates
- Created `PHASE_3_COMPLETED.md` - Full completion report
- Updated `BUGS.md` - All 10 bugs documented and fixed
- Updated `IMPLEMENTATION_NOTES_PHASE3.md` - Technical details
- Updated README.md with all security features
- Updated ProjectOverview.md with current status
- Updated ROADMAP.md to reflect Phase 3 completion

## [2025-08-01] - Multiple File Upload & Model Selection UI

### Added
- **Multiple File Upload Support**
  - File input now accepts multiple files with `multiple` attribute
  - Drag-and-drop area supports multiple files simultaneously
  - Files are combined with clear separators: `--- File: filename.ext ---`
  - Visual file badges with close buttons for each uploaded file
  - Success notifications after file upload
  - Support for filtering unsupported file types during drag-and-drop

- **Always-Visible Model Selection**
  - New dedicated "Model Selection" section that's always visible
  - Shows all 4 AI providers: OpenAI, Claude, Gemini, and Grok
  - Each provider has its own visual card with:
    - Provider logo/icon
    - Model dropdown selector
    - Brief description of capabilities
  - Informational alert explaining API key requirements
  - Model selections sync with API settings dropdowns

- **UI Improvements**
  - Added `syncModelSelections()` function for dropdown synchronization
  - Added `updateCounts()` function for character/token counting
  - Enhanced drag-and-drop with better file type filtering
  - Improved visual feedback for file operations

### Technical Details
- Frontend changes in `index.html`:
  - Lines 372-452: New Model Selection section
  - Lines 464: Added `multiple` attribute to file input
  - Lines 1130-1204: Updated `handleFileUpload()` for multiple files
  - Lines 1260-1296: Enhanced drag-and-drop for multiple files
  - Lines 727-745: Added `syncModelSelections()` function
  - Lines 747-769: Added `updateCounts()` function

### Backend Status
- Test coverage: 92.23%
- All 72 tests passing
- Gemini and Grok providers fully integrated
- Circuit breakers active on all providers

## [2025-08-01] - Gemini & Grok Integration

### Added
- **Google Gemini Integration**
  - Full API integration with google-generativeai library
  - Support for multiple Gemini models (1.5 Flash, 1.5 Pro, etc.)
  - Circuit breaker protection
  - Comprehensive test coverage

- **xAI Grok Integration**
  - OpenAI-compatible API implementation
  - Support for Grok 2, Grok 2 Mini, and Grok Beta
  - Circuit breaker protection
  - Full test suite

### Modified
- Updated `llm_providers.py` with new provider functions
- Extended `AnalyzeRequest` model in `main.py`
- Added new API key fields in frontend
- Updated all documentation

### Quality Metrics
- Increased test coverage from 90.10% to 92.23%
- Added 13 new tests for Gemini and Grok
- All linting and security checks passing

---

## Version History

- **v0.3.0** (2025-08-01) - Phase 3 Security Complete
- **v0.2.0** (2025-08-01) - Phase 2 Production Ready
- **v0.1.0** (2025-07-25) - Phase 1 MVP Complete
- **v0.0.1** (2025-07-18) - Initial Proof of Concept