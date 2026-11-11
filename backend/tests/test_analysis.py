"""
Unit tests for TraceFix AST and Stack Trace Analysis.
"""
from pathlib import Path
from app.analysis.ast_engine import ASTAnalyzer
from app.analysis.stack_parser import StackTraceParser
from app.analysis.sbfl import SBFLEngine
from app.config import settings

def test_ast_analyzer_valid_file():
    target = settings.SAMPLE_REPOS_DIR / "math_stats" / "stats" / "metrics.py"
    res = ASTAnalyzer.parse_file(target)
    assert res["syntax_valid"] is True
    assert len(res["functions"]) >= 3
    func_names = [f["name"] for f in res["functions"]]
    assert "calculate_mean" in func_names
    assert "calculate_percentile" in func_names

def test_ast_syntax_validator():
    valid_code = "def foo(x):\n    return x + 1\n"
    assert ASTAnalyzer.validate_syntax(valid_code)["valid"] is True
    
    invalid_code = "def foo(x:\n    return x +\n"
    assert ASTAnalyzer.validate_syntax(invalid_code)["valid"] is False

def test_stack_trace_parser():
    raw_trace = """Traceback (most recent call last):
  File "stats/metrics.py", line 42, in calculate_percentile
    return sorted_vals[floor_idx] * (1.0 - weight) + sorted_vals[ceil_idx] * weight
IndexError: list index out of range"""

    parsed = StackTraceParser.parse_traceback(raw_trace)
    assert parsed["has_trace"] is True
    assert parsed["exception_type"] == "IndexError"
    assert parsed["primary_suspect"]["function"] == "calculate_percentile"
    assert parsed["primary_suspect"]["line"] == 42

def test_sbfl_ranking():
    functions = [
        {"name": "calculate_mean", "lineno": 9, "end_lineno": 13, "complexity": 2},
        {"name": "calculate_percentile", "lineno": 20, "end_lineno": 43, "complexity": 4}
    ]
    parsed_trace = {
        "frames": [{"function": "calculate_percentile", "line": 42}],
        "primary_suspect": {"function": "calculate_percentile", "line": 42}
    }
    ranked = SBFLEngine.rank_candidates(functions, parsed_trace)
    assert len(ranked) == 2
    assert ranked[0]["function_name"] == "calculate_percentile"
    assert ranked[0]["suspiciousness_score"] > ranked[1]["suspiciousness_score"]
