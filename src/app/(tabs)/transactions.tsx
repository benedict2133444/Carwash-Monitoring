import React, { useEffect, useMemo, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

type Transaction = {
  id: number;
  customer_name: string;
  service: string;
  payment: number;
  duration: number;
  status: string;
  created_at: string;
};

export default function TransactionsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverConnected, setServerConnected] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const isCompact = width < 850;

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Transactions fetch error:', error);
        setServerConnected(false);
        setLoading(false);
        return;
      }

      setTransactions(data ?? []);
      setServerConnected(true);
      setLoading(false);
    };

    fetchTransactions();

    const interval = setInterval(fetchTransactions, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredTransactions = useMemo(() => {
    if (filter === 'ALL') return transactions;

    return transactions.filter(
      (transaction) =>
        transaction.status?.toUpperCase() === filter
    );
  }, [transactions, filter]);

  const totalRevenue = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.status?.toUpperCase() ===
            'COMPLETED'
        )
        .reduce(
          (total, transaction) =>
            total + Number(transaction.payment || 0),
          0
        ),
    [transactions]
  );

  const completedCount = transactions.filter(
    (transaction) =>
      transaction.status?.toUpperCase() === 'COMPLETED'
  ).length;

  const pendingCount = transactions.filter(
    (transaction) =>
      transaction.status?.toUpperCase() === 'PENDING'
  ).length;

  const formatDate = (value: string) => {
    const date = new Date(value);

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (value: string) => {
    const date = new Date(value);

    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatPayment = (value: number) =>
    `₱${Number(value || 0).toFixed(2)}`;

  const getServiceIcon = (
    service: string
  ): keyof typeof Ionicons.glyphMap => {
    const value = service?.toLowerCase() ?? '';

    if (value.includes('soap')) {
      return 'flask-outline';
    }

    if (value.includes('blower')) {
      return 'speedometer-outline';
    }

    if (value.includes('faucet')) {
      return 'rainy-outline';
    }

    return 'water-outline';
  };

  const getStatusStyle = (status: string) => {
    const value = status?.toUpperCase() ?? '';

    if (value === 'COMPLETED' || value === 'SUCCESS') {
      return {
        backgroundColor: '#EAF9F2',
        textColor: '#16865A',
        icon: 'checkmark-circle-outline' as keyof typeof Ionicons.glyphMap,
      };
    }

    if (value === 'PENDING') {
      return {
        backgroundColor: '#FFF7E6',
        textColor: '#B77900',
        icon: 'time-outline' as keyof typeof Ionicons.glyphMap,
      };
    }

    if (value === 'CANCELLED' || value === 'FAILED') {
      return {
        backgroundColor: '#FDECEC',
        textColor: '#C62E2E',
        icon: 'close-circle-outline' as keyof typeof Ionicons.glyphMap,
      };
    }

    return {
      backgroundColor: '#F2F3F6',
      textColor: '#777B87',
      icon: 'ellipse-outline' as keyof typeof Ionicons.glyphMap,
    };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="receipt-outline"
                size={27}
                color="#FFFFFF"
              />
            </View>

            <View>
              <Text style={styles.title}>
                TRANSACTIONS
              </Text>
              <Text style={styles.subtitle}>
                View and monitor carwash transactions
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.headerButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons
              name="notifications-outline"
              size={23}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* PAGE INTRO */}
          <View style={styles.pageIntro}>
            <View>
              <Text style={styles.pageTitle}>
                Transaction History
              </Text>
              <Text style={styles.pageDescription}>
                Review payments, services, and session
                details.
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

          {/* SUMMARY */}
          <View
            style={[
              styles.summaryRow,
              isCompact && styles.summaryRowCompact,
            ]}
          >
            <SummaryCard
              icon="cash-outline"
              label="TOTAL REVENUE"
              value={formatPayment(totalRevenue)}
              detail="Completed transactions"
            />

            <SummaryCard
              icon="receipt-outline"
              label="TRANSACTIONS"
              value={String(transactions.length)}
              detail="All recorded sessions"
            />

            <SummaryCard
              icon="checkmark-circle-outline"
              label="COMPLETED"
              value={String(completedCount)}
              detail="Successful sessions"
            />

            <SummaryCard
              icon="time-outline"
              label="PENDING"
              value={String(pendingCount)}
              detail="Awaiting completion"
            />
          </View>

          {/* TABLE CARD */}
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  ALL TRANSACTIONS
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {transactions.length} recorded transaction
                  {transactions.length === 1 ? '' : 's'}
                </Text>
              </View>

              <View style={styles.filterRow}>
                {['ALL', 'COMPLETED', 'PENDING'].map(
                  (item) => (
                    <Pressable
                      key={item}
                      style={[
                        styles.filterButton,
                        filter === item &&
                          styles.filterButtonActive,
                      ]}
                      onPress={() => setFilter(item)}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          filter === item &&
                            styles.filterTextActive,
                        ]}
                      >
                        {item === 'ALL'
                          ? 'All'
                          : item === 'COMPLETED'
                            ? 'Completed'
                            : 'Pending'}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            </View>

            {loading ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="sync-outline"
                    size={28}
                    color="#4B00FF"
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  Loading transactions
                </Text>
                <Text style={styles.emptyText}>
                  Connecting to the transaction server...
                </Text>
              </View>
            ) : filteredTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="receipt-outline"
                    size={28}
                    color="#4B00FF"
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  No transactions found
                </Text>
                <Text style={styles.emptyText}>
                  There are no transactions matching the
                  selected filter.
                </Text>
              </View>
            ) : (
              <>
                {/* DESKTOP TABLE HEADER */}
                {!isCompact && (
                  <View style={styles.columnHeader}>
                    <Text
                      style={[
                        styles.columnText,
                        styles.customerColumn,
                      ]}
                    >
                      CUSTOMER
                    </Text>
                    <Text
                      style={[
                        styles.columnText,
                        styles.serviceColumn,
                      ]}
                    >
                      SERVICE
                    </Text>
                    <Text
                      style={[
                        styles.columnText,
                        styles.paymentColumn,
                      ]}
                    >
                      PAYMENT
                    </Text>
                    <Text
                      style={[
                        styles.columnText,
                        styles.durationColumn,
                      ]}
                    >
                      DURATION
                    </Text>
                    <Text
                      style={[
                        styles.columnText,
                        styles.statusColumn,
                      ]}
                    >
                      STATUS
                    </Text>
                    <Text
                      style={[
                        styles.columnText,
                        styles.dateColumn,
                      ]}
                    >
                      DATE
                    </Text>
                  </View>
                )}

                {filteredTransactions.map(
                  (transaction) => {
                    const statusStyle =
                      getStatusStyle(
                        transaction.status
                      );

                    return (
                      <View
                        key={transaction.id}
                        style={[
                          styles.transactionRow,
                          isCompact &&
                            styles.transactionRowCompact,
                        ]}
                      >
                        <View
                          style={[
                            styles.customerCell,
                            !isCompact &&
                              styles.customerColumn,
                          ]}
                        >
                          <View style={styles.customerAvatar}>
                            <Ionicons
                              name="person-outline"
                              size={17}
                              color="#4B00FF"
                            />
                          </View>

                          <View style={styles.customerInfo}>
                            <Text
                              style={
                                styles.customerName
                              }
                              numberOfLines={1}
                            >
                              {transaction.customer_name ||
                                'Customer'}
                            </Text>
                            <Text
                              style={styles.transactionId}
                            >
                              #{transaction.id}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.serviceCell,
                            !isCompact &&
                              styles.serviceColumn,
                          ]}
                        >
                          <View
                            style={styles.serviceIcon}
                          >
                            <Ionicons
                              name={getServiceIcon(
                                transaction.service
                              )}
                              size={18}
                              color="#4B00FF"
                            />
                          </View>

                          <Text
                            style={styles.serviceText}
                            numberOfLines={1}
                          >
                            {transaction.service ||
                              'Service'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.paymentCell,
                            !isCompact &&
                              styles.paymentColumn,
                          ]}
                        >
                          <Text
                            style={styles.paymentText}
                          >
                            {formatPayment(
                              transaction.payment
                            )}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.durationCell,
                            !isCompact &&
                              styles.durationColumn,
                          ]}
                        >
                          <Ionicons
                            name="time-outline"
                            size={15}
                            color="#8A8D97"
                          />
                          <Text
                            style={styles.durationText}
                          >
                            {transaction.duration ?? 0}
                            min
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusCell,
                            !isCompact &&
                              styles.statusColumn,
                          ]}
                        >
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  statusStyle.backgroundColor,
                              },
                            ]}
                          >
                            <Ionicons
                              name={statusStyle.icon}
                              size={13}
                              color={
                                statusStyle.textColor
                              }
                            />
                            <Text
                              style={[
                                styles.statusText,
                                {
                                  color:
                                    statusStyle.textColor,
                                },
                              ]}
                            >
                              {transaction.status ||
                                'UNKNOWN'}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.dateCell,
                            !isCompact &&
                              styles.dateColumn,
                          ]}
                        >
                          <Text
                            style={styles.dateText}
                          >
                            {formatDate(
                              transaction.created_at
                            )}
                          </Text>
                          <Text
                            style={styles.timeText}
                          >
                            {formatTime(
                              transaction.created_at
                            )}
                          </Text>
                        </View>
                      </View>
                    );
                  }
                )}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <Ionicons
          name={icon}
          size={21}
          color="#4B00FF"
        />
      </View>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>

      <Text style={styles.summaryValue}>
        {value}
      </Text>

      <Text style={styles.summaryDetail}>
        {detail}
      </Text>
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

  headerButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    padding: 28,
    paddingBottom: 50,
  },

  pageIntro: {
    marginBottom: 20,
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
    flexDirection: 'row',
    gap: 15,
  },

  summaryRowCompact: {
    flexDirection: 'column',
  },

  summaryCard: {
    flex: 1,
    minHeight: 145,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 19,
    borderWidth: 1,
    borderColor: '#E8E9EF',
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F5F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryLabel: {
    marginTop: 12,
    color: '#777B87',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  summaryValue: {
    marginTop: 4,
    color: '#17181D',
    fontSize: 25,
    fontWeight: '900',
  },

  summaryDetail: {
    marginTop: 3,
    color: '#999CA5',
    fontSize: 10,
  },

  tableCard: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E9EF',
    overflow: 'hidden',
  },

  tableHeader: {
    minHeight: 82,
    paddingHorizontal: 22,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
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
    fontSize: 11,
  },

  filterRow: {
    flexDirection: 'row',
    gap: 7,
  },

  filterButton: {
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: '#F2F3F6',
  },

  filterButtonActive: {
    backgroundColor: '#4B00FF',
  },

  filterText: {
    color: '#777B87',
    fontSize: 10,
    fontWeight: '800',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  columnHeader: {
    minHeight: 42,
    paddingHorizontal: 20,
    backgroundColor: '#F8F8FA',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ECECF1',
    flexDirection: 'row',
    alignItems: 'center',
  },

  columnText: {
    color: '#999CA5',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  customerColumn: {
    flex: 2,
  },

  serviceColumn: {
    flex: 1.7,
  },

  paymentColumn: {
    flex: 1,
  },

  durationColumn: {
    flex: 1,
  },

  statusColumn: {
    flex: 1.2,
  },

  dateColumn: {
    flex: 1.3,
  },

  transactionRow: {
    minHeight: 78,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F3',
    flexDirection: 'row',
    alignItems: 'center',
  },

  transactionRowCompact: {
    paddingVertical: 15,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 11,
  },

  customerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingRight: 10,
  },

  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#F5F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  customerInfo: {
    flex: 1,
  },

  customerName: {
    color: '#292B32',
    fontSize: 12,
    fontWeight: '800',
  },

  transactionId: {
    marginTop: 2,
    color: '#A0A2AA',
    fontSize: 9,
  },

  serviceCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },

  serviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#F5F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  serviceText: {
    color: '#393B43',
    fontSize: 11,
    fontWeight: '700',
  },

  paymentCell: {
    paddingRight: 8,
  },

  paymentText: {
    color: '#17181D',
    fontSize: 12,
    fontWeight: '900',
  },

  durationCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  durationText: {
    color: '#656873',
    fontSize: 11,
    fontWeight: '700',
  },

  statusCell: {
    paddingRight: 8,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '900',
  },

  dateCell: {
    justifyContent: 'center',
  },

  dateText: {
    color: '#4D4F57',
    fontSize: 10,
    fontWeight: '700',
  },

  timeText: {
    marginTop: 2,
    color: '#999CA5',
    fontSize: 9,
  },

  emptyState: {
    minHeight: 300,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ECECF1',
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#F5F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    marginTop: 14,
    color: '#292B32',
    fontSize: 16,
    fontWeight: '900',
  },

  emptyText: {
    maxWidth: 330,
    marginTop: 5,
    color: '#999CA5',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },
});
