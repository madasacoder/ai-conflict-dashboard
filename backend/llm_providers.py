import asyncio
import time
from typing import Optional
import aiohttp
from asyncio import TimeoutError
from pybreaker import CircuitBreaker
from structured_logging import get_logger, log_llm_call, log_circuit_breaker_event
import google.generativeai as genai

logger = get_logger(__name__)

# Constants for Phase 0 - keeping it simple
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"
GROK_API_URL = "https://api.x.ai/v1/chat/completions"
TIMEOUT_SECONDS = 30


# Circuit breaker event listeners
def on_circuit_open(breaker):
    """Log when circuit breaker opens.

    Args:
        breaker: The PyBreaker CircuitBreaker instance that opened.
    """
    log_circuit_breaker_event(
        logger, breaker.name, "open", fail_count=breaker.fail_counter
    )


def on_circuit_close(breaker):
    """Log when circuit breaker closes.

    Args:
        breaker: The PyBreaker CircuitBreaker instance that closed.
    """
    log_circuit_breaker_event(logger, breaker.name, "closed")


# Circuit breaker configuration
# Opens after 5 failures, resets after 60 seconds
openai_breaker = CircuitBreaker(
    fail_max=5,
    reset_timeout=60,
    name="OpenAI API",
    listeners=[on_circuit_open, on_circuit_close],
)

claude_breaker = CircuitBreaker(
    fail_max=5,
    reset_timeout=60,
    name="Claude API",
    listeners=[on_circuit_open, on_circuit_close],
)

gemini_breaker = CircuitBreaker(
    fail_max=5,
    reset_timeout=60,
    name="Gemini API",
    listeners=[on_circuit_open, on_circuit_close],
)

grok_breaker = CircuitBreaker(
    fail_max=5,
    reset_timeout=60,
    name="Grok API",
    listeners=[on_circuit_open, on_circuit_close],
)


@openai_breaker
async def _call_openai_with_breaker(text: str, api_key: str, model: str) -> dict:
    """Internal function wrapped with circuit breaker for OpenAI API calls.

    Args:
        text: The input text to send to OpenAI.
        api_key: OpenAI API key for authentication.
        model: The OpenAI model to use (e.g., 'gpt-3.5-turbo').

    Returns:
        dict: Response with 'model', 'response', and 'error' fields.

    Raises:
        Exception: If API returns non-200 status code.
        TimeoutError: If request exceeds timeout limit.
    """
    start_time = time.time()
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    # Adjust max tokens based on model
    max_tokens = 1000
    if "gpt-4" in model:
        max_tokens = 2000  # GPT-4 can handle longer responses

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant. Provide clear, concise responses.",
            },
            {"role": "user", "content": text},
        ],
        "temperature": 0.7,
        "max_tokens": max_tokens,
    }

    # Estimate tokens (rough approximation)
    estimated_tokens = len(text.split()) * 1.3

    async with aiohttp.ClientSession() as session:
        async with session.post(
            OPENAI_API_URL,
            headers=headers,
            json=payload,
            timeout=aiohttp.ClientTimeout(total=TIMEOUT_SECONDS),
        ) as response:
            duration_ms = (time.time() - start_time) * 1000

            if response.status == 200:
                data = await response.json()

                # Log successful LLM call
                log_llm_call(
                    logger,
                    provider="openai",
                    model=model,
                    tokens=int(estimated_tokens),
                    duration_ms=round(duration_ms, 2),
                    success=True,
                )

                return {
                    "model": "openai",
                    "response": data["choices"][0]["message"]["content"],
                    "error": None,
                }
            else:
                error_text = await response.text()

                # Log failed LLM call
                log_llm_call(
                    logger,
                    provider="openai",
                    model=model,
                    tokens=int(estimated_tokens),
                    duration_ms=round(duration_ms, 2),
                    success=False,
                    error_code=response.status,
                    error_message=error_text[:200],  # Truncate error message
                )

                raise Exception(f"API error: {response.status}")


