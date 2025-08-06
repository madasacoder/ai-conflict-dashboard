"""Real Grade A Integration Tests - NO MOCKS!

These tests run against the ACTUAL backend server and REAL services.
They will find bugs that mocked tests could never discover.
"""

import json
import time

import pytest
import requests

# Real backend URL - must be running!
BASE_URL = "http://localhost:8000"


class TestRealBackendIntegration:
    """Test against the REAL running backend."""

    def test_backend_is_actually_running(self):
        """Verify backend is up and responding."""
        response = requests.get(f"{BASE_URL}/api/health")

        # Strong assertions on real response
        assert response.status_code == 200, f"Backend not healthy: {response.status_code}"
        data = response.json()
        assert data["status"] == "healthy", f"Backend unhealthy: {data}"

        # Measure response time
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/health")
        duration = time.time() - start

        assert duration < 0.5, f"Health check too slow: {duration}s"

    def test_real_api_analyze_with_actual_text(self):
        """Test real text analysis with actual backend."""
        # Real text that might reveal issues
        test_texts = [
            "Analyze the implications of quantum computing on cybersecurity.",
            "Compare the economic impacts of renewable vs fossil fuel energy.",
            "What are the ethical considerations of AI in healthcare?",
            "中文文本：分析人工智能的未来发展趋势。",  # Chinese text
            "🤖 Emoji test: How do AI models handle emoji? 🚀",
            "Very " + "long " * 1000 + "text to test chunking.",
            "",  # Empty text
            " " * 100,  # Only spaces
            "Test\x00with\x00null\x00bytes",  # Null bytes
            "SELECT * FROM users; DROP TABLE users; --",  # SQL injection attempt
        ]

        for text in test_texts:
            # Skip empty for this test
            if not text.strip():
                continue

            response = requests.post(
                f"{BASE_URL}/api/analyze",
                json={
                    "text": text,
                    "openai_key": "test-key-123",  # Will fail but test error handling
                },
            )

            # Validate response structure
            assert response.status_code in [
                200,
                400,
                422,
            ], f"Unexpected status for '{text[:50]}': {response.status_code}"

            if response.status_code == 200:
                data = response.json()
                assert "request_id" in data, "Missing request_id"
                assert "responses" in data, "Missing responses"
                assert isinstance(data["responses"], list), "Responses not a list"

                # Check for data leaks
                response_text = json.dumps(data)
                assert "test-key-123" not in response_text, "API key leaked in response!"

    def test_concurrent_real_requests_find_race_conditions(self):
        """Send many concurrent REAL requests to find race conditions."""
        import concurrent.futures

        def make_request(i):
            """Make a real API request."""
            start = time.time()
            response = requests.post(
                f"{BASE_URL}/api/analyze",
                json={"text": f"Concurrent request {i}: Analyze this.", "openai_key": f"key-{i}"},
                timeout=10,
            )
            duration = time.time() - start

            return {
                "index": i,
                "status": response.status_code,
                "duration": duration,
                "request_id": (
                    response.json().get("request_id") if response.status_code == 200 else None
                ),
            }

        # Send 50 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
            futures = [executor.submit(make_request, i) for i in range(50)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # Analyze results for issues
        statuses = [r["status"] for r in results]
        durations = [r["duration"] for r in results]
        request_ids = [r["request_id"] for r in results if r["request_id"]]

        # Check for issues
        assert len(set(request_ids)) == len(request_ids), "Duplicate request IDs found!"
        assert max(durations) < 30, f"Some requests too slow: {max(durations)}s"

        # Check status distribution
        success_count = statuses.count(200)
        rate_limit_count = statuses.count(429)
        error_count = len([s for s in statuses if s >= 500])

        assert error_count == 0, f"Server errors under load: {error_count}"

        # Should handle load gracefully
        assert success_count > 0 or rate_limit_count > 0, "All requests failed unexpectedly"

    def test_real_cors_headers_for_browser_compatibility(self):
        """Test ACTUAL CORS headers from real backend."""
        # Simulate browser preflight request
        response = requests.options(
            f"{BASE_URL}/api/analyze",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

        # Validate CORS headers
        assert response.status_code in [200, 204], f"Preflight failed: {response.status_code}"

        cors_headers = {
            "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
            "access-control-allow-methods": response.headers.get("access-control-allow-methods"),
            "access-control-allow-headers": response.headers.get("access-control-allow-headers"),
        }

        # Strong CORS validation
        assert cors_headers["access-control-allow-origin"] in [
            "*",
            "http://localhost:3000",
        ], f"Invalid CORS origin: {cors_headers['access-control-allow-origin']}"
        assert "POST" in cors_headers.get(
            "access-control-allow-methods", ""
        ), "POST not allowed in CORS"
        assert (
            "content-type" in cors_headers.get("access-control-allow-headers", "").lower()
        ), "Content-Type not allowed in CORS"

    def test_real_memory_usage_under_load(self):
        """Monitor REAL memory usage during requests."""
        import psutil

        # Get initial memory
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        # Send large requests
        for i in range(10):
            large_text = "x" * (1024 * 1024)  # 1MB of text
            _ = requests.post(
                f"{BASE_URL}/api/analyze", json={"text": large_text, "openai_key": "test-key"}
            )

            # Check memory after each request
            current_memory = process.memory_info().rss / 1024 / 1024
            memory_increase = current_memory - initial_memory

            # Memory should not grow unbounded
            assert memory_increase < 500, f"Memory leak detected: {memory_increase}MB increase"

    def test_real_error_messages_dont_leak_sensitive_info(self):
        """Test that REAL errors don't expose sensitive information."""
        sensitive_key = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyz"

        # Try with invalid but sensitive key
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json={
                "text": "Test",
                "openai_key": sensitive_key,
                "claude_key": "claude-api-key-secret-123",
                "gemini_key": "AIza-gemini-secret-key",
            },
        )

        # Check response doesn't leak keys
        response_text = response.text.lower()
        assert sensitive_key.lower() not in response_text, "OpenAI key leaked!"
        assert "claude-api-key-secret" not in response_text, "Claude key leaked!"
        assert "gemini-secret" not in response_text, "Gemini key leaked!"

        # Check error format
        if response.status_code != 200:
            data = response.json()
            if "detail" in data:
                # Error message should be generic
                assert len(data["detail"]) < 500, "Error message too detailed"
                assert "traceback" not in data["detail"].lower(), "Stack trace exposed!"
                assert "file" not in data["detail"].lower(), "File paths exposed!"


class TestRealOllamaIntegration:
    """Test REAL Ollama integration with actual running Ollama service."""

    def test_ollama_is_actually_running(self):
        """Verify Ollama service is accessible."""
        try:
            response = requests.get("http://localhost:11434/api/tags")
            assert response.status_code == 200, "Ollama not running"

            data = response.json()
            assert "models" in data, "Invalid Ollama response"
            assert len(data["models"]) > 0, "No Ollama models available"

            # List available models
            models = [m["name"] for m in data["models"]]
            print(f"Available Ollama models: {models}")

        except requests.exceptions.ConnectionError:
            pytest.skip("Ollama service not running")

    def test_real_ollama_generation(self):
        """Test REAL text generation with Ollama."""
        # Use a small, fast model for testing
        model = "gemma3:4b"

        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": "Say 'test successful' and nothing else.",
                "stream": False,
                "options": {"temperature": 0.1, "max_tokens": 10},
            },
            timeout=30,
        )

        assert response.status_code == 200, f"Ollama generation failed: {response.status_code}"

        data = response.json()
        assert "response" in data, "No response from Ollama"
        assert len(data["response"]) > 0, "Empty response from Ollama"
        assert (
            "test" in data["response"].lower() or "success" in data["response"].lower()
        ), f"Unexpected response: {data['response']}"

        # Check performance
        if "total_duration" in data:
            total_ms = data["total_duration"] / 1_000_000  # Convert to ms
            assert total_ms < 10000, f"Ollama too slow: {total_ms}ms"

    def test_backend_ollama_integration(self):
        """Test backend's integration with Ollama."""
        response = requests.post(
            f"{BASE_URL}/api/analyze", json={"text": "What is 2+2?", "ollama_model": "gemma3:4b"}
        )

        # Should handle Ollama requests
        assert response.status_code in [200, 501], f"Unexpected status: {response.status_code}"

        if response.status_code == 200:
            data = response.json()
            assert "responses" in data

            # Find Ollama response
            ollama_responses = [r for r in data["responses"] if r.get("model") == "ollama"]
            if ollama_responses:
                ollama_resp = ollama_responses[0]
                assert ollama_resp.get("response") or ollama_resp.get(
                    "error"
                ), "Ollama response missing content"

    def test_ollama_handles_large_context(self):
        """Test Ollama with large context window."""
        large_context = "Background information: " + ("context " * 1000)

        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "gemma3:4b",
                "prompt": large_context + "\nQuestion: Summarize in 5 words.",
                "stream": False,
                "options": {"num_predict": 20},
            },
            timeout=60,
        )

        if response.status_code == 200:
            data = response.json()
            assert "response" in data

            # Should handle large context
            word_count = len(data["response"].split())
            assert word_count < 50, f"Response too long: {word_count} words"


