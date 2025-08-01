"""
Structured logging configuration using structlog.
Provides consistent, machine-readable logs with context preservation.
"""

import logging
import sys
from datetime import datetime, timezone
import structlog
from structlog.processors import CallsiteParameter


def add_timestamp(_, __, event_dict):
    """Add ISO format timestamp to log entries."""
    event_dict["timestamp"] = datetime.now(timezone.utc).isoformat()
    return event_dict


def setup_structured_logging(level="INFO", log_file="app.log"):
    """
    Configure structlog for structured logging.

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

    # Configure structlog
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
            # Format stack traces
            structlog.processors.format_exc_info,
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
    )

    json_formatter = structlog.stdlib.ProcessorFormatter(
        processor=structlog.processors.JSONRenderer(),
    )

    # Apply formatters to handlers
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)

    json_handler.setFormatter(json_formatter)

    # Update root logger handlers
    root_logger = logging.getLogger()
    root_logger.handlers = [console_handler, json_handler]

    # Reduce noise from libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("aiohttp").setLevel(logging.WARNING)

    return structlog.get_logger()


def get_logger(name=None, **context):
    """
    Get a structured logger with optional context.

    Args:
        name: Logger name (module name)
        **context: Additional context to bind to all logs from this logger

    Returns:
        Bound structlog logger
    """
    logger = structlog.get_logger(name)

    if context:
        logger = logger.bind(**context)

    return logger


# Request ID context manager for tracking requests
class RequestContext:
    """Context manager for adding request ID to all logs within a request."""

    def __init__(self, request_id):
        self.request_id = request_id
        self.token = None

    def __enter__(self):
        self.token = structlog.contextvars.bind_contextvars(request_id=self.request_id)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        structlog.contextvars.unbind_contextvars("request_id")
        return False


# Example usage functions
def log_api_request(logger, method, path, **kwargs):
    """Log API request with structured data."""
    logger.info("api_request", method=method, path=path, **kwargs)


def log_api_response(logger, status_code, duration_ms, **kwargs):
    """Log API response with structured data."""
    logger.info(
        "api_response", status_code=status_code, duration_ms=duration_ms, **kwargs
    )


def log_llm_call(logger, provider, model, tokens, duration_ms, success=True, **kwargs):
    """Log LLM API call with structured data."""
    logger.info(
        "llm_call",
        provider=provider,
        model=model,
        tokens=tokens,
        duration_ms=duration_ms,
        success=success,
        **kwargs
    )


def log_circuit_breaker_event(logger, breaker_name, state, **kwargs):
    """Log circuit breaker state change."""
    logger.warning("circuit_breaker", breaker_name=breaker_name, state=state, **kwargs)
