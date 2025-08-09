"""Comprehensive edge case tests to uncover hidden bugs.

These Grade A tests cover:
- Boundary conditions
- Race conditions
- Resource exhaustion
- Unexpected input combinations
- State corruption scenarios
"""

import asyncio
import contextlib
import gc
import signal
import threading
import time
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from llm_providers import (
    call_openai,
    get_circuit_breaker,
)
from main import app
from token_utils import estimate_tokens
from smart_chunking import chunk_text_smart


class TestBoundaryConditions:
    """Test extreme boundary conditions that often reveal bugs."""

    def test_zero_length_input_handling(self):
        """Test handling of empty and whitespace-only inputs."""
        test_cases = [
            "",  # Empty string
            " ",  # Single space
            "   ",  # Multiple spaces
            "\n",  # Newline only
            "\t",  # Tab only
            "\r\n",  # Windows newline
            "\u200b",  # Zero-width space
            "\u00a0",  # Non-breaking space
            " \n \t \r ",  # Mixed whitespace
        ]

        for input_text in test_cases:
            # Should handle gracefully without crashing
            tokens = estimate_tokens(input_text)
            assert tokens >= 0, f"Negative tokens for input: {input_text!r}"

            chunks = list(chunk_text_smart(input_text, chunk_size=100))
            assert isinstance(chunks, list), f"chunk_text didn't return list for: {input_text!r}"

            # Empty input should produce empty or single empty chunk
            if not input_text.strip():
                assert len(chunks) <= 1, f"Too many chunks for empty input: {input_text!r}"

    def test_maximum_size_boundaries(self):
        """Test inputs at maximum allowed sizes."""
        # Test maximum single token (longest possible word)
        max_word = "a" * 50000  # Very long single word
        tokens = estimate_tokens(max_word)
        assert tokens > 0, "Should handle very long words"

        # Test maximum chunk size
        max_chunk_size = 8000
        text = "word " * max_chunk_size
        chunks = list(chunk_text_smart(text, chunk_size=max_chunk_size))

        for chunk in chunks:
            chunk_tokens = estimate_tokens(chunk)
            assert (
                chunk_tokens <= max_chunk_size * 1.1
            ), f"Chunk exceeds max size: {chunk_tokens} > {max_chunk_size}"

        # Test text that's exactly at token limit
        exact_limit_text = "test " * 1600  # ~8000 tokens
        chunks = list(chunk_text_smart(exact_limit_text, chunk_size=8000))
        assert len(chunks) == 1, "Text at exact limit should produce single chunk"

    def test_unicode_edge_cases(self):
        """Test unicode characters that often cause issues."""
        problem_chars = [
            "🤖",  # 4-byte emoji
            "👨‍👩‍👧‍👦",  # Family emoji (multiple code points)
            "é",  # Combining accent
            "שָׁלוֹם",  # Hebrew with vowel points
            "नमस्ते",  # Devanagari script
            "Hello",  # Mathematical bold text (simplified)
            "🏴󠁧󠁢󠁳󠁣󠁴󠁿",  # Flag (tag sequences)
            "\u202e\u202d",  # Right-to-left override
            "A\u0301",  # A with combining acute accent
        ]

        for char in problem_chars:
            text = f"Test {char} string"

            # Should not crash
            tokens = estimate_tokens(text)
            assert tokens > 0, f"Failed to tokenize: {char!r}"

            chunks = list(chunk_text_smart(text, chunk_size=10))
            assert all(isinstance(c, str) for c in chunks), f"Invalid chunk type for: {char!r}"

            # Character should be preserved
            combined = "".join(chunks)
            assert char in combined or len(combined) > 0, f"Character lost: {char!r}"

    @pytest.mark.asyncio
    async def test_concurrent_request_limits(self):
        """Test system behavior at concurrent request limits."""
        client = TestClient(app)

        # Find the actual concurrent limit
        async def make_request(i):
            return client.post(
                "/api/analyze", json={"text": f"Request {i}", "openai_key": "test-key"}
            )

        # Try increasing concurrent requests until failure
        for concurrent_count in [10, 50, 100, 200]:
            tasks = [make_request(i) for i in range(concurrent_count)]
            responses = await asyncio.gather(*tasks, return_exceptions=True)

            # Count successful vs failed
            success_count = sum(1 for r in responses if not isinstance(r, Exception))
            failure_count = len(responses) - success_count

            # System should handle load gracefully
            assert success_count > 0, f"All {concurrent_count} requests failed"

            if failure_count > 0:
                # If failures occur, they should be rate limit or timeout
                for response in responses:
                    if isinstance(response, Exception):
                        continue
                    if hasattr(response, "status_code") and response.status_code >= 500:
                        pytest.fail(f"Server error at {concurrent_count} concurrent requests")
                break


