import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { BiometricService } from '@/services/biometricService';
import { IconSymbol } from '@/components/ui/icon-symbol';

export function LoginScreen() {
  const { signInWithEmail, registerWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricLogin();
  }, []);

  const checkBiometricLogin = async () => {
    const { hasHardware, isEnrolled, supportedTypes } = await BiometricService.checkAvailability();
    console.log('[BiometricDebug] Hardware:', hasHardware, 'Enrolled:', isEnrolled, 'Types:', supportedTypes);

    if (hasHardware && isEnrolled) {
      setIsBiometricAvailable(true);
      // Check if we have stored credentials
      const credentials = await BiometricService.getCredentials();
      console.log('[BiometricDebug] Credentials found:', !!credentials);

      if (credentials) {
        // Auto-trigger biometric auth with a slight delay to ensure UI is ready
        setTimeout(() => {
          console.log('[BiometricDebug] Triggering auto-login...');
          handleBiometricLogin(credentials);
        }, 500);
      }
    } else {
      console.log('[BiometricDebug] Biometrics not available or not enrolled');
    }
  };

  const handleBiometricLogin = async (credentials: { email: string; pass: string }) => {
    const success = await BiometricService.authenticate('Login with Face ID');
    if (success) {
      setIsSubmitting(true);
      try {
        await signInWithEmail(credentials.email, credentials.pass);
      } catch (error) {
        Alert.alert('Biometric Login Failed', 'Could not sign in with stored credentials.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
        // Save credentials on successful login if biometric is available
        if (isBiometricAvailable) {
          await BiometricService.saveCredentials(email, password);
        }
      }
      setEmail('');
      setPassword('');
    } catch (error) {
      Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{isRegistering ? 'Create Account' : 'Welcome Back'}</Text>
        <Text style={styles.subtitle}>
          {isRegistering ? 'Register to start using SafePath.' : 'Sign in to continue to SafePath.'}
        </Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#777"
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#777"
          secureTextEntry
          textContentType="password"
        />

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isRegistering ? 'Create Account' : 'Sign In'}</Text>
          )}
        </TouchableOpacity>

        {/* Manual Biometric Button (if available but auto-trigger failed or cancelled) */}
        {isBiometricAvailable && !isRegistering && !isSubmitting && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={async () => {
              const creds = await BiometricService.getCredentials();
              if (creds) {
                handleBiometricLogin(creds);
              } else {
                Alert.alert('No Credentials', 'Please sign in manually once to enable Face ID.');
              }
            }}
          >
            <IconSymbol size={24} name="faceid" color="#1e88e5" />
            <Text style={styles.biometricText}>Login with Face ID</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => setIsRegistering((prev) => !prev)} disabled={isSubmitting}>
          <Text style={styles.toggleText}>
            {isRegistering ? 'Have an account? Sign in' : "New here? Create an account"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    color: '#fff',
  },
  button: {
    backgroundColor: '#1e88e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleText: {
    color: '#1e88e5',
    textAlign: 'center',
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  biometricText: {
    color: '#1e88e5',
    fontSize: 16,
    fontWeight: '600',
  },
});
