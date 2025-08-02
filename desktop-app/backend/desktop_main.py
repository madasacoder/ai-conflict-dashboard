"""
AI Conflict Dashboard - Desktop Backend
This imports and extends the existing web backend
"""

import sys
import os
from pathlib import Path

# Add parent backend to Python path
parent_backend = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(parent_backend))

# Import the existing backend components
from llm_providers import call_openai, call_claude, call_gemini, call_grok
from smart_chunking import chunk_text_smart
from token_utils import estimate_tokens

# Import plugins
from plugins.ollama_provider import OllamaProvider

# Now create our desktop-specific main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# App lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle app startup and shutdown."""
    print("🚀 AI Conflict Dashboard Desktop Backend Starting...")
    print(f"✅ Reusing backend code from: {parent_backend}")
    yield
    print("👋 AI Conflict Dashboard Desktop Backend Shutting Down...")

# Create FastAPI app
app = FastAPI(
    title="AI Conflict Dashboard Desktop API",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS for Tauri
origins = os.getenv("ALLOWED_ORIGINS", "tauri://localhost,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class HealthResponse(BaseModel):
    status: str
    version: str
    message: str

class AnalyzeRequest(BaseModel):
    text: str
    models: Dict[str, Dict[str, Any]]

class AnalyzeResponse(BaseModel):
    results: Dict[str, str]
    metadata: Dict[str, Any]

# Routes
@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - health check."""
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        message="AI Conflict Dashboard Desktop API (using shared backend)"
    )

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        message="All systems operational"
    )

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeRequest):
    """Analyze text with multiple AI models using the shared backend code."""
    results = {}
    
    # Process each enabled model
    for provider, config in request.models.items():
        if not config.get("enabled", False) or not config.get("key"):
            continue
            
        try:
            if provider == "openai":
                response = await call_openai(
                    api_key=config["key"],
                    model=config.get("model", "gpt-3.5-turbo"),
                    query=request.text
                )
                results[provider] = response
                
            elif provider == "claude":
                response = await call_claude(
                    api_key=config["key"],
                    model=config.get("model", "claude-3-haiku-20240307"),
                    query=request.text
                )
                results[provider] = response
                
            elif provider == "gemini":
                response = await call_gemini(
                    api_key=config["key"],
                    model=config.get("model", "gemini-1.5-flash"),
                    query=request.text
                )
                results[provider] = response
                
            elif provider == "grok":
                response = await call_grok(
                    api_key=config["key"],
                    model=config.get("model", "grok-2-latest"),
                    query=request.text
                )
                results[provider] = response
                
            elif provider == "ollama":
                async with OllamaProvider() as ollama:
                    response = await ollama.query(
                        model=config.get("model", "llama2"),
                        prompt=request.text
                    )
                    results[provider] = response
                    
        except Exception as e:
            results[provider] = f"Error: {str(e)}"
    
    if not results:
        raise HTTPException(status_code=400, detail="No models enabled or configured")
    
    # Use token counting from shared backend
    token_count = count_tokens(request.text)
    
    return AnalyzeResponse(
        results=results,
        metadata={
            "request_length": len(request.text),
            "token_count": token_count,
            "models_used": list(results.keys()),
            "timestamp": "2025-08-01T00:00:00Z"
        }
    )

@app.get("/api/models")
async def get_available_models():
    """Get list of available AI models."""
    # Check if Ollama is available
    ollama_models = []
    try:
        async with OllamaProvider() as ollama:
            ollama_models = await ollama.list_models()
    except:
        pass
    
    return {
        "providers": {
            "openai": {
                "name": "OpenAI",
                "models": ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
                "requires_key": True
            },
            "claude": {
                "name": "Anthropic Claude",  
                "models": ["claude-3-haiku-20240307", "claude-3-sonnet-20240229", "claude-3-opus-20240229"],
                "requires_key": True
            },
            "gemini": {
                "name": "Google Gemini",
                "models": ["gemini-1.5-flash", "gemini-1.5-pro"],
                "requires_key": True
            },
            "grok": {
                "name": "xAI Grok",
                "models": ["grok-2", "grok-2-mini", "grok-beta"],
                "requires_key": True
            },
            "ollama": {
                "name": "Ollama (Local)",
                "models": [m["name"] for m in ollama_models] if ollama_models else [],
                "requires_key": False
            }
        }
    }

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run(
        "desktop_main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )