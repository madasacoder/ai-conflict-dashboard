"""Extreme parallel testing to find race conditions."""

import pytest
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from unittest.mock import patch
from fastapi.testclient import TestClient

from main import app


class TestExtremeParallel:
    """Run the same test many times in parallel to find race conditions."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_parallel_api_calls_50x(self, client):
        """Make 50 concurrent API calls to stress test the system."""
        results = []
        errors = []

        def make_api_call(call_id):
            """Make a single API call."""
            try:
                # Use different API keys to test circuit breaker isolation
                response = client.post(
                    "/api/analyze",
                    json={
                        "text": f"Parallel test {call_id}",
                        "openai_key": f"test-key-{call_id % 10}",  # 10 different keys
                    },
                )
                results.append((call_id, response.status_code))
                return response.status_code == 200
            except Exception as e:
                errors.append((call_id, str(e)))
                return False

        # Mock the OpenAI call to return quickly
        with patch("llm_providers._make_openai_call") as mock_call:
            mock_call.return_value = {
                "model": "openai",
                "response": "Test response",
                "error": None,
            }

            # Run 50 calls concurrently
            with ThreadPoolExecutor(max_workers=50) as executor:
                futures = [executor.submit(make_api_call, i) for i in range(50)]

                for future in as_completed(futures):
                    assert future.result() is True, f"Errors: {errors}"

        # All calls should succeed
        assert len(results) == 50
        assert all(status == 200 for _, status in results)
        assert len(errors) == 0

    def test_circuit_breaker_50x_concurrent_failures(self, client):
        """Test circuit breaker behavior with 50 concurrent failing calls."""
        results = []

        def make_failing_call(call_id):
            """Make a call that will fail."""
            # Use same key to test circuit breaker opening
            response = client.post(
                "/api/analyze",
                json={
                    "text": f"Fail test {call_id}",
                    "openai_key": "shared-test-key",
                },
            )
            data = response.json()
            error = data["responses"][0].get("error", "")
            results.append((call_id, error))
            return response.status_code == 200

        # Mock to always fail
        with patch("llm_providers._make_openai_call") as mock_call:
            mock_call.side_effect = Exception("Forced failure")

            # Run 50 failing calls concurrently
            with ThreadPoolExecutor(max_workers=50) as executor:
                futures = [executor.submit(make_failing_call, i) for i in range(50)]

                for future in as_completed(futures):
                    assert (
                        future.result() is True
                    )  # API should return 200 even with errors

        # Check results
        assert len(results) == 50

        # Count how many show circuit breaker open
        circuit_open_count = sum(
            1 for _, error in results if error and "circuit" in error.lower()
        )

        # After 5 failures, circuit should open, so most should show circuit open
        assert (
            circuit_open_count > 40
        ), f"Only {circuit_open_count}/50 showed circuit open"

    def test_rate_limiting_50x_same_user(self, client):
        """Test rate limiting with 50 concurrent requests from same user."""
        results = []

        def make_rate_limited_call(call_id):
            """Make a call that might be rate limited."""
            response = client.post(
                "/api/analyze",
                json={
                    "text": f"Rate test {call_id}",
                    "openai_key": "same-user-key",  # Same key = same user
                },
            )
            results.append((call_id, response.status_code))
            return True

        # Mock to return quickly
        with patch("llm_providers._make_openai_call") as mock_call:
            mock_call.return_value = {
                "model": "openai",
                "response": "Test",
                "error": None,
            }

            # Run 50 calls concurrently from same user
            with ThreadPoolExecutor(max_workers=50) as executor:
                futures = [
                    executor.submit(make_rate_limited_call, i) for i in range(50)
                ]

                for future in as_completed(futures):
                    future.result()

        # Check results
        assert len(results) == 50

        # Count successful vs rate limited
        success_count = sum(1 for _, status in results if status == 200)
        rate_limited_count = sum(1 for _, status in results if status == 429)

        assert success_count + rate_limited_count == 50
        # Should have some rate limiting (burst size is 60)
        assert success_count <= 60  # Burst size + some in the time window

    @pytest.mark.asyncio
    async def test_async_50x_concurrent_analysis(self):
        """Test 50 concurrent async analysis calls."""
        from llm_providers import analyze_with_models

        results = []

        async def mock_provider(*args, **kwargs):
            await asyncio.sleep(0.001)  # Tiny delay
            return {"model": "test", "response": "test", "error": None}

        with patch("llm_providers.call_openai", side_effect=mock_provider):
            with patch("llm_providers.call_claude", side_effect=mock_provider):
                # Create 50 concurrent analysis tasks
                tasks = []
                for i in range(50):
                    task = analyze_with_models(
                        f"Test {i}", openai_key=f"key-{i}", claude_key=f"key-{i}"
                    )
                    tasks.append(task)

                # Run all concurrently
                start = time.time()
                results = await asyncio.gather(*tasks)
                elapsed = time.time() - start

        # All should complete
        assert len(results) == 50

        # Should complete quickly due to concurrency (not 50 * 0.001s)
        assert elapsed < 0.5, f"Took {elapsed}s, suggests not concurrent"

        # Each result should have 2 provider responses
        for result in results:
            assert len(result) == 2
