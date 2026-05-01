import React, { useEffect, useState } from 'react';
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
  memberLoanService,
  type MemberLoanWorkspace,
} from '@/services/memberLoanService';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';

import { getLoanEligibilityMeta } from './loanWorkflowShared';

type LoanEligibilityNavigationProp = NativeStackNavigationProp<MainStackParamList, 'LoanEligibility'>;
type LoanEligibilityRouteProp = RouteProp<MainStackParamList, 'LoanEligibility'>;

export const LoanEligibilityScreen: React.FC = () => {
  const navigation = useNavigation<LoanEligibilityNavigationProp>();
  const route = useRoute<LoanEligibilityRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const { setLastVisitedRoute } = useMemberLoanFlowStore();
  const chamaId = route.params?.chamaId || activeChamaId || undefined;

  const [workspace, setWorkspace] = useState<MemberLoanWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = async (showRefresh = false) => {
    if (!chamaId) {
      setWorkspace(null);
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
      const response = await memberLoanService.getWorkspace(chamaId);
      setWorkspace(response);
      setError(null);
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || '')
          : '';
      setError(message || 'We couldn’t load your loan details right now. Please try again.');
      setWorkspace(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLastVisitedRoute('LoanEligibility');
    void loadWorkspace();
  }, [chamaId, setLastVisitedRoute]);

  const currency = workspace?.summary.currency || activeChama?.currency || 'KES';
  const eligibility = workspace?.eligibility;
  const statusMeta = getLoanEligibilityMeta(eligibility?.state || 'unknown_loading');
  const policyChecks = eligibility?.policy_checks || [];
  const blockedChecks = policyChecks.filter((item) => !item.passed);
  const approvalRequirements = eligibility?.approval_requirements;
  const approvalPath = approvalRequirements?.approval_path || [];
  const savingsSummary = eligibility?.savings_summary;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Loan Eligibility" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Checking your loan eligibility...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Loan Eligibility" showBack />
        <EmptyState
          title="No chama selected"
          description="Choose a chama first so we can evaluate your eligibility."
          icon="people-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (error || !workspace || !eligibility) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Loan Eligibility" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Unable to load eligibility"
          description={error || 'We couldn’t load your eligibility right now. Please try again.'}
          icon="alert-circle-outline"
          style={styles.centerState}
          action={{ label: 'Try again', onPress: () => void loadWorkspace() }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Loan Eligibility" subtitle={activeChama?.name} showBack />

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
          <View style={styles.heroRow}>
            <View style={[styles.heroIcon, { backgroundColor: `${statusMeta.accent}18` }]}>
              <Icon name={statusMeta.icon as any} size={28} color={statusMeta.accent} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Eligibility status</Text>
              <Text style={styles.heroTitle}>{statusMeta.label}</Text>
              <Text style={styles.heroText}>
                {eligibility.state === 'eligible'
                  ? 'You can apply confidently with the limit shown below.'
                  : eligibility.state === 'partially_eligible'
                  ? 'You may qualify after improving the highlighted conditions.'
                  : 'You do not qualify for a new loan right now.'}
              </Text>
            </View>
            <Badge label={statusMeta.label} variant={statusMeta.tone} size="sm" />
          </View>

          <View style={styles.metricGrid}>
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Max eligible amount</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(eligibility.max_eligible_amount || '0', currency)}
              </Text>
            </Card>

            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Savings-based basis</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(eligibility.contribution_based_limit || '0', currency)}
              </Text>
            </Card>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Eligibility scores</Text>
          <View style={styles.metricGrid}>
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Repayment history</Text>
              <Text style={styles.metricValueSmall}>
                {eligibility.repayment_history_score || '0'} / 100
              </Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Contribution consistency</Text>
              <Text style={styles.metricValueSmall}>
                {eligibility.contribution_consistency_score || '0'} / 100
              </Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Estimated installment</Text>
              <Text style={styles.metricValueSmall}>
                {formatCurrency(eligibility.installment_estimate || '0', currency)}
              </Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Estimated total repayment</Text>
              <Text style={styles.metricValueSmall}>
                {formatCurrency(eligibility.total_repayment_estimate || '0', currency)}
              </Text>
            </Card>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Current financial standing</Text>
          <View style={styles.metricGrid}>
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Savings position</Text>
              <Text style={styles.metricValueSmall}>
                {formatCurrency(eligibility.current_financial_standing.savings_position || '0', currency)}
              </Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Contribution history</Text>
              <Text style={styles.metricValueSmall}>
                {eligibility.current_financial_standing.successful_contributions} successful cycles
              </Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Contribution compliance</Text>
              <Text style={styles.metricValueSmall}>
                {eligibility.current_financial_standing.contribution_compliance_percent || '0'}%
              </Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Outstanding obligations</Text>
              <Text style={styles.metricValueSmall}>
                {eligibility.current_financial_standing.active_loans_count} active loans
              </Text>
            </Card>
          </View>
        </Card>

        {savingsSummary ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Savings and loan basis</Text>
            <View style={styles.metricGrid}>
              <Card style={styles.metricCard}>
                <Text style={styles.metricLabel}>Eligible savings</Text>
                <Text style={styles.metricValueSmall}>
                  {formatCurrency(savingsSummary.eligible_personal_savings || '0', currency)}
                </Text>
              </Card>
              <Card style={styles.metricCard}>
                <Text style={styles.metricLabel}>Minimum savings</Text>
                <Text style={styles.metricValueSmall}>
                  {formatCurrency(savingsSummary.minimum_required_savings || '0', currency)}
                </Text>
              </Card>
              <Card style={styles.metricCard}>
                <Text style={styles.metricLabel}>Savings shortfall</Text>
                <Text style={styles.metricValueSmall}>
                  {formatCurrency(savingsSummary.savings_shortfall || '0', currency)}
                </Text>
              </Card>
              <Card style={styles.metricCard}>
                <Text style={styles.metricLabel}>Loan multiplier</Text>
                <Text style={styles.metricValueSmall}>
                  {savingsSummary.loan_multiplier || '0'}x savings
                </Text>
              </Card>
            </View>
          </Card>
        ) : null}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What affects eligibility</Text>
          <View style={styles.conditionList}>
            {eligibility.conditions.map((item) => (
              <View key={item.key} style={styles.conditionRow}>
                <View style={styles.conditionLabelRow}>
                  <Icon name="check-circle-outline" size={16} color={colors.primary[500]} />
                  <Text style={styles.conditionLabel}>{item.label}</Text>
                </View>
                <Text style={styles.conditionValue}>{String(item.value)}</Text>
              </View>
            ))}
          </View>
        </Card>

        {blockedChecks.length ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>What is blocking you</Text>
            <View style={styles.reasonList}>
              {blockedChecks.map((item) => (
                <View key={item.key} style={styles.reasonRow}>
                  <Icon name="close-circle-outline" size={16} color={colors.error} />
                  <View style={styles.checkCopy}>
                    <Text style={styles.reasonText}>{item.message}</Text>
                    <Text style={styles.checkMeta}>
                      Current: {String(item.actual)} • Required: {String(item.required)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Conditions and guidance</Text>
          <View style={styles.reasonList}>
            {eligibility.reasons.length ? (
              eligibility.reasons.map((item) => (
                <View key={item} style={styles.reasonRow}>
                  <Icon name="information-outline" size={16} color={colors.info} />
                  <Text style={styles.reasonText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.sectionText}>No additional blockers are affecting your application right now.</Text>
            )}
          </View>

          <View style={styles.guidanceBlock}>
            {eligibility.guidance.map((item) => (
              <View key={item} style={styles.reasonRow}>
                <Icon name="arrow-right-circle-outline" size={16} color={colors.success} />
                <Text style={styles.reasonText}>{item}</Text>
              </View>
            ))}
          </View>
        </Card>

        {eligibility.next_steps?.length ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>What you need to do</Text>
            <View style={styles.reasonList}>
              {eligibility.next_steps.map((item) => (
                <View key={item} style={styles.reasonRow}>
                  <Icon name="progress-check" size={16} color={colors.primary[500]} />
                  <Text style={styles.reasonText}>{item}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {eligibility.risk_notes?.length ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Risk notes</Text>
            <View style={styles.reasonList}>
              {eligibility.risk_notes.map((item) => (
                <View key={item} style={styles.reasonRow}>
                  <Icon name="alert-outline" size={16} color={colors.warning} />
                  <Text style={styles.reasonText}>{item}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Loan rules</Text>
          <Text style={styles.sectionText}>
            {workspace.loan_rules.frequency_summary}
          </Text>
          {workspace.loan_rules.default_product ? (
            <View style={styles.defaultProductRow}>
              <Badge label={workspace.loan_rules.default_product.name} variant="info" size="sm" />
              <Text style={styles.sectionText}>
                Interest {workspace.loan_rules.default_product.interest_rate}% • {workspace.loan_rules.default_product.min_duration_months}-{workspace.loan_rules.default_product.max_duration_months} months
              </Text>
            </View>
          ) : null}
        </Card>

        {approvalRequirements ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Review and approval path</Text>
            <View style={styles.reasonList}>
              {approvalRequirements.requires_guarantors ? (
                <View style={styles.reasonRow}>
                  <Icon name="account-check-outline" size={16} color={colors.info} />
                  <Text style={styles.reasonText}>
                    {approvalRequirements.required_guarantors || 0} guarantor(s) are required for this level of borrowing.
                  </Text>
                </View>
              ) : (
                <View style={styles.reasonRow}>
                  <Icon name="account-outline" size={16} color={colors.success} />
                  <Text style={styles.reasonText}>No guarantors are required at your current request range.</Text>
                </View>
              )}
              {approvalPath.length ? (
                <View style={styles.reasonRow}>
                  <Icon name="timeline-outline" size={16} color={colors.primary[500]} />
                  <Text style={styles.reasonText}>
                    Approval path: {approvalPath.map((item) => item.replace(/_/g, ' ')).join(' → ')}.
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>
        ) : null}

        <Button
          title={
            workspace.loan_rules.can_start_application && eligibility.state === 'eligible'
              ? 'Continue to Apply'
              : 'Back to Loans'
          }
          onPress={() => {
            if (workspace.loan_rules.can_start_application && eligibility.state === 'eligible') {
              navigation.navigate('RequestLoan', { chamaId });
              return;
            }
            navigation.navigate('MemberLoans', { chamaId });
          }}
        />
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
    gap: spacing[4],
    backgroundColor: '#F6FFFB',
    borderWidth: 1,
    borderColor: '#D6F5E8',
  },
  heroRow: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: spacing[1],
  },
  heroEyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[700],
    fontFamily: typography.fontFamily.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  heroText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
  },
  metricGrid: {
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
  metricValueSmall: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
  },
  sectionCard: {
    gap: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  sectionText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
  },
  conditionList: {
    gap: spacing[3],
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[4],
    alignItems: 'center',
  },
  conditionLabelRow: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'center',
    flex: 1,
  },
  conditionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
  },
  conditionValue: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    textAlign: 'right',
  },
  reasonList: {
    gap: spacing[2],
  },
  guidanceBlock: {
    gap: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  reasonRow: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'flex-start',
  },
  reasonText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.regular,
  },
  checkCopy: {
    flex: 1,
    gap: spacing[1],
  },
  checkMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
  },
  defaultProductRow: {
    gap: spacing[2],
  },
});
