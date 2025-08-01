from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from uuid import uuid4
from contextlib import asynccontextmanager
import time
import os

# Import our structured logging configuration
from structured_logging import (
    setup_structured_logging,
    get_logger,
    RequestContext,
    log_api_request,
    log_api_response,
)

# Import secure CORS configuration
from cors_config import get_allowed_origins

# Import rate limiting
from rate_limiting import RateLimiter, get_identifier

# Import memory management
from memory_management import memory_manager, RequestContext as MemoryContext, limit_response_size

# Import timeout handling
from timeout_handler import timeout_handler, get_timeout_stats, with_timeout, TimeoutError as AppTimeoutError

# Setup structured logging (DEBUG in development)
log_level = os.getenv("LOG_LEVEL", "DEBUG")
setup_structured_logging(level=log_level, log_file="backend.log")
logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager."""
    # Startup
    logger.info("Starting AI Conflict Dashboard API")
    await memory_manager.start()
    yield
    # Shutdown
    logger.info("Shutting down AI Conflict Dashboard API")
    await memory_manager.stop()

app = FastAPI(title="AI Conflict Dashboard", version="0.1.0", lifespan=lifespan)

# Create rate limiter instance
rate_limiter = RateLimiter(
    requests_per_minute=60,
    requests_per_hour=600, 
    requests_per_day=10000,
    burst_size=100
)

# Configure CORS with secure settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware to log all incoming HTTP requests and responses.

    Args:
        request: The incoming FastAPI request object.
        call_next: The next middleware or endpoint in the chain.

    Returns:
        The response object with added X-Request-ID header.
    """
    start_time = time.time()
    request_id = str(uuid4())

    # Use request context for all logs in this request
    with RequestContext(request_id):
        # Log request with structured logging
        log_api_request(
            logger,
            method=request.method,
            path=request.url.path,
            client=request.client.host if request.client else "unknown",
            query_params=dict(request.query_params),
        )

        # Process request
        response = await call_next(request)

        # Log response with structured logging
        process_time = (time.time() - start_time) * 1000  # Convert to ms
        log_api_response(
            logger, status_code=response.status_code, duration_ms=round(process_time, 2)
        )

        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        return response


# Add rate limiting middleware
@app.middleware("http")
async def rate_limit_requests(request: Request, call_next):
    """Middleware to rate limit incoming requests.
    
    Args:
        request: The incoming FastAPI request object.
        call_next: The next middleware or endpoint in the chain.
        
    Returns:
        The response or rate limit error.
    """
    # Skip rate limiting for health checks
    if request.url.path == "/api/health":
        return await call_next(request)
        
    # Get identifier for rate limiting
    identifier = get_identifier(request)
    
    # Check rate limit
    allowed, retry_after = rate_limiter.check_rate_limit(identifier)
    
    if not allowed:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded"},
            headers={"Retry-After": str(retry_after)} if retry_after else {}
        )
    
    # Process request if allowed
    return await call_next(request)


# Request/Response models
class AnalyzeRequest(BaseModel):
    text: str
    openai_key: Optional[str] = None
    claude_key: Optional[str] = None
    gemini_key: Optional[str] = None
    grok_key: Optional[str] = None
    openai_model: Optional[str] = "gpt-3.5-turbo"  # Default model
    claude_model: Optional[str] = "claude-3-haiku-20240307"  # Default model
    gemini_model: Optional[str] = "gemini-1.5-flash"  # Default model
    grok_model: Optional[str] = "grok-2-latest"  # Default model


class ModelResponse(BaseModel):
    model: str
    response: str
    error: Optional[str] = None


class AnalyzeResponse(BaseModel):
    request_id: str
    original_text: str
    responses: list[ModelResponse]
    chunked: bool = False
    chunk_info: Optional[dict] = None


@app.get("/")
async def root():
    """Root endpoint providing API information.

    Returns:
        dict: API name and version information.
    """
    return {"message": "AI Conflict Dashboard API", "version": "0.1.0"}


