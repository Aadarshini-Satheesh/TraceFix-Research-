"""
Causal Verification Router for TraceFix Research.
Enforces the Regression-Test-First protocol and Dual-Gate Sandbox Verification.
"""
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Dict, List, Any, Optional
from ..database import get_db, DebuggingSession, TestCase, Patch, VerificationResult
from ..sandbox.runner import TestSandbox
from ..config import settings

router = APIRouter(prefix="/verification", tags=["Verification"])

class TestFirstRequest(BaseModel):
    session_id: int
    test_id: Optional[int] = None
    custom_test_code: Optional[str] = None
    test_file_path: Optional[str] = None

class VerifyPatchRequest(BaseModel):
    patch_id: int
    reproduction_test_file: Optional[str] = None

@router.post("/test-first")
async def run_pre_repair_test(req: TestFirstRequest, db: AsyncSession = Depends(get_db)):
    """
    Executes the candidate reproduction test BEFORE repair.
    Causal Principle: If the test does not fail on the original code,
    it cannot serve as valid causal evidence of the bug!
    """
    session = await db.get(DebuggingSession, req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    repo = await db.get(session.repository.__class__, session.repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    repo_path = Path(repo.path)
    test_file = req.test_file_path

    # If custom test code is provided, save or locate it
    if req.custom_test_code and not test_file:
        # Determine test filename
        test_file = "tests/test_reproduce_dynamic.py"
        target_path = repo_path / test_file
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_text(req.custom_test_code, encoding="utf-8")

    # Run in sandbox without patch
    sandbox_result = TestSandbox.run_tests(
        repo_path=repo_path,
        test_file=test_file
    )

    # In Causal APR, pre-repair test MUST FAIL to reproduce the bug
    test_failed = (sandbox_result.exit_code != 0 or sandbox_result.failed_count > 0)
    status_label = "FAILED" if test_failed else "PASSED"
    causal_status = "REPRODUCTION_CONFIRMED" if test_failed else "REPRODUCTION_INVALID_PASSED"

    # Update or create test case in DB
    if req.test_id:
        tc = await db.get(TestCase, req.test_id)
        if tc:
            tc.pre_repair_status = status_label
            tc.pre_repair_output = sandbox_result.stdout + "\n" + sandbox_result.stderr
            tc.pre_repair_duration_ms = sandbox_result.duration_ms
    else:
        tc = TestCase(
            session_id=session.id,
            name=Path(test_file).name if test_file else "reproduce_test",
            code=req.custom_test_code or (repo_path / test_file).read_text(encoding="utf-8", errors="ignore") if test_file and (repo_path / test_file).exists() else "",
            is_reproduction=True,
            pre_repair_status=status_label,
            pre_repair_output=sandbox_result.stdout + "\n" + sandbox_result.stderr,
            pre_repair_duration_ms=sandbox_result.duration_ms
        )
        db.add(tc)

    session.status = "TEST_CONFIRMED" if test_failed else "TEST_FAILED_TO_REPRODUCE"
    await db.commit()

    return {
        "session_id": session.id,
        "causal_status": causal_status,
        "pre_repair_test_failed": test_failed,
        "exit_code": sandbox_result.exit_code,
        "passed_count": sandbox_result.passed_count,
        "failed_count": sandbox_result.failed_count,
        "duration_ms": sandbox_result.duration_ms,
        "stdout": sandbox_result.stdout,
        "stderr": sandbox_result.stderr,
        "message": "Causal reproduction successful: test failed as expected prior to repair." if test_failed else "Warning: test passed on original code; does not reproduce the bug."
    }

@router.post("/verify-patch")
async def verify_patch(req: VerifyPatchRequest, db: AsyncSession = Depends(get_db)):
    """
    Dual-Gate Sandbox Verification:
    Gate 1: Reproduction test passes with patch applied.
    Gate 2: Entire existing test suite passes with zero regressions.
    """
    result = await db.execute(
        select(Patch)
        .where(Patch.id == req.patch_id)
        .options(selectinload(Patch.session).selectinload(DebuggingSession.repository))
    )
    patch = result.scalar_one_or_none()
    if not patch:
        raise HTTPException(status_code=404, detail="Patch not found")

    session = patch.session
    repo_path = Path(session.repository.path)

    # Execute sandbox run with patch applied
    sandbox_res = TestSandbox.run_tests(
        repo_path=repo_path,
        patch_file=patch.target_file,
        patch_content=patch.modified_code
    )

    repro_passed = (sandbox_res.exit_code == 0 and sandbox_res.failed_count == 0)
    regression_detected = (sandbox_res.failed_count > 0 or sandbox_res.error_count > 0)

    if sandbox_res.timed_out:
        status = "TIMEOUT"
    elif repro_passed and not regression_detected:
        status = "VERIFIED_SUCCESS"
    elif regression_detected:
        status = "REGRESSION_DETECTED"
    else:
        status = "REPRODUCTION_FAILED"

    # Save verification result
    verif = VerificationResult(
        patch_id=patch.id,
        status=status,
        reproduction_test_passed=repro_passed,
        regression_tests_passed=not regression_detected,
        total_tests_run=sandbox_res.total_count,
        tests_passed_count=sandbox_res.passed_count,
        tests_failed_count=sandbox_res.failed_count,
        test_suite_details=sandbox_res.test_details,
        raw_logs=sandbox_res.stdout + "\n" + sandbox_res.stderr,
        execution_time_ms=sandbox_res.duration_ms
    )
    db.add(verif)
    session.status = "VERIFIED" if status == "VERIFIED_SUCCESS" else "FAILED"
    await db.commit()
    await db.refresh(verif)

    return {
        "verification_id": verif.id,
        "patch_id": patch.id,
        "status": status,
        "reproduction_test_passed": repro_passed,
        "regression_tests_passed": not regression_detected,
        "total_tests_run": sandbox_res.total_count,
        "passed_count": sandbox_res.passed_count,
        "failed_count": sandbox_res.failed_count,
        "execution_time_ms": sandbox_res.duration_ms,
        "test_details": sandbox_res.test_details,
        "logs": sandbox_res.stdout + "\n" + sandbox_res.stderr
    }
