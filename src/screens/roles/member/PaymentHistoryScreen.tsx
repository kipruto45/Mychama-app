import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { navigateToWorkspaceTab } from '@/navigation/workspaceTabNavigation';
import { memberWalletService, type MemberWalletActivityItem, type WalletActivityFilterKey } from '@/services/memberWalletService';
import { useMemberWalletFlowStore } from '@/store/memberWalletFlowStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { format as formatDate, subDays } from 'date-fns';

import {
  getWalletActivityIcon,
  getWalletActivityTypeSupportingText,
  getWalletTransactionStateMeta,
  resolveWalletLinkedTarget,
  WALLET_ACTIVITY_FILTERS,
} from './memberWalletWorkflowShared';
import {
  resolveMemberWalletActivityTarget,
  resolveWalletReceiptTarget,
} from './memberWalletWorkflowRouting';

type WalletActivityNavigationProp = NativeStackNavigationProp<MainStackParamList, 'PaymentHistory'>;
type WalletActivityRouteProp = RouteProp<MainStackParamList, 'PaymentHistory'>;

const normalizeFilter = (
  value?: MainStackParamList['PaymentHistory'] extends infer T
    ? T extends undefined
      ? never
      : T extends { filter?: infer F }
      ? F
      : never
    : never
): WalletActivityFilterKey => {
  if (value && value !== 'successful' && WALLET_ACTIVITY_FILTERS.some((item) => item.key === value)) {
    return value;
  }
  return 'all';
};

