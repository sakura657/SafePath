"""
SafePath Backend - Main FastAPI Application
Provides ASR + LLM processing for the SafePath React Native app
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import asr_llm_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("=" * 60)
    print("SafePath Backend Starting...")
    print(f"ASR Provider: {settings.asr_provider}")
    print(f"LLM Provider: {settings.llm_provider}")
    print(f"Server: http://{settings.host}:{settings.port}")
    print("=" * 60)
    yield
    # Shutdown
    print("\nSafePath Backend Shutting Down...")


# Create FastAPI app
app = FastAPI(
    title="SafePath Backend API",
    description="ASR + LLM processing backend for SafePath React Native app",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(asr_llm_router, tags=["ASR + LLM"])


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "SafePath Backend",
        "asr_provider": settings.asr_provider,
        "llm_provider": settings.llm_provider
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SafePath Backend API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "asr_llm": "/api/asr-llm",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
