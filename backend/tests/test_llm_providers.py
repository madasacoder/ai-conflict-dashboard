"""Tests for LLM provider integrations."""

import builtins
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from llm_providers import (
    analyze_with_models,
    call_claude,
    call_gemini,
    call_grok,
    call_openai,
    on_circuit_close,
    on_circuit_open,
)
from tests.assertion_helpers import (
    assert_valid_llm_response,
    assert_circuit_breaker_state,
    assert_api_error_format
)


class TestCircuitBreakerCallbacks:
    """Test circuit breaker event callbacks."""

    def test_on_circuit_open(self):
        """Test circuit breaker open callback."""
        mock_breaker = MagicMock()
        mock_breaker.name = "Test Breaker"
        mock_breaker.fail_counter = 5

        with patch("structured_logging.log_circuit_breaker_event") as mock_log:
            on_circuit_open(mock_breaker)
            mock_log.assert_called_once()

    def test_on_circuit_close(self):
        """Test circuit breaker close callback."""
        mock_breaker = MagicMock()
        mock_breaker.name = "Test Breaker"

        with patch("structured_logging.log_circuit_breaker_event") as mock_log:
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
                "model": "gpt-4",
                "response": "Test response from OpenAI with detailed analysis",
                "error": None,
                "tokens": {
                    "prompt": 15,
                    "completion": 25,
                    "total": 40
                },
                "cost": 0.002
            }

            result = await call_openai("Test text", "test-key")
            
            # Use strong assertions
            assert_valid_llm_response(result, provider="openai")
            assert len(result["response"]) > 10
            assert result["cost"] == 0.002
            
            # Correct assertion method
            mock_call.assert_called_once()
            call_args = mock_call.call_args
            assert call_args is not None
            assert len(call_args[0]) >= 2
            assert call_args[0][0] == "Test text"
            assert call_args[0][1] == "test-key"

    @pytest.mark.asyncio
    async def test_call_openai_api_error(self):
        """Test OpenAI API error handling."""
        with patch("llm_providers._call_openai_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = Exception("API error: 500")

            result = await call_openai("Test text", "test-key")
            
            # Strong error validation
            assert result["model"] in ["openai", "gpt-3.5-turbo", "gpt-4"]
            assert result["response"] == ""
            assert result["error"] is not None
            assert "API error: 500" in result["error"]
            assert "api_key" not in result["error"].lower()  # Security check
            assert "test-key" not in result["error"]  # No key exposure

    @pytest.mark.asyncio
    async def test_call_openai_timeout(self):
        """Test OpenAI API timeout handling."""
        with patch("llm_providers._call_openai_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = builtins.TimeoutError()

            result = await call_openai("Test text", "test-key")
            assert result["model"] == "openai"
            assert result["error"] == "Request timeout (30s)"

    @pytest.mark.asyncio
    async def test_call_openai_circuit_open(self):
        """Test OpenAI call when circuit breaker is open."""
        # Mock get_circuit_breaker to return a breaker in open state
        with patch("llm_providers.get_circuit_breaker") as mock_get_breaker:
            mock_breaker = MagicMock()
            mock_breaker.current_state = "open"
            mock_get_breaker.return_value = mock_breaker

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
                "model": "claude-3-opus",
                "response": "Claude's detailed and thoughtful response with analysis",
                "error": None,
                "tokens": {
                    "prompt": 20,
                    "completion": 30,
                    "total": 50
                },
                "cost": 0.003
            }

            result = await call_claude("Test text", "test-key")
            
            # Strong assertions with business logic
            assert_valid_llm_response(result, provider="claude")
            assert "analysis" in result["response"].lower()
            assert result["tokens"]["total"] == 50
            assert 0 < result["cost"] < 1.0  # Reasonable cost range

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
            mock_call.side_effect = builtins.TimeoutError()

            result = await call_claude("Test text", "test-key")
            assert result["model"] == "claude"
            assert result["error"] == "Request timeout (30s)"

    @pytest.mark.asyncio
    async def test_call_claude_circuit_open(self):
        """Test Claude call when circuit breaker is open."""
        # Mock get_circuit_breaker to return a breaker in open state
        with patch("llm_providers.get_circuit_breaker") as mock_get_breaker:
            mock_breaker = MagicMock()
            mock_breaker.current_state = "open"
            mock_get_breaker.return_value = mock_breaker

            result = await call_claude("Test text", "test-key")
            assert result["error"] == "Service temporarily unavailable (circuit breaker open)"


class TestGeminiIntegration:
    """Test Gemini API integration."""

    @pytest.mark.asyncio
    async def test_call_gemini_no_key(self):
        """Test calling Gemini without API key."""
        result = await call_gemini("Test text")
        assert result["model"] == "gemini"
        assert result["response"] == ""
        assert result["error"] == "Gemini API key not provided"

    @pytest.mark.asyncio
    async def test_call_gemini_success(self):
        """Test successful Gemini API call."""
        with patch("llm_providers._call_gemini_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = {
                "model": "gemini-pro",
                "response": "Gemini provides comprehensive analysis with structured output",
                "error": None,
                "tokens": {
                    "prompt": 18,
                    "completion": 35,
                    "total": 53
                },
                "cost": 0.001
            }

            result = await call_gemini("Test text", "test-key")
            
            # Validate complete response structure
            assert_valid_llm_response(result, provider="gemini")
            assert len(result["response"].split()) > 5  # Multi-word response
            assert result["tokens"]["completion"] > result["tokens"]["prompt"]  # Generated more than input
            assert result["cost"] < result["tokens"]["total"] * 0.001  # Cost efficiency check

    @pytest.mark.asyncio
    async def test_call_gemini_api_error(self):
        """Test Gemini API error handling."""
        with patch("llm_providers._call_gemini_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = Exception("Gemini API error: Invalid API key")

            result = await call_gemini("Test text", "test-key")
            assert result["model"] == "gemini"
            assert result["response"] == ""
            assert "Gemini API error: Invalid API key" in result["error"]

    @pytest.mark.asyncio
    async def test_call_gemini_timeout(self):
        """Test Gemini API timeout handling."""
        with patch("llm_providers._call_gemini_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = builtins.TimeoutError()

            result = await call_gemini("Test text", "test-key")
            assert result["model"] == "gemini"
            assert result["error"] == "Request timeout (30s)"

    @pytest.mark.asyncio
    async def test_call_gemini_circuit_open(self):
        """Test Gemini call when circuit breaker is open."""
        # Mock get_circuit_breaker to return a breaker in open state
        with patch("llm_providers.get_circuit_breaker") as mock_get_breaker:
            mock_breaker = MagicMock()
            mock_breaker.current_state = "open"
            mock_get_breaker.return_value = mock_breaker

            result = await call_gemini("Test text", "test-key")
            assert result["error"] == "Service temporarily unavailable (circuit breaker open)"


class TestGrokIntegration:
    """Test Grok API integration."""

    @pytest.mark.asyncio
    async def test_call_grok_no_key(self):
        """Test calling Grok without API key."""
        result = await call_grok("Test text")
        assert result["model"] == "grok"
        assert result["response"] == ""
        assert result["error"] == "Grok API key not provided"

    @pytest.mark.asyncio
    async def test_call_grok_success(self):
        """Test successful Grok API call."""
        with patch("llm_providers._call_grok_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = {
                "model": "grok-1",
                "response": "Grok's unique perspective on the query with humor and insight",
                "error": None,
                "tokens": {
                    "prompt": 12,
                    "completion": 28,
                    "total": 40
                },
                "cost": 0.0015
            }

            result = await call_grok("Test text", "test-key")
            
            # Business value assertions
            assert_valid_llm_response(result, provider="grok")
            assert "perspective" in result["response"] or "insight" in result["response"]
            assert result["tokens"]["total"] >= len("Test text".split())  # At least as many tokens as words
            assert 0.0001 <= result["cost"] <= 0.1  # Reasonable cost bounds

    @pytest.mark.asyncio
    async def test_call_grok_api_error(self):
        """Test Grok API error handling."""
        with patch("llm_providers._call_grok_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = Exception("API error: 403")

            result = await call_grok("Test text", "test-key")
            assert result["model"] == "grok"
            assert result["response"] == ""
            assert "API error: 403" in result["error"]

    @pytest.mark.asyncio
    async def test_call_grok_timeout(self):
        """Test Grok API timeout handling."""
        with patch("llm_providers._call_grok_with_breaker", new_callable=AsyncMock) as mock_call:
            mock_call.side_effect = builtins.TimeoutError()

            result = await call_grok("Test text", "test-key")
            assert result["model"] == "grok"
            assert result["error"] == "Request timeout (30s)"

    @pytest.mark.asyncio
    async def test_call_grok_circuit_open(self):
        """Test Grok call when circuit breaker is open."""
        # Mock get_circuit_breaker to return a breaker in open state
        with patch("llm_providers.get_circuit_breaker") as mock_get_breaker:
            mock_breaker = MagicMock()
            mock_breaker.current_state = "open"
            mock_get_breaker.return_value = mock_breaker

            result = await call_grok("Test text", "test-key")
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

                results = await analyze_with_models("Test text", "openai-key", "claude-key")

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
                mock_openai.return_value = {
                    "model": "openai",
                    "response": "GPT-4",
                    "error": None,
                }
                mock_claude.return_value = {
                    "model": "claude",
                    "response": "Opus",
                    "error": None,
                }

                await analyze_with_models(
                    "Test text",
                    openai_key="openai-key",
                    claude_key="claude-key",
                    gemini_key=None,
                    grok_key=None,
                    ollama_model=None,
                    openai_model="gpt-4",
                    claude_model="claude-3-opus-20240229",
                )

                mock_openai.assert_called_once_with("Test text", "openai-key", "gpt-4")
                mock_claude.assert_called_once_with(
                    "Test text", "claude-key", "claude-3-opus-20240229"
                )

    @pytest.mark.asyncio
    async def test_analyze_with_all_four_models(self):
        """Test analyzing with all four models."""
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
        gemini_response = {
            "model": "gemini",
            "response": "Gemini response",
            "error": None,
        }
        grok_response = {"model": "grok", "response": "Grok response", "error": None}

        with patch("llm_providers.call_openai", new_callable=AsyncMock) as mock_openai:
            with patch("llm_providers.call_claude", new_callable=AsyncMock) as mock_claude:
                with patch("llm_providers.call_gemini", new_callable=AsyncMock) as mock_gemini:
                    with patch("llm_providers.call_grok", new_callable=AsyncMock) as mock_grok:
                        mock_openai.return_value = openai_response
                        mock_claude.return_value = claude_response
                        mock_gemini.return_value = gemini_response
                        mock_grok.return_value = grok_response

                        results = await analyze_with_models(
                            "Test text",
                            "openai-key",
                            "claude-key",
                            "gemini-key",
                            "grok-key",
                        )

                        assert len(results) == 4
                        assert results[0] == openai_response
                        assert results[1] == claude_response
                        assert results[2] == gemini_response
                        assert results[3] == grok_response

    @pytest.mark.asyncio
    async def test_analyze_with_gemini_only(self):
        """Test analyzing with only Gemini."""
        gemini_response = {
            "model": "gemini",
            "response": "Gemini response",
            "error": None,
        }

        with patch("llm_providers.call_gemini", new_callable=AsyncMock) as mock_gemini:
            mock_gemini.return_value = gemini_response

            results = await analyze_with_models("Test text", None, None, "gemini-key", None)

            assert len(results) == 1
            assert results[0] == gemini_response

    @pytest.mark.asyncio
    async def test_analyze_with_grok_only(self):
        """Test analyzing with only Grok."""
        grok_response = {"model": "grok", "response": "Grok response", "error": None}

        with patch("llm_providers.call_grok", new_callable=AsyncMock) as mock_grok:
            mock_grok.return_value = grok_response

            results = await analyze_with_models("Test text", None, None, None, "grok-key")

            assert len(results) == 1
            assert results[0] == grok_response
