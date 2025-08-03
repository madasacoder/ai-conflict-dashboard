"""
Fixed version of LLM provider integrations with per-key circuit breakers.

This module provides a unified interface for interacting with multiple
LLM providers (OpenAI, Claude, Gemini, Grok) with proper error handling,
circuit breakers per API key, and structured logging.
"""

import asyncio
import os
import threading

import anthropic
import openai
from pybreaker import CircuitBreaker

from structured_logging import get_logger

logger = get_logger(__name__)

# Timeout for all LLM calls
TIMEOUT_SECONDS = 30

# Circuit breaker configuration per API key
BREAKER_FAIL_MAX = 5
BREAKER_TIMEOUT = 60

# Store circuit breakers per API key
circuit_breakers: dict[str, dict[str, CircuitBreaker]] = {
    "openai": {},
    "claude": {},
    "gemini": {},
    "grok": {},
    "ollama": {},  # Added for local LLMs
}
# Lock for thread-safe access to circuit breakers
_circuit_breaker_lock = threading.Lock()


def get_circuit_breaker(provider: str, api_key: str) -> CircuitBreaker:
    """Get or create a circuit breaker for a specific provider and API key.

    Args:
        provider: The provider name (openai, claude, gemini, grok)
        api_key: The API key for the provider

    Returns:
        CircuitBreaker instance for this provider/key combination
    """
    with _circuit_breaker_lock:
        if api_key not in circuit_breakers[provider]:
            # Create new circuit breaker for this API key
            breaker = CircuitBreaker(
                fail_max=BREAKER_FAIL_MAX,
                reset_timeout=BREAKER_TIMEOUT,  # Fixed parameter name
                name=f"{provider}_{api_key[:8]}...{api_key[-4:]}",  # Partial key in name for logging
            )

            # Skip callbacks for now - they're causing issues
            # TODO: Fix callback implementation

            circuit_breakers[provider][api_key] = breaker
            logger.info(
                f"Created new circuit breaker for {provider}",
                provider=provider,
                key_prefix=api_key[:8],
            )

        return circuit_breakers[provider][api_key]


def on_circuit_open(breaker: CircuitBreaker) -> None:
    """Log when circuit breaker opens."""
    from structured_logging import log_circuit_breaker_event

    log_circuit_breaker_event(
        logger,
        breaker_name=breaker.name,
        state="open",
        fail_count=breaker.fail_counter,
    )


def on_circuit_close(breaker: CircuitBreaker) -> None:
    """Log when circuit breaker closes."""
    from structured_logging import log_circuit_breaker_event

    log_circuit_breaker_event(logger, breaker_name=breaker.name, state="closed", fail_count=0)


async def call_openai(text: str, api_key: str | None = None, model: str = "gpt-3.5-turbo") -> dict:
    """Call OpenAI API with circuit breaker protection.

    Args:
        text: The input text to process
        api_key: OpenAI API key (optional, can use env var)
        model: The model to use (default: gpt-3.5-turbo)

    Returns:
        dict with model, response, and error fields
    """
    if not api_key:
        api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        logger.warning("OpenAI API key not provided")
        return {
            "model": "openai",
            "response": "",
            "error": "OpenAI API key not provided",
        }

    # Get circuit breaker for this API key
    breaker = get_circuit_breaker("openai", api_key)

    # Check if circuit is open
    if breaker.current_state == "open":
        logger.warning(f"OpenAI circuit breaker is open for key {api_key[:8]}...")
        return {
            "model": "openai",
            "response": "",
            "error": "Service temporarily unavailable (circuit breaker open)",
        }

    try:
        result = await _call_openai_with_breaker(text, api_key, model, breaker)
        return result
    except TimeoutError:
        logger.error("OpenAI request timeout", timeout=TIMEOUT_SECONDS)
        return {
            "model": "openai",
            "response": "",
            "error": f"Request timeout ({TIMEOUT_SECONDS}s)",
        }
    except Exception as e:
        logger.error(f"OpenAI call failed: {e!s}", error=str(e))
        return {"model": "openai", "response": "", "error": str(e)}


async def _call_openai_with_breaker(
    text: str, api_key: str, model: str, breaker: CircuitBreaker
) -> dict:
    """Internal function wrapped with circuit breaker.

    Args:
        text: The input text
        api_key: API key
        model: Model name
        breaker: Circuit breaker instance

    Returns:
        dict with response
    """

    @breaker
    def call_with_breaker():
        return _make_openai_call(text, api_key, model)

    # Use asyncio.wait_for for timeout
    result = await asyncio.wait_for(asyncio.to_thread(call_with_breaker), timeout=TIMEOUT_SECONDS)
    return result


