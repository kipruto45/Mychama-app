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
import {
  calculateLoanEstimate,
  memberLoanService,
  normalizeApplicationState,
} from '@/services/memberLoanService';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import { getLoanApplicationMeta } from './loanWorkflowShared';

type LoanApplicationDetailsNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'LoanApplicationDetails'
>;
type LoanApplicationDetailsRouteProp = RouteProp<MainStackParamList, 'LoanApplicationDetails'>;

export const LoanApplicationDetailsScreen: React.FC = () => {
  const navigation = useNavigation<LoanApplicationDetailsNavigationProp>();
  const route = useRoute<LoanApplicationDetailsRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const {
    activeApplication,
    clearActiveApplication,
    setActiveApplication,
    setLastVisitedRoute,
  } = useMemberLoanFlowStore();

  const chamaId = route.params?.chamaId || activeApplication?.chamaId || activeChamaId || undefined;
  const applicationId = route.params?.applicationId || activeApplication?.applicationId || undefined;

  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApplication = async (showRefresh = false) => {
    if (!chamaId || !applicationId) {
      setLoading(false);
      return;
    }

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await memberLoanService.getApplicationDetail(chamaId, applicationId);
      setApplication(response);
      setError(null);

      const normalized = normalizeApplicationState(response.status);
      if (normalized === 'submitted_pending_review') {
        setActiveApplication({
          applicationId: response.id,
          chamaId,
          amount: response.requested_amount,
          status: response.status,
          reference: `APP-${response.id.split('-')[0].toUpperCase()}`,
          submittedAt: response.submitted_at,
          createdLoanId: response.created_loan || null,
        });
      } else {
        clearActiveApplication();
      }
    } catch {
      setError('We couldn’t load your loan details right now. Please try again.');
      setApplication(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLastVisitedRoute('LoanApplicationDetails');
    void loadApplication();
  }, [applicationId, chamaId, setLastVisitedRoute]);

  const state = normalizeApplicationState(application?.status || '');
  const meta = getLoanApplicationMeta(state);
  const estimate = useMemo(() => {
    if (!application) {
      return calculateLoanEstimate({
        amount: '0',
        durationMonths: 0,
        interestRate: '0',
      });
    }

    return calculateLoanEstimate({
      amount: application.requested_amount,
      durationMonths: application.requested_term_months,
      interestRate: application.loan_product?.interest_rate || '0',
      interestType: application.loan_product?.interest_type,
    });
  }, [application]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Application Details" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading application details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId || !applicationId || error || !application) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Application Details" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Unable to load application"
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
      <ModernHeader title="Application Details" subtitle={activeChama?.name} showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadApplication(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.statusTitle}>Application reference</Text>
              <Text style={styles.statusValue}>APP-{application.id.split('-')[0].toUpperCase()}</Text>
            </View>
            <Badge label={meta.label} variant={meta.tone} size="sm" />
          </View>
          <Text style={styles.statusText}>
            {state === 'submitted_pending_review'
              ? 'Your application is still under review.'
              : state === 'approved'
              ? 'This application has moved into an approved loan.'
              : 'This application was not approved.'}
          </Text>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Request details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(application.requested_amount, activeChama?.currency || 'KES')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purpose</Text>
            <Text style={styles.detailValue}>{application.purpose || 'General purpose'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{application.requested_term_months} months</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Submitted</Text>
            <Text style={styles.detailValue}>{formatDate(application.submitted_at)}</Text>
          </View>
          {application.reviewed_at ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last reviewed</Text>
              <Text style={styles.detailValue}>{formatDate(application.reviewed_at)}</Text>
            </View>
          ) : null}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Repayment estimate</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated installment</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(estimate.installmentAmount, activeChama?.currency || 'KES')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated total repayment</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(estimate.totalRepayment, activeChama?.currency || 'KES')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Eligibility summary</Text>
            <Text style={styles.detailValue}>
              Recommended up to {formatCurrency(application.recommended_max_amount || '0', activeChama?.currency || 'KES')}
            </Text>
          </View>
        </Card>

        {(application.approval_requirements || application.approval_logs?.length) ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Review timeline</Text>
            {application.approval_requirements?.approval_path?.length ? (
              <Text style={styles.statusText}>
                Approval path: {application.approval_requirements.approval_path
                  .map((item: string) => item.replace(/_/g, ' '))
                  .join(' → ')}.
              </Text>
            ) : null}
            <View style={styles.timelineList}>
              {(application.approval_logs || []).map((item: any) => (
                <View key={item.id} style={styles.timelineRow}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineCopy}>
                    <Text style={styles.detailValue}>
                      {String(item.stage || '').replace(/_/g, ' ')}: {String(item.decision || '').replace(/_/g, ' ')}
                    </Text>
                    <Text style={styles.detailLabel}>
                      {item.acted_at ? formatDate(item.acted_at) : 'Pending'}{item.note ? ` • ${item.note}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {(application.savings_balance_at_application || application.repayment_history_score || application.contribution_consistency_score) ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Eligibility snapshot at submission</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Savings basis</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(application.savings_balance_at_application || '0', activeChama?.currency || 'KES')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contribution count</Text>
              <Text style={styles.detailValue}>{application.contribution_count_at_application || 0}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Repayment history score</Text>
              <Text style={styles.detailValue}>{application.repayment_history_score || '0'} / 100</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contribution consistency score</Text>
              <Text style={styles.detailValue}>{application.contribution_consistency_score || '0'} / 100</Text>
            </View>
            {application.next_steps?.length ? (
              <View style={styles.timelineList}>
                {application.next_steps.map((item: string) => (
                  <View key={item} style={styles.timelineRow}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineCopy}>
                      <Text style={styles.statusText}>{item}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        ) : null}

        {application.rejection_reason ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Supporting note</Text>
            <Text style={styles.statusText}>{application.rejection_reason}</Text>
          </Card>
        ) : null}

        {state === 'approved' && application.created_loan ? (
          <View style={styles.actionColumn}>
            <Button
              title="Open Active Loan"
              onPress={() =>
                navigation.replace('LoanDetail', {
                  loanId: application.created_loan as string,
                  chamaId,
                })
              }
            />
            <Button
              title="Repayment Schedule"
              variant="outline"
              onPress={() =>
                navigation.navigate('RepaymentSchedule', {
                  loanId: application.created_loan as string,
                  chamaId,
                })
              }
            />
          </View>
        ) : state === 'rejected' ? (
          <View style={styles.actionColumn}>
            <Button
              title="View Rejection"
              onPress={() =>
                navigation.replace('RejectedApplicationState', {
                  applicationId: application.id,
                  chamaId,
                })
              }
            />
            <Button
              title="Back to Loans"
              variant="outline"
              onPress={() => navigation.navigate('MemberLoans', { chamaId })}
            />
          </View>
        ) : (
          <View style={styles.actionColumn}>
            <Button
              title="Back to Loans"
              onPress={() => navigation.navigate('MemberLoans', { chamaId })}
            />
            <Button
              title="Refresh Status"
              variant="outline"
              onPress={() => void loadApplication(true)}
            />
          </View>
        )}
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
  statusCard: {
    gap: spacing[3],
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
  },
  statusValue: {
    fontSize: typography.fontSize.xl,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
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
  actionColumn: {
    gap: spacing[3],
  },
  timelineList: {
    gap: spacing[3],
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primary[500],
    marginTop: 6,
  },
  timelineCopy: {
    flex: 1,
    gap: spacing[1],
  },
});
