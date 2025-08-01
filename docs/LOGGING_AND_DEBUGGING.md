# Logging and Debugging Guide

This document describes the logging and debugging features added in Phase 0.1 to help with development and troubleshooting.

## Backend Logging

### Configuration
- **Log File**: `backend.log` (JSON format)
- **Console**: Human-readable format
- **Level**: Set via `LOG_LEVEL` environment variable (default: DEBUG)

### Features
1. **Structured JSON Logging**
   - Timestamp, level, module, function, line number
   - Custom fields for request tracking

2. **Request Tracking**
   - Unique request ID for each API call
   - Request ID returned in `X-Request-ID` header
   - Performance metrics (duration)

3. **Error Handling**
   - Full stack traces in debug mode
   - Sanitized errors in production
   - Error type and message logging

### Usage
```bash
# Start with debug logging
LOG_LEVEL=DEBUG uvicorn main:app --reload

# View logs with pretty formatting
tail -f backend.log | jq '.'

# Filter errors only
tail -f backend.log | jq 'select(.level == "ERROR")'

# Find specific request
grep "request-id-here" backend.log | jq '.'
```

### Log Format Example
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "logger": "main",
  "message": "Request completed",
  "module": "main",
  "function": "analyze_text",
  "line": 135,
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "status_code": 200,
  "process_time": "1.234s",
  "successful_models": 2
}
```

## Frontend Logging

### Configuration
- **Console**: Always enabled with timestamps
- **Persistent Storage**: Last 50 logs in localStorage
- **Debug Mode**: Enable with `localStorage.setItem('debugMode', 'true')`

### Features
1. **Console Logging Utility**
   ```javascript
   logger.debug('Debug message', { data });  // Only shows in debug mode
   logger.info('Info message');              // Always shows
   logger.error('Error message', error);     // Always shows with stack
   ```

2. **Persistent Logs**
   - Stored in `localStorage.appLogs`
   - Survives page refreshes
   - Limited to last 50 entries

3. **Debug UI**
   - Small panel in bottom-right when debug mode enabled
   - Quick access to view/clear logs
   - Shows current debug status

### Usage
```javascript
// Enable debug mode
localStorage.setItem('debugMode', 'true');
location.reload();

// View all logs
JSON.parse(localStorage.getItem('appLogs'));

// View logs in table format
console.table(JSON.parse(localStorage.getItem('appLogs')));

// Clear logs
localStorage.removeItem('appLogs');

// Disable debug mode
localStorage.removeItem('debugMode');
location.reload();
```

## Correlating Frontend and Backend Logs

Each request gets a unique ID that appears in both frontend and backend logs:

1. Frontend sends request → logs start time
2. Backend receives request → logs with request ID
3. Backend processes → logs each model response
4. Backend responds → includes `X-Request-ID` header
5. Frontend receives → logs request ID and duration

### Example Correlation
```javascript
// Frontend log
{
  "timestamp": "2024-01-15T10:30:45.100Z",
  "level": "info",
  "message": "Sending request to backend"
}

// Backend log (same request)
{
  "timestamp": "2024-01-15T10:30:45.150Z",
  "level": "INFO",
  "message": "Request started",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/api/analyze"
}

// Frontend log (response)
{
  "timestamp": "2024-01-15T10:30:46.350Z",
  "level": "info",
  "message": "Analysis successful",
  "data": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "duration": "1250ms"
  }
}
```

## Common Debugging Scenarios

### 1. API Key Issues
```javascript
// Check if keys are stored
localStorage.getItem('openaiKey');
localStorage.getItem('claudeKey');

// Look for 401/403 errors in logs
JSON.parse(localStorage.getItem('appLogs')).filter(log => log.data?.status === 401);
```

### 2. Slow Responses
```bash
# Find slow requests in backend
tail -f backend.log | jq 'select(.process_time | tonumber > 2)'
```

### 3. Failed Model Calls
```bash
# Find which models are failing
tail -f backend.log | jq 'select(.message == "Model response received" and .has_error == true)'
```

### 4. Connection Issues
```javascript
// Check frontend logs for fetch failures
JSON.parse(localStorage.getItem('appLogs')).filter(log => 
  log.data?.error?.includes('Failed to fetch')
);
```

## Best Practices

1. **Development**: Always run with `LOG_LEVEL=DEBUG`
2. **Testing**: Check logs after each test run
3. **Bug Reports**: Include relevant log entries
4. **Performance**: Monitor request durations
5. **Cleanup**: Clear logs periodically in development

## Future Enhancements (Phase 1+)

- [ ] Log aggregation service
- [ ] Real-time log viewer
- [ ] Performance dashboards
- [ ] Error alerting
- [ ] Log export functionality
- [ ] Structured log search UI