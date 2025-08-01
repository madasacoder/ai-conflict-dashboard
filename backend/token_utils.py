"""
Token counting and validation utilities for API limits.
"""

# API token limits
MODEL_LIMITS = {
    "gpt-3.5-turbo": {
        "max_tokens": 4096,
        "max_response_tokens": 1000,
        "name": "OpenAI GPT-3.5 Turbo",
    },
    "claude-3-haiku-20240307": {
        "max_tokens": 200000,  # Claude 3 Haiku supports 200k tokens
        "max_response_tokens": 1000,
        "name": "Claude 3 Haiku",
    },
}


def estimate_tokens(text: str) -> int:
    """Estimate token count for a given text.

    Uses a conservative estimation approach:
    - 1 token ≈ 4 characters
    - 1 token ≈ 0.75 words

    Args:
        text: The input text to estimate tokens for.

    Returns:
        int: Estimated number of tokens (conservative/higher estimate).
    """
    # More accurate estimation based on common patterns
    # Count words and characters
    words = len(text.split())
    chars = len(text)

    # Use the more conservative estimate
    token_by_words = int(words / 0.75)
    token_by_chars = int(chars / 4)

    return max(token_by_words, token_by_chars)


def check_token_limits(text: str) -> dict:
    """Check if text exceeds token limits for each model.

    Evaluates text against known model token limits and provides
    warnings and recommendations if limits are exceeded.

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

    for model_id, limits in MODEL_LIMITS.items():
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

            # Calculate how much text needs to be reduced
            chars_to_reduce = (total_needed - limits["max_tokens"]) * 4
            recommendations.append(
                f"Reduce text by approximately {chars_to_reduce:,} characters for {limits['name']}"
            )

    return {
        "estimated_tokens": estimated_tokens,
        "warnings": warnings,
        "recommendations": recommendations,
        "safe_for_all": len(warnings) == 0,
    }


def chunk_text(
    text: str, max_tokens: int = 2500, overlap_tokens: int = 200
) -> list[dict]:
    """
    Split text into chunks that fit within token limits with overlap for context.
    Returns list of dicts with chunk info for better tracking.

    Args:
        text: Text to chunk
        max_tokens: Maximum tokens per chunk (default 2500 to leave room for prompts)
        overlap_tokens: Number of tokens to overlap between chunks for context

    Returns:
        List of dicts with 'text', 'chunk_index', 'total_chunks', 'start_char', 'end_char'
    """
    if estimate_tokens(text) <= max_tokens:
        # No chunking needed
        return [
            {
                "text": text,
                "chunk_index": 1,
                "total_chunks": 1,
                "start_char": 0,
                "end_char": len(text),
                "is_complete": True,
            }
        ]

    # Split by paragraphs first, then sentences if needed
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = []
    current_tokens = 0
    current_start = 0
    char_position = 0

    for para in paragraphs:
        para_tokens = estimate_tokens(para)

        if current_tokens + para_tokens > max_tokens:
            # Check if we need to split the paragraph
            if para_tokens > max_tokens:
                # Split by sentences
                sentences = para.replace(". ", ".|").split("|")

                # Handle edge case where we have no sentence boundaries
                if len(sentences) == 1 and para_tokens > max_tokens:
                    # Force split very long single words/sentences
                    sent = sentences[0]
                    max_chars = max_tokens * 4  # Approximate chars per token
                    while sent:
                        chunk_size = min(len(sent), max_chars)
                        chunk_part = sent[:chunk_size]

                        if current_chunk:
                            chunk_text = "\n\n".join(current_chunk)
                            chunks.append(
                                {
                                    "text": chunk_text,
                                    "start_char": current_start,
                                    "end_char": char_position,
                                }
                            )
                            current_chunk = [chunk_part]
                            current_tokens = estimate_tokens(chunk_part)
                            current_start = char_position
                        else:
                            current_chunk = [chunk_part]
                            current_tokens = estimate_tokens(chunk_part)

                        sent = sent[chunk_size:]
                        char_position += chunk_size
                else:
                    # Normal sentence processing
                    for sent in sentences:
                        sent_tokens = estimate_tokens(sent)
                        if current_tokens + sent_tokens > max_tokens:
                            # Save current chunk
                            if current_chunk:
                                chunk_text = "\n\n".join(current_chunk)
                                chunks.append(
                                    {
                                        "text": chunk_text,
                                        "start_char": current_start,
                                        "end_char": char_position,
                                    }
                                )
                                # Start new chunk with overlap
                                if overlap_tokens > 0 and chunks:
                                    # Take last few sentences for context
                                    overlap_text = chunk_text[
                                        -overlap_tokens * 4 :
                                    ]  # Approximate chars
                                    current_chunk = [overlap_text, sent]
                                    current_tokens = (
                                        estimate_tokens(overlap_text) + sent_tokens
                                    )
                                else:
                                    current_chunk = [sent]
                                    current_tokens = sent_tokens
                                current_start = char_position
                        else:
                            current_chunk.append(sent)
                            current_tokens += sent_tokens
                        char_position += len(sent)
            else:
                # Save current chunk and start new one
                if current_chunk:
                    chunk_text = "\n\n".join(current_chunk)
                    chunks.append(
                        {
                            "text": chunk_text,
                            "start_char": current_start,
                            "end_char": char_position,
                        }
                    )
                    # Add overlap
                    if overlap_tokens > 0:
                        overlap_text = chunk_text[-overlap_tokens * 4 :]
                        current_chunk = [overlap_text, para]
                        current_tokens = estimate_tokens(overlap_text) + para_tokens
                    else:
                        current_chunk = [para]
                        current_tokens = para_tokens
                    current_start = char_position
                else:
                    current_chunk = [para]
                    current_tokens = para_tokens
        else:
            current_chunk.append(para)
            current_tokens += para_tokens

        char_position += len(para) + 2  # Account for \n\n

    # Add last chunk
    if current_chunk:
        chunks.append(
            {
                "text": "\n\n".join(current_chunk),
                "start_char": current_start,
                "end_char": len(text),
            }
        )

    # Add chunk metadata
    total_chunks = len(chunks)
    for i, chunk in enumerate(chunks):
        chunk["chunk_index"] = i + 1
        chunk["total_chunks"] = total_chunks
        chunk["is_complete"] = total_chunks == 1

    return chunks
