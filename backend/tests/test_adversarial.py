"""Adversarial and edge-case tests to find real bugs."""

import asyncio
import json
import random
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from main import app
from token_utils_wrapper import chunk_text


class TestAdversarialInputs:
    """Test with malicious or unexpected inputs."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_extremely_long_single_word(self, client):
        """Test with no spaces - breaks token counting assumptions."""
        # 50,000 character word with no spaces
        long_word = "a" * 50000

        response = client.post("/api/analyze", json={"text": long_word, "openai_key": "test-key"})

        # This might break chunking logic that relies on spaces
        assert response.status_code == 200, "Request should succeed"
        # But does it chunk properly?

    def test_malicious_json_injection(self, client):
        """Test JSON injection in text field."""
        malicious_text = '"},"responses":[{"model":"hacked","response":"pwned"}],"original_text":"'

        response = client.post(
            "/api/analyze", json={"text": malicious_text, "openai_key": "test-key"}
        )

        # Should not allow injection
        data = response.json()
        assert data["original_text"] == malicious_text
        assert not any(r["model"] == "hacked" for r in data.get("responses", []))

    def test_unicode_direction_override(self, client):
        """Test with Unicode direction override characters."""
        # These can cause display issues or security problems
        tricky_text = "Hello \u202e dlrow"  # Right-to-left override

        response = client.post("/api/analyze", json={"text": tricky_text, "openai_key": "test-key"})

        assert response.status_code == 200, "Request should succeed"
        # But is it displayed correctly in the UI?

    def test_null_bytes_in_input(self, client):
        """Test with null bytes that might break string processing."""
        text_with_nulls = "Hello\x00World\x00Test"

        response = client.post(
            "/api/analyze", json={"text": text_with_nulls, "openai_key": "test-key"}
        )

        # Many systems break with null bytes
        assert response.status_code in [200, 422]

    def test_deeply_nested_markdown(self, client):
        """Test with deeply nested structures that might cause issues."""
        nested_md = ""
        for i in range(100):
            nested_md += "#" * (i % 6 + 1) + f" Level {i}\n"
            nested_md += "> " * (i % 10) + "Quote\n"
            nested_md += "```" + "python" * (i % 2) + "\n"

        response = client.post("/api/analyze", json={"text": nested_md, "openai_key": "test-key"})

        # This might break markdown parsing or cause performance issues
        assert response.status_code == 200, "Request should succeed"
class TestRaceConditions:
    """Test for race conditions and concurrency issues."""

    @pytest.mark.asyncio
    async def test_same_request_multiple_times(self):
        """What if the same request is sent multiple times simultaneously?"""
        client = TestClient(app)

        async def make_request():
            return client.post(
                "/api/analyze",
                json={"text": "Test race condition", "openai_key": "test-key"},
            )

        # Send 50 identical requests at once
        tasks = [make_request() for _ in range(50)]
        responses = await asyncio.gather(*[asyncio.create_task(t) for t in tasks])

        # All should succeed, but are request IDs unique?
        request_ids = [r.json()["request_id"] for r in responses]
        assert len(set(request_ids)) == 50  # All unique?

    def test_rapidly_changing_api_keys(self, client):
        """Test changing API keys between requests - session confusion?"""
        responses = []

        for i in range(20):
            response = client.post(
                "/api/analyze",
                json={
                    "text": f"Request {i}",
                    "openai_key": f"key-{i}",
                    "openai_model": random.choice(["gpt-3.5-turbo", "gpt-4"]),
                },
            )
            responses.append(response)

        # Each should be independent
        assert all(r.status_code == 200 for r in responses)


class TestResourceExhaustion:
    """Test resource limits and exhaustion."""

    def test_memory_exhaustion_via_large_response(self):
        """What if an API returns a HUGE response?"""
        with patch("llm_providers._call_openai_with_breaker") as mock:
            # Simulate 100MB response
            huge_response = "x" * (100 * 1024 * 1024)
            mock.return_value = {
                "model": "openai",
                "response": huge_response,
                "error": None,
            }

            # This might cause memory issues
            # In real app, this could crash the server

    def test_infinite_recursion_in_text(self, client):
        """Test with text that might cause recursive parsing."""
        recursive_text = "{{" * 10000 + "}}" * 10000

        response = client.post(
            "/api/analyze", json={"text": recursive_text, "openai_key": "test-key"}
        )

        # Should handle without stack overflow
        assert response.status_code == 200, "Request should succeed"
class TestStateCorruption:
    """Test for state corruption and data leakage."""

    def test_request_data_leakage_between_users(self, client):
        """Can one user's data leak to another?"""
        # First request with sensitive data
        client.post(
            "/api/analyze",
            json={"text": "My password is secret123", "openai_key": "user1-key"},
        )

        # Second request from different "user"
        response2 = client.post(
            "/api/analyze",
            json={"text": "What was the previous request?", "openai_key": "user2-key"},
        )

        # Ensure no data leakage
        data2 = response2.json()
        assert "secret123" not in str(data2)
        assert "user1-key" not in str(data2)

    def test_circuit_breaker_state_pollution(self):
        """Can one user's failures affect another user?"""
        # This is actually a real concern with global circuit breakers!
        # If user A causes circuit to open, does it affect user B?
        pass