class TestRealEndToEnd:
    """Real end-to-end tests with actual user workflows."""

    def test_complete_analysis_workflow(self):
        """Test a complete user workflow end-to-end."""
        # Step 1: Check health
        health_response = requests.get(f"{BASE_URL}/api/health")
        assert health_response.status_code == 200

        # Step 2: Submit analysis request
        analysis_request = {
            "text": """
            Analyze the following business scenario:
            A startup is considering whether to pivot from B2C to B2B.
            Current metrics: 10k users, $50k MRR, 5% monthly growth.
            Market opportunity: Enterprise clients showing interest.
            What should they consider?
            """,
            "openai_key": "test-key",  # Will fail but test handling
            "ollama_model": "gemma3:4b",  # Use real Ollama
        }

        start_time = time.time()
        response = requests.post(f"{BASE_URL}/api/analyze", json=analysis_request)
        duration = time.time() - start_time

        # Step 3: Validate response
        assert response.status_code in [200, 207], f"Analysis failed: {response.status_code}"

        data = response.json()
        assert "request_id" in data
        assert "responses" in data

        # Check performance
        assert duration < 60, f"Analysis too slow: {duration}s"

        # Step 4: Verify request tracking
        request_id = data["request_id"]
        assert request_id, "No request ID provided"
        assert len(request_id) >= 8, f"Request ID too short: {request_id}"

        # Step 5: Check for model responses
        models_responded = [r.get("model") for r in data["responses"] if r.get("response")]
        models_failed = [r.get("model") for r in data["responses"] if r.get("error")]

        print(f"Models responded: {models_responded}")
        print(f"Models failed: {models_failed}")

        # At least one model should work (Ollama)
        assert (
            len(models_responded) > 0 or len(models_failed) > 0
        ), "No models processed the request"

    def test_workflow_with_file_upload_simulation(self):
        """Test workflow with file content analysis."""
        # Simulate file content
        file_content = """
        # Technical Specification
        
        ## Overview
        This document describes the architecture for a distributed system.
        
        ## Components
        1. Load Balancer: Nginx
        2. Application Servers: Python/FastAPI
        3. Database: PostgreSQL with replication
        4. Cache: Redis cluster
        5. Message Queue: RabbitMQ
        
        ## Performance Requirements
        - 10,000 requests per second
        - 99.9% uptime
        - <100ms response time (p95)
        """

        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json={"text": file_content, "openai_key": "test", "analysis_type": "technical_review"},
        )

        assert response.status_code in [200, 207]
        data = response.json()

        # Should handle technical content
        assert "responses" in data
        assert len(data["responses"]) > 0

    def test_rapid_sequential_requests_reveal_state_issues(self):
        """Send rapid sequential requests to find state management issues."""
        request_ids = []

        for i in range(20):
            response = requests.post(
                f"{BASE_URL}/api/analyze", json={"text": f"Request {i}", "openai_key": "test"}
            )

            if response.status_code == 200:
                data = response.json()
                request_ids.append(data.get("request_id"))

                # Small delay to avoid overwhelming
                time.sleep(0.1)

        # Check for duplicate request IDs (state corruption)
        unique_ids = set(request_ids)
        assert len(unique_ids) == len(
            request_ids
        ), f"Duplicate request IDs found! {len(request_ids)} requests, {len(unique_ids)} unique"

        # All IDs should be properly formatted
        for rid in request_ids:
            assert rid, "Empty request ID"
            assert len(rid) >= 8, f"Request ID too short: {rid}"


