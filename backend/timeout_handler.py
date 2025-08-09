"""Request timeout handling module for the AI Conflict Dashboard.

This module provides:
1. Configurable timeouts for different operations
2. Graceful timeout handling with retries
3. Timeout monitoring and reporting
4. Adaptive timeout adjustment based on response times
"""

import asyncio
import builtins
import time
from collections.abc import Callable, Coroutine
from functools import wraps
from statistics import mean, stdev
from typing import Any, TypeVar

import structlog

logger = structlog.get_logger(__name__)

# Type variable for generic return type
T = TypeVar("T")

# Default timeout configurations (in seconds)
TIMEOUT_CONFIG = {
    "api_call": 30,  # Individual API calls
    "total_request": 120,  # Total request processing
    "file_upload": 60,  # File upload operations
    "health_check": 5,  # Health check endpoints
    "default": 30,  # Default timeout
}

# Retry configuration
RETRY_CONFIG = {
    "max_attempts": 3,
    "base_delay": 1,  # Base delay in seconds
    "max_delay": 10,  # Maximum delay between retries
    "exponential_backoff": True,
}


# Track response times for adaptive timeouts
class ResponseTimeTracker:
    """Track response times to adaptively adjust timeouts."""

    def __init__(self, window_size: int = 100):
        self.window_size = window_size
        self.response_times: dict[str, list[float]] = {}

    def record(self, operation: str, duration: float) -> None:
        """Record a response time for an operation."""
        if operation not in self.response_times:
            self.response_times[operation] = []

        times = self.response_times[operation]
        times.append(duration)

        # Keep only the last window_size entries
        if len(times) > self.window_size:
            self.response_times[operation] = times[-self.window_size :]

    def get_recommended_timeout(self, operation: str, confidence: float = 3.0) -> float:
        """Get recommended timeout based on historical data.

        Args:
            operation: The operation name
            confidence: Number of standard deviations to add (default 3.0)

        Returns:
            Recommended timeout in seconds

        """
        if operation not in self.response_times or len(self.response_times[operation]) < 5:
            # Not enough data, use default
            return TIMEOUT_CONFIG.get(operation, TIMEOUT_CONFIG["default"])

        times = self.response_times[operation]
        avg_time = mean(times)

        # Calculate standard deviation if we have enough samples
        if len(times) >= 10:
            std_time = stdev(times)
            recommended = avg_time + (confidence * std_time)
        else:
            # Use a simple multiplier if not enough samples
            recommended = avg_time * 2

        # Ensure minimum timeout
        min_timeout = TIMEOUT_CONFIG.get(operation, TIMEOUT_CONFIG["default"]) * 0.5
        recommended = max(recommended, min_timeout)

        # Cap at 2x the configured timeout
        max_timeout = TIMEOUT_CONFIG.get(operation, TIMEOUT_CONFIG["default"]) * 2
        recommended = min(recommended, max_timeout)

        logger.debug(
            "Calculated adaptive timeout",
            operation=operation,
            avg_time=round(avg_time, 2),
            recommended=round(recommended, 2),
            samples=len(times),
        )

        return recommended


# Global response time tracker
response_tracker = ResponseTimeTracker()


class TimeoutError(Exception):
    """Custom timeout exception with context."""

    def __init__(self, message: str, operation: str, timeout: float, elapsed: float):
        super().__init__(message)
        self.operation = operation
        self.timeout = timeout
        self.elapsed = elapsed


