"""Test Ollama integration."""

import asyncio
import pytest
from llm_providers import call_ollama_fixed


@pytest.mark.asyncio
async def test_call_ollama_fixed():
    """Test the call_ollama_fixed function."""
    # First, try to list available models
    from plugins.ollama_provider import OllamaProvider

    async with OllamaProvider() as provider:
        health = await provider.check_health()

        if health.get("available"):
            # Use the first available model
            available_models = health.get("models", [])
            if available_models:
                model = available_models[0]
                print(f"Testing with available model: {model}")
            else:
                model = "llama2"  # fallback
        else:
            model = "llama2"  # fallback
            print("Ollama not available, using default model name")

    # Test with the model
    result = await call_ollama_fixed("Hello, this is a test", model=model)

    # Check result structure
    assert isinstance(result, dict)
    assert "model" in result
    assert "response" in result
    assert "error" in result

    # The model should include ollama prefix
    assert result["model"].startswith("ollama/")

    # There might be an error if Ollama is not running or model not found
    if result["error"]:
        print(f"Ollama error: {result['error']}")
        # Check for expected error messages
        assert any(
            msg in result["error"]
            for msg in ["Ollama", "Cannot connect", "not found", "not available"]
        )
    else:
        # If successful, should have a response
        assert result["response"]
        assert len(result["response"]) > 0
        print(f"Got response: {result['response'][:100]}...")


@pytest.mark.asyncio
async def test_analyze_with_models_including_ollama():
    """Test analyze_with_models with Ollama included."""
    from llm_providers import analyze_with_models

    # Test with just Ollama (no API keys needed)
    results = await analyze_with_models(
        text="Test prompt for Ollama", ollama_model="llama2"
    )

    assert isinstance(results, list)
    assert len(results) == 1  # Only Ollama

    result = results[0]
    assert result["model"].startswith("ollama/")


if __name__ == "__main__":
    # Run the tests
    asyncio.run(test_call_ollama_fixed())
    asyncio.run(test_analyze_with_models_including_ollama())
    print("Basic tests passed!")
