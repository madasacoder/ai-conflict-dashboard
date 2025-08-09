"""Fixed structured logging configuration with API key sanitization.

This module provides structured logging with automatic detection and
masking of sensitive information like API keys in log messages.
"""

import logging
import re
import sys
from datetime import UTC, datetime
from re import Pattern
from typing import Any

import structlog
from structlog.processors import CallsiteParameter
from structlog.types import EventDict, WrappedLogger

# Patterns for sensitive data that should be masked
SENSITIVE_PATTERNS: dict[str, Pattern] = {
    "openai_key": re.compile(
        r"(sk-(?!proj-|ant-)[a-zA-Z0-9]{4,})"
    ),  # OpenAI keys, excluding sk-proj and sk-ant
    "anthropic_key": re.compile(r"(sk-ant-[a-zA-Z0-9-]{4,})"),  # More flexible length
    "generic_api_key": re.compile(
        r'(api[_-]?key["\s:=]+)(["\']?)([a-zA-Z0-9-_]{20,})(["\']?)', re.IGNORECASE
    ),
    "bearer_token": re.compile(r"(bearer\s+)([a-zA-Z0-9-._~+/]{20,})", re.IGNORECASE),
    "aws_access_key": re.compile(r"(AKIA[A-Z0-9]{16})"),
    "gemini_key": re.compile(r"(AIza[a-zA-Z0-9-_]{35})"),
    "password": re.compile(r'(password["\s:=]+)(["\']?)([^"\s]+)(["\']?)', re.IGNORECASE),
    "sk_proj_key": re.compile(r"(sk-proj-[a-zA-Z0-9-]{4,})"),  # sk-proj- pattern with hyphens
}


def sanitize_value(value: Any) -> Any:
    """Recursively sanitize sensitive data in a value.

    Args:
        value: The value to sanitize (can be str, dict, list, etc.)

    Returns:
        Sanitized value with sensitive data masked

    """
    if isinstance(value, str):
        # Apply all sensitive patterns
        sanitized = value

        # Direct pattern replacements
        for pattern_name, pattern in SENSITIVE_PATTERNS.items():
            if pattern_name in ["generic_api_key", "password"]:
                # Special handling for patterns with groups
                sanitized = pattern.sub(r"\1\2***\4", sanitized)
            elif pattern_name == "bearer_token":
                sanitized = pattern.sub(r"\1***", sanitized)
            else:
                # Simple replacement
                sanitized = pattern.sub(r"***REDACTED***", sanitized)

        return sanitized

    elif isinstance(value, dict):
        # Recursively sanitize dictionary values
        return {k: sanitize_value(v) for k, v in value.items()}

    elif isinstance(value, list):
        # Recursively sanitize list items
        return [sanitize_value(item) for item in value]

    elif isinstance(value, tuple):
        # Recursively sanitize tuple items
        return tuple(sanitize_value(item) for item in value)

    else:
        # Return other types as-is
        return value


def sanitize_sensitive_data(text: str) -> str:
    """Sanitize sensitive data in text for safe logging.

    This is a convenience function that sanitizes API keys and other
    sensitive information in text strings.

    Args:
        text: The text to sanitize

    Returns:
        Text with sensitive data replaced with ***

    """
    return sanitize_value(text)


def sanitize_event_dict(_: WrappedLogger, __: str, event_dict: EventDict) -> EventDict:
    """Processor to sanitize sensitive data in log events.

    Args:
        _: Logger (unused)
        __: Method name (unused)
        event_dict: The log event dictionary

    Returns:
        Sanitized event dictionary

    """
    # Sanitize the entire event dict
    return sanitize_value(event_dict)


def add_timestamp(_: WrappedLogger, __: str, event_dict: EventDict) -> EventDict:
    """Add ISO format timestamp to log entries."""
    event_dict["timestamp"] = datetime.now(UTC).isoformat()
    return event_dict


