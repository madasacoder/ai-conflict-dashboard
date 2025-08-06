"""Rate limiting implementation for the AI Conflict Dashboard.

Provides configurable rate limiting to prevent abuse and protect
against DoS attacks.
"""

import hashlib
from collections import defaultdict
from collections.abc import Callable
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, Request
from starlette.status import HTTP_429_TOO_MANY_REQUESTS

from structured_logging import get_logger

logger = get_logger(__name__)


class RateLimiter:
    """Token bucket rate limiter with sliding window."""

    def __init__(
        self,
        requests_per_minute: int = 10,
        requests_per_hour: int = 100,
        requests_per_day: int = 1000,
        burst_size: int = 20,
    ):
        """Initialize rate limiter with configurable limits.

        Args:
            requests_per_minute: Max requests per minute
            requests_per_hour: Max requests per hour
            requests_per_day: Max requests per day
            burst_size: Max burst requests allowed
        """
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.requests_per_day = requests_per_day
        self.burst_size = burst_size

        # Storage for request counts per identifier
        self.minute_counts: dict[str, list] = defaultdict(list)
        self.hour_counts: dict[str, list] = defaultdict(list)
        self.day_counts: dict[str, list] = defaultdict(list)

        # Token buckets for burst handling
        self.token_buckets: dict[str, dict] = {}

    def _clean_old_entries(self, identifier: str, now: datetime) -> None:
        """Remove expired entries from tracking."""
        # Clean minute window
        minute_cutoff = now - timedelta(minutes=1)
        self.minute_counts[identifier] = [
            ts for ts in self.minute_counts[identifier] if ts > minute_cutoff
        ]

        # Clean hour window
        hour_cutoff = now - timedelta(hours=1)
        self.hour_counts[identifier] = [
            ts for ts in self.hour_counts[identifier] if ts > hour_cutoff
        ]

        # Clean day window
        day_cutoff = now - timedelta(days=1)
        self.day_counts[identifier] = [ts for ts in self.day_counts[identifier] if ts > day_cutoff]

    def _update_token_bucket(self, identifier: str, now: datetime) -> int:
        """Update and return available tokens."""
        if identifier not in self.token_buckets:
            self.token_buckets[identifier] = {
                "tokens": self.burst_size,
                "last_update": now,
            }
            return self.burst_size

        bucket = self.token_buckets[identifier]
        time_passed = (now - bucket["last_update"]).total_seconds()

        # Replenish tokens based on time passed
        tokens_to_add = time_passed * (self.requests_per_minute / 60.0)
        bucket["tokens"] = min(self.burst_size, bucket["tokens"] + tokens_to_add)
        bucket["last_update"] = now

        return int(bucket["tokens"])

    def check_rate_limit(self, identifier: str) -> tuple[bool, int | None]:
        """Check if request is within rate limits.

        Args:
            identifier: Unique identifier (IP, API key, etc.)

        Returns:
            Tuple of (allowed, retry_after_seconds)
        """
        now = datetime.now(UTC)
        self._clean_old_entries(identifier, now)

        # Check burst limit using token bucket
        available_tokens = self._update_token_bucket(identifier, now)
        if available_tokens < 1:
            return False, 60  # Retry after 1 minute

        # Check rate windows
        minute_count = len(self.minute_counts[identifier])
        hour_count = len(self.hour_counts[identifier])
        day_count = len(self.day_counts[identifier])

        # Check limits
        if minute_count >= self.requests_per_minute:
            retry_after = 60 - (now - self.minute_counts[identifier][0]).seconds
            logger.warning(
                "Rate limit exceeded (minute)",
                identifier=identifier,
                count=minute_count,
                limit=self.requests_per_minute,
            )
            return False, retry_after

        if hour_count >= self.requests_per_hour:
            retry_after = 3600 - (now - self.hour_counts[identifier][0]).seconds
            logger.warning(
                "Rate limit exceeded (hour)",
                identifier=identifier,
                count=hour_count,
                limit=self.requests_per_hour,
            )
            return False, retry_after

        if day_count >= self.requests_per_day:
            retry_after = 86400 - (now - self.day_counts[identifier][0]).seconds
            logger.warning(
                "Rate limit exceeded (day)",
                identifier=identifier,
                count=day_count,
                limit=self.requests_per_day,
            )
            return False, retry_after

        # Request allowed - record it
        self.minute_counts[identifier].append(now)
        self.hour_counts[identifier].append(now)
        self.day_counts[identifier].append(now)

        # Consume a token
        if identifier in self.token_buckets:
            self.token_buckets[identifier]["tokens"] -= 1

        return True, None