async def call_openai(
    text: str, api_key: Optional[str] = None, model: str = "gpt-3.5-turbo"
) -> dict:
    """Call OpenAI API with the given text.

    Handles circuit breaker logic, timeouts, and error handling.

    Args:
        text: The input text to analyze.
        api_key: Optional OpenAI API key. If not provided, returns error.
        model: The OpenAI model to use. Defaults to 'gpt-3.5-turbo'.

    Returns:
        dict: Response dictionary with keys:
            - model: Always 'openai'
            - response: The model's response text (empty on error)
            - error: Error message if any, None otherwise
    """
    if not api_key:
        return {
            "model": "openai",
            "response": "",
            "error": "OpenAI API key not provided",
        }

    try:
        # Use the circuit breaker wrapped function
        return await _call_openai_with_breaker(text, api_key, model)
    except TimeoutError:
        return {"model": "openai", "response": "", "error": "Request timeout (30s)"}
    except Exception as e:
        # Check if circuit breaker is open
        if openai_breaker.current_state == "open":
            logger.warning(
                "OpenAI circuit breaker is OPEN - service temporarily unavailable"
            )
            return {
                "model": "openai",
                "response": "",
                "error": "Service temporarily unavailable (circuit breaker open)",
            }
        else:
            logger.error(f"OpenAI call failed: {str(e)}")
            return {"model": "openai", "response": "", "error": str(e)}


@claude_breaker
async def _call_claude_with_breaker(text: str, api_key: str, model: str) -> dict:
    """Internal function wrapped with circuit breaker for Claude API calls.

    Args:
        text: The input text to send to Claude.
        api_key: Claude API key for authentication.
        model: The Claude model to use (e.g., 'claude-3-haiku-20240307').

    Returns:
        dict: Response with 'model', 'response', and 'error' fields.

    Raises:
        Exception: If API returns non-200 status code.
        TimeoutError: If request exceeds timeout limit.
    """
    start_time = time.time()
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    # Adjust max tokens based on model
    max_tokens = 1000
    if "opus" in model:
        max_tokens = 4000  # Opus can handle longer responses
    elif "sonnet" in model:
        max_tokens = 2000  # Sonnet is in between

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": text}],
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }

    # Estimate tokens (rough approximation)
    estimated_tokens = len(text.split()) * 1.3

    async with aiohttp.ClientSession() as session:
        async with session.post(
            CLAUDE_API_URL,
            headers=headers,
            json=payload,
            timeout=aiohttp.ClientTimeout(total=TIMEOUT_SECONDS),
        ) as response:
            duration_ms = (time.time() - start_time) * 1000

            if response.status == 200:
                data = await response.json()

                # Log successful LLM call
                log_llm_call(
                    logger,
                    provider="claude",
                    model=model,
                    tokens=int(estimated_tokens),
                    duration_ms=round(duration_ms, 2),
                    success=True,
                )

                return {
                    "model": "claude",
                    "response": data["content"][0]["text"],
                    "error": None,
                }
            else:
                error_text = await response.text()

                # Log failed LLM call
                log_llm_call(
                    logger,
                    provider="claude",
                    model=model,
                    tokens=int(estimated_tokens),
                    duration_ms=round(duration_ms, 2),
                    success=False,
                    error_code=response.status,
                    error_message=error_text[:200],  # Truncate error message
                )

                raise Exception(f"API error: {response.status}")


async def call_claude(
    text: str, api_key: Optional[str] = None, model: str = "claude-3-haiku-20240307"
) -> dict:
    """Call Claude API with the given text.

    Handles circuit breaker logic, timeouts, and error handling.

    Args:
        text: The input text to analyze.
        api_key: Optional Claude API key. If not provided, returns error.
        model: The Claude model to use. Defaults to 'claude-3-haiku-20240307'.

    Returns:
        dict: Response dictionary with keys:
            - model: Always 'claude'
            - response: The model's response text (empty on error)
            - error: Error message if any, None otherwise
    """
    if not api_key:
        return {
            "model": "claude",
            "response": "",
            "error": "Claude API key not provided",
        }

    try:
        # Use the circuit breaker wrapped function
        return await _call_claude_with_breaker(text, api_key, model)
    except TimeoutError:
        return {"model": "claude", "response": "", "error": "Request timeout (30s)"}
    except Exception as e:
        # Check if circuit breaker is open
        if claude_breaker.current_state == "open":
            logger.warning(
                "Claude circuit breaker is OPEN - service temporarily unavailable"
            )
            return {
                "model": "claude",
                "response": "",
                "error": "Service temporarily unavailable (circuit breaker open)",
            }
        else:
            logger.error(f"Claude call failed: {str(e)}")
            return {"model": "claude", "response": "", "error": str(e)}


