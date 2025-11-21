"""Automatic Speech Recognition (ASR) Service using Faster-Whisper."""
from __future__ import annotations

import asyncio
import os
import tempfile
from typing import Tuple

import ffmpeg
from faster_whisper import WhisperModel

from app.config import settings
from app.utils.audio import remove_file_safely


def _load_faster_whisper_model() -> WhisperModel:
    """Load a singleton Faster-Whisper model instance."""
    model_size = settings.whisper_model or "tiny.en"
    cpu_count = max(1, os.cpu_count() or 1)
    return WhisperModel(
        model_size,
        device="cpu",
        compute_type="int8",
        num_workers=cpu_count,
    )


_WHISPER_MODEL = _load_faster_whisper_model()


def _convert_to_wav(input_path: str) -> str:
    """Convert any audio file to 16kHz mono WAV using ffmpeg."""
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    tmp.close()
    try:
        (
            ffmpeg.input(input_path)
            .output(
                tmp.name,
                format="wav",
                acodec="pcm_s16le",
                ac=1,
                ar=16000,
            )
            .overwrite_output()
            .run(quiet=True)
        )
    except ffmpeg.Error as exc:
        remove_file_safely(tmp.name)
        stderr = exc.stderr.decode("utf-8", errors="ignore") if exc.stderr else str(exc)
        raise RuntimeError(f"Failed to convert audio to WAV: {stderr}") from exc
    return tmp.name


def transcribe_local_faster_whisper(audio_path: str, language: str = "en") -> Tuple[str, float]:
    """Transcribe speech using local Faster-Whisper model."""
    wav_path = _convert_to_wav(audio_path)
    try:
        segments, info = _WHISPER_MODEL.transcribe(
            wav_path,
            language=language,
            beam_size=1,
        )
        collected = [segment.text.strip() for segment in segments if segment.text]
        transcription = " ".join(collected).strip()
        if not transcription:
            raise RuntimeError("No speech detected in audio")
        confidence = info.language_probability or 0.9
        return transcription, confidence
    finally:
        remove_file_safely(wav_path)


class ASRService:
    """Handle speech-to-text conversion via Faster-Whisper."""

    async def transcribe(self, audio_path: str, language: str = "en") -> Tuple[str, float]:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,
            transcribe_local_faster_whisper,
            audio_path,
            language,
        )


# Global ASR service instance
asr_service = ASRService()

__all__ = [
    "asr_service",
    "transcribe_local_faster_whisper",
]
