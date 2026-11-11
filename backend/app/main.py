"""
TraceFix Research - FastAPI Application Entrypoint
Evidence-Driven AI Debugging with Causal Verification
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_async_db, async_session_maker, Repository, BenchmarkTask
from .benchmarks.suite import BUILTIN_BENCHMARKS
from .routers import (
    dashboard,
    repositories,
    investigation,
    repair,
    verification,
    benchmarks,
    experiments,
    reports,
    settings as settings_router
)
from sqlalchemy import select
import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    await init_async_db()

    # Auto-seed sample repositories and benchmark tasks
    async with async_session_maker() as db:
        # Check repos – only seed on filesystem that has sample_repositories
        repo_res = await db.execute(select(Repository))
        if not repo_res.scalars().first() and settings.SAMPLE_REPOS_DIR.exists():
            for sample_dir in settings.SAMPLE_REPOS_DIR.iterdir():
                if sample_dir.is_dir():
                    py_files = list(sample_dir.glob("**/*.py"))
                    total_lines = sum(
                        len(f.read_text(encoding="utf-8", errors="ignore").splitlines())
                        for f in py_files
                    )
                    repo = Repository(
                        name=sample_dir.name,
                        path=str(sample_dir),
                        is_sample=True,
                        file_count=len(py_files),
                        total_lines=total_lines,
                        structure_summary={"python_files": len(py_files)}
                    )
                    db.add(repo)

        # Check benchmarks
        bench_res = await db.execute(select(BenchmarkTask))
        if not bench_res.scalars().first():
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

    yield


app = FastAPI(
    title="TraceFix Research API",
    description="Evidence-Driven AI Debugging with Causal Verification",
    version="1.0.0",
    lifespan=lifespan
)

# ─── CORS ──────────────────────────────────────────────────────────────────
# In production set ALLOWED_ORIGINS="https://your-site.netlify.app"
# Multiple origins can be comma-separated: "https://a.com,https://b.com"
_raw_origins = settings.ALLOWED_ORIGINS.strip()
if _raw_origins == "*":
    _origins = ["*"]
else:
    _origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=(_raw_origins != "*"),  # credentials only when origins are specific
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dashboard.router,       prefix=settings.API_PREFIX)
app.include_router(repositories.router,    prefix=settings.API_PREFIX)
app.include_router(investigation.router,   prefix=settings.API_PREFIX)
app.include_router(repair.router,          prefix=settings.API_PREFIX)
app.include_router(verification.router,    prefix=settings.API_PREFIX)
app.include_router(benchmarks.router,      prefix=settings.API_PREFIX)
app.include_router(experiments.router,     prefix=settings.API_PREFIX)
app.include_router(reports.router,         prefix=settings.API_PREFIX)
app.include_router(settings_router.router, prefix=settings.API_PREFIX)


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "storage_root": str(settings.PROJECT_ROOT),
        "default_provider": settings.DEFAULT_PROVIDER,
        "cors_origins": _origins,
    }
