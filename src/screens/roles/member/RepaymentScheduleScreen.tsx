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

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { memberLoanService } from '@/services/memberLoanService';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import {
  getInstallmentStateMeta,
  normalizeInstallmentState,
} from './memberLoanRepaymentWorkflowShared';

type RepaymentScheduleNavigationProp = NativeStackNavigationProp<MainStackParamList, 'RepaymentSchedule'>;
type RepaymentScheduleRouteProp = RouteProp<MainStackParamList, 'RepaymentSchedule'>;

export const RepaymentScheduleScreen: React.FC = () => {
  const navigation = useNavigation<RepaymentScheduleNavigationProp>();
  const route = useRoute<RepaymentScheduleRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const { setLastVisitedRoute } = useMemberLoanFlowStore();
  const chamaId = route.params?.chamaId || activeChamaId || undefined;
  const loanId = route.params?.loanId;

  const [loan, setLoan] = useState<any | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = async (showRefresh = false) => {
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
        memberLoanService.getRepaymentSchedule(loanId),
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
    setLastVisitedRoute('RepaymentSchedule');
    void loadSchedule();
  }, [chamaId, loanId, setLastVisitedRoute]);

  const currency = activeChama?.currency || 'KES';
  const remainingBalance = useMemo(
    () => loan?.total_due || loan?.outstanding_principal || '0',
    [loan]
  );
  const unpaidCount = useMemo(
    () => schedule.filter((item) => item.status !== 'paid').length,
    [schedule]
  );
  const nextInstallment = useMemo(
    () => schedule.find((item) => item.status !== 'paid') || null,
    [schedule]
  );
  const overdueInstallment = useMemo(
    () => schedule.find((item) => String(item.status || '').toLowerCase() === 'overdue') || null,
    [schedule]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Repayment Schedule" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading repayment schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId || !loanId || error || !loan) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Repayment Schedule" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Unable to load schedule"
          description={error || 'We couldn’t load your loan details right now. Please try again.'}
          icon="calendar-outline"
          style={styles.centerState}
          action={{ label: 'Back to Loans', onPress: () => navigation.navigate('MemberLoans', { chamaId }) }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Repayment Schedule" subtitle={activeChama?.name} showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadSchedule(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Schedule summary</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Remaining balance</Text>
            <Text style={styles.detailValue}>{formatCurrency(remainingBalance, currency)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Installments left</Text>
            <Text style={styles.detailValue}>{String(unpaidCount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Repayment period</Text>
            <Text style={styles.detailValue}>{loan.duration_months} months</Text>
          </View>
        </Card>

        {schedule.length ? (
          schedule.map((item) => {
            const installmentMeta = getInstallmentStateMeta(normalizeInstallmentState(item));
            const isPayable = item.status !== 'paid';

            return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={isPayable ? 0.86 : 1}
              onPress={() => {
                if (!isPayable) {
                  return;
                }

                navigation.navigate('LoanRepayment', {
                  loanId,
                  chamaId,
                  installmentId: item.id,
                  amount: item.expected_amount || remainingBalance,
                  dueDate: item.due_date,
                  targetLabel: `Installment due ${formatDate(item.due_date)}`,
                  quickAmountOption: 'next_due',
                  entryPoint: 'repayment_schedule',
                });
              }}
            >
            <Card style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <View>
                  <Text style={styles.scheduleTitle}>{formatDate(item.due_date)}</Text>
                  <Text style={styles.scheduleMeta}>
                    {formatCurrency(item.expected_amount, currency)}
                  </Text>
                </View>
                <Badge label={installmentMeta.label} variant={installmentMeta.tone} size="sm" />
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Paid amount</Text>
                <Text style={styles.detailValue}>{formatCurrency(item.paid_amount || '0', currency)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>{installmentMeta.label}</Text>
              </View>
              {isPayable ? (
                <Text style={styles.installmentHint}>
                  Tap to continue with this installment.
                </Text>
              ) : null}
            </Card>
            </TouchableOpacity>
          )})
        ) : (
          <EmptyState
            title="No schedule available"
            description="Repayment schedule entries will appear here once your installments are generated."
            icon="calendar-outline"
          />
        )}

        <View style={styles.actionColumn}>
          <Button
            title="Repay Loan"
            onPress={() =>
              navigation.navigate('LoanRepayment', {
                loanId,
                chamaId,
                installmentId: nextInstallment?.id,
                amount: nextInstallment?.expected_amount || remainingBalance,
                dueDate: nextInstallment?.due_date,
                targetLabel: nextInstallment
                  ? `Installment due ${formatDate(nextInstallment.due_date)}`
                  : 'Active loan repayment',
                entryPoint: 'repayment_schedule',
              })
            }
          />
          {overdueInstallment ? (
            <Button
              title="Overdue Repayment"
              variant="outline"
              onPress={() =>
                navigation.navigate('OverdueRepayment', {
                  loanId,
                  chamaId,
                  installmentId: overdueInstallment.id,
                })
              }
            />
          ) : null}
          <Button
            title="Repayment History"
            variant="outline"
            onPress={() =>
              navigation.navigate('LoanRepaymentHistory', {
                loanId,
                chamaId,
              })
            }
          />
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
  centerText: {
    marginTop: spacing[3],
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  summaryCard: {
    gap: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  scheduleCard: {
    gap: spacing[3],
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    alignItems: 'center',
  },
  scheduleTitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
  },
  scheduleMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
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
  installmentHint: {
    color: colors.primary[700],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  actionColumn: {
    gap: spacing[3],
  },
});
