import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import BottomNav from '@/components/bottom-nav';

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6AA5D8',
  },

  content: {
    flex: 1,
  },
});