@gemini_breaker
async def _call_gemini_with_breaker(text: str, api_key: str, model: str) -> dict:
    """Internal function wrapped with circuit breaker for Gemini API calls.

    Args:
        text: The input text to send to Gemini.
        api_key: Gemini API key for authentication.
        model: The Gemini model to use (e.g., 'gemini-1.5-flash').

    Returns:
        dict: Response with 'model', 'response', and 'error' fields.

    Raises:
        Exception: If API returns error or request fails.
        TimeoutError: If request exceeds timeout limit.
    """
    start_time = time.time()

    # Configure the Gemini API
    genai.configure(api_key=api_key)

    # Get the generative model
    model_instance = genai.GenerativeModel(model)

    # Estimate tokens (rough approximation)
    estimated_tokens = len(text.split()) * 1.3

    try:
        # Generate content
        response = await asyncio.wait_for(
            asyncio.to_thread(model_instance.generate_content, text),
            timeout=TIMEOUT_SECONDS,
        )

        duration_ms = (time.time() - start_time) * 1000

        # Log successful LLM call
        log_llm_call(
            logger,
            provider="gemini",
            model=model,
            tokens=int(estimated_tokens),
            duration_ms=round(duration_ms, 2),
            success=True,
        )

        return {
            "model": "gemini",
            "response": response.text,
            "error": None,
        }
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000

        # Log failed LLM call
        log_llm_call(
            logger,
            provider="gemini",
            model=model,
            tokens=int(estimated_tokens),
            duration_ms=round(duration_ms, 2),
            success=False,
            error_message=str(e)[:200],
        )

        raise Exception(f"Gemini API error: {str(e)}")


async def call_gemini(
    text: str, api_key: Optional[str] = None, model: str = "gemini-1.5-flash"
) -> dict:
    """Call Gemini API with the given text.

    Handles circuit breaker logic, timeouts, and error handling.

    Args:
        text: The input text to analyze.
        api_key: Optional Gemini API key. If not provided, returns error.
        model: The Gemini model to use. Defaults to 'gemini-1.5-flash'.

    Returns:
        dict: Response dictionary with keys:
            - model: Always 'gemini'
            - response: The model's response text (empty on error)
            - error: Error message if any, None otherwise
    """
    if not api_key:
        return {
            "model": "gemini",
            "response": "",
            "error": "Gemini API key not provided",
        }

    try:
        # Use the circuit breaker wrapped function
        return await _call_gemini_with_breaker(text, api_key, model)
    except TimeoutError:
        return {"model": "gemini", "response": "", "error": "Request timeout (30s)"}
    except Exception as e:
        # Check if circuit breaker is open
        if gemini_breaker.current_state == "open":
            logger.warning(
                "Gemini circuit breaker is OPEN - service temporarily unavailable"
            )
            return {
                "model": "gemini",
                "response": "",
                "error": "Service temporarily unavailable (circuit breaker open)",
            }
        else:
            logger.error(f"Gemini call failed: {str(e)}")
            return {"model": "gemini", "response": "", "error": str(e)}


@grok_breaker
async def _call_grok_with_breaker(text: str, api_key: str, model: str) -> dict:
    """Internal function wrapped with circuit breaker for Grok API calls.

    Args:
        text: The input text to send to Grok.
        api_key: Grok API key for authentication.
        model: The Grok model to use (e.g., 'grok-2-latest').

    Returns:
        dict: Response with 'model', 'response', and 'error' fields.

    Raises:
        Exception: If API returns non-200 status code.
        TimeoutError: If request exceeds timeout limit.
    """
    start_time = time.time()
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    # Grok uses similar format to OpenAI
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are Grok, a helpful AI assistant. Provide clear, concise, and sometimes witty responses.",
            },
            {"role": "user", "content": text},
        ],
        "temperature": 0.7,
        "max_tokens": 2000,
    }

    # Estimate tokens (rough approximation)
    estimated_tokens = len(text.split()) * 1.3

    async with aiohttp.ClientSession() as session:
        async with session.post(
            GROK_API_URL,
            headers=headers,
            json=payload,
            timeout=aiohttp.ClientTimeout(total=TIMEOUT_SECONDS),
        ) as response:
            duration_ms = (time.time() - start_time) * 1000

            if response.status == 200:
                data = await response.json()

                # Log successful LLM call
                log_llm_call(
                    logger,
                    provider="grok",
                    model=model,
                    tokens=int(estimated_tokens),
                    duration_ms=round(duration_ms, 2),
                    success=True,
                )

                return {
                    "model": "grok",
                    "response": data["choices"][0]["message"]["content"],
                    "error": None,
                }
            else:
                error_text = await response.text()

                # Log failed LLM call
                log_llm_call(
                    logger,
                    provider="grok",
                    model=model,
                    tokens=int(estimated_tokens),
                    duration_ms=round(duration_ms, 2),
                    success=False,
                    error_code=response.status,
                    error_message=error_text[:200],  # Truncate error message
                )

                raise Exception(f"API error: {response.status}")


