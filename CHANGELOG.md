# Changelog

All notable changes to the AI Conflict Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Visual output display for workflow execution results
  - Results now show in a Bootstrap modal instead of just alerts
  - Nodes display visual feedback (green border for success, red for error)
  - LLM nodes show output preview (first 200 characters) directly on the node
  - Proper formatting for all languages including Chinese translations
- Comprehensive E2E testing framework for workflow builder
  - Created `WorkflowTestFramework` for high-level automation
  - Added multiple test scenarios for Ollama integration
  - Mock data tests for output display validation

### Fixed
- Bug #020: No visual output display after workflow execution
- Bug #018: CORS error on workflow execution (added OPTIONS method)
- Bug #012: Workflow execution not triggering (fixed API endpoint)
- Bug #009: Config panel animation timing issues
- Bug #006: Workflow execution with Ollama support
- Bug #005: Connection drag-and-drop implementation
- Bug #003: Added Ollama checkbox to UI
- Multiple workflow builder issues documented in E2E_BUGS_FOUND.md

### Changed
- Enhanced `showResults()` method with modal display
- Improved workflow executor to support Ollama without API keys
- Updated node configuration to remove GPT-4 as default selection

## [0.4.0] - 2024-01-15

### Added
- Ollama support for local LLM execution
- Backend restart capability
- Visual Workflow Builder (initial release)

## [0.3.0] - 2023-12-01

### Added
- Phase 3 Security Hardening
- Rate limiting with token bucket algorithm
- Per-user circuit breakers
- Memory management with automatic cleanup
- Timeout handling with adaptive adjustments
- XSS protection with DOMPurify
- Smart text chunking preserving code blocks

### Security
- Comprehensive input validation
- API key sanitization in logs
- CORS configuration
- No dynamic code execution
- Bounded response sizes

## [0.2.0] - 2023-11-15

### Added
- Grok API integration
- Searchable conversation history
- Multiple file upload support
- Dark/light theme toggle
- Collapsible UI sections

### Improved
- Token counting accuracy
- Error handling and recovery
- Performance optimizations

## [0.1.0] - 2023-11-01

### Added
- Initial release
- Multi-model comparison (OpenAI, Claude, Gemini)
- Side-by-side response display
- Syntax highlighting for code
- Basic file upload
- API key management