# Global rate limiter instances
default_limiter = RateLimiter()
strict_limiter = RateLimiter(
    requests_per_minute=5, requests_per_hour=50, requests_per_day=500, burst_size=10
)


def get_identifier(request: Request) -> str:
    """Extract identifier from request for rate limiting.

    Uses a combination of:
    1. API key (if provided in headers)
    2. IP address
    3. User agent hash

    Args:
        request: FastAPI request object

    Returns:
        Unique identifier string
    """
    # Check for API key in headers
    api_key = request.headers.get("X-API-Key")
    if api_key:
        # Hash the API key for privacy
        return hashlib.sha256(api_key.encode()).hexdigest()[:16]

    # Fall back to IP address
    client_ip = request.client.host if request.client else "unknown"

    # Add user agent for better identification
    user_agent = request.headers.get("User-Agent", "")
    ua_hash = hashlib.sha256(user_agent.encode()).hexdigest()[:8]

    return f"{client_ip}_{ua_hash}"


def rate_limit_middleware(
    limiter: RateLimiter = default_limiter,
    identifier_func: Callable[[Request], str] = get_identifier,
):
    """Middleware factory for rate limiting.

    Args:
        limiter: RateLimiter instance to use
        identifier_func: Function to extract identifier from request

    Returns:
        Middleware function
    """

    async def middleware(request: Request, call_next):
        identifier = identifier_func(request)
        allowed, retry_after = limiter.check_rate_limit(identifier)

        if not allowed:
            logger.warning(
                "Rate limit exceeded",
                identifier=identifier,
                path=request.url.path,
                retry_after=retry_after,
            )
            raise HTTPException(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Rate limit exceeded",
                    "retry_after": retry_after,
                    "message": f"Too many requests. Please retry after {retry_after} seconds.",
                },
                headers={"Retry-After": str(retry_after)},
            )

        # Add rate limit headers to response
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limiter.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(
            limiter.requests_per_minute - len(limiter.minute_counts[identifier])
        )
        response.headers["X-RateLimit-Reset"] = str(
            int((datetime.now(UTC) + timedelta(minutes=1)).timestamp())
        )

        return response

    return middleware


# Decorator for route-specific rate limiting
def rate_limit(
    requests_per_minute: int = 10,
    requests_per_hour: int = 100,
    requests_per_day: int = 1000,
):
    """Decorator for applying rate limits to specific routes.

    Usage:
        @app.post("/api/analyze")
        @rate_limit(requests_per_minute=5)
        async def analyze(request: AnalyzeRequest):
            ...
    """
    limiter = RateLimiter(
        requests_per_minute=requests_per_minute,
        requests_per_hour=requests_per_hour,
        requests_per_day=requests_per_day,
    )

    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            identifier = get_identifier(request)
            allowed, retry_after = limiter.check_rate_limit(identifier)

            if not allowed:
                raise HTTPException(
                    status_code=HTTP_429_TOO_MANY_REQUESTS,
                    detail={"error": "Rate limit exceeded", "retry_after": retry_after},
                    headers={"Retry-After": str(retry_after)},
                )

            return await func(request, *args, **kwargs)

        return wrapper

    return decorator
