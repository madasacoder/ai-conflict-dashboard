"""Tests for LLM provider integrations."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import aiohttp
from asyncio import TimeoutError

from llm_providers import (
    call_openai,
    call_claude,
    analyze_with_models,
    on_circuit_open,
    on_circuit_close,
    openai_breaker,
    claude_breaker,
    _call_openai_with_breaker,
    _call_claude_with_breaker,
)


class TestCircuitBreakerCallbacks:
    """Test circuit breaker event callbacks."""

    def test_on_circuit_open(self):
        """Test circuit breaker open callback."""
        mock_breaker = MagicMock()
        mock_breaker.name = "Test Breaker"
        mock_breaker.fail_counter = 5

        with patch("llm_providers.log_circuit_breaker_event") as mock_log:
            on_circuit_open(mock_breaker)
            mock_log.assert_called_once()

    def test_on_circuit_close(self):
        """Test circuit breaker close callback."""
        mock_breaker = MagicMock()
        mock_breaker.name = "Test Breaker"

        with patch("llm_providers.log_circuit_breaker_event") as mock_log:
            on_circuit_close(mock_breaker)
            mock_log.assert_called_once()


class TestOpenAIIntegration:
    """Test OpenAI API integration."""

    @pytest.mark.asyncio
    async def test_call_openai_no_key(self):
        """Test calling OpenAI without API key."""
        result = await call_openai("Test text")
        assert result["model"] == "openai"
        assert result["response"] == ""
        assert result["error"] == "OpenAI API key not provided"

    @pytest.mark.asyncio
    async def test_call_openai_success(self):
        """Test successful OpenAI API call."""
        # Test through the public interface instead of internal function
        with patch("llm_providers._call_openai_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = {
                "model": "openai",
                "response": "Test response from OpenAI",
                "error": None
            }
            
            result = await call_openai("Test text", "test-key")
            assert result["model"] == "openai"
            assert result["response"] == "Test response from OpenAI"
            assert result["error"] is None

    @pytest.mark.asyncio
    async def test_call_openai_api_error(self):
        """Test OpenAI API error handling."""
        with patch("llm_providers._call_openai_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = Exception("API error: 500")
            
            result = await call_openai("Test text", "test-key")
            assert result["model"] == "openai"
            assert result["response"] == ""
            assert "API error: 500" in result["error"]

    @pytest.mark.asyncio
    async def test_call_openai_timeout(self):
        """Test OpenAI API timeout handling."""
        with patch("llm_providers._call_openai_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = TimeoutError()

            result = await call_openai("Test text", "test-key")
            assert result["model"] == "openai"
            assert result["error"] == "Request timeout (30s)"

    @pytest.mark.asyncio
    async def test_call_openai_circuit_open(self):
        """Test OpenAI call when circuit breaker is open."""
        with patch("llm_providers._call_openai_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = Exception("API Error")
            # Mock the property getter
            with patch("llm_providers.openai_breaker") as mock_breaker:
                mock_breaker.current_state = "open"
                result = await call_openai("Test text", "test-key")
                assert result["error"] == "Service temporarily unavailable (circuit breaker open)"


class TestClaudeIntegration:
    """Test Claude API integration."""

    @pytest.mark.asyncio
    async def test_call_claude_no_key(self):
        """Test calling Claude without API key."""
        result = await call_claude("Test text")
        assert result["model"] == "claude"
        assert result["response"] == ""
        assert result["error"] == "Claude API key not provided"

    @pytest.mark.asyncio
    async def test_call_claude_success(self):
        """Test successful Claude API call."""
        # Test through the public interface instead of internal function
        with patch("llm_providers._call_claude_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = {
                "model": "claude",
                "response": "Test response from Claude",
                "error": None
            }
            
            result = await call_claude("Test text", "test-key")
            assert result["model"] == "claude"
            assert result["response"] == "Test response from Claude"
            assert result["error"] is None

    @pytest.mark.asyncio
    async def test_call_claude_api_error(self):
        """Test Claude API error handling."""
        with patch("llm_providers._call_claude_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = Exception("API error: 401")
            
            result = await call_claude("Test text", "test-key")
            assert result["model"] == "claude"
            assert result["response"] == ""
            assert "API error: 401" in result["error"]

    @pytest.mark.asyncio
    async def test_call_claude_timeout(self):
        """Test Claude API timeout handling."""
        with patch("llm_providers._call_claude_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = TimeoutError()

            result = await call_claude("Test text", "test-key")
            assert result["model"] == "claude"
            assert result["error"] == "Request timeout (30s)"

    @pytest.mark.asyncio
    async def test_call_claude_circuit_open(self):
        """Test Claude call when circuit breaker is open."""
        with patch("llm_providers._call_claude_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = Exception("API Error")
            # Mock the property getter
            with patch("llm_providers.claude_breaker") as mock_breaker:
                mock_breaker.current_state = "open"
                result = await call_claude("Test text", "test-key")
                assert result["error"] == "Service temporarily unavailable (circuit breaker open)"


class TestAnalyzeWithModels:
    """Test the analyze_with_models function."""

    @pytest.mark.asyncio
    async def test_analyze_with_both_models(self):
        """Test analyzing with both models."""
        openai_response = {
            "model": "openai",
            "response": "OpenAI response",
            "error": None,
        }
        claude_response = {
            "model": "claude",
            "response": "Claude response",
            "error": None,
        }

        with patch("llm_providers.call_openai", new_callable=AsyncMock) as mock_openai:
            with patch("llm_providers.call_claude", new_callable=AsyncMock) as mock_claude:
                mock_openai.return_value = openai_response
                mock_claude.return_value = claude_response

                results = await analyze_with_models(
                    "Test text", "openai-key", "claude-key"
                )

                assert len(results) == 2
                assert results[0] == openai_response
                assert results[1] == claude_response

    @pytest.mark.asyncio
    async def test_analyze_with_openai_only(self):
        """Test analyzing with only OpenAI."""
        openai_response = {
            "model": "openai",
            "response": "OpenAI response",
            "error": None,
        }

        with patch("llm_providers.call_openai", new_callable=AsyncMock) as mock_openai:
            mock_openai.return_value = openai_response

            results = await analyze_with_models("Test text", "openai-key", None)

            assert len(results) == 1
            assert results[0] == openai_response

    @pytest.mark.asyncio
    async def test_analyze_with_claude_only(self):
        """Test analyzing with only Claude."""
        claude_response = {
            "model": "claude",
            "response": "Claude response",
            "error": None,
        }

        with patch("llm_providers.call_claude", new_callable=AsyncMock) as mock_claude:
            mock_claude.return_value = claude_response

            results = await analyze_with_models("Test text", None, "claude-key")

            assert len(results) == 1
            assert results[0] == claude_response

    @pytest.mark.asyncio
    async def test_analyze_with_custom_models(self):
        """Test analyzing with custom model selections."""
        with patch("llm_providers.call_openai", new_callable=AsyncMock) as mock_openai:
            with patch("llm_providers.call_claude", new_callable=AsyncMock) as mock_claude:
                mock_openai.return_value = {"model": "openai", "response": "GPT-4", "error": None}
                mock_claude.return_value = {"model": "claude", "response": "Opus", "error": None}

                await analyze_with_models(
                    "Test text",
                    "openai-key",
                    "claude-key",
                    "gpt-4",
                    "claude-3-opus-20240229"
                )

                mock_openai.assert_called_once_with("Test text", "openai-key", "gpt-4")
                mock_claude.assert_called_once_with(
                    "Test text", "claude-key", "claude-3-opus-20240229"
                )