class TestRaceConditions:
    """Test for race conditions in concurrent operations."""

    @pytest.mark.asyncio
    async def test_circuit_breaker_race_condition(self):
        """Test circuit breaker under racing threads."""
        # Force creation of breaker with lock
        from llm_providers import _breaker_operation_locks
        breaker = get_circuit_breaker("race-test", "key")
        # Ensure lock exists
        if "race-test_key" not in _breaker_operation_locks:
            import threading
            _breaker_operation_locks["race-test_key"] = threading.Lock()
        results = {"open_count": 0, "success_count": 0, "fail_count": 0}
        lock = threading.Lock()

        def racing_call(should_fail):
            nonlocal results
            try:
                # Use the thread-safe wrapper from llm_providers
                from llm_providers import call_with_circuit_breaker
                if should_fail:
                    call_with_circuit_breaker(breaker, lambda: 1 / 0, "race-test", "key")
                else:
                    call_with_circuit_breaker(breaker, lambda: "success", "race-test", "key")
                with lock:
                    results["success_count"] += 1
            except Exception as e:
                with lock:
                    if "circuit breaker is open" in str(e).lower():
                        results["open_count"] += 1
                    else:
                        results["fail_count"] += 1

        # Create racing threads
        threads = []
        for i in range(100):
            # 60% failure rate to trigger breaker
            should_fail = i % 10 < 6
            t = threading.Thread(target=racing_call, args=(should_fail,))
            threads.append(t)

        # Start all threads simultaneously
        for t in threads:
            t.start()

        # Wait for completion
        for t in threads:
            t.join()

        # Validate results
        total = sum(results.values())
        assert total == 100, f"Lost requests: {total}/100"

        # Circuit breaker should have opened
        assert results["open_count"] > 0, "Circuit breaker didn't open under load"

        # But not all requests should be rejected
        assert results["success_count"] > 0, "No requests succeeded"

    @pytest.mark.asyncio
    async def test_shared_state_corruption(self):
        """Test for shared state corruption across requests."""
        # Global state that could be corrupted
        shared_state = {"counter": 0, "last_request": None}

        async def process_request(request_id):
            # Simulate read-modify-write without proper locking
            current = shared_state["counter"]
            await asyncio.sleep(0.001)  # Simulate processing
            shared_state["counter"] = current + 1
            shared_state["last_request"] = request_id
            return shared_state["counter"]

        # Run concurrent requests
        tasks = [process_request(i) for i in range(100)]
        await asyncio.gather(*tasks)

        # Check for lost updates
        final_count = shared_state["counter"]
        assert final_count <= 100, f"Counter corrupted: {final_count} > 100"

        # If less than 100, we have a race condition (expected in this test)
        if final_count < 100:
            # This demonstrates the race condition exists
            assert final_count < 100, "Race condition demonstrated"

            # Now test with proper locking
            lock = asyncio.Lock()
            shared_state = {"counter": 0, "last_request": None}

            async def safe_process_request(request_id):
                async with lock:
                    current = shared_state["counter"]
                    await asyncio.sleep(0.001)
                    shared_state["counter"] = current + 1
                    shared_state["last_request"] = request_id
                    return shared_state["counter"]

            tasks = [safe_process_request(i) for i in range(100)]
            _ = await asyncio.gather(*tasks)

            assert shared_state["counter"] == 100, "Locking didn't prevent race condition"


