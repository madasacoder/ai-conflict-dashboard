"""Strong assertion helpers for test suite.

This module provides comprehensive assertion functions that validate
actual business value rather than just checking for non-null values.
"""

from typing import Any

VALID_MODELS = {
    "openai": ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
    "claude": ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    "gemini": ["gemini-pro", "gemini-pro-vision"],
    "grok": ["grok-1", "grok-2"],
    "ollama": ["llama2", "codellama", "mistral", "gemma"],
}


def assert_valid_llm_response(response: dict[str, Any], provider: str | None = None) -> None:
    """Strong assertions for LLM responses.

    Args:
        response: The LLM response dictionary
        provider: Optional provider name for model validation

    Raises:
        AssertionError: If any validation fails

    """
    # Basic structure validation
    assert response is not None, "Response should not be None"
    assert isinstance(response, dict), f"Response should be dict, got {type(response)}"

    # Model validation
    assert "model" in response, "Response missing 'model' field"
    assert response["model"], "Model field should not be empty"

    if provider and provider in VALID_MODELS:
        assert (
            response["model"] in VALID_MODELS[provider]
        ), f"Invalid model {response['model']} for provider {provider}"

    # Response content validation
    assert "response" in response, "Response missing 'response' field"
    assert isinstance(response["response"], str), "Response should be a string"
    assert len(response["response"]) > 0, "Response should not be empty"
    assert not response["response"].isspace(), "Response should not be just whitespace"

    # Token validation
    assert "tokens" in response, "Response missing 'tokens' field"
    assert isinstance(response["tokens"], dict), "Tokens should be a dictionary"

    assert "total" in response["tokens"], "Tokens missing 'total' field"
    assert response["tokens"]["total"] > 0, "Total tokens should be positive"

    assert "prompt" in response["tokens"], "Tokens missing 'prompt' field"
    assert response["tokens"]["prompt"] >= 0, "Prompt tokens should be non-negative"

    assert "completion" in response["tokens"], "Tokens missing 'completion' field"
    assert response["tokens"]["completion"] > 0, "Completion tokens should be positive"

    # Token math validation
    expected_total = response["tokens"]["prompt"] + response["tokens"]["completion"]
    assert (
        response["tokens"]["total"] == expected_total
    ), f"Token math doesn't add up: {response['tokens']['total']} != {expected_total}"

    # Cost validation if present
    if "cost" in response:
        assert isinstance(response["cost"], int | float), "Cost should be numeric"
        assert response["cost"] >= 0, "Cost should be non-negative"
        assert response["cost"] < 100, "Cost seems unreasonably high (>$100)"


def assert_conflict_detection(responses: list[dict], expected_conflicts: int | None = None) -> dict:
    """Validate conflict detection in multiple AI responses.

    Args:
        responses: List of AI model responses
        expected_conflicts: Optional expected number of conflicts

    Returns:
        Dict containing detected conflicts

    Raises:
        AssertionError: If validation fails

    """
    assert len(responses) >= 2, "Need at least 2 responses to detect conflicts"

    # This would call the actual conflict detection logic
    conflicts = detect_conflicts(responses)

    assert "conflicts" in conflicts, "Missing conflicts field"
    assert isinstance(conflicts["conflicts"], list), "Conflicts should be a list"

    if expected_conflicts is not None:
        assert (
            len(conflicts["conflicts"]) == expected_conflicts
        ), f"Expected {expected_conflicts} conflicts, found {len(conflicts['conflicts'])}"

    # Validate each conflict
    for conflict in conflicts["conflicts"]:
        assert "type" in conflict, "Conflict missing type"
        assert conflict["type"] in [
            "opposite_recommendation",
            "factual_disagreement",
            "confidence_mismatch",
            "tone_difference",
        ], f"Invalid conflict type: {conflict['type']}"

        assert "severity" in conflict, "Conflict missing severity"
        assert conflict["severity"] in [
            "low",
            "medium",
            "high",
        ], f"Invalid severity: {conflict['severity']}"

        assert "models" in conflict, "Conflict missing models list"
        assert len(conflict["models"]) >= 2, "Conflict should involve at least 2 models"

    return conflicts


def detect_conflicts(responses: list[dict]) -> dict:
    """Detect conflicts between AI responses.

    This is a placeholder for the actual business logic.
    In production, this would analyze semantic differences.
    """
    conflicts = []

    # Simple conflict detection based on response content
    for i, resp1 in enumerate(responses):
        for resp2 in responses[i + 1 :]:
            if not resp1.get("response") or not resp2.get("response"):
                continue

            text1 = resp1["response"].lower()
            text2 = resp2["response"].lower()

            # Check for opposite recommendations
            if ("buy" in text1 and "sell" in text2) or ("sell" in text1 and "buy" in text2):
                conflicts.append(
                    {
                        "type": "opposite_recommendation",
                        "severity": "high",
                        "models": [resp1.get("model", "unknown"), resp2.get("model", "unknown")],
                        "details": "Models gave opposite buy/sell recommendations",
                    }
                )

            # Check for yes/no disagreements
            if ("yes" in text1 and "no" in text2) or ("no" in text1 and "yes" in text2):
                conflicts.append(
                    {
                        "type": "factual_disagreement",
                        "severity": "medium",
                        "models": [resp1.get("model", "unknown"), resp2.get("model", "unknown")],
                        "details": "Models disagree on yes/no answer",
                    }
                )

    return {"conflicts": conflicts, "total_responses": len(responses)}