export const PaymentHistoryScreen: React.FC = () => {
  const navigation = useNavigation<WalletActivityNavigationProp>();
  const route = useRoute<WalletActivityRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const {
    selectedFilter,
    setLastOpenedTransactionId,
    setLastVisitedScreen,
    setSelectedFilter,
  } = useMemberWalletFlowStore();

  const chamaId = route.params?.chamaId || activeChamaId || undefined;
  const routeFilter = route.params?.filter ? normalizeFilter(route.params.filter) : null;
  const [items, setItems] = useState<MemberWalletActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilterState] = useState<WalletActivityFilterKey>(
    routeFilter || selectedFilter
  );
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d'>('all');

  useEffect(() => {
    setLastVisitedScreen('PaymentHistory');
  }, [setLastVisitedScreen]);

  useEffect(() => {
    if (!routeFilter) {
      return;
    }
    setActiveFilterState(routeFilter);
    setSelectedFilter(routeFilter);
  }, [routeFilter, setSelectedFilter]);

  const loadActivity = useCallback(
    async (showRefresh = false) => {
      if (!chamaId) {
        setItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const endDate = formatDate(new Date(), 'yyyy-MM-dd');
        const startDate =
          dateRange === '7d'
            ? formatDate(subDays(new Date(), 7), 'yyyy-MM-dd')
            : dateRange === '30d'
            ? formatDate(subDays(new Date(), 30), 'yyyy-MM-dd')
            : undefined;

        const response = await memberWalletService.getActivity(chamaId, {
          filter: activeFilter,
          search: search.trim() || undefined,
          startDate,
          endDate: startDate ? endDate : undefined,
        });
        setItems(response.items);
        setError(null);
      } catch (serviceError) {
        const message =
          typeof serviceError === 'object' && serviceError && 'message' in serviceError
            ? String((serviceError as { message?: string }).message || '')
            : '';
        setError(message || 'We couldn’t load your wallet right now. Please try again.');
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter, chamaId, dateRange, search]
  );

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  const currentFilterLabel = useMemo(
    () => WALLET_ACTIVITY_FILTERS.find((item) => item.key === activeFilter)?.label || 'All',
    [activeFilter]
  );

  const openTransaction = (item: MemberWalletActivityItem) => {
    setLastOpenedTransactionId(item.transactionId);
    const target = resolveMemberWalletActivityTarget(
      {
        transactionId: item.transactionId,
        type: item.type,
        intentId: item.intentId || undefined,
        chamaId,
      },
      'wallet_activity'
    );
    (navigation as any).navigate(target.screen, target.params);
  };

  if (!chamaId && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Wallet Activity" subtitle="Choose a chama" showBack />
        <EmptyState
          title="No chama selected"
          description="Choose a chama first so we can load your wallet activity."
          icon="wallet-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Wallet Activity" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading your transactions…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Wallet Activity" subtitle={activeChama?.name} showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadActivity(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        <Card style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Track inflows, outflows, and recent activity.</Text>
          <Input
            label="Search"
            placeholder="Find by purpose, reference, or linked item"
            value={search}
            onChangeText={setSearch}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {WALLET_ACTIVITY_FILTERS.map((filter) => {
                const selected = filter.key === activeFilter;
                return (
                  <TouchableOpacity
                    key={filter.key}
                    activeOpacity={0.85}
                    style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
                    onPress={() => {
                      setActiveFilterState(filter.key);
                      setSelectedFilter(filter.key);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selected ? styles.filterChipTextSelected : null,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {[
                { key: 'all' as const, label: 'All time' },
                { key: '7d' as const, label: 'Last 7 days' },
                { key: '30d' as const, label: 'Last 30 days' },
              ].map((range) => {
                const selected = range.key === dateRange;
                return (
                  <TouchableOpacity
                    key={range.key}
                    activeOpacity={0.85}
                    style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
                    onPress={() => setDateRange(range.key)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selected ? styles.filterChipTextSelected : null,
                      ]}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          <Text style={styles.filtersMeta}>Showing {currentFilterLabel.toLowerCase()} transactions</Text>
        </Card>

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        {!items.length ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              title={search.trim() ? 'No matching wallet activity' : 'No wallet activity yet.'}
              description={
                search.trim()
                  ? 'Try a different keyword or switch filters to find a transaction.'
                  : 'Your contributions, repayments, and receipts will appear here once they exist.'
              }
              icon="receipt-text-clock-outline"
              action={
                search.trim()
                  ? { label: 'Clear Search', onPress: () => setSearch('') }
                  : { label: 'Back to Wallet', onPress: () => navigateToWorkspaceTab(navigation as any, 'Payments', { chamaId }) }
              }
            />
          </Card>
        ) : (
          items.map((item) => {
            const stateMeta = getWalletTransactionStateMeta(item.status);
            const linkedTarget = resolveWalletLinkedTarget({
              chamaId,
              contributionId: item.contributionId,
              loanId: item.loanId,
              penaltyId: item.penaltyId,
              type: item.type,
            });
            const receiptTarget = resolveWalletReceiptTarget({ ...item, chamaId });

            return (
              <TouchableOpacity
                key={item.transactionId}
                activeOpacity={0.88}
                onPress={() => openTransaction(item)}
              >
                <Card style={styles.activityCard}>
                  <View style={styles.activityRow}>
                    <View
                      style={[
                        styles.activityIcon,
                        { backgroundColor: `${stateMeta.tint}14` },
                      ]}
                    >
                      <Icon
                        name={getWalletActivityIcon(item.type, item.direction) as any}
                        size={20}
                        color={stateMeta.tint}
                      />
                    </View>
                    <View style={styles.activityCopy}>
                      <View style={styles.titleRow}>
                        <Text style={styles.activityTitle}>{item.purposeLabel}</Text>
                        <Text
                          style={[
                            styles.activityAmount,
                            item.direction === 'inflow' ? styles.inflowAmount : styles.outflowAmount,
                          ]}
                        >
                          {item.direction === 'inflow' ? '+' : '-'}
                          {formatCurrency(item.amount, item.currency)}
                        </Text>
                      </View>
                      <Text style={styles.activityMeta}>
                        {getWalletActivityTypeSupportingText(item.type)} • {formatDateTime(item.date)}
                      </Text>
                      <View style={styles.metaRow}>
                        <Badge label={stateMeta.chipLabel} variant={stateMeta.chipVariant} size="sm" />
                        <Text style={styles.referenceText}>Ref {item.reference}</Text>
                      </View>
                    </View>
                  </View>

                  {(receiptTarget || linkedTarget || item.explanation) ? (
                    <View style={styles.actionRow}>
                      {item.explanation ? (
                        <Text style={styles.explanationText}>{item.explanation}</Text>
                      ) : null}
                      <View style={styles.inlineActionRow}>
                        {receiptTarget ? (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => (navigation as any).navigate(receiptTarget.screen, receiptTarget.params)}
                          >
                            <Text style={styles.inlineAction}>Receipt</Text>
                          </TouchableOpacity>
                        ) : null}
                        {linkedTarget ? (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => (navigation as any).navigate(linkedTarget.screen, linkedTarget.params)}
                          >
                            <Text style={styles.inlineAction}>
                              {item.loanId ? 'Loan details' : item.penaltyId ? 'Fine details' : 'Contribution details'}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    padding: spacing[4],
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  centerText: {
    marginTop: spacing[3],
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
  },
  filtersCard: {
    gap: spacing[3],
  },
  filtersTitle: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  filterChipSelected: {
    backgroundColor: colors.primary[500],
  },
  filterChipText: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  filterChipTextSelected: {
    color: colors.light.card,
  },
  filtersMeta: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  errorCard: {
    backgroundColor: colors.error + '10',
  },
  errorText: {
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  emptyCard: {
    padding: 0,
  },
  activityCard: {
    gap: spacing[3],
  },
  activityRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  activityIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCopy: {
    flex: 1,
    gap: spacing[1],
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  activityTitle: {
    flex: 1,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
  },
  activityAmount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
  },
  inflowAmount: {
    color: colors.success,
  },
  outflowAmount: {
    color: colors.neutral[900],
  },
  activityMeta: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  referenceText: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  actionRow: {
    gap: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  explanationText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  inlineActionRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  inlineAction: {
    color: colors.primary[600],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
});

export default PaymentHistoryScreen;
