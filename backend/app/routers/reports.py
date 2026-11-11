"""
Research Reports Router for TraceFix Research.
Generates academic papers with methodology, metrics, case studies, and export endpoints.
"""
from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
from ..database import get_db
from ..reports.generator import ReportGenerator
from ..experiments.runner import ExperimentRunner

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/latest")
async def get_latest_report(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    # Run a quick evaluation summary or use benchmark trial
    data = await ExperimentRunner.run_controlled_experiment()
    markdown = ReportGenerator.generate_markdown_report(data)
    html = ReportGenerator.generate_html_report(data)

    return {
        "title": "TraceFix: Evidence-Driven AI Program Repair with Causal Invariant Verification",
        "markdown": markdown,
        "html": html,
        "metrics_summary": data
    }

@router.get("/download/{format_type}")
async def download_report(format_type: str, db: AsyncSession = Depends(get_db)):
    data = await ExperimentRunner.run_controlled_experiment()
    if format_type.lower() == "html":
        content = ReportGenerator.generate_html_report(data)
        media_type = "text/html"
        filename = "tracefix_research_report.html"
    else:
        content = ReportGenerator.generate_markdown_report(data)
        media_type = "text/markdown"
        filename = "tracefix_research_report.md"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
