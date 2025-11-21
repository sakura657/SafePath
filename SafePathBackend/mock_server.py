"""
Mock SafePath Backend Server
For testing frontend without real ASR/LLM APIs
"""
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import time
import random
from typing import Optional

app = FastAPI(title="SafePath Mock Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock responses for different scenarios
MOCK_RESPONSES = [
    {
        "user_text": "What's in front of me?",
        "assistant_text": "There's a door about 2 meters ahead on your left."
    },
    {
        "user_text": "Where am I?",
        "assistant_text": "You're in a hallway with walls on both sides."
    },
    {
        "user_text": "Any obstacles?",
        "assistant_text": "Clear path ahead. No obstacles detected."
    },
    {
        "user_text": "Help me navigate",
        "assistant_text": "Walk straight for 3 meters, then turn right."
    },
]


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "SafePath Mock Backend",
        "mode": "mock"
    }


@app.post("/api/asr-llm")
async def mock_asr_llm(
    audio: UploadFile = File(...),
    language: str = Form("en"),
    session_id: Optional[str] = Form(None)
):
    """
    Mock ASR + LLM endpoint for testing
    Returns random mock responses
    """
    start_time = time.time()
    
    # Simulate processing time
    await asyncio.sleep(random.uniform(0.5, 1.5))
    
    # Get file size
    content = await audio.read()
    file_size = len(content)
    
    # Random mock response
    mock = random.choice(MOCK_RESPONSES)
    
    # Calculate latency
    latency = (time.time() - start_time) * 1000
    
    print(f"[MOCK] Session: {session_id}, File: {file_size} bytes, Latency: {latency:.0f}ms")
    print(f"[MOCK] User: '{mock['user_text']}'")
    print(f"[MOCK] Assistant: '{mock['assistant_text']}'")
    
    return {
        "user_text": mock["user_text"],
        "assistant_text": mock["assistant_text"],
        "extra": {
            "latency_ms": int(latency),
            "asr_latency_ms": int(latency * 0.4),
            "llm_latency_ms": int(latency * 0.6),
            "confidence": round(random.uniform(0.90, 0.99), 2),
            "session_id": session_id,
            "mock": True
        }
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SafePath Mock Backend",
        "mode": "mock",
        "note": "This is a mock server for testing. No real ASR/LLM processing.",
        "endpoints": {
            "health": "/health",
            "asr_llm": "/api/asr-llm",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    import asyncio
    
    print("=" * 60)
    print("SafePath MOCK Backend Starting...")
    print("No API keys required - returns random responses")
    print("Server: http://0.0.0.0:3000")
    print("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=3000)
