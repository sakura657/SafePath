import * as Speech from 'expo-speech';

/**
 * Speak the given text using the device's TTS engine
 */
/**
 * Speak the given text using the device's TTS engine
 */
export function speak(
  text: string,
  language: string = 'en-US',
  options?: { onDone?: () => void; onError?: (error: any) => void }
): void {
  if (!text || text.trim().length === 0) {
    console.warn('Empty text provided to TTS');
    options?.onDone?.(); // Treat as done immediately
    return;
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
