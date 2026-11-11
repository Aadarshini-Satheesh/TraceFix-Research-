"""
Experiments Router for TraceFix Research.
Runs controlled Baseline vs Proposed APR trials and handles CSV/JSON export.
"""
import io
import csv
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Dict, List, Any, Optional
from ..database import get_db, Experiment, ExperimentRun
from ..experiments.runner import ExperimentRunner

router = APIRouter(prefix="/experiments", tags=["Experiments"])

class RunExperimentRequest(BaseModel):
    name: Optional[str] = "Controlled Evaluation Trial"
    task_ids: Optional[List[str]] = None
    provider: Optional[str] = "mock"
    model: Optional[str] = "mock-model"

@router.post("/run")
async def run_experiment(req: RunExperimentRequest, db: AsyncSession = Depends(get_db)):
    results = await ExperimentRunner.run_controlled_experiment(
        task_ids=req.task_ids,
        provider=req.provider or "mock",
        model=req.model or "mock-model"
    )

    baseline = results["baseline"]
    proposed = results["proposed"]

    exp = Experiment(
        name=req.name or "A/B Controlled Trial",
        description=f"Baseline vs Proposed TraceFix evaluation on {results['total_tasks']} tasks",
        status="COMPLETED",
        total_tasks=results["total_tasks"],
        baseline_resolved=baseline["resolved_count"],
        proposed_resolved=proposed["resolved_count"],
        baseline_regressions=baseline["regression_count"],
        proposed_regressions=proposed["regression_count"],
        baseline_avg_time_ms=baseline["avg_time_ms"],
        proposed_avg_time_ms=proposed["avg_time_ms"],
        baseline_avg_cost_usd=baseline["avg_cost_usd"],
        proposed_avg_cost_usd=proposed["avg_cost_usd"]
    )
    db.add(exp)
    await db.flush()

    # Save runs
    for r in baseline["runs"]:
        db.add(ExperimentRun(
            experiment_id=exp.id,
            task_id=r["task_id"],
            method="baseline",
            status=r["status"],
            reproduction_passed=r["reproduction_passed"],
            regression_passed=r["regression_passed"],
            time_ms=r["time_ms"],
            cost_usd=r["cost_usd"],
            token_usage=r["token_usage"]
        ))
    for r in proposed["runs"]:
        db.add(ExperimentRun(
            experiment_id=exp.id,
            task_id=r["task_id"],
            method="proposed",
            status=r["status"],
            reproduction_passed=r["reproduction_passed"],
            regression_passed=r["regression_passed"],
            time_ms=r["time_ms"],
            cost_usd=r["cost_usd"],
            token_usage=r["token_usage"]
        ))

    await db.commit()
    await db.refresh(exp)

    results["experiment_id"] = exp.id
    return results

@router.get("/history")
async def list_experiments(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Experiment).order_by(Experiment.created_at.desc()))
    exps = res.scalars().all()
    return [
        {
            "id": e.id,
            "name": e.name,
            "total_tasks": e.total_tasks,
            "baseline_resolved": e.baseline_resolved,
            "proposed_resolved": e.proposed_resolved,
            "baseline_regressions": e.baseline_regressions,
            "proposed_regressions": e.proposed_regressions,
            "baseline_avg_time_ms": e.baseline_avg_time_ms,
            "proposed_avg_time_ms": e.proposed_avg_time_ms,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in exps
    ]

@router.get("/export/csv")
async def export_experiments_csv(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(ExperimentRun).options(selectinload(ExperimentRun.experiment)).order_by(ExperimentRun.id.desc())
    )
    runs = res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Run_ID", "Experiment_ID", "Task_ID", "Method", "Status",
        "Reproduction_Passed", "Regression_Passed", "Time_MS", "Cost_USD", "Tokens"
    ])

    for r in runs:
        writer.writerow([
            r.id, r.experiment_id, r.task_id, r.method, r.status,
            r.reproduction_passed, r.regression_passed, r.time_ms, r.cost_usd, r.token_usage
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tracefix_experiment_runs.csv"}
    )
