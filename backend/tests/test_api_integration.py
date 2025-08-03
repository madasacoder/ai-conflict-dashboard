"""API-level integration tests.

These tests verify API behavior with various real-world scenarios.
"""

import pytest
import json
import time
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from main import app


class TestAPIIntegrationScenarios:
    """Test various API integration scenarios."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    def test_multiple_file_content_analysis(self, client):
        """Test API with content that simulates multiple file uploads."""
        # Simulate multiple file content
        multi_file_content = """--- File: main.py ---

def hello_world():
    print("Hello, World!")

--- File: utils.py ---

def add_numbers(a, b):
    return a + b

--- File: README.md ---

# Test Project
This is a test project with multiple files."""

        with patch(
            "llm_providers._call_openai_with_breaker", new_callable=AsyncMock
        ) as mock_openai:
            mock_openai.return_value = {
                "model": "openai",
                "response": "I see you have 3 files: main.py with a hello_world function, utils.py with an add_numbers function, and a README.md file.",
                "error": None,
            }

            response = client.post(
                "/api/analyze",
                json={"text": multi_file_content, "openai_key": "test-key"},
            )

            assert response.status_code == 200
            data = response.json()

            # Verify the full content was passed
            assert data["original_text"] == multi_file_content
            assert "3 files" in data["responses"][0]["response"]

    def test_unicode_and_special_characters(self, client):
        """Test API with various unicode and special characters."""
        test_cases = [
            "Hello 世界 🌍",  # Mixed languages with emoji
            "Ñoño façade café",  # Accented characters
            "Math: ∑(i=1 to n) = n(n+1)/2",  # Mathematical symbols
            "Code: `print('Hello')`",  # Backticks
            "Quotes: \"smart\" 'quotes'",  # Smart quotes
        ]

        with patch(
            "llm_providers._call_openai_with_breaker", new_callable=AsyncMock
        ) as mock_openai:
            for text in test_cases:
                mock_openai.return_value = {
                    "model": "openai",
                    "response": f"Processed: {text}",
                    "error": None,
                }

                response = client.post(
                    "/api/analyze", json={"text": text, "openai_key": "test-key"}
                )

                assert response.status_code == 200
                data = response.json()
                assert data["original_text"] == text

    def test_concurrent_requests(self, client):
        """Test handling multiple concurrent requests."""
        import threading

        results = []
        errors = []

        def make_request(index):
            try:
                with patch(
                    "llm_providers._call_openai_with_breaker", new_callable=AsyncMock
                ) as mock:
                    mock.return_value = {
                        "model": "openai",
                        "response": f"Response {index}",
                        "error": None,
                    }

                    response = client.post(
                        "/api/analyze",
                        json={"text": f"Request {index}", "openai_key": "test-key"},
                    )

                    results.append(
                        {
                            "index": index,
                            "status": response.status_code,
                            "data": response.json(),
                        }
                    )
            except Exception as e:
                errors.append({"index": index, "error": str(e)})

        # Create multiple threads
        threads = []
        for i in range(10):
            thread = threading.Thread(target=make_request, args=(i,))
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        # Verify all requests succeeded
        assert len(errors) == 0
        assert len(results) == 10
        assert all(r["status"] == 200 for r in results)

    def test_request_id_uniqueness(self, client):
        """Test that each request gets a unique request ID."""
        request_ids = set()

        with patch(
            "llm_providers._call_openai_with_breaker", new_callable=AsyncMock
        ) as mock:
            mock.return_value = {
                "model": "openai",
                "response": "Test response",
                "error": None,
            }

            # Make multiple requests
            for i in range(20):
                response = client.post(
                    "/api/analyze", json={"text": f"Test {i}", "openai_key": "test-key"}
                )

                assert response.status_code == 200
                request_id = response.json()["request_id"]

                # Verify uniqueness
                assert request_id not in request_ids
                request_ids.add(request_id)

        assert len(request_ids) == 20

    def test_model_fallback_behavior(self, client):
        """Test behavior when specific models are not available."""
        # Test with invalid model selection
        with patch(
            "llm_providers._call_openai_with_breaker", new_callable=AsyncMock
        ) as mock_openai:
            mock_openai.return_value = {
                "model": "openai",
                "response": "Using default model",
                "error": None,
            }

            response = client.post(
                "/api/analyze",
                json={
                    "text": "Test model fallback",
                    "openai_key": "test-key",
                    "openai_model": "non-existent-model",  # Invalid model
                },
            )

            assert response.status_code == 200
            # The system should handle invalid models gracefully

    def test_mixed_provider_response_times(self, client):
        """Test handling providers with different response times."""

        def fast_provider(*args, **kwargs):
            return {"model": "fast", "response": "Fast response", "error": None}

        def slow_provider(*args, **kwargs):
            import time

            time.sleep(0.5)
            return {"model": "slow", "response": "Slow response", "error": None}

        with patch(
            "llm_providers._call_openai_with_breaker", side_effect=fast_provider
        ):
            with patch(
                "llm_providers._call_claude_with_breaker", side_effect=slow_provider
            ):
                start_time = time.time()

                response = client.post(
                    "/api/analyze",
                    json={
                        "text": "Test timing",
                        "openai_key": "test-key",
                        "claude_key": "test-key",
                    },
                )

                elapsed = time.time() - start_time

                assert response.status_code == 200
                data = response.json()

                # Both responses should be present
                assert len(data["responses"]) == 2

                # Total time should be close to slow provider time (concurrent)
                assert elapsed < 1.0  # Should be ~0.5s, not 0.5s + fast time

    def test_empty_provider_response_handling(self, client):
        """Test handling of empty responses from providers."""
        with patch(
            "llm_providers._call_openai_with_breaker", new_callable=AsyncMock
        ) as mock:
            mock.return_value = {
                "model": "openai",
                "response": "",  # Empty response
                "error": None,
            }

            response = client.post(
                "/api/analyze",
                json={"text": "Test empty response", "openai_key": "test-key"},
            )

            assert response.status_code == 200
            data = response.json()

            # Empty response should still be valid
            assert data["responses"][0]["response"] == ""
            assert data["responses"][0]["error"] is None

    def test_cors_headers(self, client):
        """Test CORS headers are properly set."""
        # Preflight request
        response = client.options(
            "/api/analyze",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )

        # CORS headers should be present
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers

        # Actual request
        response = client.post(
            "/api/analyze",
            json={"text": "Test", "openai_key": "test-key"},
            headers={"Origin": "http://localhost:3000"},
        )

        assert "access-control-allow-origin" in response.headers


class TestAPIErrorScenarios:
    """Test various error scenarios at API level."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    def test_malformed_json(self, client):
        """Test API with malformed JSON."""
        response = client.post(
            "/api/analyze",
            content="{'invalid': json}",  # Invalid JSON
            headers={"Content-Type": "application/json"},
        )

        assert response.status_code == 422  # Unprocessable Entity

    def test_missing_content_type(self, client):
        """Test API without Content-Type header."""
        response = client.post(
            "/api/analyze",
            content=json.dumps({"text": "Test", "openai_key": "test-key"}),
            # No Content-Type header
        )

        # FastAPI is lenient about Content-Type
        assert response.status_code in [200, 422]

    def test_very_large_payload(self, client):
        """Test API with very large payload."""
        # Create a large text (10MB)
        large_text = "x" * (10 * 1024 * 1024)

        response = client.post(
            "/api/analyze", json={"text": large_text, "openai_key": "test-key"}
        )

        # Should handle large payloads gracefully
        # Actual limits depend on server configuration
        assert response.status_code in [200, 413]  # 413 = Payload Too Large

    def test_rate_limiting_simulation(self, client):
        """Simulate rate limiting behavior."""
        # Make many rapid requests to test rate limiting
        success_count = 0
        rate_limited_count = 0

        with patch(
            "llm_providers._call_openai_with_breaker", new_callable=AsyncMock
        ) as mock:
            mock.return_value = {"model": "openai", "response": "OK", "error": None}

            for i in range(100):
                response = client.post(
                    "/api/analyze",
                    json={"text": f"Rapid request {i}", "openai_key": "test-key"},
                )
                if response.status_code == 200:
                    success_count += 1
                elif response.status_code == 429:
                    rate_limited_count += 1
                    # Verify proper rate limit error message
                    assert "rate limit" in response.json()["detail"].lower()

        # We have rate limiting implemented (60 req/min limit)
        # So we should see some successful requests and some rate limited
        assert success_count > 0, "Should have some successful requests"
        assert rate_limited_count > 0, "Should have some rate limited requests"
        assert (
            success_count + rate_limited_count == 100
        ), "All requests should be accounted for"

    def test_timeout_handling(self, client):
        """Test request timeout handling."""

        # Mock the call_openai to simulate timeout
        with patch("llm_providers.call_openai", new_callable=AsyncMock) as mock_openai:
            # Return a timeout error response
            mock_openai.return_value = {
                "model": "openai",
                "response": "",
                "error": "Request timeout (30s)",
            }
            response = client.post(
                "/api/analyze", json={"text": "Test timeout", "openai_key": "test-key"}
            )

            assert response.status_code == 200
            data = response.json()

            # Should have timeout error
            assert data["responses"][0]["error"] is not None
            assert "timeout" in data["responses"][0]["error"].lower()
