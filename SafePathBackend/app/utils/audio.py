"""Helpers for working with uploaded audio files."""
from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Tuple

from fastapi import HTTPException, UploadFile

CHUNK_SIZE = 1024 * 1024  # 1 MB


def _infer_suffix(filename: str | None) -> str:
    if not filename:
        return ".m4a"
    suffix = Path(filename).suffix
    return suffix or ".m4a"


async def save_upload_to_tempfile(
    upload: UploadFile,
    max_bytes: int,
) -> Tuple[str, int]:
    """Persist `UploadFile` contents to a temporary file enforcing size limits."""
    suffix = _infer_suffix(upload.filename)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    file_path = tmp.name
    total_bytes = 0

    try:
        while True:
            chunk = await upload.read(CHUNK_SIZE)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > max_bytes:
                raise HTTPException(
                    status_code=413,
                    detail=f"Audio file exceeds limit of {max_bytes // (1024 * 1024)} MB",
                )
            tmp.write(chunk)
    except Exception:
        tmp.close()
        os.remove(file_path)
        raise
    finally:
        tmp.close()
        await upload.seek(0)

    return file_path, total_bytes


def remove_file_safely(path: str) -> None:
    """Delete a file from disk while ignoring missing-file errors."""
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except Exception as exc:  # pragma: no cover - best effort cleanup
        print(f"[cleanup] Unable to remove temporary file {path}: {exc}")
