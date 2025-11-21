"""Large Language Model (LLM) Service powered by OpenRouter only."""
import httpx

from app.config import settings


class LLMService:
    """Handle LLM inference for generating responses via OpenRouter."""

    async def generate_response(self, user_text: str, system_prompt: str | None = None) -> str:
        if system_prompt is None:
            system_prompt = settings.system_prompt

        if not settings.openrouter_api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not configured")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.openrouter_api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://safepath.app",
                        "X-Title": "SafePath Backend",
                    },
                    json={
                        "model": settings.openrouter_model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_text},
                        ],
                        "max_tokens": settings.llm_max_tokens,
                        "temperature": settings.llm_temperature,
                    },
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except httpx.HTTPError as exc:
            raise RuntimeError(f"OpenRouter request failed: {exc}") from exc


llm_service = LLMService()
