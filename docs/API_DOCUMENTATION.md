# API Documentation - AI Conflict Dashboard

## Overview

The AI Conflict Dashboard API provides endpoints for analyzing text using multiple AI models simultaneously. It includes comprehensive security features, rate limiting, and monitoring capabilities.

## Base URL

```
http://localhost:8000
```

## Authentication

Currently, the API uses API keys provided by users for each AI service. Future versions will include user authentication.

## Rate Limits

- **Per Minute**: 60 requests
- **Per Hour**: 600 requests
- **Per Day**: 10,000 requests
- **Burst Size**: 100 requests

Rate limits are enforced per user (identified by API key or IP address).

## Endpoints

### 1. Root Endpoint

```http
GET /
```

Returns basic API information.

**Response:**
```json
{
    "message": "AI Conflict Dashboard API",
    "version": "0.1.0"
}
```

### 2. Health Check

```http
GET /api/health
```

Check if the API is healthy and operational.

**Response:**
```json
{
    "status": "healthy"
}
```

### 3. Memory Status

```http
GET /api/memory
```

Get current memory usage statistics.

**Response:**
```json
{
    "memory_usage_mb": 245.67,
    "memory_percent": 15.3,
    "total_memory_mb": 16384.0,
    "available_memory_mb": 13824.5,
    "status": "healthy",
    "cleanup_needed": false
}
```

### 4. Timeout Statistics

```http
GET /api/timeout-stats
```

Get timeout statistics for all operations.

**Response:**
```json
{
    "analyze_request": {
        "total_calls": 1523,
        "timeouts": 3,
        "success_rate": 99.8,
        "avg_duration": 1.85,
        "max_duration": 4.2
    }
}
```

### 5. Analyze Text (Main Endpoint)

```http
POST /api/analyze
```

