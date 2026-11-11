"""
SQLAlchemy Models and SQLite Connection for TraceFix Research.
"""
import datetime
from typing import AsyncGenerator
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import create_engine
from .config import settings

Base = declarative_base()

class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    path = Column(String(1024), nullable=False)
    is_sample = Column(Boolean, default=False)
    file_count = Column(Integer, default=0)
    total_lines = Column(Integer, default=0)
    structure_summary = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    sessions = relationship("DebuggingSession", back_populates="repository", cascade="all, delete-orphan")

class DebuggingSession(Base):
    __tablename__ = "debugging_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    title = Column(String(255), nullable=False)
    bug_description = Column(Text, nullable=False)
    stack_trace = Column(Text, nullable=True)
    target_file = Column(String(512), nullable=True)
    status = Column(String(50), default="INIT") # INIT, INVESTIGATING, TEST_CONFIRMED, REPAIRED, VERIFIED, FAILED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    repository = relationship("Repository", back_populates="sessions")
    investigation = relationship("Investigation", back_populates="session", uselist=False, cascade="all, delete-orphan")
    tests = relationship("TestCase", back_populates="session", cascade="all, delete-orphan")
    patches = relationship("Patch", back_populates="session", cascade="all, delete-orphan")

class Investigation(Base):
    __tablename__ = "investigations"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("debugging_sessions.id"), nullable=False)
    suspicious_files = Column(JSON, nullable=True)
    suspicious_functions = Column(JSON, nullable=True)
    call_stack_frames = Column(JSON, nullable=True)
    root_cause_analysis = Column(Text, nullable=True)
    sbfl_scores = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("DebuggingSession", back_populates="investigation")

class TestCase(Base):
    __tablename__ = "test_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("debugging_sessions.id"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(Text, nullable=False)
    is_reproduction = Column(Boolean, default=True)
    pre_repair_status = Column(String(50), default="UNTESTED") # UNTESTED, PASSED, FAILED, ERROR
    pre_repair_output = Column(Text, nullable=True)
    pre_repair_duration_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("DebuggingSession", back_populates="tests")

class Patch(Base):
    __tablename__ = "patches"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("debugging_sessions.id"), nullable=False)
    method = Column(String(50), nullable=False) # "baseline" vs "proposed"
    target_file = Column(String(512), nullable=False)
    original_code = Column(Text, nullable=False)
    modified_code = Column(Text, nullable=False)
    unified_diff = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    token_usage = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)
    generation_time_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("DebuggingSession", back_populates="patches")
    verification = relationship("VerificationResult", back_populates="patch", uselist=False, cascade="all, delete-orphan")

class VerificationResult(Base):
    __tablename__ = "verification_results"
    
    id = Column(Integer, primary_key=True, index=True)
    patch_id = Column(Integer, ForeignKey("patches.id"), nullable=False)
    status = Column(String(50), nullable=False) # "VERIFIED_SUCCESS", "REPRODUCTION_FAILED", "REGRESSION_DETECTED", "SYNTAX_ERROR", "TIMEOUT"
    reproduction_test_passed = Column(Boolean, default=False)
    regression_tests_passed = Column(Boolean, default=False)
    total_tests_run = Column(Integer, default=0)
    tests_passed_count = Column(Integer, default=0)
    tests_failed_count = Column(Integer, default=0)
    test_suite_details = Column(JSON, nullable=True)
    raw_logs = Column(Text, nullable=True)
    execution_time_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    patch = relationship("Patch", back_populates="verification")

class BenchmarkTask(Base):
    __tablename__ = "benchmark_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String(100), unique=True, nullable=False)
    repo_name = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False) # "boundary", "null_type", "regex", "state_cache", "off_by_one"
    difficulty = Column(String(50), default="Medium")
    bug_description = Column(Text, nullable=False)
    target_file = Column(String(512), nullable=False)
    failing_test_code = Column(Text, nullable=False)
    failing_test_file = Column(String(512), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Experiment(Base):
    __tablename__ = "experiments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="COMPLETED") # RUNNING, COMPLETED, FAILED
    total_tasks = Column(Integer, default=0)
    baseline_resolved = Column(Integer, default=0)
    proposed_resolved = Column(Integer, default=0)
    baseline_regressions = Column(Integer, default=0)
    proposed_regressions = Column(Integer, default=0)
    baseline_avg_time_ms = Column(Float, default=0.0)
    proposed_avg_time_ms = Column(Float, default=0.0)
    baseline_avg_cost_usd = Column(Float, default=0.0)
    proposed_avg_cost_usd = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    runs = relationship("ExperimentRun", back_populates="experiment", cascade="all, delete-orphan")

class ExperimentRun(Base):
    __tablename__ = "experiment_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"), nullable=False)
    task_id = Column(String(100), nullable=False)
    method = Column(String(50), nullable=False) # "baseline" vs "proposed"
    status = Column(String(50), nullable=False) # "SUCCESS", "REPRO_FAILED", "REGRESSED", "TIMEOUT", "ERROR"
    reproduction_passed = Column(Boolean, default=False)
    regression_passed = Column(Boolean, default=False)
    time_ms = Column(Float, default=0.0)
    cost_usd = Column(Float, default=0.0)
    token_usage = Column(Integer, default=0)
    diff_snippet = Column(Text, nullable=True)
    logs = Column(Text, nullable=True)
    
    experiment = relationship("Experiment", back_populates="runs")

class SystemSetting(Base):
    __tablename__ = "system_settings"
    
    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

# Database Engines & Session Makers
async_engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

def init_sync_db():
    sync_engine = create_engine(settings.SYNC_DATABASE_URL, echo=False)
    Base.metadata.create_all(sync_engine)

async def init_async_db():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
