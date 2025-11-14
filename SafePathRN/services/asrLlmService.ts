import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { API_BASE_URL } from '../config/env';
import { AsrLlmResponse } from '../types';

/**
 * Send audio file to backend for ASR + LLM processing
 */
export async function sendAudioToBackend(
  audioUri: string,
  language: string = 'en',
  sessionId?: string
): Promise<AsrLlmResponse> {
  try {
    const formData = new FormData();

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (!fileInfo.exists) {
      throw new Error('Audio file does not exist');
    }

    const fileName = audioUri.split('/').pop() || 'audio.m4a';

    // Append audio file
    formData.append('audio', {
      // @ts-ignore - React Native FormData handles this differently
      uri: audioUri,
      name: fileName,
      type: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/3gp',
    } as any);

    formData.append('language', language);
    
    if (sessionId) {
      formData.append('session_id', sessionId);
    }

    const response = await fetch(`${API_BASE_URL}/api/asr-llm`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type manually, let the browser/RN handle multipart boundary
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as AsrLlmResponse;
    return data;
  } catch (error) {
    console.error('Failed to send audio to backend:', error);
    throw error;
  }
}

/**
 * Health check for backend service
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}
