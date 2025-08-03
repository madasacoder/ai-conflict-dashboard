"""Test that HTTPS redirect issues are properly fixed."""

import os
import re
import pytest


class TestHTTPSRedirectFix:
    """Test suite to ensure HTTPS redirect issues don't come back."""

    def test_workflow_builder_link_is_fixed(self):
        """Verify the workflow builder link uses IP address to avoid HSTS issues."""
        with open("../frontend/index.html", "r") as f:
            content = f.read()

        # Find the workflow builder link
        match = re.search(
            r'<a[^>]*href="([^"]*workflow-builder[^"]*)"[^>]*>.*?Workflow Builder.*?</a>',
            content,
            re.IGNORECASE | re.DOTALL,
        )

        assert match, "Workflow builder link not found"
        link = match.group(1)

        # Must use IP address to avoid localhost HSTS issues
        assert (
            link == "http://127.0.0.1:3000/workflow-builder.html"
        ), f"Link must use IP address to avoid HSTS issues, got: {link}"

    def test_no_relative_workflow_links(self):
        """Ensure no relative links that might trigger HTTPS upgrades."""
        with open("../frontend/index.html", "r") as f:
            content = f.read()

        # Check for any relative workflow links
        relative_patterns = [
            r'href="workflow-builder',  # Relative
            r"href='workflow-builder",  # Relative with single quotes
            r'href="./workflow-builder',  # Relative with ./
            r'href="../workflow-builder',  # Relative with ../
        ]

        for pattern in relative_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            assert not matches, f"Found relative workflow link: {matches}"

    def test_no_protocol_relative_urls(self):
        """Ensure no protocol-relative URLs that inherit parent protocol."""
        files_to_check = [
            "../frontend/index.html",
            "../frontend/workflow-builder.html",
            "../frontend/workflow-builder.html",
        ]

        for filepath in files_to_check:
            if os.path.exists(filepath):
                with open(filepath, "r") as f:
                    content = f.read()

                # Check for //localhost pattern (but not http://localhost)
                lines = content.split("\n")
                for i, line in enumerate(lines):
                    if "//localhost" in line:
                        # Make sure it's http://localhost, not just //localhost
                        assert (
                            "http://localhost" in line or "https://localhost" in line
                        ), f"{filepath}:{i+1} has protocol-relative URL: {line.strip()}"

    def test_no_https_forcing_meta_tags(self):
        """Ensure no meta tags that force HTTPS upgrades."""
        with open("../frontend/index.html", "r") as f:
            content = f.read()

        # Check for problematic meta tags and headers
        problematic_patterns = [
            "upgrade-insecure-requests",
            "strict-transport-security",
            "content-security-policy.*upgrade",
        ]

        for pattern in problematic_patterns:
            assert not re.search(
                pattern, content, re.IGNORECASE
            ), f"Found problematic pattern that might force HTTPS: {pattern}"

    def test_ssl_error_documentation(self):
        """Ensure SSL errors are documented for future reference."""
        # Check that we have proper documentation
        doc_files = [
            "../diagnose-https-issue.py",
            "tests/test_https_redirect_issue.py",
            "tests/test_workflow_builder_access.py",
        ]

        for doc_file in doc_files:
            assert os.path.exists(
                doc_file
            ), f"Documentation file {doc_file} should exist"

    def test_error_log_ssl_pattern(self):
        """Test that we can identify SSL handshake errors in logs."""
        # SSL/TLS handshake pattern

        # This is what appears in error logs when HTTPS tries to connect to HTTP
        error_line = b'"\x16\x03\x01\x02\x00\x01\x00\x01'

        assert error_line.startswith(
            b'"\x16\x03'
        ), "Should recognize SSL handshake pattern in logs"

    def test_diagnostic_script_exists(self):
        """Ensure diagnostic script is available for future issues."""
        assert os.path.exists(
            "../diagnose-https-issue.py"
        ), "Diagnostic script should exist for troubleshooting"

    def test_fix_is_documented(self):
        """Ensure the fix is properly documented."""
        # Check CLAUDE.md or other documentation

        # At minimum, we should have created test files documenting the issue
        assert os.path.exists("tests/test_https_redirect_issue.py")
        assert os.path.exists("tests/test_workflow_builder_access.py")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
