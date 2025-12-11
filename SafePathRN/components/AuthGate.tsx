import { ReactNode } from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { LoginScreen } from '@/components/LoginScreen';

import { BiometricLockScreen } from '@/components/BiometricLockScreen';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, initializing, isLocked } = useAuth();

  if (initializing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Preparing your session...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (isLocked) {
    return <BiometricLockScreen />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    gap: 12,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
