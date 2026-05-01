import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { memberLoanService, normalizeLoanState } from '@/services/memberLoanService';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import { formatLoanPurposeLabel, getLoanStateMeta, getLoanStatusTone } from './loanWorkflowShared';
import {
  getRepaymentDueStateMeta,
  normalizeRepaymentDueState,
} from './memberLoanRepaymentWorkflowShared';

type LoanDetailNavigationProp = NativeStackNavigationProp<MainStackParamList, 'LoanDetail'>;
type LoanDetailRouteProp = RouteProp<MainStackParamList, 'LoanDetail'>;

export const LoanDetailScreen: React.FC = () => {
  const navigation = useNavigation<LoanDetailNavigationProp>();
  const route = useRoute<LoanDetailRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const { activeApplication, clearActiveApplication, setLastVisitedRoute } = useMemberLoanFlowStore();
  const chamaId = route.params?.chamaId || activeChamaId || undefined;
  const loanId = route.params.loanId;

  const [loan, setLoan] = useState<any | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      if (activeApplication?.createdLoanId === loanId) {
        clearActiveApplication();
      }
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
    setLastVisitedRoute('LoanDetail');
    void loadLoan();
  }, [chamaId, loanId, setLastVisitedRoute]);

  const currency = activeChama?.currency || 'KES';
  const loanState = normalizeLoanState(loan?.status || '');
  const loanMeta = getLoanStateMeta(loanState);
  const progressPercent = useMemo(() => {
    if (!loan) {
      return 0;
    }
    const principal = Number(loan.principal || 0);
    const outstanding = Number(loan.outstanding_principal || 0);
    if (!principal) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(((principal - outstanding) / principal) * 100)));
  }, [loan]);
  const nextInstallment = schedule.find((item) => item.status !== 'paid') || null;
  const overdueInstallment = schedule.find((item) => String(item.status || '').toLowerCase() === 'overdue') || null;
  const dueMeta = getRepaymentDueStateMeta(normalizeRepaymentDueState(nextInstallment?.status));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Active Loan" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading your loan details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId || !loanId || error || !loan) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Active Loan" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Unable to load active loan"
          description={error || 'We couldn’t load your loan details right now. Please try again.'}
          icon="alert-circle-outline"
          style={styles.centerState}
          action={{ label: 'Back to Loans', onPress: () => navigation.navigate('MemberLoans', { chamaId }) }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Active Loan" subtitle={activeChama?.name} showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadLoan(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroEyebrow}>{loan.loan_product?.name || 'Member loan'}</Text>
              <Text style={styles.heroTitle}>{formatCurrency(loan.outstanding_principal || loan.total_due || '0', currency)}</Text>
              <Text style={styles.heroText}>{formatLoanPurposeLabel(loan.purpose)}</Text>
            </View>
            <Badge label={loanMeta.label} variant={getLoanStatusTone(loan.status)} size="sm" />
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.progressMeta}>Repayment progress</Text>
            <Text style={styles.progressMeta}>{progressPercent}% repaid</Text>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Loan details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Approved amount</Text>
            <Text style={styles.detailValue}>{formatCurrency(loan.principal, currency)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Outstanding balance</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(loan.total_due || loan.outstanding_principal || '0', currency)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Repayment period</Text>
            <Text style={styles.detailValue}>{loan.duration_months} months</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Interest</Text>
            <Text style={styles.detailValue}>{loan.interest_rate}% {loan.interest_type}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Approved / disbursed</Text>
            <Text style={styles.detailValue}>
              {loan.disbursed_at ? formatDate(loan.disbursed_at) : loan.approved_at ? formatDate(loan.approved_at) : 'Pending'}
            </Text>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Next repayment due</Text>
          {nextInstallment ? (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Installment amount</Text>
                <Text style={styles.detailValue}>{formatCurrency(nextInstallment.expected_amount, currency)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Due date</Text>
                <Text style={styles.detailValue}>{formatDate(nextInstallment.due_date)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Badge label={nextInstallment.status} variant={getLoanStatusTone(nextInstallment.status)} size="sm" />
              </View>
              <Text style={styles.helperText}>{dueMeta.description}</Text>
            </>
          ) : (
            <Text style={styles.helperText}>No unpaid installment is due right now.</Text>
          )}
        </Card>

        {overdueInstallment ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Overdue repayment</Text>
            <Text style={styles.helperText}>
              You have an overdue installment of {formatCurrency(overdueInstallment.expected_amount, currency)} from {formatDate(overdueInstallment.due_date)}.
            </Text>
            <Button
              title="View Overdue State"
              variant="outline"
              onPress={() =>
                navigation.navigate('OverdueRepayment', {
                  loanId,
                  chamaId,
                  installmentId: overdueInstallment.id,
                })
              }
            />
          </Card>
        ) : null}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Repayment preview</Text>
          {schedule.length ? (
            schedule.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.scheduleRow}>
                <View>
                  <Text style={styles.scheduleTitle}>{formatDate(item.due_date)}</Text>
                  <Text style={styles.scheduleMeta}>{formatCurrency(item.expected_amount, currency)}</Text>
                </View>
                <Badge label={item.status} variant={getLoanStatusTone(item.status)} size="sm" />
              </View>
            ))
          ) : (
            <Text style={styles.helperText}>Your repayment schedule will appear here once installments are available.</Text>
          )}
        </Card>

        <View style={styles.actionColumn}>
          {loanState === 'completed' ? (
            <Button
              title="View Repayment History"
              onPress={() => navigation.navigate('LoanRepaymentHistory', { loanId, chamaId })}
            />
          ) : (
            <Button
              title={overdueInstallment ? 'Repay Overdue Installment' : 'Repay Loan'}
              onPress={() =>
                navigation.navigate('LoanRepayment', {
                  loanId,
                  chamaId,
                  installmentId: overdueInstallment?.id || nextInstallment?.id,
                  amount:
                    overdueInstallment?.expected_amount ||
                    nextInstallment?.expected_amount ||
                    loan.total_due ||
                    loan.outstanding_principal,
                  dueDate: overdueInstallment?.due_date || nextInstallment?.due_date || loan.due_date || undefined,
                  targetLabel: overdueInstallment
                    ? `Overdue installment from ${formatDate(overdueInstallment.due_date)}`
                    : nextInstallment
                    ? `Installment due ${formatDate(nextInstallment.due_date)}`
                    : 'Active loan repayment',
                  entryPoint: 'loan_detail',
                })
              }
            />
          )}
          <Button
            title="Repayment Schedule"
            variant="outline"
            onPress={() => navigation.navigate('RepaymentSchedule', { loanId, chamaId })}
          />
          {loanState !== 'completed' ? (
            <Button
              title="Repayment History"
              variant="ghost"
              onPress={() => navigation.navigate('LoanRepaymentHistory', { loanId, chamaId })}
            />
          ) : null}
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
  heroCard: {
    gap: spacing[3],
    backgroundColor: '#F7FFFA',
    borderWidth: 1,
    borderColor: '#D8F5E8',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  heroEyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[700],
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  heroText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
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
  },
  progressMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
  },
  sectionCard: {
    gap: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[4],
    alignItems: 'center',
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
  helperText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  scheduleTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
  },
  scheduleMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
  },
  actionColumn: {
    gap: spacing[3],
  },
  sectionLink: {
    color: colors.primary[600],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
});
