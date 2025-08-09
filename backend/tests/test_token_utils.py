"""
Unit tests for token_utils module.
"""

from token_utils import check_token_limits, estimate_tokens
from token_utils_wrapper import chunk_text


class TestEstimateTokens:
    """Test token estimation functionality."""

    def test_empty_string(self):
        """Test token estimation for empty string."""
        assert estimate_tokens("") == 0

    def test_short_text(self):
        """Test token estimation for short text."""
        # "Hello world" = 2 words, ~3 tokens
        assert estimate_tokens("Hello world") >= 2
        assert estimate_tokens("Hello world") <= 4

    def test_longer_text(self):
        """Test token estimation for longer text."""
        text = "This is a longer piece of text with multiple words and sentences."
        # 12 words, should be ~16 tokens
        tokens = estimate_tokens(text)
        assert tokens >= 12
        assert tokens <= 20

    def test_special_characters(self):
        """Test token estimation with special characters."""
        text = "Hello! How are you? I'm fine, thanks."
        tokens = estimate_tokens(text)
        assert tokens > 0


class TestCheckTokenLimits:
    """Test token limit checking functionality."""

    def test_within_limits(self):
        """Test text within all model limits."""
        text = "This is a short text"
        result = check_token_limits(text)

        assert result["safe_for_all"] is True
        assert len(result["warnings"]) == 0
        assert result["estimated_tokens"] > 0

    def test_exceeds_gpt35_limit(self):
        """Test text that exceeds GPT-3.5 limit."""
        # Create text that's ~5000 tokens (20000 chars)
        text = "a" * 20000
        result = check_token_limits(text)

        assert result["safe_for_all"] is False
        assert len(result["warnings"]) > 0

        # Should have warning for GPT-3.5
        gpt_warning = next((w for w in result["warnings"] if "GPT-3.5" in w["model"]), None)
        assert gpt_warning is not None, "gpt_warning should not be None"
        assert gpt_warning["exceeds_by"] > 0

    def test_recommendations(self):
        """Test that recommendations are provided when limits exceeded."""
        text = "a" * 20000
        result = check_token_limits(text)

        assert len(result["recommendations"]) > 0
        assert "Reduce text" in result["recommendations"][0]


class TestChunkText:
    """Test text chunking functionality."""

    def test_no_chunking_needed(self):
        """Test text that doesn't need chunking."""
        text = "This is a short text that doesn't need chunking."
        chunks = chunk_text(text, max_tokens=1000)

        assert len(chunks) == 1
        assert chunks[0]["text"] == text
        assert chunks[0]["chunk_index"] == 1
        assert chunks[0]["total_chunks"] == 1
        assert chunks[0]["is_complete"] is True

    def test_basic_chunking(self):
        """Test basic text chunking."""
        # Create text with clear paragraph breaks
        text = "First paragraph. " * 100 + "\n\n" + "Second paragraph. " * 100
        chunks = chunk_text(text, max_tokens=200)

        assert len(chunks) > 1
        assert all(estimate_tokens(c["text"]) <= 250 for c in chunks)  # Allow some overflow
        assert chunks[0]["chunk_index"] == 1
        assert chunks[-1]["chunk_index"] == len(chunks)

    def test_chunk_overlap(self):
        """Test that chunks have overlap for context."""
        text = "Sentence one. Sentence two. Sentence three. " * 50
        chunks = chunk_text(text, max_tokens=50, overlap_tokens=10)

        assert len(chunks) > 1
        # Check that chunks have some overlap (not exact due to sentence boundaries)
        if len(chunks) > 1:
            # Last part of first chunk should appear in second chunk
            assert chunks[0]["text"][-20:] in chunks[1]["text"]

    def test_chunk_metadata(self):
        """Test chunk metadata is correct."""
        text = "Long text. " * 500
        chunks = chunk_text(text, max_tokens=100)

        for i, chunk in enumerate(chunks):
            assert chunk["chunk_index"] == i + 1
            assert chunk["total_chunks"] == len(chunks)
            assert chunk["is_complete"] is False
            assert "start_char" in chunk
            assert "end_char" in chunk
            assert chunk["start_char"] < chunk["end_char"]

    def test_sentence_boundary_preservation(self):
        """Test that chunking preserves sentence boundaries when possible."""
        text = "This is sentence one. This is sentence two. This is sentence three."
        # Use a more realistic chunk size that allows for sentence preservation
        chunks = chunk_text(text, max_tokens=30)

        # With reasonable chunk sizes, sentences should be preserved
        for chunk in chunks:
            text_content = chunk["text"].strip()
            # Each chunk should contain complete sentences when chunk size allows
            # Check that we don't have partial sentences (except possibly at boundaries)
            if "." in text_content:
                # If there's a period, it should be at the end of a sentence
                assert text_content.endswith(".") or ". " in text_content


class TestEdgeCases:
    """Test edge cases and error conditions."""

    def test_very_long_single_word(self):
        """Test handling of very long single word."""
        text = "a" * 10000  # Single very long "word"
        chunks = chunk_text(text, max_tokens=1000)

        # Should still chunk even without natural boundaries
        assert len(chunks) > 1

    def test_unicode_text(self):
        """Test handling of Unicode text."""
        text = "Hello 世界! This is a test with émojis 🚀 and special characters."
        tokens = estimate_tokens(text)
        assert tokens > 0

        result = check_token_limits(text)
        assert result["safe_for_all"] is True

    def test_empty_paragraphs(self):
        """Test handling of empty paragraphs."""
        text = "First paragraph.\n\n\n\nSecond paragraph after multiple breaks."
        chunks = chunk_text(text, max_tokens=10)

        # Should handle empty paragraphs gracefully
        assert all(chunk["text"].strip() for chunk in chunks)
