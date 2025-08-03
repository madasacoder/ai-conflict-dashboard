"""Smart text chunking that preserves code blocks and structure.

This module provides intelligent text chunking that:
1. Keeps code blocks intact
2. Respects paragraph boundaries
3. Maintains markdown structure
4. Handles edge cases gracefully
"""

import re
from dataclasses import dataclass

from structured_logging import get_logger

logger = get_logger(__name__)


@dataclass
class TextBlock:
    """Represents a block of text with metadata."""

    content: str
    block_type: str  # 'code', 'paragraph', 'heading', 'list', etc.
    language: str | None = None  # For code blocks
    can_split: bool = True  # Whether this block can be split


class SmartChunker:
    """Intelligent text chunker that preserves structure."""

    def __init__(self, chunk_size: int = 3500, overlap: int = 200):
        """Initialize chunker with size limits.

        Args:
            chunk_size: Target size for each chunk in characters
            overlap: Number of characters to overlap between chunks
        """
        self.chunk_size = chunk_size
        self.overlap = overlap

        # Patterns for identifying different block types
        self.code_block_pattern = re.compile(r"```(\w*)\n(.*?)\n```", re.DOTALL)
        self.heading_pattern = re.compile(r"^#{1,6}\s+.*$", re.MULTILINE)
        self.list_pattern = re.compile(r"^[\*\-\+\d]+\.\s+.*$", re.MULTILINE)

    def parse_blocks(self, text: str) -> list[TextBlock]:
        """Parse text into structured blocks.

        Args:
            text: Input text to parse

        Returns:
            List of TextBlock objects
        """
        blocks = []
        last_end = 0

        # Find all code blocks first (they can't be split)
        for match in self.code_block_pattern.finditer(text):
            start, end = match.span()

            # Add any text before this code block
            if start > last_end:
                pre_text = text[last_end:start].strip()
                if pre_text:
                    blocks.extend(self._parse_regular_text(pre_text))

            # Add the code block
            language = match.group(1) or "plaintext"
            code_content = match.group(0)  # Include fence markers
            blocks.append(
                TextBlock(
                    content=code_content,
                    block_type="code",
                    language=language,
                    can_split=False,  # Never split code blocks
                )
            )

            last_end = end

        # Add any remaining text
        if last_end < len(text):
            remaining = text[last_end:].strip()
            if remaining:
                blocks.extend(self._parse_regular_text(remaining))

        return blocks

    def _parse_regular_text(self, text: str) -> list[TextBlock]:
        """Parse non-code text into paragraphs and other blocks."""
        blocks = []

        # Split by double newlines for paragraphs
        paragraphs = re.split(r"\n\s*\n", text)

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # Check if it's a heading
            if self.heading_pattern.match(para):
                blocks.append(
                    TextBlock(
                        content=para,
                        block_type="heading",
                        can_split=False,  # Don't split headings
                    )
                )
            # Check if it's a list
            elif self.list_pattern.match(para):
                blocks.append(
                    TextBlock(
                        content=para,
                        block_type="list",
                        can_split=True,  # Lists can be split carefully
                    )
                )
            else:
                blocks.append(TextBlock(content=para, block_type="paragraph", can_split=True))

        return blocks

    def chunk_text(self, text: str) -> list[str]:
        """Chunk text intelligently preserving structure.

        Args:
            text: Input text to chunk

        Returns:
            List of text chunks
        """
        blocks = self.parse_blocks(text)
        chunks = []
        current_chunk = []
        current_size = 0

        for block in blocks:
            block_size = len(block.content)

            # If block is too large and can be split
            if block_size > self.chunk_size and block.can_split:
                # Finish current chunk
                if current_chunk:
                    chunks.append("\n\n".join(current_chunk))
                    current_chunk = []
                    current_size = 0

                # Split the large block
                sub_chunks = self._split_large_block(block)
                chunks.extend(sub_chunks[:-1])  # Add all but last

                # Start new chunk with last sub-chunk
                current_chunk = [sub_chunks[-1]]
                current_size = len(sub_chunks[-1])

            # If adding block would exceed limit
            elif current_size + block_size + 2 > self.chunk_size:  # +2 for \n\n
                # Check if block can be split
                if not block.can_split:
                    # If current chunk is empty, we must add this block even if too large
                    if not current_chunk:
                        current_chunk = [block.content]
                        current_size = block_size
                    else:
                        # Finish current chunk without this block
                        chunks.append("\n\n".join(current_chunk))
                        # Start new chunk with just this block
                        current_chunk = [block.content]
                        current_size = block_size
                else:
                    # Finish current chunk
                    if current_chunk:
                        chunks.append("\n\n".join(current_chunk))

                    # Start new chunk with overlap
                    overlap_blocks = self._get_overlap_blocks(current_chunk)
                    current_chunk = overlap_blocks + [block.content]
                    current_size = sum(len(b) for b in current_chunk) + len(current_chunk) * 2

            # Otherwise add to current chunk
            else:
                current_chunk.append(block.content)
                current_size += block_size + 2

        # Add final chunk
        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        # Log chunking results
        logger.info(
            "Text chunked",
            original_length=len(text),
            num_chunks=len(chunks),
            chunk_sizes=[len(c) for c in chunks],
        )

        return chunks

    def _split_large_block(self, block: TextBlock) -> list[str]:
        """Split a large block that can be split."""
        # For blocks that are marked as can_split=False but are too large,
        # we still need to force split them
        if not block.can_split and len(block.content) > self.chunk_size:
            return self._force_split_text(block.content)

        if block.block_type == "paragraph":
            return self._split_paragraph(block.content)
        elif block.block_type == "list":
            return self._split_list(block.content)
        else:
            # Fallback: split by sentences
            return self._split_by_sentences(block.content)

    def _split_paragraph(self, text: str) -> list[str]:
        """Split paragraph by sentences."""
        # Simple sentence splitting (could be improved with NLTK)
        sentences = re.split(r"(?<=[.!?])\s+", text)

        # If there's only one "sentence" and it's too long, force split it
        if len(sentences) == 1 and len(sentences[0]) > self.chunk_size:
            return self._force_split_text(sentences[0])

        chunks = []
        current = []
        current_size = 0

        for sentence in sentences:
            # If a single sentence is longer than chunk size, force split it
            if len(sentence) > self.chunk_size:
                # Finish current chunk
                if current:
                    chunks.append(" ".join(current))
                    current = []
                    current_size = 0

                # Force split the long sentence
                split_parts = self._force_split_text(sentence)
                chunks.extend(split_parts[:-1])

                # Keep last part for next chunk
                current = [split_parts[-1]]
                current_size = len(split_parts[-1])
            elif current_size + len(sentence) > self.chunk_size:
                if current:
                    chunks.append(" ".join(current))
                current = [sentence]
                current_size = len(sentence)
            else:
                current.append(sentence)
                current_size += len(sentence) + 1

        if current:
            chunks.append(" ".join(current))

        return chunks

    def _split_list(self, text: str) -> list[str]:
        """Split list by items."""
        items = re.split(r"\n(?=[\*\-\+\d]+\.?\s+)", text)

        chunks = []
        current = []
        current_size = 0

        for item in items:
            if current_size + len(item) > self.chunk_size:
                if current:
                    chunks.append("\n".join(current))
                current = [item]
                current_size = len(item)
            else:
                current.append(item)
                current_size += len(item) + 1

        if current:
            chunks.append("\n".join(current))

        return chunks

    def _split_by_sentences(self, text: str) -> list[str]:
        """Generic sentence-based splitting."""
        # First try to split by sentences
        sentences = re.split(r"(?<=[.!?])\s+", text)

        # If no sentence boundaries found and text is too long, force split
        if len(sentences) == 1 and len(text) > self.chunk_size:
            return self._force_split_text(text)

        return self._split_paragraph(text)

    def _force_split_text(self, text: str) -> list[str]:
        """Force split text that has no natural boundaries.

        This handles edge cases like very long words or text without spaces.
        """
        chunks = []

        # Try to split on spaces first
        words = text.split()
        if len(words) > 1:
            # Split by words
            current = []
            current_size = 0

            for word in words:
                if len(word) > self.chunk_size:
                    # Handle single word longer than chunk size
                    if current:
                        chunks.append(" ".join(current))
                        current = []
                        current_size = 0

                    # Force split the long word
                    for i in range(0, len(word), self.chunk_size):
                        chunks.append(word[i : i + self.chunk_size])
                elif current_size + len(word) + 1 > self.chunk_size:
                    chunks.append(" ".join(current))
                    current = [word]
                    current_size = len(word)
                else:
                    current.append(word)
                    current_size += len(word) + 1

            if current:
                chunks.append(" ".join(current))
        else:
            # No spaces - just force split at chunk boundaries
            for i in range(0, len(text), self.chunk_size):
                chunks.append(text[i : i + self.chunk_size])

        return chunks

    def _get_overlap_blocks(self, blocks: list[str]) -> list[str]:
        """Get blocks for overlap from end of chunk."""
        if not blocks:
            return []

        overlap_blocks = []
        overlap_size = 0

        # Work backwards to get overlap
        for block in reversed(blocks):
            if overlap_size + len(block) <= self.overlap:
                overlap_blocks.insert(0, block)
                overlap_size += len(block)
            else:
                break

        return overlap_blocks


def chunk_text_smart(
    text: str, chunk_size: int = 3500, preserve_code_blocks: bool = True
) -> list[str]:
    """Convenience function for smart chunking.

    Args:
        text: Text to chunk
        chunk_size: Target chunk size
        preserve_code_blocks: Whether to keep code blocks intact

    Returns:
        List of text chunks
    """
    chunker = SmartChunker(chunk_size=chunk_size)
    return chunker.chunk_text(text)


# Example usage and testing
if __name__ == "__main__":
    test_text = (
        """# My Document

This is a paragraph that explains something important.

```python
def my_function():
    # This code block should never be split
    result = complex_calculation()
    return result
```

Here's another paragraph that might be very long and need splitting. """
        + "word " * 1000
        + """

## Section 2

- List item 1
- List item 2
- List item 3

More text here."""
    )

    chunks = chunk_text_smart(test_text, chunk_size=500)

    logger.info("Chunking test", chunk_count=len(chunks))
    for i, chunk in enumerate(chunks):
        logger.debug(
            "Chunk content",
            chunk_id=i + 1,
            char_count=len(chunk),
            preview=chunk[:200] + "..." if len(chunk) > 200 else chunk,
        )
