"""
Ollama Provider Plugin for AI Conflict Dashboard

This plugin enables integration with Ollama for running local LLMs.
Supports all models available in Ollama including Llama, Mistral, Phi, etc.

Requirements:
- Ollama must be installed and running locally (https://ollama.ai)
- Default API endpoint: http://localhost:11434
"""

import json
import os
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Any

import aiohttp
import structlog

logger = structlog.get_logger(__name__)

# Ollama configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "120"))  # 2 minutes default

# Popular Ollama models
OLLAMA_MODELS = {
    "llama2": {
        "name": "Llama 2",
        "description": "Meta's Llama 2 model",
        "context_length": 4096,
    },
    "llama2:13b": {
        "name": "Llama 2 13B",
        "description": "Larger Llama 2 model",
        "context_length": 4096,
    },
    "llama2:70b": {
        "name": "Llama 2 70B",
        "description": "Largest Llama 2 model",
        "context_length": 4096,
    },
    "mistral": {
        "name": "Mistral 7B",
        "description": "Mistral AI's efficient 7B model",
        "context_length": 8192,
    },
    "mixtral": {
        "name": "Mixtral 8x7B",
        "description": "Mistral's MoE model",
        "context_length": 32768,
    },
    "phi": {
        "name": "Phi-2",
        "description": "Microsoft's small language model",
        "context_length": 2048,
    },
    "neural-chat": {
        "name": "Neural Chat",
        "description": "Intel's fine-tuned model",
        "context_length": 4096,
    },
    "starling-lm": {
        "name": "Starling LM",
        "description": "Berkeley's GPT-4 fine-tune",
        "context_length": 8192,
    },
    "codellama": {
        "name": "Code Llama",
        "description": "Meta's code-specialized model",
        "context_length": 16384,
    },
    "deepseek-coder": {
        "name": "DeepSeek Coder",
        "description": "Code generation model",
        "context_length": 16384,
    },
}


