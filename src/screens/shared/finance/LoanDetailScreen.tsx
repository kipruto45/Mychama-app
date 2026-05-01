import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useActiveRole, useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { MainStackParamList } from '@/navigation/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { chamaService } from '@/services/chamaService';
import { financeService } from '@/services/financeService';
import { Chama, Loan, LoanRecoveryAction } from '@/types';

type LoanDetailScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'LoanDetail'>;
type LoanDetailScreenRouteProp = RouteProp<MainStackParamList, 'LoanDetail'>;

interface RepaymentSchedule {
  id: string;
  dueDate: string;
  amount: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
}

interface LoanDetailState {
  loan: Loan;
  chama: Chama;
  schedule: RepaymentSchedule[];
  recoveryActions: LoanRecoveryAction[];
}

export const LoanDetailScreen: React.FC = () => {
  const navigation = useNavigation<LoanDetailScreenNavigationProp>();
  const route = useRoute<LoanDetailScreenRouteProp>();
  const { loanId, chamaId } = route.params;
  const [loanState, setLoanState] = useState<LoanDetailState | null>(null);
  const [loading, setLoading] = useState(true);
  const [repaying, setRepaying] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMode, setActionMode] = useState<'restructure' | 'recovery_note' | 'savings_offset' | 'write_off' | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionAmount, setActionAmount] = useState('');
  const [requestedMonths, setRequestedMonths] = useState('');
  const permissionScopeId = chamaId || loanState?.chama.id;
  const activeRole = useActiveRole(permissionScopeId);
  const canRequestLoan = useCanPerformAction(Permission.CAN_REQUEST_LOAN, permissionScopeId);
  const canManageRecovery = useCanPerformAction(Permission.CAN_MAKE_ADJUSTMENTS, permissionScopeId);

  const loadLoanDetails = async () => {
    try {
      const chamas = chamaId
        ? (await chamaService.getChamas()).filter((item) => item.id === chamaId)
        : await chamaService.getChamas();

      for (const chama of chamas) {
        const loans = await financeService.getLoans(chama.id).catch(() => []);
        const matchedLoan = loans.find((item) => item.id === loanId);

        if (matchedLoan) {
          const [scheduleResponse, recoveryActionRows] = await Promise.all([
            financeService.getLoanSchedule(matchedLoan.id).catch(() => []),
            financeService.getLoanRecoveryActions(matchedLoan.id).catch(() => []),
          ]);
          const schedule: RepaymentSchedule[] = scheduleResponse.map((item) => ({
            id: item.id,
            dueDate: item.due_date,
            amount: item.expected_amount,
            status:
              item.status === 'paid'
                ? 'paid'
                : item.status === 'overdue'
                ? 'overdue'
                : 'pending',
          }));

          setLoanState({
            loan: matchedLoan,
            chama,
            schedule,
            recoveryActions: recoveryActionRows,
          });
          setRequestedMonths(String(matchedLoan.duration_months + 1));
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to load loan details', error);
      Alert.alert('Loan Details', 'Unable to load this loan right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoanDetails();
  }, [loanId]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
      case 'disbursed':
      case 'active':
      case 'restructured':
      case 'repaid':
      case 'paid':
      case 'cleared':
        return 'success';
      case 'requested':
      case 'review':
      case 'due_soon':
        return 'warning';
      case 'rejected':
      case 'defaulted':
      case 'defaulted_recovering':
      case 'written_off':
      case 'overdue':
        return 'error';
      default:
        return 'info';
    }
  };

  const getRepaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'overdue':
        return colors.error;
      default:
        return colors.neutral[400];
    }
  };

  const handleMakeRepayment = async () => {
    if (!loanState) return;

    const nextInstallment = loanState.schedule.find(
      (item) => item.status === 'pending' || item.status === 'overdue'
    );

    if (!nextInstallment) {
      Alert.alert('Make Repayment', 'This loan has no outstanding scheduled repayments.');
      return;
    }

    Alert.alert(
      'Make Repayment',
      `Submit repayment of ${formatCurrency(nextInstallment.amount, loanState.chama.currency)} for the next installment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: async () => {
            try {
              setRepaying(true);
              await financeService.repayLoan(loanState.loan.id, {
                amount: nextInstallment.amount,
                date_paid: new Date().toISOString().split('T')[0],
                method: 'mpesa',
                receipt_code: `AUTO-${Date.now()}`,
                idempotency_key: `loan-repayment-${loanState.loan.id}-${Date.now()}`,
              });
              await loadLoanDetails();
              Alert.alert('Repayment Submitted', 'The repayment has been recorded successfully.');
            } catch (error) {
              console.warn('Failed to repay loan', error);
              Alert.alert('Repayment Failed', 'Unable to submit repayment right now.');
            } finally {
              setRepaying(false);
            }
          },
        },
      ]
    );
  };

  const handleDownloadAgreement = () => {
    Alert.alert(
      'Agreement Unavailable',
      'A downloadable agreement is not available for this loan yet.'
    );
  };

  const resetActionForm = () => {
    setActionMode(null);
    setActionNote('');
    setActionAmount('');
  };

  const handleSubmitAction = async () => {
    if (!loanState) return;

    try {
      setActionLoading(true);

      if (actionMode === 'restructure') {
        await financeService.requestLoanRestructure(loanState.loan.id, {
          requested_duration_months: Number(requestedMonths || loanState.loan.duration_months + 1),
          reason: actionNote || 'Requested from mobile loan detail.',
        });
      } else if (actionMode === 'recovery_note') {
        await financeService.recordLoanRecoveryAction(loanState.loan.id, {
          action_type: 'manual_note',
          notes: actionNote || 'Recovery follow-up recorded from mobile.',
        });
      } else if (actionMode === 'savings_offset') {
        if (!actionAmount.trim()) {
          throw new Error('Offset amount is required.');
        }

        await financeService.offsetLoanFromSavings(loanState.loan.id, {
          amount: actionAmount.trim(),
          notes: actionNote || 'Savings offset initiated from mobile.',
          idempotency_key: `loan-offset-${loanState.loan.id}-${Date.now()}`,
        });
      } else if (actionMode === 'write_off') {
        await financeService.writeOffLoan(loanState.loan.id, {
          notes: actionNote || 'Write-off approved from mobile.',
          idempotency_key: `loan-writeoff-${loanState.loan.id}-${Date.now()}`,
        });
      }

      await loadLoanDetails();
      resetActionForm();
      Alert.alert('Loan Updated', 'The loan recovery workflow has been updated successfully.');
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: string }).message || 'Unable to update this loan workflow.')
          : 'Unable to update this loan workflow.';
      Alert.alert('Loan Workflow', message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading loan details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!loanState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <Text style={styles.centerText}>Loan details are unavailable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { loan, chama, schedule, recoveryActions } = loanState;
  const paidCount = schedule.filter((r) => r.status === 'paid').length;
  const totalPaid = schedule
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const totalRepayment = schedule.reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const monthlyPayment = schedule[0]?.amount || '0';
  const nextInstallment = schedule.find((item) => item.status === 'pending' || item.status === 'overdue') || null;
  const isOverdue = ['overdue', 'defaulted', 'defaulted_recovering', 'written_off'].includes(loan.status);
  const isDefaulted = ['defaulted', 'defaulted_recovering', 'written_off'].includes(loan.status);
  const lifecycleMilestones = [
    { label: 'Requested', value: formatDate(loan.requested_at) },
    { label: 'Approved', value: loan.approved_at ? formatDate(loan.approved_at) : 'Pending' },
    { label: 'Disbursed', value: loan.disbursed_at ? formatDate(loan.disbursed_at) : 'Pending' },
    { label: 'Next Due', value: nextInstallment ? formatDate(nextInstallment.dueDate) : 'No due date' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Loan Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Badge
              label={loan.status}
              variant={getStatusVariant(loan.status)}
            />
            <Text style={styles.chamaName}>{chama.name}</Text>
          </View>

          <Text style={styles.principalLabel}>Principal Amount</Text>
          <Text style={styles.principalValue}>
            {formatCurrency(loan.principal, chama.currency)}
          </Text>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{loan.interest_rate}%</Text>
              <Text style={styles.summaryStatLabel}>Interest</Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{loan.duration_months}</Text>
              <Text style={styles.summaryStatLabel}>Months</Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>
                {formatCurrency(monthlyPayment, chama.currency)}
              </Text>
              <Text style={styles.summaryStatLabel}>Monthly</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.progressCard}>
          <Text style={styles.sectionTitle}>Loan Status</Text>
          <View style={[styles.statusBanner, isOverdue ? styles.statusBannerRisk : styles.statusBannerHealthy]}>
            <Icon
              name={isOverdue ? 'alert-octagon-outline' : 'check-decagram-outline'}
              size={20}
              color={isOverdue ? colors.error : colors.primary[700]}
            />
            <View style={styles.statusBannerCopy}>
              <Text style={styles.statusBannerTitle}>
                {isDefaulted
                  ? 'Recovery or default handling is active'
                  : isOverdue
                  ? 'This loan needs repayment attention'
                  : 'This loan is active and on track'}
              </Text>
              <Text style={styles.statusBannerText}>
                {isDefaulted
                  ? 'Recovery actions, restructuring, or write-off decisions should be tracked carefully from this record.'
                  : isOverdue
                  ? 'An installment is overdue. Repay quickly to reduce penalties and escalation.'
                  : 'Use this screen to follow the loan lifecycle from disbursement to full repayment.'}
              </Text>
            </View>
          </View>

          <View style={styles.lifecycleGrid}>
            {lifecycleMilestones.map((item) => (
              <View key={item.label} style={styles.lifecycleCard}>
                <Text style={styles.lifecycleLabel}>{item.label}</Text>
                <Text style={styles.lifecycleValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Repayment Progress</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: schedule.length ? `${(paidCount / schedule.length) * 100}%` : '0%' },
              ]}
            />
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {paidCount} of {schedule.length} payments made
            </Text>
            <Text style={styles.progressAmount}>
              {formatCurrency(totalPaid.toString(), chama.currency)} paid
            </Text>
          </View>
        </Card>

        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Disbursement & Repayment Snapshot</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Disbursement Status</Text>
            <Text style={styles.detailValue}>{loan.disbursed_at ? 'Completed' : 'Pending'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Disbursement Reference</Text>
            <Text style={styles.detailValue}>{loan.disbursement_reference || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Next Installment</Text>
            <Text style={styles.detailValue}>
              {nextInstallment
                ? `${formatCurrency(nextInstallment.amount, chama.currency)} on ${formatDate(nextInstallment.dueDate)}`
                : 'No installment pending'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Due</Text>
            <Text style={styles.detailValue}>{formatCurrency(loan.total_due || '0', chama.currency)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Workspace</Text>
            <Text style={styles.detailValue}>{activeRole || 'Member view'}</Text>
          </View>
        </Card>

        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Loan Information</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Product</Text>
            <Text style={styles.detailValue}>{loan.loan_product.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Eligibility</Text>
            <Text style={styles.detailValue}>{loan.eligibility_status}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recommended Max</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(loan.recommended_max_amount, chama.currency)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Repayment</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(totalRepayment.toString(), chama.currency)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Outstanding Principal</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(loan.outstanding_principal || '0', chama.currency)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Outstanding Penalties</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(loan.outstanding_penalty || '0', chama.currency)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date</Text>
            <Text style={styles.detailValue}>
              {loan.due_date ? formatDate(loan.due_date) : '-'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Requested</Text>
            <Text style={styles.detailValue}>{formatDate(loan.requested_at)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Approved</Text>
            <Text style={styles.detailValue}>
              {loan.approved_at ? formatDate(loan.approved_at) : '-'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Disbursed</Text>
            <Text style={styles.detailValue}>
              {loan.disbursed_at ? formatDate(loan.disbursed_at) : '-'}
            </Text>
          </View>
        </Card>

        <Card style={styles.guarantorsCard}>
          <Text style={styles.sectionTitle}>Guarantors</Text>
          {loan.guarantors.length > 0 ? (
            loan.guarantors.map((guarantor) => (
              <View key={guarantor.id} style={styles.guarantorItem}>
                <Avatar name={guarantor.guarantor.full_name} size="sm" />
                <View style={styles.guarantorInfo}>
                  <Text style={styles.guarantorName}>{guarantor.guarantor.full_name}</Text>
                  <Text style={styles.guarantorAmount}>
                    Guaranteed: {formatCurrency(guarantor.guaranteed_amount, chama.currency)}
                  </Text>
                  <Text style={styles.guarantorAmount}>
                    Exposure: {formatCurrency(guarantor.exposure_amount || '0', chama.currency)}
                    {guarantor.recovery_triggered ? ' · Recovery triggered' : ''}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.detailLabel}>No guarantors recorded.</Text>
          )}
        </Card>

        <Card style={styles.recoveryCard}>
          <Text style={styles.sectionTitle}>Recovery & Restructure</Text>

          <View style={styles.recoverySummary}>
            <View style={styles.recoveryMetric}>
              <Text style={styles.recoveryMetricValue}>{loan.escalation_level || 'normal'}</Text>
              <Text style={styles.recoveryMetricLabel}>Escalation</Text>
            </View>
            <View style={styles.recoveryMetric}>
              <Text style={styles.recoveryMetricValue}>{loan.final_status || 'open'}</Text>
              <Text style={styles.recoveryMetricLabel}>Final Outcome</Text>
            </View>
          </View>

          {recoveryActions.length ? (
            recoveryActions.map((action) => (
              <View key={action.id} style={styles.recoveryActionItem}>
                <View style={styles.recoveryActionHeader}>
                  <Text style={styles.recoveryActionType}>{action.action_type.replace(/_/g, ' ')}</Text>
                  <Text style={styles.recoveryActionDate}>{formatDate(action.created_at)}</Text>
                </View>
                <Text style={styles.recoveryActionAmount}>
                  {formatCurrency(action.amount || '0', chama.currency)}
                </Text>
                {action.notes ? <Text style={styles.recoveryActionNote}>{action.notes}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={styles.detailLabel}>No recovery actions have been recorded yet.</Text>
          )}

          <View style={styles.recoveryButtons}>
            {canRequestLoan ? (
              <Button
                title="Request Restructure"
                size="sm"
                variant={actionMode === 'restructure' ? 'primary' : 'outline'}
                onPress={() => setActionMode(actionMode === 'restructure' ? null : 'restructure')}
              />
            ) : null}
            {canManageRecovery ? (
              <Button
                title="Recovery Note"
                size="sm"
                variant={actionMode === 'recovery_note' ? 'primary' : 'outline'}
                onPress={() => setActionMode(actionMode === 'recovery_note' ? null : 'recovery_note')}
              />
            ) : null}
            {canManageRecovery ? (
              <Button
                title="Savings Offset"
                size="sm"
                variant={actionMode === 'savings_offset' ? 'primary' : 'outline'}
                onPress={() => setActionMode(actionMode === 'savings_offset' ? null : 'savings_offset')}
              />
            ) : null}
            {canManageRecovery ? (
              <Button
                title="Write Off"
                size="sm"
                variant={actionMode === 'write_off' ? 'primary' : 'outline'}
                onPress={() => setActionMode(actionMode === 'write_off' ? null : 'write_off')}
              />
            ) : null}
          </View>

          {actionMode ? (
            <View style={styles.actionForm}>
              {actionMode === 'restructure' ? (
                <TextInput
                  style={styles.actionInput}
                  value={requestedMonths}
                  onChangeText={setRequestedMonths}
                  keyboardType="number-pad"
                  placeholder="Requested duration in months"
                  placeholderTextColor={colors.neutral[400]}
                />
              ) : null}
              {actionMode === 'savings_offset' ? (
                <TextInput
                  style={styles.actionInput}
                  value={actionAmount}
                  onChangeText={setActionAmount}
                  keyboardType="decimal-pad"
                  placeholder="Offset amount"
                  placeholderTextColor={colors.neutral[400]}
                />
              ) : null}
              <TextInput
                style={[styles.actionInput, styles.actionInputMultiline]}
                value={actionNote}
                onChangeText={setActionNote}
                placeholder={
                  actionMode === 'write_off'
                    ? 'Write-off reason and approval note'
                    : actionMode === 'restructure'
                    ? 'Restructure reason'
                    : 'Notes'
                }
                placeholderTextColor={colors.neutral[400]}
                multiline
              />
              <View style={styles.actionButtons}>
                <Button title="Cancel" variant="outline" size="sm" onPress={resetActionForm} />
                <Button title="Submit" size="sm" onPress={() => void handleSubmitAction()} loading={actionLoading} />
              </View>
            </View>
          ) : null}
        </Card>

        <Card style={styles.scheduleCard}>
          <Text style={styles.sectionTitle}>Repayment Schedule</Text>
          {schedule.length > 0 ? (
            schedule.map((item, index) => (
              <View key={item.id} style={styles.scheduleItem}>
                <View style={styles.scheduleNumber}>
                  <Text style={styles.scheduleNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.scheduleContent}>
                  <Text style={styles.scheduleDate}>Due: {formatDate(item.dueDate)}</Text>
                  <Text style={styles.scheduleAmount}>
                    {formatCurrency(item.amount, chama.currency)}
                  </Text>
                </View>
                <View style={styles.scheduleStatus}>
                  <View
                    style={[
                      styles.scheduleStatusDot,
                      { backgroundColor: getRepaymentStatusColor(item.status) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.scheduleStatusText,
                      { color: getRepaymentStatusColor(item.status) },
                    ]}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.detailLabel}>No repayment schedule available.</Text>
          )}
        </Card>

        <View style={styles.actions}>
          <Button
            title={repaying ? 'Submitting...' : 'Make Repayment'}
            onPress={handleMakeRepayment}
            style={styles.repayButton}
            disabled={repaying}
            icon={<Icon name="cash" size={16} color="#FFFFFF" />}
          />
          <Button
            title="Download Agreement"
            onPress={handleDownloadAgreement}
            variant="outline"
            style={styles.downloadButton}
            icon={<Icon name="download" size={16} color={colors.primary[500]} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  centerText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    textAlign: 'center',
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
  backButton: {
    padding: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  summaryCard: {
    marginBottom: spacing[4],
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  chamaName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  principalLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  principalValue: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  summaryStatLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  summaryStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.neutral[200],
  },
  progressCard: {
    marginBottom: spacing[4],
  },
  statusBanner: {
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  statusBannerRisk: {
    backgroundColor: '#FEF2F2',
  },
  statusBannerHealthy: {
    backgroundColor: colors.primary[50],
  },
  statusBannerCopy: {
    flex: 1,
  },
  statusBannerTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  statusBannerText: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  lifecycleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  lifecycleCard: {
    flexBasis: '47%',
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  lifecycleLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  lifecycleValue: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: borderRadius.full,
    marginBottom: spacing[2],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  progressAmount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.success,
  },
  detailsCard: {
    marginBottom: spacing[4],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing[4],
  },
  guarantorsCard: {
    marginBottom: spacing[4],
  },
  guarantorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  guarantorInfo: {
    marginLeft: spacing[3],
  },
  guarantorName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
  },
  guarantorAmount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  recoveryCard: {
    marginBottom: spacing[4],
  },
  recoverySummary: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  recoveryMetric: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    flex: 1,
    padding: spacing[3],
  },
  recoveryMetricValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  recoveryMetricLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    marginTop: spacing[1],
  },
  recoveryActionItem: {
    borderTopColor: colors.neutral[100],
    borderTopWidth: 1,
    gap: spacing[1],
    paddingTop: spacing[3],
    marginTop: spacing[3],
  },
  recoveryActionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recoveryActionType: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    textTransform: 'capitalize',
  },
  recoveryActionDate: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
  },
  recoveryActionAmount: {
    color: colors.primary[600],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  recoveryActionNote: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  recoveryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  actionForm: {
    marginTop: spacing[4],
  },
  actionInput: {
    backgroundColor: colors.light.card,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  actionInputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  scheduleCard: {
    marginBottom: spacing[4],
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  scheduleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  scheduleNumberText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[700],
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  scheduleAmount: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
    marginTop: spacing[1],
  },
  scheduleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[1],
  },
  scheduleStatusText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  actions: {
    gap: spacing[3],
  },
  repayButton: {
    width: '100%',
  },
  downloadButton: {
    width: '100%',
  },
});
