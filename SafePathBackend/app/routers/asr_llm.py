"""
ASR + LLM Router
Handles the main /api/asr-llm endpoint
"""
import os
import time
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
        audio_path = f"/tmp/{audio.filename}"
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


@router.post("/api/realtime", response_model=AsrLlmResponse)
async def process_realtime(
    audio: UploadFile = File(...),
    image: Optional[UploadFile] = File(None),
    language: str = Form("en"),
    session_id: Optional[str] = Form(None)
):
    """
    Real-time multimodal processing (Audio + Image)
    
    1. Transcribe Audio -> Text
    2. Encode Image -> Base64 (if present)
    3. Generate Response (Text + Image) -> Text
    """
    import base64
    
    start_time = time.time()
    audio_path = None
    
    if audio is None:
        raise HTTPException(status_code=400, detail="Audio file is required")

    try:
        # Step 1: Save uploaded audio file temporarily
        audio_path = f"/tmp/{audio.filename}"
        with open(audio_path, "wb") as f:
            content = await audio.read()
            f.write(content)
        
        print(f"[{session_id}] Realtime: Audio saved ({len(content)} bytes)")
        
        # Step 2: ASR - Convert speech to text
        asr_start = time.time()
        user_text, confidence = await asr_service.transcribe(audio_path, language)
        asr_time = (time.time() - asr_start) * 1000
        
        print(f"[{session_id}] ASR: '{user_text}' ({confidence:.2f})")
        
        if not user_text or user_text.strip() == "":
            # If no speech, but we have an image, we might still want to process it?
            # For now, let's assume we need speech to trigger the specific query, 
            # OR we can default to "Describe this" if speech is empty but image exists.
            if image:
                print(f"[{session_id}] No speech detected, using default prompt for image.")
                user_text = "Describe what you see in this image and any hazards."
            else:
                raise HTTPException(status_code=400, detail="No speech detected")
        
        # Step 3: Prepare Image (if any)
        image_url = None
        if image:
            from PIL import Image
            import io
            
            # Read image content
            image_content = await image.read()
            
            # Open image with PIL
            try:
                img = Image.open(io.BytesIO(image_content))
                
                # Resize if too large (max dimension 1024)
                max_dim = 1024
                if img.width > max_dim or img.height > max_dim:
                    img.thumbnail((max_dim, max_dim))
                    print(f"[{session_id}] Image resized to {img.width}x{img.height}")
                
                # Convert to RGB (in case of RGBA) and save as JPEG
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                
                buffer = io.BytesIO()
                img.save(buffer, format="JPEG", quality=70)
                image_content = buffer.getvalue()
                mime_type = "image/jpeg"
                
                base64_image = base64.b64encode(image_content).decode("utf-8")
                image_url = f"data:{mime_type};base64,{base64_image}"
                print(f"[{session_id}] Image processed ({len(image_content)} bytes)")
                
            except Exception as e:
                print(f"[{session_id}] Image processing failed: {e}")
                # Fallback to original if processing fails
                base64_image = base64.b64encode(image_content).decode("utf-8")
                mime_type = image.content_type or "image/jpeg"
                image_url = f"data:{mime_type};base64,{base64_image}"

        # Step 4: LLM - Generate response
        llm_start = time.time()
        assistant_text = await llm_service.generate_response(user_text, image_url=image_url)
        llm_time = (time.time() - llm_start) * 1000
        
        print(f"[{session_id}] LLM: '{assistant_text}'")
        
        # Calculate total latency
        total_latency = (time.time() - start_time) * 1000
        
        return AsrLlmResponse(
            user_text=user_text,
            assistant_text=assistant_text,
            extra={
                "latency_ms": int(total_latency),
                "asr_latency_ms": int(asr_time),
                "llm_latency_ms": int(llm_time),
                "confidence": round(confidence, 2),
                "session_id": session_id,
                "has_image": image is not None
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[{session_id}] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    
    finally:
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except:
                pass
