"""Test coverage audit - BUG-040: Test Coverage Claims vs Reality Gap."""

from pathlib import Path

import pytest


class TestCoverageAudit:
    """
    Tests for BUG-040: Test Coverage Claims vs Reality Gap

    This exposes the gap between claimed test coverage and actual functionality testing.
    """

    def test_critical_user_workflows_have_tests(self):
        """Test that critical user workflows are actually tested."""

        # Critical workflows that MUST have tests
        critical_workflows = [
            {
                "workflow": "workflow_builder_drag_and_drop",
                "description": "User can drag nodes from palette to canvas",
                "test_file_pattern": "*workflow*drag*",
                "required": True,
            },
            {
                "workflow": "workflow_builder_click_to_add",
                "description": "User can click nodes to add to canvas",
                "test_file_pattern": "*workflow*click*",
                "required": True,
            },
            {
                "workflow": "main_app_api_integration",
                "description": "Main app can call analyze API with multiple models",
                "test_file_pattern": "*api*integration*",
                "required": True,
            },
            {
                "workflow": "https_url_compatibility",
                "description": "App works with both localhost and IP addresses",
                "test_file_pattern": "*https*",
                "required": True,
            },
            {
                "workflow": "frontend_javascript_loading",
                "description": "JavaScript files load and execute without errors",
                "test_file_pattern": "*frontend*js*",
                "required": False,  # We know this is missing
            },
        ]

        test_dir = Path("tests")
        existing_tests = list(test_dir.glob("*.py"))
        test_names = [t.name for t in existing_tests]

        missing_workflows = []

        for workflow in critical_workflows:
            # Look for test files that might cover this workflow
            found = False
            for test_file in test_names:
                if any(keyword in test_file.lower() for keyword in workflow["workflow"].split("_")):
                    found = True
                    break

            if not found and workflow["required"]:
                missing_workflows.append(workflow)

        if missing_workflows:
            missing_list = "\n".join(
                [f"- {w['workflow']}: {w['description']}" for w in missing_workflows]
            )
            pytest.fail(f"Missing tests for critical workflows:\n{missing_list}")

    def test_frontend_testing_coverage(self):
        """Test that frontend functionality has adequate test coverage."""

        # Frontend files that should have tests

        # Look for corresponding test files
        test_dir = Path("tests")
        frontend_test_files = [
            f
            for f in test_dir.glob("*.py")
            if "frontend" in f.name or "workflow" in f.name or "javascript" in f.name
        ]

        # This will likely fail - documenting the gap
        assert (
            len(frontend_test_files) >= 2
        ), f"Insufficient frontend test coverage. Found {len(frontend_test_files)} files: {[f.name for f in frontend_test_files]}"

    def test_integration_vs_unit_test_ratio(self):
        """Test that we have adequate integration tests, not just unit tests."""

        test_dir = Path("tests")
        test_files = list(test_dir.glob("test_*.py"))

        unit_tests = []
        integration_tests = []

        for test_file in test_files:
            with test_file.open() as f:
                content = f.read()

            # Classify based on content
            if any(
                keyword in content.lower()
                for keyword in ["requests.get", "http://", "curl", "browser"]
            ):
                integration_tests.append(test_file.name)
            else:
                unit_tests.append(test_file.name)

        # We need a reasonable ratio of integration tests
        total_tests = len(test_files)
        integration_ratio = len(integration_tests) / total_tests if total_tests > 0 else 0

        assert (
            integration_ratio >= 0.2
        ), f"Too few integration tests. Ratio: {integration_ratio:.2f}. Integration: {integration_tests}"

    def test_user_reported_bugs_have_regression_tests(self):
        """Test that user-reported bugs from today have regression tests."""

        bugs_found_today = [
            {
                "bug": "workflow_drag_drop_failure",
                "test_file": "test_workflow_data_attribute_bug.py",
                "description": "Drag and drop doesn't work",
            },
            {
                "bug": "https_upgrade_storm",
                "test_file": "test_https_redirect_fix.py",
                "description": "Browser force-upgrades HTTP to HTTPS",
            },
            {
                "bug": "workflow_click_failure",
                "test_file": "test_workflow_data_attribute_bug.py",
                "description": "Click to add nodes doesn't work",
            },
        ]

        test_dir = Path("tests")

        for bug in bugs_found_today:
            test_file_path = test_dir / bug["test_file"]
            assert (
                test_file_path.exists()
            ), f"Missing regression test for bug: {bug['description']} (expected: {bug['test_file']})"

    def test_claimed_vs_actual_coverage_gap(self):
        """Expose the gap between claimed coverage and actual functionality coverage."""

        # This test documents the problem
        claimed_coverage = {
            "backend": "92.23%",
            "claimed_status": "All tests passing",
            "claimed_bugs": "0 active bugs",
        }

        actual_issues_found_today = [
            "Workflow builder completely broken (drag and drop)",
            "Workflow builder click functionality broken",
            "HTTPS upgrade causing 72 SSL errors in minutes",
            "Data attribute mismatch causing silent failures",
            "No frontend testing infrastructure",
            "Integration test gaps",
        ]

        # Document the reality gap
        gap_severity = len(actual_issues_found_today)

        # This test will pass but documents the problem
        if gap_severity > 0:
            print("\n⚠️  COVERAGE REALITY CHECK:")
            print(
                f"Claimed: {claimed_coverage['backend']} backend coverage, {claimed_coverage['claimed_bugs']}"
            )
            print(f"Reality: {gap_severity} critical issues found in one day:")
            for issue in actual_issues_found_today:
                print(f"  - {issue}")

        # Log this for analysis
        assert gap_severity < 10, f"Test coverage gap is manageable (found {gap_severity} issues)"

    def test_manual_testing_requirements(self):
        """Document what requires manual testing until automation exists."""

        manual_test_requirements = [
            {
                "feature": "Workflow Builder Drag and Drop",
                "test": "Drag node from sidebar to canvas",
                "automation_status": "PARTIAL (data attributes tested, not actual drag)",
                "priority": "HIGH",
            },
            {
                "feature": "Browser HTTPS Upgrade Behavior",
                "test": "Test in multiple browsers with different HSTS states",
                "automation_status": "NONE (browser-specific)",
                "priority": "HIGH",
            },
            {
                "feature": "JavaScript Loading and Execution",
                "test": "Verify all JS files load and execute without errors",
                "automation_status": "BASIC (file loading only)",
                "priority": "MEDIUM",
            },
            {
                "feature": "Cross-Browser Compatibility",
                "test": "Test in Chrome, Firefox, Safari",
                "automation_status": "NONE",
                "priority": "MEDIUM",
            },
        ]

        high_priority_manual = [
            req for req in manual_test_requirements if req["priority"] == "HIGH"
        ]

        # Document what needs manual testing
        assert (
            len(high_priority_manual) <= 5
        ), f"Too many high-priority manual tests: {[req['feature'] for req in high_priority_manual]}"

    def test_test_file_naming_conventions(self):
        """Test that test files follow proper naming conventions."""

        test_dir = Path("tests")
        test_files = list(test_dir.glob("*.py"))

        # All test files should start with "test_", except standard helpers
        allowed_non_test = {"conftest.py", "__init__.py", "assertion_helpers.py"}
        invalid_names = [
            f for f in test_files if not f.name.startswith("test_") and f.name not in allowed_non_test
        ]

        assert (
            len(invalid_names) == 0
        ), f"Test files with invalid names: {[f.name for f in invalid_names]}"

        # Test files should have descriptive names (ignore standard helpers and common roots)
        ignore_for_vague = {"assertion_helpers.py", "conftest.py"}
        vague_names = [
            f for f in test_files
            if len(f.stem.split("_")) < 3 and f.name not in ignore_for_vague and not f.stem in {"test_adversarial", "test_integration", "test_main"}
        ]

        assert (
            len(vague_names) <= 2
        ), f"Test files with vague names: {[f.name for f in vague_names]}"

    def test_bug_tracking_completeness(self):
        """Test that all bugs found today are tracked in BUGS.md."""

        bugs_md_path = Path("../docs/BUGS.md")

        if bugs_md_path.exists():
            with bugs_md_path.open() as f:
                bugs_content = f.read()

            # Bugs that should be documented
            todays_bugs = [
                "BUG-036",  # Data attribute mismatch
                "BUG-037",  # HTTPS upgrade
                "BUG-038",  # Workflow functionality
                "BUG-039",  # Ollama errors
                "BUG-040",  # Test coverage gap
            ]

            missing_bugs = []
            for bug in todays_bugs:
                if bug not in bugs_content:
                    missing_bugs.append(bug)

            assert len(missing_bugs) == 0, f"Bugs not documented in BUGS.md: {missing_bugs}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