async def call_grok(
    text: str, api_key: Optional[str] = None, model: str = "grok-2-latest"
) -> dict:
    """Call Grok API with the given text.

    Handles circuit breaker logic, timeouts, and error handling.

    Args:
        text: The input text to analyze.
        api_key: Optional Grok API key. If not provided, returns error.
        model: The Grok model to use. Defaults to 'grok-2-latest'.

    Returns:
        dict: Response dictionary with keys:
            - model: Always 'grok'
            - response: The model's response text (empty on error)
            - error: Error message if any, None otherwise
    """
    if not api_key:
        return {
            "model": "grok",
            "response": "",
            "error": "Grok API key not provided",
        }

    try:
        # Use the circuit breaker wrapped function
        return await _call_grok_with_breaker(text, api_key, model)
    except TimeoutError:
        return {"model": "grok", "response": "", "error": "Request timeout (30s)"}
    except Exception as e:
        # Check if circuit breaker is open
        if grok_breaker.current_state == "open":
            logger.warning(
                "Grok circuit breaker is OPEN - service temporarily unavailable"
            )
            return {
                "model": "grok",
                "response": "",
                "error": "Service temporarily unavailable (circuit breaker open)",
            }
        else:
            logger.error(f"Grok call failed: {str(e)}")
            return {"model": "grok", "response": "", "error": str(e)}


async def analyze_with_models(
    text: str,
    openai_key: Optional[str],
    claude_key: Optional[str],
    gemini_key: Optional[str] = None,
    grok_key: Optional[str] = None,
    openai_model: str = "gpt-3.5-turbo",
    claude_model: str = "claude-3-haiku-20240307",
    gemini_model: str = "gemini-1.5-flash",
    grok_model: str = "grok-2-latest",
) -> list[dict]:
    """Call multiple models in parallel and return all responses.

    Coordinates parallel API calls to available models based on provided API keys.
    Includes rate limiting delay when calling multiple models.

    Args:
        text: The input text to analyze.
        openai_key: Optional OpenAI API key.
        claude_key: Optional Claude API key.
        gemini_key: Optional Gemini API key.
        grok_key: Optional Grok API key.
        openai_model: OpenAI model to use. Defaults to 'gpt-3.5-turbo'.
        claude_model: Claude model to use. Defaults to 'claude-3-haiku-20240307'.
        gemini_model: Gemini model to use. Defaults to 'gemini-1.5-flash'.
        grok_model: Grok model to use. Defaults to 'grok-2-latest'.

    Returns:
        list[dict]: List of response dictionaries from each model that was called.
                   Each dict contains 'model', 'response', and 'error' fields.
    """
    tasks = []

    # Always try to call available models
    if openai_key:
        tasks.append(call_openai(text, openai_key, openai_model))
    if claude_key:
        tasks.append(call_claude(text, claude_key, claude_model))
    if gemini_key:
        tasks.append(call_gemini(text, gemini_key, gemini_model))
    if grok_key:
        tasks.append(call_grok(text, grok_key, grok_model))

    # Add small delay to help with rate limits on free tiers
    if len(tasks) > 1:
        await asyncio.sleep(0.5)  # 500ms delay

    # Log circuit breaker states
    breaker_states = {
        "OpenAI": openai_breaker.current_state,
        "Claude": claude_breaker.current_state,
        "Gemini": gemini_breaker.current_state,
        "Grok": grok_breaker.current_state,
    }
    logger.info(f"Circuit breaker states: {breaker_states}")

    results = await asyncio.gather(*tasks)

    return results
