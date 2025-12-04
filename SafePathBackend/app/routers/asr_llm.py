"""
ASR + LLM Router
Handles the main /api/asr-llm endpoint
"""
import os
import time
import tempfile

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional
from pydantic import BaseModel

from app.services import asr_service, llm_service


router = APIRouter()


class AsrLlmResponse(BaseModel):
    """Response model for ASR+LLM endpoint"""
    user_text: str
    assistant_text: str
    extra: dict


@router.get("/api/asr-local-test")
async def asr_local_test():
    """Health endpoint to verify Faster-Whisper is ready."""
    return {"status": "faster-whisper ok"}


@router.post("/api/asr-llm", response_model=AsrLlmResponse)
async def process_audio(
    audio: UploadFile = File(...),
    language: str = Form("en"),
    session_id: Optional[str] = Form(None)
):
    """
    Process audio file with ASR and LLM
    
    1. Receives audio file from React Native app
    2. Transcribes audio using local Faster-Whisper
    3. Generates response using OpenRouter LLM
    4. Returns transcribed text and LLM response
    
    Args:
        audio: Audio file (m4a, mp3, wav, etc.)
        language: Language code (e.g., 'en', 'zh')
        session_id: Optional session identifier for tracking conversations
    
    Returns:
        AsrLlmResponse with user_text, assistant_text, and extra metadata
    """
    start_time = time.time()
    audio_path = None
    
    if audio is None:
        raise HTTPException(status_code=400, detail="Audio file is required")

    try:
        # Step 1: Save uploaded audio file temporarily
        tmp_dir = tempfile.gettempdir()
        audio_path = os.path.join(tmp_dir, audio.filename)
        with open(audio_path, "wb") as f:
            content = await audio.read()
            f.write(content)
        
        print(f"[{session_id}] Audio saved: {audio_path} ({len(content)} bytes)")
        
        # Step 2: ASR - Convert speech to text
        asr_start = time.time()
        user_text, confidence = await asr_service.transcribe(audio_path, language)
        asr_time = (time.time() - asr_start) * 1000
        
        print(f"[{session_id}] ASR completed in {asr_time:.0f}ms: '{user_text}' (confidence: {confidence:.2f})")
        
        if not user_text or user_text.strip() == "":
            raise HTTPException(status_code=400, detail="No speech detected in audio")
        
        # Step 3: LLM - Generate response
        llm_start = time.time()
        assistant_text = await llm_service.generate_response(user_text)
        llm_time = (time.time() - llm_start) * 1000
        
        print(f"[{session_id}] LLM completed in {llm_time:.0f}ms: '{assistant_text}'")
        
        # Calculate total latency
        total_latency = (time.time() - start_time) * 1000
        
        # Return response
        return AsrLlmResponse(
            user_text=user_text,
            assistant_text=assistant_text,
            extra={
                "latency_ms": int(total_latency),
                "asr_latency_ms": int(asr_time),
                "llm_latency_ms": int(llm_time),
                "confidence": round(confidence, 2),
                "session_id": session_id
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[{session_id}] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    
    finally:
        # Clean up temporary file
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
                print(f"[{session_id}] Cleaned up: {audio_path}")
            except Exception as e:
                print(f"[{session_id}] Failed to clean up {audio_path}: {e}")
