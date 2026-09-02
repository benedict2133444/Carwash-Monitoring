import React from 'react';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'react-native';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
{/* HEADER */}
<View style={styles.header}>

  {/* LEFT: Logo + Dashboard Title */}
  <View style={styles.headerLeft}>

    <View style={styles.logoCircle}>
      <Image
        source={require('@/assets/images/bubble-buddies-logo.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
    </View>

    <View style={styles.titleContainer}>
      <Text style={styles.title}>DASHBOARD</Text>

      <Text style={styles.subtitle}>
        View your carwash overview and
      </Text>

      <Text style={styles.subtitle}>
        current machine status.
      </Text>
    </View>

  </View>

  {/* RIGHT: Date + Time + Notification */}
  <View style={styles.headerRight}>

    <Text style={styles.date}>
      Dec 30, 2026
    </Text>

    <Text style={styles.time}>
      11:59 AM
    </Text>

    <Pressable
      onPress={() => router.push('/notifications')}
    >
      <Ionicons
        name="notifications-outline"
        size={30}
        color="#FFFFFF"
        style={styles.bell}
      />
    </Pressable>

  </View>

</View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* MACHINE STATUS */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.sectionTitle}>MACHINE STATUS</Text>

              <View style={styles.creditContainer}>
                <Text style={styles.smallLabel}>Current Credit</Text>
                <Text style={styles.credit}>₱20.00</Text>
              </View>
            </View>

            <View style={styles.runningRow}>
              <View style={styles.runningBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.runningText}>RUNNING</Text>
              </View>
            </View>

            <View style={styles.statusDetails}>
              <View>
                <Text style={styles.smallLabel}>Current Service</Text>
                <Text style={styles.serviceText}>☁ Soap Wash</Text>
              </View>

              <View>
                <Text style={styles.smallLabel}>Remaining Time</Text>
                <Text style={styles.remainingTime}>0:27</Text>
              </View>

              <View>
                <Text style={styles.smallLabel}>Session Started</Text>
                <Text style={styles.sessionTime}>11:59 AM</Text>
              </View>
            </View>

            <View style={styles.customerBadge}>
              <Text style={styles.customerIcon}>♙</Text>
              <Text style={styles.customerText}>Customer #2</Text>
            </View>
          </View>

          {/* SUMMARY CARDS */}
          <View style={styles.summaryRow}>

            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>TODAY'S REVENUE</Text>
              <View style={styles.circleIcon}>
                <Text style={styles.circleIconText}>₱</Text>
              </View>
              <Text style={styles.revenue}>₱1,050.00</Text>
              <Text style={styles.growth}>↑ 12.5%</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>TODAY'S SESSIONS</Text>
              <View style={styles.circleIcon}>
                <Text style={styles.circleIconText}>♙</Text>
              </View>
              <Text style={styles.bigNumber}>18</Text>
              <Text style={styles.growth}>↑ 20%</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>WATER QUALITY</Text>
              <View style={styles.circleIcon}>
                <Text style={styles.circleIconText}>●</Text>
              </View>
              <Text style={styles.ntText}>8 NTU</Text>
              <Text style={styles.goodText}>GOOD</Text>
            </View>

          </View>

          {/* RECENT ACTIVITY + MACHINE CONTROLS */}
<View style={styles.middleRow}>

  {/* LEFT: RECENT ACTIVITY */}
  <View style={styles.activityCard}>
    <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>

    <ActivityRow
      time="11:59 AM"
      icon="💧"
      title="Soap Wash Started"
      subtitle="Customer #2"
    />

    <ActivityRow
      time="11:59 AM"
      icon="●"
      title="Water Wash Ended"
      subtitle="Session #18"
    />

    <ActivityRow
      time="11:58 AM"
      icon="💧"
      title="Water Wash Started"
      subtitle="Customer #2"
    />

    <ActivityRow
      time="11:58 AM"
      icon="✓"
      title="Payment Successful"
      subtitle="₱20.00"
      green
    />

    <ActivityRow
      time="11:57 AM"
      icon="₱"
      title="Coin Acceptor Activated"
      subtitle="₱20.00"
      yellow
    />

    <ActivityRow
      time="11:55 AM"
      icon="✓"
      title="Session Ended"
      subtitle="Customer #1"
      green
    />
  </View>

  {/* RIGHT: MACHINE FUNCTIONS */}
  <View style={styles.controlsCard}>
    <ControlButton
      title="Water Pressure"
      icon="water-outline"
      active
    />

    <ControlButton
      title="Soap"
      icon="flask-outline"
    />

    <ControlButton
      title="Blower"
      icon="speedometer-outline"
    />

    <ControlButton
      title="Faucet"
      icon="rainy-outline"
    />
  </View>

          </View>

         {/* CONNECTION STATUS */}
<View style={styles.connectionCard}>
  <Text style={styles.sectionTitle}>CONNECTION STATUS</Text>

  <View style={styles.connectionRow}>

    {/* ESP32 */}
    <View style={styles.connectionItem}>
      <Ionicons
        name="hardware-chip-outline"
        size={18}
        color="#4B00FF"
      />

      <Text style={styles.connectionName}>
        ESP32
      </Text>

      <View style={styles.connectedRow}>
        <View style={styles.connectedDot} />
        <Text style={styles.connectedText}>
          Connected
        </Text>
      </View>
    </View>

    {/* Touch Display */}
    <View style={styles.connectionItem}>
      <Ionicons
        name="tablet-landscape-outline"
        size={16}
        color="#4B00FF"
      />

      <Text style={styles.connectionName}>
        Touch Display
      </Text>

      <View style={styles.connectedRow}>
        <View style={styles.connectedDot} />
        <Text style={styles.connectedText}>
          Connected
        </Text>
      </View>
    </View>

    {/* Server */}
    <View style={styles.connectionItem}>
      <Ionicons
        name="cloud-outline"
        size={16}
        color="#4B00FF"
      />

      <Text style={styles.connectionName}>
        Server
      </Text>

      <View style={styles.connectedRow}>
        <View style={styles.connectedDot} />
        <Text style={styles.connectedText}>
          Connected
        </Text>
      </View>
    </View>

    {/* Last Sync */}
    <View style={styles.connectionItem}>
      <Ionicons
        name="sync-outline"
        size={16}
        color="#4B00FF"
      />

      <Text style={styles.connectionName}>
        Last Sync
      </Text>

      <Text style={styles.syncText}>
        Just now
      </Text>
    </View>

  </View>
</View>
        </ScrollView>

      
       

      </View>
    </SafeAreaView>
  );
}