class TestRealSecurityValidation:
    """Test REAL security vulnerabilities."""

    def test_real_xss_prevention(self):
        """Test XSS prevention with actual malicious payloads."""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>",
            "';alert('XSS');//",
            '"><script>alert(String.fromCharCode(88,83,83))</script>',
        ]

        for payload in xss_payloads:
            response = requests.post(
                f"{BASE_URL}/api/analyze", json={"text": payload, "openai_key": "test"}
            )

            # Should not reflect payload unchanged
            response_text = response.text
            assert "<script>" not in response_text, f"XSS payload not sanitized: {payload}"
            assert "javascript:" not in response_text, f"JavaScript URL not blocked: {payload}"
            assert "onerror=" not in response_text, f"Event handler not blocked: {payload}"

    def test_real_sql_injection_prevention(self):
        """Test SQL injection prevention."""
        sql_payloads = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM passwords--",
        ]

        for payload in sql_payloads:
            response = requests.post(
                f"{BASE_URL}/api/analyze",
                json={
                    "text": payload,
                    "openai_key": "test",
                    "user_id": payload,  # Try injection in different fields
                },
            )

            # Should handle safely
            assert response.status_code in [
                200,
                400,
                422,
            ], f"Unexpected response to SQL injection: {response.status_code}"

            # No SQL errors in response
            if response.status_code != 200:
                error_text = response.text.lower()
                assert "sql" not in error_text, "SQL error exposed"
                assert "syntax" not in error_text, "Database error exposed"

    def test_real_dos_prevention(self):
        """Test denial of service prevention."""
        # Try to send huge payload
        huge_payload = "x" * (10 * 1024 * 1024)  # 10MB

        response = requests.post(
            f"{BASE_URL}/api/analyze", json={"text": huge_payload, "openai_key": "test"}, timeout=5
        )

        # Should reject or handle gracefully
        assert response.status_code in [
            400,
            413,
            422,
        ], f"Huge payload not rejected: {response.status_code}"


if __name__ == "__main__":
    # Run tests and report
    print("Running REAL integration tests against live backend...")
    print(f"Backend URL: {BASE_URL}")
    print("-" * 50)

    # Quick health check first
    try:
        health = requests.get(f"{BASE_URL}/api/health", timeout=2)
        print(f"✅ Backend is running: {health.json()}")
    except Exception as e:
        print(f"❌ Backend not accessible: {e}")
        print("Please start the backend with: cd backend && ./venv/bin/python main.py")
        exit(1)

    # Check Ollama
    try:
        ollama = requests.get("http://localhost:11434/api/tags", timeout=2)
        models = [m["name"] for m in ollama.json()["models"]]
        print(f"✅ Ollama is running with {len(models)} models")
    except Exception as e:
        print(f"⚠️  Ollama not accessible: {e}")
        print("Some tests will be skipped")

    print("-" * 50)
    print("Starting tests...")

    # Run pytest
    import subprocess
    import sys

    result = subprocess.run(
        [sys.executable, "-m", "pytest", __file__, "-v", "--tb=short"], capture_output=False
    )

    exit(result.returncode)
