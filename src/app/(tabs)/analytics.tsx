import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const PURPLE = '#4B00FF';
const BLUE = '#6AA3DD';
const CARD = '#E5E5E5';
const RED = '#FF3030';
const GREEN = '#00A844';
const ORANGE = '#FF9D00';

export default function AnalyticsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('Today');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* SCROLLABLE CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>ANALYTICS</Text>
            <Text style={styles.subtitle}>
              View all carwash insights and performance.
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.date}>Dec 30, 2026</Text>
            <Text style={styles.time}>11:59 AM</Text>
             
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


          {/* SUMMARY CARDS */}
          <View style={styles.summaryRow}>

            <SummaryCard
              title="TODAY'S REVENUE"
              icon="cash-outline"
              value="₱ 50.00"
              detail="vs yesterday   ↑ 12%"
            />

            <SummaryCard
              title="TODAY'S SESSIONS"
              icon="person-outline"
              value="2"
              detail="vs yesterday   ↑ 5"
            />

            <SummaryCard
              title="AVERAGE PAYMENT"
              icon="bar-chart-outline"
              value="₱ 20.00"
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
            <View style={styles.topRow}>

              {/* REVENUE */}
              <View style={styles.largeChartCard}>
                <Text style={styles.chartTitle}>
                  REVENUE OVER TIME
                  <Text style={styles.chartSubTitle}> ({filter.toLowerCase()})</Text>
                </Text>

                <RevenueChart />
              </View>

              {/* MOST USED SERVICE */}
              <View style={styles.smallCard}>
                <Text style={styles.chartTitle}>MOST USED SERVICE</Text>

                <View style={styles.starCircle}>
                  <Ionicons
                    name="star"
                    size={22}
                    color="#FFFFFF"
                  />
                </View>

                <Text style={styles.serviceName}>
                  WATER PRESSURE
                </Text>
              </View>

            </View>

            {/* MIDDLE ROW */}
            <View style={styles.middleRow}>

              {/* SESSION TREND */}
              <View style={styles.largeChartCard}>
                <Text style={styles.chartTitle}>
                  SESSION TREND
                  <Text style={styles.chartSubTitle}> ({filter.toLowerCase()})</Text>
                </Text>

                <SessionChart />
              </View>

              {/* USAGE DISTRIBUTION */}
              <View style={styles.smallCard}>
                <Text style={styles.chartTitle}>
                  USAGE DISTRIBUTION
                </Text>

                <UsageChart />

                <View style={styles.legend}>

                  <LegendItem
                    color="#173BFF"
                    label="Water Pressure"
                  />

                  <LegendItem
                    color="#00C9E5"
                    label="Soap"
                  />

                  <LegendItem
                    color="#FF8A00"
                    label="Blower"
                  />

                  <LegendItem
                    color="#E4C62B"
                    label="Faucet"
                  />

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
                    value="DEC 30 2026 11:59 AM"
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

/* =====================================================
   SUMMARY CARD
===================================================== */

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

      <Text style={styles.summaryTitle}>
        {title}
      </Text>

      <View style={styles.summaryIcon}>
        <Ionicons
          name={icon}
          size={20}
          color="#FFFFFF"
        />
      </View>

      <Text style={styles.summaryValue}>
        {value}
      </Text>

      <Text style={styles.summaryDetail}>
        {detail}
      </Text>

    </View>
  );
}

/* =====================================================
   FILTER
===================================================== */

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
          size={19}
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

/* =====================================================
   REVENUE CHART
===================================================== */

function RevenueChart() {
  const bars = [
    { day: 'Mon', value: 42 },
    { day: 'Tue', value: 68 },
    { day: 'Wed', value: 53 },
    { day: 'Thu', value: 35 },
    { day: 'Fri', value: 20 },
    { day: 'Sat', value: 8 },
    { day: 'Sun', value: 0 },
  ];

  return (
    <View style={styles.chart}>

      <View style={styles.yAxis}>
        <Text>₱400</Text>
        <Text>₱300</Text>
        <Text>₱200</Text>
        <Text>₱100</Text>
        <Text>₱0</Text>
      </View>

      <View style={styles.bars}>

        {bars.map((item) => (
          <View
            key={item.day}
            style={styles.barColumn}
          >
            <Text style={styles.barValue}>
              {item.value > 0 ? `₱${item.value}` : ''}
            </Text>

            <View
              style={[
                styles.bar,
                {
                  height: item.value,
                },
              ]}
            />

            <Text style={styles.dayLabel}>
              {item.day}
            </Text>
          </View>
        ))}

      </View>

    </View>
  );
}

