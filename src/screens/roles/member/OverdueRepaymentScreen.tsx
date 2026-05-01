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
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
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
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import { sumInstallments } from './memberLoanRepaymentWorkflowShared';

type OverdueRepaymentNavigationProp = NativeStackNavigationProp<MainStackParamList, 'OverdueRepayment'>;
type OverdueRepaymentRouteProp = RouteProp<MainStackParamList, 'OverdueRepayment'>;

export const OverdueRepaymentScreen: React.FC = () => {
  const navigation = useNavigation<OverdueRepaymentNavigationProp>();
  const route = useRoute<OverdueRepaymentRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const { setActiveLoanId, setLastVisitedRoute } = useMemberLoanFlowStore();
  const chamaId = route.params?.chamaId || activeChamaId || undefined;
  const loanId = route.params.loanId;

  const [loan, setLoan] = useState<any | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLastVisitedRoute('OverdueRepayment');
    setActiveLoanId(loanId || null);
  }, [loanId, setActiveLoanId, setLastVisitedRoute]);

  const loadOverdue = async (showRefresh = false) => {
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
    void loadOverdue();
  }, [chamaId, loanId]);

  const overdueInstallments = useMemo(
    () => schedule.filter((item) => String(item.status || '').toLowerCase() === 'overdue'),
    [schedule]
  );
  const overdueAmount = useMemo(() => sumInstallments(overdueInstallments), [overdueInstallments]);
  const firstOverdue = overdueInstallments[0] || null;
  const currency = activeChama?.currency || 'KES';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Overdue Repayment" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading overdue repayment details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId || !loanId || error || !loan) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Overdue Repayment" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Unable to load overdue repayment"
          description={error || 'We couldn’t load your loan details right now. Please try again.'}
          icon="alert-circle-outline"
          style={styles.centerState}
          action={{
            label: 'Back to Loans',
            onPress: () => navigation.navigate('MemberLoans', { chamaId }),
          }}
        />
      </SafeAreaView>
    );
  }

  if (!overdueInstallments.length) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Overdue Repayment" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="No overdue repayment right now."
          description="Your loan does not have overdue installments at the moment."
          icon="check-circle-outline"
          style={styles.centerState}
          action={{
            label: 'Back to Active Loan',
            onPress: () => navigation.navigate('LoanDetail', { loanId, chamaId }),
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Overdue Repayment" subtitle={activeChama?.name} showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadOverdue(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        <Card style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Icon name="alert-circle" size={30} color={colors.warning} />
          </View>
          <Text style={styles.heroTitle}>You have an overdue repayment.</Text>
          <Text style={styles.heroText}>
            Review the overdue amount and continue into repayment when you are ready.
          </Text>
          <Badge label="Overdue" variant="error" size="sm" />
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Overdue amount</Text>
            <Text style={styles.value}>{formatCurrency(overdueAmount, currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Overdue installments</Text>
            <Text style={styles.value}>{String(overdueInstallments.length)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Outstanding balance</Text>
            <Text style={styles.value}>
              {formatCurrency(loan.total_due || loan.outstanding_principal || '0', currency)}
            </Text>
          </View>
        </Card>

        <Card style={styles.listCard}>
          <Text style={styles.sectionTitle}>Overdue schedule</Text>
          {overdueInstallments.map((item) => (
            <View key={item.id} style={styles.installmentRow}>
              <View>
                <Text style={styles.installmentTitle}>{formatDate(item.due_date)}</Text>
                <Text style={styles.installmentMeta}>
                  {formatCurrency(item.expected_amount, currency)}
                </Text>
              </View>
              <Badge label="Overdue" variant="error" size="sm" />
            </View>
          ))}
        </Card>

        <Card style={styles.guidanceCard}>
          <Text style={styles.sectionTitle}>What to do next</Text>
          <Text style={styles.guidanceText}>
            Repay the overdue installment first or review the full schedule to understand what remains due.
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Repay Now"
            onPress={() =>
              navigation.navigate('LoanRepayment', {
                loanId,
                chamaId,
                installmentId: route.params?.installmentId || firstOverdue?.id,
                amount: firstOverdue?.expected_amount || overdueAmount,
                dueDate: firstOverdue?.due_date,
                quickAmountOption: 'next_due',
                entryPoint: 'alerts',
              })
            }
          />
          <Button
            title="View Schedule"
            variant="outline"
            onPress={() => navigation.navigate('RepaymentSchedule', { loanId, chamaId })}
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
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#F4D9A7',
    ...shadows.md,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF1D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  heroTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  heroText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
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
  listCard: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[3],
  },
  installmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
  },
  installmentTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  installmentMeta: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  guidanceCard: {
    backgroundColor: '#F7FFFA',
    borderWidth: 1,
    borderColor: '#D7F1E3',
  },
  guidanceText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
  },
  actions: {
    gap: spacing[3],
  },
});

export default OverdueRepaymentScreen;
