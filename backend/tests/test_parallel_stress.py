"""Stress tests for parallel execution to find race conditions."""

import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from unittest.mock import patch

import pytest

from llm_providers import _circuit_breaker_lock, circuit_breakers, get_circuit_breaker


class TestParallelStress:
    """Tests designed to stress thread safety under parallel load."""

    def test_circuit_breaker_concurrent_access(self):
        """Test circuit breaker creation under extreme concurrent load."""
        # Clear existing breakers
        with _circuit_breaker_lock:
            for provider in circuit_breakers:
                circuit_breakers[provider].clear()

        results = []
        errors = []

        def create_breaker(provider, key_num):
            """Create a circuit breaker and track results."""
            try:
                key = f"stress-test-key-{key_num}"
                breaker = get_circuit_breaker(provider, key)
                results.append((provider, key, id(breaker)))
                return True
            except Exception as e:
                errors.append(str(e))
                return False

        # Use thread pool to create many circuit breakers concurrently
        with ThreadPoolExecutor(max_workers=32) as executor:
            futures = []

            # Submit 1000 circuit breaker creations across 4 providers
            for i in range(250):
                for provider in ["openai", "claude", "gemini", "grok"]:
                    future = executor.submit(create_breaker, provider, i)
                    futures.append(future)

            # Wait for all to complete
            for future in as_completed(futures):
                assert future.result() is True, f"Errors occurred: {errors}"

        # Verify no errors occurred
        assert len(errors) == 0, f"Thread safety errors: {errors}"

        # Verify all breakers were created
        assert len(results) == 1000

        # Verify each provider has 250 unique circuit breakers
        for provider in ["openai", "claude", "gemini", "grok"]:
            assert len(circuit_breakers[provider]) == 250

    def test_circuit_breaker_state_changes_concurrent(self):
        """Test circuit breaker state changes under concurrent load."""
        # Create a shared circuit breaker
        test_key = "concurrent-state-test"
        breaker = get_circuit_breaker("openai", test_key)

        success_count = 0
        failure_count = 0
        results_lock = threading.Lock()

        def simulate_calls(call_id):
            """Simulate API calls that might fail."""
            nonlocal success_count, failure_count

            try:
                # Mock a call that fails 50% of the time
                @breaker
                def api_call():
                    if call_id % 2 == 0:
                        raise Exception("Simulated failure")
                    return "Success"

                api_call()
                with results_lock:
                    success_count += 1
            except Exception:
                with results_lock:
                    failure_count += 1

        # Run many concurrent calls
        with ThreadPoolExecutor(max_workers=16) as executor:
            futures = [executor.submit(simulate_calls, i) for i in range(100)]

            # Wait for all to complete
            for future in as_completed(futures):
                future.result()  # Don't care about individual results

        # Verify counts are consistent
        assert success_count + failure_count == 100

    def test_rate_limiter_concurrent_access(self):
        """Test rate limiter under concurrent access."""
        from rate_limiting import RateLimiter

        limiter = RateLimiter(requests_per_minute=20, burst_size=10)

        allowed_count = 0
        denied_count = 0
        results_lock = threading.Lock()

        def check_rate_limit(request_id):
            """Check rate limit concurrently."""
            nonlocal allowed_count, denied_count

            identifier = f"user-{request_id % 5}"  # 5 different users
            allowed, _ = limiter.check_rate_limit(identifier)

            with results_lock:
                if allowed:
                    allowed_count += 1
                else:
                    denied_count += 1

        # Submit many concurrent rate limit checks
        with ThreadPoolExecutor(max_workers=32) as executor:
            futures = [executor.submit(check_rate_limit, i) for i in range(200)]

            for future in as_completed(futures):
                future.result()

        # Verify counts are consistent
        assert allowed_count + denied_count == 200
        # Should have some of each (rate limiting should kick in)
        assert allowed_count > 0
        assert denied_count > 0

    @pytest.mark.asyncio
    async def test_async_provider_calls_concurrent(self):
        """Test concurrent async provider calls."""
        from llm_providers import analyze_with_models

        call_count = 0
        call_lock = threading.Lock()

        async def mock_provider_call(*args, **kwargs):
            """Mock provider that tracks calls."""
            nonlocal call_count
            with call_lock:
                call_count += 1
            await asyncio.sleep(0.01)  # Simulate API delay
            return {"model": "test", "response": "test", "error": None}

        with patch("llm_providers.call_openai", side_effect=mock_provider_call):
            with patch("llm_providers.call_claude", side_effect=mock_provider_call):
                # Run many concurrent analysis calls
                tasks = []
                for i in range(50):
                    task = analyze_with_models(
                        f"Test {i}", openai_key=f"key-{i}", claude_key=f"key-{i}"
                    )
                    tasks.append(task)

                results = await asyncio.gather(*tasks)

        # Verify all calls completed
        assert len(results) == 50
        assert call_count == 100  # 2 providers * 50 calls

        # Verify each result has 2 responses
        for result in results:
            assert len(result) == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
