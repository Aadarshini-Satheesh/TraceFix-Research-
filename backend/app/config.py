"""
TraceFix Research Backend Configuration
Platform-agnostic: works on Windows (E: drive) and Linux (Render/Docker).
All paths are resolved from environment variables or sensible defaults.
"""
import os
import sys
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# ─── Platform-aware Storage Root ─────────────────────────────────────────────
# On Render/Linux: use /opt/render/project/src or DATA_ROOT env var
# On Windows dev:  use E:/Projects/TraceFix-Research
_IS_WINDOWS = sys.platform == "win32"

def _resolve_project_root() -> Path:
    """Return the project root directory, platform-aware."""
    env_root = os.environ.get("DATA_ROOT")
    if env_root:
        return Path(env_root).resolve()
    if _IS_WINDOWS:
        return Path("E:/Projects/TraceFix-Research").resolve()
    # Linux / Docker: use /app/data as persistent storage root
    return Path("/app/data").resolve()

PROJECT_ROOT = _resolve_project_root()
CACHE_DIR    = PROJECT_ROOT / ".cache"
TEMP_DIR     = CACHE_DIR / "temp"
SANDBOX_DIR  = CACHE_DIR / "sandbox_runs"
DATA_DIR     = PROJECT_ROOT / "app_data"
REPO_DIR     = DATA_DIR / "repositories"
SAMPLE_REPOS_DIR = Path(os.environ.get("SAMPLE_REPOS_DIR", "")).resolve() if os.environ.get("SAMPLE_REPOS_DIR") else (
    Path("E:/Projects/TraceFix-Research/sample_repositories").resolve() if _IS_WINDOWS
    else Path("/app/sample_repositories").resolve()
)

# Ensure all critical storage directories exist
for _dir in [CACHE_DIR, TEMP_DIR, SANDBOX_DIR, DATA_DIR, REPO_DIR]:
    _dir.mkdir(parents=True, exist_ok=True)

# Set temp environment variables for child processes (Windows only)
if _IS_WINDOWS:
    os.environ.setdefault("TEMP", str(TEMP_DIR))
    os.environ.setdefault("TMP", str(TEMP_DIR))
    os.environ.setdefault("PIP_CACHE_DIR", str(CACHE_DIR / "pip"))


class Settings(BaseSettings):
    APP_NAME:   str  = "TraceFix Research"
    API_PREFIX: str  = "/api"
    DEBUG:      bool = False

    # Storage Paths (overridable via environment variables)
    PROJECT_ROOT:     Path = PROJECT_ROOT
    CACHE_DIR:        Path = CACHE_DIR
    TEMP_DIR:         Path = TEMP_DIR
    DATA_DIR:         Path = DATA_DIR
    REPO_DIR:         Path = REPO_DIR
    SANDBOX_DIR:      Path = SANDBOX_DIR
    SAMPLE_REPOS_DIR: Path = SAMPLE_REPOS_DIR

    # Database: SQLite path derived from DATA_DIR unless DATABASE_URL is set
    DATABASE_URL:      str = f"sqlite+aiosqlite:///{DATA_DIR / 'tracefix.db'}"
    SYNC_DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'tracefix.db'}"

    # Sandbox Settings
    SANDBOX_TIMEOUT_SECONDS: int = 20
    # Python executable: auto-detected at runtime (sys.executable is always correct)
    PYTHON_EXECUTABLE: str = sys.executable
    USE_DOCKER_IF_AVAILABLE: bool = False

    # CORS – comma-separated list of allowed frontend origins
    # Set ALLOWED_ORIGINS="https://your-site.netlify.app" in production
    ALLOWED_ORIGINS: str = "*"

    # AI & Repair Settings
    DEFAULT_PROVIDER: str  = "mock"   # "mock", "gemini", "openai", "anthropic", "custom"
    GEMINI_API_KEY:   str  = ""
    OPENAI_API_KEY:   str  = ""
    ANTHROPIC_API_KEY: str = ""
    CUSTOM_API_BASE:  str  = "http://localhost:11434/v1"
    CUSTOM_API_KEY:   str  = "ollama"
    DEFAULT_MODEL:    str  = "gemini-1.5-pro"
    TEMPERATURE:      float = 0.2

    model_config = SettingsConfigDict(
        # Look for .env relative to the backend/ directory (works locally)
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow"
    )

settings = Settings()
