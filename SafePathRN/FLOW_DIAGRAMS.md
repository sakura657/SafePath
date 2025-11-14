# SafePath Data Flow Diagrams

## Voice Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Press "Speak" button
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  AUDIO RECORDING (audioService.ts)                              │
│  • Request microphone permission                                │
│  • Start recording with expo-av                                 │
│  • Capture audio to local file                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ User speaks...
                            │ Press "Stop & Send" button
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  UPLOAD TO BACKEND (asrLlmService.ts)                           │
│  • Stop recording, get audio URI                                │
│  • Create multipart form data                                   │
│  • POST /api/asr-llm with audio file                           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND PROCESSING (Your Backend Server)                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 1. ASR (Speech to Text)                                   │ │
│  │    • Whisper / Deepgram / Google STT                      │ │
│  │    • Convert audio → user_text                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 2. LLM (Generate Response)                                │ │
│  │    • GPT-4 / Claude / Gemini                              │ │
│  │    • user_text → assistant_text                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Return JSON response
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND DISPLAY (SessionScreen.tsx)                           │
│  • Parse response JSON                                          │
│  • setUserText(user_text)                                       │
│  • setAssistantText(assistant_text)                             │
│  • Update SubtitlePanel component                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  TTS PLAYBACK (ttsService.ts)                                   │
│  • speak(assistant_text, "en-US")                               │
│  • Use native device TTS engine                                 │
│  • User hears response                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Obstacle Detection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Press "Capture & Analyze" button
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  CAMERA CAPTURE (CameraPreview.tsx)                             │
│  • Request camera permission                                    │
│  • Get camera ref from CameraView                               │
│  • cameraRef.takePictureAsync()                                 │
│  • Returns photo.uri                                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  IMAGE PROCESSING (vlmService.ts)                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 1. Resize & Compress                                      │ │
│  │    • expo-image-manipulator                               │ │
│  │    • Resize to 1024px width                               │ │
│  │    • Compress to 70% quality JPEG                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 2. Convert to Base64                                      │ │
│  │    • Read image file                                      │ │
│  │    • Convert to base64 string                             │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  OPENROUTER API CALL (vlmService.ts)                            │
│  • POST https://openrouter.ai/api/v1/chat/completions          │
│  • Headers: Authorization with API key                         │
│  • Body: {                                                      │
│      model: "gpt-4-vision-preview",                             │
│      messages: [                                                │
│        {                                                        │
│          role: "user",                                          │
│          content: [                                             │
│            { type: "text", text: "Describe scene..." },         │
│            { type: "image_url", image_url: "data:..." }         │
│          ]                                                      │
│        }                                                        │
│      ]                                                          │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ VLM analyzes image
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  PARSE VLM RESPONSE (vlmService.ts)                             │
│  • Extract description from API response                        │
│  • Parse for objects (person, car, door, etc.)                 │
│  • Parse for hazards (obstacle, wet, broken, etc.)             │
│  • Return VlmResponse object                                    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND DISPLAY (SessionScreen.tsx)                           │
│  • setUserText("Scene analysis requested")                      │
│  • setAssistantText(vlmResponse.description)                    │
│  • Update SubtitlePanel component                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  TTS PLAYBACK (ttsService.ts)                                   │
│  • speak(description, "en-US")                                  │
│  • Use native device TTS engine                                 │
│  • User hears scene description                                │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
SafePathRN App
│
├── app/(tabs)/
│   ├── index.tsx                    ← Home Tab
│   │   └── renders SessionScreen
│   │
│   └── explore.tsx                  ← Settings Tab
│       └── renders SettingsScreen
│
├── components/
│   ├── SessionScreen.tsx            ← Main Screen
│   │   ├── uses CameraPreview
│   │   ├── uses SubtitlePanel
│   │   ├── calls audioService
│   │   ├── calls asrLlmService
│   │   ├── calls vlmService
│   │   └── calls ttsService
│   │
│   ├── CameraPreview.tsx            ← Camera Component
│   │   └── uses expo-camera
│   │
│   ├── SubtitlePanel.tsx            ← Display Component
│   │   └── shows user/assistant text
│   │
│   └── SettingsScreen.tsx           ← Config Component
│       └── manage .env variables
│
├── services/
│   ├── audioService.ts              ← Recording
│   │   └── uses expo-av
│   │
│   ├── ttsService.ts                ← Text-to-Speech
│   │   └── uses expo-speech
│   │
│   ├── asrLlmService.ts             ← Backend API
│   │   └── HTTP client for ASR+LLM
│   │
│   └── vlmService.ts                ← Vision Analysis
│       ├── uses expo-image-manipulator
│       └── calls OpenRouter API
│
├── config/
│   └── env.ts                       ← Environment Config
│       └── reads .env variables
│
└── types/
    └── index.ts                     ← TypeScript Types
        └── API response interfaces
```

## State Flow in SessionScreen

```
Initial State:
├── mode: VOICE_INTERACTION
├── isRecording: false
├── isProcessing: false
├── userText: ""
└── assistantText: ""

Voice Mode - First Press:
├── mode: VOICE_INTERACTION
├── isRecording: true ✓
├── isProcessing: false
├── userText: "" (cleared)
├── assistantText: "" (cleared)
└── ACTION: startRecording()

Voice Mode - Second Press:
├── mode: VOICE_INTERACTION
├── isRecording: false ✓
├── isProcessing: true ✓
├── userText: ""
├── assistantText: ""
└── ACTION: stopRecording() → sendAudioToBackend()

Voice Mode - Response Received:
├── mode: VOICE_INTERACTION
├── isRecording: false
├── isProcessing: false ✓
├── userText: "What user said" ✓
├── assistantText: "LLM response" ✓
└── ACTION: speak(assistantText)

Obstacle Mode - Button Press:
├── mode: OBSTACLE_DETECTION
├── isRecording: false
├── isProcessing: true ✓
├── userText: ""
├── assistantText: ""
└── ACTION: takePicture() → analyzeWithVLM()

Obstacle Mode - Response Received:
├── mode: OBSTACLE_DETECTION
├── isRecording: false
├── isProcessing: false ✓
├── userText: "Scene analysis requested" ✓
├── assistantText: "VLM description" ✓
└── ACTION: speak(assistantText)
```

## Error Handling Flow

```
Any Service Call
       │
       ▼
┌─────────────┐
│ try {       │
│   await ... │
│ }           │
└─────────────┘
       │
       ├─── Success ─────┐
       │                 │
       │                 ▼
       │         Update UI with result
       │         Play TTS response
       │
       └─── Error ──────┐
                        │
                        ▼
                ┌───────────────────┐
                │ catch (error) {   │
                │   console.error   │
                │   Alert.alert     │
                │   cleanup state   │
                │ }                 │
                └───────────────────┘
                        │
                        ▼
                Reset to initial state
                Allow user to retry
```

## Permission Flow

```
App Launch
    │
    ▼
User taps record button
    │
    ▼
┌──────────────────────┐
│ Check mic permission │
└──────────────────────┘
    │
    ├─── Granted ─────────────┐
    │                         │
    │                         ▼
    │                 Start recording
    │
    └─── Not Granted ────┐
                         │
                         ▼
                 Request permission
                         │
                         ├─── User allows ───────┐
                         │                       │
                         │                       ▼
                         │               Start recording
                         │
                         └─── User denies ──────┐
                                                 │
                                                 ▼
                                         Show error message
                                         "Microphone permission required"
```
