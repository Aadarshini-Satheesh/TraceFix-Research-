"""
End-to-End System Verification Script for TraceFix Research.
Tests full pipeline: seeding, AST analysis, pre-repair test confirmation,
causal patch generation, dual-gate sandbox verification, and report compilation.
"""
import asyncio
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import init_async_db, async_session_maker, Repository, BenchmarkTask
from app.benchmarks.suite import BUILTIN_BENCHMARKS
from app.config import settings
from app.analysis.ast_engine import ASTAnalyzer
from app.analysis.stack_parser import StackTraceParser
from app.analysis.sbfl import SBFLEngine
from app.sandbox.runner import TestSandbox
from app.repair.mock_engine import MockAIEngine
from app.experiments.runner import ExperimentRunner
from app.reports.generator import ReportGenerator

async def main():
    print("=" * 60)
    print("  TRACEFIX RESEARCH - END-TO-END VERIFICATION")
    print("=" * 60)
    
    # 1. Initialize Database
    print("\n[Step 1] Initializing SQLite database on E: drive...")
    await init_async_db()
    print("[OK] SQLite database initialized at:", settings.DATABASE_URL)

    # 2. Verify Sample Repositories
    print("\n[Step 2] Verifying bundled sample repositories...")
    sample_repos = list(settings.SAMPLE_REPOS_DIR.iterdir())
    print(f"[OK] Found {len(sample_repos)} sample repositories:")
    for r in sample_repos:
        if r.is_dir():
            print(f"   - {r.name}")

    # 3. Test AST Analysis on math_stats
    print("\n[Step 3] Testing AST parser on math_stats/stats/metrics.py...")
    target_file = settings.SAMPLE_REPOS_DIR / "math_stats" / "stats" / "metrics.py"
    ast_data = ASTAnalyzer.parse_file(target_file)
    assert ast_data["syntax_valid"] is True
    print(f"[OK] AST analysis successful: {len(ast_data['functions'])} functions parsed.")

    # 4. Test Stack Trace Parsing & SBFL
    print("\n[Step 4] Testing Stack Trace Parsing & Ochiai SBFL...")
    sample_trace = """Traceback (most recent call last):
  File "stats/metrics.py", line 42, in calculate_percentile
    return sorted_vals[floor_idx] * (1.0 - weight) + sorted_vals[ceil_idx] * weight
IndexError: list index out of range"""
    parsed_trace = StackTraceParser.parse_traceback(sample_trace)
    ranked = SBFLEngine.rank_candidates(ast_data["functions"], parsed_trace)
    top_culprit = ranked[0]
    print(f"[OK] Top suspicious symbol: '{top_culprit['function_name']}' (Ochiai score: {top_culprit['suspiciousness_score']})")
    assert top_culprit["function_name"] == "calculate_percentile"

    # 5. Enforce Causal Requirement 1: Pre-Repair Test MUST FAIL
    print("\n[Step 5] Enforcing Causal Condition 1: Reproduction Test Confirmation...")
    math_repo = settings.SAMPLE_REPOS_DIR / "math_stats"
    pre_res = TestSandbox.run_tests(
        repo_path=math_repo,
        test_file="tests/test_reproduce_percentile.py"
    )
    test_failed = (pre_res.exit_code != 0 or pre_res.failed_count > 0)
    print(f"[OK] Pre-repair test executed: Failed count = {pre_res.failed_count}, Exit code = {pre_res.exit_code}")
    assert test_failed is True, "Causal violation: Pre-repair test did not fail!"
    print("[OK] Causal Condition 1 SATISFIED: Reproduction failed as expected prior to repair.")

    # 6. Generate Causal Patch & Verify Dual-Gate Sandbox
    print("\n[Step 6] Generating Causal Patch & Running Dual-Gate Sandbox...")
    original_code = target_file.read_text(encoding="utf-8")
    patch_data = MockAIEngine.get_known_patch("math_stats", original_code, method="proposed")
    
    post_res = TestSandbox.run_tests(
        repo_path=math_repo,
        patch_file="stats/metrics.py",
        patch_content=patch_data["modified_code"]
    )
    print(f"[OK] Post-repair sandbox: Passed = {post_res.passed_count}, Failed = {post_res.failed_count}")
    assert post_res.success is True, f"Dual gate failed: {post_res.stdout}"
    print("[OK] Dual-Gate Verification SATISFIED: Reproduction passed and zero regressions detected.")

    # 7. Run A/B Experiment
    print("\n[Step 7] Running Controlled A/B Experiment...")
    exp_summary = await ExperimentRunner.run_controlled_experiment()
    print(f"[OK] Baseline Resolution Rate: {exp_summary['baseline']['resolution_rate_pct']}% (Regressions: {exp_summary['baseline']['regression_count']})")
    print(f"[OK] TraceFix Resolution Rate: {exp_summary['proposed']['resolution_rate_pct']}% (Regressions: {exp_summary['proposed']['regression_count']})")
    print(f"[OK] Causal Gain: +{exp_summary['causal_gain']['delta_resolution_pct']}% resolution gain, {exp_summary['causal_gain']['regression_reduction_pct']}% regression reduction.")

    # 8. Generate Academic Paper Report
    print("\n[Step 8] Compiling Academic Research Paper...")
    report_md = ReportGenerator.generate_markdown_report(exp_summary)
    assert len(report_md) > 500
    print(f"[OK] Research paper compiled ({len(report_md)} characters).")

    print("\n" + "=" * 60)
    print("  ALL END-TO-END VERIFICATION CHECKS PASSED (100% SUCCESS)!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
