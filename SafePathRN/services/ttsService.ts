import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

/**
 * Speak the given text using the device's TTS engine
 */
export async function speak(
  text: string,
  language: string = 'en-US',
  options?: { onDone?: () => void; onError?: (error: any) => void }
): Promise<void> {
  if (!text || text.trim().length === 0) {
    console.warn('Empty text provided to TTS');
    options?.onDone?.(); // Treat as done immediately
    return;
  }

  try {
    // Ensure audio plays even in silent mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });
  } catch (error) {
    console.warn('Failed to set audio mode for TTS:', error);
  }

  // Stop any ongoing speech
  Speech.stop();

  Speech.speak(text, {
    language,
    pitch: 1.0,
    rate: 0.9,
    onDone: () => {
      console.log('TTS finished speaking');
      options?.onDone?.();
    },
    onError: (error) => {
      console.error('TTS error:', error);
      options?.onError?.(error);
    },
  });
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
  Speech.stop();
}

/**
 * Check if TTS is currently speaking
 */
export async function isSpeaking(): Promise<boolean> {
  return await Speech.isSpeakingAsync();
}

/**
 * Get available voices (platform-dependent)
 */
export async function getAvailableVoices() {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices;
  } catch (error) {
    console.error('Failed to get available voices:', error);
    return [];
  }
}
