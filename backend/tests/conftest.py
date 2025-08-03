"""
Pytest configuration and fixtures for AI Conflict Dashboard tests.
"""

import pytest
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Import the FastAPI app
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from main import app  # noqa: E402


@pytest.fixture(autouse=True)
def reset_rate_limits():
    """
    Reset rate limits before each test to prevent test interference.
    """
    from main import rate_limiter

    # Clear the global rate limiter state
    rate_limiter.minute_counts.clear()
    rate_limiter.hour_counts.clear()
    rate_limiter.day_counts.clear()
    rate_limiter.token_buckets.clear()
    yield
    # Clean up after test
    rate_limiter.minute_counts.clear()
    rate_limiter.hour_counts.clear()
    rate_limiter.day_counts.clear()
    rate_limiter.token_buckets.clear()


@pytest.fixture(autouse=True)
def reset_circuit_breakers():
    """
    Reset circuit breakers before each test to prevent test interference.
    """
    from llm_providers import circuit_breakers, _circuit_breaker_lock

    # Clear all circuit breakers with thread safety
    with _circuit_breaker_lock:
        for provider in circuit_breakers:
            circuit_breakers[provider].clear()
    yield
    # Also clean up after test
    with _circuit_breaker_lock:
        for provider in circuit_breakers:
            circuit_breakers[provider].clear()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """
    Create a test client for the FastAPI app.

    Yields:
        TestClient: A test client instance
    """
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """
    Create an async test client for the FastAPI app.

    Yields:
        AsyncClient: An async test client instance
    """
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def test_api_keys() -> dict:
    """
    Provide test API keys for testing.

    Returns:
        dict: Dictionary of test API keys
    """
    return {
        "openai": "test-openai-key",
        "claude": "test-claude-key",
        "gemini": "test-gemini-key",
        "grok": "test-grok-key",
    }


@pytest.fixture
def sample_text() -> str:
    """
    Provide sample text for testing.

    Returns:
        str: Sample text
    """
    return "This is a sample text for testing the AI Conflict Dashboard."


@pytest.fixture
def long_text() -> str:
    """
    Provide long text for testing chunking.

    Returns:
        str: Long text that requires chunking
    """
    return " ".join(
        [
            "This is a very long sentence that will be used for testing text chunking functionality."
        ]
        * 100
    )


@pytest.fixture
def mock_llm_response() -> dict:
    """
    Provide a mock LLM response structure.

    Returns:
        dict: Mock response from LLM
    """
    return {
        "model": "test-model",
        "response": "This is a test response from the LLM.",
        "tokens_used": 50,
        "success": True,
    }


# Remove custom event_loop fixture - use pytest-asyncio's default instead
# If we need session scope, we should use pytest-asyncio's configuration


# Markers for different test categories
def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
    config.addinivalue_line("markers", "unit: marks tests as unit tests")
    config.addinivalue_line("markers", "security: marks tests as security tests")
    config.addinivalue_line("markers", "adversarial: marks tests as adversarial tests")