/* =====================================================
   SESSION CHART
===================================================== */

function SessionChart() {
  const bars = [
    { day: 'Mon', value: 31 },
    { day: 'Tue', value: 25 },
    { day: 'Wed', value: 38 },
    { day: 'Thu', value: 24 },
    { day: 'Fri', value: 15 },
    { day: 'Sat', value: 2 },
    { day: 'Sun', value: 0 },
  ];

  return (
    <View style={styles.chart}>

      <View style={styles.yAxis}>
        <Text>60</Text>
        <Text>45</Text>
        <Text>30</Text>
        <Text>15</Text>
        <Text>0</Text>
      </View>

      <View style={styles.bars}>

        {bars.map((item) => (
          <View
            key={item.day}
            style={styles.barColumn}
          >
            <Text style={styles.barValue}>
              {item.value > 0 ? item.value : ''}
            </Text>

            <View
              style={[
                styles.sessionBar,
                {
                  height: item.value,
                },
              ]}
            />

            <Text style={styles.dayLabel}>
              {item.day}
            </Text>
          </View>
        ))}

      </View>

    </View>
  );
}

/* =====================================================
   USAGE CHART
===================================================== */

function UsageChart() {
  return (
    <View style={styles.pieContainer}>

      <View style={styles.pie}>

        <View style={styles.pieBlue} />
        <View style={styles.pieCyan} />
        <View style={styles.pieOrange} />
        <View style={styles.pieYellow} />

      </View>

    </View>
  );
}

/* =====================================================
   LEGEND
===================================================== */

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

      <Text style={styles.legendText}>
        {label}
      </Text>

    </View>
  );
}

/* =====================================================
   WATER GAUGE
===================================================== */

function WaterGauge() {
  return (
    <View style={styles.gauge}>

      <View style={styles.gaugeRing}>

        <View style={styles.gaugeInner}>

          <Text style={styles.gaugeValue}>
            NTU
          </Text>

          <Text style={styles.gaugeNumber}>
            8
          </Text>

        </View>

      </View>

      <View style={styles.gaugeNeedle} />

    </View>
  );
}

/* =====================================================
   WATER STAT
===================================================== */

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

      <Ionicons
        name={icon}
        size={13}
        color={color}
      />

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

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: BLUE,
  },

  container: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: BLUE,
  },

  /* HEADER */

header: {
  minHeight: 105,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
},

 title: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  subtitle: {
    marginTop: 2,
    fontSize: 9,
    color: '#FFFFFF',
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

  /* SCROLL */

scrollContent: {
  paddingHorizontal: 18,
  paddingTop: 18,
  paddingBottom: 120,
},

 /* SUMMARY */

summaryRow: {
  flexDirection: 'row',
  gap: 12,
},

summaryCard: {
  flex: 1,
  minHeight: 125,
  backgroundColor: CARD,
  borderRadius: 14,
  alignItems: 'center',
  paddingTop: 13,
},

summaryTitle: {
  fontSize: 10,
  color: '#333333',
  textAlign: 'center',
  fontWeight: '500',
},

summaryIcon: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: PURPLE,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 7,
},

summaryValue: {
  marginTop: 7,
  color: PURPLE,
  fontSize: 16,
  fontWeight: '600',
},

summaryDetail: {
  marginTop: 3,
  fontSize: 8,
  color: '#777777',
},
 /* FILTERS */

filters: {
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 8,
  marginTop: 16,
  marginBottom: 5,
},

filterButton: {
  height: 41,
  minWidth: 115,
  paddingHorizontal: 15,
  borderRadius: 9,
  backgroundColor: CARD,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
},

filterButtonActive: {
  backgroundColor: PURPLE,
},

