"""
Memory management module to prevent memory leaks in the AI Conflict Dashboard.

This module provides utilities for:
1. Response size limiting
2. Automatic cleanup of large objects
3. Memory usage monitoring
4. Request context cleanup
"""

import asyncio
import contextlib
import gc
import sys
import weakref
from datetime import datetime, timezone
from typing import Any

import psutil
import structlog

logger = structlog.get_logger(__name__)

# Configuration
MAX_RESPONSE_SIZE = 10 * 1024 * 1024  # 10MB max per response
MAX_TOTAL_MEMORY = 512 * 1024 * 1024  # 512MB total memory limit
CLEANUP_INTERVAL = 60  # seconds
REQUEST_TIMEOUT = 300  # 5 minutes max request lifetime

# Global tracking
_active_requests: set[weakref.ref] = set()
_response_cache: weakref.WeakValueDictionary = weakref.WeakValueDictionary()
_last_cleanup = datetime.now(timezone.utc)


class MemoryManager:
    """Manages memory usage and prevents leaks in the application."""

    def __init__(self):
        self.process = psutil.Process()
        self._cleanup_task = None

    async def start(self):
        """Start the background cleanup task."""
        self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
        logger.info("Memory manager started")

    async def stop(self):
        """Stop the background cleanup task."""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._cleanup_task
        logger.info("Memory manager stopped")

    async def _periodic_cleanup(self):
        """Periodically clean up memory."""
        while True:
            try:
                await asyncio.sleep(CLEANUP_INTERVAL)
                self.cleanup_memory()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in periodic cleanup", error=str(e))

    def cleanup_memory(self):
        """Force garbage collection and clean up expired objects."""
        global _last_cleanup

        # Get current memory usage
        memory_info = self.process.memory_info()
        memory_mb = memory_info.rss / 1024 / 1024

        logger.info(
            "Memory cleanup started",
            memory_mb=round(memory_mb, 2),
            active_requests=len(_active_requests),
            cached_responses=len(_response_cache),
        )

        # Clean up dead weak references
        _active_requests.difference_update(ref for ref in _active_requests if ref() is None)

        # Force garbage collection
        collected = gc.collect()

        # Get memory after cleanup
        memory_info_after = self.process.memory_info()
        memory_mb_after = memory_info_after.rss / 1024 / 1024

        logger.info(
            "Memory cleanup completed",
            memory_mb_before=round(memory_mb, 2),
            memory_mb_after=round(memory_mb_after, 2),
            memory_freed_mb=round(memory_mb - memory_mb_after, 2),
            objects_collected=collected,
        )

        _last_cleanup = datetime.now(timezone.utc)

    def check_memory_usage(self) -> dict[str, Any]:
        """Check current memory usage and limits."""
        memory_info = self.process.memory_info()
        memory_bytes = memory_info.rss
        memory_mb = memory_bytes / 1024 / 1024
        memory_percent = (memory_bytes / MAX_TOTAL_MEMORY) * 100

        return {
            "memory_mb": round(memory_mb, 2),
            "memory_percent": round(memory_percent, 2),
            "memory_limit_mb": MAX_TOTAL_MEMORY / 1024 / 1024,
            "active_requests": len(_active_requests),
            "cached_responses": len(_response_cache),
            "last_cleanup": _last_cleanup.isoformat(),
        }

    def is_memory_critical(self) -> bool:
        """Check if memory usage is critically high."""
        memory_info = self.process.memory_info()
        return memory_info.rss > MAX_TOTAL_MEMORY * 0.9  # 90% threshold


