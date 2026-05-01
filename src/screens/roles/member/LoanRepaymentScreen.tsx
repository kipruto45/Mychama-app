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
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { navigateToWorkspaceTab } from '@/navigation/workspaceTabNavigation';
import { memberLoanService, normalizeLoanState } from '@/services/memberLoanService';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import {
  buildRepaymentTargetLabel,
  getLoanRepaymentEntryMeta,
  getRepaymentDueStateMeta,
  normalizeRepaymentDueState,
} from './memberLoanRepaymentWorkflowShared';
import { sanitizeLoanAmountInput } from './loanWorkflowShared';

type LoanRepaymentNavigationProp = NativeStackNavigationProp<MainStackParamList, 'LoanRepayment'>;
type LoanRepaymentRouteProp = RouteProp<MainStackParamList, 'LoanRepayment'>;

const QUICK_OPTIONS = [
  { key: 'next_due', label: 'Pay Next Due' },
  { key: 'full_outstanding', label: 'Pay Full Outstanding' },
  { key: 'custom', label: 'Custom Amount' },
] as const;

export const LoanRepaymentScreen: React.FC = () => {
  const navigation = useNavigation<LoanRepaymentNavigationProp>();
  const route = useRoute<LoanRepaymentRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const {
    patchRepaymentDraft,
    repaymentDraft,
    setActiveLoanId,
    setLastVisitedRoute,
  } = useMemberLoanFlowStore();

  const chamaId = route.params?.chamaId || activeChamaId || repaymentDraft?.chamaId || undefined;
  const loanId = route.params.loanId || repaymentDraft?.loanId || '';

  const [loan, setLoan] = useState<any | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<'next_due' | 'full_outstanding' | 'custom'>(
    route.params.quickAmountOption || repaymentDraft?.quickAmountOption || 'next_due'
  );
  const [amount, setAmount] = useState(route.params.amount || repaymentDraft?.amount || '');

  useEffect(() => {
    setLastVisitedRoute('LoanRepayment');
    setActiveLoanId(loanId || null);
  }, [loanId, setActiveLoanId, setLastVisitedRoute]);

  const loadLoan = async (showRefresh = false) => {
    if (!chamaId || !loanId) {
      setLoading(false);
      return;
    }

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [loanResponse, scheduleResponse] = await Promise.all([
        memberLoanService.getActiveLoanDetail(chamaId, loanId),
        memberLoanService.getRepaymentSchedule(loanId).catch(() => []),
      ]);
      setLoan(loanResponse);
      setSchedule(scheduleResponse);
      setError(null);
    } catch {
      setError('We couldn’t load your loan details right now. Please try again.');
      setLoan(null);
      setSchedule([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadLoan();
  }, [chamaId, loanId]);

  const currency = activeChama?.currency || 'KES';
  const nextInstallment = useMemo(
    () => schedule.find((item) => item.status !== 'paid') || loan?.next_installment || null,
    [loan?.next_installment, schedule]
  );
  const outstandingBalance = String(loan?.total_due || loan?.outstanding_principal || '0.00');
  const nextDueAmount = String(nextInstallment?.expected_amount || loan?.total_due || '0.00');
  const minimumDueAmount = String(nextInstallment?.expected_amount || '0.00');
  const dueMeta = getRepaymentDueStateMeta(normalizeRepaymentDueState(nextInstallment?.status));
  const entryMeta = getLoanRepaymentEntryMeta(route.params?.entryPoint);
  const suggestedAmount = selectedOption === 'full_outstanding' ? outstandingBalance : nextDueAmount;

  useEffect(() => {
    if (!loan) {
      return;
    }
    if (selectedOption !== 'custom') {
      setAmount(suggestedAmount);
    }
  }, [loan, selectedOption, suggestedAmount]);

  const parsedAmount = Number(amount || 0);
  const parsedOutstanding = Number(outstandingBalance || 0);
  const validationError = useMemo(() => {
    if (!amount) {
      return 'Enter a valid repayment amount.';
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return 'Enter a valid repayment amount.';
    }
    if (parsedAmount > parsedOutstanding) {
      return 'Enter a valid repayment amount.';
    }
    return null;
  }, [amount, parsedAmount, parsedOutstanding]);

  const loanState = normalizeLoanState(loan?.status || '');

  const handleContinue = () => {
    if (!chamaId || !loanId || !loan || validationError) {
      setError(validationError || 'Enter a valid repayment amount.');
      return;
    }

    const resultingBalanceEstimate = Math.max(parsedOutstanding - parsedAmount, 0).toFixed(2);
    const targetLabel = buildRepaymentTargetLabel({
      dueDate: route.params?.dueDate || nextInstallment?.due_date || loan?.due_date,
      installmentId: route.params?.installmentId || nextInstallment?.id,
      fallback: route.params?.targetLabel,
    });

    patchRepaymentDraft({
      chamaId,
      loanId,
      installmentId: route.params?.installmentId || nextInstallment?.id || null,
      currency,
      amount,
      dueDate: route.params?.dueDate || nextInstallment?.due_date || loan?.due_date || null,
      targetLabel,
      quickAmountOption: selectedOption,
      paymentMethod: repaymentDraft?.paymentMethod || 'mpesa',
      outstandingBalance,
      nextDueAmount,
      minimumDueAmount,
      resultingBalanceEstimate,
      sourceEntryPoint: route.params?.entryPoint || 'loan_detail',
    });

    navigation.navigate('PaymentMethod', {
      chamaId,
      amount,
      currency,
      paymentPurposeType: 'loan_repayment',
      paymentPurposeLabel: 'Loan repayment',
      purpose: 'loan_repayment',
      loanId,
      installmentId: route.params?.installmentId || nextInstallment?.id,
      dueDate: route.params?.dueDate || nextInstallment?.due_date || loan?.due_date || undefined,
      targetLabel,
      sourceRoute: 'LoanRepayment',
      totalAmount: amount,
      feeAmount: '0.00',
      outstandingBalance,
      nextDueAmount,
      minimumDueAmount,
      resultingBalanceEstimate,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Repay Loan" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading your repayment details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId || !loanId || error || !loan) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Repay Loan" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Unable to start repayment"
          description={error || 'We couldn’t load your loan details right now. Please try again.'}
          icon="cash-remove"
          style={styles.centerState}
          action={{
            label: 'Back to Loans',
            onPress: () => navigation.navigate('MemberLoans', { chamaId }),
          }}
        />
      </SafeAreaView>
    );
  }

  if (loanState === 'completed') {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Repay Loan" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="This loan is fully paid."
          description="Your loan balance is clear. You can review the repayment history for the final records."
          icon="check-circle-outline"
          style={styles.centerState}
          action={{
            label: 'View Repayment History',
            onPress: () => navigation.navigate('LoanRepaymentHistory', { loanId, chamaId }),
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Repay Loan" subtitle={activeChama?.name} showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadLoan(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        <Card style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Repay your loan securely</Text>
          <Text style={styles.heroTitle}>{formatCurrency(outstandingBalance, currency)}</Text>
          <Text style={styles.heroText}>Outstanding balance with your next due amount clearly shown.</Text>
          <View style={[styles.dueBadge, { backgroundColor: `${dueMeta.tint}14` }]}>
            <Icon name={dueMeta.icon as any} size={16} color={dueMeta.tint} />
            <Text style={[styles.dueBadgeText, { color: dueMeta.tint }]}>{dueMeta.label}</Text>
          </View>
        </Card>

        {entryMeta ? (
          <Card style={styles.entryCard}>
            <Text style={styles.entryLabel}>{entryMeta.label}</Text>
            <Text style={styles.entryText}>{entryMeta.message}</Text>
          </Card>
        ) : null}

        <Card style={styles.summaryCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Outstanding balance</Text>
            <Text style={styles.value}>{formatCurrency(outstandingBalance, currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Next due amount</Text>
            <Text style={styles.value}>{formatCurrency(nextDueAmount, currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Minimum due</Text>
            <Text style={styles.value}>
              {Number(minimumDueAmount || 0) > 0
                ? formatCurrency(minimumDueAmount, currency)
                : 'No minimum due'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Due date</Text>
            <Text style={styles.value}>
              {nextInstallment?.due_date ? formatDate(nextInstallment.due_date) : 'Not available'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>What this covers</Text>
            <Text style={styles.value}>
              {nextInstallment ? 'Your next installment' : 'Your active loan balance'}
            </Text>
          </View>
        </Card>

        <Card style={styles.selectionCard}>
          <Text style={styles.sectionTitle}>Choose how much you want to repay.</Text>
          <Text style={styles.helperText}>
            Select the next due amount, clear the full balance, or enter a custom amount within your outstanding balance.
          </Text>

          <View style={styles.chipsRow}>
            {QUICK_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                activeOpacity={0.85}
                style={[styles.choiceChip, selectedOption === option.key && styles.choiceChipActive]}
                onPress={() => {
                  setSelectedOption(option.key);
                  if (error) setError(null);
                }}
              >
                <Text
                  style={[
                    styles.choiceChipText,
                    selectedOption === option.key && styles.choiceChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Repayment amount"
            value={amount}
            onChangeText={(value) => {
              setSelectedOption('custom');
              setAmount(sanitizeLoanAmountInput(value));
              if (error) setError(null);
            }}
            keyboardType="decimal-pad"
            placeholder="Enter amount"
            error={error || validationError || undefined}
          />
        </Card>

        <Card style={styles.coverageCard}>
          <Text style={styles.sectionTitle}>Repayment summary</Text>
          <Text style={styles.coverageText}>
            This payment will go toward your current outstanding loan balance. If you repay less than the full balance, the remaining amount stays in your schedule.
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Estimated balance after payment</Text>
            <Text style={styles.balanceAfterValue}>
              {formatCurrency(Math.max(parsedOutstanding - (parsedAmount || 0), 0).toFixed(2), currency)}
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button title="Continue" onPress={handleContinue} />
          <Button
            title="View Repayment Schedule"
            variant="outline"
            onPress={() => navigation.navigate('RepaymentSchedule', { loanId, chamaId })}
          />
          {route.params?.entryPoint === 'wallet' || route.params?.entryPoint === 'payments' ? (
            <Button
              title="Back to Wallet"
              variant="outline"
              onPress={() =>
                navigateToWorkspaceTab(navigation as any, 'Payments', {
                  chamaId,
                  entryPoint: route.params?.entryPoint === 'wallet' ? 'wallet' : 'tab',
                  preselectedPurpose: 'loan_repayment',
                  loanId,
                  installmentId: route.params?.installmentId,
                })
              }
            />
          ) : null}
          <Button
            title="Back to Active Loan"
            variant="ghost"
            onPress={() => navigation.navigate('LoanDetail', { loanId, chamaId })}
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
  content: {
    padding: spacing[5],
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
  },
  centerText: {
    marginTop: spacing[4],
    textAlign: 'center',
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    backgroundColor: '#0F2F22',
    ...shadows.md,
  },
  heroEyebrow: {
    color: '#9DE3BC',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[2],
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[2],
  },
  heroText: {
    color: '#D8F2E4',
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
    marginBottom: spacing[4],
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  dueBadgeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  summaryCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  entryCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    backgroundColor: '#F4FBF6',
    borderWidth: 1,
    borderColor: '#D6EEDC',
  },
  entryLabel: {
    color: colors.primary[700],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing[1],
  },
  entryText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingVertical: spacing[3],
  },
  label: {
    flex: 1,
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  value: {
    flex: 1,
    textAlign: 'right',
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  selectionCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[2],
  },
  helperText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    marginBottom: spacing[4],
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  choiceChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  choiceChipActive: {
    backgroundColor: colors.primary[500],
  },
  choiceChipText: {
    color: colors.neutral[700],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  choiceChipTextActive: {
    color: '#FFFFFF',
  },
  coverageCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#F6FBF8',
    borderWidth: 1,
    borderColor: '#DAEFE3',
  },
  coverageText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    marginBottom: spacing[3],
  },
  balanceAfterValue: {
    flex: 1,
    textAlign: 'right',
    color: colors.primary[700],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
  },
  actions: {
    gap: spacing[3],
  },
});

export default LoanRepaymentScreen;