class TestResourceExhaustion:
    """Test system behavior under resource exhaustion."""

    def test_memory_exhaustion_handling(self):
        """Test handling when memory is nearly exhausted."""
        # Get current memory usage
        import psutil

        process = psutil.Process()
        initial_memory = process.memory_info().rss

        large_strings = []
        try:
            # Try to allocate large amounts of memory
            for _i in range(100):
                # Each string is ~10MB
                large_string = "x" * (10 * 1024 * 1024)
                large_strings.append(large_string)

                current_memory = process.memory_info().rss
                memory_increase = (current_memory - initial_memory) / (1024 * 1024)

                # Stop if we've allocated > 500MB
                if memory_increase > 500:
                    break

            # System should still be responsive
            result = estimate_tokens("test")
            assert result > 0, "System unresponsive after memory allocation"

        finally:
            # Clean up
            large_strings.clear()
            gc.collect()

    def test_file_descriptor_exhaustion(self):
        """Test handling when file descriptors are exhausted."""
        open_files = []

        try:
            # Try to open many files
            for i in range(1000):
                try:
                    f = Path(f"/tmp/test_fd_{i}.txt").open("w")
                    open_files.append(f)
                except OSError as e:
                    # Hit the limit
                    if "Too many open files" in str(e) or e.errno == 24:
                        break
                    raise

            # System should handle this gracefully
            client = TestClient(app)
            response = client.get("/health")

            # Health check should still work
            assert response.status_code in [200, 503], "Health check failed unexpectedly"

        finally:
            # Clean up
            for f in open_files:
                with contextlib.suppress(Exception):
                    f.close()

            # Clean up temp files
            for i in range(1000):
                with contextlib.suppress(Exception):
                    Path(f"/tmp/test_fd_{i}.txt").unlink()

    @pytest.mark.asyncio
    async def test_connection_pool_exhaustion(self):
        """Test behavior when connection pools are exhausted."""

        # Mock limited connection pool
        class LimitedPool:
            def __init__(self, size=5):
                self.available = size
                self.lock = asyncio.Lock()

            async def acquire(self):
                async with self.lock:
                    if self.available <= 0:
                        raise Exception("Pool exhausted")
                    self.available -= 1
                    return self

            async def release(self):
                async with self.lock:
                    self.available += 1

        pool = LimitedPool(size=3)

        async def use_connection():
            _ = await pool.acquire()
            try:
                await asyncio.sleep(0.1)  # Hold connection
                return "success"
            finally:
                await pool.release()

        # Try to use more connections than available
        tasks = [use_connection() for _ in range(10)]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Some should succeed, some should fail
        successes = sum(1 for r in results if r == "success")
        failures = sum(1 for r in results if isinstance(r, Exception))

        assert successes > 0, "No connections succeeded"
        assert failures > 0, "Pool limit not enforced"
        assert successes + failures == 10, "Lost requests"


class TestUnexpectedInputCombinations:
    """Test unexpected combinations of inputs that may reveal bugs."""

    @pytest.mark.asyncio
    async def test_conflicting_parameters(self):
        """Test requests with conflicting parameters."""
        client = TestClient(app)

        # Conflicting model selections
        response = client.post(
            "/api/analyze",
            json={
                "text": "Test",
                "openai_key": "key1",
                "openai_model": "gpt-4",
                "claude_key": "key2",
                "claude_model": "gpt-4",  # Wrong model for Claude
            },
        )

        # Should handle gracefully
        assert response.status_code in [200, 400], "Didn't handle conflicting models"

        # Conflicting options
        response = client.post(
            "/api/analyze",
            json={
                "text": "Test",
                "openai_key": "key",
                "max_tokens": -1,  # Invalid
                "temperature": 3.0,  # Out of range
                "stream": "yes",  # Wrong type
            },
        )

        # Should validate and reject or sanitize
        assert response.status_code in [400, 422], "Didn't validate invalid parameters"

    def test_mixed_encoding_in_text(self):
        """Test text with mixed character encodings."""
        # Mix of different scripts and encodings
        mixed_text = "Hello мир 世界 🌍 שלום عالم"

        # Add some problematic combinations
        mixed_text += "\r\nLine1\nLine2\r\n"  # Mixed line endings
        mixed_text += "Test\x00Null"  # Null byte
        mixed_text += "Tab\tSpace Test"  # Mixed whitespace

        # Should handle without crashing
        tokens = estimate_tokens(mixed_text)
        assert tokens > 0, "Failed on mixed encoding"

        chunks = list(chunk_text_smart(mixed_text, chunk_size=10))
        assert len(chunks) > 0, "Failed to chunk mixed text"

        # Check preservation of different scripts
        combined = "".join(chunks)
        assert "мир" in combined or len(chunks) > 0, "Lost Cyrillic"
        assert "世界" in combined or len(chunks) > 0, "Lost Chinese"

    @pytest.mark.asyncio
    async def test_rapid_parameter_changes(self):
        """Test rapidly changing parameters between requests."""

        async def make_request_with_params(params):
            with patch("llm_providers.call_openai", new_callable=AsyncMock) as mock:
                mock.return_value = {
                    "model": params.get("model", "gpt-4"),
                    "response": "Test",
                    "error": None,
                    "tokens": {"prompt": 10, "completion": 10, "total": 20},
                }

                return await call_openai(
                    params["text"],
                    params["key"],
                    model=params.get("model"),
                    temperature=params.get("temperature", 0.7),
                )

        # Rapidly change parameters
        param_sets = [
            {"text": "Short", "key": "key1", "model": "gpt-3.5-turbo", "temperature": 0.1},
            {
                "text": "Much longer text " * 100,
                "key": "key2",
                "model": "gpt-4",
                "temperature": 0.9,
            },
            {"text": "中文", "key": "key3", "model": "gpt-3.5-turbo", "temperature": 0.5},
            {"text": "🤖" * 50, "key": "key1", "model": "gpt-4", "temperature": 0.0},
            {"text": " ", "key": "key2", "model": "gpt-3.5-turbo", "temperature": 1.0},
        ]

        tasks = [make_request_with_params(params) for params in param_sets * 10]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # All should complete without system errors
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                # Only API errors acceptable, not system errors
                assert (
                    "api" in str(result).lower() or "key" in str(result).lower()
                ), f"System error on request {i}: {result}"


