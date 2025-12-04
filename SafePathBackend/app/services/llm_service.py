"""Large Language Model (LLM) Service powered by OpenRouter only."""
import httpx
from typing import Optional

from app.config import settings


class LLMService:
    """Handle LLM inference for generating responses via OpenRouter."""

    async def generate_response(
        self, 
        user_text: str, 
        image_url: Optional[str] = None,
        system_prompt: str | None = None
    ) -> str:
        if system_prompt is None:
            system_prompt = settings.system_prompt

        if not settings.openrouter_api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not configured")

        # Construct messages
        messages = [{"role": "system", "content": system_prompt}]
        
        user_content = [{"type": "text", "text": user_text}]
        
        if image_url:
            user_content.append({
                "type": "image_url",
                "image_url": {"url": image_url}
            })
            
        messages.append({"role": "user", "content": user_content})

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
                        "messages": messages,
                        "max_tokens": settings.llm_max_tokens,
                        "temperature": settings.llm_temperature,
                    },
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as exc:
            error_body = exc.response.text
            print(f"OpenRouter Error Body: {error_body}")
            raise RuntimeError(f"OpenRouter request failed: {exc} - Body: {error_body}") from exc
        except httpx.HTTPError as exc:
            raise RuntimeError(f"OpenRouter request failed: {exc}") from exc


llm_service = LLMService()
