import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { API_BASE_URL, OPENROUTER_API_KEY } from '../config/env';
import { checkBackendHealth } from '../services/asrLlmService';

export function SettingsScreen() {
  const [backendUrl, setBackendUrl] = useState(API_BASE_URL);
  const [apiKey, setApiKey] = useState(OPENROUTER_API_KEY);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const testBackendConnection = async () => {
    setIsTestingConnection(true);
    try {
      const isHealthy = await checkBackendHealth();
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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
          Current: {API_BASE_URL}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
