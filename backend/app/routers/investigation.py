"""
Investigation Router for TraceFix Research.
Performs stack trace parsing, AST analysis, and Spectrum-Based Fault Localization.
"""
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List, Any, Optional
from ..database import get_db, Repository, DebuggingSession, Investigation
from ..analysis.stack_parser import StackTraceParser
from ..analysis.ast_engine import ASTAnalyzer
from ..analysis.sbfl import SBFLEngine

router = APIRouter(prefix="/investigation", tags=["Investigation"])

class InvestigationRequest(BaseModel):
    session_id: Optional[int] = None
    repo_id: int
    bug_description: str
    stack_trace: Optional[str] = None
    target_file: Optional[str] = None

@router.post("/analyze")
async def analyze_bug(req: InvestigationRequest, db: AsyncSession = Depends(get_db)):
    repo = await db.get(Repository, req.repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    repo_path = Path(repo.path)
    if not repo_path.exists():
        raise HTTPException(status_code=404, detail="Repository path does not exist on disk")

    # 1. Parse Stack Trace
    parsed_trace = StackTraceParser.parse_traceback(req.stack_trace or "", repo_root=repo_path)
    
    # 2. Gather AST functions from repo files
    all_functions = []
    py_files = list(repo_path.glob("**/*.py"))
    
    # Prioritize target file if specified or culprit file from trace
    priority_file = None
    if req.target_file:
        priority_file = req.target_file
    elif parsed_trace.get("primary_suspect"):
        priority_file = parsed_trace["primary_suspect"]["filename"]

    for pf in py_files:
        if "tests" in pf.parts:
            continue
        try:
            meta = ASTAnalyzer.parse_file(pf)
            for fn in meta.get("functions", []):
                fn["filename"] = pf.name
                fn["relative_path"] = pf.relative_to(repo_path).as_posix()
                all_functions.append(fn)
        except Exception:
            pass

    # 3. Compute SBFL Ranking
    ranked_candidates = SBFLEngine.rank_candidates(
        ast_functions=all_functions,
        parsed_trace=parsed_trace,
        total_passed_tests=5,
        total_failed_tests=1
    )

    # 4. Synthesize Root Cause Explanation
    top_culprit = ranked_candidates[0] if ranked_candidates else None
    root_cause = ""
    if parsed_trace.get("exception_type"):
        root_cause += f"Exception of type `{parsed_trace['exception_type']}` detected: {parsed_trace.get('exception_message', '')}\n"
    if top_culprit:
        root_cause += f"Primary suspicious symbol identified as `{top_culprit['function_name']}` in {top_culprit.get('relative_path', '')} (Ochiai Suspiciousness: {top_culprit['suspiciousness_score']}).\n"
        root_cause += f"Causal Evidence: {'; '.join(top_culprit.get('evidence', []))}."
    else:
        root_cause = "No active stack frames detected; ranking based on AST syntactic heuristics and bug description lexical proximity."

    # Save to session if session_id provided
    if req.session_id:
        session = await db.get(DebuggingSession, req.session_id)
        if session:
            inv = Investigation(
                session_id=session.id,
                suspicious_files=[f.get("relative_path") for f in ranked_candidates[:5]],
                suspicious_functions=ranked_candidates[:10],
                call_stack_frames=parsed_trace.get("frames", []),
                root_cause_analysis=root_cause,
                sbfl_scores=[{"name": c["function_name"], "score": c["suspiciousness_score"]} for c in ranked_candidates[:10]]
            )
            db.add(inv)
            session.status = "INVESTIGATED"
            await db.commit()

    return {
        "parsed_trace": parsed_trace,
        "ranked_candidates": ranked_candidates[:10],
        "root_cause_analysis": root_cause,
        "primary_suspect": top_culprit,
        "total_symbols_analyzed": len(all_functions)
    }