class RequestContext:
    """Context manager for tracking request lifecycle and cleaning up resources."""

    def __init__(self, request_id: str):
        self.request_id = request_id
        self.start_time = datetime.now(timezone.utc)
        self.resources: dict[str, Any] = {}
        self._ref = None

    def __enter__(self):
        # Add to active requests
        self._ref = weakref.ref(self)
        _active_requests.add(self._ref)

        logger.debug(
            "Request started",
            request_id=self.request_id,
            active_requests=len(_active_requests),
        )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Clean up resources
        self.cleanup()

        # Remove from active requests
        if self._ref in _active_requests:
            _active_requests.remove(self._ref)

        duration = (datetime.now(timezone.utc) - self.start_time).total_seconds()
        logger.debug(
            "Request completed",
            request_id=self.request_id,
            duration_seconds=round(duration, 2),
            had_error=exc_type is not None,
        )

    def add_resource(self, name: str, resource: Any):
        """Add a resource to be tracked and cleaned up."""
        self.resources[name] = resource

    def cleanup(self):
        """Clean up all tracked resources."""
        for name, resource in self.resources.items():
            try:
                # Clear large strings/objects
                if (
                    isinstance(resource, str | bytes | list | dict)
                    and sys.getsizeof(resource) > 1024 * 1024
                ):
                    logger.debug(f"Clearing large resource: {name}")
                    if isinstance(resource, list | dict):
                        resource.clear()
            except Exception as e:
                logger.error(f"Error cleaning up resource {name}", error=str(e))

        self.resources.clear()


def limit_response_size(response: str) -> str:
    """Limit response size to prevent memory issues.

    Args:
        response: The response text to limit

    Returns:
        The response, truncated if necessary
    """
    if not response:
        return response

    size = sys.getsizeof(response)
    if size > MAX_RESPONSE_SIZE:
        # Calculate how much to keep
        ratio = MAX_RESPONSE_SIZE / size
        chars_to_keep = int(len(response) * ratio * 0.9)  # 90% to be safe

        truncated = response[:chars_to_keep]
        truncated += f"\n\n[Response truncated from {size / 1024 / 1024:.1f}MB to {MAX_RESPONSE_SIZE / 1024 / 1024:.1f}MB]"

        logger.warning(
            "Response truncated due to size",
            original_size_mb=round(size / 1024 / 1024, 2),
            truncated_size_mb=round(sys.getsizeof(truncated) / 1024 / 1024, 2),
        )

        return truncated

    return response


def cache_response(request_id: str, response: Any, ttl_seconds: int = 300):
    """Cache a response with automatic expiration.

    Args:
        request_id: Unique request identifier
        response: The response to cache
        ttl_seconds: Time to live in seconds (default 5 minutes)
    """
    # Store in weak reference dictionary (automatically cleaned up)
    _response_cache[request_id] = response

    # Schedule cleanup
    async def cleanup_after_ttl():
        await asyncio.sleep(ttl_seconds)
        _response_cache.pop(request_id, None)

    _ = asyncio.create_task(cleanup_after_ttl())


def get_cached_response(request_id: str) -> Any | None:
    """Get a cached response if available.

    Args:
        request_id: The request identifier

    Returns:
        The cached response or None
    """
    return _response_cache.get(request_id)


# Global memory manager instance
memory_manager = MemoryManager()


# Decorator for memory-aware functions
def memory_managed(func):
    """Decorator to add memory management to async functions."""

    async def wrapper(*args, **kwargs):
        # Check memory before execution
        if memory_manager.is_memory_critical():
            memory_manager.cleanup_memory()

            # Check again after cleanup
            if memory_manager.is_memory_critical():
                raise MemoryError("Memory usage critically high")

        # Execute function
        result = await func(*args, **kwargs)

        # Limit response size if it's a string
        if isinstance(result, str):
            result = limit_response_size(result)

        return result

    return wrapper


if __name__ == "__main__":
    # Test memory management
    import asyncio

    async def test():
        await memory_manager.start()

        # Test request context
        with RequestContext("test-123") as ctx:
            # Simulate large response
            large_data = "x" * (20 * 1024 * 1024)  # 20MB
            ctx.add_resource("large_response", large_data)

            # Check memory
            stats = memory_manager.check_memory_usage()
            logger.info("Memory usage", stats=stats)

            # Test response limiting
            limited = limit_response_size(large_data)
            logger.info(
                "Size comparison",
                original_mb=sys.getsizeof(large_data) / 1024 / 1024,
                limited_mb=sys.getsizeof(limited) / 1024 / 1024,
            )

        # Cleanup should happen automatically
        await asyncio.sleep(1)
        memory_manager.cleanup_memory()

        await memory_manager.stop()

    asyncio.run(test())
