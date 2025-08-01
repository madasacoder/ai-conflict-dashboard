# Changelog

All notable changes to the AI Conflict Dashboard project will be documented in this file.

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