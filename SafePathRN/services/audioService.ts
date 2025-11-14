import { Audio } from 'expo-av';

let recording: Audio.Recording | null = null;

/**
 * Request microphone permission and start recording
 */
export async function startRecording(): Promise<void> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Microphone permission not granted');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const result = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recording = result.recording;
  } catch (error) {
    console.error('Failed to start recording:', error);
    throw error;
  }
}

/**
 * Stop recording and return the audio file URI
 */
export async function stopRecording(): Promise<string> {
  if (!recording) {
    throw new Error('Recording not started');
  }

  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;
    
    if (!uri) {
      throw new Error('Recording failed, URI is empty');
    }
    
    return uri;
  } catch (error) {
    console.error('Failed to stop recording:', error);
    recording = null;
    throw error;
  }
}

/**
 * Cancel recording without saving
 */
export async function cancelRecording(): Promise<void> {
  if (recording) {
    try {
      await recording.stopAndUnloadAsync();
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
    recording = null;
  }
}

/**
 * Get recording status
 */
export function isRecordingActive(): boolean {
  return recording !== null;
}
