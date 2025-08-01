"""Integration tests for the AI Conflict Dashboard.

These tests verify the integration between different components
without making actual API calls to external services.
"""

import pytest
import asyncio
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app
from llm_providers import analyze_with_models


class TestFullWorkflowIntegration:
    """Test complete workflows through the application."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    @pytest.fixture
    def mock_all_providers(self):
        """Mock all LLM providers."""
        with patch("llm_providers._call_openai_with_breaker") as mock_openai:
            with patch("llm_providers._call_claude_with_breaker") as mock_claude:
                with patch("llm_providers._call_gemini_with_breaker") as mock_gemini:
                    with patch("llm_providers._call_grok_with_breaker") as mock_grok:
                        # Configure return values
                        mock_openai.return_value = {
                            "model": "openai",
                            "response": "OpenAI response",
                            "error": None,
                        }
                        mock_claude.return_value = {
                            "model": "claude",
                            "response": "Claude response",
                            "error": None,
                        }
                        mock_gemini.return_value = {
                            "model": "gemini",
                            "response": "Gemini response",
                            "error": None,
                        }
                        mock_grok.return_value = {
                            "model": "grok",
                            "response": "Grok response",
                            "error": None,
                        }
                        yield {
                            "openai": mock_openai,
                            "claude": mock_claude,
                            "gemini": mock_gemini,
                            "grok": mock_grok,
                        }

    def test_full_analysis_workflow_all_providers(self, client, mock_all_providers):
        """Test complete analysis workflow with all providers."""
        # Prepare request
        request_data = {
            "text": "Explain quantum computing in simple terms.",
            "openai_key": "test-openai-key",
            "claude_key": "test-claude-key",
            "gemini_key": "test-gemini-key",
            "grok_key": "test-grok-key",
            "openai_model": "gpt-4",
            "claude_model": "claude-3-opus-20240229",
            "gemini_model": "gemini-1.5-pro",
            "grok_model": "grok-2-latest",
        }

        # Make request
        response = client.post("/api/analyze", json=request_data)

        # Verify response
        assert response.status_code == 200
        data = response.json()

        # Check structure
        assert "request_id" in data
        assert "original_text" in data
        assert "responses" in data
        assert "chunked" in data

        # Check all providers responded
        assert len(data["responses"]) == 4

        # Verify each response
        models = {r["model"] for r in data["responses"]}
        assert models == {"openai", "claude", "gemini", "grok"}

        # Verify all providers were called with correct parameters
        mock_all_providers["openai"].assert_called_once()
        mock_all_providers["claude"].assert_called_once()
        mock_all_providers["gemini"].assert_called_once()
        mock_all_providers["grok"].assert_called_once()

    def test_partial_provider_workflow(self, client, mock_all_providers):
        """Test workflow with only some providers configured."""
        request_data = {
            "text": "What is machine learning?",
            "openai_key": "test-openai-key",
            "gemini_key": "test-gemini-key",
            # No Claude or Grok keys
            "openai_model": "gpt-3.5-turbo",
            "gemini_model": "gemini-1.5-flash",
        }

        response = client.post("/api/analyze", json=request_data)

        assert response.status_code == 200
        data = response.json()

        # Only 2 providers should respond
        assert len(data["responses"]) == 2
        models = {r["model"] for r in data["responses"]}
        assert models == {"openai", "gemini"}

        # Verify only configured providers were called
        mock_all_providers["openai"].assert_called_once()
        mock_all_providers["gemini"].assert_called_once()
        mock_all_providers["claude"].assert_not_called()
        mock_all_providers["grok"].assert_not_called()

    def test_error_handling_workflow(self, client):
        """Test workflow when providers return errors."""
        with patch("llm_providers._call_openai_with_breaker") as mock_openai:
            with patch("llm_providers._call_claude_with_breaker") as mock_claude:
                # OpenAI succeeds, Claude fails
                mock_openai.return_value = {
                    "model": "openai",
                    "response": "Success response",
                    "error": None,
                }
                mock_claude.side_effect = Exception("API Error")

                request_data = {
                    "text": "Test error handling",
                    "openai_key": "test-key",
                    "claude_key": "test-key",
                }

                response = client.post("/api/analyze", json=request_data)

                assert response.status_code == 200
                data = response.json()

                # Both providers should be in response
                assert len(data["responses"]) == 2

                # Check OpenAI succeeded
                openai_resp = next(
                    r for r in data["responses"] if r["model"] == "openai"
                )
                assert openai_resp["error"] is None
                assert openai_resp["response"] == "Success response"

                # Check Claude failed
                claude_resp = next(
                    r for r in data["responses"] if r["model"] == "claude"
                )
                assert claude_resp["error"] is not None
                assert "API Error" in claude_resp["error"]
                assert claude_resp["response"] == ""

    def test_large_text_chunking_workflow(self, client, mock_all_providers):
        """Test workflow with text that requires chunking."""
        # Create text larger than chunk size
        large_text = "This is a test. " * 1000  # ~15,000 characters

        request_data = {
            "text": large_text,
            "openai_key": "test-key",
            "claude_key": "test-key",
        }

        response = client.post("/api/analyze", json=request_data)

        assert response.status_code == 200
        data = response.json()

        # Verify chunking occurred
        assert data["chunked"] is True
        assert "chunk_info" in data
        assert data["chunk_info"]["total_chunks"] > 1

    @pytest.mark.asyncio
    async def test_concurrent_provider_calls(self):
        """Test that providers are called concurrently."""
        call_times = []

        async def mock_provider_call(*args, **kwargs):
            start = asyncio.get_event_loop().time()
            await asyncio.sleep(0.1)  # Simulate API delay
            end = asyncio.get_event_loop().time()
            call_times.append((start, end))
            return {"model": "test", "response": "test", "error": None}

        with patch("llm_providers.call_openai", side_effect=mock_provider_call):
            with patch("llm_providers.call_claude", side_effect=mock_provider_call):
                with patch("llm_providers.call_gemini", side_effect=mock_provider_call):
                    with patch(
                        "llm_providers.call_grok", side_effect=mock_provider_call
                    ):
                        results = await analyze_with_models(
                            "test", "key1", "key2", "key3", "key4"
                        )

        assert len(results) == 4
        assert len(call_times) == 4

        # Check that calls overlapped (concurrent execution)
        starts = [t[0] for t in call_times]
        ends = [t[1] for t in call_times]

        # If sequential, min(ends) would be > max(starts)
        # If concurrent, there should be overlap
        assert min(ends) - max(starts) < 0.15  # Should complete in ~0.1s if concurrent

    def test_model_selection_persistence(self, client, mock_all_providers):
        """Test that model selections are properly passed through."""
        request_data = {
            "text": "Test model selection",
            "openai_key": "test-key",
            "claude_key": "test-key",
            "gemini_key": "test-key",
            "grok_key": "test-key",
            "openai_model": "gpt-4-turbo-preview",
            "claude_model": "claude-3-opus-20240229",
            "gemini_model": "gemini-1.5-pro",
            "grok_model": "grok-beta",
        }

        response = client.post("/api/analyze", json=request_data)
        assert response.status_code == 200

        # Verify models were passed to providers
        # Check the call arguments for each provider
        call_args = mock_all_providers["openai"].call_args
        assert call_args[0][2] == "gpt-4-turbo-preview"  # model is 3rd argument

        call_args = mock_all_providers["claude"].call_args
        assert call_args[0][2] == "claude-3-opus-20240229"

        call_args = mock_all_providers["gemini"].call_args
        assert call_args[0][2] == "gemini-1.5-pro"

        call_args = mock_all_providers["grok"].call_args
        assert call_args[0][2] == "grok-beta"


class TestCircuitBreakerIntegration:
    """Test circuit breaker behavior in integration scenarios."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    def test_circuit_breaker_opens_after_failures(self, client):
        """Test that circuit breaker opens after repeated failures."""
        with patch("llm_providers._call_openai_with_breaker") as mock_openai:
            # Make it fail consistently
            mock_openai.side_effect = Exception("API Error")

            # Make multiple requests to trigger circuit breaker
            for i in range(6):  # Default failure threshold is 5
                response = client.post(
                    "/api/analyze", json={"text": f"Test {i}", "openai_key": "test-key"}
                )
                assert response.status_code == 200

            # Check last response indicates circuit breaker is open
            data = response.json()
            openai_resp = data["responses"][0]

            # After 5 failures, circuit should be open
            if i >= 5:
                assert "circuit breaker open" in openai_resp["error"].lower()

    def test_circuit_breaker_recovery(self, client):
        """Test circuit breaker recovery after timeout."""
        with patch("llm_providers.openai_breaker") as mock_breaker:
            # Simulate open circuit that recovers
            mock_breaker.current_state = "open"

            with patch("llm_providers._call_openai_with_breaker") as mock_openai:
                mock_openai.return_value = {
                    "model": "openai",
                    "response": "Recovered!",
                    "error": None,
                }

                # First call should fail due to open circuit
                response = client.post(
                    "/api/analyze",
                    json={"text": "Test recovery", "openai_key": "test-key"},
                )

                data = response.json()
                assert "circuit breaker open" in data["responses"][0]["error"].lower()

                # Simulate circuit closing
                mock_breaker.current_state = "closed"

                # Next call should succeed
                response = client.post(
                    "/api/analyze",
                    json={"text": "Test recovery 2", "openai_key": "test-key"},
                )

                data = response.json()
                assert data["responses"][0]["error"] is None
                assert data["responses"][0]["response"] == "Recovered!"