def _make_openai_call(text: str, api_key: str, model: str) -> dict:
    """Make the actual OpenAI API call."""
    client = openai.OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant. Analyze the provided text and provide insights.",
            },
            {"role": "user", "content": text},
        ],
        max_tokens=1000,
        temperature=0.7,
    )

    return {
        "model": "openai",
        "response": response.choices[0].message.content,
        "error": None,
    }


# Similar changes for Claude, Gemini, and Grok...
async def call_claude(
    text: str, api_key: str | None = None, model: str = "claude-3-haiku-20240307"
) -> dict:
    """Call Claude API with per-key circuit breaker protection."""
    if not api_key:
        api_key = os.getenv("CLAUDE_API_KEY")

    if not api_key:
        logger.warning("Claude API key not provided")
        return {
            "model": "claude",
            "response": "",
            "error": "Claude API key not provided",
        }

    # Get circuit breaker for this API key
    breaker = get_circuit_breaker("claude", api_key)

    if breaker.current_state == "open":
        logger.warning(f"Claude circuit breaker is open for key {api_key[:8]}...")
        return {
            "model": "claude",
            "response": "",
            "error": "Service temporarily unavailable (circuit breaker open)",
        }

    try:
        result = await _call_claude_with_breaker(text, api_key, model, breaker)
        return result
    except TimeoutError:
        logger.error("Claude request timeout", timeout=TIMEOUT_SECONDS)
        return {
            "model": "claude",
            "response": "",
            "error": f"Request timeout ({TIMEOUT_SECONDS}s)",
        }
    except Exception as e:
        logger.error(f"Claude call failed: {e!s}", error=str(e))
        return {"model": "claude", "response": "", "error": str(e)}


async def _call_claude_with_breaker(
    text: str, api_key: str, model: str, breaker: CircuitBreaker
) -> dict:
    """Internal Claude function with circuit breaker."""

    @breaker
    def call_with_breaker():
        client = anthropic.Anthropic(api_key=api_key)

        response = client.messages.create(
            model=model,
            max_tokens=1000,
            temperature=0.7,
            messages=[{"role": "user", "content": text}],
        )

        return {
            "model": "claude",
            "response": response.content[0].text,
            "error": None,
        }

    result = await asyncio.wait_for(asyncio.to_thread(call_with_breaker), timeout=TIMEOUT_SECONDS)
    return result


# Clean up old circuit breakers periodically
async def cleanup_old_breakers():
    """Remove circuit breakers that haven't been used in 24 hours.

    This prevents memory growth from accumulating breakers for old/invalid keys.
    Should be called periodically (e.g., daily).
    """
    # TODO: Implement cleanup based on last used timestamp
    pass


async def analyze_with_models(
    text: str,
    openai_key: str | None = None,
    claude_key: str | None = None,
    gemini_key: str | None = None,
    grok_key: str | None = None,
    ollama_model: str | None = None,  # Added for Ollama
    openai_model: str = "gpt-3.5-turbo",
    claude_model: str = "claude-3-haiku-20240307",
    gemini_model: str = "gemini-1.5-flash",
    grok_model: str = "grok-2-latest",
) -> list[dict]:
    """Analyze text with multiple models concurrently.

    Each model now has its own circuit breaker per API key,
    so one user's failures don't affect other users.
    """
    tasks = []

    if openai_key:
        tasks.append(call_openai(text, openai_key, openai_model))
    if claude_key:
        tasks.append(call_claude(text, claude_key, claude_model))
    if gemini_key:
        tasks.append(call_gemini(text, gemini_key, gemini_model))
    if grok_key:
        tasks.append(call_grok(text, grok_key, grok_model))
    if ollama_model:
        tasks.append(call_ollama_fixed(text, ollama_model))

    if not tasks:
        logger.warning("No API keys provided for analysis")
        return []

    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Handle any exceptions that occurred
    processed_results = []
    model_names = []

    # Build list of model names based on what was called
    if openai_key:
        model_names.append("openai")
    if claude_key:
        model_names.append("claude")
    if gemini_key:
        model_names.append("gemini")
    if grok_key:
        model_names.append("grok")
    if ollama_model:
        model_names.append(f"ollama/{ollama_model}")

    for i, result in enumerate(results):
        if isinstance(result, Exception):
            model_name = model_names[i] if i < len(model_names) else "unknown"
            processed_results.append({"model": model_name, "response": "", "error": str(result)})
        else:
            processed_results.append(result)

    return processed_results


