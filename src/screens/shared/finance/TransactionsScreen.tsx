import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ApiError } from '@/api/errors';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import {
  financeService,
  TransactionsFeedCategory,
  TransactionsFeedItem,
  TransactionsFeedStatus,
} from '@/services/financeService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime, formatStatus } from '@/utils/format';

type TransactionsScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Transactions'
>;

type CategoryFilter = 'all' | TransactionsFeedCategory;
type StatusFilter = 'all' | Exclude<TransactionsFeedStatus, 'unknown'>;

const CATEGORY_FILTERS: Array<{ key: CategoryFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'inflow', label: 'Inflows' },
  { key: 'outflow', label: 'Outflows' },
  { key: 'internal', label: 'Internal' },
  { key: 'system', label: 'System' },
];

export const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<TransactionsScreenNavigationProp>();
  const {
    activeChamaId,
    availableChamas,
    isLoading: isLoadingChamaContext,
    isSwitching,
    switchChama,
    clearSwitchError,
    switchError,
  } = useActiveChama();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const [items, setItems] = useState<TransactionsFeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [method, setMethod] = useState<string | null>(null);
  const [entryType, setEntryType] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const isBillingGate = error?.status === 402;

  const loadTransactions = async (options?: { reset?: boolean; cursor?: string | null }) => {
    if (!activeChamaId) {
      setItems([]);
      setNextCursor(null);
      setLoading(false);
      return;
    }

    const reset = options?.reset ?? false;
    const cursor = options?.cursor ?? null;
    setError(null);

    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const page = await financeService.getAllTransactionsFeed(activeChamaId, {
        category: category === 'all' ? undefined : category,
        status: status === 'all' ? undefined : status,
        method: method || undefined,
        entry_type: entryType || undefined,
        search: searchQuery.trim() || undefined,
        cursor: cursor || undefined,
        limit: 50,
      });

      setNextCursor(page.pagination?.next_cursor ? String(page.pagination.next_cursor) : null);
      setItems((prev) => (reset ? page.items : [...prev, ...page.items]));
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : null;
      setError(
        apiError ||
          new ApiError({
            code: 'UNKNOWN',
            message: caught instanceof Error ? caught.message : 'Unable to load transactions.',
          })
      );
      if (reset) {
        setItems([]);
        setNextCursor(null);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!isLoadingChamaContext) {
      void loadTransactions({ reset: true });
    }
  }, [activeChamaId, isLoadingChamaContext]);

  useEffect(() => {
    if (isLoadingChamaContext) {
      return;
    }
    const handle = setTimeout(() => {
      void loadTransactions({ reset: true });
    }, 350);
    return () => clearTimeout(handle);
  }, [category, status, method, entryType, searchQuery, isLoadingChamaContext]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions({ reset: true });
    setRefreshing(false);
  };

  const getStatusVariant = (value: string) => {
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'success') return 'success';
    if (normalized === 'pending') return 'warning';
    if (normalized === 'failed' || normalized === 'reversed') return 'error';
    return 'info';
  };

  const getCategoryColor = (resolvedCategory: TransactionsFeedCategory) => {
    switch (resolvedCategory) {
      case 'inflow':
        return colors.success;
      case 'outflow':
        return colors.error;
      case 'internal':
        return colors.info;
      case 'system':
        return colors.neutral[600];
      default:
        return colors.primary[500];
    }
  };

  const getCategoryIcon = (item: TransactionsFeedItem) => {
    const type = String(item.type || '').toLowerCase();
    if (type.includes('contribution') || type.includes('topup')) return 'cash-plus';
    if (type.includes('withdrawal')) return 'cash-minus';
    if (type.includes('loan_disbursement')) return 'bank-transfer-out';
    if (type.includes('loan_repayment') || type.includes('repayment')) return 'bank-transfer-in';
    if (type.includes('penalty')) return 'alert-circle';
    if (type.includes('expense')) return 'receipt';
    if (type.includes('transfer')) return 'swap-horizontal';
    return item.category === 'inflow'
      ? 'arrow-down-circle'
      : item.category === 'outflow'
        ? 'arrow-up-circle'
        : 'swap-horizontal';
  };

  const emptyState = useMemo(() => {
    const title = error ? 'Could not load transactions' : 'No transactions yet';
    const description = error
      ? error.message
      : searchQuery.trim() || category !== 'all' || status !== 'all' || method || entryType
        ? 'No transactions match your current filters.'
        : 'Transactions will appear here as soon as finance activity is recorded.';

    const actionTitle = error ? (isBillingGate ? 'Retry' : 'Retry') : undefined;

    return (
      <EmptyState
        icon={<Icon name="swap-horizontal" size={64} color={colors.neutral[400]} />}
        title={title}
        description={description}
        action={
          actionTitle ? (
            <Button
              title={actionTitle}
              onPress={() => void loadTransactions({ reset: true })}
              icon={<Icon name={isBillingGate ? 'lock' : 'refresh'} size={20} color="#FFFFFF" />}
            />
          ) : undefined
        }
      />
    );
  }, [error, searchQuery, category, status, method, entryType, isBillingGate]);

  const renderTransactionItem = ({ item }: { item: TransactionsFeedItem }) => {
    const prefix = item.direction === 'outflow' ? '-' : item.direction === 'inflow' ? '+' : '';
    const color = getCategoryColor(item.category);
    const hasReceipt = Boolean(item.receipt_available && item.receipt_intent_id);

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() =>
          navigation.navigate('TransactionDetail', {
            transactionRef: item.ref,
            chamaId: activeChamaId || undefined,
          })
        }
        activeOpacity={0.75}
      >
        <View style={[styles.transactionIcon, { backgroundColor: `${color}20` }]}>
          <Icon name={getCategoryIcon(item)} size={20} color={color} />
        </View>

        <View style={styles.transactionInfo}>
          <View style={styles.transactionTitleRow}>
            <Text style={styles.transactionTitle} numberOfLines={1}>
              {item.title || 'Transaction'}
            </Text>
            {hasReceipt ? (
              <View style={styles.receiptPill}>
                <Icon name="receipt" size={14} color={colors.neutral[600]} />
                <Text style={styles.receiptPillText}>Receipt</Text>
              </View>
            ) : null}
          </View>

          {item.description ? (
            <Text style={styles.transactionSubtext} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}

          <Text style={styles.transactionSubtext} numberOfLines={1}>
            {item.member?.name ? item.member.name : 'Chama transaction'}
            {item.method ? ` • ${formatStatus(item.method)}` : ''}
          </Text>
          <Text style={styles.transactionDate}>{formatDateTime(item.event_at)}</Text>
        </View>

        <View style={styles.transactionRight}>
          <Text style={styles.transactionAmount}>
            {prefix}
            {formatCurrency(item.amount, item.currency)}
          </Text>
          <Badge
            label={formatStatus(String(item.status || 'unknown'))}
            variant={getStatusVariant(String(item.status))}
            size="sm"
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity onPress={() => setFiltersOpen(true)} style={styles.headerAction}>
          <Icon name="filter-variant" size={22} color={colors.neutral[700]} />
        </TouchableOpacity>
      </View>

      <View style={styles.contextSwitcher}>
        <ChamaContextSwitcher
          availableChamas={availableChamas}
          activeChamaId={activeChamaId}
          isLoading={isLoadingChamaContext}
          isSwitching={isSwitching}
          onSwitch={switchChama}
          onClearError={clearSwitchError}
          switchError={switchError}
        />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color={colors.neutral[400]} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filterContainer}>
        {CATEGORY_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterTab, category === filter.key ? styles.filterTabActive : null]}
            onPress={() => setCategory(filter.key)}
          >
            <Text style={[styles.filterTabText, category === filter.key ? styles.filterTabTextActive : null]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <SkeletonList count={6} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.ref}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={emptyState}
          onEndReached={() => {
            if (!loadingMore && nextCursor) {
              void loadTransactions({ cursor: nextCursor });
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <Text style={styles.footerText}>Loading more…</Text>
              </View>
            ) : null
          }
        />
      )}

      <Modal visible={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <View style={styles.filterSection}>
          <Text style={styles.modalLabel}>Status</Text>
          <View style={styles.pillsRow}>
            {(['all', 'pending', 'success', 'failed', 'reversed'] as const).map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.pill, status === value ? styles.pillActive : null]}
                onPress={() => setStatus(value)}
              >
                <Text style={[styles.pillText, status === value ? styles.pillTextActive : null]}>
                  {value === 'all' ? 'Any' : formatStatus(value)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.modalLabel}>Method</Text>
          <View style={styles.pillsRow}>
            {[
              { key: null, label: 'Any' },
              { key: 'mpesa', label: 'M-Pesa' },
              { key: 'bank_transfer', label: 'Bank' },
              { key: 'wallet', label: 'Wallet' },
              { key: 'cash', label: 'Cash' },
              { key: 'card', label: 'Card' },
              { key: 'internal', label: 'Internal' },
            ].map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[styles.pill, method === option.key ? styles.pillActive : null]}
                onPress={() => setMethod(option.key)}
              >
                <Text style={[styles.pillText, method === option.key ? styles.pillTextActive : null]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.modalLabel}>Type</Text>
          <TextInput
            value={entryType || ''}
            onChangeText={(value) => setEntryType(value.trim() ? value.trim() : null)}
            placeholder="e.g. contribution, loan_repayment"
            placeholderTextColor={colors.neutral[400]}
            style={styles.modalInput}
            autoCapitalize="none"
          />
          <Text style={styles.modalHint}>Leave blank to include all transaction types.</Text>
        </View>

        <View style={styles.modalActions}>
          <Button
            title="Clear"
            variant="outline"
            onPress={() => {
              setStatus('all');
              setMethod(null);
              setEntryType(null);
              setFiltersOpen(false);
            }}
          />
          <Button title="Done" onPress={() => setFiltersOpen(false)} />
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  headerAction: {
    padding: spacing[2],
  },
  contextSwitcher: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing[2],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[900],
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  filterTab: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[100],
  },
  filterTabActive: {
    backgroundColor: colors.primary[500],
  },
  filterTabText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  transactionTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  transactionSubtext: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginTop: spacing[1],
  },
  transactionDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  transactionRight: {
    alignItems: 'flex-end',
    marginLeft: spacing[3],
  },
  transactionAmount: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  receiptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  receiptPillText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  footerLoading: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  filterSection: {
    marginBottom: spacing[4],
  },
  modalLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  pillActive: {
    borderColor: colors.primary[500],
    backgroundColor: `${colors.primary[500]}12`,
  },
  pillText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  pillTextActive: {
    color: colors.primary[700],
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[900],
  },
  modalHint: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
});
