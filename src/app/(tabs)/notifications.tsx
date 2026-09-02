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

const BLUE = '#6AA3DD';
const PURPLE = '#4B00FF';
const CARD = '#E5E5E5';
const GREEN = '#008A1C';
const RED = '#FF3030';
const ORANGE = '#FF9D00';

type Filter = 'All' | 'Alerts' | 'Transactions' | 'System';

export default function NotificationsScreen() {
  const [filter, setFilter] = useState<Filter>('All');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>NOTIFICATIONS</Text>
            <Text style={styles.subtitle}>
              Stay updated with your carwash
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.date}>Dec 31, 2026</Text>
            <Text style={styles.time}>11:59 AM</Text>

            <Ionicons
              name="notifications"
              size={22}
              color="#FFFFFF"
              style={styles.bell}
            />
          </View>
        </View>

        {/* SCROLLABLE CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* FILTERS */}
          <View style={styles.filters}>
            <FilterButton
              label="All"
              active={filter === 'All'}
              onPress={() => setFilter('All')}
            />

            <FilterButton
              label="Alerts"
              active={filter === 'Alerts'}
              onPress={() => setFilter('Alerts')}
            />

            <FilterButton
              label="Transactions"
              active={filter === 'Transactions'}
              onPress={() => setFilter('Transactions')}
            />

            <FilterButton
              label="System"
              active={filter === 'System'}
              onPress={() => setFilter('System')}
            />
          </View>

          {/* NOTIFICATIONS */}
          <View style={styles.notificationArea}>

            <Text style={styles.sectionLabel}>TODAY</Text>

            <NotificationCard
              type="session"
              title="New Session Started"
              subtitle="A new carwash session has started"
              tag="Customer #2"
              time="11:59 AM"
            />

            <NotificationCard
              type="payment"
              title="Payment Received"
              subtitle="₱20.00 payment received via Coins."
              tag="₱20 COINS"
              time="11:56 AM"
            />

            <NotificationCard
              type="alert"
              title="Water Quality Alert"
              subtitle="Water quality is HIGH"
              tag="23 NTU"
              time="11:55 AM"
            />

            <NotificationCard
              type="summary"
              title="Daily Summary"
              subtitle="You had 15 session today"
              tag="₱1,050.00"
              time="11:59 PM"
            />

          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* =====================================================
   FILTER BUTTON
===================================================== */

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
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
   NOTIFICATION CARD
===================================================== */

function NotificationCard({
  type,
  title,
  subtitle,
  tag,
  time,
}: {
  type: 'session' | 'payment' | 'alert' | 'summary';
  title: string;
  subtitle: string;
  tag: string;
  time: string;
}) {
  const config = {
    session: {
      color: PURPLE,
      icon: 'person-outline' as keyof typeof Ionicons.glyphMap,
      tagColor: '#D8D0FF',
      tagText: PURPLE,
    },

    payment: {
      color: GREEN,
      icon: 'cash-outline' as keyof typeof Ionicons.glyphMap,
      tagColor: '#FFE7A8',
      tagText: '#B87900',
    },

    alert: {
      color: RED,
      icon: 'warning-outline' as keyof typeof Ionicons.glyphMap,
      tagColor: '#FFD1D1',
      tagText: RED,
    },

    summary: {
      color: GREEN,
      icon: 'checkmark-outline' as keyof typeof Ionicons.glyphMap,
      tagColor: '#D7F0D7',
      tagText: GREEN,
    },
  }[type];

  return (
    <Pressable style={styles.notificationCard}>

      {/* ICON */}
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: config.color },
        ]}
      >
        <Ionicons
          name={config.icon}
          size={17}
          color="#FFFFFF"
        />
      </View>

      {/* CONTENT */}
      <View style={styles.notificationContent}>

        <View style={styles.notificationTopRow}>
          <Text style={styles.notificationTitle}>
            {title}
          </Text>

          <Text style={styles.notificationTime}>
            {time}
          </Text>
        </View>

        <Text style={styles.notificationSubtitle}>
          {subtitle}
        </Text>

        <View
          style={[
            styles.tag,
            { backgroundColor: config.tagColor },
          ]}
        >
          <Text
            style={[
              styles.tagText,
              { color: config.tagText },
            ]}
          >
            {tag}
          </Text>
        </View>

      </View>

      {/* CHEVRON */}
      <Ionicons
        name="chevron-forward"
        size={13}
        color="#777777"
        style={styles.chevron}
      />

    </Pressable>
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
    height: 58,
    paddingHorizontal: 12,
    paddingTop: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  subtitle: {
    color: '#FFFFFF',
    fontSize: 5.5,
    marginTop: 2,
  },

  headerRight: {
    alignItems: 'flex-end',
  },

  date: {
    color: '#FFFFFF',
    fontSize: 7,
  },

  time: {
    color: '#FFFFFF',
    fontSize: 7,
  },

  bell: {
    marginTop: 3,
  },

  /* SCROLL */

  scrollContent: {
    paddingHorizontal: 8,
    paddingBottom: 85,
  },

  /* FILTERS */

  filters: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 7,
  },

  filterButton: {
    height: 21,
    minWidth: 47,
    paddingHorizontal: 7,
    borderRadius: 5,
    backgroundColor: CARD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterButtonActive: {
    backgroundColor: PURPLE,
  },

  filterText: {
    color: '#333333',
    fontSize: 4.5,
    fontWeight: '600',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  /* NOTIFICATION AREA */

  notificationArea: {
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    paddingHorizontal: 7,
    paddingTop: 7,
    paddingBottom: 10,
    minHeight: 390,
  },

  sectionLabel: {
    color: '#777777',
    fontSize: 5,
    fontWeight: '700',
    marginBottom: 4,
    marginLeft: 3,
  },

  /* CARD */

  notificationCard: {
    minHeight: 67,
    backgroundColor: '#EEEEEE',
    borderWidth: 1,
    borderColor: '#AAAAAA',
    borderRadius: 9,
    marginBottom: 6,
    paddingHorizontal: 7,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconCircle: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  notificationContent: {
    flex: 1,
    marginLeft: 7,
    minWidth: 0,
  },

  notificationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  notificationTitle: {
    flex: 1,
    color: '#222222',
    fontSize: 6.5,
    fontWeight: '700',
  },

  notificationTime: {
    color: '#777777',
    fontSize: 4,
    marginLeft: 4,
  },

  notificationSubtitle: {
    color: '#555555',
    fontSize: 4.5,
    marginTop: 2,
    lineHeight: 6,
  },

  tag: {
    alignSelf: 'flex-start',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 4,
  },

  tagText: {
    fontSize: 3.8,
    fontWeight: '700',
  },

  chevron: {
    marginLeft: 3,
  },
});