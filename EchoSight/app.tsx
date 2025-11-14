import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Button,
  StyleSheet,
  Platform,
} from 'react-native';

import {
  requestAuthorization,
  startListening,
  stopListening,
  addPartialListener,
  addFinalListener,
} from './src/native/ASRModule';

function App() {
  const [authorized, setAuthorized] = useState(false);
  const [listening, setListening] = useState(false);
  const [partialText, setPartialText] = useState('');
  const [finalText, setFinalText] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      console.warn('当前 demo 只实现了 iOS ASR');
      return;
    }

    requestAuthorization().then(setAuthorized);

    const subPartial = addPartialListener((text) => {
      setPartialText(text);
    });

    const subFinal = addFinalListener((text) => {
      setFinalText((prev) => (prev ? prev + '\n' : '') + text);
      setPartialText('');
    });

    return () => {
      subPartial.remove();
      subFinal.remove();
      stopListening();
    };
  }, []);

  const onToggle = () => {
    if (!authorized) {
      console.warn('还没拿到语音识别权限');
      return;
    }
    if (listening) {
      stopListening();
      setListening(false);
    } else {
      startListening();
      setListening(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>SafePathRN · ASR Demo</Text>
      <Text style={styles.status}>
        授权状态：{authorized ? '✅ 已授权' : '❌ 未授权'}
      </Text>
      <View style={styles.buttonRow}>
        <Button
          title={listening ? '停止录音' : '开始录音'}
          onPress={onToggle}
        />
      </View>

      <Text style={styles.sectionTitle}>实时识别（partial）</Text>
      <View style={styles.box}>
        <Text style={styles.text}>{partialText || '（暂无）'}</Text>
      </View>

      <Text style={styles.sectionTitle}>最终结果（final）</Text>
      <View style={styles.box}>
        <Text style={styles.text}>{finalText || '（暂无）'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    marginBottom: 16,
  },
  buttonRow: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  box: {
    minHeight: 80,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
  },
});

export default App;