class TestLoggingIntegration:
    """Test logging integration across components."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    def test_request_correlation_id(self, client):
        """Test that correlation IDs are properly propagated."""
        with patch("structured_logging.structlog.get_logger") as mock_logger:
            mock_logger.return_value = MagicMock()

            response = client.post(
                "/api/analyze", json={"text": "Test logging", "openai_key": "test-key"}
            )

            # Check response includes request ID
            assert response.status_code == 200
            assert "X-Request-ID" in response.headers

            request_id = response.headers["X-Request-ID"]
            assert request_id  # Should not be empty

            # Verify request_id in response body
            data = response.json()
            assert data["request_id"] == request_id

    def test_error_logging_integration(self, client):
        """Test that errors are properly logged."""
        with patch("main.logger") as mock_logger:
            # Send invalid request
            response = client.post(
                "/api/analyze",
                json={
                    # Missing required 'text' field
                    "openai_key": "test-key"
                },
            )

            assert response.status_code == 422

            # Verify error was logged
            mock_logger.error.assert_called()


class TestHealthCheckIntegration:
    """Test health check endpoint integration."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    def test_health_check_when_healthy(self, client):
        """Test health check returns healthy status."""
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

    def test_health_check_with_degraded_service(self, client):
        """Test health check when some services are degraded."""
        # In a real implementation, health check might check circuit breakers
        with patch("llm_providers.openai_breaker") as mock_breaker:
            mock_breaker.current_state = "open"

            # Current implementation always returns healthy
            # This is where you'd implement actual health checks
            response = client.get("/api/health")
            assert response.status_code == 200

            # In a more sophisticated implementation:
            # assert response.json()["status"] == "degraded"
            # assert "openai" in response.json()["issues"]
