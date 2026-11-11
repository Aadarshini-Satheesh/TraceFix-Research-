"""
Settings Router for TraceFix Research.
Configures AI providers, API keys, sandbox timeouts, and execution modes.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from ..config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    default_provider: Optional[str] = None
    default_model: Optional[str] = None
    sandbox_timeout_seconds: Optional[int] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    custom_api_base: Optional[str] = None
    temperature: Optional[float] = None

@router.get("")
async def get_system_settings() -> Dict[str, Any]:
    return {
        "default_provider": settings.DEFAULT_PROVIDER,
        "default_model": settings.DEFAULT_MODEL,
        "sandbox_timeout_seconds": settings.SANDBOX_TIMEOUT_SECONDS,
        "temperature": settings.TEMPERATURE,
        "custom_api_base": settings.CUSTOM_API_BASE,
        "has_gemini_key": bool(settings.GEMINI_API_KEY),
        "has_openai_key": bool(settings.OPENAI_API_KEY),
        "has_anthropic_key": bool(settings.ANTHROPIC_API_KEY),
        "mock_mode_active": (settings.DEFAULT_PROVIDER.lower() == "mock" or not (settings.GEMINI_API_KEY or settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY)),
        "storage_root": str(settings.PROJECT_ROOT),
        "sandbox_dir": str(settings.SANDBOX_DIR)
    }

@router.post("")
async def update_system_settings(req: SettingsUpdate) -> Dict[str, Any]:
    if req.default_provider:
        settings.DEFAULT_PROVIDER = req.default_provider
    if req.default_model:
        settings.DEFAULT_MODEL = req.default_model
    if req.sandbox_timeout_seconds is not None:
        settings.SANDBOX_TIMEOUT_SECONDS = max(5, min(120, req.sandbox_timeout_seconds))
    if req.gemini_api_key is not None:
        settings.GEMINI_API_KEY = req.gemini_api_key
    if req.openai_api_key is not None:
        settings.OPENAI_API_KEY = req.openai_api_key
    if req.anthropic_api_key is not None:
        settings.ANTHROPIC_API_KEY = req.anthropic_api_key
    if req.custom_api_base is not None:
        settings.CUSTOM_API_BASE = req.custom_api_base
    if req.temperature is not None:
        settings.TEMPERATURE = req.temperature

    return {"status": "success", "message": "Settings updated successfully"}