async def with_timeout(
    coro: Coroutine[Any, Any, T],
    timeout: float,
    operation: str = "unknown",
    raise_on_timeout: bool = True,
) -> T | None:
    """Execute a coroutine with timeout.

    Args:
        coro: The coroutine to execute
        timeout: Timeout in seconds
        operation: Operation name for logging
        raise_on_timeout: Whether to raise exception on timeout

    Returns:
        The result of the coroutine or None if timeout

    Raises:
        TimeoutError: If raise_on_timeout is True and operation times out

    """
    start_time = time.time()

    try:
        result = await asyncio.wait_for(coro, timeout=timeout)

        # Record successful response time
        elapsed = time.time() - start_time
        response_tracker.record(operation, elapsed)

        logger.debug(
            "Operation completed within timeout",
            operation=operation,
            elapsed=round(elapsed, 2),
            timeout=timeout,
        )

        return result

    except builtins.TimeoutError:
        elapsed = time.time() - start_time

        logger.warning(
            "Operation timed out",
            operation=operation,
            timeout=timeout,
            elapsed=round(elapsed, 2),
        )

        if raise_on_timeout:
            raise TimeoutError(
                f"Operation '{operation}' timed out after {elapsed:.2f}s",
                operation=operation,
                timeout=timeout,
                elapsed=elapsed,
            ) from None

        return None


async def with_retry(
    coro_func: Callable[[], Coroutine[Any, Any, T]],
    operation: str = "unknown",
    timeout: float | None = None,
    max_attempts: int | None = None,
    base_delay: float | None = None,
    max_delay: float | None = None,
    exponential_backoff: bool | None = None,
) -> T:
    """Execute a coroutine with timeout and retry logic.

    Args:
        coro_func: Function that returns a coroutine (called fresh each retry)
        operation: Operation name for logging
        timeout: Timeout per attempt (uses adaptive if None)
        max_attempts: Maximum retry attempts
        base_delay: Base delay between retries
        max_delay: Maximum delay between retries
        exponential_backoff: Whether to use exponential backoff

    Returns:
        The result of the coroutine

    Raises:
        TimeoutError: If all attempts timeout
        Exception: If all attempts fail with other errors

    """
    # Use defaults from config if not specified
    _max_attempts = max_attempts or RETRY_CONFIG["max_attempts"]
    _base_delay = base_delay or RETRY_CONFIG["base_delay"]
    _max_delay = max_delay or RETRY_CONFIG["max_delay"]
    _exponential_backoff = (
        exponential_backoff
        if exponential_backoff is not None
        else RETRY_CONFIG["exponential_backoff"]
    )

    # Use adaptive timeout if not specified
    _timeout = timeout or response_tracker.get_recommended_timeout(operation)

    last_error: Exception | None = None
    total_elapsed = 0.0
    start_time = time.time()

    for attempt in range(_max_attempts):
        try:
            logger.debug(
                "Attempting operation",
                operation=operation,
                attempt=attempt + 1,
                max_attempts=_max_attempts,
                timeout=round(_timeout, 2),
            )

            # Create fresh coroutine for each attempt
            coro = coro_func()

            # Execute with timeout
            result = await with_timeout(
                coro, timeout=_timeout, operation=operation, raise_on_timeout=True
            )

            # Success!
            total_elapsed = time.time() - start_time
            logger.info(
                "Operation succeeded with retry",
                operation=operation,
                attempt=attempt + 1,
                total_elapsed=round(total_elapsed, 2),
            )

            return result

        except TimeoutError as e:
            last_error = e

            if attempt < _max_attempts - 1:
                # Calculate retry delay
                if _exponential_backoff:
                    delay = min(_base_delay * (2**attempt), _max_delay)
                else:
                    delay = _base_delay

                logger.warning(
                    "Operation failed, retrying",
                    operation=operation,
                    attempt=attempt + 1,
                    delay=round(delay, 2),
                    error=str(e),
                )

                await asyncio.sleep(delay)
            else:
                # Final attempt failed
                total_elapsed = time.time() - start_time
                logger.error(
                    "Operation failed after all retries",
                    operation=operation,
                    attempts=_max_attempts,
                    total_elapsed=round(total_elapsed, 2),
                    error=str(e),
                )

        except Exception as e:
            # Non-timeout error
            logger.error(
                "Operation failed with error",
                operation=operation,
                attempt=attempt + 1,
                error=str(e),
                error_type=type(e).__name__,
            )

            # Don't retry on non-timeout errors by default
            raise

    # All attempts failed
    if isinstance(last_error, TimeoutError):
        raise last_error
    else:
        raise TimeoutError(
            f"Operation '{operation}' failed after {_max_attempts} attempts",
            operation=operation,
            timeout=_timeout,
            elapsed=total_elapsed,
        )


