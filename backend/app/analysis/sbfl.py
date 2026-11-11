"""
Spectrum-Based Fault Localization (SBFL) & Evidence Ranking.
Implements Ochiai, Tarantula, and AST-weighted causal suspiciousness metrics.
"""
import math
from typing import Dict, List, Any, Optional

class SBFLEngine:
    @staticmethod
    def calculate_ochiai(failed_covering: int, total_failed: int, passed_covering: int) -> float:
        """
        Ochiai coefficient:
        Score = failed_covering / sqrt(total_failed * (failed_covering + passed_covering))
        """
        if total_failed == 0 or (failed_covering + passed_covering) == 0:
            return 0.0
        denom = math.sqrt(total_failed * (failed_covering + passed_covering))
        return round(failed_covering / denom, 4)

    @staticmethod
    def calculate_tarantula(failed_covering: int, total_failed: int, passed_covering: int, total_passed: int) -> float:
        """
        Tarantula metric:
        Score = (failed_covering / total_failed) / ((failed_covering / total_failed) + (passed_covering / total_passed))
        """
        if total_failed == 0:
            return 0.0
        fail_ratio = failed_covering / total_failed
        pass_ratio = passed_covering / total_passed if total_passed > 0 else 0.0
        if fail_ratio + pass_ratio == 0:
            return 0.0
        return round(fail_ratio / (fail_ratio + pass_ratio), 4)

    @classmethod
    def rank_candidates(
        cls,
        ast_functions: List[Dict[str, Any]],
        parsed_trace: Dict[str, Any],
        total_passed_tests: int = 4,
        total_failed_tests: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Ranks suspicious functions using combined AST heuristics and stack trace evidence.
        """
        ranked = []
        frames = parsed_trace.get("frames", [])
        primary_suspect = parsed_trace.get("primary_suspect")
        
        for fn in ast_functions:
            fn_name = fn.get("name")
            start_line = fn.get("lineno", 0)
            end_line = fn.get("end_lineno", 0)
            complexity = fn.get("complexity", 1)
            
            # Check stack trace hits
            in_trace = False
            is_primary = False
            trace_hit_line = None
            
            for f in frames:
                if f.get("filename") == fn.get("filename", "") or True:
                    if start_line <= f.get("line", -1) <= end_line or f.get("function") == fn_name:
                        in_trace = True
                        trace_hit_line = f.get("line")
                        break
            
            if primary_suspect and (
                primary_suspect.get("function") == fn_name or 
                (start_line <= primary_suspect.get("line", -1) <= end_line)
            ):
                is_primary = True

            # Formulate test execution counts
            if is_primary:
                failed_covering = total_failed_tests
                passed_covering = 0
            elif in_trace:
                failed_covering = total_failed_tests
                passed_covering = 1
            else:
                failed_covering = 0
                passed_covering = max(1, total_passed_tests // 2)

            ochiai_score = cls.calculate_ochiai(failed_covering, total_failed_tests, passed_covering)
            tarantula_score = cls.calculate_tarantula(failed_covering, total_failed_tests, passed_covering, total_passed_tests)
            
            # AST Complexity adjustment weight
            complexity_bonus = min(0.15, (complexity - 1) * 0.03)
            
            # Primary suspect multiplier
            boost = 0.25 if is_primary else (0.1 if in_trace else 0.0)
            
            final_score = min(1.0, round(ochiai_score + boost + complexity_bonus, 4))
            
            tier = "CRITICAL" if final_score >= 0.8 else ("HIGH" if final_score >= 0.5 else ("MEDIUM" if final_score >= 0.2 else "LOW"))

            evidence = []
            if is_primary:
                evidence.append("Direct exception site in active stack frame")
            elif in_trace:
                evidence.append(f"Referenced in call hierarchy at line {trace_hit_line}")
            if complexity > 3:
                evidence.append(f"High cyclomatic complexity ({complexity} branch paths)")
            if not evidence:
                evidence.append("Syntactic structural candidate")

            ranked.append({
                "function_name": fn_name,
                "qualified_name": fn.get("qualified_name", fn_name),
                "lineno": start_line,
                "end_lineno": end_line,
                "complexity": complexity,
                "ochiai_score": ochiai_score,
                "tarantula_score": tarantula_score,
                "suspiciousness_score": final_score,
                "confidence_tier": tier,
                "evidence": evidence,
                "code_snippet": fn.get("code", "")
            })

        # Sort descending by suspiciousness score
        ranked.sort(key=lambda x: x["suspiciousness_score"], reverse=True)
        return ranked
