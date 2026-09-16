import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

const PURPLE = '#4B00FF';
const BLUE = '#6AA3DD';
const CARD = '#FFFFFF';
const RED = '#FF3030';
const GREEN = '#00A844';
const ORANGE = '#FF9D00';

type Transaction = {
  id: number;
  customer_name: string;
  service: string;
  payment: number;
  duration: number;
  status: string;
  created_at: string;
};

export default function AnalyticsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [serverConnected, setServerConnected] = useState(false);
  const [filter, setFilter] = useState('Today');

  const isCompact = width < 850;

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Analytics transactions fetch error:', error);
        setServerConnected(false);
        return;
      }

      setTransactions(data ?? []);
      setServerConnected(true);
    };

    fetchTransactions();
    const interval = setInterval(fetchTransactions, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter((transaction) => {
      const date = new Date(transaction.created_at);

      if (filter === 'Today') {
        return date.toDateString() === now.toDateString();
      }

      if (filter === 'This Week') {
        const start = new Date(now);
        const day = start.getDay();
        const diff = day === 0 ? 6 : day - 1;
        start.setDate(now.getDate() - diff);
        start.setHours(0, 0, 0, 0);

        return date >= start;
      }

      if (filter === 'This Month') {
        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth()
        );
      }

      return true;
    });
  }, [transactions, filter]);

  const completedTransactions = filteredTransactions.filter(
    (transaction) =>
      transaction.status?.toUpperCase() === 'COMPLETED'
  );

  const revenue = completedTransactions.reduce(
    (sum, transaction) =>
      sum + Number(transaction.payment || 0),
    0
  );

  const sessions = filteredTransactions.length;

  const averagePayment =
    sessions > 0 ? revenue / sessions : 0;

  const mostUsedService = useMemo(() => {
    if (!filteredTransactions.length) return 'NO DATA';

    const counts: Record<string, number> = {};

    filteredTransactions.forEach((transaction) => {
      const service = transaction.service || 'Unknown';
      counts[service] = (counts[service] || 0) + 1;
    });

    return Object.entries(counts).sort(
      (a, b) => b[1] - a[1]
    )[0][0];
  }, [filteredTransactions]);

  const serviceCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredTransactions.forEach((transaction) => {
      const service = transaction.service || 'Unknown';
      counts[service] = (counts[service] || 0) + 1;
    });

    return counts;
  }, [filteredTransactions]);

  const serviceEntries = Object.entries(serviceCounts);

  const chartData = useMemo(() => {
    const now = new Date();
    const values = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);

      const next = new Date(date);
      next.setDate(date.getDate() + 1);

      const dayTransactions = filteredTransactions.filter(
        (transaction) => {
          const created = new Date(transaction.created_at);
          return created >= date && created < next;
        }
      );

      return {
        label: date.toLocaleDateString(undefined, {
          weekday: 'short',
        }),
        revenue: dayTransactions
          .filter(
            (transaction) =>
              transaction.status?.toUpperCase() ===
              'COMPLETED'
          )
          .reduce(
            (sum, transaction) =>
              sum + Number(transaction.payment || 0),
            0
          ),
        sessions: dayTransactions.length,
      };
    });

    return values;
  }, [filteredTransactions]);

  const maxRevenue = Math.max(
    ...chartData.map((item) => item.revenue),
    1
  );

  const maxSessions = Math.max(
    ...chartData.map((item) => item.sessions),
    1
  );

  const nowText = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timeText = new Date().toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons
                  name="bar-chart-outline"
                  size={27}
                  color="#FFFFFF"
                />
              </View>

              <View>
                <Text style={styles.title}>ANALYTICS</Text>
                <Text style={styles.subtitle}>
                  View all carwash insights and performance.
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.date}>{nowText}</Text>
              <Text style={styles.time}>{timeText}</Text>

              <Pressable
                onPress={() => router.push('/notifications')}
                style={styles.headerButton}
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          </View>

          {/* INTRO */}
          <View style={styles.pageIntro}>
            <View>
              <Text style={styles.pageTitle}>
                Performance Overview
              </Text>
              <Text style={styles.pageDescription}>
                Live insights calculated from your Supabase
                transactions.
              </Text>
            </View>

            <View style={styles.connectionBadge}>
              <View
                style={[
                  styles.connectionDot,
                  {
                    backgroundColor: serverConnected
                      ? '#20C77A'
                      : '#F04444',
                  },
                ]}
              />
              <Text
                style={[
                  styles.connectionText,
                  {
                    color: serverConnected
                      ? '#16865A'
                      : '#C62E2E',
                  },
                ]}
              >
                {serverConnected
                  ? 'Server Connected'
                  : 'Server Offline'}
              </Text>
            </View>
          </View>

          {/* SUMMARY CARDS */}
          <View
            style={[
              styles.summaryRow,
              isCompact && styles.summaryRowCompact,
            ]}
          >
            <SummaryCard
              title="REVENUE"
              icon="cash-outline"
              value={`₱${revenue.toFixed(2)}`}
              detail={`${filter} completed revenue`}
            />

            <SummaryCard
              title="SESSIONS"
              icon="person-outline"
              value={String(sessions)}
              detail={`${filter} recorded sessions`}
            />

            <SummaryCard
              title="AVERAGE PAYMENT"
              icon="bar-chart-outline"
              value={`₱${averagePayment.toFixed(2)}`}
              detail="per session"
            />
          </View>

          {/* FILTERS */}
          <View style={styles.filters}>
            <FilterButton
              label="Today"
              icon="calendar-outline"
              active={filter === 'Today'}
              onPress={() => setFilter('Today')}
            />

            <FilterButton
              label="This Week"
              active={filter === 'This Week'}
              onPress={() => setFilter('This Week')}
            />

            <FilterButton
              label="This Month"
              active={filter === 'This Month'}
              onPress={() => setFilter('This Month')}
            />
          </View>

          {/* ANALYTICS GRID */}
          <View style={styles.analyticsCard}>
            {/* TOP ROW */}
            <View
              style={[
                styles.topRow,
                isCompact && styles.rowCompact,
              ]}
            >
              <View style={styles.largeChartCard}>
                <Text style={styles.chartTitle}>
                  REVENUE OVER TIME
                  <Text style={styles.chartSubTitle}>
                    {' '}
                    ({filter.toLowerCase()})
                  </Text>
                </Text>

                <RevenueChart
                  data={chartData}
                  maxValue={maxRevenue}
                />
              </View>

              <View style={styles.smallCard}>
                <Text style={styles.chartTitle}>
                  MOST USED SERVICE
                </Text>

                <View style={styles.starCircle}>
                  <Ionicons
                    name="star"
                    size={22}
                    color="#FFFFFF"
                  />
                </View>

                <Text style={styles.serviceName}>
                  {mostUsedService.toUpperCase()}
                </Text>

                <Text style={styles.serviceDetail}>
                  {serviceCounts[mostUsedService] || 0}{' '}
                  session
                  {(serviceCounts[mostUsedService] || 0) ===
                  1
                    ? ''
                    : 's'}
                </Text>
              </View>
            </View>

            {/* MIDDLE ROW */}
            <View
              style={[
                styles.middleRow,
                isCompact && styles.rowCompact,
              ]}
            >
              <View style={styles.largeChartCard}>
                <Text style={styles.chartTitle}>
                  SESSION TREND
                  <Text style={styles.chartSubTitle}>
                    {' '}
                    ({filter.toLowerCase()})
                  </Text>
                </Text>

                <SessionChart
                  data={chartData}
                  maxValue={maxSessions}
                />
              </View>

              <View style={styles.smallCard}>
                <Text style={styles.chartTitle}>
                  USAGE DISTRIBUTION
                </Text>

                <UsageChart
                  entries={serviceEntries}
                />

                <View style={styles.legend}>
                  {serviceEntries.length === 0 ? (
                    <Text style={styles.noDataText}>
                      No service data
                    </Text>
                  ) : (
                    serviceEntries
                      .slice(0, 4)
                      .map(([service, count], index) => (
                        <LegendItem
                          key={service}
                          color={
                            [
                              '#173BFF',
                              '#00C9E5',
                              '#FF8A00',
                              '#E4C62B',
                            ][index]
                          }
                          label={`${service} (${count})`}
                        />
                      ))
                  )}
                </View>
              </View>
            </View>

            {/* WATER QUALITY */}
            <View style={styles.waterCard}>
              <Text style={styles.chartTitle}>
                WATER QUALITY
              </Text>

              <View style={styles.waterContent}>
                <WaterGauge />

                <View style={styles.waterStats}>
                  <WaterStat
                    icon="water-outline"
                    label="CONTINUITY"
                    value="8 NTU"
                    color={PURPLE}
                  />

                  <WaterStat
                    icon="checkmark-circle-outline"
                    label="STATUS"
                    value="GOOD"
                    color={GREEN}
                  />

                  <WaterStat
                    icon="warning-outline"
                    label="PRESSURE"
                    value="20 PSI"
                    color={ORANGE}
                  />

                  <WaterStat
                    icon="time-outline"
                    label="LAST UPDATED"
                    value={`${nowText.toUpperCase()} ${timeText}`}
                    color={PURPLE}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SummaryCard({
  title,
  icon,
  value,
  detail,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  detail: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View style={styles.summaryIcon}>
          <Ionicons
            name={icon}
            size={21}
            color={PURPLE}
          />
        </View>

        <Text style={styles.summaryTitle}>
          {title}
        </Text>
      </View>

      <Text style={styles.summaryValue}>{value}</Text>

      <Text style={styles.summaryDetail}>{detail}</Text>
    </View>
  );
}

function FilterButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterButton,
        active && styles.filterButtonActive,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={17}
          color={active ? '#FFFFFF' : PURPLE}
        />
      )}

      <Text
        style={[
          styles.filterText,
          active && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RevenueChart({
  data,
  maxValue,
}: {
  data: { label: string; revenue: number }[];
  maxValue: number;
}) {
  return (
    <View style={styles.chart}>
      <View style={styles.yAxis}>
        <Text style={styles.axisText}>
          ₱{Math.round(maxValue)}
        </Text>
        <Text style={styles.axisText}>
          ₱{Math.round(maxValue * 0.75)}
        </Text>
        <Text style={styles.axisText}>
          ₱{Math.round(maxValue * 0.5)}
        </Text>
        <Text style={styles.axisText}>
          ₱{Math.round(maxValue * 0.25)}
        </Text>
        <Text style={styles.axisText}>₱0</Text>
      </View>

      <View style={styles.bars}>
        {data.map((item) => (
          <View key={item.label} style={styles.barColumn}>
            <Text style={styles.barValue}>
              {item.revenue > 0
                ? `₱${item.revenue.toFixed(0)}`
                : ''}
            </Text>

            <View
              style={[
                styles.bar,
                {
                  height: Math.max(
                    2,
                    (item.revenue / maxValue) * 82
                  ),
                },
              ]}
            />

            <Text style={styles.dayLabel}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SessionChart({
  data,
  maxValue,
}: {
  data: { label: string; sessions: number }[];
  maxValue: number;
}) {
  return (
    <View style={styles.chart}>
      <View style={styles.yAxis}>
        <Text style={styles.axisText}>
          {Math.round(maxValue)}
        </Text>
        <Text style={styles.axisText}>
          {Math.round(maxValue * 0.75)}
        </Text>
        <Text style={styles.axisText}>
          {Math.round(maxValue * 0.5)}
        </Text>
        <Text style={styles.axisText}>
          {Math.round(maxValue * 0.25)}
        </Text>
        <Text style={styles.axisText}>0</Text>
      </View>

      <View style={styles.bars}>
        {data.map((item) => (
          <View key={item.label} style={styles.barColumn}>
            <Text style={styles.barValue}>
              {item.sessions > 0 ? item.sessions : ''}
            </Text>

            <View
              style={[
                styles.sessionBar,
                {
                  height: Math.max(
                    2,
                    (item.sessions / maxValue) * 82
                  ),
                },
              ]}
            />

            <Text style={styles.dayLabel}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function UsageChart({
  entries,
}: {
  entries: [string, number][];
}) {
  const total = entries.reduce(
    (sum, [, count]) => sum + count,
    0
  );

  if (!total) {
    return (
      <View style={styles.noDataCircle}>
        <Ionicons
          name="pie-chart-outline"
          size={28}
          color="#A0A2AA"
        />
      </View>
    );
  }

  const first = entries[0]?.[1] || 0;
  const second = entries[1]?.[1] || 0;
  const third = entries[2]?.[1] || 0;
  const fourth = entries[3]?.[1] || 0;

  return (
    <View style={styles.pieContainer}>
      <View style={styles.pie}>
        <View
          style={[
            styles.pieSlice,
            {
              backgroundColor: '#173BFF',
              transform: [
                {
                  rotate: `${(first / total) * 360}deg`,
                },
              ],
            },
          ]}
        />
        <View
          style={[
            styles.pieSlice,
            {
              backgroundColor: '#00C9E5',
              transform: [
                {
                  rotate: `${((first + second) / total) * 360}deg`,
                },
              ],
            },
          ]}
        />
        <View
          style={[
            styles.pieSlice,
            {
              backgroundColor: '#FF8A00',
              transform: [
                {
                  rotate: `${((first + second + third) / total) * 360}deg`,
                },
              ],
            },
          ]}
        />
        <View
          style={[
            styles.pieSlice,
            {
              backgroundColor: '#E4C62B',
              transform: [
                {
                  rotate: `${((first + second + third + fourth) / total) * 360}deg`,
                },
              ],
            },
          ]}
        />
        <View style={styles.pieHole} />
      </View>
    </View>
  );
}

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          { backgroundColor: color },
        ]}
      />

      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function WaterGauge() {
  return (
    <View style={styles.gauge}>
      <View style={styles.gaugeRing}>
        <View style={styles.gaugeInner}>
          <Text style={styles.gaugeValue}>NTU</Text>
          <Text style={styles.gaugeNumber}>8</Text>
        </View>
      </View>

      <View style={styles.gaugeNeedle} />
    </View>
  );
}

function WaterStat({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.waterStat}>
      <Ionicons name={icon} size={16} color={color} />

      <View style={styles.waterStatText}>
        <Text style={styles.waterStatLabel}>
          {label}
        </Text>

        <Text
          style={[
            styles.waterStatValue,
            { color },
          ]}
        >
          {value}
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

  scrollContent: {
    paddingBottom: 45,
  },

  header: {
    minHeight: 88,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 1,
  },

  subtitle: {
    marginTop: 3,
    color: '#DDD7FF',
    fontSize: 12,
  },

  headerRight: {
    alignItems: 'flex-end',
  },

  date: {
    color: '#FFFFFF',
    fontSize: 11,
  },

  time: {
    color: '#DDD7FF',
    fontSize: 11,
    marginTop: 2,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginTop: 7,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pageIntro: {
    margin: 28,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },

  pageTitle: {
    color: '#17181D',
    fontSize: 25,
    fontWeight: '900',
  },

  pageDescription: {
    marginTop: 4,
    color: '#8A8D97',
    fontSize: 12,
  },

  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E9EF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  connectionText: {
    fontSize: 11,
    fontWeight: '800',
  },

  summaryRow: {
    marginHorizontal: 28,
    flexDirection: 'row',
    gap: 15,
  },

  summaryRowCompact: {
    flexDirection: 'column',
  },

  summaryCard: {
    flex: 1,
    minHeight: 140,
    backgroundColor: CARD,
    borderRadius: 17,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E9EF',
  },

  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F5F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryTitle: {
    color: '#777B87',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  summaryValue: {
    marginTop: 15,
    color: PURPLE,
    fontSize: 25,
    fontWeight: '900',
  },

  summaryDetail: {
    marginTop: 3,
    color: '#999CA5',
    fontSize: 10,
  },

  filters: {
    marginHorizontal: 28,
    marginTop: 18,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 8,
  },

  filterButton: {
    height: 41,
    paddingHorizontal: 15,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E9EF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  filterButtonActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },

  filterText: {
    color: '#333333',
    fontSize: 11,
    fontWeight: '700',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  analyticsCard: {
    marginHorizontal: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E8E9EF',
  },

  topRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  middleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  rowCompact: {
    flexDirection: 'column',
  },

  largeChartCard: {
    flex: 1.65,
    minHeight: 190,
    backgroundColor: '#F8F8FA',
    borderWidth: 1,
    borderColor: '#E2E2E8',
    borderRadius: 12,
    padding: 13,
  },

  smallCard: {
    flex: 0.95,
    minHeight: 190,
    backgroundColor: '#F8F8FA',
    borderWidth: 1,
    borderColor: '#E2E2E8',
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
  },

  chartTitle: {
    color: '#222222',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  chartSubTitle: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '500',
  },

  chart: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 12,
  },

  yAxis: {
    width: 42,
    justifyContent: 'space-between',
    paddingBottom: 18,
  },

  axisText: {
    fontSize: 8,
    color: '#777777',
    textAlign: 'right',
  },

  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#C8C8CF',
    paddingLeft: 5,
    paddingBottom: 1,
  },

  barColumn: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 30,
  },

  bar: {
    width: 14,
    backgroundColor: RED,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  sessionBar: {
    width: 14,
    backgroundColor: PURPLE,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  barValue: {
    color: '#333333',
    fontSize: 8,
    marginBottom: 3,
    textAlign: 'center',
    width: 40,
  },

  dayLabel: {
    color: '#555555',
    fontSize: 8,
    marginTop: 4,
  },

  starCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#008A1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 35,
  },

  serviceName: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 10,
  },

  serviceDetail: {
    marginTop: 4,
    color: '#8A8D97',
    fontSize: 10,
  },

  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  pie: {
    width: 95,
    height: 95,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: '#173BFF',
    position: 'relative',
  },

  pieSlice: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    right: 0,
    top: 0,
    transformOrigin: '0% 100%',
  },

  pieHole: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#F8F8FA',
    left: 25,
    top: 25,
  },

  noDataCircle: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: '#ECECF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  legend: {
    width: '100%',
    marginTop: 10,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  legendText: {
    color: '#555555',
    fontSize: 9,
    flex: 1,
  },

  noDataText: {
    color: '#999CA5',
    fontSize: 9,
    textAlign: 'center',
  },

  waterCard: {
    backgroundColor: '#F8F8FA',
    borderWidth: 1,
    borderColor: '#E2E2E8',
    borderRadius: 12,
    minHeight: 145,
    padding: 13,
  },

  waterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  gauge: {
    width: 150,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  gaugeRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 10,
    borderColor: '#FF3030',
    borderLeftColor: '#3185FF',
    borderBottomColor: '#3185FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  gaugeInner: {
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  gaugeValue: {
    fontSize: 8,
    color: '#555555',
  },

  gaugeNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#222222',
  },

  gaugeNeedle: {
    position: 'absolute',
    width: 3,
    height: 28,
    backgroundColor: '#333333',
    transform: [{ rotate: '-55deg' }],
    bottom: 22,
    left: 74,
  },

  waterStats: {
    flex: 1,
    gap: 5,
  },

  waterStat: {
    minHeight: 30,
    borderWidth: 1,
    borderColor: '#DDDEE4',
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },

  waterStatText: {
    marginLeft: 7,
  },

  waterStatLabel: {
    color: '#777777',
    fontSize: 8,
    fontWeight: '800',
  },

  waterStatValue: {
    fontSize: 9,
    fontWeight: '900',
    marginTop: 2,
  },
});
