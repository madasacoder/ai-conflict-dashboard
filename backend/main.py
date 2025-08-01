from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio
import logging
from uuid import uuid4
import time
import os

# Import our logging configuration
from logging_config import setup_logging, get_logger

# Setup logging (DEBUG in development)
log_level = os.getenv("LOG_LEVEL", "DEBUG")
setup_logging(level=log_level, log_file="backend.log")
logger = get_logger(__name__)

app = FastAPI(title="AI Conflict Dashboard", version="0.1.0")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO-P2: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    request_id = str(uuid4())
    
    # Log request
    logger.info(f"Request started", extra={
        "request_id": request_id,
        "method": request.method,
        "path": request.url.path,
        "client": request.client.host if request.client else "unknown"
    })
    
    # Process request
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"Request completed", extra={
        "request_id": request_id,
        "status_code": response.status_code,
        "process_time": f"{process_time:.3f}s"
    })
    
    # Add request ID to response headers
    response.headers["X-Request-ID"] = request_id
    return response

# Request/Response models
class AnalyzeRequest(BaseModel):
    text: str
    openai_key: Optional[str] = None
    claude_key: Optional[str] = None

class ModelResponse(BaseModel):
    model: str
    response: str
    error: Optional[str] = None

class AnalyzeResponse(BaseModel):
    request_id: str
    original_text: str
    responses: list[ModelResponse]

@app.get("/")
async def root():
    return {"message": "AI Conflict Dashboard API", "version": "0.1.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeRequest):
    """
    Analyze text using multiple AI models and return all responses.
    """
    # Basic validation
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    # Import here to avoid circular imports
    from llm_providers import analyze_with_models
    from token_utils import check_token_limits
    
    # Check token limits
    token_check = check_token_limits(request.text)
    logger.info(f"Token check", extra={
        "estimated_tokens": token_check["estimated_tokens"],
        "safe_for_all": token_check["safe_for_all"],
        "warnings_count": len(token_check["warnings"])
    })
    
    # Log warnings but don't block - let the APIs handle their own limits
    if token_check["warnings"]:
        for warning in token_check["warnings"]:
            logger.warning(f"Token limit warning", extra=warning)
    
    # Generate request ID
    request_id = str(uuid4())
    
    logger.info(f"Processing analyze request {request_id}", extra={
        "request_id": request_id,
        "text_length": len(request.text),
        "has_openai_key": bool(request.openai_key),
        "has_claude_key": bool(request.claude_key)
    })
    
    try:
        # Call all models in parallel
        responses = await analyze_with_models(
            request.text,
            request.openai_key,
            request.claude_key
        )
        
        # Log model responses
        for resp in responses:
            logger.debug(f"Model response received", extra={
                "request_id": request_id,
                "model": resp["model"],
                "has_error": bool(resp["error"]),
                "response_length": len(resp["response"]) if resp["response"] else 0
            })
        
        # Convert to response format
        model_responses = [
            ModelResponse(
                model=resp["model"],
                response=resp["response"],
                error=resp["error"]
            )
            for resp in responses
        ]
        
        logger.info(f"Analysis completed successfully", extra={
            "request_id": request_id,
            "successful_models": sum(1 for r in responses if not r["error"])
        })
        
        return AnalyzeResponse(
            request_id=request_id,
            original_text=request.text[:500],  # Truncate for response
            responses=model_responses
        )
        
    except Exception as e:
        logger.error(f"Analysis failed for request {request_id}", extra={
            "request_id": request_id,
            "error_type": type(e).__name__,
            "error_message": str(e)
        }, exc_info=True)
        
        # Return more detailed error in development
        if log_level == "DEBUG":
            raise HTTPException(
                status_code=500, 
                detail=f"Analysis failed: {type(e).__name__}: {str(e)}"
            )
        else:
            raise HTTPException(status_code=500, detail="Analysis failed")