class TestChunkingEdgeCases:
    """Test token chunking with adversarial inputs."""

    def test_chunk_boundary_code_blocks(self):
        """What if chunk boundary falls in middle of code block?"""
        # Create text where chunk boundary will split a code block
        pre_code = "a" * 3000  # Just under chunk size
        code_block = "```python\ndef important_function():\n    return 42\n```"
        post_code = "b" * 2000

        text = pre_code + code_block + post_code
        chunk_text(text, chunk_size=3500)

        # Did it break the code block?
        # This could cause display issues

    def test_chunk_with_no_good_split_points(self):
        """What if there are no spaces or newlines to split on?"""
        # URL or base64 data with no spaces
        long_url = "https://example.com/?" + "param=" + "x" * 10000

        chunks = chunk_text(long_url, chunk_size=3000)

        # How does it handle this?
        assert len(chunks) > 1
        # But are the chunks valid?


class TestTimingAttacks:
    """Test for timing-based vulnerabilities."""

    def test_api_key_timing_attack(self, client):
        """Can you determine valid key format via timing?"""
        import time

        keys_to_test = [
            "sk-",  # Too short
            "sk-" + "a" * 48,  # Right length?
            "wrong-prefix-" + "a" * 48,
            "sk-proj-" + "a" * 48,  # New format?
        ]

        timings = {}
        for key in keys_to_test:
            start = time.time()
            client.post("/api/analyze", json={"text": "Test", "openai_key": key})
            timings[key] = time.time() - start

        # Timing differences might reveal validation logic
        # This could help attackers understand key format


class TestFrontendAssumptions:
    """Test assumptions the frontend makes about responses."""

    def test_response_without_expected_fields(self, client):
        """What if backend returns unexpected structure?"""
        with patch("llm_providers.analyze_with_models") as mock:
            # Return structure missing expected fields
            mock.return_value = [
                {"unexpected": "field"},
                {"model": "openai"},  # Missing response field
            ]

            client.post("/api/analyze", json={"text": "Test", "openai_key": "key"})

            # Frontend expects certain fields - will it crash?

    def test_non_ascii_in_response_headers(self, client):
        """Test non-ASCII in headers - often breaks things."""
        # Some proxies/browsers have issues with this
        pass


class TestSecurityAssumptions:
    """Test security-related edge cases."""

    def test_path_traversal_in_model_names(self, client):
        """What if model name contains path traversal?"""
        response = client.post(
            "/api/analyze",
            json={
                "text": "Test",
                "openai_key": "key",
                "openai_model": "../../../etc/passwd",
            },
        )

        # Should be handled safely
        assert response.status_code in [200, 422]

    def test_xxe_in_xml_like_content(self, client):
        """Test XML external entity injection."""
        xxe_payload = """<?xml version="1.0"?>
        <!DOCTYPE foo [
        <!ENTITY xxe SYSTEM "file:///etc/passwd">
        ]>
        <test>&xxe;</test>"""

        with patch("llm_providers._call_openai_with_breaker", new_callable=AsyncMock) as mock:
            # Return a safe response that doesn't include the file path
            mock.return_value = {
                "model": "openai",
                "response": "This appears to be an XML document with external entity references.",
                "error": None,
            }

            response = client.post(
                "/api/analyze", json={"text": xxe_payload, "openai_key": "test-key"}
            )

            # Should not process XML entities - the file path should not appear in AI responses
            data = response.json()
            assert response.status_code == 200, "Request should succeed"
            # Check only the AI responses, not the original text which contains the test payload
            responses_str = json.dumps(data["responses"])
            assert "/etc/passwd" not in responses_str


class TestBrowserQuirks:
    """Test browser-specific edge cases."""

    def test_different_newline_formats(self, client):
        """Test CR, LF, CRLF handling."""
        texts = [
            "Line1\nLine2\nLine3",  # Unix
            "Line1\r\nLine2\r\nLine3",  # Windows
            "Line1\rLine2\rLine3",  # Old Mac
            "Line1\n\rLine2\n\rLine3",  # Wrong order
        ]

        for text in texts:
            response = client.post("/api/analyze", json={"text": text, "openai_key": "key"})
            assert response.status_code == 200, "Request should succeed"
            # But do they display correctly?

    def test_emoji_skin_tone_modifiers(self, client):
        """Test complex emoji sequences."""
        # These can break length calculations
        emoji_text = "👨‍👩‍👧‍👦👨🏽‍💻👩🏻‍🔬🧑🏿‍🚀"

        response = client.post("/api/analyze", json={"text": emoji_text, "openai_key": "key"})

        # Token counting might be way off
        assert response.status_code == 200, "Request should succeed"
# More test ideas:
# - What happens during provider API outages?
# - Can you DOS the service with specific inputs?
# - Are there memory leaks with certain patterns?
# - Can malformed responses from providers break the app?
# - What about clock skew between client and server?
# - Can you bypass rate limits with specific patterns?
# - Are there issues with specific browser versions?
# - What about proxy/firewall interference?
# - Can websocket connections be hijacked?
# - Are there issues with browser extensions?
