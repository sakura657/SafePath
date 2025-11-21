"""
Configuration management for SafePath Backend
"""
from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # OpenRouter Configuration (used for all LLM calls)
    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemini-2.5-flash-lite-preview-09-2025"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 3000
    
    # ASR Configuration
    asr_provider: Literal["local_faster_whisper"] = "local_faster_whisper"
    whisper_model: str = "tiny.en"
    
    # LLM Configuration
    llm_provider: Literal["openrouter"] = "openrouter"
    llm_max_tokens: int = 200
    llm_temperature: float = 0.7
    
    # System Prompt
    system_prompt: str = "You are a helpful navigation assistant for visually impaired users. Provide clear, concise, and actionable responses in 20 words or less."
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
