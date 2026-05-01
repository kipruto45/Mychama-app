import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { memberLoanService } from '@/services/memberLoanService';
import {
  memberPaymentsService,
  type MemberPaymentHistoryItem,
} from '@/services/memberPaymentsService';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';

import {
  filterLoanRepaymentHistory,
  isLoanRepaymentPayment,
} from './memberLoanRepaymentWorkflowShared';
import { getPaymentMethodDisplay, getPaymentStateMeta } from './memberPaymentsWorkflowShared';

type LoanRepaymentHistoryNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'LoanRepaymentHistory'
>;
type LoanRepaymentHistoryRouteProp = RouteProp<MainStackParamList, 'LoanRepaymentHistory'>;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'success', label: 'Successful' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
] as const;

export const LoanRepaymentHistoryScreen: React.FC = () => {
  const navigation = useNavigation<LoanRepaymentHistoryNavigationProp>();
  const route = useRoute<LoanRepaymentHistoryRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const { setActiveLoanId, setLastVisitedRoute } = useMemberLoanFlowStore();
  const chamaId = route.params?.chamaId || activeChamaId || undefined;
  const loanId = route.params?.loanId;

  const [loan, setLoan] = useState<any | null>(null);
  const [history, setHistory] = useState<MemberPaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

  useEffect(() => {
    setLastVisitedRoute('LoanRepaymentHistory');
    setActiveLoanId(loanId || null);
  }, [loanId, setActiveLoanId, setLastVisitedRoute]);

  const loadHistory = async (showRefresh = false) => {
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
      const [loanResponse, paymentHistory] = await Promise.all([
        memberLoanService.getActiveLoanDetail(chamaId, loanId).catch(() => null),
        memberPaymentsService.getPaymentHistory(chamaId),
      ]);
      setLoan(loanResponse);
      setHistory(filterLoanRepaymentHistory(paymentHistory, loanId));
      setError(null);
    } catch {
      setError('We couldn’t load your loan details right now. Please try again.');
      setHistory([]);
      setLoan(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, [chamaId, loanId]);

  const filteredHistory = useMemo(
    () =>
      history.filter((item) => {
        if (!isLoanRepaymentPayment(item)) {
          return false;
        }
        if (filter === 'success') {
          return item.processingState === 'success';
        }
        if (filter === 'pending') {
          return ['pending', 'initiated', 'processing'].includes(item.processingState);
        }
        if (filter === 'failed') {
          return ['failed', 'cancelled', 'expired'].includes(item.processingState);
        }
        return true;
      }),
    [filter, history]
  );

  const totalSuccessful = useMemo(
    () =>
      history
        .filter((item) => item.processingState === 'success')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0)
        .toFixed(2),
    [history]
  );

  const openHistoryItem = (item: MemberPaymentHistoryItem) => {
    if (item.processingState === 'success' && item.receiptAvailable) {
      navigation.navigate('Receipt', {
        intentId: item.intentId,
        chamaId,
        paymentPurposeType: 'loan_repayment',
        paymentPurposeLabel: item.purposeLabel,
        loanId: item.loanId || undefined,
        installmentId: item.installmentId || undefined,
        targetLabel: item.targetLabel,
      });
      return;
    }

    if (['pending', 'initiated', 'processing'].includes(item.processingState)) {
      navigation.navigate('PendingPaymentDetail', {
        intentId: item.intentId,
        chamaId,
        amount: item.amount,
        currency: item.currency,
        purpose: item.purpose,
        paymentPurposeType: 'loan_repayment',
        paymentPurposeLabel: item.purposeLabel,
        loanId: item.loanId || undefined,
        installmentId: item.installmentId || undefined,
        targetLabel: item.targetLabel,
        paymentMethod: item.paymentMethod,
      });
      return;
    }

    navigation.navigate('PaymentStatus', {
      intentId: item.intentId,
      chamaId,
      status: item.status,
      amount: item.amount,
      currency: item.currency,
      purpose: item.purpose,
      paymentPurposeType: 'loan_repayment',
      paymentPurposeLabel: item.purposeLabel,
      loanId: item.loanId || undefined,
      installmentId: item.installmentId || undefined,
      targetLabel: item.targetLabel,
      paymentMethod: item.paymentMethod,
      reference: item.reference,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Repayment History" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading your repayment history…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId || !loanId || error) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Repayment History" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Unable to load repayment history"
          description={error || 'We couldn’t load your repayment records right now. Please try again.'}
          icon="history"
          style={styles.centerState}
          action={{
            label: loanId ? 'Back to Loan' : 'Back to Loans',
            onPress: () => {
              if (loanId) {
                navigation.navigate('LoanDetail', { loanId, chamaId });
                return;
              }
              navigation.navigate('MemberLoans', { chamaId });
            },
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Repayment History" subtitle={activeChama?.name} showBack />
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadHistory(true)}
            tintColor={colors.primary[500]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total recorded repayments</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalSuccessful, activeChama?.currency || 'KES')}
              </Text>
              <Text style={styles.summaryText}>
                Track successful, pending, and failed loan repayment attempts in one place.
              </Text>
            </Card>

            <View style={styles.filterRow}>
              {FILTERS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.85}
                  style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
                  onPress={() => setFilter(item.key)}
                >
                  <Text
                    style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No repayments yet"
            description="Your successful, pending, and failed loan repayments will appear here."
            icon="cash-sync"
          />
        }
        renderItem={({ item }) => {
          const stateMeta = getPaymentStateMeta(item.processingState);
          return (
            <TouchableOpacity activeOpacity={0.85} onPress={() => openHistoryItem(item)}>
              <Card style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <View style={styles.historyIcon}>
                    <Icon name="cash-sync" size={18} color={colors.primary[600]} />
                  </View>
                  <View style={styles.historyCopy}>
                    <Text style={styles.historyTitle}>{item.purposeLabel || 'Loan repayment'}</Text>
                    <Text style={styles.historyMeta}>{formatDateTime(item.date)}</Text>
                    <Text style={styles.historySubMeta}>{getPaymentMethodDisplay(item.paymentMethod)}</Text>
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>
                    {formatCurrency(item.amount, item.currency)}
                  </Text>
                  <Badge label={stateMeta.chipLabel} variant={stateMeta.chipVariant} size="sm" />
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <View style={styles.footerActions}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('LoanDetail', { loanId, chamaId })}
            >
              <Text style={styles.footerLink}>Back to Active Loan</Text>
            </TouchableOpacity>
            {loan ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('LoanRepayment', { loanId, chamaId, entryPoint: 'loan_detail' })}
              >
                <Text style={styles.footerLink}>Repay Again</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />
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
    justifyContent: 'center',
  },
  centerText: {
    marginTop: spacing[4],
    textAlign: 'center',
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[3],
  },
  headerContent: {
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  summaryCard: {
    backgroundColor: '#F7FFFA',
    borderWidth: 1,
    borderColor: '#D7F1E3',
  },
  summaryLabel: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[2],
  },
  summaryValue: {
    color: colors.neutral[900],
    fontSize: 28,
    lineHeight: 34,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[2],
  },
  summaryText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterChipText: {
    color: colors.neutral[700],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    alignItems: 'center',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAF7F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCopy: {
    flex: 1,
  },
  historyTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  historyMeta: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  historySubMeta: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.xs,
    marginTop: spacing[1],
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  historyAmount: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
  },
  footerActions: {
    marginTop: spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLink: {
    color: colors.primary[600],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
});

export default LoanRepaymentHistoryScreen;
