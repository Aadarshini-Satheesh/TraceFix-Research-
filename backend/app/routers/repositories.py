"""
Repositories Router for TraceFix Research.
Handles repository uploading, local linking, file-tree generation, and AST file inspection.
"""
import os
import zipfile
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, List, Any, Optional
from ..database import get_db, Repository
from ..config import settings
from ..analysis.ast_engine import ASTAnalyzer

router = APIRouter(prefix="/repositories", tags=["Repositories"])

def get_file_tree(directory: Path, base_dir: Path) -> List[Dict[str, Any]]:
    tree = []
    try:
        entries = sorted(os.scandir(directory), key=lambda e: (not e.is_dir(), e.name.lower()))
        for entry in entries:
            if entry.name in [".git", "__pycache__", ".pytest_cache", "venv", ".cache"]:
                continue
            rel_path = Path(entry.path).relative_to(base_dir).as_posix()
            if entry.is_dir():
                tree.append({
                    "name": entry.name,
                    "path": rel_path,
                    "type": "directory",
                    "children": get_file_tree(Path(entry.path), base_dir)
                })
            else:
                tree.append({
                    "name": entry.name,
                    "path": rel_path,
                    "type": "file",
                    "size_bytes": entry.stat().st_size,
                    "is_python": entry.name.endswith(".py")
                })
    except Exception:
        pass
    return tree

@router.get("")
async def list_repositories(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    result = await db.execute(select(Repository).order_by(Repository.created_at.desc()))
    repos = result.scalars().all()
    
    # If no repos in DB yet, auto-seed with sample repos
    if not repos:
        for sample_dir in settings.SAMPLE_REPOS_DIR.iterdir():
            if sample_dir.is_dir():
                py_files = list(sample_dir.glob("**/*.py"))
                total_lines = 0
                for f in py_files:
                    try:
                        total_lines += len(f.read_text(encoding="utf-8", errors="ignore").splitlines())
                    except Exception:
                        pass

                new_repo = Repository(
                    name=sample_dir.name,
                    path=str(sample_dir),
                    is_sample=True,
                    file_count=len(py_files),
                    total_lines=total_lines,
                    structure_summary={"root": sample_dir.name, "python_files": len(py_files)}
                )
                db.add(new_repo)
        await db.commit()
        result = await db.execute(select(Repository).order_by(Repository.created_at.desc()))
        repos = result.scalars().all()

    return [
        {
            "id": r.id,
            "name": r.name,
            "path": r.path,
            "is_sample": r.is_sample,
            "file_count": r.file_count,
            "total_lines": r.total_lines,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in repos
    ]

@router.post("/upload")
async def upload_repository(
    file: Optional[UploadFile] = File(None),
    local_path: Optional[str] = Form(None),
    repo_name: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    if file:
        dest_name = repo_name or Path(file.filename or "repo.zip").stem
        extract_dir = settings.REPO_DIR / dest_name
        extract_dir.mkdir(parents=True, exist_ok=True)
        
        zip_temp = settings.TEMP_DIR / f"{dest_name}_{file.filename}"
        with open(zip_temp, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        with zipfile.ZipFile(zip_temp, "r") as zip_ref:
            zip_ref.extractall(extract_dir)
            
        target_path = extract_dir
    elif local_path:
        p = Path(local_path).resolve()
        if not p.exists() or not p.is_dir():
            raise HTTPException(status_code=400, detail="Local repository path does not exist")
        target_path = p
        dest_name = repo_name or p.name
    else:
        raise HTTPException(status_code=400, detail="Either zip file or local_path must be provided")

    # Analyze python files
    py_files = list(target_path.glob("**/*.py"))
    total_lines = 0
    for pf in py_files:
        try:
            total_lines += len(pf.read_text(encoding="utf-8", errors="ignore").splitlines())
        except Exception:
            pass

    repo = Repository(
        name=dest_name,
        path=str(target_path),
        is_sample=False,
        file_count=len(py_files),
        total_lines=total_lines,
        structure_summary={"root": dest_name, "python_files": len(py_files)}
    )
    db.add(repo)
    await db.commit()
    await db.refresh(repo)

    return {
        "id": repo.id,
        "name": repo.name,
        "path": repo.path,
        "file_count": repo.file_count,
        "total_lines": repo.total_lines
    }

@router.get("/{repo_id}/tree")
async def get_repository_tree(repo_id: int, db: AsyncSession = Depends(get_db)):
    repo = await db.get(Repository, repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    repo_path = Path(repo.path)
    if not repo_path.exists():
        raise HTTPException(status_code=404, detail="Repository folder not found on disk")
        
    tree = get_file_tree(repo_path, repo_path)
    return {"repo_id": repo_id, "name": repo.name, "tree": tree}

@router.get("/{repo_id}/file")
async def get_repository_file(repo_id: int, file_path: str, db: AsyncSession = Depends(get_db)):
    repo = await db.get(Repository, repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    target = Path(repo.path) / file_path
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    content = target.read_text(encoding="utf-8", errors="replace")
    ast_meta = None
    if file_path.endswith(".py"):
        ast_meta = ASTAnalyzer.parse_file(target)

    return {
        "file_path": file_path,
        "filename": target.name,
        "content": content,
        "lines_count": len(content.splitlines()),
        "ast": ast_meta
    }