def timeout_handler(
    operation: str | None = None,
    timeout: float | None = None,
    retry: bool = True,
    **retry_kwargs: Any,
) -> Callable[[Callable[..., Coroutine[Any, Any, T]]], Callable[..., Coroutine[Any, Any, T]]]:
    """Decorator for adding timeout and retry logic to async functions.

    Args:
        operation: Operation name (uses function name if None)
        timeout: Timeout in seconds (uses adaptive if None)
        retry: Whether to retry on timeout
        **retry_kwargs: Additional arguments for retry logic

    Returns:
        Decorated function

    """

    def decorator(
        func: Callable[..., Coroutine[Any, Any, T]],
    ) -> Callable[..., Coroutine[Any, Any, T]]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            op_name = operation or func.__name__

            if retry:
                # Use retry logic
                return await with_retry(
                    lambda: func(*args, **kwargs),
                    operation=op_name,
                    timeout=timeout,
                    **retry_kwargs,
                )
            else:
                # Just timeout, no retry
                timeout_val = timeout or response_tracker.get_recommended_timeout(op_name)
                result = await with_timeout(
                    func(*args, **kwargs),
                    timeout=timeout_val,
                    operation=op_name,
                    raise_on_timeout=True,
                )
                if result is None:
                    raise TimeoutError("Operation timed out", op_name, timeout_val, timeout_val)
                return result

        return wrapper

    return decorator


# Monitoring functions
def get_timeout_stats() -> dict[str, Any]:
    """Get timeout statistics for monitoring."""
    stats: dict[str, Any] = {}

    for operation, times in response_tracker.response_times.items():
        if times:
            stats[operation] = {
                "samples": len(times),
                "min": round(min(times), 2),
                "max": round(max(times), 2),
                "avg": round(mean(times), 2),
                "recommended_timeout": round(
                    response_tracker.get_recommended_timeout(operation), 2
                ),
            }

            if len(times) >= 10:
                stats[operation]["stddev"] = round(stdev(times), 2)

    return {
        "operations": stats,
        "config": TIMEOUT_CONFIG,
        "retry_config": RETRY_CONFIG,
    }


# Example usage
if __name__ == "__main__":

    async def slow_operation() -> str:
        """Simulate a slow operation."""
        await asyncio.sleep(2)
        return "Success!"

    async def flaky_operation() -> str:
        """Simulate a flaky operation that sometimes times out."""
        import random

        delay = random.uniform(0.5, 3.5)
        await asyncio.sleep(delay)
        return f"Completed in {delay:.2f}s"

    @timeout_handler(operation="test_decorated", timeout=2.0, retry=True)
    async def decorated_operation() -> str:
        """Decorated async function with timeout."""
        await asyncio.sleep(1.5)
        return "Decorated success!"

    async def test() -> None:
        # Test basic timeout
        try:
            result = await with_timeout(slow_operation(), timeout=1.0, operation="slow_op")
            logger.info("Timeout test result", result=result)
        except TimeoutError as e:
            logger.info("Timeout occurred", error=str(e))

        # Test with retry
        try:
            result = await with_retry(
                flaky_operation, operation="flaky_op", timeout=2.0, max_attempts=3
            )
            logger.info("Retry test result", result=result)
        except TimeoutError as e:
            logger.info("Retry test failed", error=str(e))

        # Test decorated function
        result = await decorated_operation()
        logger.info("Decorated test result", result=result)

        # Show stats
        logger.info("Timeout stats", stats=get_timeout_stats())

    asyncio.run(test())
