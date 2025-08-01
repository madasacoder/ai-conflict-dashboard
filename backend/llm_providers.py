import os
import asyncio
import logging
from typing import Optional
import aiohttp
import json
from asyncio import TimeoutError

logger = logging.getLogger(__name__)

# Constants for Phase 0 - keeping it simple
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
TIMEOUT_SECONDS = 30

async def call_openai(text: str, api_key: Optional[str] = None) -> dict:
    """
    Call OpenAI API with the given text.
    Returns dict with model, response, and error fields.
    """
    # TODO-P1: Add retry logic
    # TODO-P2: Add rate limiting
    
    if not api_key:
        return {
            "model": "openai",
            "response": "",
            "error": "OpenAI API key not provided"
        }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "gpt-3.5-turbo",  # Using 3.5 for cost efficiency in Phase 0
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant. Provide clear, concise responses."
            },
            {
                "role": "user",
                "content": text
            }
        ],
        "temperature": 0.7,
        "max_tokens": 1000  # TODO-P1: Make configurable
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                OPENAI_API_URL,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=TIMEOUT_SECONDS)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "model": "openai",
                        "response": data["choices"][0]["message"]["content"],
                        "error": None
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"OpenAI API error: {response.status} - {error_text}")
                    return {
                        "model": "openai",
                        "response": "",
                        "error": f"API error: {response.status}"
                    }
                    
    except TimeoutError:
        return {
            "model": "openai",
            "response": "",
            "error": "Request timeout (30s)"
        }
    except Exception as e:
        logger.error(f"OpenAI call failed: {str(e)}")
        return {
            "model": "openai",
            "response": "",
            "error": str(e)
        }

async def call_claude(text: str, api_key: Optional[str] = None) -> dict:
    """
    Call Claude API with the given text.
    Returns dict with model, response, and error fields.
    """
    # TODO-P1: Add retry logic
    # TODO-P2: Add rate limiting
    
    if not api_key:
        return {
            "model": "claude",
            "response": "",
            "error": "Claude API key not provided"
        }
    
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "claude-3-haiku-20240307",  # Using Haiku for cost efficiency in Phase 0
        "messages": [
            {
                "role": "user",
                "content": text
            }
        ],
        "max_tokens": 1000,  # TODO-P1: Make configurable
        "temperature": 0.7
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                CLAUDE_API_URL,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=TIMEOUT_SECONDS)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "model": "claude",
                        "response": data["content"][0]["text"],
                        "error": None
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"Claude API error: {response.status} - {error_text}")
                    return {
                        "model": "claude",
                        "response": "",
                        "error": f"API error: {response.status}"
                    }
                    
    except TimeoutError:
        return {
            "model": "claude",
            "response": "",
            "error": "Request timeout (30s)"
        }
    except Exception as e:
        logger.error(f"Claude call failed: {str(e)}")
        return {
            "model": "claude",
            "response": "",
            "error": str(e)
        }

async def analyze_with_models(text: str, openai_key: Optional[str], claude_key: Optional[str]) -> list[dict]:
    """
    Call multiple models in parallel and return all responses.
    """
    # Phase 0: Just two models for now
    # TODO-P1: Add more models (Gemini, Cohere, etc.)
    
    tasks = []
    
    # Always try to call available models
    if openai_key:
        tasks.append(call_openai(text, openai_key))
    if claude_key:
        tasks.append(call_claude(text, claude_key))
    
    # Add small delay to help with rate limits on free tiers
    if len(tasks) > 1:
        await asyncio.sleep(0.5)  # 500ms delay
    
    # TODO-P2: Add circuit breaker pattern here
    results = await asyncio.gather(*tasks)
    
    return results