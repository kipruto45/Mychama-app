import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { PaymentIntentRecord, paymentService } from '@/services/paymentService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';

type PaymentHistoryScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'PaymentHistory'>;

type PaymentFilter = 'all' | 'success' | 'partially_refunded' | 'refunded' | 'pending' | 'pending_verification' | 'failed';

type PaymentSection = {
  title: string;
  data: PaymentIntentRecord[];
};

const { width } = Dimensions.get('window');

const FILTERS: Array<{ key: PaymentFilter; label: string; icon: string }> = [
  { key: 'all', label: 'All', icon: 'view-list' },
  { key: 'success', label: 'Success', icon: 'check-circle' },
  { key: 'pending', label: 'Pending', icon: 'clock-outline' },
  { key: 'pending_verification', label: 'Verify', icon: 'shield-check' },
  { key: 'failed', label: 'Failed', icon: 'alert-circle' },
  { key: 'refunded', label: 'Refunded', icon: 'cash-refund' },
  { key: 'partially_refunded', label: 'Partial', icon: 'cash-minus' },
];

const toSectionTitle = (isoDate: string) => {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!Number.isNaN(date.getTime())) {
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    if (date >= thisWeekStart) return 'This Week';
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (date >= thisMonth) return 'Earlier This Month';
  }

  return 'Older';
};

const toDayKey = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'unknown';
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStatusVariant = (status: string) => {
  if (['success', 'reconciled'].includes(status)) return 'success' as const;
  if (['partially_refunded', 'refunded', 'pending', 'pending_verification'].includes(status)) return 'warning' as const;
  if (status === 'failed') return 'error' as const;
  return 'info' as const;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    success: 'Success',
    pending: 'Pending',
    pending_verification: 'Verification',
    failed: 'Failed',
    refunded: 'Refunded',
    partially_refunded: 'Partial',
    reconciled: 'Reconciled',
  };
  return labels[status] || status.replace(/_/g, ' ');
};

const getPaymentMethodIcon = (method: string) => {
  const icons: Record<string, string> = {
    mpesa: 'cellphone',
    cash: 'cash',
    bank: 'bank',
    card: 'credit-card',
    default: 'wallet',
  };
  return icons[method?.toLowerCase()] || icons.default;
};

interface SummaryStats {
  totalPayments: number;
  successfulPayments: number;
  pendingAmount: number;
  refundedAmount: number;
  thisMonthTotal: string;
}