async def call_gemini(
    text: str, api_key: str | None = None, model: str = "gemini-1.5-flash"
) -> dict:
    """Call Gemini API with per-key circuit breaker protection.

    Args:
        text: The input text to process
        api_key: Gemini API key (optional, can use env var)
        model: The model to use (default: gemini-1.5-flash)

    Returns:
        dict with model, response, and error fields
    """
    if not api_key:
        api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        logger.warning("Gemini API key not provided")
        return {
            "model": "gemini",
            "response": "",
            "error": "Gemini API key not provided",
        }

    # Get circuit breaker for this API key
    breaker = get_circuit_breaker("gemini", api_key)

    if breaker.current_state == "open":
        logger.warning(f"Gemini circuit breaker is open for key {api_key[:8]}...")
        return {
            "model": "gemini",
            "response": "",
            "error": "Service temporarily unavailable (circuit breaker open)",
        }

    try:
        result = await _call_gemini_with_breaker(text, api_key, model, breaker)
        return result
    except TimeoutError:
        logger.error("Gemini request timeout", timeout=TIMEOUT_SECONDS)
        return {
            "model": "gemini",
            "response": "",
            "error": f"Request timeout ({TIMEOUT_SECONDS}s)",
        }
    except Exception as e:
        logger.error(f"Gemini call failed: {e!s}", error=str(e))
        return {"model": "gemini", "response": "", "error": str(e)}


async def _call_gemini_with_breaker(
    text: str, api_key: str, model: str, breaker: CircuitBreaker
) -> dict:
    """Internal Gemini function with circuit breaker."""

    @breaker
    def call_with_breaker():
        # Mock implementation for testing
        # In production, this would use google.generativeai
        return {
            "model": "gemini",
            "response": f"Mock Gemini response for: {text[:50]}...",
            "error": None,
        }

    result = await asyncio.wait_for(asyncio.to_thread(call_with_breaker), timeout=TIMEOUT_SECONDS)
    return result


async def call_grok(text: str, api_key: str | None = None, model: str = "grok-2-latest") -> dict:
    """Call Grok (xAI) API with per-key circuit breaker protection.

    Args:
        text: The input text to process
        api_key: xAI API key (optional, can use env var)
        model: The model to use (default: grok-2-latest)

    Returns:
        dict with model, response, and error fields
    """
    if not api_key:
        api_key = os.getenv("GROK_API_KEY")

    if not api_key:
        logger.warning("Grok API key not provided")
        return {
            "model": "grok",
            "response": "",
            "error": "Grok API key not provided",
        }

    # Get circuit breaker for this API key
    breaker = get_circuit_breaker("grok", api_key)

    if breaker.current_state == "open":
        logger.warning(f"Grok circuit breaker is open for key {api_key[:8]}...")
        return {
            "model": "grok",
            "response": "",
            "error": "Service temporarily unavailable (circuit breaker open)",
        }

    try:
        result = await _call_grok_with_breaker(text, api_key, model, breaker)
        return result
    except TimeoutError:
        logger.error("Grok request timeout", timeout=TIMEOUT_SECONDS)
        return {
            "model": "grok",
            "response": "",
            "error": f"Request timeout ({TIMEOUT_SECONDS}s)",
        }
    except Exception as e:
        logger.error(f"Grok call failed: {e!s}", error=str(e))
        return {"model": "grok", "response": "", "error": str(e)}


async def _call_grok_with_breaker(
    text: str, api_key: str, model: str, breaker: CircuitBreaker
) -> dict:
    """Internal Grok function with circuit breaker."""

    @breaker
    def call_with_breaker():
        # Mock implementation for testing
        # In production, this would use OpenAI-compatible endpoint
        return {
            "model": "grok",
            "response": f"Mock Grok response for: {text[:50]}...",
            "error": None,
        }

    result = await asyncio.wait_for(asyncio.to_thread(call_with_breaker), timeout=TIMEOUT_SECONDS)
    return result


async def call_ollama_fixed(text: str, model: str = "llama2", base_url: str | None = None) -> dict:
    """Call Ollama for local LLM processing.

    Args:
        text: The input text to process
        model: Ollama model to use (default: llama2)
        base_url: Optional Ollama base URL

    Returns:
        dict with model, response, and error fields
    """
    # Import here to avoid circular dependency
    from plugins.ollama_provider import call_ollama

    logger.info(f"Calling Ollama with model {model}")

    try:
        # Call the Ollama provider
        result = await call_ollama(text, model=model, base_url=base_url)

        # Ensure consistent response format
        if result.get("error"):
            logger.warning(f"Ollama error: {result['error']}")
        else:
            logger.info(f"Ollama response received for model {model}")

        return result

    except Exception as e:
        logger.error(f"Ollama call failed: {e!s}", error=str(e))
        return {
            "model": f"ollama/{model}",
            "response": "",
            "error": f"Ollama error: {e!s}",
        }
