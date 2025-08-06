"""CORS configuration for the AI Conflict Dashboard.

This module provides secure CORS configuration with environment-based
origin whitelisting.
"""

import os


def get_allowed_origins() -> list[str]:
    """Get allowed origins for CORS based on environment.

    In production, origins should be explicitly whitelisted.
    In development, localhost origins are allowed.

    Returns:
        List of allowed origin URLs
    """
    env = os.getenv("ENVIRONMENT", "development")

    # Always allow localhost for development
    allowed_origins = [
        "http://localhost:8080",
        "http://localhost:8000",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:3000",
        # HTTPS origins for local development with mkcert
        "https://localhost:8080",
        "https://localhost:8000",
        "https://localhost:3000",
        "https://127.0.0.1:8080",
        "https://127.0.0.1:8000",
        "https://127.0.0.1:3000",
    ]

    # In development, also allow the backend's own HTTPS URL
    if env == "development":
        allowed_origins.extend([
            "https://localhost:8000",
            "https://127.0.0.1:8000",
        ])
    
    if env == "production":
        # In production, only allow specific domains
        production_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
        allowed_origins = [origin.strip() for origin in production_origins if origin.strip()]

        if not allowed_origins:
            # If no origins specified, be very restrictive
            allowed_origins = ["https://ai-conflict-dashboard.com"]

    elif env == "staging":
        # Staging might have additional test domains
        allowed_origins.extend(
            [
                "https://staging.ai-conflict-dashboard.com",
                "https://test.ai-conflict-dashboard.com",
            ]
        )

    # Remove any empty strings
    allowed_origins = [o for o in allowed_origins if o]

    return allowed_origins


def get_cors_config() -> dict:
    """Get complete CORS configuration.

    Returns:
        Dictionary with CORS settings
    """
    return {
        "allow_origins": get_allowed_origins(),
        "allow_credentials": True,
        "allow_methods": ["GET", "POST", "OPTIONS"],  # Only what we need
        "allow_headers": ["Content-Type", "Authorization"],  # Only what we need
        "expose_headers": ["X-Request-ID"],  # Headers the frontend can access
        "max_age": 600,  # Cache preflight requests for 10 minutes
    }
