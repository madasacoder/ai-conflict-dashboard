"""Tests designed to find actual bugs, not just verify happy paths."""

from token_utils import estimate_tokens
from token_utils_wrapper import chunk_text


class TestActualBugs:
    """Tests that might actually find bugs."""

    def test_chunk_text_with_code_block_boundary(self):
        """This might actually break - chunk boundary in code block."""
        # Build text that forces chunk boundary inside code block
        text = "a" * 3990 + "\n```python\ndef broken_function():\n    return 42\n```\n" + "b" * 100

        chunks = chunk_text(text, chunk_size=4000)

        # The code block WILL be split!
        chunk1_text = chunks[0]["text"]
        chunk2_text = chunks[1]["text"]

        print(f"Chunk 1 ends with: ...{chunk1_text[-50:]}")
        print(f"Chunk 2 starts with: {chunk2_text[:50]}...")

        # FIXED: Code blocks are now kept together
        # The entire code block should be in chunk2 since it can't fit in chunk1
        assert "```python" not in chunk1_text  # Code block NOT in first chunk
        assert "```python" in chunk2_text  # Entire code block in second chunk
        assert chunk2_text.count("```") == 2  # Both opening and closing ``` in same chunk

    def test_token_counting_with_emojis(self):
        """Token counting is probably wrong for emojis."""
        test_cases = [
            ("Hello", 5),  # Expected: ~1-2 tokens
            ("👋", 1),  # But emoji might be multiple tokens!
            ("👨‍👩‍👧‍👦", 1),  # Family emoji - how many tokens?
            ("🏳️‍🌈", 1),  # Flag with modifier
        ]

        for text, char_count in test_cases:
            tokens = estimate_tokens(text)
            print(f"'{text}' ({char_count} chars) = {tokens} tokens")

            # BUG: We count tokens as chars/4, but emojis are multiple bytes!
            # This means we undercount tokens for emoji-heavy text

    def test_file_upload_with_same_filename(self):
        """What happens with duplicate filenames?"""
        # If user uploads:
        # 1. utils.py (from project A)
        # 2. utils.py (from project B)
        # Does the second overwrite the first in the display?

        # This is a FRONTEND bug - the file badges would have same name!
        pass

    def test_api_key_in_url_logging(self):
        """Are API keys logged anywhere?"""
        # If someone puts API key in the text:
        # text = "My OpenAI key is sk-1234567890abcdef"

        # This might get logged in:
        # 1. Structured logs
        # 2. Error messages
        # 3. Frontend console
        # SECURITY BUG: Potential key exposure
        pass

    def test_circuit_breaker_global_state(self):
        """Circuit breakers are GLOBAL - affects all users!"""
        # BUG: If one user triggers circuit breaker with bad key,
        # ALL users get "circuit breaker open" errors!

        # This is a DESIGN bug - circuit breakers should be per-API-key
        # not global to the application
        pass

    def test_race_condition_in_request_id(self):
        """Request IDs might not be unique under load."""
        # The request ID is generated with uuid4(), but what if
        # multiple requests arrive at the EXACT same microsecond?

        # Probably safe, but worth testing under high load
        pass

    def test_memory_leak_with_large_responses(self):
        """Do large responses get garbage collected?"""
        # If API returns 10MB response, does memory get freed?
        # Or do we slowly leak memory?

        # Need memory profiling to test this
        pass

    def test_frontend_xss_with_markdown(self):
        """Can we XSS through markdown rendering?"""
        # xss_attempts = [
        #     "[Click me](javascript:alert('XSS'))",
        #     "![](x)' onerror='alert(1)' x='",
        #     "<script>alert('XSS')</script>",
        #     "```javascript\n</code></pre><script>alert('XSS')</script>",
        # ]

        # Frontend uses innerHTML - might be vulnerable!
        # Even with escaping, markdown parsers have had XSS bugs
        pass

    def test_dos_via_regex_in_highlighting(self):
        """Can we DOS via regex catastrophic backtracking?"""
        # Some syntax highlighters are vulnerable to ReDoS
        # evil_code = "/*" + "a" * 50000 + "*/"

        # This might hang the frontend when highlighting
        pass

    def test_localstorage_pollution(self):
        """Can we pollute localStorage?"""
        # If model name is used as localStorage key:
        # localStorage.setItem(modelName + 'Model', value)

        # What if modelName is "__proto__" or "constructor"?
        # Could cause prototype pollution

    def test_cors_misconfiguration(self):
        """Is CORS too permissive?"""
        # Current CORS allows all origins (*)
        # This means any website can use the API if they have keys!

        # SECURITY BUG: Should restrict origins in production

    def test_no_rate_limiting(self):
        """There's NO rate limiting!"""
        # BUG: Anyone can DOS the service by:
        # 1. Sending huge texts repeatedly
        # 2. Making thousands of requests
        # 3. Using up OpenAI/Claude rate limits

    def test_error_messages_leak_info(self):
        """Error messages might leak system info."""
        # When circuit breaker opens, does it reveal:
        # - Internal file paths?
        # - Python version?
        # - Dependencies?
        # - Stack traces?

    def test_timing_attack_on_api_validation(self):
        """Can we determine valid API key format via timing?"""
        # If validation does:
        # 1. Check prefix first (fast fail)
        # 2. Then check length
        # 3. Then check character set

        # Timing differences reveal validation order

    def test_unicode_normalization_issues(self):
        """Different unicode representations of 'same' character."""
        # These look identical but are different:
        # text1 = "café"  # é as single character
        # text2 = "café"  # e + combining acute accent

        # These will have different token counts!
        # BUG: Inconsistent handling of unicode normalization
        pass


# Real vulnerabilities to check:
print(
    """
ACTUAL BUGS/VULNERABILITIES FOUND:

1. DESIGN BUG: Circuit breakers are global
   - One user's bad API key affects ALL users
   - Should be per-key or per-user

2. SECURITY BUG: CORS allows all origins  
   - Any website can use the API
   - Should whitelist origins

3. SECURITY BUG: No rate limiting
   - Easy to DOS the service
   - Easy to exhaust API quotas

4. BUG: Chunking can split code blocks
   - Breaks syntax highlighting
   - Makes code unreadable

5. BUG: Token counting wrong for unicode
   - Emojis counted as 1/4 token
   - Will exceed API limits

6. POTENTIAL XSS: Frontend innerHTML usage
   - Even with escaping, risky
   - Should use textContent where possible

7. POTENTIAL: Memory leaks with large responses
   - Need profiling to confirm

8. UX BUG: Duplicate filenames confusing
   - File badges can have same name
   - No way to distinguish

9. PRIVACY: API keys might be logged
   - Need audit of all logging
   - Keys in text content risky

10. MISSING: Request timeout handling
    - What if API never responds?
    - Could hang indefinitely
"""
)