@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring.

    Returns:
        dict: Health status of the API.
    """
    return {"status": "healthy"}


@app.get("/api/memory")
async def memory_status():
    """Memory usage status endpoint.

    Returns:
        dict: Current memory usage statistics.
    """
    return memory_manager.check_memory_usage()


@app.get("/api/timeout-stats")
async def timeout_statistics():
    """Timeout statistics endpoint.

    Returns:
        dict: Timeout statistics for all operations.
    """
    return get_timeout_stats()


@app.post("/api/analyze", response_model=AnalyzeResponse)
@timeout_handler(operation="analyze_request", timeout=120, retry=False)
async def analyze_text(request: AnalyzeRequest):
    """Analyze text using multiple AI models and return all responses.

    This endpoint accepts text input and optionally API keys for OpenAI and Claude.
    It handles text chunking for large inputs and returns responses from all available models.

    Args:
        request: AnalyzeRequest object containing text and optional API keys.

    Returns:
        AnalyzeResponse: Contains request ID, original text, and model responses.

    Raises:
        HTTPException: If text is empty (400) or analysis fails (500).
    """
    # Basic validation
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Import here to avoid circular imports
    from llm_providers_fixed import analyze_with_models
    from token_utils import check_token_limits
    from smart_chunking import chunk_text_smart

    # Check token limits
    token_check = check_token_limits(request.text)
    logger.info(
        "Token check",
        extra={
            "estimated_tokens": token_check["estimated_tokens"],
            "safe_for_all": token_check["safe_for_all"],
            "warnings_count": len(token_check["warnings"]),
        },
    )

    # Store original text before any modifications
    original_text = request.text

    # Determine if we need to chunk for GPT-3.5
    needs_chunking = False
    chunk_info = None

    # Check if OpenAI key is provided and text exceeds limits
    if request.openai_key and token_check["estimated_tokens"] > 3000:
        needs_chunking = True
        logger.info("Text exceeds GPT-3.5 limits, will process first chunk only")

        # Get chunks
        chunks = chunk_text_smart(request.text, chunk_size=10000)  # ~2500 tokens
        chunk_info = {
            "total_chunks": len(chunks),
            "processing_chunk": 1,
            "chunk_tokens": token_check["estimated_tokens"] // len(chunks),
        }

        # For now, just process the first chunk
        # TODO: In future, could process all chunks and combine
        request.text = chunks[0]  # chunks is a list of strings

        if len(chunks) > 1:
            request.text += f"\n\n[Note: This is chunk 1 of {len(chunks)}. Text was truncated to fit API limits.]"

    # Generate request ID
    request_id = str(uuid4())

    logger.info(
        f"Processing analyze request {request_id}",
        extra={
            "request_id": request_id,
            "text_length": len(request.text),
            "has_openai_key": bool(request.openai_key),
            "has_claude_key": bool(request.claude_key),
            "has_gemini_key": bool(request.gemini_key),
            "has_grok_key": bool(request.grok_key),
        },
    )

    # Use memory context to track this request
    with MemoryContext(request_id) as mem_ctx:
        # Add large text to tracked resources
        mem_ctx.add_resource("request_text", request.text)
        mem_ctx.add_resource("original_text", original_text)
        
        try:
            # Call all models in parallel
            responses = await analyze_with_models(
                request.text,
                request.openai_key,
                request.claude_key,
                request.gemini_key,
                request.grok_key,
                request.openai_model,
                request.claude_model,
                request.gemini_model,
                request.grok_model,
            )

            # Log model responses
            for resp in responses:
                logger.debug(
                    "Model response received",
                    extra={
                        "request_id": request_id,
                        "model": resp["model"],
                        "has_error": bool(resp["error"]),
                        "response_length": len(resp["response"]) if resp["response"] else 0,
                    },
                )

            # Convert to response format and limit response sizes
            model_responses = []
            for resp in responses:
                # Limit response size to prevent memory issues
                limited_response = limit_response_size(resp["response"]) if resp["response"] else ""
                model_responses.append(
                    ModelResponse(
                        model=resp["model"], 
                        response=limited_response, 
                        error=resp["error"]
                    )
                )
                # Track response in memory context
                mem_ctx.add_resource(f"response_{resp['model']}", limited_response)

            logger.info(
                "Analysis completed successfully",
                extra={
                    "request_id": request_id,
                    "successful_models": sum(1 for r in responses if not r["error"]),
                },
            )

            return AnalyzeResponse(
                request_id=request_id,
                original_text=original_text[:500],  # Truncate for response
                responses=model_responses,
                chunked=needs_chunking,
                chunk_info=chunk_info,
            )

        except AppTimeoutError as e:
            logger.error(
                f"Request timed out for {request_id}",
                extra={
                    "request_id": request_id,
                    "operation": e.operation,
                    "timeout": e.timeout,
                    "elapsed": e.elapsed,
                },
            )
            raise HTTPException(
                status_code=504,
                detail=f"Request timed out after {e.elapsed:.1f}s"
            )
        except Exception as e:
            logger.error(
                f"Analysis failed for request {request_id}",
                extra={
                    "request_id": request_id,
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                },
                exc_info=True,
            )

            # Return more detailed error in development
            if log_level == "DEBUG":
                raise HTTPException(
                    status_code=500, detail=f"Analysis failed: {type(e).__name__}: {str(e)}"
                )
            else:
                raise HTTPException(status_code=500, detail="Analysis failed")
