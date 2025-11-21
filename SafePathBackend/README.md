# SafePath Backend

FastAPI backend for SafePath React Native app providing ASR (Automatic Speech Recognition) and LLM (Large Language Model) processing.

## Features

- **ASR Service**: Convert speech to text locally with Faster-Whisper (tiny.en by default, base.en optional) for low-latency on-device inference.

- **LLM Service**: Generate intelligent responses via OpenRouter (Gemini, Claude, etc.)

- **REST API**: Simple HTTP endpoint for React Native app
  - POST `/api/asr-llm` - Process audio and return response
  - GET `/health` - Health check
  - GET `/api/asr-local-test` - Verify local ASR is ready

## Quick Start

### 1. Install Dependencies

```bash
# Using conda environment (recommended)
conda create -n safepath python=3.11
conda activate safepath

# Install packages
pip install -r requirements.txt
```

Install ffmpeg (required for audio conversion). On macOS:

```bash
brew install ffmpeg
```

On Ubuntu/Debian:

```bash
sudo apt-get install ffmpeg
```

Or using venv:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env` and add your OpenRouter credentials:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.5-flash-lite-preview-09-2025

# Configuration
ASR_PROVIDER=local_faster_whisper
WHISPER_MODEL=tiny.en
LLM_PROVIDER=openrouter
```

### 3. Run Server

```bash
# Quick start (assumes conda env is activated and packages installed)
./start.sh

# Or manually
uvicorn app.main:app --reload --host 0.0.0.0 --port 3000

# Or use Python directly
python -m app.main

# For testing without API keys (mock server)
./start_mock.sh
```

Server will start at: `http://0.0.0.0:3000`

### 4. Test API

```bash
# Health check
curl http://localhost:3000/health

# Test with audio file
curl -X POST http://localhost:3000/api/asr-llm \
  -F "audio=@test_audio.m4a" \
  -F "language=en"
```

## API Documentation

### POST `/api/asr-llm`

Process audio file with ASR and LLM.

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `audio`: Audio file (m4a, mp3, wav)
  - `language`: Language code (default: "en")
  - `session_id`: Optional session ID

**Response:**
```json
{
  "user_text": "What's in front of me?",
  "assistant_text": "Based on your surroundings, there appears to be a door ahead.",
  "extra": {
    "latency_ms": 2345,
    "asr_latency_ms": 1200,
    "llm_latency_ms": 1100,
    "confidence": 0.95,
    "session_id": "session_123"
  }
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "SafePath Backend",
  "asr_provider": "local_faster_whisper",
  "llm_provider": "openrouter"
}
```

## Project Structure

```
SafePathBackend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── routers/
│   │   ├── __init__.py
│   │   └── asr_llm.py       # ASR+LLM endpoint
│   └── services/
│       ├── __init__.py
│       ├── asr_service.py   # Speech recognition
│       └── llm_service.py   # LLM inference
├── requirements.txt
├── .env
├── .gitignore
└── README.md
```

## Configuration Options

### ASR Configuration (Faster-Whisper)

```env
ASR_PROVIDER=local_faster_whisper
WHISPER_MODEL=tiny.en  # or base.en
```

- Uses [faster-whisper](https://github.com/guillaumekln/faster-whisper) with `compute_type="int8"` for CPU efficiency.
- Requires ffmpeg installed on the host for audio conversion.
- Audio uploads (m4a/3gp/wav) are automatically converted to 16kHz mono WAV before transcription.

### LLM Configuration (OpenRouter)

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.5-flash-lite-preview-09-2025
```

- All LLM responses are fetched via OpenRouter.
- Provide your OpenRouter API key and desired hosted model.
- Monitor token usage from the OpenRouter dashboard.

## Development

### Interactive API Docs

FastAPI provides automatic interactive documentation:
- Swagger UI: http://localhost:3000/docs
- ReDoc: http://localhost:3000/redoc

### Logs

The server logs all requests with timing information:
```
[session_123] Audio saved: /tmp/audio.m4a (45678 bytes)
[session_123] ASR completed in 1200ms: 'What's ahead?' (confidence: 0.95)
[session_123] LLM completed in 1100ms: 'A door is 2 meters ahead.'
[session_123] Cleaned up: /tmp/audio.m4a
```

## Production Deployment

### Using Gunicorn + Uvicorn

```bash
pip install gunicorn

gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:3000
```

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app/ ./app/
COPY .env .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3000"]
```

## Troubleshooting

### CORS errors from React Native
- Server should allow all origins in development
- In production, update `allow_origins` in `main.py`

### Audio file upload fails
- Check file size (should be < 25MB)
- Ensure multipart/form-data content type
- Verify audio format (m4a, mp3, wav supported)

## License

MIT
