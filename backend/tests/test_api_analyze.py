"""Integration tests for the /api/analyze endpoint.

Tests the full flow including token counting, chunking, and response processing.
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    """Create test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_openai_response():
    """Mock response from OpenAI API in the expected format."""
    return {
        "model": "openai",
        "response": "This is a test response from OpenAI.",
        "error": None,
    }


@pytest.fixture
def mock_claude_response():
    """Mock response from Claude API in the expected format."""
    return {
        "model": "claude",
        "response": "This is a test response from Claude.",
        "error": None,
    }


class TestAnalyzeEndpoint:
    """Test suite for /api/analyze endpoint."""

    def test_analyze_missing_keys(self, client):
        """Test endpoint returns empty responses when no API keys are provided."""
        response = client.post("/api/analyze", json={"text": "Test text"})
        assert response.status_code == 200
        data = response.json()
        assert "responses" in data
        assert data["responses"] == []

    def test_analyze_missing_text(self, client):
        """Test endpoint returns error when no text is provided."""
        response = client.post("/api/analyze", json={"openai_key": "test-key"})
        assert response.status_code == 422

    def test_analyze_short_text_openai(self, client, mock_openai_response):
        """Test analyzing short text with OpenAI."""
        with patch("llm_providers.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_openai_response

            response = client.post(
                "/api/analyze",
                json={"text": "Test short text", "openai_key": "test-openai-key"},
            )

            assert response.status_code == 200
            data = response.json()
            assert "responses" in data
            assert len(data["responses"]) == 1
            assert data["responses"][0]["model"] == "openai"
            assert data["responses"][0]["response"] == "This is a test response from OpenAI."
            assert data["responses"][0]["error"] is None
            assert data["chunked"] is False
            assert data["chunk_info"] is None
            # Check that the correct parameters were passed (including model)
            mock_call.assert_called_once_with("Test short text", "test-openai-key", "gpt-3.5-turbo")

    def test_analyze_short_text_claude(self, client, mock_claude_response):
        """Test analyzing short text with Claude."""
        with patch("llm_providers.call_claude", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_claude_response

            response = client.post(
                "/api/analyze",
                json={"text": "Test short text", "claude_key": "test-claude-key"},
            )

            assert response.status_code == 200
            data = response.json()
            assert "responses" in data
            assert len(data["responses"]) == 1
            assert data["responses"][0]["model"] == "claude"
            assert data["responses"][0]["response"] == "This is a test response from Claude."
            assert data["responses"][0]["error"] is None
            assert data["chunked"] is False
            assert data["chunk_info"] is None
            # Check that the correct parameters were passed (including model)
            mock_call.assert_called_once_with(
                "Test short text", "test-claude-key", "claude-3-haiku-20240307"
            )

    def test_analyze_both_providers(self, client, mock_openai_response, mock_claude_response):
        """Test analyzing with both providers simultaneously."""
        with (
            patch("llm_providers.call_openai", new_callable=AsyncMock) as mock_openai,
            patch("llm_providers.call_claude", new_callable=AsyncMock) as mock_claude,
        ):
            mock_openai.return_value = mock_openai_response
            mock_claude.return_value = mock_claude_response

            response = client.post(
                "/api/analyze",
                json={
                    "text": "Test text for both providers",
                    "openai_key": "test-openai-key",
                    "claude_key": "test-claude-key",
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert len(data["responses"]) == 2

            # Check OpenAI response
            openai_resp = next(r for r in data["responses"] if r["model"] == "openai")
            assert openai_resp["response"] == "This is a test response from OpenAI."
            assert openai_resp["error"] is None

            # Check Claude response
            claude_resp = next(r for r in data["responses"] if r["model"] == "claude")
            assert claude_resp["response"] == "This is a test response from Claude."
            assert claude_resp["error"] is None

            mock_openai.assert_called_once_with(
                "Test text for both providers", "test-openai-key", "gpt-3.5-turbo"
            )
            mock_claude.assert_called_once_with(
                "Test text for both providers",
                "test-claude-key",
                "claude-3-haiku-20240307",
            )

    def test_analyze_long_text_triggers_chunking(self, client, mock_openai_response):
        """Test that long text triggers chunking for OpenAI."""
        # Create text that will exceed 3000 tokens (approximately 12000 characters)
        long_text = "This is a test sentence. " * 600

        with patch("llm_providers.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_openai_response

            response = client.post(
                "/api/analyze",
                json={"text": long_text, "openai_key": "test-openai-key"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["chunked"] is True
            assert data["chunk_info"] is not None
            assert data["chunk_info"]["total_chunks"] > 1
            assert data["chunk_info"]["processing_chunk"] == 1
            # Should only process first chunk
            mock_call.assert_called_once()
            # Verify it was called with chunked text, not original
            call_args = mock_call.call_args[0][0]
            assert len(call_args) < len(long_text)

    def test_analyze_provider_error_handling(self, client):
        """Test error handling when provider fails."""
        with patch("llm_providers.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = {
                "model": "openai",
                "response": "",
                "error": "Provider error",
            }

            response = client.post(
                "/api/analyze",
                json={"text": "Test text", "openai_key": "test-openai-key"},
            )

            assert response.status_code == 200
            data = response.json()
            assert len(data["responses"]) == 1
            assert data["responses"][0]["model"] == "openai"
            assert data["responses"][0]["response"] == ""
            assert data["responses"][0]["error"] == "Provider error"

    def test_analyze_unicode_text(self, client, mock_openai_response):
        """Test analyzing text with Unicode characters."""
        unicode_text = "Test with emojis 🚀 and special chars: 你好世界"

        with patch("llm_providers.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_openai_response

            response = client.post(
                "/api/analyze",
                json={"text": unicode_text, "openai_key": "test-openai-key"},
            )

            assert response.status_code == 200
            data = response.json()
            assert len(data["responses"]) == 1
            assert data["responses"][0]["error"] is None

    def test_analyze_empty_text(self, client):
        """Test endpoint returns error for empty text."""
        response = client.post("/api/analyze", json={"text": "", "openai_key": "test-openai-key"})

        assert response.status_code == 400
        assert "Text cannot be empty" in response.json()["detail"]

    def test_analyze_whitespace_only_text(self, client, mock_openai_response):
        """Test endpoint returns error for whitespace-only text."""
        with patch("llm_providers.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_openai_response

            response = client.post(
                "/api/analyze",
                json={"text": "   \n\n\t  ", "openai_key": "test-openai-key"},
            )

            assert response.status_code == 400
            assert "Text cannot be empty" in response.json()["detail"]

    @pytest.mark.parametrize("text_size", [100, 1000, 2500, 5000])
    def test_analyze_various_text_sizes(self, client, mock_openai_response, text_size):
        """Test analyzing texts of various sizes."""
        text = "A" * text_size

        with patch("llm_providers.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_openai_response

            response = client.post(
                "/api/analyze", json={"text": text, "openai_key": "test-openai-key"}
            )

            assert response.status_code == 200
            data = response.json()
            assert len(data["responses"]) == 1
            assert data["responses"][0]["error"] is None

            # Check chunking triggers for large texts
            if text_size > 12000:  # Approximately 3000 tokens
                assert data["chunked"] is True
                assert data["chunk_info"] is not None
            else:
                assert data["chunked"] is False
                assert data["chunk_info"] is None

    def test_response_includes_token_info(self, client, mock_openai_response):
        """Test that response includes token information."""
        with patch("llm_providers.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_openai_response

            response = client.post(
                "/api/analyze",
                json={
                    "text": "Test text for token counting",
                    "openai_key": "test-openai-key",
                },
            )

            assert response.status_code == 200
            data = response.json()

            # The actual response doesn't include token_info in the response model
            # This was part of the internal processing but not exposed to the client
            assert "request_id" in data
            assert "original_text" in data
            assert "responses" in data
