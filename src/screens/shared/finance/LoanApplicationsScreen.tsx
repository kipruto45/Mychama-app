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
import { useActiveRole, useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { Role, ROLE_DISPLAY_NAMES } from '@/auth/roles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { useAuth } from '@/providers/AuthProvider';
import { RequireRouteAccess, useScreenRBAC } from '@/rbac';
import { financeService } from '@/services/financeService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Loan, LoanApplication, LoanReports } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

type LoanApplicationsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'LoanApplications'>;
type LoanApplicationsRouteProp = RouteProp<MainStackParamList, 'LoanApplications'>;

type FilterKey = 'all' | 'submitted' | 'review' | 'approved' | 'rejected' | 'disbursed';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'review', label: 'In Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'disbursed', label: 'Disbursed' },
];

const getApplicationBadgeVariant = (status: LoanApplication['status']) => {
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

const matchesFilter = (application: LoanApplication, filter: FilterKey) => {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'review') {
    return ['in_review', 'treasurer_approved', 'committee_approved'].includes(application.status);
  }

  if (filter === 'approved') {
    return ['approved', 'treasurer_approved', 'committee_approved'].includes(application.status);
  }

  return application.status === filter;
};

export const LoanApplicationsScreen: React.FC = () => {
  const navigation = useNavigation<LoanApplicationsNavigationProp>();
  const route = useRoute<LoanApplicationsRouteProp>();
  const { user } = useAuth();
  const {
    activeChamaId,
    availableChamas,
    clearSwitchError,
    isLoading: isLoadingChamaContext,
    isSwitching,
    switchChama,
    switchError,
  } = useActiveChama();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanReports, setLoanReports] = useState<LoanReports | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chamaId = route.params?.chamaId || activeChamaId || undefined;
  const activeRole = useActiveRole(chamaId);
  const canApproveLoan = useCanPerformAction(Permission.CAN_APPROVE_LOAN, chamaId);
  const canDisburseLoan = useCanPerformAction(Permission.CAN_DISBURSE_LOAN, chamaId);
  const canViewLoanReports = useCanPerformAction(
    [Permission.CAN_VIEW_FINANCIAL_REPORTS, Permission.CAN_VIEW_FINANCE],
    chamaId
  );
  const { experience } = useScreenRBAC('loans', chamaId);
  const currentCurrency = availableChamas.find((item) => item.id === chamaId)?.currency || 'KES';
  const isMemberWorkspace = experience.access === 'self_service';
  const loanScreenMeta = useMemo(() => {
    const titleByRole: Record<Role, string> = {
      [Role.SUPERADMIN]: 'Loan activity',
      [Role.ADMIN]: 'Loan escalations',
      [Role.CHAMA_ADMIN]: 'Loan command',
      [Role.TREASURER]: 'Loan operations',
      [Role.SECRETARY]: 'Loans',
      [Role.AUDITOR]: 'Loan review',
      [Role.MEMBER]: 'My loans',
    };

    return {
      title: titleByRole[activeRole || Role.MEMBER],
      subtitle: `${experience.does[0] || 'Track loan activity in this workspace.'} ${experience.sees[0] ? `You can see ${experience.sees[0]}.` : ''}`.trim(),
    };
  }, [activeRole, experience.does, experience.sees]);

  const myApplications = useMemo(
    () => applications.filter((application) => application.member?.id === user?.id),
    [applications, user?.id]
  );

  const myLoans = useMemo(
    () => loans.filter((loan) => loan.member?.id === user?.id),
    [loans, user?.id]
  );

  const guarantorInbox = useMemo(
    () =>
      applications.filter((application) =>
        (application.guarantors || []).some(
          (guarantor) => guarantor.guarantor.id === user?.id && guarantor.status === 'proposed'
        )
      ),
    [applications, user?.id]
  );

  const visibleApplications = useMemo(() => {
    if (!isMemberWorkspace) {
      return applications;
    }

    const merged = new Map<string, LoanApplication>();
    [...myApplications, ...guarantorInbox].forEach((application) => {
      merged.set(application.id, application);
    });

    return Array.from(merged.values());
  }, [applications, guarantorInbox, isMemberWorkspace, myApplications]);

  const visibleLoans = useMemo(() => (isMemberWorkspace ? myLoans : loans), [isMemberWorkspace, loans, myLoans]);

  const filteredApplications = useMemo(
    () => visibleApplications.filter((application) => matchesFilter(application, filter)),
    [visibleApplications, filter]
  );

  const summary = useMemo(
    () => ({
      total: visibleApplications.length,
      pending: visibleApplications.filter((application) =>
        ['submitted', 'in_review', 'treasurer_approved', 'committee_approved'].includes(application.status)
      ).length,
      approved: visibleApplications.filter((application) => application.status === 'approved').length,
      overdue: visibleLoans.filter((loan) => ['overdue', 'defaulted', 'defaulted_recovering'].includes(loan.status)).length,
    }),
    [visibleApplications, visibleLoans]
  );

  const activeMemberLoan = useMemo(
    () =>
      myLoans.find((loan) =>
        ['approved', 'disbursing', 'disbursed', 'active', 'due_soon', 'overdue', 'restructured', 'defaulted_recovering'].includes(
          loan.status
        )
      ) || null,
    [myLoans]
  );

  const portfolio = (loanReports?.portfolio as Record<string, unknown> | undefined) || {};
  const applicationReport = (loanReports?.applications as Record<string, unknown> | undefined) || {};
  const guarantorExposureCount = Array.isArray(portfolio.guarantor_exposure)
    ? portfolio.guarantor_exposure.length
    : 0;
  const defaultersCount = Number(portfolio.defaulters_count || 0);
  const overduePortfolioCount = Number(portfolio.overdue_count || summary.overdue);

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
    if (isLoadingChamaContext) {
      return;
    }

    if (!chamaId) {
      setLoading(false);
      setApplications([]);
      setLoans([]);
      setLoanReports(null);
      setError(null);
      return;
    }

    void loadData();
  }, [chamaId, isLoadingChamaContext]);

  const loadData = async () => {
    if (!chamaId) {
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const [applicationRows, loanRows] = await Promise.all([
        financeService.getLoanApplications(chamaId),
        financeService.getLoans(chamaId),
      ]);
      setApplications(applicationRows);
      setLoans(loanRows);
      if (canViewLoanReports) {
        const reports = await financeService.getLoanReports(chamaId).catch(() => null);
        setLoanReports(reports);
      } else {
        setLoanReports(null);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setApplications([]);
      setLoans([]);
      setLoanReports(null);
    } finally {
      setLoading(false);
    }
  };

  const withReload = async (handler: () => Promise<void>) => {
    try {
      await handler();
      await loadData();
    } catch (actionError) {
      Alert.alert('Loan Applications', getErrorMessage(actionError));
    } finally {
      setActingId(null);
    }
  };

  const confirmAction = (title: string, message: string, onConfirm: () => Promise<void>) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        onPress: () => {
          void onConfirm();
        },
      },
    ]);
  };

  const handlePrimaryAction = (application: LoanApplication) => {
    if (!chamaId) {
      return;
    }

    if (application.status === 'submitted' || application.status === 'in_review') {
      confirmAction(
        'Treasurer Review',
        'Approve this application for the next approval stage?',
        async () => {
          setActingId(application.id);
          await withReload(() =>
            financeService.reviewLoanApplication(chamaId, application.id, {
              decision: 'approved',
            }).then(() => undefined)
          );
        }
      );
      return;
    }

    if (application.status === 'treasurer_approved') {
      confirmAction(
        'Committee Approval',
        'Record committee approval for this application?',
        async () => {
          setActingId(application.id);
          await withReload(() =>
            financeService.committeeApproveLoanApplication(chamaId, application.id, {
              decision: 'approved',
            }).then(() => undefined)
          );
        }
      );
      return;
    }

    if (application.status === 'committee_approved') {
      confirmAction(
        'Final Approval',
        'Move this application into approved status?',
        async () => {
          setActingId(application.id);
          await withReload(() =>
            financeService.approveLoanApplication(chamaId, application.id).then(() => undefined)
          );
        }
      );
      return;
    }

    if (application.status === 'approved') {
      confirmAction(
        'Disburse Loan',
        'Create the funded loan and post the disbursement now?',
        async () => {
          setActingId(application.id);
          await withReload(() =>
            financeService.disburseLoanApplication(chamaId, application.id, {
              disbursement_reference: `APP-DISB-${Date.now()}`,
              idempotency_key: `app-disbursement-${application.id}-${Date.now()}`,
            }).then(() => undefined)
          );
        }
      );
    }
  };

  const handleReject = (application: LoanApplication) => {
    if (!chamaId) {
      return;
    }

    confirmAction(
      'Reject Application',
      'Reject this application and notify the borrower?',
      async () => {
        setActingId(application.id);

        if (application.status === 'submitted' || application.status === 'in_review') {
          await withReload(() =>
            financeService.reviewLoanApplication(chamaId, application.id, {
              decision: 'rejected',
            }).then(() => undefined)
          );
          return;
        }

        if (application.status === 'treasurer_approved') {
          await withReload(() =>
            financeService.committeeApproveLoanApplication(chamaId, application.id, {
              decision: 'rejected',
            }).then(() => undefined)
          );
          return;
        }

        await withReload(() =>
          financeService.rejectLoanApplication(chamaId, application.id).then(() => undefined)
        );
      }
    );
  };

  const handleGuarantorResponse = (application: LoanApplication, guarantorId: string, action: 'accepted' | 'rejected') => {
    confirmAction(
      action === 'accepted' ? 'Accept Guarantee' : 'Decline Guarantee',
      action === 'accepted'
        ? 'Confirm that you want to guarantee this application.'
        : 'Confirm that you want to decline this guarantee request.',
      async () => {
        setActingId(application.id);
        await withReload(() =>
          financeService.respondToLoanApplicationGuarantor(guarantorId, {
            action,
          }).then(() => undefined)
        );
      }
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderApplicationCard = (application: LoanApplication) => {
    const guarantors = application.guarantors || [];
    const approvalLogs = application.approval_logs || [];
    const memberName = application.member?.full_name || 'Member';
    const loanProductName = application.loan_product?.name || 'Loan product';
    const myGuarantorAction = guarantors.find(
      (guarantor) => guarantor.guarantor.id === user?.id && guarantor.status === 'proposed'
    );

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
      <Card key={application.id} style={styles.applicationCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.memberName}>{memberName}</Text>
            <Text style={styles.metaText}>
              {loanProductName} • {application.requested_term_months} months
            </Text>
          </View>
          <Badge label={application.status.replace(/_/g, ' ')} variant={getApplicationBadgeVariant(application.status)} />
        </View>

        <Text style={styles.amountText}>
          {formatCurrency(application.requested_amount, currentCurrency)}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Submitted</Text>
          <Text style={styles.metaValue}>{formatDate(application.submitted_at)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Purpose</Text>
          <Text style={styles.metaValue}>{application.purpose || 'Not provided'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Eligibility</Text>
          <Text style={styles.metaValue}>
            {application.eligibility_status} • Max {formatCurrency(application.recommended_max_amount || '0', currentCurrency)}
          </Text>
        </View>

        {application.rejection_reason ? (
          <View style={styles.alertStrip}>
            <Icon name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={styles.alertStripText}>{application.rejection_reason ?? ''}</Text>
          </View>
        ) : null}

        {guarantors.length > 0 ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Guarantors</Text>
            {guarantors.map((guarantor) => (
              <View key={guarantor.id} style={styles.guarantorRow}>
                <View>
                  <Text style={styles.guarantorName}>{guarantor.guarantor.full_name}</Text>
                  <Text style={styles.guarantorMeta}>
                    {formatCurrency(guarantor.guaranteed_amount, currentCurrency)} • {guarantor.status.replace(/_/g, ' ')}
                  </Text>
                </View>
                <Badge
                  label={guarantor.status.replace(/_/g, ' ')}
                  variant={
                    guarantor.status === 'accepted'
                      ? 'success'
                      : guarantor.status === 'rejected'
                      ? 'error'
                      : 'warning'
                  }
                  size="sm"
                />
              </View>
            ))}
          </View>
        ) : null}

        {approvalLogs.length > 0 ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Approval Trail</Text>
            {approvalLogs.slice(0, 3).map((log) => (
              <Text key={log.id} style={styles.timelineText}>
                {log.stage.replace(/_/g, ' ')} • {log.decision} • {formatDate(log.acted_at)}
              </Text>
            ))}
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

          {myGuarantorAction ? (
            <>
              <Button
                title="Accept Guarantee"
                variant="outline"
                onPress={() => handleGuarantorResponse(application, myGuarantorAction.id, 'accepted')}
              />
              <Button
                title="Decline"
                variant="ghost"
                onPress={() => handleGuarantorResponse(application, myGuarantorAction.id, 'rejected')}
              />
            </>
          ) : null}

          {showPrimaryAction ? (
            <Button
              title={primaryTitle}
              onPress={() => handlePrimaryAction(application)}
              loading={actingId === application.id}
            />
          ) : null}

          {canApproveLoan &&
          ['submitted', 'in_review', 'treasurer_approved', 'committee_approved', 'approved'].includes(application.status) ? (
            <Button
              title="Reject"
              variant="ghost"
              onPress={() => handleReject(application)}
            />
          ) : null}
        </View>
      </Card>
    );
  };

  const renderMemberOverview = () => (
    <>
      <Card style={styles.heroCard}>
        <View style={styles.inlineBetween}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Loans Dashboard</Text>
            <Text style={styles.heroTitle}>
              {activeMemberLoan ? 'Your active loan is being tracked here' : 'Check eligibility and request a new loan'}
            </Text>
            <Text style={styles.heroText}>
              Review your status, see what is due next, and move through request, approval, and repayment from one place.
            </Text>
          </View>
          <Icon name="bank-check-outline" size={34} color={colors.primary[600]} />
        </View>

        <View style={styles.heroActions}>
          <Button title="Request Loan" onPress={() => navigation.navigate('RequestLoan', { chamaId })} />
          <Button title="View Loan History" variant="outline" onPress={() => setFilter('all')} />
        </View>
      </Card>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Active Loan</Text>
          <Text style={styles.summaryValue}>{activeMemberLoan ? formatCurrency(activeMemberLoan.principal, currentCurrency) : 'None'}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Outstanding</Text>
          <Text style={styles.summaryValue}>
            {activeMemberLoan ? formatCurrency(activeMemberLoan.total_due || '0', currentCurrency) : formatCurrency('0', currentCurrency)}
          </Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Next Due</Text>
          <Text style={styles.summaryValueSmall}>
            {activeMemberLoan?.due_date ? formatDate(activeMemberLoan.due_date) : 'No due date'}
          </Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>My Requests</Text>
          <Text style={styles.summaryValue}>{myApplications.length}</Text>
        </Card>
      </View>

      {activeMemberLoan && ['overdue', 'defaulted', 'defaulted_recovering'].includes(activeMemberLoan.status) ? (
        <Card style={styles.alertCard}>
          <View style={styles.alertRow}>
            <Icon name="alert-circle-outline" size={20} color={colors.error} />
            <View style={styles.alertCopy}>
              <Text style={styles.alertTitle}>Repayment action needed</Text>
              <Text style={styles.alertText}>
                Your loan is {activeMemberLoan.status.replace(/_/g, ' ')}. Pay soon to avoid further penalties or recovery actions.
              </Text>
            </View>
          </View>
          <Button
            title="Open Active Loan"
            onPress={() => navigation.navigate('LoanDetail', { loanId: activeMemberLoan.id, chamaId })}
          />
        </Card>
      ) : null}

      {guarantorInbox.length > 0 ? (
        <Card style={styles.alertCard}>
          <View style={styles.alertRow}>
            <Icon name="shield-account-outline" size={20} color={colors.accent[700]} />
            <View style={styles.alertCopy}>
              <Text style={styles.alertTitle}>Guarantee requests waiting on you</Text>
              <Text style={styles.alertText}>
                You have {guarantorInbox.length} guarantor request{guarantorInbox.length === 1 ? '' : 's'} to review.
              </Text>
            </View>
          </View>
        </Card>
      ) : null}
    </>
  );

  const renderOperationsOverview = () => (
    <>
      <Card style={styles.heroCard}>
        <View style={styles.inlineBetween}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Loan Operations</Text>
            <Text style={styles.heroTitle}>Review applications, watch risk, and manage repayment health</Text>
            <Text style={styles.heroText}>
              This workspace brings together the approval queue, disbursement pipeline, guarantor exposure, and overdue/default visibility.
            </Text>
          </View>
          <Icon name="bank-outline" size={34} color={colors.primary[600]} />
        </View>

        <View style={styles.heroActions}>
          <Button title="New Request" variant="outline" onPress={() => navigation.navigate('RequestLoan', { chamaId })} />
          <Button title="Approval Queue" variant="outline" onPress={() => navigation.navigate('LoanApprovalQueue', { chamaId })} />
          <Button title="Recovery Queue" variant="outline" onPress={() => navigation.navigate('LoanRecoveryQueue', { chamaId })} />
          <Button title="Restructures" variant="outline" onPress={() => navigation.navigate('LoanRestructureQueue', { chamaId })} />
        </View>
      </Card>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending Queue</Text>
          <Text style={styles.summaryValue}>{Number(applicationReport.pending || summary.pending)}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Overdue Loans</Text>
          <Text style={styles.summaryValue}>{overduePortfolioCount}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Defaulted</Text>
          <Text style={styles.summaryValue}>{defaultersCount}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Guarantor Exposure</Text>
          <Text style={styles.summaryValue}>{guarantorExposureCount}</Text>
        </Card>
      </View>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Outstanding</Text>
          <Text style={styles.summaryValueSmall}>
            {formatCurrency(String(portfolio.total_outstanding || '0'), currentCurrency)}
          </Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Repayment Rate</Text>
          <Text style={styles.summaryValueSmall}>{String(portfolio.repayment_rate_percent || '0')}%</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Approved</Text>
          <Text style={styles.summaryValue}>{Number(applicationReport.approved || summary.approved)}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Disbursed</Text>
          <Text style={styles.summaryValue}>{Number(applicationReport.disbursed || 0)}</Text>
        </Card>
      </View>
    </>
  );

  const visibleFilterOptions = useMemo(() => {
    if (isMemberWorkspace) {
      return FILTERS.filter((item) => ['all', 'submitted', 'approved', 'rejected'].includes(item.key));
    }

    if (experience.access === 'read_only') {
      return FILTERS.filter((item) => item.key !== 'review');
    }

    return FILTERS;
  }, [experience.access, isMemberWorkspace]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerTitle}>Loading loan applications</Text>
          <Text style={styles.centerText}>Pulling the latest approval queue, guarantor responses, and funded loans.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={<Icon name="account-group-outline" size={56} color={colors.neutral[400]} />}
          title="Choose a chama first"
          description="Loan applications are scoped to a chama. Switch workspace to continue."
          action={<Button title="Open Chamas" onPress={() => navigation.navigate('Chamas')} />}
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <RequireRouteAccess route="LoanApplications" chamaId={chamaId}>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={22} color={colors.neutral[700]} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{loanScreenMeta.title}</Text>
          <Text style={styles.subtitle}>
            {loanScreenMeta.subtitle}
            {activeRole ? ` ${ROLE_DISPLAY_NAMES[activeRole]} workspace.` : ''}
          </Text>
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
          icon={<Icon name="alert-circle-outline" size={56} color={colors.error} />}
          title="Loan applications unavailable"
          description={error}
          action={<Button title="Retry" onPress={() => void loadData()} />}
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
              <Text style={styles.summaryLabel}>Applications</Text>
              <Text style={styles.summaryValue}>{summary.total}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={styles.summaryValue}>{summary.pending}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Approved</Text>
              <Text style={styles.summaryValue}>{summary.approved}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Overdue Loans</Text>
              <Text style={styles.summaryValue}>{summary.overdue}</Text>
            </Card>
          </View>

          <View style={styles.filterRow}>
            {visibleFilterOptions.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
                onPress={() => setFilter(item.key)}
              >
                <Text style={[styles.filterLabel, filter === item.key && styles.filterLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {isMemberWorkspace ? renderMemberOverview() : renderOperationsOverview()}

          <View style={styles.inlineBetween}>
            <Text style={styles.sectionHeading}>{isMemberWorkspace ? 'My loan activity' : 'Approval queue'}</Text>
            {isMemberWorkspace ? (
              <Button
                title="New Request"
                variant="outline"
                onPress={() => navigation.navigate('RequestLoan', { chamaId })}
              />
            ) : (
              <Button
                title="Open Approval Queue"
                variant="outline"
                onPress={() => navigation.navigate('LoanApprovalQueue', { chamaId })}
              />
            )}
          </View>

          {filteredApplications.length > 0 ? (
            filteredApplications.map(renderApplicationCard)
          ) : (
            <EmptyState
              icon={<Icon name="bank-outline" size={48} color={colors.neutral[400]} />}
              title="No applications in this view"
              description="New applications, approvals, and guarantor actions will appear here when available."
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
    </RequireRouteAccess>
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
  heroCard: {
    gap: spacing[4],
  },
  heroCopy: {
    flex: 1,
    marginRight: spacing[3],
  },
  heroEyebrow: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  heroText: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    lineHeight: 20,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing[3],
    flexWrap: 'wrap',
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
  alertCard: {
    gap: spacing[3],
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  alertCopy: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  alertText: {
    marginTop: spacing[1],
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
  inlineBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[3],
  },
  sectionHeading: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  applicationCard: {
    gap: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  cardHeaderCopy: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  amountText: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[700],
  },
  metaText: {
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
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    textAlign: 'right',
  },
  alertStrip: {
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    flexDirection: 'row',
    gap: spacing[2],
  },
  alertStripText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
  },
  sectionBlock: {
    gap: spacing[2],
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[700],
  },
  guarantorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[1],
  },
  guarantorName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
  },
  guarantorMeta: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  timelineText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
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
