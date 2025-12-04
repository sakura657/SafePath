import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { CameraPreview } from '../components/CameraPreview';
import { SubtitlePanel } from '../components/SubtitlePanel';
import { startRecording, stopRecording, cancelRecording } from '../services/audioService';
import { sendRealtimeRequest } from '../services/asrLlmService';
import { speak, stopSpeaking } from '../services/ttsService';
import { useAppConfig } from '../config/AppConfigProvider';

// VAD Constants
const SPEECH_THRESHOLD = -30; // dB
const SILENCE_DURATION_MS = 1500; // 1.5 seconds of silence to trigger
const MIN_SPEECH_DURATION_MS = 500; // Minimum speech duration to consider valid

type SessionState = 'idle' | 'listening' | 'processing' | 'speaking';

export function SessionScreen() {
  const [status, setStatus] = useState<SessionState>('idle');
  const [userText, setUserText] = useState('');
  const [assistantText, setAssistantText] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const { config } = useAppConfig();

  const cameraRef = useRef<CameraView | null>(null);

  // VAD Refs
  const lastSpeechTime = useRef<number>(0);
  const silenceStartTime = useRef<number>(0);
  const isSpeechDetected = useRef<boolean>(false);
  const speechStartTime = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRecording();
      stopSpeaking();
    };
  }, []);

  /**
   * Start the Real-time Loop
   */
  const startSession = async () => {
    try {
      stopSpeaking();
      await startListening();
    } catch (error) {
      Alert.alert('Error', 'Failed to start session');
    }
  };

  /**
   * Stop the session
   */
  const stopSession = async () => {
    setStatus('idle');
    await cancelRecording();
    stopSpeaking();
  };

  /**
   * Start Listening (Recording with VAD)
   */
  const startListening = async () => {
    try {
      setStatus('listening');

      // Reset VAD state
      isSpeechDetected.current = false;
      silenceStartTime.current = 0;
      speechStartTime.current = 0;

      await startRecording((status: Audio.RecordingStatus) => {
        if (!status.isRecording) return;

        const metering = status.metering || -160;
        const now = Date.now();

        // Check if TTS is speaking (ignore audio if system is speaking)
        Speech.isSpeakingAsync().then(isSpeaking => {
          if (isSpeaking) return;

          if (metering > SPEECH_THRESHOLD) {
            // Speech detected
            if (!isSpeechDetected.current) {
              isSpeechDetected.current = true;
              speechStartTime.current = now;
              console.log('VAD: Speech started');
            }
            lastSpeechTime.current = now;
            silenceStartTime.current = 0;
          } else {
            // Silence
            if (isSpeechDetected.current) {
              if (silenceStartTime.current === 0) {
                silenceStartTime.current = now;
              } else {
                const silenceDuration = now - silenceStartTime.current;
                const speechDuration = lastSpeechTime.current - speechStartTime.current;

                // Trigger if silence > threshold AND we had enough speech
                if (silenceDuration > SILENCE_DURATION_MS && speechDuration > MIN_SPEECH_DURATION_MS) {
                  console.log('VAD: Silence detected, processing...');
                  processRequest();
                }
              }
            }
          }
        });
      });
    } catch (error) {
      console.error('Failed to start listening:', error);
      setStatus('idle');
    }
  };

  /**
   * Process Request (Stop recording, take picture, send to backend)
   */
  const processRequest = async () => {
    if (status === 'processing') return; // Prevent double trigger

    try {
      setStatus('processing');

      // 1. Stop Recording
      const audioUri = await stopRecording();
      console.log('Audio captured:', audioUri);

      // 2. Take Picture
      if (!cameraRef.current) {
        throw new Error('Camera not ready');
      }
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.4, // Lower quality to reduce size
        base64: false,
        skipProcessing: false, // Enable processing to apply quality setting
        scale: 0.5, // Downscale image
      });

      if (!photo || !photo.uri) {
        throw new Error('Failed to capture image');
      }
      console.log('Image captured:', photo.uri);

      // 3. Send to Backend
      const response = await sendRealtimeRequest(
        audioUri,
        photo.uri,
        'en',
        sessionId,
        config.apiBaseUrl
      );

      setUserText(response.user_text);
      setAssistantText(response.assistant_text);

      // 4. Speak Response
      setStatus('speaking');
      speak(response.assistant_text, 'en-US', {
        onDone: () => {
          // Resume listening after speaking
          console.log('TTS finished, resuming listening...');
          startListening();
        },
        onError: () => {
          startListening();
        }
      });

    } catch (error) {
      console.error('Processing error:', error);
      // If error, go back to listening or idle?
      // Let's go back to listening to keep the loop alive, but maybe warn user?
      // For now, just resume listening.
      startListening();
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle': return 'Start Real-time Mode';
      case 'listening': return 'Listening...';
      case 'processing': return 'Processing...';
      case 'speaking': return 'Speaking...';
    }
  };

  const getButtonStyle = () => {
    switch (status) {
      case 'idle': return styles.buttonStart;
      case 'listening': return styles.buttonListening;
      case 'processing': return styles.buttonProcessing;
      case 'speaking': return styles.buttonSpeaking;
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera Preview (Always active) */}
      <CameraPreview cameraRef={cameraRef} />

      {/* Subtitle Panel */}
      <SubtitlePanel
        userText={userText}
        assistantText={assistantText}
        isLoading={status === 'processing'}
      />

      {/* Control Area */}
      <View style={styles.actionArea}>
        <TouchableOpacity
          style={[styles.button, getButtonStyle()]}
          onPress={status === 'idle' ? startSession : stopSession}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{getStatusText()}</Text>
          {status === 'listening' && (
            <Text style={styles.subText}>Speak now...</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
    backgroundColor: '#000000',
  },
  actionArea: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  button: {
    width: '85%',
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonStart: {
    backgroundColor: '#1e88e5',
  },
  buttonListening: {
    backgroundColor: '#e53935', // Red for recording
    borderWidth: 4,
    borderColor: '#ff8a80',
  },
  buttonProcessing: {
    backgroundColor: '#fb8c00', // Orange for processing
  },
  buttonSpeaking: {
    backgroundColor: '#43a047', // Green for speaking
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  }
});