export const PaymentHistoryScreen: React.FC = () => {
  const navigation = useNavigation<PaymentHistoryScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { activeChamaId, activeChama } = useActiveChama();

  const [payments, setPayments] = useState<PaymentIntentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<PaymentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    if (!activeChamaId) {
      setPayments([]);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);

    try {
      const rows = await paymentService.getPaymentHistory({
        chama_id: activeChamaId,
        status: filter === 'all' ? undefined : filter,
      });

      const orderedRows = rows.sort(
        (left, right) => new Date(right.created_at || '').getTime() - new Date(left.created_at || '').getTime()
      );

      setPayments(orderedRows);
    } catch (serviceError) {
      const message = typeof serviceError === 'object' && serviceError && 'message' in serviceError
        ? String((serviceError as { message?: string }).message || 'Failed to load payment history.')
        : 'Failed to load payment history.';
      setError(message);
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [activeChamaId, filter]);

  useEffect(() => {
    if (!showSearch) {
      setSearchQuery('');
    }
  }, [showSearch]);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchPayments();
  };

  const summaryStats = useMemo((): SummaryStats => {
    const totalPayments = payments.length;
    const successfulPayments = payments.filter(p => p.status === 'success').length;
    const pendingAmount = payments
      .filter(p => ['pending', 'pending_verification'].includes(p.status))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const refundedAmount = payments
      .filter(p => ['refunded', 'partially_refunded'].includes(p.status))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const thisMonthTotal = payments
      .filter(p => {
        const d = new Date(p.created_at || '');
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)
      .toString();

    return {
      totalPayments,
      successfulPayments,
      pendingAmount,
      refundedAmount,
      thisMonthTotal,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const query = searchQuery.toLowerCase();
    return payments.filter(p => 
      (p.purpose || '').toLowerCase().includes(query) ||
      (p.reference || '').toLowerCase().includes(query) ||
      (p.reference_id || '').toLowerCase().includes(query) ||
      (p.id || '').toLowerCase().includes(query) ||
      String(p.amount).includes(query)
    );
  }, [payments, searchQuery]);

  const groupedSections = useMemo<PaymentSection[]>(() => {
    const grouped = new Map<string, PaymentIntentRecord[]>();

    filteredPayments.forEach((payment) => {
      const key = toDayKey(payment.created_at || '');
      const current = grouped.get(key) || [];
      current.push(payment);
      grouped.set(key, current);
    });

    return Array.from(grouped.entries())
      .sort((left, right) => right[0].localeCompare(left[0]))
      .map(([key, rows]) => ({
        title: key === 'unknown' ? 'Unknown Date' : toSectionTitle(rows[0]?.created_at || ''),
        data: rows,
      }));
  }, [filteredPayments]);

  const renderPaymentItem = ({ item }: { item: PaymentIntentRecord }) => (
    <TouchableOpacity
      style={styles.paymentItem}
      onPress={() => navigation.navigate('PaymentStatus', {
        intentId: item.id,
        status: item.status,
        amount: item.amount,
        currency: item.currency,
        purpose: item.purpose,
      })}
      activeOpacity={0.75}
    >
      <View style={styles.paymentIconContainer}>
        <Icon name={getPaymentMethodIcon(item.payment_method || item.intent_type) as any} size={22} color={colors.primary[500]} />
      </View>

      <View style={styles.paymentInfo}>
        <Text style={styles.paymentPurpose}>{(item.purpose || 'Payment').replace(/_/g, ' ')}</Text>
        <View style={styles.paymentMetaRow}>
          <Text style={styles.paymentMeta}>
            {(item.payment_method || item.intent_type)?.toUpperCase()}
          </Text>
          <Text style={styles.paymentMetaDot}>•</Text>
          <Text style={styles.paymentMeta}>
            {new Date(item.created_at || '').toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.paymentReference} numberOfLines={1}>
          Ref: {item.reference || item.reference_id || item.id.slice(0, 12)}
        </Text>
      </View>

      <View style={styles.paymentRight}>
        <Text style={styles.paymentAmount}>
          {item.currency} {Number(item.amount || 0).toLocaleString('en-KE')}
        </Text>
        <Badge label={getStatusLabel(item.status)} variant={getStatusVariant(item.status)} />
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: PaymentSection }) => (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeader}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length} payment{section.data.length !== 1 ? 's' : ''}</Text>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return null;
    if (error) {
      return (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="alert-circle-outline" size={56} color={colors.error} />
          </View>
          <Text style={styles.emptyTitle}>Unable to load payments</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <Button title="Try Again" onPress={() => void fetchPayments()} style={styles.emptyButton} />
        </View>
      );
    }

    if (searchQuery && filteredPayments.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="magnify" size={56} color={colors.neutral[400]} />
          </View>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>No payments match "{searchQuery}"</Text>
          <Button title="Clear Search" onPress={() => setSearchQuery('')} style={styles.emptyButton} variant="outline" />
        </View>
      );
    }

    if (filter !== 'all' && payments.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="filter-off" size={56} color={colors.neutral[400]} />
          </View>
          <Text style={styles.emptyTitle}>No {getStatusLabel(filter).toLowerCase()} payments</Text>
          <Text style={styles.emptySubtitle}>There are no payments with this status</Text>
          <Button title="View All Payments" onPress={() => setFilter('all')} style={styles.emptyButton} variant="outline" />
        </View>
      );
    }

    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyIconContainer}>
          <Icon name="wallet-outline" size={56} color={colors.neutral[300]} />
        </View>
        <Text style={styles.emptyTitle}>No payments yet</Text>
        <Text style={styles.emptySubtitle}>Your payment history will appear here</Text>
        <Button title="Make Contribution" onPress={() => navigation.navigate('MakeContribution', {})} style={styles.emptyButton} />
      </View>
    );
  };

  if (!activeChamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="account-group-outline" size={60} color={colors.neutral[400]} />
          </View>
          <Text style={styles.emptyTitle}>Select a chama</Text>
          <Text style={styles.emptySubtitle}>Choose a chama to view its payment history</Text>
          <Button title="Open Chamas" onPress={() => navigation.navigate('Chamas')} style={styles.emptyButton} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Payments</Text>
          <Text style={styles.headerSubtitle}>{activeChama?.name || 'MyChama'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowSearch(!showSearch)}>
            <Icon name={showSearch ? 'magnify-close' : 'magnify'} size={22} color={colors.neutral[700]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="dots-vertical" size={22} color={colors.neutral[700]} />
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="magnify" size={20} color={colors.neutral[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by amount, reference..."
              placeholderTextColor={colors.neutral[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={18} color={colors.neutral[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{summaryStats.totalPayments}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValueSuccess}>{summaryStats.successfulPayments}</Text>
          <Text style={styles.summaryLabel}>Successful</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValueWarning}>
            {summaryStats.pendingAmount > 0 ? formatCurrency(summaryStats.pendingAmount.toString(), activeChama?.currency || 'KES') : '-'}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {summaryStats.thisMonthTotal !== '0' ? formatCurrency(summaryStats.thisMonthTotal, activeChama?.currency || 'KES') : '-'}
          </Text>
          <Text style={styles.summaryLabel}>This Month</Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(item.key)}
              >
                <Icon 
                  name={item.icon as any} 
                  size={16} 
                  color={active ? '#FFFFFF' : colors.neutral[600]} 
                  style={styles.filterIcon}
                />
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      ) : (
        <SectionList
          sections={groupedSections}
          keyExtractor={(item) => item.id}
          renderItem={renderPaymentItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
          ListEmptyComponent={renderEmptyState}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing[2],
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
  },
  summaryStrip: {
    flexDirection: 'row',
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  summaryValueSuccess: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
  },
  summaryValueWarning: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.warning,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing[1],
  },
  filtersContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    paddingBottom: spacing[2],
  },
  filtersContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    marginRight: spacing[2],
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterIcon: {
    marginRight: spacing[1],
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    marginTop: spacing[3],
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  sectionHeader: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[400],
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  paymentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    marginRight: spacing[3],
  },
  paymentInfo: {
    flex: 1,
  },
  paymentPurpose: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  paymentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMeta: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
  },
  paymentMetaDot: {
    color: colors.neutral[300],
    marginHorizontal: spacing[1],
  },
  paymentReference: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
    marginLeft: spacing[2],
  },
  paymentAmount: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[12],
    paddingHorizontal: spacing[6],
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[800],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  emptyButton: {
    minWidth: 160,
  },
});

export default PaymentHistoryScreen;
