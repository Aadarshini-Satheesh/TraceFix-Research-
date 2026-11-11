"""
Benchmarks Router for TraceFix Research.
Manages built-in benchmark tasks and SWE-bench Lite imports.
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, List, Any
from ..database import get_db, BenchmarkTask
from ..benchmarks.suite import BUILTIN_BENCHMARKS, BenchmarkManager

router = APIRouter(prefix="/benchmarks", tags=["Benchmarks"])

@router.get("/tasks")
async def list_benchmark_tasks(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    result = await db.execute(select(BenchmarkTask))
    tasks = result.scalars().all()
    
    # Auto-seed if empty
    if not tasks:
        for b in BUILTIN_BENCHMARKS:
            task_obj = BenchmarkTask(
                task_id=b["task_id"],
                repo_name=b["repo_name"],
                title=b["title"],
                category=b["category"],
                difficulty=b["difficulty"],
                bug_description=b["bug_description"],
                target_file=b["target_file"],
                failing_test_file=b["failing_test_file"],
                failing_test_code=b["failing_test_code"]
            )
            db.add(task_obj)
        await db.commit()
        result = await db.execute(select(BenchmarkTask))
        tasks = result.scalars().all()

    return [
        {
            "id": t.id,
            "task_id": t.task_id,
            "repo_name": t.repo_name,
            "title": t.title,
            "category": t.category,
            "difficulty": t.difficulty,
            "bug_description": t.bug_description,
            "target_file": t.target_file,
            "failing_test_file": t.failing_test_file,
            "failing_test_code": t.failing_test_code
        }
        for t in tasks
    ]

@router.post("/import")
async def import_benchmarks(payload: List[Dict[str, Any]] = Body(...), db: AsyncSession = Depends(get_db)):
    parsed_tasks = BenchmarkManager.parse_swe_bench_lite(payload)
    count = 0
    for p in parsed_tasks:
        task_obj = BenchmarkTask(
            task_id=p["task_id"],
            repo_name=p["repo_name"],
            title=p["title"],
            category=p["category"],
            difficulty=p["difficulty"],
            bug_description=p["bug_description"],
            target_file=p["target_file"],
            failing_test_file=p["failing_test_file"],
            failing_test_code=p["failing_test_code"]
        )
        db.add(task_obj)
        count += 1
    await db.commit()
    return {"status": "success", "imported_count": count}