filterText: {
  color: '#333333',
  fontSize: 11,
},

filterTextActive: {
  color: '#FFFFFF',
},

  /* MAIN ANALYTICS CARD */

  analyticsCard: {
    backgroundColor: CARD,
    borderRadius: 17,
    padding: 9,
  },

  topRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 7,
  },

  middleRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 7,
  },

 largeChartCard: {
  flex: 1.65,
  minHeight: 145,
  backgroundColor: '#E9E9E9',
  borderWidth: 1,
  borderColor: '#999999',
  borderRadius: 9,
  padding: 8,
},

smallCard: {
  flex: 0.95,
  minHeight: 145,
  backgroundColor: '#E9E9E9',
  borderWidth: 1,
  borderColor: '#999999',
  borderRadius: 9,
  padding: 8,
  alignItems: 'center',
},
 chartTitle: {
  color: '#222222',
  fontSize: 4.5,
  fontWeight: '700',
},

chartSubTitle: {
  color: '#777777',
  fontSize: 3.5,
  fontWeight: '400',
},

  /* CHART */

  chart: {
  flex: 1,
  flexDirection: 'row',
  marginTop: 9,
},

 yAxis: {
  width: 35,
  justifyContent: 'space-between',
  paddingBottom: 10,
},

yAxisText: {
  fontSize: 4,
  color: '#555555',
  textAlign: 'right',
},

  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#999999',
    paddingLeft: 3,
  },

  barColumn: {
  height: '100%',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: 20,
},

bar: {
  width: 8,
  backgroundColor: RED,
  minHeight: 1,
},
  sessionBar: {
    width: 8,
    backgroundColor: RED,
    minHeight: 1,
  },

barValue: {
  color: '#333333',
  fontSize: 4,
  marginBottom: 1,
  textAlign: 'center',
  width: 35,
},


dayLabel: {
  color: '#555555',
  fontSize: 3,
  marginTop: 2,
},
  /* SERVICE */

starCircle: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#008A1C',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 12,
},

  serviceName: {
    color: PURPLE,
    fontSize: 7,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 5,
  },

  /* PIE */

  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  pie: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#173BFF',
    position: 'relative',
  },

  pieBlue: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: '#173BFF',
  },

  pieCyan: {
    position: 'absolute',
    width: 31,
    height: 31,
    right: 0,
    top: 0,
    backgroundColor: '#00C9E5',
  },

  pieOrange: {
    position: 'absolute',
    width: 30,
    height: 30,
    left: 0,
    top: 0,
    backgroundColor: '#FF8A00',
  },

  pieYellow: {
    position: 'absolute',
    width: 20,
    height: 20,
    left: 20,
    bottom: 0,
    backgroundColor: '#E4C62B',
  },

  legend: {
    width: '100%',
    marginTop: 4,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 3,
  },

  legendText: {
    color: '#333333',
    fontSize: 4.5,
  },

  /* WATER QUALITY */

  waterCard: {
    backgroundColor: '#E9E9E9',
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 9,
    minHeight: 92,
    padding: 7,
  },

  waterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  /* GAUGE */

  gauge: {
    width: 105,
    height: 67,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  gaugeRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 8,
    borderColor: '#FF3030',
    borderLeftColor: '#3185FF',
    borderBottomColor: '#3185FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  gaugeInner: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  gaugeValue: {
    fontSize: 6,
    color: '#555555',
  },

  gaugeNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#222222',
  },

  gaugeNeedle: {
    position: 'absolute',
    width: 3,
    height: 25,
    backgroundColor: '#333333',
    transform: [
      { rotate: '-55deg' },
    ],
    bottom: 17,
    left: 51,
  },

  /* WATER STATS */

  waterStats: {
    flex: 1,
    gap: 3,
  },

  waterStat: {
    height: 21,
    borderWidth: 1,
    borderColor: '#AAAAAA',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    backgroundColor: '#E1E1E1',
  },

  waterStatText: {
    marginLeft: 4,
  },

  waterStatLabel: {
    color: '#555555',
    fontSize: 4,
  },

  waterStatValue: {
    fontSize: 5.5,
    fontWeight: '700',
    marginTop: 1,
  },

});