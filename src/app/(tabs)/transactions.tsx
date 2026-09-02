import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
const PURPLE = '#5B00FF';
const BLUE = '#6AA5D8';
const CARD = '#E5E5E5';
const GREEN = '#19C765';
const ORANGE = '#F5A623';

type Transaction = {
  id: number;
  customer_name: string;
  service: string;
  payment: number;
  duration: number;
  status: string;
  created_at: string;
};

function formatDuration(duration: number | string) {
  const totalSeconds = Number(duration);

  if (!Number.isFinite(totalSeconds)) {
    return '00:00';
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}


export default function TransactionsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('Today');
const [transactions, setTransactions] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [errorMessage, setErrorMessage] = useState('');

useEffect(() => {
  fetchTransactions();
}, []);

const fetchTransactions = async () => {
  setLoading(true);
  setErrorMessage('');

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading transactions:', error);
    setErrorMessage('Unable to load transactions.');
    setTransactions([]);
  } else {
    setTransactions(data ?? []);
  }

  setLoading(false);
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>TRANSACTIONS</Text>
            <Text style={styles.subtitle}>
              View all carwash sessions and payments.
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View>
              <Text style={styles.date}>Dec 30, 2026</Text>
              <Text style={styles.time}>11:59 AM</Text>
            </View>

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
            detail="vs yesterday  ↑ 12%"
          />

          <SummaryCard
            title="TODAY'S SESSIONS"
            icon="person-outline"
            value="2"
            detail="vs yesterday  ↑"
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

        {/* TRANSACTIONS LIST */}
        <View style={styles.transactionsContainer}>
  {loading ? (
    <Text style={styles.messageText}>
      Loading transactions...
    </Text>
  ) : errorMessage ? (
    <Text style={styles.errorText}>
      {errorMessage}
    </Text>
  ) : transactions.length === 0 ? (
    <Text style={styles.messageText}>
      No transactions found.
    </Text>
  ) : (
    
    transactions.map((transaction) => (
      
      <TransactionCard
        key={transaction.id}
        customer={transaction.customer_name}
        time={new Date(transaction.created_at).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        })}
        date={new Date(transaction.created_at).toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
        service={transaction.service}
        payment={`₱ ${Number(transaction.payment).toFixed(2)}`}
        duration={formatDuration(transaction.duration)}
        status={transaction.status}
        statusColor={
          transaction.status.toUpperCase() === 'COMPLETED'
            ? GREEN
            : ORANGE
        }
      />
    ))
  )}
</View>
            </ScrollView>

      
    </SafeAreaView>
  );
}

/* =========================
   SUMMARY CARD
========================= */

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
      <Text style={styles.summaryTitle}>{title}</Text>

      <View style={styles.summaryIcon}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>

      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryDetail}>{detail}</Text>
    </View>
  );
}

/* =========================
   FILTER BUTTON
========================= */

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
  size={20}
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

/* =========================
   TRANSACTION CARD
========================= */

function TransactionCard({
  customer,
  time,
  date,
  service,
  payment,
  duration,
  status,
  statusColor,
}: {
  customer: string;
  time: string;
  date: string;
  service: string;
  payment: string;
  duration: string;
  status: string;
  statusColor: string;
}) {
  return (
    <View style={styles.transactionCard}>
      {/* CUSTOMER */}
      <View style={styles.customerSection}>
        <View style={styles.customerIcon}>
          <Ionicons
            name="person-outline"
            size={19}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customer}</Text>

          <View style={styles.dateRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color="#777777"
            />
            <Text style={styles.smallText}>
              {time}  {date}
            </Text>
          </View>

          <View style={styles.serviceTag}>
            <Ionicons
              name="water-outline"
              size={14}
              color="#72BCE0"
            />
            <Text style={styles.serviceText}>{service}</Text>
          </View>
        </View>
      </View>

      {/* PAYMENT */}
      <View style={styles.infoColumn}>
        <Text style={styles.infoLabel}>PAYMENT</Text>
        <Text style={styles.payment}>{payment}</Text>
        <Text style={styles.infoSub}>COIN</Text>
      </View>

      {/* DURATION */}
      <View style={styles.infoColumn}>
        <Text style={styles.infoLabel}>DURATION</Text>

        <View style={styles.durationRow}>
          <Ionicons
            name="time-outline"
            size={18}
            color="#72BCE0"
          />
          <Text style={styles.duration}>{duration}</Text>
        </View>

        <View
          style={[
            styles.statusTag,
            { backgroundColor: `${statusColor}25` },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: statusColor },
            ]}
          >
            {status}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BLUE,
  },

  container: {
    flex: 1,
    backgroundColor: BLUE,
  },

 content: {
  paddingHorizontal: 18,
  paddingTop: 18,
  paddingBottom: 120,
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

  /* TRANSACTION AREA */

transactionsContainer: {
  backgroundColor: CARD,
  borderRadius: 28,
  minHeight: 590,
  marginTop: 0,
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 20,
},

 transactionCard: {
  minHeight: 96,
  borderWidth: 1.5,
  borderColor: '#B5B5B5',
  borderRadius: 22,
  paddingHorizontal: 10,
  paddingVertical: 7,
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
},

  /* CUSTOMER */

  customerSection: {
    flex: 1.65,
    flexDirection: 'row',
    alignItems: 'center',
  },

  customerIcon: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  customerInfo: {
    marginLeft: 10,
    flex: 1,
  },

  customerName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#222222',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 5,
  },

  smallText: {
    fontSize: 7,
    color: '#777777',
  },

  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D3EEF7',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginTop: 5,
    gap: 3,
  },

  serviceText: {
    fontSize: 7,
    color: '#65AFCF',
  },

  /* PAYMENT */

  infoColumn: {
    flex: 0.9,
    alignItems: 'flex-start',
  },

  infoLabel: {
    fontSize: 8,
    color: '#333333',
    marginBottom: 5,
  },

  payment: {
    fontSize: 12,
    color: PURPLE,
    fontWeight: '600',
  },

  infoSub: {
    fontSize: 7,
    color: '#777777',
    marginTop: 2,
  },

  /* DURATION */

  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  duration: {
    fontSize: 11,
    color: '#72BCE0',
  },

  statusTag: {
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginTop: 6,
  },

  statusText: {
    fontSize: 7,
    fontWeight: '600',
  },
});