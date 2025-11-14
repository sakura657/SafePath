"""
SafePath Backend API Reference Implementation
==============================================

This is a reference implementation guide for the backend API
that SafePath React Native app expects.

Backend must implement two endpoints:
1. POST /api/asr-llm - Main ASR + LLM processing
2. GET /health - Health check
"""

# Example using FastAPI (Python)

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import openai  # or your preferred LLM client
# import whisper  # or your preferred ASR service

app = FastAPI()

# Enable CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.post("/api/asr-llm")
async def process_audio(
    audio: UploadFile = File(...),
    language: str = Form("en"),
    session_id: str = Form(None)
):
    """
    Process audio file with ASR and LLM
    
    Args:
        audio: Audio file (m4a, mp3, wav, etc.)
        language: Language code (e.g., 'en', 'zh')
        session_id: Optional session identifier
    
    Returns:
        {
            "user_text": "Transcribed user speech",
            "assistant_text": "LLM response",
            "extra": {
                "latency_ms": 1234,
                "confidence": 0.95
            }
        }
    """
    
    # Step 1: Save audio file temporarily
    audio_path = f"/tmp/{audio.filename}"
    with open(audio_path, "wb") as f:
        f.write(await audio.read())
    
    # Step 2: ASR - Convert speech to text
    # Option A: Using OpenAI Whisper API
    with open(audio_path, "rb") as audio_file:
        transcript = openai.Audio.transcribe(
            model="whisper-1",
            file=audio_file,
            language=language
        )
    user_text = transcript.text
    
    # Option B: Using local Whisper
    # model = whisper.load_model("base")
    # result = model.transcribe(audio_path, language=language)
    # user_text = result["text"]
    
    # Option C: Using Deepgram
    # from deepgram import Deepgram
    # dg_client = Deepgram(DEEPGRAM_API_KEY)
    # with open(audio_path, "rb") as audio:
    #     source = {"buffer": audio, "mimetype": "audio/m4a"}
    #     response = await dg_client.transcription.prerecorded(source)
    #     user_text = response["results"]["channels"][0]["alternatives"][0]["transcript"]
    
    # Step 3: LLM - Generate response
    # Option A: Using OpenAI
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful navigation assistant for visually impaired users. Provide clear, concise, and actionable responses."
            },
            {
                "role": "user",
                "content": user_text
            }
        ],
        max_tokens=200,
        temperature=0.7
    )
    assistant_text = response.choices[0].message.content
    
    # Option B: Using other LLM providers (Anthropic, Google, etc.)
    # from anthropic import Anthropic
    # client = Anthropic(api_key=ANTHROPIC_API_KEY)
    # message = client.messages.create(
    #     model="claude-3-sonnet-20240229",
    #     max_tokens=200,
    #     messages=[{"role": "user", "content": user_text}]
    # )
    # assistant_text = message.content[0].text
    
    # Return response
    return {
        "user_text": user_text,
        "assistant_text": assistant_text,
        "extra": {
            "latency_ms": 1234,  # Calculate actual latency
            "confidence": 0.95   # From ASR if available
        }
    }

# Run with: uvicorn backend:app --reload --host 0.0.0.0 --port 3000


# Alternative: Express.js (Node.js) implementation
"""
const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');

const app = express();
const upload = multer({ dest: '/tmp/' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.post('/api/asr-llm', upload.single('audio'), async (req, res) => {
    try {
        const { language = 'en', session_id } = req.body;
        const audioFile = req.file;
        
        // ASR with Whisper
        const transcript = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioFile.path),
            model: 'whisper-1',
            language: language
        });
        const userText = transcript.text;
        
        // LLM response
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful navigation assistant.'
                },
                { role: 'user', content: userText }
            ],
            max_tokens: 200
        });
        const assistantText = completion.choices[0].message.content;
        
        res.json({
            user_text: userText,
            assistant_text: assistantText,
            extra: { latency_ms: 1234 }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
"""


# Minimal Test Server (for frontend development)
"""
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/api/asr-llm")
async def mock_asr_llm(
    audio: UploadFile = File(...),
    language: str = Form("en"),
    session_id: str = Form(None)
):
    # Simulate processing time
    time.sleep(1)
    
    # Mock response
    return {
        "user_text": "This is a test transcription of your audio",
        "assistant_text": "Hello! I'm here to help you navigate safely. How can I assist you today?",
        "extra": {
            "latency_ms": 1000
        }
    }

# Run: uvicorn backend_mock:app --reload --host 0.0.0.0 --port 3000
"""
