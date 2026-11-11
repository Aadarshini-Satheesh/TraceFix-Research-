"""
Benchmark Suite & SWE-bench Lite Importer for TraceFix Research.
Includes 6 pre-bundled realistic Python debugging benchmarks with reproduction and regression suites.
"""
from typing import List, Dict, Any

BUILTIN_BENCHMARKS: List[Dict[str, Any]] = [
    {
        "task_id": "BENCH-01",
        "repo_name": "math_stats",
        "title": "IndexError on 100th Percentile & Boundary Ranks",
        "category": "boundary",
        "difficulty": "Medium",
        "bug_description": "calculate_percentile crashes with IndexError: list index out of range when requesting the 100th percentile or when input array has single element.",
        "target_file": "stats/metrics.py",
        "failing_test_file": "tests/test_reproduce_percentile.py",
        "failing_test_code": """def test_percentile_100th_boundary():
    result = calculate_percentile([10, 20, 30], 100)
    assert result == 30.0"""
    },
    {
        "task_id": "BENCH-02",
        "repo_name": "string_toolkit",
        "title": "Slugify Preserves Leading/Trailing Hyphens & Clutters Separators",
        "category": "regex",
        "difficulty": "Easy",
        "bug_description": "slugify fails to collapse consecutive delimiters and retains boundary punctuation on complex strings.",
        "target_file": "toolkit/formatter.py",
        "failing_test_file": "tests/test_reproduce_slugify.py",
        "failing_test_code": """def test_slugify_consecutive_separators_and_boundary_stripping():
    result = slugify("--- Hello, World!!! 2026 ---")
    assert result == "hello-world-2026" """
    },
    {
        "task_id": "BENCH-03",
        "repo_name": "data_cache",
        "title": "TypeError on Non-TTL Cache Retrieval",
        "category": "null_type",
        "difficulty": "Medium",
        "bug_description": "TimedLRUCache.get raises TypeError: '>' not supported between instances of 'float' and 'NoneType' when retrieving persistent keys with ttl=None.",
        "target_file": "cache/lru_cache.py",
        "failing_test_file": "tests/test_reproduce_cache.py",
        "failing_test_code": """def test_cache_without_ttl_reproduction():
    cache = TimedLRUCache(capacity=5)
    cache.set("persistent", "data-payload", ttl_seconds=None)
    assert cache.get("persistent") == "data-payload" """
    },
    {
        "task_id": "BENCH-04",
        "repo_name": "string_toolkit",
        "title": "Accented Unicode Characters Dropped Without Transliteration",
        "category": "unicode",
        "difficulty": "Hard",
        "bug_description": "slugify strips accented characters instead of normalizing accents into standard ascii equivalents.",
        "target_file": "toolkit/formatter.py",
        "failing_test_file": "tests/test_reproduce_slugify.py",
        "failing_test_code": """def test_slugify_accented_characters():
    result = slugify("Café au Lait & Thé")
    assert result == "cafe-au-lait-the" """
    },
    {
        "task_id": "BENCH-05",
        "repo_name": "math_stats",
        "title": "Single-Element Percentile Interpolation Failure",
        "category": "off_by_one",
        "difficulty": "Easy",
        "bug_description": "Single-element inputs to calculate_percentile fail to return the singleton value directly.",
        "target_file": "stats/metrics.py",
        "failing_test_file": "tests/test_reproduce_percentile.py",
        "failing_test_code": """def test_percentile_single_element():
    result = calculate_percentile([42.0], 50)
    assert result == 42.0"""
    },
    {
        "task_id": "BENCH-06",
        "repo_name": "data_cache",
        "title": "LRU Capacity Eviction of Oldest Unexpired Item",
        "category": "state_cache",
        "difficulty": "Hard",
        "bug_description": "TimedLRUCache incorrectly evicts recently updated keys under capacity pressure.",
        "target_file": "cache/lru_cache.py",
        "failing_test_file": "tests/test_cache.py",
        "failing_test_code": """def test_lru_eviction():
    cache = TimedLRUCache(capacity=2)
    cache.set("a", 1, ttl_seconds=60)
    cache.set("b", 2, ttl_seconds=60)
    cache.set("c", 3, ttl_seconds=60)
    assert cache.get("a") is None
    assert cache.get("b") == 2
    assert cache.get("c") == 3"""
    }
]

class BenchmarkManager:
    @staticmethod
    def get_all_tasks() -> List[Dict[str, Any]]:
        return BUILTIN_BENCHMARKS

    @staticmethod
    def parse_swe_bench_lite(json_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parses SWE-bench Lite json data into TraceFix benchmark schema."""
        tasks = []
        for item in json_data:
            tasks.append({
                "task_id": item.get("instance_id", "SWE-CUSTOM"),
                "repo_name": item.get("repo", "unknown_repo").split("/")[-1],
                "title": item.get("problem_statement", "")[:120] + "...",
                "category": "swe_bench_lite",
                "difficulty": "Challenging",
                "bug_description": item.get("problem_statement", ""),
                "target_file": item.get("patch", "").split("--- a/")[-1].split("\n")[0] if "--- a/" in item.get("patch", "") else "src/main.py",
                "failing_test_file": "tests/test_patch.py",
                "failing_test_code": item.get("test_patch", "")
            })
        return tasks
