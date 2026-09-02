import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const PURPLE = '#5B00FF';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isTransactions = pathname.includes('transactions');
  const isDashboard = pathname.includes('dashboard');
  const isAnalytics = pathname.includes('analytics');

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.navItem}
        onPress={() => router.replace('/transactions')}
      >
        <View
          style={[
            styles.iconContainer,
            isTransactions && styles.activeIconContainer,
          ]}
        >
          <Ionicons
            name="receipt-outline"
            size={25}
            color={isTransactions ? PURPLE : '#FFFFFF'}
          />
        </View>

        <Text
          style={[
            styles.navText,
            isTransactions && styles.activeText,
          ]}
        >
          TRANSACTIONS
        </Text>
      </Pressable>

      <Pressable
        style={styles.navItem}
        onPress={() => router.replace('/dashboard')}
      >
        <View
          style={[
            styles.iconContainer,
            isDashboard && styles.activeIconContainer,
          ]}
        >
          <Ionicons
            name="home-outline"
            size={25}
            color={isDashboard ? PURPLE : '#FFFFFF'}
          />
        </View>

        <Text
          style={[
            styles.navText,
            isDashboard && styles.activeText,
          ]}
        >
          DASHBOARD
        </Text>
      </Pressable>

      <Pressable
        style={styles.navItem}
        onPress={() => router.replace('/analytics')}
      >
        <View
          style={[
            styles.iconContainer,
            isAnalytics && styles.activeIconContainer,
          ]}
        >
          <Ionicons
            name="bar-chart-outline"
            size={25}
            color={isAnalytics ? PURPLE : '#FFFFFF'}
          />
        </View>

        <Text
          style={[
            styles.navText,
            isAnalytics && styles.activeText,
          ]}
        >
          ANALYTICS
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
 container: {
  height: 78,
  width: '100%',
  backgroundColor: '#808080',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-around',
},
  navItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeIconContainer: {
    backgroundColor: '#FFFFFF',
  },

  navText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '600',
    marginTop: 2,
  },

  activeText: {
    color: PURPLE,
    fontWeight: '700',
  },
});