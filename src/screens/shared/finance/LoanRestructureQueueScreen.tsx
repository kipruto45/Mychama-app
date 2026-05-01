import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
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
import { Loan, LoanRestructureRequest } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'LoanRestructureQueue'>;
type RoutePropType = RouteProp<MainStackParamList, 'LoanRestructureQueue'>;

type FilterKey = 'all' | 'requested' | 'applied' | 'rejected';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'requested', label: 'Requested' },
  { key: 'applied', label: 'Applied' },
  { key: 'rejected', label: 'Rejected' },
];

const getBadgeVariant = (status: string) => {
  switch (status) {
    case 'applied':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'warning';
  }
};

export const LoanRestructureQueueScreen: React.FC = () => {
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
  const canReviewRestructures = useCanPerformAction([Permission.CAN_APPROVE_LOAN, Permission.CAN_MAKE_ADJUSTMENTS], chamaId);
  const currentCurrency = availableChamas.find((item) => item.id === chamaId)?.currency || 'KES';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>(route.params?.filter || 'all');
  const [requests, setRequests] = useState<LoanRestructureRequest[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
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
      const [requestRows, loanRows] = await Promise.all([
        financeService.getLoanRestructureRequests(chamaId),
        financeService.getLoans(chamaId),
      ]);
      setRequests(requestRows);
      setLoans(loanRows);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setRequests([]);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const loanById = useMemo(() => {
    return new Map(loans.map((loan) => [loan.id, loan]));
  }, [loans]);

  const filteredRequests = useMemo(() => {
    if (filter === 'all') {
      return requests;
    }
    return requests.filter((request) => request.status === filter);
  }, [filter, requests]);

  const summary = useMemo(() => {
    return {
      requested: requests.filter((item) => item.status === 'requested').length,
      applied: requests.filter((item) => item.status === 'applied').length,
      rejected: requests.filter((item) => item.status === 'rejected').length,
    };
  }, [requests]);

  const confirmReview = (requestItem: LoanRestructureRequest, decision: 'approved' | 'rejected') => {
    Alert.alert(
      decision === 'approved' ? 'Approve restructure' : 'Reject restructure',
      decision === 'approved'
        ? 'Apply the proposed terms to this loan now?'
        : 'Reject this restructure request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              setActingId(requestItem.id);
              await financeService.reviewLoanRestructureRequest(requestItem.id, { decision });
              await loadQueue();
            } catch (reviewError) {
              Alert.alert('Restructure review', getErrorMessage(reviewError));
            } finally {
              setActingId(null);
            }
          },
        },
      ]
    );
  };

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
          <Text style={styles.centerTitle}>Loading restructure reviews</Text>
          <Text style={styles.centerText}>Gathering requested term changes and review decisions for this chama.</Text>
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
          <Text style={styles.title}>Restructure Review</Text>
          <Text style={styles.subtitle}>Review requested loan term changes before they are applied to active loans.</Text>
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
          title="Restructure queue unavailable"
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
              <Text style={styles.summaryLabel}>Requested</Text>
              <Text style={styles.summaryValue}>{summary.requested}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Applied</Text>
              <Text style={styles.summaryValue}>{summary.applied}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Rejected</Text>
              <Text style={styles.summaryValue}>{summary.rejected}</Text>
            </Card>
          </View>

          <Card style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Policy Review</Text>
            <Text style={styles.heroTitle}>Inspect requested term changes before they alter repayment schedules</Text>
            <Text style={styles.heroText}>
              Review the borrower context in the linked loan record, then approve or reject the requested restructure with a clear audit trail.
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

          {filteredRequests.length ? (
            filteredRequests.map((requestItem) => {
              const loan = loanById.get(requestItem.loan);
              return (
                <Card key={requestItem.id} style={styles.card}>
                  <View style={styles.inlineBetween}>
                    <View style={styles.cardCopy}>
                      <Text style={styles.cardTitle}>{loan?.member.full_name || 'Borrower'}</Text>
                      <Text style={styles.cardSubtitle}>
                        {loan?.loan_product.name || 'Loan'} • {loan ? formatCurrency(loan.principal, currentCurrency) : 'Loan amount unavailable'}
                      </Text>
                    </View>
                    <Badge label={requestItem.status.replace(/_/g, ' ')} variant={getBadgeVariant(requestItem.status)} />
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Requested term</Text>
                    <Text style={styles.metaValue}>{requestItem.requested_duration_months} months</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Requested interest</Text>
                    <Text style={styles.metaValue}>{requestItem.requested_interest_rate || loan?.interest_rate || 'Unchanged'}%</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Current outstanding</Text>
                    <Text style={styles.metaValue}>{loan ? formatCurrency(loan.total_due || '0', currentCurrency) : '-'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Submitted</Text>
                    <Text style={styles.metaValue}>{formatDate(requestItem.created_at)}</Text>
                  </View>

                  {requestItem.reason ? (
                    <View style={styles.reasonCard}>
                      <Text style={styles.reasonTitle}>Reason</Text>
                      <Text style={styles.reasonText}>{requestItem.reason}</Text>
                    </View>
                  ) : null}

                  {requestItem.review_note ? (
                    <View style={styles.reasonCard}>
                      <Text style={styles.reasonTitle}>Review note</Text>
                      <Text style={styles.reasonText}>{requestItem.review_note}</Text>
                    </View>
                  ) : null}

                  <View style={styles.actionsRow}>
                    {loan ? (
                      <Button title="Open Loan" variant="outline" onPress={() => navigation.navigate('LoanDetail', { loanId: loan.id, chamaId })} />
                    ) : null}
                    {canReviewRestructures && requestItem.status === 'requested' ? (
                      <>
                        <Button title="Approve" onPress={() => confirmReview(requestItem, 'approved')} loading={actingId === requestItem.id} />
                        <Button title="Reject" variant="ghost" onPress={() => confirmReview(requestItem, 'rejected')} />
                      </>
                    ) : null}
                  </View>
                </Card>
              );
            })
          ) : (
            <EmptyState
              icon={<Icon name="source-branch-check" size={50} color={colors.neutral[400]} />}
              title="No restructure requests in this view"
              description="Requested term changes will appear here for review."
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
    flexBasis: '31%',
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
  reasonCard: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  reasonTitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[600],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  reasonText: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    lineHeight: 20,
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

export default LoanRestructureQueueScreen;