class OllamaProvider:
    """Provider class for Ollama local LLM integration."""

    def __init__(self, base_url: str = OLLAMA_BASE_URL):
        """Initialize Ollama provider.

        Args:
            base_url: Base URL for Ollama API (default: http://localhost:11434)
        """
        self.base_url = base_url.rstrip("/")
        self.session = None
        logger.info("Initialized Ollama provider", base_url=self.base_url)

    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()

    async def check_health(self) -> dict[str, Any]:
        """Check if Ollama is running and accessible.

        Returns:
            Dict with health status and available models
        """
        try:
            async with aiohttp.ClientSession() as session:
                # Check if Ollama is running
                async with session.get(f"{self.base_url}/api/tags") as response:
                    if response.status == 200:
                        data = await response.json()
                        models = [model["name"] for model in data.get("models", [])]

                        logger.info(
                            "Ollama health check passed",
                            available_models=len(models),
                            models=models[:5],  # Log first 5 models
                        )

                        return {
                            "status": "healthy",
                            "available": True,
                            "models": models,
                            "base_url": self.base_url,
                        }
                    else:
                        return {
                            "status": "unhealthy",
                            "available": False,
                            "error": f"HTTP {response.status}",
                        }
        except aiohttp.ClientConnectorError:
            logger.warning("Ollama not reachable", base_url=self.base_url)
            return {
                "status": "offline",
                "available": False,
                "error": "Cannot connect to Ollama. Is it running?",
                "help": "Start Ollama with: ollama serve",
            }
        except Exception as e:
            logger.error("Ollama health check failed", error=str(e))
            return {
                "status": "error",
                "available": False,
                "error": str(e),
            }

    async def list_models(self) -> list[dict[str, Any]]:
        """List all available models in Ollama.

        Returns:
            List of model information dictionaries
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/api/tags") as response:
                    if response.status == 200:
                        data = await response.json()
                        models = data.get("models", [])

                        # Enhance with our metadata if available
                        enhanced_models = []
                        for model in models:
                            model_name = model["name"]
                            base_name = model_name.split(":")[0]

                            enhanced = {
                                "name": model_name,
                                "size": model.get("size", 0),
                                "modified": model.get("modified_at", ""),
                            }

                            # Add our metadata if available
                            if base_name in OLLAMA_MODELS:
                                enhanced.update(OLLAMA_MODELS[base_name])

                            enhanced_models.append(enhanced)

                        return enhanced_models
                    else:
                        logger.error(f"Failed to list models: HTTP {response.status}")
                        return []
        except Exception as e:
            logger.error("Failed to list Ollama models", error=str(e))
            return []

    async def pull_model(self, model_name: str) -> AsyncGenerator[dict[str, Any], None]:
        """Pull/download a model from Ollama registry.

        Args:
            model_name: Name of the model to pull

        Yields:
            Progress updates as the model downloads
        """
        try:
            async with aiohttp.ClientSession() as session:
                data = {"name": model_name}

                async with session.post(
                    f"{self.base_url}/api/pull",
                    json=data,
                    timeout=aiohttp.ClientTimeout(total=None),  # No timeout for downloads
                ) as response:
                    async for line in response.content:
                        if line:
                            try:
                                progress = json.loads(line)
                                yield progress
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            logger.error(f"Failed to pull model {model_name}", error=str(e))
            yield {"error": str(e)}

    async def generate(
        self,
        prompt: str,
        model: str = "llama2",
        temperature: float = 0.7,
        max_tokens: int | None = None,
        stream: bool = False,
        **kwargs,
    ) -> dict[str, Any]:
        """Generate a response using Ollama.

        Args:
            prompt: The input prompt
            model: Model name (default: llama2)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response
            **kwargs: Additional parameters for Ollama

        Returns:
            Dict with model response or error
        """
        start_time = datetime.now(UTC)

        try:
            if not self.session:
                self.session = aiohttp.ClientSession()

            # Prepare request data
            data = {
                "model": model,
                "prompt": prompt,
                "temperature": temperature,
                "stream": stream,
            }

            # Add optional parameters
            if max_tokens:
                data["num_predict"] = max_tokens

            # Add any additional kwargs
            data.update(kwargs)

            logger.info(
                "Calling Ollama",
                model=model,
                prompt_length=len(prompt),
                temperature=temperature,
            )

            # Make the request
            async with self.session.post(
                f"{self.base_url}/api/generate",
                json=data,
                timeout=aiohttp.ClientTimeout(total=OLLAMA_TIMEOUT),
            ) as response:
                if response.status == 200:
                    result = await response.json()

                    duration = (datetime.now(UTC) - start_time).total_seconds()

                    logger.info(
                        "Ollama response received",
                        model=model,
                        response_length=len(result.get("response", "")),
                        duration=duration,
                        total_duration_ms=result.get("total_duration", 0) / 1e6,
                        prompt_eval_count=result.get("prompt_eval_count", 0),
                        eval_count=result.get("eval_count", 0),
                    )

                    return {
                        "model": f"ollama/{model}",
                        "response": result.get("response", ""),
                        "error": None,
                        "metadata": {
                            "total_duration_ms": result.get("total_duration", 0) / 1e6,
                            "load_duration_ms": result.get("load_duration", 0) / 1e6,
                            "prompt_eval_duration_ms": result.get("prompt_eval_duration", 0) / 1e6,
                            "eval_duration_ms": result.get("eval_duration", 0) / 1e6,
                            "prompt_eval_count": result.get("prompt_eval_count", 0),
                            "eval_count": result.get("eval_count", 0),
                        },
                    }
                else:
                    error_text = await response.text()
                    logger.error(
                        "Ollama API error",
                        status=response.status,
                        error=error_text,
                    )
                    return {
                        "model": f"ollama/{model}",
                        "response": "",
                        "error": f"Ollama API error: {response.status} - {error_text}",
                    }

        except TimeoutError:
            duration = (datetime.now() - start_time).total_seconds()
            logger.error(
                "Ollama request timed out",
                model=model,
                timeout=OLLAMA_TIMEOUT,
                duration=duration,
            )
            return {
                "model": f"ollama/{model}",
                "response": "",
                "error": f"Request timed out after {OLLAMA_TIMEOUT}s",
            }
        except aiohttp.ClientConnectorError as e:
            logger.error("Cannot connect to Ollama", error=str(e))
            return {
                "model": f"ollama/{model}",
                "response": "",
                "error": "Cannot connect to Ollama. Is it running? Start with: ollama serve",
            }
        except Exception as e:
            logger.error("Ollama generation failed", error=str(e), exc_info=True)
            return {
                "model": f"ollama/{model}",
                "response": "",
                "error": f"Ollama error: {e!s}",
            }

    async def chat(
        self,
        messages: list[dict[str, str]],
        model: str = "llama2",
        temperature: float = 0.7,
        max_tokens: int | None = None,
        stream: bool = False,
        **kwargs,
    ) -> dict[str, Any]:
        """Chat completion using Ollama (for models that support chat format).

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model name
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response
            **kwargs: Additional parameters

        Returns:
            Dict with model response or error
        """
        # Convert messages to a single prompt
        # This is a simple implementation - some models may support better formatting
        prompt_parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if role == "system":
                prompt_parts.append(f"System: {content}")
            elif role == "user":
                prompt_parts.append(f"User: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")

        prompt_parts.append("Assistant:")  # Prompt for response
        prompt = "\n\n".join(prompt_parts)

        # Use the generate method
        return await self.generate(
            prompt=prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream,
            **kwargs,
        )


# Integration function for the main AI Conflict Dashboard
async def call_ollama(
    text: str, model: str = "llama2", base_url: str | None = None, **kwargs
) -> dict[str, Any]:
    """Call Ollama API for the AI Conflict Dashboard.

    Args:
        text: Input text to process
        model: Ollama model to use
        base_url: Optional custom base URL
        **kwargs: Additional parameters

    Returns:
        Dict with model, response, and error fields
    """
    base_url = base_url or OLLAMA_BASE_URL

    async with OllamaProvider(base_url) as provider:
        # First check if Ollama is available
        health = await provider.check_health()
        if not health.get("available"):
            return {
                "model": f"ollama/{model}",
                "response": "",
                "error": health.get("error", "Ollama is not available"),
            }

        # Check if requested model is available
        if model not in health.get("models", []):
            available_models = health.get("models", [])
            return {
                "model": f"ollama/{model}",
                "response": "",
                "error": f"Model '{model}' not found. Available models: {', '.join(available_models[:5])}",
            }

        # Generate response
        result = await provider.generate(prompt=text, model=model, **kwargs)

        return result


# Export the provider class and integration function
__all__ = ["OLLAMA_MODELS", "OllamaProvider", "call_ollama"]
