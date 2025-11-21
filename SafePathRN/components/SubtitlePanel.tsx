import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SubtitleData } from '../types';

interface SubtitlePanelProps {
  userText: string;
  assistantText: string;
  isLoading?: boolean;
}

export function SubtitlePanel({ userText, assistantText, isLoading }: SubtitlePanelProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* User Section */}
        <View style={styles.section}>
          <Text style={styles.label}>You</Text>
          <View style={styles.textContainer}>
            {userText ? (
              <Text style={styles.text}>{userText}</Text>
            ) : (
              <Text style={styles.placeholder}>
                Your speech will appear here...
              </Text>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Assistant Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Assistant</Text>
          <View style={styles.textContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Processing...</Text>
                <View style={styles.loadingDots}>
                  <Text style={styles.dot}>●</Text>
                  <Text style={styles.dot}>●</Text>
                  <Text style={styles.dot}>●</Text>
                </View>
              </View>
            ) : assistantText ? (
              <Text style={styles.text}>{assistantText}</Text>
            ) : (
              <Text style={styles.placeholder}>
                Assistant response will appear here...
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    gap: 8,
  },
  section: {
    gap: 8,
  },
  label: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textContainer: {
    minHeight: 60,
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
  },
  placeholder: {
    color: '#555555',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#1e88e5',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    color: '#1e88e5',
    fontSize: 8,
  },
});
