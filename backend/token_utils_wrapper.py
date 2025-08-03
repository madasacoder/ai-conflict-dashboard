"""
Wrapper to adapt chunk_text_smart to the expected test interface.
"""

from typing import Any

from smart_chunking import chunk_text_smart


def chunk_text(
    text: str,
    max_tokens: int = 3500,
    chunk_size: int | None = None,
    overlap: int = 100,
    overlap_tokens: int | None = None,
) -> list[dict[str, Any]]:
    """
    Chunk text and return in the format expected by tests.

    Args:
        text: Text to chunk
        max_tokens: Maximum tokens per chunk (maps to chunk_size)
        chunk_size: Alternative parameter name for max_tokens
        overlap: Overlap between chunks (not used in smart chunking)
        overlap_tokens: Alternative overlap parameter

    Returns:
        List of dictionaries with chunk information
    """
    # Use chunk_size if provided, otherwise use max_tokens
    size = chunk_size if chunk_size is not None else max_tokens

    # Call the smart chunking function
    chunks = chunk_text_smart(text, chunk_size=size)

    # Convert to expected format
    result = []
    total_chunks = len(chunks)

    for i, chunk in enumerate(chunks):
        # Calculate actual positions
        start = text.find(chunk)
        end = start + len(chunk) if start != -1 else len(text)

        result.append(
            {
                "text": chunk,
                "chunk_index": i + 1,
                "total_chunks": total_chunks,
                "start_char": start,
                "end_char": end,
                "is_complete": i == 0 and total_chunks == 1,  # Only true if single chunk
                "overlap_with_previous": overlap_tokens or overlap if i > 0 else 0,
                "overlap_with_next": (overlap_tokens or overlap if i < total_chunks - 1 else 0),
            }
        )

    return result