function ActivityRow({
  time,
  icon,
  title,
  subtitle,
  green,
  yellow,
}: {
  time: string;
  icon: string;
  title: string;
  subtitle: string;
  green?: boolean;
  yellow?: boolean;
}) {
  return (
    <View style={styles.activityRow}>
      <Text style={styles.activityTime}>{time}</Text>

      <View
        style={[
          styles.activityIcon,
          green && styles.greenActivityIcon,
          yellow && styles.yellowActivityIcon,
        ]}
      >
        <Text style={styles.activityIconText}>{icon}</Text>
      </View>

      <View style={styles.activityTextContainer}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activitySubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ControlButton({
  title,
  icon,
  active,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  active?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.controlButton,
        active && styles.controlButtonActive,
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color="#FFFFFF"
      />

      <Text style={styles.controlTitle}>
        {title}
      </Text>
    </Pressable>
  );
}

function ConnectionItem({
  icon,
  name,
}: {
  icon: string;
  name: string;
}) {
  return (
    <View style={styles.connectionItem}>
      <Text style={styles.connectionIcon}>{icon}</Text>

      <View>
        <Text style={styles.connectionName}>{name}</Text>
        <View style={styles.connectedRow}>
          <View style={styles.connectedDot} />
          <Text style={styles.connectedText}>Connected</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#6AA3DD',
  },

  container: {
     flex: 1,
  width: '100%',
  maxWidth: 430,
  alignSelf: 'center',
  backgroundColor: '#6AA3DD',
  },
header: {
  minHeight: 105,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  paddingHorizontal: 18,
  paddingTop: 18,
},

headerLeft: {
  flexDirection: 'row',
  alignItems: 'flex-start',
},

titleContainer: {
  marginLeft: 12,
  paddingTop: 4,
},

title: {
  fontSize: 20,
  fontWeight: '700',
  color: '#FFFFFF',
},

subtitle: {
  marginTop: 2,
  fontSize: 9,
  color: '#FFFFFF',
},

logoCircle: {
  width: 62,
  height: 62,
  borderRadius: 44,
  backgroundColor: '#E8E8E8',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
  overflow: 'hidden',
},

logoImage: {
  width: 60,
  height: 60,
},

greetingContainer: {
  justifyContent: 'center',
},

greeting: {
  color: '#FFFFFF',
  fontSize: 11,
  fontWeight: '500',
},

subtitle: {
  color: '#E9F3FF',
  fontSize: 10,
  lineHeight: 12,
},

headerRight: {
  alignItems: 'flex-end',
},

date: {
  color: '#FFFFFF',
  fontSize: 12,
},

time: {
  color: '#FFFFFF',
  fontSize: 12,
  textAlign: 'right',
},

bell: {
  marginTop: 12,
  marginRight: 5,
},

  statusCard: {
    backgroundColor: '#E5E5E5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 7,
  },
  dateContainer: {
  position: 'absolute',
  top: 20,
  right: 28,
  alignItems: 'flex-end',
},

  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    color: '#222222',
    fontSize: 7,
    fontWeight: '700',
  },

  creditContainer: {
    alignItems: 'flex-end',
  },

  smallLabel: {
    color: '#333333',
    fontSize: 6,
  },

  credit: {
    color: '#4B00FF',
    fontSize: 17,
    fontWeight: '600',
  },

  runningRow: {
    marginTop: 2,
  },

  runningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#00C853',
    marginRight: 3,
  },

  runningText: {
    color: '#00A844',
    fontSize: 6,
    fontWeight: '700',
  },

  statusDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  serviceText: {
    color: '#48B8E8',
    fontSize: 7,
    marginTop: 3,
  },

  remainingTime: {
    color: '#FF9D00',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 1,
  },

  sessionTime: {
    color: '#333333',
    fontSize: 7,
    marginTop: 4,
  },

  customerBadge: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D8D8D8',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 4,
  },

  customerIcon: {
    fontSize: 8,
    marginRight: 3,
  },

  customerText: {
    color: '#333333',
    fontSize: 6,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 7,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#E5E5E5',
    borderRadius: 8,
    padding: 7,
    alignItems: 'center',
    minHeight: 76,
  },

  cardTitle: {
    color: '#222222',
    fontSize: 5.5,
    fontWeight: '700',
    textAlign: 'center',
  },

  circleIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4B00FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  circleIconText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },

  revenue: {
    color: '#4B00FF',
    fontSize: 7,
    fontWeight: '600',
    marginTop: 3,
  },

  bigNumber: {
    color: '#222222',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 3,
  },

  ntText: {
    color: '#222222',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 3,
  },

  growth: {
    color: '#00A844',
    fontSize: 5,
  },

  goodText: {
    color: '#00A844',
    fontSize: 5,
    fontWeight: '700',
  },

  middleRow: {
  flexDirection: 'row',
  gap: 7,
  marginBottom: 7,
},

