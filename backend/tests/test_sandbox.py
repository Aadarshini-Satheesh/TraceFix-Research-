"""
Unit tests for TraceFix Sandbox Execution Engine.
"""
from pathlib import Path
from app.sandbox.runner import TestSandbox
from app.config import settings
from app.repair.mock_engine import MockAIEngine

def test_sandbox_runs_passing_tests():
    sample_repo = settings.SAMPLE_REPOS_DIR / "math_stats"
    res = TestSandbox.run_tests(
        repo_path=sample_repo,
        test_file="tests/test_metrics.py"
    )
    assert res.success is True
    assert res.passed_count >= 3
    assert res.failed_count == 0

def test_sandbox_catches_reproduction_failure():
    sample_repo = settings.SAMPLE_REPOS_DIR / "math_stats"
    res = TestSandbox.run_tests(
        repo_path=sample_repo,
        test_file="tests/test_reproduce_percentile.py"
    )
    # The unpatched code MUST fail this reproduction test!
    assert res.failed_count > 0 or res.error_count > 0 or res.exit_code != 0

def test_sandbox_applies_patch_without_mutating_source():
    sample_repo = settings.SAMPLE_REPOS_DIR / "math_stats"
    target_file = sample_repo / "stats" / "metrics.py"
    original_mtime = target_file.stat().st_mtime
    original_code = target_file.read_text(encoding="utf-8")

    # Generate full proposed patch from MockAIEngine
    patch_data = MockAIEngine.get_known_patch("math_stats", original_code, method="proposed")
    
    res = TestSandbox.run_tests(
        repo_path=sample_repo,
        test_file="tests/test_reproduce_percentile.py",
        patch_file="stats/metrics.py",
        patch_content=patch_data["modified_code"]
    )
    # With complete verified patch applied to sandbox, reproduction test passes!
    assert res.success is True, f"Pytest failed with stdout: {res.stdout}, stderr: {res.stderr}"
    # Verify original file was NEVER mutated
    assert target_file.stat().st_mtime == original_mtime
