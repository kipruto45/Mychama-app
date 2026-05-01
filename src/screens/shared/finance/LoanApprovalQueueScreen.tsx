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
import { LoanApplication, LoanReports } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'LoanApprovalQueue'>;
type RoutePropType = RouteProp<MainStackParamList, 'LoanApprovalQueue'>;

type FilterKey = 'all' | 'submitted' | 'treasurer_approved' | 'committee_approved' | 'approved' | 'rejected';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'treasurer_approved', label: 'Treasurer' },
  { key: 'committee_approved', label: 'Committee' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const getBadgeVariant = (status: LoanApplication['status']) => {
  switch (status) {
    case 'approved':
    case 'disbursed':
      return 'success';
    case 'rejected':
    case 'cancelled':
      return 'error';
    case 'committee_approved':
    case 'treasurer_approved':
      return 'info';
    default:
      return 'warning';
  }
};

export const LoanApprovalQueueScreen: React.FC = () => {
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
  const canApproveLoan = useCanPerformAction(Permission.CAN_APPROVE_LOAN, chamaId);
  const canDisburseLoan = useCanPerformAction(Permission.CAN_DISBURSE_LOAN, chamaId);
  const currentCurrency = availableChamas.find((item) => item.id === chamaId)?.currency || 'KES';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>(route.params?.filter || 'all');
  const [applications, setApplications] = useState<LoanApplication[]>([]);
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
      const [applicationRows, reports] = await Promise.all([
        financeService.getLoanApplications(chamaId),
        financeService.getLoanReports(chamaId).catch(() => null),
      ]);
      setApplications(applicationRows);
      setLoanReports(reports);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setApplications([]);
      setLoanReports(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    if (filter === 'all') {
      return applications;
    }
    return applications.filter((application) => application.status === filter);
  }, [applications, filter]);

  const summary = useMemo(() => {
    const portfolio = (loanReports?.portfolio as Record<string, unknown> | undefined) || {};
    return {
      pending: applications.filter((application) =>
        ['submitted', 'in_review', 'treasurer_approved', 'committee_approved'].includes(application.status)
      ).length,
      approved: applications.filter((application) => application.status === 'approved').length,
      disbursed: applications.filter((application) => application.status === 'disbursed').length,
      liquidityRisk: formatCurrency(String(portfolio.total_outstanding || '0'), currentCurrency),
    };
  }, [applications, currentCurrency, loanReports]);

  const withReload = async (handler: () => Promise<void>) => {
    try {
      await handler();
      await loadQueue();
    } catch (actionError) {
      Alert.alert('Loan approvals', getErrorMessage(actionError));
    } finally {
      setActingId(null);
    }
  };

  const confirmAction = (title: string, message: string, onConfirm: () => Promise<void>) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', onPress: () => void onConfirm() },
    ]);
  };

  const handlePrimaryAction = (application: LoanApplication) => {
    if (!chamaId) {
      return;
    }

    if (application.status === 'submitted' || application.status === 'in_review') {
      confirmAction('Treasurer review', 'Approve this application into the next review stage?', async () => {
        setActingId(application.id);
        await withReload(() =>
          financeService.reviewLoanApplication(chamaId, application.id, { decision: 'approved' }).then(() => undefined)
        );
      });
      return;
    }

    if (application.status === 'treasurer_approved') {
      confirmAction('Committee approval', 'Record committee approval for this application?', async () => {
        setActingId(application.id);
        await withReload(() =>
          financeService.committeeApproveLoanApplication(chamaId, application.id, { decision: 'approved' }).then(() => undefined)
        );
      });
      return;
    }

    if (application.status === 'committee_approved') {
      confirmAction('Final approval', 'Move this application into approved status?', async () => {
        setActingId(application.id);
        await withReload(() =>
          financeService.approveLoanApplication(chamaId, application.id).then(() => undefined)
        );
      });
      return;
    }

    if (application.status === 'approved' && canDisburseLoan) {
      confirmAction('Disburse loan', 'Create the funded loan and post the disbursement now?', async () => {
        setActingId(application.id);
        await withReload(() =>
          financeService.disburseLoanApplication(chamaId, application.id, {
            disbursement_reference: `APP-DISB-${Date.now()}`,
            idempotency_key: `app-disbursement-${application.id}-${Date.now()}`,
          }).then(() => undefined)
        );
      });
    }
  };

  const handleReject = (application: LoanApplication) => {
    if (!chamaId) {
      return;
    }

    confirmAction('Reject application', 'Reject this application and notify the borrower?', async () => {
      setActingId(application.id);

      if (application.status === 'submitted' || application.status === 'in_review') {
        await withReload(() =>
          financeService.reviewLoanApplication(chamaId, application.id, { decision: 'rejected' }).then(() => undefined)
        );
        return;
      }

      if (application.status === 'treasurer_approved') {
        await withReload(() =>
          financeService.committeeApproveLoanApplication(chamaId, application.id, { decision: 'rejected' }).then(() => undefined)
        );
        return;
      }

      await withReload(() => financeService.rejectLoanApplication(chamaId, application.id).then(() => undefined));
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  };

  const renderApplicationCard = (application: LoanApplication) => {
    const pendingGuarantors = application.guarantors.filter((item) => item.status === 'proposed').length;
    const showPrimaryAction =
      canApproveLoan &&
      ['submitted', 'in_review', 'treasurer_approved', 'committee_approved', 'approved'].includes(application.status) &&
      !(application.status === 'approved' && !canDisburseLoan);

    const primaryTitle =
      application.status === 'treasurer_approved'
        ? 'Committee Approve'
        : application.status === 'committee_approved'
        ? 'Final Approve'
        : application.status === 'approved'
        ? 'Disburse'
        : 'Review';

    return (
      <Card key={application.id} style={styles.card}>
        <View style={styles.inlineBetween}>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>{application.member.full_name}</Text>
            <Text style={styles.cardSubtitle}>
              {application.loan_product.name} • {application.requested_term_months} months
            </Text>
          </View>
          <Badge label={application.status.replace(/_/g, ' ')} variant={getBadgeVariant(application.status)} />
        </View>

        <Text style={styles.amountText}>{formatCurrency(application.requested_amount, currentCurrency)}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Submitted</Text>
          <Text style={styles.metaValue}>{formatDate(application.submitted_at)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Eligibility</Text>
          <Text style={styles.metaValue}>
            {application.eligibility_status} • Max {formatCurrency(application.recommended_max_amount || '0', currentCurrency)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Guarantors</Text>
          <Text style={styles.metaValue}>
            {application.guarantors.length ? `${pendingGuarantors} pending of ${application.guarantors.length}` : 'Not required'}
          </Text>
        </View>

        {application.rejection_reason ? (
          <View style={styles.alertStrip}>
            <Icon name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={styles.alertText}>{application.rejection_reason}</Text>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          {application.created_loan ? (
            <Button
              title="Open Loan"
              variant="outline"
              onPress={() => navigation.navigate('LoanDetail', { loanId: application.created_loan as string, chamaId })}
            />
          ) : null}
          {showPrimaryAction ? (
            <Button title={primaryTitle} onPress={() => handlePrimaryAction(application)} loading={actingId === application.id} />
          ) : null}
          {canApproveLoan &&
          ['submitted', 'in_review', 'treasurer_approved', 'committee_approved', 'approved'].includes(application.status) ? (
            <Button title="Reject" variant="ghost" onPress={() => handleReject(application)} />
          ) : null}
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerTitle}>Loading approval queue</Text>
          <Text style={styles.centerText}>Pulling pending reviews, guarantor progress, and ready-to-disburse requests.</Text>
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
          <Text style={styles.title}>Loan Approval Queue</Text>
          <Text style={styles.subtitle}>Review applications, move decisions forward, and disburse approved loans.</Text>
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
          title="Approval queue unavailable"
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
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={styles.summaryValue}>{summary.pending}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Approved</Text>
              <Text style={styles.summaryValue}>{summary.approved}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Disbursed</Text>
              <Text style={styles.summaryValue}>{summary.disbursed}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Outstanding</Text>
              <Text style={styles.summaryValueSmall}>{summary.liquidityRisk}</Text>
            </Card>
          </View>

          <Card style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Control Center</Text>
            <Text style={styles.heroTitle}>Move each loan request through review, approval, and funding</Text>
            <Text style={styles.heroText}>
              Use this queue for decision-making. Recovery, overdue follow-up, and restructure reviews are separated into their own admin workspaces.
            </Text>
            <View style={styles.heroActions}>
              <Button title="Recovery Queue" variant="outline" onPress={() => navigation.navigate('LoanRecoveryQueue', { chamaId })} />
              <Button title="Restructure Review" variant="outline" onPress={() => navigation.navigate('LoanRestructureQueue', { chamaId })} />
            </View>
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

          {filteredApplications.length ? (
            filteredApplications.map(renderApplicationCard)
          ) : (
            <EmptyState
              icon={<Icon name="clipboard-check-outline" size={50} color={colors.neutral[400]} />}
              title="No applications in this queue"
              description="Applications that match this stage will appear here."
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
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
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
  alertStrip: {
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    flexDirection: 'row',
    gap: spacing[2],
  },
  alertText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
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

export default LoanApprovalQueueScreen;
