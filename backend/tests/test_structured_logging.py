"""Tests for structured logging module."""

from unittest.mock import MagicMock, patch

from structured_logging import (
    RequestContext,
    add_timestamp,
    get_logger,
    log_api_request,
    log_api_response,
    log_circuit_breaker_event,
    log_llm_call,
    setup_structured_logging,
)


class TestStructuredLogging:
    """Test structured logging setup and utilities."""

    def test_add_timestamp(self):
        """Test that timestamp is added to log entries."""
        event_dict = {}
        result = add_timestamp(None, None, event_dict)
        assert "timestamp" in result
        assert result["timestamp"].endswith("+00:00")  # ISO format with UTC offset

    def test_setup_structured_logging(self, tmp_path):
        """Test structured logging setup."""
        log_file = tmp_path / "test.log"
        logger = setup_structured_logging("DEBUG", str(log_file))

        assert logger is not None
        assert log_file.exists()

    def test_get_logger_with_context(self):
        """Test getting logger with context."""
        logger = get_logger("test_module", user_id="123", request_id="abc")

        # Logger should be bound with context
        assert logger is not None

    def test_request_context(self):
        """Test RequestContext context manager."""
        with (
            patch("structlog.contextvars.bind_contextvars") as mock_bind,
            patch("structlog.contextvars.unbind_contextvars") as mock_unbind,
        ):
            with RequestContext("test-request-id"):
                mock_bind.assert_called_once_with(request_id="test-request-id")

            mock_unbind.assert_called_once_with("request_id")

    def test_log_api_request(self):
        """Test API request logging."""
        mock_logger = MagicMock()

        log_api_request(
            mock_logger,
            method="POST",
            path="/api/test",
            user_id="123",
            extra_field="value",
        )

        mock_logger.info.assert_called_once_with(
            "api_request",
            method="POST",
            path="/api/test",
            user_id="123",
            extra_field="value",
        )

    def test_log_api_response(self):
        """Test API response logging."""
        mock_logger = MagicMock()

        log_api_response(mock_logger, status_code=200, duration_ms=150.5, response_size=1024)

        mock_logger.info.assert_called_once_with(
            "api_response", status_code=200, duration_ms=150.5, response_size=1024
        )

    def test_log_llm_call_success(self):
        """Test successful LLM call logging."""
        mock_logger = MagicMock()

        log_llm_call(
            mock_logger,
            provider="openai",
            model="gpt-4",
            tokens=500,
            duration_ms=2000.5,
            success=True,
        )

        mock_logger.info.assert_called_once_with(
            "llm_call",
            provider="openai",
            model="gpt-4",
            tokens=500,
            duration_ms=2000.5,
            success=True,
        )

    def test_log_llm_call_failure(self):
        """Test failed LLM call logging."""
        mock_logger = MagicMock()

        log_llm_call(
            mock_logger,
            provider="claude",
            model="claude-3-opus",
            tokens=1000,
            duration_ms=500.2,
            success=False,
            error_code=429,
            error_message="Rate limit exceeded",
        )

        mock_logger.info.assert_called_once_with(
            "llm_call",
            provider="claude",
            model="claude-3-opus",
            tokens=1000,
            duration_ms=500.2,
            success=False,
            error_code=429,
            error_message="Rate limit exceeded",
        )

    def test_log_circuit_breaker_event(self):
        """Test circuit breaker event logging."""
        mock_logger = MagicMock()

        log_circuit_breaker_event(
            mock_logger, breaker_name="OpenAI API", state="open", fail_count=5
        )

        mock_logger.warning.assert_called_once_with(
            "circuit_breaker", breaker_name="OpenAI API", state="open", fail_count=5
        )
