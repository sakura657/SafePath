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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { CameraPreview } from '../components/CameraPreview';
import { OverlayBubble } from '../components/ui/OverlayBubble';
import { IconSymbol } from '@/components/ui/icon-symbol';
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
  const [showUserText, setShowUserText] = useState(false);
  const [showAssistantText, setShowAssistantText] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const { config } = useAppConfig();
  const insets = useSafeAreaInsets();

  const cameraRef = useRef<CameraView | null>(null);

  // VAD Refs
  const lastSpeechTime = useRef<number>(0);
  const silenceStartTime = useRef<number>(0);
  const isSpeechDetected = useRef<boolean>(false);
  const speechStartTime = useRef<number>(0);
  const userTextTimer = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRecording();
      stopSpeaking();
      if (userTextTimer.current) clearTimeout(userTextTimer.current);
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
    setShowUserText(false);
    setShowAssistantText(false);
  };

  /**
   * Start Listening (Recording with VAD)
   */
  const startListening = async () => {
    try {
      setStatus('listening');
      setShowAssistantText(false); // Hide AI text when listening starts

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

      // Show User Text (Green Bubble)
      setUserText(response.user_text);
      setShowUserText(true);

      // Auto-hide user text after 5 seconds
      if (userTextTimer.current) clearTimeout(userTextTimer.current);
      userTextTimer.current = setTimeout(() => {
        setShowUserText(false);
      }, 5000);

      // Show AI Text (Blue Bubble)
      setAssistantText(response.assistant_text);
      setShowAssistantText(true);

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

  const getButtonIcon = () => {
    switch (status) {
      case 'idle': return 'mic.fill';
      case 'listening': return 'waveform';
      case 'processing': return 'hourglass';
      case 'speaking': return 'speaker.wave.2.fill';
    }
  };

  const getButtonColor = () => {
    switch (status) {
      case 'idle': return '#1e88e5'; // Blue
      case 'listening': return '#e53935'; // Red
      case 'processing': return '#fb8c00'; // Orange
      case 'speaking': return '#43a047'; // Green
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera Preview (Always active) */}
      <CameraPreview cameraRef={cameraRef} />

      {/* AI Response (Blue Bubble - Top) */}
      <View style={[styles.topOverlay, { top: 20 + insets.top }]}>
        <OverlayBubble
          text={assistantText}
          type="ai"
          visible={showAssistantText}
        />
      </View>

      {/* User Speech (Green Bubble - Bottom) */}
      <View style={[styles.bottomOverlay, { bottom: 100 + insets.bottom }]}>
        <OverlayBubble
          text={userText}
          type="user"
          visible={showUserText}
        />
      </View>

      {/* Control Area - Simplified Button */}
      <View style={[styles.actionArea, { bottom: 20 + insets.bottom }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: getButtonColor() }]}
          onPress={status === 'idle' ? startSession : stopSession}
          activeOpacity={0.8}
        >
          <IconSymbol size={32} name={getButtonIcon()} color="#fff" />
          {status === 'idle' && <Text style={styles.buttonText}>Start</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  actionArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    height: 64,
    paddingHorizontal: 32,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