def assert_circuit_breaker_state(breaker_state: dict, expected_state: str) -> None:
    """Validate circuit breaker state and behavior.

    Args:
        breaker_state: Current breaker state dictionary
        expected_state: Expected state ('closed', 'open', 'half_open')

    """
    assert "state" in breaker_state, "Missing breaker state"
    assert (
        breaker_state["state"] == expected_state
    ), f"Expected breaker state {expected_state}, got {breaker_state['state']}"

    assert "fail_count" in breaker_state, "Missing fail count"
    assert isinstance(breaker_state["fail_count"], int), "Fail count should be integer"
    assert breaker_state["fail_count"] >= 0, "Fail count should be non-negative"

    if expected_state == "open":
        assert breaker_state["fail_count"] >= 5, "Breaker should open after 5 failures"
        assert "reset_timeout" in breaker_state, "Open breaker missing reset timeout"

    if expected_state == "closed":
        assert breaker_state["fail_count"] < 5, "Breaker should be closed with less than 5 failures"


def assert_rate_limit_response(response: dict, expected_limited: bool = False) -> None:
    """Validate rate limiting behavior.

    Args:
        response: API response dictionary
        expected_limited: Whether we expect to be rate limited

    """
    if expected_limited:
        assert (
            response.get("status_code") == 429
        ), f"Expected 429 rate limit, got {response.get('status_code')}"
        assert "detail" in response, "Rate limit response missing detail"
        assert "rate limit" in response["detail"].lower(), "Rate limit message not clear"
        assert "retry_after" in response, "Missing retry_after header"
    else:
        assert response.get("status_code") != 429, "Should not be rate limited"


def assert_chunking_valid(chunk_info: dict, text_length: int) -> None:
    """Validate text chunking logic.

    Args:
        chunk_info: Chunking metadata
        text_length: Original text length

    """
    assert "total_chunks" in chunk_info, "Missing total_chunks"
    assert chunk_info["total_chunks"] > 0, "Should have at least one chunk"

    assert "current_chunk" in chunk_info, "Missing current_chunk"
    assert (
        1 <= chunk_info["current_chunk"] <= chunk_info["total_chunks"]
    ), "Current chunk out of range"

    assert "chunk_tokens" in chunk_info, "Missing chunk_tokens"
    assert 0 < chunk_info["chunk_tokens"] <= 8000, "Chunk tokens should be between 1 and 8000"

    # Rough validation that chunking makes sense
    if text_length > 20000:
        assert chunk_info["total_chunks"] > 1, "Large text should be split into multiple chunks"


def assert_security_headers(headers: dict) -> None:
    """Validate security headers are present and correct.

    Args:
        headers: Response headers dictionary

    """
    # CORS headers
    assert "access-control-allow-origin" in headers, "Missing CORS origin header"
    assert (
        headers["access-control-allow-origin"] != "*"
    ), "CORS should not allow all origins in production"

    # Security headers
    assert "x-content-type-options" in headers, "Missing X-Content-Type-Options"
    assert (
        headers["x-content-type-options"] == "nosniff"
    ), "X-Content-Type-Options should be nosniff"

    assert "x-frame-options" in headers, "Missing X-Frame-Options"
    assert headers["x-frame-options"] in [
        "DENY",
        "SAMEORIGIN",
    ], "X-Frame-Options should be DENY or SAMEORIGIN"

    # Request tracking
    assert "x-request-id" in headers, "Missing X-Request-ID for tracking"
    assert len(headers["x-request-id"]) >= 8, "Request ID too short"


def assert_api_error_format(error: dict) -> None:
    """Validate API error response format.

    Args:
        error: Error response dictionary

    """
    assert "detail" in error, "Error missing 'detail' field"
    assert isinstance(error["detail"], str), "Error detail should be string"
    assert len(error["detail"]) > 0, "Error detail should not be empty"

    # Should not expose sensitive info
    assert "api_key" not in error["detail"].lower(), "Error should not expose API keys"
    assert "password" not in error["detail"].lower(), "Error should not expose passwords"
    assert "traceback" not in error["detail"].lower(), "Error should not expose stack traces"

    if "status_code" in error:
        assert 400 <= error["status_code"] < 600, "Error status code should be 4xx or 5xx"

    if "request_id" in error:
        assert len(error["request_id"]) >= 8, "Request ID should be meaningful"
