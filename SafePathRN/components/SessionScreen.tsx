import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { CameraPreview } from '../components/CameraPreview';
import { SubtitlePanel } from '../components/SubtitlePanel';
import { startRecording, stopRecording, cancelRecording } from '../services/audioService';
import { sendAudioToBackend } from '../services/asrLlmService';
import { speak, stopSpeaking } from '../services/ttsService';
import { analyzeImageWithVLM } from '../services/vlmService';
import { AppMode } from '../types';
import { useAppConfig } from '../config/AppConfigProvider';

export function SessionScreen() {
  const [mode, setMode] = useState<AppMode>(AppMode.VOICE_INTERACTION);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userText, setUserText] = useState('');
  const [assistantText, setAssistantText] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const { config } = useAppConfig();
  
  const cameraRef = useRef<CameraView | null>(null);

  /**
   * Handle voice interaction mode - record audio and get LLM response
   */
  const handleVoiceInteraction = async () => {
    try {
      if (!isRecording) {
        // Start recording
        setUserText('');
        setAssistantText('');
        stopSpeaking(); // Stop any ongoing TTS
        
        await startRecording();
        setIsRecording(true);
      } else {
        // Stop recording and process
        setIsRecording(false);
        setIsProcessing(true);
        
        const audioUri = await stopRecording();
        console.log('Audio recorded:', audioUri);
        
        // Send to backend for ASR + LLM
  const response = await sendAudioToBackend(audioUri, 'en', sessionId, config.apiBaseUrl);
        
        setUserText(response.user_text);
        setAssistantText(response.assistant_text);
        
        // Speak the response
        speak(response.assistant_text, 'en-US');
      }
    } catch (error) {
      console.error('Voice interaction error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to process voice input'
      );
      await cancelRecording();
      setIsRecording(false);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle obstacle detection mode - capture image and analyze with VLM
   */
  const handleObstacleDetection = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      setIsProcessing(true);
      setUserText('');
      setAssistantText('');
      stopSpeaking();

      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo || !photo.uri) {
        throw new Error('Failed to capture image');
      }

      console.log('Image captured:', photo.uri);

      // Analyze with VLM
      const vlmResponse = await analyzeImageWithVLM(
        photo.uri,
        'Describe the scene for a visually impaired person. Focus on obstacles, hazards, and navigation guidance.'
      );

      const responseText = vlmResponse.description;
      
      setUserText('Scene analysis requested');
      setAssistantText(responseText);
      
      // Speak the description
      speak(responseText, 'en-US');
      
    } catch (error) {
      console.error('Obstacle detection error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to analyze scene'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Main action handler based on current mode
   */
  const handleMainAction = () => {
    if (mode === AppMode.VOICE_INTERACTION) {
      handleVoiceInteraction();
    } else {
      handleObstacleDetection();
    }
  };

  const getButtonText = () => {
    if (isProcessing) return 'Processing...';
    
    if (mode === AppMode.VOICE_INTERACTION) {
      return isRecording ? 'Stop & Send' : 'Press to Speak';
    } else {
      return 'Capture & Analyze';
    }
  };

  const getButtonStyle = () => {
    if (isRecording) return styles.buttonRecording;
    if (mode === AppMode.OBSTACLE_DETECTION) return styles.buttonObstacle;
    return styles.button;
  };

  return (
    <View style={styles.container}>
      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === AppMode.VOICE_INTERACTION && styles.modeButtonActive,
          ]}
          onPress={() => {
            setMode(AppMode.VOICE_INTERACTION);
            cancelRecording();
            setIsRecording(false);
          }}
          disabled={isRecording || isProcessing}
        >
          <Text
            style={[
              styles.modeButtonText,
              mode === AppMode.VOICE_INTERACTION && styles.modeButtonTextActive,
            ]}
          >
            Voice
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === AppMode.OBSTACLE_DETECTION && styles.modeButtonActive,
          ]}
          onPress={() => {
            setMode(AppMode.OBSTACLE_DETECTION);
            cancelRecording();
            setIsRecording(false);
          }}
          disabled={isRecording || isProcessing}
        >
          <Text
            style={[
              styles.modeButtonText,
              mode === AppMode.OBSTACLE_DETECTION && styles.modeButtonTextActive,
            ]}
          >
            Obstacle
          </Text>
        </TouchableOpacity>
      </View>

      {/* Camera Preview */}
      <CameraPreview cameraRef={cameraRef} />

      {/* Subtitle Panel */}
      <SubtitlePanel
        userText={userText}
        assistantText={assistantText}
        isLoading={isProcessing}
      />

      {/* Action Button */}
      <View style={styles.actionArea}>
        {isProcessing && <ActivityIndicator size="large" color="#1e88e5" />}
        
        <TouchableOpacity
          style={[getButtonStyle(), (isProcessing) && styles.buttonDisabled]}
          onPress={handleMainAction}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{getButtonText()}</Text>
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
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333333',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#1e88e5',
    borderColor: '#1e88e5',
  },
  modeButtonText: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  actionArea: {
    alignItems: 'center',
    paddingBottom: 16,
    gap: 12,
  },
  button: {
    width: '85%',
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e88e5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1e88e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonRecording: {
    width: '85%',
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonObstacle: {
    width: '85%',
    height: 64,
    borderRadius: 32,
    backgroundColor: '#43a047',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#43a047',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