activityCard: {
  flex: 1.25,
  backgroundColor: '#E5E5E5',
  borderRadius: 9,
  padding: 8,
  minHeight: 176,
},

controlsCard: {
  flex: 0.75,
  backgroundColor: '#E5E5E5',
  borderRadius: 9,
  padding: 8,
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 5,
  alignContent: 'flex-start',
  minHeight: 176,
},

activitySection: {
  flex: 1,
},

activityRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 6,
},

activityTime: {
  color: '#444444',
  fontSize: 4.8,
  width: 32,
},

activityIcon: {
  width: 16,
  height: 16,
  borderRadius: 8,
  backgroundColor: '#4B00FF',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 4,
},

greenActivityIcon: {
  backgroundColor: '#00C853',
},

yellowActivityIcon: {
  backgroundColor: '#C7B900',
},

activityIconText: {
  color: '#FFFFFF',
  fontSize: 7,
},

activityTextContainer: {
  flex: 1,
},

activityTitle: {
  color: '#222222',
  fontSize: 5.3,
  fontWeight: '600',
},

activitySubtitle: {
  color: '#666666',
  fontSize: 4.5,
},

controlButton: {
  width: '47%',
  height: 70,
  borderRadius: 8,
  backgroundColor: '#10C9E5',
  alignItems: 'center',
  justifyContent: 'center',
},

controlButtonActive: {
  backgroundColor: '#180544',
},

controlTitle: {
  color: '#FFFFFF',
  fontSize: 5.5,
  fontWeight: '600',
  marginTop: 4,
  textAlign: 'center',
},

connectionCard: {
  backgroundColor: '#E5E5E5',
  borderRadius: 9,
  padding: 9,
  marginBottom: 7,
},

connectionRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
},

connectionItem: {
  flex: 1,
  alignItems: 'center',
},

connectionName: {
  color: '#333333',
  fontSize: 5.5,
  fontWeight: '600',
  marginTop: 4,
  textAlign: 'center',
},

connectedRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 3,
},

connectedDot: {
  width: 5,
  height: 5,
  borderRadius: 3,
  backgroundColor: '#00C853',
  marginRight: 3,
},

connectedText: {
  color: '#00A844',
  fontSize: 4.5,
},

  lastSync: {
    alignItems: 'flex-end',
  },

syncText: {
  color: '#666666',
  fontSize: 4.5,
  marginTop: 3,
},

  bottomNav: {
    height: 56,
    backgroundColor: '#777777',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navIcon: {
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 28,
  },

  dashboardIcon: {
    color: '#4B00FF',
    fontSize: 30,
    lineHeight: 30,
  },

  navText: {
    color: '#FFFFFF',
    fontSize: 5,
    fontWeight: '600',
  },

  dashboardText: {
    color: '#4B00FF',
    fontSize: 5,
    fontWeight: '700',
  },
});