Analyze text using multiple AI models and return all responses.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
    "text": "Your text to analyze",
    "openai_api_key": "sk-...",
    "claude_api_key": "sk-ant-...",
    "gemini_api_key": "AIza...",
    "grok_api_key": "xai-...",
    "openai_model": "gpt-4",
    "claude_model": "claude-3-opus-20240229",
    "gemini_model": "gemini-1.5-flash",
    "grok_model": "grok-2-latest"
}
```

**Parameters:**
- `text` (required): The text to analyze (max ~100K characters after chunking)
- `openai_api_key` (optional): OpenAI API key
- `claude_api_key` (optional): Anthropic API key
- `gemini_api_key` (optional): Google Gemini API key
- `grok_api_key` (optional): xAI Grok API key
- `openai_model` (optional): Model to use (default: "gpt-3.5-turbo")
- `claude_model` (optional): Model to use (default: "claude-3-haiku-20240307")
- `gemini_model` (optional): Model to use (default: "gemini-1.5-flash")
- `grok_model` (optional): Model to use (default: "grok-2-latest")

**Available Models:**

OpenAI:
- `gpt-3.5-turbo`
- `gpt-4`
- `gpt-4-turbo-preview`

Claude:
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

Gemini:
- `gemini-1.5-flash`
- `gemini-1.5-flash-latest`
- `gemini-1.5-flash-8b`
- `gemini-1.5-pro`
- `gemini-1.5-pro-latest`

Grok:
- `grok-2-latest`
- `grok-2-mini`
- `grok-beta`

**Response:**
```json
{
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_text": "Your text to analyze",
    "responses": [
        {
            "model": "gpt-4",
            "response": "AI response text...",
            "error": null
        },
        {
            "model": "claude-3-opus-20240229",
            "response": "AI response text...",
            "error": null
        },
        {
            "model": "gemini-1.5-flash",
            "response": "AI response text...",
            "error": null
        },
        {
            "model": "grok-2-latest",
            "response": "AI response text...",
            "error": null
        }
    ],
    "chunked": false,
    "chunk_info": null
}
```

**Response Fields:**
- `request_id`: Unique identifier for this request
- `original_text`: The input text
- `responses`: Array of model responses
- `chunked`: Whether text was split into chunks
- `chunk_info`: Details about chunking if applied

**Error Response (4xx/5xx):**
```json
{
    "detail": "Error message describing what went wrong"
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (empty text, invalid parameters) |
| 401 | Unauthorized (invalid API key) |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |
| 502 | Bad Gateway (upstream API error) |
| 503 | Service Unavailable (circuit breaker open) |
| 504 | Gateway Timeout (request took too long) |

## Security Features

### 1. Input Validation
- Maximum text length enforced
- XSS protection on all inputs
- SQL injection prevention
- Command injection protection

### 2. API Key Protection
- Keys are never logged
- Automatic sanitization in error messages
- Keys stored only in memory during request

### 3. CORS Configuration
- Development: Allows localhost origins
- Production: Restricted to whitelisted domains
- Configurable via ALLOWED_ORIGINS environment variable

### 4. Rate Limiting
- Token bucket algorithm
- Per-user tracking
- Burst handling for legitimate spikes
- Returns 429 with retry-after header

### 5. Circuit Breakers
- Per-API-key isolation
- 5 failures trigger circuit breaker
- 60-second reset timeout
- Prevents cascade failures

## Response Headers

All responses include:

```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
X-Response-Time: 1850
Content-Type: application/json
```

Rate limited responses also include:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1706774400
Retry-After: 58
```

## WebSocket Support (Coming in Phase 4)

Future versions will support WebSocket connections for real-time streaming:

```
ws://localhost:8000/ws/analyze
```

## SDK Support (Coming in Phase 4)

Official SDKs planned for:
- Python
- JavaScript/TypeScript
- Go
- Java

## Example Usage

### cURL

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "What is the meaning of life?",
    "openai_api_key": "sk-...",
    "claude_api_key": "sk-ant-...",
    "openai_model": "gpt-4",
    "claude_model": "claude-3-opus-20240229"
  }'
```

### Python

```python
import requests

response = requests.post(
    "http://localhost:8000/api/analyze",
    json={
        "text": "What is the meaning of life?",
        "openai_api_key": "sk-...",
        "claude_api_key": "sk-ant-...",
        "openai_model": "gpt-4",
        "claude_model": "claude-3-opus-20240229"
    }
)

data = response.json()
for model_response in data["responses"]:
    print(f"{model_response['model']}: {model_response['response']}")
```

### JavaScript

```javascript
const response = await fetch('http://localhost:8000/api/analyze', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        text: 'What is the meaning of life?',
        openai_api_key: 'sk-...',
        claude_api_key: 'sk-ant-...',
        openai_model: 'gpt-4',
        claude_model: 'claude-3-opus-20240229'
    })
});

const data = await response.json();
data.responses.forEach(modelResponse => {
    console.log(`${modelResponse.model}: ${modelResponse.response}`);
});
```

## Monitoring and Observability

### Structured Logs

All requests are logged with structured JSON format:

```json
{
    "timestamp": "2025-01-30T12:34:56.789Z",
    "level": "info",
    "logger": "ai_conflict_dashboard.api",
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "event": "api_response",
    "method": "POST",
    "path": "/api/analyze",
    "status_code": 200,
    "duration_ms": 1850,
    "models_called": ["gpt-4", "claude-3-opus-20240229"],
    "chunked": false
}
```

### Metrics Endpoints

- `/api/memory` - Memory usage statistics
- `/api/timeout-stats` - Timeout and performance statistics

### Health Checks

- `/api/health` - Basic health check
- `/` - Root endpoint for uptime monitoring

## Best Practices

1. **API Keys**: Store securely, never commit to version control
2. **Rate Limits**: Implement exponential backoff on 429 errors
3. **Timeouts**: Set client timeout to 130 seconds (server timeout is 120)
4. **Error Handling**: Always check the error field in responses
5. **Chunking**: Be aware that long texts may be automatically chunked

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

*Last Updated: January 2025*
*API Version: 0.1.0*
*Documentation Version: 1.0.0*