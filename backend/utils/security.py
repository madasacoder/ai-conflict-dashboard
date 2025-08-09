"""Enhanced security utilities for the AI Conflict Dashboard."""

import re
from typing import Any, Dict, Optional
import hashlib


class APIKeySanitizer:
    """Sanitize API keys and sensitive data in error messages and logs."""
    
    # Patterns for different API key formats
    API_KEY_PATTERNS = {
        'openai': re.compile(r'(sk-[a-zA-Z0-9]{20,})', re.IGNORECASE),
        'anthropic': re.compile(r'(sk-ant-[a-zA-Z0-9]{20,})', re.IGNORECASE),
        'generic_key': re.compile(r'(api[_-]?key["\']?\s*[:=]\s*["\']?)([a-zA-Z0-9]{20,})', re.IGNORECASE),
        'bearer': re.compile(r'(Bearer\s+)([a-zA-Z0-9\-._~+/]{20,})', re.IGNORECASE),
        'authorization': re.compile(r'(Authorization["\']?\s*[:=]\s*["\']?)([a-zA-Z0-9\-._~+/]{20,})', re.IGNORECASE),
    }
    
    @classmethod
    def sanitize_error_message(cls, message: str) -> str:
        """Remove all sensitive data from error messages.
        
        Args:
            message: The error message to sanitize
            
        Returns:
            Sanitized message with sensitive data removed
        """
        if not message:
            return message
            
        sanitized = message
        
        # Replace API keys with safe placeholders
        for pattern_name, pattern in cls.API_KEY_PATTERNS.items():
            if pattern_name in ['generic_key', 'authorization']:
                # Keep the prefix, replace the key
                sanitized = pattern.sub(r'\1[REDACTED]', sanitized)
            elif pattern_name == 'bearer':
                sanitized = pattern.sub(r'\1[REDACTED]', sanitized)
            else:
                # Replace entire match
                sanitized = pattern.sub('[API_KEY_REDACTED]', sanitized)
        
        # Remove any remaining long alphanumeric strings that might be keys
        sanitized = re.sub(r'\b[a-zA-Z0-9]{32,}\b', '[POSSIBLE_KEY_REDACTED]', sanitized)
        
        # Remove URLs with potential keys
        sanitized = re.sub(r'https?://[^\s]*api[_-]?key[^\s]*', '[URL_WITH_KEY_REDACTED]', sanitized)
        
        return sanitized
    
    @classmethod
    def get_key_hash(cls, api_key: str) -> str:
        """Get a safe hash representation of an API key for logging.
        
        Args:
            api_key: The API key to hash
            
        Returns:
            First 8 characters of the SHA256 hash
        """
        if not api_key:
            return "NO_KEY"
        return hashlib.sha256(api_key.encode()).hexdigest()[:8]
    
    @classmethod
    def safe_key_reference(cls, api_key: str) -> str:
        """Get a safe reference to an API key for logging.
        
        Shows first 3 and last 2 characters only.
        
        Args:
            api_key: The API key
            
        Returns:
            Safe reference like "sk-...89"
        """
        if not api_key or len(api_key) < 10:
            return "[INVALID_KEY]"
        
        # Special handling for known prefixes
        if api_key.startswith('sk-'):
            return f"{api_key[:5]}...{api_key[-2:]}"
        else:
            return f"{api_key[:3]}...{api_key[-2:]}"


class RequestIsolator:
    """Ensure complete isolation between concurrent requests."""
    
    @staticmethod
    def create_isolated_context() -> Dict[str, Any]:
        """Create a new isolated context for a request.
        
        Returns:
            Fresh context dictionary
        """
        return {
            'request_id': None,
            'user_data': {},
            'api_keys': {},
            'responses': [],
            'errors': []
        }
    
    @staticmethod
    def validate_no_leakage(context: Dict[str, Any], request_id: str) -> bool:
        """Validate that context belongs to the correct request.
        
        Args:
            context: Request context
            request_id: Expected request ID
            
        Returns:
            True if context is valid and isolated
        """
        return context.get('request_id') == request_id


class PayloadValidator:
    """Validate and limit payload sizes."""
    
    MAX_TEXT_LENGTH = 500_000  # 500KB of text (reasonable for AI analysis)
    MAX_JSON_SIZE = 2_097_152  # 2MB total JSON payload
    
    @classmethod
    def validate_text_input(cls, text: str) -> tuple[bool, Optional[str]]:
        """Validate text input size.
        
        Args:
            text: Input text
            
        Returns:
            (is_valid, error_message)
        """
        if not text:
            return False, "Text input is required"
        
        if len(text) > cls.MAX_TEXT_LENGTH:
            return False, f"Text exceeds maximum length of {cls.MAX_TEXT_LENGTH:,} characters"
        
        # Check for null bytes
        if '\x00' in text:
            return False, "Text contains invalid null bytes"
        
        return True, None
    
    @classmethod
    def validate_json_size(cls, data: dict) -> tuple[bool, Optional[str]]:
        """Validate total JSON payload size.
        
        Args:
            data: JSON data as dict
            
        Returns:
            (is_valid, error_message)
        """
        import json
        
        try:
            json_str = json.dumps(data)
            size = len(json_str.encode('utf-8'))
            
            if size > cls.MAX_JSON_SIZE:
                return False, f"Payload exceeds maximum size of {cls.MAX_JSON_SIZE:,} bytes"
            
            return True, None
        except Exception as e:
            return False, f"Invalid JSON data: {str(e)}"