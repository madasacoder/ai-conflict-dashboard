"""Real Integration Tests for LLM Providers

These tests make ACTUAL API calls to verify integration.
Run separately from unit tests to avoid costs and rate limits.

Usage:
    pytest tests/test_llm_providers_integration.py -v -m integration

Required Environment Variables:
    - OPENAI_API_KEY: Valid OpenAI API key
    - ANTHROPIC_API_KEY: Valid Claude API key (optional)
    - GOOGLE_API_KEY: Valid Gemini API key (optional)
    - RUN_INTEGRATION_TESTS: Set to "true" to run these tests

Note: These tests make REAL API calls that cost money!
      Only run when you need to verify actual integration.
"""

import asyncio
import os

import pytest

# Only run these tests if explicitly enabled
pytestmark = pytest.mark.skipif(
    os.getenv("RUN_INTEGRATION_TESTS") != "true",
    reason="Integration tests disabled. Set RUN_INTEGRATION_TESTS=true to run.",
)


@pytest.mark.integration
@pytest.mark.real_api
class TestOpenAIIntegration:
    @pytest.fixture
    def client(self):
        """Test client fixture."""
        from main import app
        return TestClient(app)

    """Test real OpenAI API integration."""

    @pytest.fixture
    def api_key(self) -> str | None:
        """Get API key from environment."""
        key = os.getenv("OPENAI_API_KEY")
        if not key:
            pytest.skip("OPENAI_API_KEY not set")
        return key

    @pytest.mark.asyncio
    async def test_real_openai_completion(self, api_key: str):
        """Test actual OpenAI API call with minimal cost."""
        from llm_providers import query_openai

        # Use cheapest model with minimal tokens
        result = await query_openai(
            prompt="Say 'test'",  # Minimal prompt
            api_key=api_key,
            model="gpt-3.5-turbo",
            max_tokens=5,  # Minimal response
        )

        # Verify response structure
        assert result is not None, "result should not be None"
        assert "response" in result
        assert "model" in result
        assert result["model"] == "gpt-3.5-turbo"
        assert "tokens" in result
        assert result["tokens"]["total"] > 0
        assert "error" not in result

        # Verify response content (should contain "test" or similar)
        response_text = result["response"].lower()
        assert len(response_text) > 0, "response_text should not be empty"
        assert "test" in response_text or "Test" in result["response"]

    @pytest.mark.asyncio
    async def test_openai_error_handling(self, api_key: str):
        """Test OpenAI error handling with invalid request."""
        from llm_providers import query_openai

        # Use invalid model to trigger error
        result = await query_openai(
            prompt="Test", api_key=api_key, model="invalid-model-xyz", max_tokens=5
        )

        # Should return error structure, not raise exception
        assert result is not None, "result should not be None"
        assert "error" in result
        assert "invalid" in result["error"].lower() or "not found" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_openai_rate_limit_behavior(self, api_key: str):
        """Test rate limiting behavior (carefully)."""
        from llm_providers import query_openai

        # Make 3 quick requests (well below rate limit)
        results = []
        for i in range(3):
            result = await query_openai(
                prompt=f"Say {i}", api_key=api_key, model="gpt-3.5-turbo", max_tokens=5
            )
            results.append(result)
            await asyncio.sleep(0.5)  # Small delay between requests

        # All should succeed
        for result in results:
            assert "error" not in result
            assert "response" in result


@pytest.mark.integration
@pytest.mark.real_api
class TestClaudeIntegration:
    """Test real Claude API integration."""

    @pytest.fixture
    def api_key(self) -> str | None:
        """Get API key from environment."""
        key = os.getenv("ANTHROPIC_API_KEY")
        if not key:
            pytest.skip("ANTHROPIC_API_KEY not set")
        return key

    @pytest.mark.asyncio
    async def test_real_claude_completion(self, api_key: str):
        """Test actual Claude API call with minimal cost."""
        from llm_providers import query_claude

        result = await query_claude(
            prompt="Say 'test'",
            api_key=api_key,
            model="claude-3-haiku-20240307",  # Cheapest model
            max_tokens=5,
        )

        assert result is not None, "result should not be None"
        assert "response" in result
        assert "model" in result
        assert "error" not in result
        assert len(result["response"]) > 0


