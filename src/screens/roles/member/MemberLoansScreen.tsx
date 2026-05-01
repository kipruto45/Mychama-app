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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import {
  memberLoanService,
  type MemberLoanWorkspace,
} from '@/services/memberLoanService';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import {
  formatLoanPurposeLabel,
  getLoanApplicationMeta,
  getLoanEligibilityMeta,
  getLoanStateMeta,
  getLoanStatusTone,
} from './loanWorkflowShared';
import {
  buildLoanRepaymentResumeParams,
  buildPendingLoanRepaymentParams,
  hasRestorableLoanRepaymentDraft,
} from './memberLoanRepaymentWorkflowShared';

type MemberLoansNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MemberLoans'>;

type LoanAlert = {
  id: string;
  title: string;
  message: string;
  tone: 'success' | 'warning' | 'error' | 'info';
  icon: string;
  actionLabel?: string;
  onPress?: () => void;
};

const formatDisplayDate = (value?: string | null) => (value ? formatDate(value) : 'Not available');

const isDueLikeInstallment = (status?: string | null) =>
  ['due', 'upcoming', 'overdue', 'partial', 'partially_paid'].includes(
    String(status || '').toLowerCase()
  );

const getInstallmentStatusLabel = (status?: string | null) => {
  const lowered = String(status || '').toLowerCase();
  if (lowered === 'paid') return 'Paid';
  if (lowered === 'overdue') return 'Overdue';
  if (lowered === 'due') return 'Due now';
  if (lowered === 'partial' || lowered === 'partially_paid') return 'Partly paid';
  return 'Upcoming';
};

const getToneColor = (tone: LoanAlert['tone']) => {
  if (tone === 'success') return colors.success;
  if (tone === 'warning') return colors.warning;
  if (tone === 'error') return colors.error;
  return colors.info;
};

