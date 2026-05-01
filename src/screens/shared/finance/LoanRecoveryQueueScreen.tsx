import React, { useEffect, useMemo, useState } from 'react';
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getErrorMessage } from '@/api/errors';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { financeService } from '@/services/financeService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Loan, LoanReports } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'LoanRecoveryQueue'>;
type RoutePropType = RouteProp<MainStackParamList, 'LoanRecoveryQueue'>;

type FilterKey = 'all' | 'overdue' | 'defaulted' | 'restructured' | 'written_off';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'defaulted', label: 'Defaulted' },
  { key: 'restructured', label: 'Restructured' },
  { key: 'written_off', label: 'Written Off' },
];

const getBadgeVariant = (status: Loan['status']) => {
  switch (status) {
    case 'restructured':
    case 'recovered_from_offset':
    case 'recovered_from_guarantor':
      return 'info';
    case 'written_off':
    case 'defaulted':
    case 'defaulted_recovering':
      return 'error';
    case 'overdue':
      return 'warning';
    default:
      return 'success';
  }
};

const getDaysOverdue = (dueDate?: string | null) => {
  if (!dueDate) {
    return 0;
  }
  const due = new Date(dueDate);
  const today = new Date();
  const diff = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

export const LoanRecoveryQueueScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const {
    activeChamaId,
    availableChamas,
    clearSwitchError,
    isLoading: isLoadingChamaContext,
    isSwitching,
    switchChama,
    switchError,
  } = useActiveChama();

  const chamaId = route.params?.chamaId || activeChamaId || undefined;
  const currentCurrency = availableChamas.find((item) => item.id === chamaId)?.currency || 'KES';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>(route.params?.filter || 'all');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanReports, setLoanReports] = useState<LoanReports | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!route.params?.chamaId || !availableChamas.some((item) => item.id === route.params?.chamaId)) {
      return;
    }
    if (route.params.chamaId !== activeChamaId) {
      clearSwitchError();
      void switchChama(route.params.chamaId).catch(() => undefined);
    }
  }, [activeChamaId, availableChamas, clearSwitchError, route.params?.chamaId, switchChama]);

  useEffect(() => {
    setFilter(route.params?.filter || 'all');
  }, [route.params?.filter]);

  useEffect(() => {
    if (isLoadingChamaContext || !chamaId) {
      return;
    }
    void loadQueue();
  }, [chamaId, isLoadingChamaContext]);

  const loadQueue = async () => {
    if (!chamaId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [loanRows, reports] = await Promise.all([
        financeService.getLoans(chamaId),
        financeService.getLoanReports(chamaId).catch(() => null),
      ]);
      setLoans(
        loanRows.filter((loan) =>
          ['overdue', 'defaulted', 'defaulted_recovering', 'restructured', 'written_off', 'recovered_from_offset'].includes(loan.status)
        )
      );
      setLoanReports(reports);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setLoans([]);
      setLoanReports(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredLoans = useMemo(() => {
    if (filter === 'all') {
      return loans;
    }
    return loans.filter((loan) => loan.status === filter);
  }, [filter, loans]);

  const summary = useMemo(() => {
    const portfolio = (loanReports?.portfolio as Record<string, unknown> | undefined) || {};
    return {
      overdue: loans.filter((loan) => loan.status === 'overdue').length,
      defaulted: loans.filter((loan) => ['defaulted', 'defaulted_recovering'].includes(loan.status)).length,
      restructured: loans.filter((loan) => loan.status === 'restructured').length,
      outstanding: formatCurrency(String(portfolio.total_outstanding || '0'), currentCurrency),
    };
  }, [currentCurrency, loanReports, loans]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerTitle}>Loading recovery queue</Text>
          <Text style={styles.centerText}>Gathering overdue, defaulted, and restructured loans for follow-up.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={22} color={colors.neutral[700]} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Loan Recovery Queue</Text>
          <Text style={styles.subtitle}>Monitor overdue, defaulted, restructured, and recovered loans in one queue.</Text>
        </View>
      </View>

      <View style={styles.switcherWrap}>
        <ChamaContextSwitcher
          chamas={availableChamas}
          activeChamaId={activeChamaId}
          isSwitching={isSwitching}
          onSelectChama={(nextChamaId) => {
            clearSwitchError();
            void switchChama(nextChamaId).catch(() => undefined);
          }}
          helperText={switchError}
        />
      </View>

      {error ? (
        <EmptyState
          icon={<Icon name="alert-circle-outline" size={52} color={colors.error} />}
          title="Recovery queue unavailable"
          description={error}
          action={<Button title="Retry" onPress={() => void loadQueue()} />}
          style={styles.centerState}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryRow}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Overdue</Text>
              <Text style={styles.summaryValue}>{summary.overdue}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Defaulted</Text>
              <Text style={styles.summaryValue}>{summary.defaulted}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Restructured</Text>
              <Text style={styles.summaryValue}>{summary.restructured}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Outstanding</Text>
              <Text style={styles.summaryValueSmall}>{summary.outstanding}</Text>
            </Card>
          </View>

          <Card style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Operations</Text>
            <Text style={styles.heroTitle}>Track repayment risk, defaults, and recovery handling</Text>
            <Text style={styles.heroText}>
              Use this queue for the loan portfolio after disbursement. Open any record to manage notes, savings offsets, write-offs, or restructure actions.
            </Text>
          </Card>

          <View style={styles.filterRow}>
            {FILTERS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
                onPress={() => setFilter(item.key)}
              >
                <Text style={[styles.filterLabel, filter === item.key && styles.filterLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredLoans.length ? (
            filteredLoans.map((loan) => {
              const daysOverdue = getDaysOverdue(loan.due_date);
              return (
                <Card key={loan.id} style={styles.card}>
                  <View style={styles.inlineBetween}>
                    <View style={styles.cardCopy}>
                      <Text style={styles.cardTitle}>{loan.member.full_name}</Text>
                      <Text style={styles.cardSubtitle}>{loan.loan_product.name}</Text>
                    </View>
                    <Badge label={loan.status.replace(/_/g, ' ')} variant={getBadgeVariant(loan.status)} />
                  </View>

                  <Text style={styles.amountText}>{formatCurrency(loan.total_due || loan.principal, currentCurrency)}</Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Due date</Text>
                    <Text style={styles.metaValue}>{loan.due_date ? formatDate(loan.due_date) : 'Not scheduled'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Days overdue</Text>
                    <Text style={styles.metaValue}>{daysOverdue || '0'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Outstanding penalties</Text>
                    <Text style={styles.metaValue}>{formatCurrency(loan.outstanding_penalty || '0', currentCurrency)}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Escalation</Text>
                    <Text style={styles.metaValue}>{loan.escalation_level || 'normal'}</Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <Button title="Open Recovery Tools" onPress={() => navigation.navigate('LoanDetail', { loanId: loan.id, chamaId })} />
                    <Button title="Restructure Review" variant="outline" onPress={() => navigation.navigate('LoanRestructureQueue', { chamaId })} />
                  </View>
                </Card>
              );
            })
          ) : (
            <EmptyState
              icon={<Icon name="shield-check-outline" size={50} color={colors.neutral[400]} />}
              title="No loans need recovery follow-up"
              description="Overdue, defaulted, and restructured loans will appear here."
            />
          )}
        </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  subtitle: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  switcherWrap: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  content: {
    padding: spacing[4],
    gap: spacing[4],
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  summaryCard: {
    flexBasis: '47%',
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  summaryValue: {
    marginTop: spacing[2],
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  summaryValueSmall: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  heroCard: {
    gap: spacing[3],
  },
  heroEyebrow: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  heroText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  card: {
    gap: spacing[3],
  },
  inlineBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  cardSubtitle: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  amountText: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[700],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  metaLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  metaValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  centerTitle: {
    marginTop: spacing[4],
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  centerText: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});

export default LoanRecoveryQueueScreen;
