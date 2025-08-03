"""
Fixed token counting and validation utilities with proper Unicode support.

This module provides accurate token counting for all models, handling
Unicode characters, emojis, and non-ASCII text correctly.
"""

import unicodedata

from structured_logging import get_logger

logger = get_logger(__name__)

# API token limits
MODEL_LIMITS = {
    "gpt-3.5-turbo": {
        "max_tokens": 4096,
        "max_response_tokens": 1000,
        "name": "OpenAI GPT-3.5 Turbo",
    },
    "gpt-4": {
        "max_tokens": 8192,
        "max_response_tokens": 1000,
        "name": "OpenAI GPT-4",
    },
    "claude-3-haiku-20240307": {
        "max_tokens": 200000,  # Claude 3 Haiku supports 200k tokens
        "max_response_tokens": 1000,
        "name": "Claude 3 Haiku",
    },
    "gemini-1.5-flash": {
        "max_tokens": 1048576,  # 1M token context
        "max_response_tokens": 8192,
        "name": "Gemini 1.5 Flash",
    },
}


def estimate_tokens(text: str) -> int:
    """Estimate token count for a given text with proper Unicode support.

    This implementation handles:
    - Multi-byte Unicode characters
    - Emojis (including composite emojis)
    - Non-Latin scripts (Chinese, Japanese, Arabic, etc.)
    - Special characters and symbols

    The estimation uses these rules:
    - ASCII alphanumeric: ~4 chars per token
    - Spaces and punctuation: usually 1 char per token
    - CJK characters: usually 1-2 chars per token
    - Emojis: 1-7 tokens depending on complexity
    - Other Unicode: 1-3 chars per token

    Args:
        text: The input text to estimate tokens for.

    Returns:
        int: Estimated number of tokens (conservative/higher estimate).
    """
    if not text:
        return 0

    # Normalize Unicode to handle composite characters
    text = unicodedata.normalize("NFC", text)

    token_count = 0
    i = 0

    while i < len(text):
        char = text[i]

        # Get Unicode category
        unicodedata.category(char)

        # Handle different character types
        if char.isascii():
            if char.isalnum():
                # ASCII letters and numbers: collect word
                word_start = i
                while i < len(text) and text[i].isascii() and text[i].isalnum():
                    i += 1
                word_len = i - word_start
                # Average English word is 4-5 characters = 1 token
                token_count += max(1, word_len // 4)
            elif char.isspace():
                # Spaces usually included with adjacent tokens
                token_count += 0.25
                i += 1
            else:
                # Punctuation and special ASCII chars
                token_count += 1
                i += 1
        else:
            # Non-ASCII character
            code_point = ord(char)

            # Check for emoji
            if is_emoji(char, text, i):
                # Handle emoji sequences (including ZWJ sequences)
                emoji_len, emoji_tokens = count_emoji_tokens(text, i)
                token_count += emoji_tokens
                i += emoji_len
            # CJK characters (Chinese, Japanese, Korean)
            elif (
                0x4E00 <= code_point <= 0x9FFF
                or 0x3000 <= code_point <= 0x303F
                or 0xAC00 <= code_point <= 0xD7AF
            ):
                # CJK chars are often 1-2 tokens each
                token_count += 1.5
                i += 1
            # Arabic, Hebrew, etc.
            elif 0x0600 <= code_point <= 0x06FF or 0x0590 <= code_point <= 0x05FF:
                token_count += 1
                i += 1
            else:
                # Other Unicode characters
                token_count += 1
                i += 1

    # Round up for conservative estimate
    return int(token_count + 0.5)


def is_emoji(char: str, text: str, pos: int) -> bool:
    """Check if character at position is part of an emoji.

    Args:
        char: The character to check
        text: Full text string
        pos: Position of char in text

    Returns:
        bool: True if character is part of an emoji
    """
    # Basic emoji ranges
    code_point = ord(char)

    # Common emoji code point ranges
    emoji_ranges = [
        (0x1F300, 0x1F6FF),  # Symbols & Pictographs
        (0x1F900, 0x1F9FF),  # Supplemental Symbols
        (0x2600, 0x26FF),  # Miscellaneous Symbols
        (0x2700, 0x27BF),  # Dingbats
        (0x1F1E6, 0x1F1FF),  # Regional indicators (flags)
        (0x1F600, 0x1F64F),  # Emoticons
        (0x1F680, 0x1F6FF),  # Transport & Map
        (0x1F700, 0x1F77F),  # Alchemical Symbols
    ]

    for start, end in emoji_ranges:
        if start <= code_point <= end:
            return True

    # Check for emoji modifiers and ZWJ sequences
    if pos + 1 < len(text):
        next_char = text[pos + 1]
        next_code = ord(next_char)

        # Variation selectors
        if next_code in (0xFE0E, 0xFE0F):
            return True

        # Skin tone modifiers
        if 0x1F3FB <= next_code <= 0x1F3FF:
            return True

        # Zero Width Joiner (for compound emojis)
        if next_code == 0x200D:
            return True

    return False


def count_emoji_tokens(text: str, start_pos: int) -> tuple[int, int]:
    """Count tokens for an emoji sequence starting at position.

    Args:
        text: Full text string
        start_pos: Starting position of emoji

    Returns:
        tuple: (characters consumed, token count)
    """
    pos = start_pos
    token_count = 1

    # Simple single emoji
    pos += 1

    # Check for modifiers and sequences
    while pos < len(text):
        if pos >= len(text):
            break

        char = text[pos]
        code = ord(char)

        # Variation selector
        if code in (0xFE0E, 0xFE0F):
            pos += 1
            continue

        # Skin tone modifier
        if 0x1F3FB <= code <= 0x1F3FF:
            pos += 1
            token_count += 1
            continue

        # Zero Width Joiner - compound emoji
        if code == 0x200D:
            pos += 1
            token_count += 1
            # Next character is part of compound
            if pos < len(text):
                pos += 1
                token_count += 1
            continue

        # Not part of emoji sequence
        break

    return pos - start_pos, token_count


def check_token_limits(text: str) -> dict:
    """Check if text exceeds token limits for each model.

    Uses accurate Unicode-aware token counting to evaluate text
    against known model token limits.

    Args:
        text: The input text to check.

    Returns:
        dict: Dictionary containing:
            - estimated_tokens: Estimated token count
            - warnings: List of warning dicts for models that exceed limits
            - recommendations: List of string recommendations
            - safe_for_all: Boolean indicating if text fits all models
    """
    estimated_tokens = estimate_tokens(text)

    warnings = []
    recommendations = []

    for _model_id, limits in MODEL_LIMITS.items():
        # Account for response tokens
        total_needed = estimated_tokens + limits["max_response_tokens"]

        if total_needed > limits["max_tokens"]:
            warnings.append(
                {
                    "model": limits["name"],
                    "estimated_tokens": estimated_tokens,
                    "max_tokens": limits["max_tokens"],
                    "exceeds_by": total_needed - limits["max_tokens"],
                }
            )

            # Calculate reduction needed
            percent_reduction = (total_needed - limits["max_tokens"]) / total_needed * 100
            recommendations.append(
                f"Reduce text by approximately {percent_reduction:.0f}% for {limits['name']}"
            )

    return {
        "estimated_tokens": estimated_tokens,
        "warnings": warnings,
        "recommendations": recommendations,
        "safe_for_all": len(warnings) == 0,
    }


# Import the wrapper that provides the expected interface


if __name__ == "__main__":
    # Test the improved token counting
    test_cases = [
        ("Hello world", "Simple ASCII"),
        ("👋 Hello!", "Emoji greeting"),
        ("👨‍👩‍👧‍👦", "Family emoji (ZWJ sequence)"),
        ("🏳️‍🌈", "Rainbow flag (ZWJ)"),
        ("你好世界", "Chinese"),
        ("こんにちは", "Japanese"),
        ("مرحبا", "Arabic"),
        ("🎉🎊✨ Party! 🥳", "Mixed emojis and text"),
        ("café", "Accented characters"),
    ]

    logger.info("Running token counting tests")
    for text, description in test_cases:
        tokens = estimate_tokens(text)
        logger.info("Token test", description=description, text=text[:20], tokens=tokens)
