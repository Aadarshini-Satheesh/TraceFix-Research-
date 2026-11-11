"""
Repair Workspace Router for TraceFix Research.
Handles session management, baseline vs proposed patch generation, and diff presentation.
"""
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Dict, List, Any, Optional
from ..database import get_db, DebuggingSession, Repository, Patch, TestCase, Investigation, VerificationResult
from ..repair.patch_generator import PatchGenerator
from ..config import settings

router = APIRouter(prefix="/repair", tags=["Repair"])

class CreateSessionRequest(BaseModel):
    repo_id: int
    title: str
    bug_description: str
    stack_trace: Optional[str] = None
    target_file: Optional[str] = None
    reproduction_test_code: Optional[str] = None

class GeneratePatchRequest(BaseModel):
    session_id: int
    method: str = "proposed" # "baseline" vs "proposed"
    target_file: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None

@router.post("/sessions")
async def create_session(req: CreateSessionRequest, db: AsyncSession = Depends(get_db)):
    repo = await db.get(Repository, req.repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    session = DebuggingSession(
        repo_id=repo.id,
        title=req.title,
        bug_description=req.bug_description,
        stack_trace=req.stack_trace,
        target_file=req.target_file,
        status="INIT"
    )
    db.add(session)
    await db.flush()

    # If reproduction test code provided, save it as test case
    if req.reproduction_test_code:
        test_case = TestCase(
            session_id=session.id,
            name="reproduce_bug",
            code=req.reproduction_test_code,
            is_reproduction=True,
            pre_repair_status="UNTESTED"
        )
        db.add(test_case)

    await db.commit()
    await db.refresh(session)
    return {"session_id": session.id, "title": session.title, "status": session.status}

@router.get("/sessions")
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DebuggingSession)
        .options(selectinload(DebuggingSession.repository))
        .order_by(DebuggingSession.created_at.desc())
    )
    sessions = result.scalars().all()
    return [
        {
            "id": s.id,
            "repo_id": s.repo_id,
            "repo_name": s.repository.name if s.repository else "Unknown",
            "title": s.title,
            "bug_description": s.bug_description,
            "status": s.status,
            "target_file": s.target_file,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in sessions
    ]

@router.get("/sessions/{session_id}")
async def get_session_details(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DebuggingSession)
        .where(DebuggingSession.id == session_id)
        .options(
            selectinload(DebuggingSession.repository),
            selectinload(DebuggingSession.investigation),
            selectinload(DebuggingSession.tests),
            selectinload(DebuggingSession.patches).selectinload(Patch.verification)
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Debugging session not found")

    return {
        "id": session.id,
        "repo_id": session.repo_id,
        "repo_name": session.repository.name if session.repository else "Unknown",
        "repo_path": session.repository.path if session.repository else None,
        "title": session.title,
        "bug_description": session.bug_description,
        "stack_trace": session.stack_trace,
        "target_file": session.target_file,
        "status": session.status,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "investigation": {
            "root_cause": session.investigation.root_cause_analysis,
            "suspicious_functions": session.investigation.suspicious_functions,
            "call_stack": session.investigation.call_stack_frames
        } if session.investigation else None,
        "tests": [
            {
                "id": t.id,
                "name": t.name,
                "code": t.code,
                "is_reproduction": t.is_reproduction,
                "pre_repair_status": t.pre_repair_status,
                "pre_repair_output": t.pre_repair_output,
                "pre_repair_duration_ms": t.pre_repair_duration_ms
            }
            for t in session.tests
        ],
        "patches": [
            {
                "id": p.id,
                "method": p.method,
                "target_file": p.target_file,
                "original_code": p.original_code,
                "modified_code": p.modified_code,
                "unified_diff": p.unified_diff,
                "explanation": p.explanation,
                "token_usage": p.token_usage,
                "cost_usd": p.cost_usd,
                "generation_time_ms": p.generation_time_ms,
                "verification": {
                    "status": p.verification.status,
                    "reproduction_test_passed": p.verification.reproduction_test_passed,
                    "regression_tests_passed": p.verification.regression_tests_passed,
                    "passed_count": p.verification.tests_passed_count,
                    "failed_count": p.verification.tests_failed_count,
                    "execution_time_ms": p.verification.execution_time_ms,
                    "raw_logs": p.verification.raw_logs
                } if p.verification else None
            }
            for p in session.patches
        ]
    }

@router.post("/generate-patch")
async def generate_patch(req: GeneratePatchRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DebuggingSession)
        .where(DebuggingSession.id == req.session_id)
        .options(
            selectinload(DebuggingSession.repository),
            selectinload(DebuggingSession.investigation),
            selectinload(DebuggingSession.tests)
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    repo_path = Path(session.repository.path)
    target_rel = req.target_file or session.target_file
    if not target_rel:
        # Fallback to first python file in repo
        py_files = list(repo_path.glob("**/*.py"))
        if not py_files:
            raise HTTPException(status_code=400, detail="No target python file specified")
        target_abs = py_files[0]
        target_rel = target_abs.relative_to(repo_path).as_posix()
    else:
        target_abs = repo_path / target_rel

    # Find reproduction test code if exists
    repro_code = None
    for t in session.tests:
        if t.is_reproduction:
            repro_code = t.code
            break

    suspicious_fns = session.investigation.suspicious_functions if session.investigation else None

    # Call patch generator
    patch_result = await PatchGenerator.generate_patch(
        target_file_path=target_abs,
        bug_description=session.bug_description,
        method=req.method,
        reproduction_test_code=repro_code,
        stack_trace=session.stack_trace,
        suspicious_functions=suspicious_fns,
        provider=req.provider,
        model=req.model
    )

    if "error" in patch_result and not patch_result.get("syntax_valid", True):
        raise HTTPException(status_code=422, detail=patch_result["error"])

    # Save to database
    patch_obj = Patch(
        session_id=session.id,
        method=req.method,
        target_file=target_rel,
        original_code=patch_result["original_code"],
        modified_code=patch_result["modified_code"],
        unified_diff=patch_result["unified_diff"],
        explanation=patch_result.get("explanation", ""),
        token_usage=patch_result.get("token_usage", 0),
        cost_usd=patch_result.get("cost_usd", 0.0),
        generation_time_ms=patch_result.get("generation_time_ms", 0.0)
    )
    db.add(patch_obj)
    session.status = "REPAIRED"
    await db.commit()
    await db.refresh(patch_obj)

    return {
        "patch_id": patch_obj.id,
        "method": patch_obj.method,
        "target_file": patch_obj.target_file,
        "original_code": patch_obj.original_code,
        "modified_code": patch_obj.modified_code,
        "unified_diff": patch_obj.unified_diff,
        "explanation": patch_obj.explanation,
        "token_usage": patch_obj.token_usage,
        "cost_usd": patch_obj.cost_usd,
        "generation_time_ms": patch_obj.generation_time_ms
    }
