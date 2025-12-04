import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

interface CameraPreviewProps {
  onCameraReady?: () => void;
  cameraRef?: React.MutableRefObject<CameraView | null>;
}

export function CameraPreview({ onCameraReady, cameraRef }: CameraPreviewProps) {
  const [facing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const localCameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleCameraReady = () => {
    console.log('Camera is ready');
    onCameraReady?.();
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.message}>Initializing camera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.message}>Camera permission required</Text>
          <Text style={styles.subMessage}>
            Please grant camera access in settings to use this feature
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        ref={(ref) => {
          localCameraRef.current = ref;
          if (cameraRef) {
            cameraRef.current = ref;
          }
        }}
        onCameraReady={handleCameraReady}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  message: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  subMessage: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