@pytest.mark.integration
@pytest.mark.real_api
class TestGeminiIntegration:
    """Test real Gemini API integration."""

    @pytest.fixture
    def api_key(self) -> str | None:
        """Get API key from environment."""
        key = os.getenv("GOOGLE_API_KEY")
        if not key:
            pytest.skip("GOOGLE_API_KEY not set")
        return key

    @pytest.mark.asyncio
    async def test_real_gemini_completion(self, api_key: str):
        """Test actual Gemini API call."""
        from llm_providers import query_gemini

        result = await query_gemini(
            prompt="Say 'test'", api_key=api_key, model="gemini-pro", max_tokens=5
        )

        assert result is not None, "result should not be None"
        assert "response" in result
        assert "error" not in result


@pytest.mark.integration
@pytest.mark.real_api
class TestOllamaIntegration:
    """Test real Ollama integration (local)."""

    @pytest.mark.asyncio
    async def test_ollama_connection(self):
        """Test Ollama is running locally."""
        import aiohttp

        try:
            async with (
                aiohttp.ClientSession() as session,
                session.get("http://localhost:11434/api/tags") as response,
            ):
                if response.status == 200:
                    data = await response.json()
                    assert "models" in data
                    print(f"Ollama models available: {[m['name'] for m in data['models']]}")
                else:
                    pytest.skip("Ollama not running")
        except Exception:
            pytest.skip("Ollama not accessible at localhost:11434")

    @pytest.mark.asyncio
    async def test_ollama_completion(self):
        """Test Ollama completion if available."""
        # First check if Ollama is running
        import aiohttp

        from llm_providers import query_ollama

        try:
            async with (
                aiohttp.ClientSession() as session,
                session.get("http://localhost:11434/api/tags") as response,
            ):
                if response.status != 200:
                    pytest.skip("Ollama not running")
        except Exception:
            pytest.skip("Ollama not accessible")

        # Try completion with a small model
        result = await query_ollama(
            prompt="Say test", model="llama2:latest", max_tokens=5  # Or another installed model
        )

        if "error" in result and "not found" in result["error"]:
            pytest.skip("llama2 model not installed")

        assert "response" in result
        assert len(result["response"]) > 0


@pytest.mark.integration
class TestEndToEndIntegration:
    """Test complete flow with real APIs."""

    @pytest.mark.asyncio
    async def test_multi_model_comparison(self):
        """Test comparing responses from multiple models."""
        from fastapi.testclient import TestClient

        from main import app

        client = TestClient(app)

        # Only use models we have keys for
        models = []
        if os.getenv("OPENAI_API_KEY"):
            models.append("gpt-3.5-turbo")
        if os.getenv("ANTHROPIC_API_KEY"):
            models.append("claude-3-haiku-20240307")

        if not models:
            pytest.skip("No API keys configured")

        # Make real API request
        response = client.post(
            "/api/analyze", json={"text": "Say hello", "models": models, "max_tokens": 10}
        )

        assert response.status_code == 200, "Request should succeed"
        data = response.json()

        # Verify we got responses
        assert "responses" in data
        assert len(data["responses"]) == len(models)

        # Each response should have content
        for resp in data["responses"]:
            assert "model" in resp
            assert "response" in resp or "error" in resp


# Test configuration
def pytest_configure(config):
    """Add custom markers."""
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "real_api: mark test as using real API (costs money)")


if __name__ == "__main__":
    # Run only integration tests
    pytest.main([__file__, "-v", "-m", "integration"])

    # Example: Run with specific API
    # OPENAI_API_KEY=sk-xxx RUN_INTEGRATION_TESTS=true pytest tests/test_llm_providers_integration.py -v -m integration
