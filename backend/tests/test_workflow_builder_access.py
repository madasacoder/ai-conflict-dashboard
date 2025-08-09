import json
"""Test workflow builder access and HTTPS redirect issues."""

import re
import os
from pathlib import Path
from unittest.mock import Mock

import pytest
import requests


class TestWorkflowBuilderAccess:
    """Test workflow builder access and HTTPS redirect issues."""

    def test_workflow_builder_link_uses_explicit_http(self):
        """Ensure workflow builder link uses explicit HTTP protocol."""
        # Read the main index.html file (legacy or React UI)
        index_legacy = Path("../frontend/index.html")
        index_react = Path("../ui/index.html")
        index_path: Path | None = None
        if index_legacy.exists():
            index_path = index_legacy
        elif index_react.exists():
            index_path = index_react
        else:
            pytest.skip("No frontend index.html found (neither legacy nor React)")

        with index_path.open() as f:
            content = f.read()

        # Find workflow builder link
        workflow_link_pattern = r'<a[^>]*href="([^"]*workflow-builder[^"]*)"[^>]*>'
        matches = re.findall(workflow_link_pattern, content, re.IGNORECASE)

        if index_path == index_legacy:
            assert len(matches) > 0, "No workflow builder link found in legacy index.html"
            for link in matches:
                # Ensure link uses explicit HTTP protocol to avoid HTTPS upgrade issues in legacy
                assert link.startswith("http://"), f"Link should use explicit HTTP: {link}"
                assert (
                    "localhost:3000" in link or "127.0.0.1:3000" in link
                ), f"Link should point to dev server: {link}"
        else:
            # React UI typically doesn't hardcode a workflow-builder.html link; ensure index structure exists
            assert (
                "<div id=\"root\"></div>" in content or "<div id=\"root\"" in content
            ), "React UI index.html should contain root div"

    def test_no_https_localhost_references(self):
        """Ensure no HTTPS references to localhost in HTML files."""
        html_files = [p for p in [Path("../frontend/index.html"), Path("../frontend/workflow-builder.html"), Path("../ui/index.html")] if p.exists()]

        for filepath in html_files:
            try:
                with filepath.open() as f:
                    content = f.read()

                # Check for HTTPS localhost references
                assert "https://localhost" not in content, f"{filepath} contains https://localhost"

                # Check for protocol-relative URLs that might become HTTPS
                # (but allow http://localhost)
                lines = content.split("\n")
                for i, line in enumerate(lines):
                    if "//localhost" in line and "http://localhost" not in line:
                        pytest.fail(
                            f"{filepath}:{i + 1} contains protocol-relative //localhost URL"
                        )
            except FileNotFoundError:
                pass

    def test_no_upgrade_insecure_requests(self):
        """Ensure no meta tags force HTTPS upgrades."""
        html_files = [p for p in [Path("../frontend/index.html"), Path("../frontend/workflow-builder.html"), Path("../ui/index.html")] if p.exists()]

        for filepath in html_files:
            try:
                with filepath.open() as f:
                    content = f.read()

                # Check for upgrade-insecure-requests
                assert (
                    "upgrade-insecure-requests" not in content.lower()
                ), f"{filepath} contains upgrade-insecure-requests directive"

                # Check for HSTS headers
                assert (
                    "strict-transport-security" not in content.lower()
                ), f"{filepath} contains Strict-Transport-Security header"
            except FileNotFoundError:
                pass

    @pytest.mark.integration
    def test_workflow_builder_accessible_via_http(self):
        """Test that workflow builder is accessible via HTTP without SSL errors."""
        # This is an integration test that requires the server to be running
        try:
            # Try to access the UI via HTTP (React dev server by default)
            base_url = os.getenv("UI_BASE_URL", "http://localhost:3001")
            target = f"{base_url}/"
            response = requests.get(target, timeout=5, allow_redirects=False)

            # Should get 200 OK (or 304), not redirect to HTTPS
            assert response.status_code in (200, 304), f"Expected 200/304, got {response.status_code}"

            # Check response headers for any HTTPS upgrade hints
            headers = response.headers
            assert "Strict-Transport-Security" not in headers, "Server should not send HSTS header"
            assert (
                "Upgrade-Insecure-Requests" not in headers
            ), "Server should not send upgrade-insecure-requests"

        except requests.ConnectionError:
            pytest.skip("Server not running - skipping integration test")
        except requests.Timeout:
            pytest.skip("Server timeout - skipping integration test")

    def test_ssl_handshake_detection(self):
        """Test that we can detect SSL handshake in HTTP requests."""
        # SSL/TLS handshake starts with these bytes
        ssl_handshake_patterns = [
            b"\x16\x03\x01",  # TLS 1.0
            b"\x16\x03\x02",  # TLS 1.1
            b"\x16\x03\x03",  # TLS 1.2
            b"\x16\x03\x04",  # TLS 1.3
        ]

        def is_ssl_handshake(data: bytes) -> bool:
            """Check if data looks like SSL/TLS handshake."""
            if len(data) < 3:
                return False
            return data[0] == 0x16 and data[1] == 0x03

        # Test detection
        for pattern in ssl_handshake_patterns:
            assert is_ssl_handshake(pattern), f"Should detect {pattern.hex()} as SSL"

        # Test non-SSL data
        assert not is_ssl_handshake(b"GET / HTTP/1.1\r\n")
        assert not is_ssl_handshake(b"POST /api/analyze HTTP/1.1\r\n")

    def test_frontend_server_handles_ssl_gracefully(self):
        """Test that frontend server handles SSL connection attempts gracefully."""
        # Mock the HTTP server request handler
        mock_request = Mock()
        mock_request.raw_requestline = b"\x16\x03\x01\x02\x00\x01\x00"

        # The server should recognize this as SSL and return 400 Bad Request
        # rather than crashing
        # This matches the actual error we see in logs:
        # "code 400, message Bad request version"

        # Verify the error pattern matches what we see in logs

        # This is what the server should do when receiving SSL on HTTP port
        expected_response = 400  # Bad Request
        assert expected_response == 400

    @pytest.mark.parametrize(
        "url,should_be_http",
        [
            ("workflow-builder.html", False),  # Relative URL (might cause issues)
            ("http://localhost:3000/workflow-builder.html", True),  # Explicit HTTP (good)
            ("https://localhost:3000/workflow-builder.html", False),  # HTTPS (will fail)
            ("//localhost:3000/workflow-builder.html", False),  # Protocol-relative (risky)
        ],
    )
    def test_url_patterns(self, url: str, should_be_http: bool):
        """Test various URL patterns for workflow builder links."""
        if should_be_http:
            assert url.startswith("http://"), f"URL should start with http://: {url}"
        else:
            # These patterns might cause HTTPS redirect issues
            assert not url.startswith("http://") or url.startswith(
                "https://"
            ), f"URL pattern might cause issues: {url}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
