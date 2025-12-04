import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { checkBackendHealth } from '../services/asrLlmService';
import { useAppConfig } from '../config/AppConfigProvider';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export function SettingsScreen() {
  const { config, updateConfig, resetConfig } = useAppConfig();
  const { user, signOut } = useAuth();
  const [backendUrl, setBackendUrl] = useState(config.apiBaseUrl);
  const [apiKey, setApiKey] = useState(config.openRouterApiKey);
  const [model, setModel] = useState(config.openRouterModel);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setBackendUrl(config.apiBaseUrl);
    setApiKey(config.openRouterApiKey);
    setModel(config.openRouterModel);
  }, [config]);

  const testBackendConnection = async () => {
    setIsTestingConnection(true);
    try {
      const isHealthy = await checkBackendHealth(backendUrl);
      if (isHealthy) {
        Alert.alert('Success', 'Backend connection successful!');
      } else {
        Alert.alert('Error', 'Backend is not responding. Please check the URL.');
      }
    } catch (error) {
      Alert.alert(
        'Connection Failed',
        'Could not connect to backend. Please verify the URL and try again.'
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      await updateConfig({
        apiBaseUrl: backendUrl.trim(),
        openRouterApiKey: apiKey.trim(),
        openRouterModel: model.trim(),
      });
      Alert.alert('Saved', 'Configuration updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    await resetConfig();
    Alert.alert('Reset', 'Configuration restored to defaults.');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ...

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* ... content ... */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <Text style={styles.description}>
            Configure your backend API and OpenRouter settings below.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Backend API URL</Text>
          <TextInput
            style={styles.input}
            value={backendUrl}
            onChangeText={setBackendUrl}
            placeholder="http://localhost:3000"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            Current: {config.apiBaseUrl}
          </Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={testBackendConnection}
            disabled={isTestingConnection}
          >
            <Text style={styles.testButtonText}>
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>OpenRouter API Key</Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk-or-v1-..."
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <Text style={styles.hint}>
            Used for VLM (Vision Language Model) analysis
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>OpenRouter Model</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="google/gemini-2.5-flash-lite-preview-09-2025"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.sectionButtons}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.buttonDisabled]}
            onPress={saveSettings}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Settings'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.description}>
            Signed in as{' '}
            <Text style={styles.infoValue}>{user?.email ?? 'Unknown user'}</Text>
          </Text>
          <TouchableOpacity
            style={[styles.logoutButton, isLoggingOut && styles.buttonDisabled]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Text style={styles.logoutButtonText}>{isLoggingOut ? 'Logging out...' : 'Logout'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>
            SafePath uses advanced AI to provide voice interaction and obstacle detection
            for enhanced navigation assistance.
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Voice Mode:</Text>
            <Text style={styles.infoValue}>ASR + LLM</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Obstacle Mode:</Text>
            <Text style={styles.infoValue}>VLM Analysis</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.warningText}>
            ⚠️ Note: Backend server must be running for voice interaction mode to work.
            Obstacle detection mode requires a valid OpenRouter API key.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    color: '#aaa',
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
  },
  hint: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  sectionButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testButton: {
    backgroundColor: '#1e88e5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#43a047',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#e53935',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  infoLabel: {
    color: '#aaa',
    fontSize: 15,
  },
  infoValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  warningText: {
    color: '#ff9800',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
