# Current State Analysis - AI Conflict Dashboard HTTPS/Ollama Issues

## Executive Summary
The application consists of a frontend (HTML/JS) and backend (FastAPI) that were working with HTTP. After implementing HTTPS to fix Safari JavaScript loading issues, the Ollama integration is now showing "type error" and preventing the application from working properly.

## Architecture Overview
```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Frontend       │────▶│  Backend API     │────▶│  Ollama LLM    │
│  (HTTPS:3000)   │     │  (HTTPS:8000)    │     │  (HTTP:11434)  │
└─────────────────┘     └──────────────────┘     └────────────────┘
```

## Current Problem
1. **Main Issue**: Ollama shows "type error" on the main page instead of status
2. **Secondary Issue**: Workflow builder page not loading
3. **Root Cause**: Frontend JavaScript files using hardcoded HTTP URLs instead of dynamic HTTPS URLs when page is served over HTTPS

## File Structure & Key Files

### Frontend Files (Port 3000)
- **`/frontend/index.html`** - Main dashboard page
  - Loads multiple JS files including config.js, ollama-fix.js, ollama-diagnostic.js
  - Has Ollama status badge that shows "type error"
  
- **`/frontend/workflow-builder.html`** - Visual workflow builder
  - Uses Drawflow library for drag & drop
  - Currently not loading due to similar HTTPS issues

- **`/frontend/js/config.js`** - API configuration
  ```javascript
  const API_BASE_URL = window.location.protocol === 'https:' 
      ? 'https://localhost:8000' 
      : 'http://localhost:8000';
  ```
  - Correctly detects HTTPS and sets appropriate backend URL

- **`/frontend/js/ollama-fix.js`** - Ollama status checker
  - **PROBLEM**: Had hardcoded `http://localhost:8000` URLs (lines 26, 58)
  - **FIXED**: Updated to use `window.API_CONFIG.BASE_URL`

- **`/frontend/js/ollama-diagnostic.js`** - Debugging tool
  - **PROBLEM**: Had hardcoded HTTP URLs (lines 104, 183, 266)
  - **FIXED**: Updated to use `window.API_CONFIG.BASE_URL`

### Backend Files (Port 8000)
- **`/backend/main.py`** - FastAPI application
  - Provides `/api/health` endpoint showing Ollama status
  - Provides `/api/ollama/models` endpoint listing available models
  - Detects Ollama running on port 11434

- **`/backend/https_server.py`** - HTTPS server wrapper
  - Uses mkcert certificates to serve backend over HTTPS
  - Required for Safari to allow frontend-backend communication

- **`/backend/cors_config.py`** - CORS configuration
  - Allows both HTTP and HTTPS origins
  - Includes localhost:3000 and localhost:8000

### Startup Scripts
- **`/start_all_https.sh`** - Main startup script
  - Generates certificates if missing
  - Starts both frontend and backend with HTTPS
  - Opens browser automatically

### Logs
- **`/logs/frontend_https.log`** - Shows 501 errors for POST /api/log
  - Python SimpleHTTPServer doesn't support POST
  - This prevents proper error logging

- **`/logs/backend_https.log`** - Shows backend running fine
  - Ollama detected with 11 models
  - Health endpoint responding

## Execution Flow

1. User runs `./start_all_https.sh`
2. Script starts HTTPS backend on port 8000
3. Script starts HTTPS frontend on port 3000
4. Browser opens https://localhost:3000
5. Frontend loads index.html
6. JavaScript files load including:
   - config.js (sets API URLs)
   - ollama-fix.js (checks Ollama status)
   - ollama-diagnostic.js (debugging)
7. ollama-fix.js tries to fetch from backend
8. **PROBLEM**: Was using hardcoded HTTP URL instead of HTTPS
9. Browser blocks mixed content or gets type error
10. UI shows "type error" instead of Ollama status

## Recent Changes Made
1. Fixed hardcoded HTTP URLs in ollama-fix.js to use dynamic API_CONFIG
2. Fixed hardcoded HTTP URLs in ollama-diagnostic.js to use dynamic API_CONFIG
3. These changes should resolve the type error

## Next Steps for Parallel AI
1. **Verify the fixes work**: Restart servers and test
2. **Check workflow-builder.html**: Likely has similar hardcoded URL issues
3. **Implement proper logging**: Frontend can't log errors due to SimpleHTTPServer limitations
4. **Add debug page**: Create a simple test page to verify HTTPS connectivity
5. **Document Safari workaround**: User needs to trust both certificates

## Testing Commands
```bash
# Stop everything
./stop_app.sh

# Start with HTTPS
./start_all_https.sh

# Check backend health
curl -k https://localhost:8000/api/health

# Check Ollama endpoint
curl -k https://localhost:8000/api/ollama/models

# Debug in browser console
window.API_CONFIG
runOllamaDiagnostic()
```

## Known Issues
1. Safari requires manually trusting certificates for both frontend and backend
2. SimpleHTTPServer can't handle POST requests for logging
3. Some JavaScript files may still have hardcoded HTTP URLs
4. No proper error handling when certificates aren't trusted

## Solution Path
The immediate fix is to ensure all JavaScript files use the dynamic API_CONFIG instead of hardcoded URLs. The changes just made to ollama-fix.js and ollama-diagnostic.js should resolve the type error once the servers are restarted.