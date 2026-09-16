import React, { useEffect, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

type MachineStatus = {
  id: number;
  water_status: string;
  soap_status: string;
  blower_status: string;
  faucet_status: string;
  water_remaining: number;
  soap_remaining: number;
  blower_remaining: number;
  faucet_remaining: number;
  is_online: boolean;
  updated_at: string;
};

type ActivityRowProps = {
  time: string;
  icon: string;
  title: string;
  subtitle: string;
  green?: boolean;
  yellow?: boolean;
};

type ControlButtonProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
};

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [machine, setMachine] = useState<MachineStatus | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [serverConnected, setServerConnected] = useState(false);

  const MACHINE_TIMEOUT = 120000;
  const isCompact = width < 900;

  const machineAlive =
    machine?.is_online === true &&
    machine?.updated_at
      ? currentTime.getTime() -
          new Date(machine.updated_at).getTime() <
        MACHINE_TIMEOUT
      : false;

  const updatedAtMs = machine?.updated_at
    ? new Date(machine.updated_at).getTime()
    : NaN;

  const ageSeconds = Number.isFinite(updatedAtMs)
    ? Math.max(
        0,
        Math.floor(
          (currentTime.getTime() - updatedAtMs) / 1000
        )
      )
    : null;

  const lastSyncText =
    ageSeconds === null
      ? '--'
      : ageSeconds < 5
        ? 'Just now'
        : ageSeconds < 60
          ? `${ageSeconds}s ago`
          : `${Math.floor(ageSeconds / 60)}m ago`;

  useEffect(() => {
    const fetchMachineStatus = async () => {
      const { data, error } = await supabase
        .from('machine_status')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        console.error('Dashboard machine status error:', error);
        setServerConnected(false);
        setLoading(false);
        return;
      }

      setServerConnected(true);
      setMachine(data);
      setLoading(false);
    };

    fetchMachineStatus();

    const interval = setInterval(fetchMachineStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getLiveRemaining = (
    status: string,
    remaining: number
  ) => {
    if (status !== 'RUNNING') return 0;

    if (!machine?.updated_at) {
      return Math.max(0, remaining);
    }

    const updatedTime = new Date(
      machine.updated_at
    ).getTime();

    const elapsedSeconds = Math.max(
      0,
      Math.floor(
        (currentTime.getTime() - updatedTime) / 1000
      )
    );

    return Math.max(0, remaining - elapsedSeconds);
  };

  const waterRemaining = machine
    ? getLiveRemaining(
        machine.water_status,
        machine.water_remaining
      )
    : 0;

  const soapRemaining = machine
    ? getLiveRemaining(
        machine.soap_status,
        machine.soap_remaining
      )
    : 0;

  const blowerRemaining = machine
    ? getLiveRemaining(
        machine.blower_status,
        machine.blower_remaining
      )
    : 0;

  const faucetRemaining = machine
    ? getLiveRemaining(
        machine.faucet_status,
        machine.faucet_remaining
      )
    : 0;

  let currentService = 'No active service';
  let remainingSeconds = 0;

  if (machine?.water_status === 'RUNNING') {
    currentService = 'Water Wash';
    remainingSeconds = waterRemaining;
  } else if (machine?.soap_status === 'RUNNING') {
    currentService = 'Soap Wash';
    remainingSeconds = soapRemaining;
  } else if (machine?.blower_status === 'RUNNING') {
    currentService = 'Blower';
    remainingSeconds = blowerRemaining;
  } else if (machine?.faucet_status === 'RUNNING') {
    currentService = 'Faucet';
    remainingSeconds = faucetRemaining;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const remainingTimeText =
    `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const dateText = currentTime.toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const timeText = currentTime.toLocaleTimeString(
    undefined,
    {
      hour: 'numeric',
      minute: '2-digit',
    }
  );

  const serviceRows = [
    {
      label: 'Water Wash',
      icon: 'water-outline' as keyof typeof Ionicons.glyphMap,
      status: machine?.water_status ?? 'READY',
      remaining: waterRemaining,
    },
    {
      label: 'Soap Wash',
      icon: 'flask-outline' as keyof typeof Ionicons.glyphMap,
      status: machine?.soap_status ?? 'READY',
      remaining: soapRemaining,
    },
    {
      label: 'Blower',
      icon: 'speedometer-outline' as keyof typeof Ionicons.glyphMap,
      status: machine?.blower_status ?? 'READY',
      remaining: blowerRemaining,
    },
    {
      label: 'Faucet',
      icon: 'rainy-outline' as keyof typeof Ionicons.glyphMap,
      status: machine?.faucet_status ?? 'READY',
      remaining: faucetRemaining,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoCircle}>
              <Image
                source={require('@/assets/images/bubble-buddies-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <View>
              <Text style={styles.title}>DASHBOARD</Text>
              <Text style={styles.subtitle}>
                Carwash monitoring overview
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.dateTimeBlock}>
              <Text style={styles.date}>{dateText}</Text>
              <Text style={styles.time}>{timeText}</Text>
            </View>

            <Pressable
              style={styles.notificationButton}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View
            style={[
              styles.heroRow,
              isCompact && styles.heroRowCompact,
            ]}
          >
            <View style={styles.machineCard}>
              <View style={styles.machineCardTop}>
                <View>
                  <Text style={styles.eyebrow}>
                    MACHINE STATUS
                  </Text>

                  <View style={styles.statusLine}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: machineAlive
                            ? '#20C77A'
                            : '#F04444',
                        },
                      ]}
                    />

                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: machineAlive
                            ? '#20C77A'
                            : '#F04444',
                        },
                      ]}
                    >
                      {loading
                        ? 'CHECKING...'
                        : machineAlive
                          ? 'ONLINE'
                          : 'OFFLINE'}
                    </Text>
                  </View>
                </View>

                <View style={styles.creditPill}>
                  <Text style={styles.creditLabel}>
                    Current Credit
                  </Text>
                  <Text style={styles.creditValue}>
                    ₱20.00
                  </Text>
                </View>
              </View>

              <View style={styles.currentServiceBox}>
                <View style={styles.serviceIconLarge}>
                  <Ionicons
                    name={
                      currentService === 'Water Wash'
                        ? 'water-outline'
                        : currentService === 'Soap Wash'
                          ? 'flask-outline'
                          : currentService === 'Blower'
                            ? 'speedometer-outline'
                            : currentService === 'Faucet'
                              ? 'rainy-outline'
                              : 'car-outline'
                    }
                    size={34}
                    color="#4B00FF"
                  />
                </View>

                <View style={styles.currentServiceInfo}>
                  <Text style={styles.smallLabel}>
                    CURRENT SERVICE
                  </Text>
                  <Text style={styles.serviceName}>
                    {currentService}
                  </Text>
                  <Text style={styles.serviceHint}>
                    {machineAlive
                      ? 'Machine is communicating normally'
                      : 'Waiting for machine connection'}
                  </Text>
                </View>

                <View style={styles.timerBlock}>
                  <Text style={styles.smallLabel}>
                    REMAINING
                  </Text>
                  <Text style={styles.timerText}>
                    {remainingTimeText}
                  </Text>
                </View>
              </View>

              <View style={styles.machineFooter}>
                <View style={styles.infoItem}>
                  <Ionicons
                    name="sync-outline"
                    size={17}
                    color="#777"
                  />
                  <View>
                    <Text style={styles.infoLabel}>
                      Last sync
                    </Text>
                    <Text style={styles.infoValue}>
                      {lastSyncText}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <Ionicons
                    name="server-outline"
                    size={17}
                    color="#777"
                  />
                  <View>
                    <Text style={styles.infoLabel}>
                      Server
                    </Text>
                    <Text
                      style={[
                        styles.infoValue,
                        {
                          color: serverConnected
                            ? '#20A66A'
                            : '#F04444',
                        },
                      ]}
                    >
                      {serverConnected
                        ? 'Connected'
                        : 'Offline'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.connectionCard}>
              <Text style={styles.sectionTitle}>
                CONNECTION STATUS
              </Text>

              <ConnectionItem
                icon="hardware-chip-outline"
                label="ESP32 Controller"
                status={
                  machineAlive
                    ? 'Connected'
                    : 'Offline'
                }
                connected={machineAlive}
              />

              <ConnectionItem
                icon="tablet-landscape-outline"
                label="Touch Display"
                status="Connected"
                connected
              />

              <ConnectionItem
                icon="cloud-outline"
                label="Supabase Server"
                status={
                  serverConnected
                    ? 'Connected'
                    : 'Offline'
                }
                connected={serverConnected}
              />

              <View style={styles.connectionDivider} />

              <View style={styles.connectionHint}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#4B00FF"
                />
                <Text style={styles.connectionHintText}>
                  Machine status updates automatically.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                TODAY'S OVERVIEW
              </Text>
              <Text style={styles.sectionSubtitle}>
                Quick look at today's carwash activity
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.summaryRow,
              isCompact && styles.summaryRowCompact,
            ]}
          >
            <SummaryCard
              icon="cash-outline"
              title="REVENUE"
              value="₱1,050.00"
              detail="Today"
              positive="12.5%"
            />

            <SummaryCard
              icon="people-outline"
              title="SESSIONS"
              value="18"
              detail="Today"
              positive="20%"
            />

            <SummaryCard
              icon="water-outline"
              title="WATER QUALITY"
              value="8 NTU"
              detail="Current reading"
              good
            />
          </View>

          <View
            style={[
              styles.contentRow,
              isCompact && styles.contentRowCompact,
            ]}
          >
            <View style={styles.activityCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    RECENT ACTIVITY
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Latest system events
                  </Text>
                </View>

                <Ionicons
                  name="time-outline"
                  size={20}
                  color="#777"
                />
              </View>

              <ActivityRow
                time="11:59 AM"
                icon="water-outline"
                title="Soap Wash Started"
                subtitle="Customer #2"
              />

              <ActivityRow
                time="11:59 AM"
                icon="checkmark-circle-outline"
                title="Water Wash Ended"
                subtitle="Session #18"
                green
              />

              <ActivityRow
                time="11:58 AM"
                icon="water-outline"
                title="Water Wash Started"
                subtitle="Customer #2"
              />

              <ActivityRow
                time="11:58 AM"
                icon="checkmark-circle-outline"
                title="Payment Successful"
                subtitle="₱20.00"
                green
              />

              <ActivityRow
                time="11:57 AM"
                icon="cash-outline"
                title="Coin Acceptor Activated"
                subtitle="₱20.00"
                yellow
              />
            </View>

            <View style={styles.servicesCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    MACHINE SERVICES
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Live service states
                  </Text>
                </View>

                <View
                  style={[
                    styles.livePill,
                    {
                      backgroundColor: machineAlive
                        ? '#EAF9F2'
                        : '#FDECEC',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.livePillDot,
                      {
                        backgroundColor: machineAlive
                          ? '#20C77A'
                          : '#F04444',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.livePillText,
                      {
                        color: machineAlive
                          ? '#16865A'
                          : '#C62E2E',
                      },
                    ]}
                  >
                    {machineAlive ? 'LIVE' : 'OFFLINE'}
                  </Text>
                </View>
              </View>

              {serviceRows.map((service) => (
                <View
                  key={service.label}
                  style={styles.serviceRow}
                >
                  <View style={styles.serviceRowIcon}>
                    <Ionicons
                      name={service.icon}
                      size={21}
                      color="#4B00FF"
                    />
                  </View>

                  <View style={styles.serviceRowInfo}>
                    <Text style={styles.serviceRowName}>
                      {service.label}
                    </Text>
                    <Text style={styles.serviceRowTime}>
                      {service.status === 'RUNNING'
                        ? `${Math.floor(
                            service.remaining / 60
                          )}:${(service.remaining % 60)
                            .toString()
                            .padStart(2, '0')} remaining`
                        : 'Ready for use'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.serviceStatus,
                      service.status === 'RUNNING'
                        ? styles.serviceStatusRunning
                        : styles.serviceStatusReady,
                    ]}
                  >
                    <Text
                      style={[
                        styles.serviceStatusText,
                        service.status === 'RUNNING'
                          ? styles.serviceStatusTextRunning
                          : styles.serviceStatusTextReady,
                      ]}
                    >
                      {service.status === 'RUNNING'
                        ? 'RUNNING'
                        : 'READY'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ConnectionItem({
  icon,
  label,
  status,
  connected,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  status: string;
  connected: boolean;
}) {
  return (
    <View style={styles.connectionItem}>
      <View style={styles.connectionIcon}>
        <Ionicons
          name={icon}
          size={19}
          color="#4B00FF"
        />
      </View>

      <Text style={styles.connectionName}>{label}</Text>

      <View style={styles.connectionStatus}>
        <View
          style={[
            styles.connectionDot,
            {
              backgroundColor: connected
                ? '#20C77A'
                : '#F04444',
            },
          ]}
        />
        <Text
          style={[
            styles.connectionStatusText,
            {
              color: connected
                ? '#16865A'
                : '#C62E2E',
            },
          ]}
        >
          {status}
        </Text>
      </View>
    </View>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  detail,
  positive,
  good,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  detail: string;
  positive?: string;
  good?: boolean;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View style={styles.summaryIcon}>
          <Ionicons
            name={icon}
            size={21}
            color="#4B00FF"
          />
        </View>

        {positive && (
          <View style={styles.positivePill}>
            <Text style={styles.positiveText}>
              ↑ {positive}
            </Text>
          </View>
        )}

        {good && (
          <View style={styles.goodPill}>
            <Text style={styles.goodPillText}>
              GOOD
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryDetail}>{detail}</Text>
    </View>
  );
}

function ActivityRow({
  time,
  icon,
  title,
  subtitle,
  green,
  yellow,
}: ActivityRowProps) {
  return (
    <View style={styles.activityRow}>
      <Text style={styles.activityTime}>{time}</Text>

      <View
        style={[
          styles.activityIcon,
          green && styles.activityIconGreen,
          yellow && styles.activityIconYellow,
        ]}
      >
        <Ionicons
          name={
            icon as keyof typeof Ionicons.glyphMap
          }
          size={18}
          color={
            green
              ? '#16865A'
              : yellow
                ? '#B77900'
                : '#4B00FF'
          }
        />
      </View>

      <View style={styles.activityInfo}>
        <Text style={styles.activityTitle}>
          {title}
        </Text>
        <Text style={styles.activitySubtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },

  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },

  header: {
    minHeight: 88,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#4B00FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  logoImage: {
    width: 42,
    height: 42,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  subtitle: {
    marginTop: 3,
    color: '#6D7180',
    fontSize: 13,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },

  dateTimeBlock: {
    alignItems: 'flex-end',
  },

  date: {
    color: '#EAE6FF',
    fontSize: 13,
    fontWeight: '600',
  },

  time: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    padding: 28,
    paddingBottom: 48,
  },

  heroRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'stretch',
  },

  heroRowCompact: {
    flexDirection: 'column',
  },

  machineCard: {
    flex: 1,
    minHeight: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E8E9EF',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  machineCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  eyebrow: {
    color: '#777B87',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },

  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  statusText: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  creditPill: {
    alignItems: 'flex-end',
    backgroundColor: '#F5F2FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  creditLabel: {
    color: '#777B87',
    fontSize: 11,
    fontWeight: '600',
  },

  creditValue: {
    marginTop: 2,
    color: '#4B00FF',
    fontSize: 17,
    fontWeight: '900',
  },

  currentServiceBox: {
    marginTop: 25,
    minHeight: 135,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#F8F7FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  serviceIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  currentServiceInfo: {
    flex: 1,
  },

  smallLabel: {
    color: '#8A8D97',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  serviceName: {
    marginTop: 4,
    color: '#17181D',
    fontSize: 24,
    fontWeight: '800',
  },

  serviceHint: {
    marginTop: 5,
    color: '#777B87',
    fontSize: 12,
  },

  timerBlock: {
    alignItems: 'flex-end',
    minWidth: 105,
  },

  timerText: {
    marginTop: 2,
    color: '#4B00FF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 1,
  },

  machineFooter: {
    marginTop: 20,
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: '#ECECF1',
    flexDirection: 'row',
    gap: 30,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  infoLabel: {
    color: '#999CA5',
    fontSize: 10,
    fontWeight: '700',
  },

  infoValue: {
    marginTop: 1,
    color: '#33353D',
    fontSize: 12,
    fontWeight: '700',
  },

  connectionCard: {
    width: 330,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E8E9EF',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  connectionItem: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F3',
  },

  connectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F5F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  connectionName: {
    flex: 1,
    color: '#2A2C33',
    fontSize: 13,
    fontWeight: '700',
  },

  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  connectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  connectionStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  connectionDivider: {
    height: 1,
    backgroundColor: '#ECECF1',
    marginVertical: 16,
  },

  connectionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  connectionHintText: {
    flex: 1,
    color: '#777B87',
    fontSize: 11,
    lineHeight: 16,
  },

  sectionHeader: {
    marginTop: 28,
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#17181D',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  sectionSubtitle: {
    marginTop: 4,
    color: '#8A8D97',
    fontSize: 12,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 16,
  },

  summaryRowCompact: {
    flexDirection: 'column',
  },

  summaryCard: {
    flex: 1,
    minHeight: 145,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E9EF',
  },

  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F5F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  positivePill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: '#EAF9F2',
  },

  positiveText: {
    color: '#16865A',
    fontSize: 10,
    fontWeight: '900',
  },

  goodPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: '#EAF9F2',
  },

  goodPillText: {
    color: '#16865A',
    fontSize: 10,
    fontWeight: '900',
  },

  cardTitle: {
    marginTop: 13,
    color: '#777B87',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  summaryValue: {
    marginTop: 3,
    color: '#17181D',
    fontSize: 27,
    fontWeight: '900',
  },

  summaryDetail: {
    marginTop: 3,
    color: '#999CA5',
    fontSize: 11,
  },

  contentRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 20,
  },

  contentRowCompact: {
    flexDirection: 'column',
  },

  activityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E8E9EF',
  },

  servicesCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E8E9EF',
  },

  cardHeader: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  activityRow: {
    minHeight: 61,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F3',
  },

  activityTime: {
    width: 62,
    color: '#999CA5',
    fontSize: 10,
    fontWeight: '700',
  },

  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F5F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityIconGreen: {
    backgroundColor: '#EAF9F2',
  },

  activityIconYellow: {
    backgroundColor: '#FFF7E6',
  },

  activityInfo: {
    flex: 1,
  },

  activityTitle: {
    color: '#292B32',
    fontSize: 12,
    fontWeight: '800',
  },

  activitySubtitle: {
    marginTop: 2,
    color: '#999CA5',
    fontSize: 10,
  },

  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  livePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  livePillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  serviceRow: {
    minHeight: 62,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  serviceRowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F5F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  serviceRowInfo: {
    flex: 1,
  },

  serviceRowName: {
    color: '#292B32',
    fontSize: 12,
    fontWeight: '800',
  },

  serviceRowTime: {
    marginTop: 2,
    color: '#999CA5',
    fontSize: 10,
  },

  serviceStatus: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  serviceStatusRunning: {
    backgroundColor: '#EAF9F2',
  },

  serviceStatusReady: {
    backgroundColor: '#F2F3F6',
  },

  serviceStatusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  serviceStatusTextRunning: {
    color: '#16865A',
  },

  serviceStatusTextReady: {
    color: '#777B87',
  },
});
