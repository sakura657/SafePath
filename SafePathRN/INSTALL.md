# SafePath React Native Installation Guide

## Quick Start

### 1. Install Dependencies

Run the installation script to install all required Expo packages:

```bash
chmod +x install-dependencies.sh
./install-dependencies.sh
```

Or install manually:

```bash
npx expo install expo-camera expo-av expo-speech expo-file-system expo-image-manipulator
```

### 2. Configure Environment

Edit the `.env` file with your backend and API settings:

```env
EXPO_PUBLIC_API_BASE_URL=http://your-backend-url:3000
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-your-key-here
EXPO_PUBLIC_OPENROUTER_MODEL=openai/gpt-4-vision-preview
```

### 3. Start Development Server

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator  
- Scan QR code with Expo Go app on physical device

## Features

### Voice Interaction Mode
- Press and hold to record audio
- Audio is sent to backend for ASR (Automatic Speech Recognition)
- Backend processes with LLM and returns response
- Response is displayed as subtitle and spoken via TTS

### Obstacle Detection Mode
- Capture camera frame
- Image is analyzed using OpenRouter VLM (Vision Language Model)
- Scene description is provided for navigation assistance
- Description is spoken via TTS

## Architecture

```
Frontend (React Native):
├── Camera Preview (expo-camera)
├── Audio Recording (expo-av)
├── TTS Playback (expo-speech)
└── API Communication

Backend (Required for Voice Mode):
├── ASR Service (Whisper/Deepgram/etc)
├── LLM Service (OpenAI/Gemini/etc)
└── REST API Endpoint: /api/asr-llm

VLM Service (For Obstacle Mode):
└── OpenRouter API (gpt-4-vision or similar)
```

## Permissions

The app requires:
- **Camera**: For obstacle detection and environment preview
- **Microphone**: For voice interaction mode
- **File System**: For audio recording storage

## Project Structure

```
SafePathRN/
├── config/
│   └── env.ts                    # Environment configuration
├── services/
│   ├── audioService.ts           # Audio recording
│   ├── ttsService.ts             # Text-to-speech
│   ├── asrLlmService.ts          # Backend communication
│   └── vlmService.ts             # Vision analysis
├── components/
│   ├── CameraPreview.tsx         # Camera component
│   ├── SubtitlePanel.tsx         # Subtitle display
│   ├── SessionScreen.tsx         # Main interaction screen
│   └── SettingsScreen.tsx        # Configuration screen
└── types/
    └── index.ts                  # TypeScript types
```

## Backend API Specification

### Endpoint: POST /api/asr-llm

**Request:**
- Content-Type: multipart/form-data
- Fields:
  - `audio`: Audio file (m4a/3gp)
  - `language`: Language code (e.g., "en")
  - `session_id`: Optional session identifier

**Response:**
```json
{
  "user_text": "Transcribed user speech",
  "assistant_text": "LLM response text",
  "extra": {
    "latency_ms": 1234
  }
}
```

### Health Check: GET /health

Returns 200 OK if backend is running.

## Troubleshooting

### Camera not working
- Check permissions in iOS Settings or Android Settings
- Ensure `expo-camera` is properly installed
- Try running `npx expo prebuild --clean`

### Recording fails
- Verify microphone permissions
- Check that `expo-av` is installed correctly
- On iOS, ensure Info.plist has NSMicrophoneUsageDescription

### Backend connection issues
- Verify backend URL in .env
- Test backend health endpoint
- Check network connectivity
- For localhost: Use your computer's IP address, not "localhost"

### VLM not working
- Verify OpenRouter API key is valid
- Check that model supports vision (gpt-4-vision, claude-3, etc)
- Ensure `expo-image-manipulator` is installed

## Development Notes

- TypeScript errors about missing modules will resolve after installing dependencies
- Use physical device for best camera/microphone testing
- Backend must implement the ASR+LLM pipeline separately
- VLM calls require internet connection and valid API key

## Next Steps

1. Set up backend server with ASR + LLM integration
2. Configure OpenRouter API key for VLM features
3. Test on physical device for full functionality
4. Customize prompts and responses for your use case