def setup_structured_logging(level: str = "INFO", log_file: str = "app.log") -> WrappedLogger:
    """Configure structlog for structured logging.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR)
        log_file: Path to log file for JSON output

    Returns:
        Configured structlog logger

    """
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s", stream=sys.stdout, level=getattr(logging, level.upper())
    )

    # Create file handler for JSON logs
    json_handler = logging.FileHandler(log_file)
    json_handler.setLevel(logging.DEBUG)

    # Add handler to root logger
    logging.getLogger().addHandler(json_handler)

    # Configure structlog with sanitization
    structlog.configure(
        processors=[
            # Add log level
            structlog.stdlib.add_log_level,
            # Add logger name
            structlog.stdlib.add_logger_name,
            # Add timestamp
            add_timestamp,
            # Add call site parameters
            structlog.processors.CallsiteParameterAdder(
                parameters=[
                    CallsiteParameter.FILENAME,
                    CallsiteParameter.FUNC_NAME,
                    CallsiteParameter.LINENO,
                ]
            ),
            # IMPORTANT: Sanitize sensitive data before any output
            sanitize_event_dict,
            # Render to JSON for file output, console for stdout
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.dict_tracebacks,
            # Use different renderers for console vs file
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Configure different formatters for console and file
    console_formatter = structlog.stdlib.ProcessorFormatter(
        processor=structlog.dev.ConsoleRenderer(colors=True),
        foreign_pre_chain=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.set_exc_info,
        ],
    )

    json_formatter = structlog.stdlib.ProcessorFormatter(
        processor=structlog.processors.JSONRenderer(),
        foreign_pre_chain=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.set_exc_info,
        ],
    )

    # Apply formatters to handlers
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)

    json_handler.setFormatter(json_formatter)

    # Update root logger handlers
    root_logger = logging.getLogger()
    # Close existing handlers to prevent resource warnings
    for handler in root_logger.handlers[:]:
        handler.close()
        root_logger.removeHandler(handler)
    # Add new handlers
    root_logger.addHandler(console_handler)
    root_logger.addHandler(json_handler)

    # Reduce noise from libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("aiohttp").setLevel(logging.WARNING)

    return structlog.get_logger()


def get_logger(name: str | None = None, **context: Any) -> WrappedLogger:
    """Get a structured logger with optional context.

    Args:
        name: Logger name (module name)
        **context: Additional context to bind to all logs from this logger

    Returns:
        Bound structlog logger

    """
    logger = structlog.get_logger(name)

    if context:
        # Sanitize context before binding
        sanitized_context = sanitize_value(context)
        logger = logger.bind(**sanitized_context)

    return logger


# Request ID context manager for tracking requests
class RequestContext:
    """Context manager for adding request ID to all logs within a request."""

    def __init__(self, request_id: str):
        self.request_id = request_id
        self.token: structlog.contextvars.Token | None = None

    def __enter__(self) -> "RequestContext":
        self.token = structlog.contextvars.bind_contextvars(request_id=self.request_id)
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> bool:
        structlog.contextvars.unbind_contextvars("request_id")
        return False


# Example usage functions with built-in sanitization
def log_api_request(logger: WrappedLogger, method: str, path: str, **kwargs: Any) -> None:
    """Log API request with structured data (sanitized)."""
    # Note: sanitization happens automatically via processor
    logger.info("api_request", method=method, path=path, **kwargs)


def log_api_response(
    logger: WrappedLogger, status_code: int, duration_ms: float, **kwargs: Any
) -> None:
    """Log API response with structured data (sanitized)."""
    logger.info("api_response", status_code=status_code, duration_ms=duration_ms, **kwargs)


def log_llm_call(
    logger: WrappedLogger,
    provider: str,
    model: str,
    tokens: int,
    duration_ms: float,
    success: bool = True,
    **kwargs: Any,
) -> None:
    """Log LLM API call with structured data (sanitized)."""
    logger.info(
        "llm_call",
        provider=provider,
        model=model,
        tokens=tokens,
        duration_ms=duration_ms,
        success=success,
        **kwargs,
    )


def log_circuit_breaker_event(
    logger: WrappedLogger, breaker_name: str, state: str, **kwargs: Any
) -> None:
    """Log circuit breaker state change (sanitized)."""
    logger.warning("circuit_breaker", breaker_name=breaker_name, state=state, **kwargs)


if __name__ == "__main__":
    # Test the sanitization
    setup_structured_logging(level="DEBUG")
    logger = get_logger(__name__)

    # Test various sensitive data patterns
    test_cases = [
        {"message": "User provided API key sk-1234567890abcdef1234567890abcdef1234567890abcdef"},
        {"api_key": "sk-ant-1234567890abcdef1234567890abcdef1234567890abcdef-12"},
        {"config": {"openai_key": "sk-1234567890abcdef1234567890abcdef1234567890abcdef"}},
        {
            "auth": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
        },
        {"text": "Password: mysecretpass123"},
        {"gemini": "API_KEY=AIzaSyDrFooBarBaz1234567890-1234567890"},
    ]

    for test in test_cases:
        logger.info("Testing sanitization", **test)