export const MemberLoansScreen: React.FC = () => {
  const navigation = useNavigation<MemberLoansNavigationProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const {
    activeApplication,
    clearActiveApplication,
    draft,
    lastVisitedRoute,
    pendingRepaymentIntentId,
    repaymentDraft,
    setActiveApplication,
    setLastVisitedRoute,
  } = useMemberLoanFlowStore();

  const [workspace, setWorkspace] = useState<MemberLoanWorkspace | null>(null);
  const [schedulePreview, setSchedulePreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = workspace?.summary.currency || activeChama?.currency || 'KES';

  const syncPendingState = useCallback(
    (data: MemberLoanWorkspace) => {
      if (data.active_application && activeChamaId) {
        setActiveApplication({
          applicationId: data.active_application.id,
          chamaId: activeChamaId,
          amount: data.active_application.amount,
          status: data.active_application.status,
          reference: data.active_application.reference,
          submittedAt: data.active_application.submitted_at || data.server_time,
          createdLoanId: data.active_application.created_loan_id,
        });
        return;
      }

      clearActiveApplication();
    },
    [activeChamaId, clearActiveApplication, setActiveApplication]
  );

  const loadWorkspace = useCallback(
    async (showRefresh = false) => {
      if (!activeChamaId) {
        setWorkspace(null);
        setSchedulePreview([]);
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
        const response = await memberLoanService.getWorkspace(activeChamaId);
        const nextSchedule = response.active_loan?.id
          ? await memberLoanService.getRepaymentSchedule(response.active_loan.id).catch(() => [])
          : [];

        setWorkspace(response);
        setSchedulePreview(nextSchedule);
        setError(null);
        syncPendingState(response);
      } catch (serviceError) {
        const message =
          typeof serviceError === 'object' && serviceError && 'message' in serviceError
            ? String((serviceError as { message?: string }).message || '')
            : '';
        setError(message || 'We couldn’t load your loan details right now. Please try again.');
        setWorkspace(null);
        setSchedulePreview([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeChamaId, syncPendingState]
  );

  useEffect(() => {
    setLastVisitedRoute('MemberLoans');
    void loadWorkspace();
  }, [loadWorkspace, setLastVisitedRoute]);

  const eligibilityMeta = getLoanEligibilityMeta(
    workspace?.eligibility.state || workspace?.summary.eligibility_status || 'unknown_loading'
  );
  const activeLoanMeta = getLoanStateMeta(workspace?.summary.loan_state || 'no_active_loan');
  const pendingApplication = workspace?.active_application || null;
  const pendingApplicationMeta = pendingApplication
    ? getLoanApplicationMeta(pendingApplication.state)
    : activeApplication
    ? getLoanApplicationMeta('submitted_pending_review')
    : null;
  const rejectedApplication = workspace?.latest_rejected_application || null;
  const rejectedApplicationMeta = rejectedApplication
    ? getLoanApplicationMeta(rejectedApplication.state)
    : null;
  const activeLoan = workspace?.active_loan || null;

  const restorableDraft = useMemo(() => {
    if (!draft?.chamaId || draft.chamaId !== activeChamaId) {
      return null;
    }
    if (!draft.amount || !draft.durationMonths || !draft.purpose) {
      return null;
    }
    return draft;
  }, [activeChamaId, draft]);

  const repaymentMetrics = useMemo(() => {
    if (!activeLoan) {
      return {
        progressPercent: 0,
        completedCount: 0,
        remainingCount: 0,
        nextInstallment: null as any | null,
        overdueCount: 0,
      };
    }

    const progressPercent = Math.max(0, Math.min(100, activeLoan.progress_percent || 0));
    const nextInstallment =
      schedulePreview.find((item) => item.status !== 'paid') || activeLoan.next_installment || null;
    const overdueCount = schedulePreview.filter((item) =>
      String(item.status || '').toLowerCase() === 'overdue'
    ).length;

    if (!schedulePreview.length) {
      const estimatedCompleted = Math.max(
        0,
        Math.min(activeLoan.duration_months, Math.round((progressPercent / 100) * activeLoan.duration_months))
      );
      return {
        progressPercent,
        completedCount: estimatedCompleted,
        remainingCount: Math.max(activeLoan.duration_months - estimatedCompleted, 0),
        nextInstallment,
        overdueCount,
      };
    }

    const completedCount = schedulePreview.filter((item) => item.status === 'paid').length;
    return {
      progressPercent,
      completedCount,
      remainingCount: Math.max(schedulePreview.length - completedCount, 0),
      nextInstallment,
      overdueCount,
    };
  }, [activeLoan, schedulePreview]);

  const primaryAction = useMemo(() => {
    if (pendingApplication) {
      return {
        title: 'View Pending Request',
        helper: 'Your request is still under review. Open the details to track updates and reference number.',
        onPress: () =>
          navigation.navigate('LoanApplicationDetails', {
            applicationId: pendingApplication.id,
            chamaId: activeChamaId || undefined,
          }),
      };
    }

    if (activeLoan && repaymentMetrics.nextInstallment && isDueLikeInstallment(repaymentMetrics.nextInstallment.status)) {
      return {
        title: 'Repay Loan',
        helper: `Next installment ${formatCurrency(repaymentMetrics.nextInstallment.expected_amount, currency)} is ${getInstallmentStatusLabel(repaymentMetrics.nextInstallment.status).toLowerCase()}.`,
        onPress: () =>
          navigation.navigate('LoanRepayment', {
            chamaId: activeChamaId || undefined,
            loanId: activeLoan.id,
            installmentId: repaymentMetrics.nextInstallment?.id,
            amount:
              repaymentMetrics.nextInstallment?.expected_amount ||
              activeLoan.outstanding_balance ||
              activeLoan.outstanding_principal,
            dueDate:
              repaymentMetrics.nextInstallment?.due_date || activeLoan.due_date || undefined,
            targetLabel: repaymentMetrics.nextInstallment
              ? `Installment due ${formatDisplayDate(repaymentMetrics.nextInstallment.due_date)}`
              : 'Active loan repayment',
            entryPoint: 'loans',
          }),
      };
    }

    if (activeLoan) {
      return {
        title: 'View Active Loan',
        helper: 'Open your loan balance, repayment progress, and full repayment schedule.',
        onPress: () =>
          navigation.navigate('LoanDetail', {
            loanId: activeLoan.id,
            chamaId: activeChamaId || undefined,
          }),
      };
    }

    if (workspace?.loan_rules.can_start_application && workspace.eligibility.state === 'eligible') {
      return {
        title: 'Request Loan',
        helper: `You can request up to ${formatCurrency(workspace.eligibility.max_eligible_amount || '0', currency)} right now.`,
        onPress: () => navigation.navigate('RequestLoan', { chamaId: activeChamaId || undefined }),
      };
    }

    return {
      title: 'View Eligibility Details',
      helper: 'Check what affects your current loan limit and how to improve your standing.',
      onPress: () => navigation.navigate('LoanEligibility', { chamaId: activeChamaId || undefined }),
    };
  }, [
    activeChamaId,
    activeLoan,
    currency,
    navigation,
    pendingApplication,
    repaymentMetrics.nextInstallment,
    workspace,
  ]);

  const handleResumeFlow = useCallback(() => {
    if (!restorableDraft?.chamaId) {
      return;
    }

    if (lastVisitedRoute === 'LoanReviewConfirm') {
      navigation.navigate('LoanReviewConfirm', { chamaId: restorableDraft.chamaId });
      return;
    }

    navigation.navigate('RequestLoan', { chamaId: restorableDraft.chamaId });
  }, [lastVisitedRoute, navigation, restorableDraft?.chamaId]);

  const handleResumeRepaymentFlow = useCallback(() => {
    const resumeParams = buildLoanRepaymentResumeParams({
      draft:
        hasRestorableLoanRepaymentDraft(repaymentDraft, activeChamaId) &&
        repaymentDraft?.loanId
          ? repaymentDraft
          : null,
      fallbackLoanId: activeLoan?.id,
      fallbackChamaId: activeChamaId,
      fallbackEntryPoint: 'loans',
    });

    if (!resumeParams) {
      return;
    }

    navigation.navigate('LoanRepayment', resumeParams);
  }, [activeChamaId, activeLoan?.id, navigation, repaymentDraft]);

  const alerts = useMemo<LoanAlert[]>(() => {
    const items: LoanAlert[] = [];

    if (pendingApplication && pendingApplicationMeta) {
      items.push({
        id: 'pending-application',
        title: 'Application under review',
        message: `Reference ${pendingApplication.reference} submitted ${formatDisplayDate(pendingApplication.submitted_at)}.`,
        tone: pendingApplicationMeta.tone,
        icon: pendingApplicationMeta.icon,
        actionLabel: 'View Request',
        onPress: () =>
          navigation.navigate('LoanApplicationDetails', {
            applicationId: pendingApplication.id,
            chamaId: activeChamaId || undefined,
          }),
      });
    }

    if (activeLoan && repaymentMetrics.overdueCount > 0) {
      items.push({
        id: 'overdue-installment',
        title: 'Repayment overdue',
        message: `${repaymentMetrics.overdueCount} installment${repaymentMetrics.overdueCount === 1 ? '' : 's'} need attention.`,
        tone: 'error',
        icon: 'alert-circle-outline',
        actionLabel: 'View Schedule',
        onPress: () =>
          navigation.navigate('OverdueRepayment', {
            loanId: activeLoan.id,
            chamaId: activeChamaId || undefined,
          }),
      });
    } else if (activeLoan && repaymentMetrics.nextInstallment) {
      items.push({
        id: 'next-repayment',
        title: 'Next repayment is ready',
        message: `${formatCurrency(repaymentMetrics.nextInstallment.expected_amount, currency)} due ${formatDisplayDate(repaymentMetrics.nextInstallment.due_date)}.`,
        tone: String(repaymentMetrics.nextInstallment.status || '').toLowerCase() === 'overdue' ? 'error' : 'warning',
        icon: 'calendar-clock-outline',
        actionLabel: 'Repay',
        onPress: primaryAction.onPress,
      });
    }

    if (rejectedApplication && rejectedApplicationMeta) {
      items.push({
        id: 'rejected-request',
        title: 'A request result is ready',
        message: 'Your last application was not approved. Review the guidance before trying again.',
        tone: rejectedApplicationMeta.tone,
        icon: rejectedApplicationMeta.icon,
        actionLabel: 'View Result',
        onPress: () =>
          navigation.navigate('RejectedApplicationState', {
            applicationId: rejectedApplication.id,
            chamaId: activeChamaId || undefined,
          }),
      });
    }

    if (restorableDraft) {
      items.push({
        id: 'draft-request',
        title: 'Resume your draft request',
        message: `${formatCurrency(restorableDraft.amount || '0', currency)} over ${restorableDraft.durationMonths} months is still saved on this device.`,
        tone: 'info',
        icon: 'file-document-edit-outline',
        actionLabel: 'Continue',
        onPress: handleResumeFlow,
      });
    }

    if (activeLoan && pendingRepaymentIntentId) {
      const pendingRepaymentParams = buildPendingLoanRepaymentParams({
        intentId: pendingRepaymentIntentId,
        chamaId: activeChamaId || undefined,
        loanId: activeLoan.id,
        installmentId:
          repaymentDraft?.installmentId ||
          repaymentMetrics.nextInstallment?.id ||
          undefined,
        amount:
          repaymentDraft?.amount ||
          repaymentMetrics.nextInstallment?.expected_amount ||
          activeLoan.outstanding_balance ||
          activeLoan.outstanding_principal,
        currency,
        targetLabel:
          repaymentDraft?.targetLabel ||
          (repaymentMetrics.nextInstallment
            ? `Installment due ${formatDisplayDate(repaymentMetrics.nextInstallment.due_date)}`
            : 'Active loan repayment'),
        paymentMethod: repaymentDraft?.paymentMethod || 'mpesa',
      });

      if (pendingRepaymentParams) {
        items.push({
          id: 'pending-repayment',
          title: 'Repayment still processing',
          message: 'Your last loan repayment is still being confirmed. Open it to refresh the latest status.',
          tone: 'warning',
          icon: 'progress-clock',
          actionLabel: 'Track',
          onPress: () => navigation.navigate('PendingPaymentDetail', pendingRepaymentParams),
        });
      }
    }

    if (!pendingRepaymentIntentId && hasRestorableLoanRepaymentDraft(repaymentDraft, activeChamaId)) {
      items.push({
        id: 'repayment-draft',
        title: 'Resume your repayment draft',
        message: `Your repayment amount of ${formatCurrency(repaymentDraft?.amount || '0', currency)} is still saved on this device.`,
        tone: 'info',
        icon: 'cash-clock',
        actionLabel: 'Continue',
        onPress: handleResumeRepaymentFlow,
      });
    }

    return items.slice(0, 4);
  }, [
    activeChamaId,
    activeLoan,
    currency,
    handleResumeFlow,
    handleResumeRepaymentFlow,
    navigation,
    pendingApplication,
    pendingApplicationMeta,
    pendingRepaymentIntentId,
    primaryAction.onPress,
    rejectedApplication,
    rejectedApplicationMeta,
    repaymentDraft?.amount,
    repaymentDraft?.installmentId,
    repaymentDraft?.paymentMethod,
    repaymentDraft?.targetLabel,
    repaymentMetrics.nextInstallment,
    repaymentMetrics.overdueCount,
    restorableDraft,
  ]);

  const noLoanActivityYet =
    !activeLoan &&
    !pendingApplication &&
    !rejectedApplication &&
    !workspace?.history_preview.length;

  const loanCompletionState = useMemo(() => {
    if (!workspace?.summary || !activeLoan) {
      return { isCompleted: false, completionDate: null as string | null };
    }

    const isCompleted =
      workspace.summary.loan_state === 'completed' ||
      ['paid', 'cleared', 'closed'].includes(String(activeLoan.status || '').toLowerCase()) ||
      Number(activeLoan.outstanding_balance || activeLoan.outstanding_principal || 0) <= 0;

    const completionDate = activeLoan.due_date || null;
    return { isCompleted, completionDate };
  }, [activeLoan, workspace]);

  const eligibilityReason = useMemo(() => {
    if (!workspace?.eligibility) {
      return '';
    }

    if (workspace.eligibility.reasons.length) {
      return workspace.eligibility.reasons[0] || '';
    }

    if (workspace.eligibility.state === 'eligible') {
      return 'Based on your contribution history and current standing.';
    }

    return 'Check the full eligibility details for guidance on how to improve your position.';
  }, [workspace]);

  const durationSummary = useMemo(() => {
    const product = workspace?.loan_rules.default_product || workspace?.loan_rules.available_products[0];
    if (!product) {
      return 'Repayment duration is available once loan products are loaded.';
    }

    return `${product.min_duration_months}-${product.max_duration_months} months available on ${product.name}.`;
  }, [workspace]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Loans" subtitle={activeChama?.name} showBack={navigation.canGoBack()} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerStateText}>Loading your loan workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeChamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Loans" subtitle="Choose a chama" showBack={navigation.canGoBack()} />
        <EmptyState
          title="No chama selected"
          description="Open a chama workspace first so we can show your eligibility, loan requests, and repayment details."
          icon="people-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Loans" subtitle={activeChama?.name} showBack={navigation.canGoBack()} />
        <EmptyState
          title="Unable to load loans"
          description={error}
          icon="alert-circle-outline"
          style={styles.centerState}
          action={{ label: 'Try again', onPress: () => void loadWorkspace() }}
        />
      </SafeAreaView>
    );
  }

  if (!workspace) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Loans" subtitle={activeChama?.name} showBack={navigation.canGoBack()} />
        <EmptyState
          title="Loan workspace unavailable"
          description="We couldn’t prepare your loan workspace right now. Please try again."
          icon="cash-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Loans" subtitle={activeChama?.name} showBack={navigation.canGoBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadWorkspace(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Member loan hub</Text>
              <Text style={styles.heroTitle}>Check your loan position at a glance.</Text>
              <Text style={styles.heroText}>
                See your eligibility, current request or active loan status, and the next safe step before you continue.
              </Text>
            </View>
            <View style={[styles.heroBadgeWrap, { backgroundColor: `${eligibilityMeta.accent}18` }]}>
              <Icon name={eligibilityMeta.icon as any} size={26} color={eligibilityMeta.accent} />
            </View>
          </View>

          <Card style={styles.primaryActionCard}>
            <View style={styles.primaryActionCopy}>
              <Text style={styles.primaryActionTitle}>{primaryAction.title}</Text>
              <Text style={styles.primaryActionText}>{primaryAction.helper}</Text>
            </View>
            <Button title={primaryAction.title} onPress={primaryAction.onPress} />
          </Card>
        </Card>

        {loanCompletionState.isCompleted ? (
          <Card style={styles.loanClearedCard}>
            <View style={styles.loanClearedHeader}>
              <View style={styles.loanClearedIconWrap}>
                <Icon name="check-circle" size={22} color={colors.success} />
              </View>
              <View style={styles.loanClearedCopy}>
                <Text style={styles.loanClearedTitle}>Loan fully cleared</Text>
                <Text style={styles.loanClearedText}>
                  Great work. This loan is closed and your repayment obligation is complete
                  {loanCompletionState.completionDate
                    ? ` as of ${formatDisplayDate(loanCompletionState.completionDate)}.`
                    : '.'}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        <View style={styles.summaryGrid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Eligibility Status</Text>
            <Text style={styles.metricValue}>{eligibilityMeta.label}</Text>
            <Badge label={eligibilityMeta.label} variant={eligibilityMeta.tone} size="sm" />
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Max Eligible Amount</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(workspace.summary.max_eligible_amount || '0', currency)}
            </Text>
            <Text style={styles.metricMeta}>Current available limit</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active Loan Balance</Text>
            <Text style={styles.metricValue}>
              {activeLoan
                ? formatCurrency(workspace.summary.active_loan_balance || '0', currency)
                : 'No Active Loan'}
            </Text>
            <Text style={styles.metricMeta}>{activeLoan ? activeLoanMeta.label : 'No approved loan is running right now'}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Next Repayment Due</Text>
            <Text style={styles.metricValue}>
              {pendingApplication
                ? 'Application Under Review'
                : activeLoan
                ? formatDisplayDate(workspace.summary.next_repayment_due)
                : 'No repayment due'}
            </Text>
            <Text style={styles.metricMeta}>
              {activeLoan
                ? formatCurrency(workspace.summary.next_repayment_amount || '0', currency)
                : pendingApplication
                ? 'We will notify you when the review is complete.'
                : 'Nothing is due yet.'}
            </Text>
          </Card>
        </View>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Eligibility</Text>
            <Badge label={eligibilityMeta.label} variant={eligibilityMeta.tone} size="sm" />
          </View>
          <Text style={styles.sectionAmount}>
            {formatCurrency(workspace.eligibility.max_eligible_amount || '0', currency)}
          </Text>
          <Text style={styles.sectionText}>{eligibilityReason}</Text>
          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contribution-based basis</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(workspace.eligibility.contribution_based_limit || '0', currency)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contribution standing</Text>
              <Text style={styles.detailValue}>
                {workspace.eligibility.current_financial_standing.contribution_compliance_percent || '0'}%
              </Text>
            </View>
          </View>
          <Button
            title={
              workspace.loan_rules.can_start_application && workspace.eligibility.state === 'eligible'
                ? 'Request Loan'
                : 'View Eligibility Details'
            }
            onPress={() =>
              workspace.loan_rules.can_start_application && workspace.eligibility.state === 'eligible'
                ? navigation.navigate('RequestLoan', { chamaId: activeChamaId || undefined })
                : navigation.navigate('LoanEligibility', { chamaId: activeChamaId || undefined })
            }
          />
        </Card>

        <Card style={styles.sectionCard}>
          {pendingApplication && pendingApplicationMeta ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pending Request</Text>
                <Badge label={pendingApplicationMeta.label} variant={pendingApplicationMeta.tone} size="sm" />
              </View>
              <Text style={styles.sectionAmount}>
                {formatCurrency(pendingApplication.amount, currency)}
              </Text>
              <Text style={styles.sectionText}>
                Submitted {formatDisplayDate(pendingApplication.submitted_at)}. We will notify you once the review is complete.
              </Text>
              <View style={styles.detailList}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Request reference</Text>
                  <Text style={styles.detailValue}>{pendingApplication.reference}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{pendingApplication.duration_months} months</Text>
                </View>
              </View>
              <Button
                title="View Request Details"
                onPress={() =>
                  navigation.navigate('LoanApplicationDetails', {
                    applicationId: pendingApplication.id,
                    chamaId: activeChamaId || undefined,
                  })
                }
              />
            </>
          ) : activeLoan ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Loan</Text>
                <Badge label={activeLoanMeta.label} variant={activeLoanMeta.tone} size="sm" />
              </View>
              <Text style={styles.sectionAmount}>
                {formatCurrency(activeLoan.outstanding_balance || activeLoan.outstanding_principal, currency)}
              </Text>
              <Text style={styles.sectionText}>
                Outstanding balance for {formatLoanPurposeLabel(activeLoan.purpose)}.
              </Text>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${repaymentMetrics.progressPercent}%` }]} />
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.progressMeta}>Repayment progress</Text>
                <Text style={styles.progressMeta}>{repaymentMetrics.progressPercent}% repaid</Text>
              </View>

              <View style={styles.detailList}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Approved / disbursed amount</Text>
                  <Text style={styles.detailValue}>{formatCurrency(activeLoan.amount, currency)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Next repayment due</Text>
                  <Text style={styles.detailValue}>
                    {repaymentMetrics.nextInstallment
                      ? `${formatCurrency(repaymentMetrics.nextInstallment.expected_amount, currency)} • ${formatDisplayDate(repaymentMetrics.nextInstallment.due_date)}`
                      : 'No installment due right now'}
                  </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Button
                  title="View Loan Details"
                  onPress={() =>
                    navigation.navigate('LoanDetail', {
                      loanId: activeLoan.id,
                      chamaId: activeChamaId || undefined,
                    })
                  }
                  style={styles.flexButton}
                />
                <Button
                  title="Repay Loan"
                  variant="outline"
                  onPress={() =>
                    navigation.navigate('LoanRepayment', {
                      loanId: activeLoan.id,
                      chamaId: activeChamaId || undefined,
                      installmentId: repaymentMetrics.nextInstallment?.id,
                      amount:
                        repaymentMetrics.nextInstallment?.expected_amount ||
                        activeLoan.outstanding_balance ||
                        activeLoan.outstanding_principal,
                      dueDate:
                        repaymentMetrics.nextInstallment?.due_date || activeLoan.due_date || undefined,
                      targetLabel: repaymentMetrics.nextInstallment
                        ? `Installment due ${formatDisplayDate(repaymentMetrics.nextInstallment.due_date)}`
                        : 'Active loan repayment',
                      entryPoint: 'loans',
                    })
                  }
                  style={styles.flexButton}
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('LoanRepaymentHistory', {
                    loanId: activeLoan.id,
                    chamaId: activeChamaId || undefined,
                  })
                }
              >
                <Text style={styles.sectionLink}>View repayment history</Text>
              </TouchableOpacity>
            </>
          ) : rejectedApplication && rejectedApplicationMeta ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Latest Request</Text>
                <Badge label={rejectedApplicationMeta.label} variant={rejectedApplicationMeta.tone} size="sm" />
              </View>
              <Text style={styles.sectionAmount}>
                {formatCurrency(rejectedApplication.amount, currency)}
              </Text>
              <Text style={styles.sectionText}>
                This request was not approved. Review the result to understand the next step before applying again.
              </Text>
              <View style={styles.detailList}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Submitted</Text>
                  <Text style={styles.detailValue}>{formatDisplayDate(rejectedApplication.submitted_at)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference</Text>
                  <Text style={styles.detailValue}>{rejectedApplication.reference}</Text>
                </View>
              </View>
              <Button
                title="View Request Result"
                onPress={() =>
                  navigation.navigate('RejectedApplicationState', {
                    applicationId: rejectedApplication.id,
                    chamaId: activeChamaId || undefined,
                  })
                }
              />
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>{workspace.empty_state.title || 'No Active Loan'}</Text>
              <Text style={styles.sectionText}>{workspace.empty_state.description}</Text>
              <Button
                title="Request Loan"
                onPress={() =>
                  workspace.loan_rules.can_start_application && workspace.eligibility.state === 'eligible'
                    ? navigation.navigate('RequestLoan', { chamaId: activeChamaId || undefined })
                    : navigation.navigate('LoanEligibility', { chamaId: activeChamaId || undefined })
                }
              />
            </>
          )}
        </Card>

        {activeLoan ? (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Repayment Preview</Text>
              {repaymentMetrics.nextInstallment ? (
                <Badge
                  label={getInstallmentStatusLabel(repaymentMetrics.nextInstallment.status)}
                  variant={getLoanStatusTone(repaymentMetrics.nextInstallment.status)}
                  size="sm"
                />
              ) : null}
            </View>
            <View style={styles.detailList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next installment amount</Text>
                <Text style={styles.detailValue}>
                  {repaymentMetrics.nextInstallment
                    ? formatCurrency(repaymentMetrics.nextInstallment.expected_amount, currency)
                    : 'No repayment due'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Due date</Text>
                <Text style={styles.detailValue}>
                  {repaymentMetrics.nextInstallment
                    ? formatDisplayDate(repaymentMetrics.nextInstallment.due_date)
                    : 'Not available'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Installments paid vs remaining</Text>
                <Text style={styles.detailValue}>
                  {repaymentMetrics.completedCount} paid • {repaymentMetrics.remainingCount} remaining
                </Text>
              </View>
            </View>
            <Button
              title="View Schedule"
              variant="outline"
              onPress={() =>
                navigation.navigate('RepaymentSchedule', {
                  loanId: activeLoan.id,
                  chamaId: activeChamaId || undefined,
                })
              }
            />
            <Button
              title="Repay Now"
              onPress={() =>
                navigation.navigate('LoanRepayment', {
                  loanId: activeLoan.id,
                  chamaId: activeChamaId || undefined,
                  installmentId: repaymentMetrics.nextInstallment?.id,
                  amount:
                    repaymentMetrics.nextInstallment?.expected_amount ||
                    activeLoan.outstanding_balance ||
                    activeLoan.outstanding_principal,
                  dueDate:
                    repaymentMetrics.nextInstallment?.due_date || activeLoan.due_date || undefined,
                  targetLabel: repaymentMetrics.nextInstallment
                    ? `Installment due ${formatDisplayDate(repaymentMetrics.nextInstallment.due_date)}`
                    : 'Active loan repayment',
                  entryPoint: 'loans',
                })
              }
            />
            <Button
              title="Repayment History"
              variant="ghost"
              onPress={() =>
                navigation.navigate('LoanRepaymentHistory', {
                  loanId: activeLoan.id,
                  chamaId: activeChamaId || undefined,
                })
              }
            />
          </Card>
        ) : null}

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Info</Text>
            {workspace.loan_rules.default_product ? (
              <Badge label={workspace.loan_rules.default_product.name} variant="info" size="sm" />
            ) : null}
          </View>
          <View style={styles.ruleList}>
            <View style={styles.ruleRow}>
              <Icon name="calendar-range" size={16} color={colors.primary[500]} />
              <Text style={styles.ruleText}>{durationSummary}</Text>
            </View>
            <View style={styles.ruleRow}>
              <Icon name="chart-line" size={16} color={colors.primary[500]} />
              <Text style={styles.ruleText}>
                Your limit is tied to contribution consistency, savings position, and current loan standing.
              </Text>
            </View>
            <View style={styles.ruleRow}>
              <Icon name="alert-outline" size={16} color={colors.primary[500]} />
              <Text style={styles.ruleText}>
                Overdue repayments may attract {workspace.loan_rules.late_penalty.value} {workspace.loan_rules.late_penalty.type.replace(/_/g, ' ')} and can reduce future eligibility.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('LoanEligibility', { chamaId: activeChamaId || undefined })}
          >
            <Text style={styles.sectionLink}>View full eligibility details</Text>
          </TouchableOpacity>
        </Card>

        {alerts.length ? (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Alerts & Reminders</Text>
            </View>
            <View style={styles.alertList}>
              {alerts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={item.onPress ? 0.85 : 1}
                  style={styles.alertRow}
                  onPress={item.onPress}
                  disabled={!item.onPress}
                >
                  <View style={[styles.alertIcon, { backgroundColor: `${getToneColor(item.tone)}16` }]}>
                    <Icon
                      name={item.icon as any}
                      size={18}
                      color={getToneColor(item.tone)}
                    />
                  </View>
                  <View style={styles.alertCopy}>
                    <Text style={styles.alertTitle}>{item.title}</Text>
                    <Text style={styles.alertText}>{item.message}</Text>
                  </View>
                  {item.actionLabel ? <Text style={styles.alertLink}>{item.actionLabel}</Text> : null}
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        ) : null}

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Loan History</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('LoanApplications', { chamaId: activeChamaId || undefined })}
            >
              <Text style={styles.sectionLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {workspace.history_preview.length ? (
            workspace.history_preview.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                style={styles.historyRow}
                onPress={() => {
                  if (item.record_type === 'loan' && item.loan_id) {
                    navigation.navigate('LoanDetail', {
                      loanId: item.loan_id,
                      chamaId: activeChamaId || undefined,
                    });
                    return;
                  }

                  if (item.application_id && item.status === 'rejected') {
                    navigation.navigate('RejectedApplicationState', {
                      applicationId: item.application_id,
                      chamaId: activeChamaId || undefined,
                    });
                    return;
                  }

                  if (item.application_id) {
                    navigation.navigate('LoanApplicationDetails', {
                      applicationId: item.application_id,
                      chamaId: activeChamaId || undefined,
                    });
                  }
                }}
              >
                <View style={styles.historyIcon}>
                  <Icon
                    name={item.record_type === 'loan' ? 'bank-outline' : 'file-document-outline'}
                    size={18}
                    color={colors.primary[600]}
                  />
                </View>
                <View style={styles.historyCopy}>
                  <Text style={styles.historyTitle}>{formatLoanPurposeLabel(item.purpose)}</Text>
                  <Text style={styles.historyMeta}>
                    {formatDisplayDate(item.date)} • {item.record_type === 'loan' ? 'Loan' : 'Application'}
                  </Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>{formatCurrency(item.amount, currency)}</Text>
                  <Badge
                    label={item.status.replace(/_/g, ' ')}
                    variant={getLoanStatusTone(item.status)}
                    size="sm"
                  />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyState
              title={noLoanActivityYet ? 'No loan activity yet' : 'No recent activity'}
              description={
                noLoanActivityYet
                  ? 'If you qualify, you can request your first loan from this screen and track it here afterwards.'
                  : 'Your applications and active loans will appear here once there is new activity.'
              }
              icon="cash-outline"
            />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  centerStateText: {
    marginTop: spacing[3],
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  heroCard: {
    gap: spacing[4],
    backgroundColor: '#F5FFF7',
    borderWidth: 1,
    borderColor: '#D8F4E0',
    ...shadows.sm,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  heroCopy: {
    flex: 1,
    gap: spacing[2],
  },
  heroEyebrow: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[700],
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  heroText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
  },
  heroBadgeWrap: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionCard: {
    gap: spacing[4],
    backgroundColor: colors.light.card,
    borderWidth: 1,
    borderColor: '#DCEFE2',
  },
  primaryActionCopy: {
    gap: spacing[2],
  },
  primaryActionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  primaryActionText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
  },
  summaryGrid: {
    gap: spacing[3],
  },
  metricCard: {
    gap: spacing[2],
  },
  metricLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
  },
  metricValue: {
    fontSize: typography.fontSize.xl,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  metricMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
  },
  sectionCard: {
    gap: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  sectionAmount: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  sectionText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
  },
  detailList: {
    gap: spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  detailLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
  },
  detailValue: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    textAlign: 'right',
  },
  progressTrack: {
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  progressMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  flexButton: {
    flex: 1,
  },
  ruleList: {
    gap: spacing[3],
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  ruleText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.regular,
  },
  sectionLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontFamily: typography.fontFamily.semibold,
  },
  alertList: {
    gap: spacing[3],
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCopy: {
    flex: 1,
    gap: spacing[1],
  },
  alertTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  alertText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
  },
  alertLink: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[600],
  },
  historyRow: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCopy: {
    flex: 1,
    gap: spacing[1],
  },
  historyTitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
  },
  historyMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  historyAmount: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  loanClearedCard: {
    backgroundColor: '#F2FBF5',
    borderWidth: 1,
    borderColor: '#CDEBD5',
    gap: spacing[2],
  },
  loanClearedHeader: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  loanClearedIconWrap: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF5E5',
  },
  loanClearedCopy: {
    flex: 1,
    gap: spacing[1],
  },
  loanClearedTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  loanClearedText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
  },
});
