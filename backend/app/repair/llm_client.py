"""
Multi-Provider LLM Client for Code Repair.
Supports Gemini, OpenAI, Anthropic, and local OpenAI-compatible endpoints (Ollama/vLLM).
"""
import os
import time
import httpx
from typing import Dict, Any, Optional
from ..config import settings

class LLMClient:
    @staticmethod
    async def generate_completion(
        prompt: str,
        system_instruction: str = "You are an automated program repair system. Output only code and explanations as requested.",
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        """Dispatches completion request to configured LLM provider."""
        prov = (provider or settings.DEFAULT_PROVIDER).lower()
        mod = model or settings.DEFAULT_MODEL
        temp = temperature if temperature is not None else settings.TEMPERATURE
        start_time = time.time()

        if prov == "gemini" and settings.GEMINI_API_KEY:
            return await LLMClient._call_gemini(prompt, system_instruction, mod, temp, start_time)
        elif prov == "openai" and settings.OPENAI_API_KEY:
            return await LLMClient._call_openai(prompt, system_instruction, mod, temp, start_time)
        elif prov == "anthropic" and settings.ANTHROPIC_API_KEY:
            return await LLMClient._call_anthropic(prompt, system_instruction, mod, temp, start_time)
        elif prov == "custom":
            return await LLMClient._call_custom(prompt, system_instruction, mod, temp, start_time)
        else:
            # Fallback to Mock Engine
            from .mock_engine import MockAIEngine
            return MockAIEngine.generate_mock_repair(prompt, start_time)

    @staticmethod
    async def _call_gemini(prompt: str, system: str, model: str, temp: float, start_time: float) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": f"{system}\n\nTask:\n{prompt}"}]}
            ],
            "generationConfig": {"temperature": temp, "maxOutputTokens": 2048}
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, json=payload)
                res.raise_for_status()
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                tokens = data.get("usageMetadata", {}).get("totalTokenCount", 350)
                duration = round((time.time() - start_time) * 1000, 2)
                return {
                    "text": text,
                    "tokens": tokens,
                    "cost_usd": round(tokens * 0.000003, 5),
                    "duration_ms": duration,
                    "provider": "gemini",
                    "model": model
                }
        except Exception as e:
            return {
                "text": f"Error contacting Gemini API: {str(e)}",
                "tokens": 0,
                "cost_usd": 0.0,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "provider": "gemini",
                "model": model,
                "error": str(e)
            }

    @staticmethod
    async def _call_openai(prompt: str, system: str, model: str, temp: float, start_time: float) -> Dict[str, Any]:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
        payload = {
            "model": model or "gpt-4o",
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            "temperature": temp
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                res.raise_for_status()
                data = res.json()
                text = data["choices"][0]["message"]["content"]
                tokens = data.get("usage", {}).get("total_tokens", 400)
                duration = round((time.time() - start_time) * 1000, 2)
                return {
                    "text": text,
                    "tokens": tokens,
                    "cost_usd": round(tokens * 0.000005, 5),
                    "duration_ms": duration,
                    "provider": "openai",
                    "model": model
                }
        except Exception as e:
            return {
                "text": f"Error contacting OpenAI API: {str(e)}",
                "tokens": 0,
                "cost_usd": 0.0,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "provider": "openai",
                "model": model,
                "error": str(e)
            }

    @staticmethod
    async def _call_custom(prompt: str, system: str, model: str, temp: float, start_time: float) -> Dict[str, Any]:
        url = f"{settings.CUSTOM_API_BASE}/chat/completions"
        headers = {"Authorization": f"Bearer {settings.CUSTOM_API_KEY}"}
        payload = {
            "model": model or "llama3",
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            "temperature": temp
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                res.raise_for_status()
                data = res.json()
                text = data["choices"][0]["message"]["content"]
                tokens = data.get("usage", {}).get("total_tokens", 350)
                duration = round((time.time() - start_time) * 1000, 2)
                return {
                    "text": text,
                    "tokens": tokens,
                    "cost_usd": 0.0,
                    "duration_ms": duration,
                    "provider": "custom",
                    "model": model
                }
        except Exception as e:
            from .mock_engine import MockAIEngine
            return MockAIEngine.generate_mock_repair(prompt, start_time)
