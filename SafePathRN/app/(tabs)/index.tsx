import { StyleSheet } from 'react-native';
import { SessionScreen } from '@/components/SessionScreen';

export default function HomeScreen() {
  return <SessionScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