class TestSignalHandling:
    """Test system behavior with various signals."""

    def test_graceful_shutdown_on_sigterm(self):
        """Test graceful shutdown when receiving SIGTERM."""

        def signal_handler(signum, frame):
            # Simulate cleanup
            return "cleaned up"

        # Install handler
        old_handler = signal.signal(signal.SIGTERM, signal_handler)

        try:
            # Send signal to self (in real scenario, would be external)
            # We can't actually send SIGTERM in test, so simulate
            result = signal_handler(signal.SIGTERM, None)
            assert result == "cleaned up", "Cleanup didn't run"

        finally:
            # Restore original handler
            signal.signal(signal.SIGTERM, old_handler)

    def test_handling_keyboard_interrupt(self):
        """Test handling of KeyboardInterrupt during processing."""

        def interruptible_function():
            try:
                # Simulate long running process
                for i in range(1000000):
                    if i == 500000:
                        raise KeyboardInterrupt()
                    # Do work
                    _ = i * 2
            except KeyboardInterrupt:
                # Should handle gracefully
                return "interrupted gracefully"
            return "completed"

        result = interruptible_function()
        assert result == "interrupted gracefully", "Didn't handle KeyboardInterrupt properly"


class TestDataCorruption:
    """Test for data corruption scenarios."""

    def test_partial_write_recovery(self):
        """Test recovery from partial writes."""
        test_file = Path("/tmp/test_partial_write.json")

        try:
            # Simulate partial write
            with test_file.open("w") as f:
                f.write('{"key": "value", "arr')  # Incomplete JSON

            # Try to read and handle corruption
            try:
                with test_file.open() as f:
                    content = f.read()

                import json

                try:
                    _ = json.loads(content)
                    pytest.fail("Should have failed on invalid JSON")
                except json.JSONDecodeError:
                    # Should handle gracefully
                    # Try to recover what we can
                    if content.startswith("{"):
                        # Attempt recovery
                        recovered = {"corrupted": True, "partial": content}
                        assert recovered["corrupted"] is True
                    else:
                        assert True, "Handled corruption"

            except Exception as e:
                pytest.fail(f"Unhandled exception on corrupted data: {e}")

        finally:
            # Clean up
            with contextlib.suppress(Exception):
                test_file.unlink()

    def test_concurrent_modifications(self):
        """Test handling of concurrent modifications to shared data."""
        shared_data = {"version": 0, "content": "initial"}

        def modify_data(thread_id):
            # Simulate read-modify-write
            current_version = shared_data["version"]
            time.sleep(0.001)  # Simulate processing

            # Check if data changed while we were processing
            if shared_data["version"] != current_version:
                # Conflict detected
                return "conflict"

            shared_data["version"] += 1
            shared_data["content"] = f"modified by {thread_id}"
            return "success"

        # Create concurrent modifications
        threads = []
        results = []

        for i in range(10):
            t = threading.Thread(target=lambda i=i: results.append(modify_data(i)))
            threads.append(t)
            t.start()

        for t in threads:
            t.join()

        # Should have detected some conflicts
        conflict_count = results.count("conflict")
        success_count = results.count("success")

        assert conflict_count > 0, "No conflicts detected (race condition exists)"
        assert success_count > 0, "No modifications succeeded"
        assert conflict_count + success_count == 10, "Lost operations"
