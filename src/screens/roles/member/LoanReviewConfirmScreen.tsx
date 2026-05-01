import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  type MemberLoanWorkspace,
} from '@/services/memberLoanService';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import type { LoanEligibilityPreview } from '@/types';
import { formatCurrency } from '@/utils/format';

import { getLoanEligibilityMeta } from './loanWorkflowShared';

type LoanReviewConfirmNavigationProp = NativeStackNavigationProp<MainStackParamList, 'LoanReviewConfirm'>;
type LoanReviewConfirmRouteProp = RouteProp<MainStackParamList, 'LoanReviewConfirm'>;

export const LoanReviewConfirmScreen: React.FC = () => {
  const navigation = useNavigation<LoanReviewConfirmNavigationProp>();
  const route = useRoute<LoanReviewConfirmRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const {
    clearDraft,
    draft,
    setActiveApplication,
    setLastVisitedRoute,
  } = useMemberLoanFlowStore();
  const chamaId = route.params?.chamaId || draft?.chamaId || activeChamaId || undefined;

  const [workspace, setWorkspace] = useState<MemberLoanWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<LoanEligibilityPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLastVisitedRoute('LoanReviewConfirm');
  }, [setLastVisitedRoute]);

  useEffect(() => {
    if (!chamaId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const loadWorkspace = async () => {
      try {
        const response = await memberLoanService.getWorkspace(chamaId);
        if (!mounted) {
          return;
        }
        setWorkspace(response);
      } catch {
        if (mounted) {
          setWorkspace(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadWorkspace();
    return () => {
      mounted = false;
    };
  }, [chamaId]);

  const selectedProduct =
    workspace?.loan_rules.available_products.find((item) => item.id === draft?.loanProductId) ||
    workspace?.loan_rules.default_product ||
    null;
  const currency = workspace?.summary.currency || activeChama?.currency || 'KES';
  const estimate = useMemo(() => {
    return calculateLoanEstimate({
      amount: draft?.amount || '0',
      durationMonths: draft?.durationMonths || 0,
      interestRate: selectedProduct?.interest_rate || '0',
      interestType: selectedProduct?.interest_type,
    });
  }, [draft?.amount, draft?.durationMonths, selectedProduct?.interest_rate, selectedProduct?.interest_type]);

  useEffect(() => {
    if (!draft?.amount || !draft.durationMonths || !chamaId) {
      setPreviewLoading(false);
      return;
    }

    let mounted = true;
    const runPreview = async () => {
      try {
        setPreviewLoading(true);
        const result = await memberLoanService.previewEligibility(chamaId, {
          amount: draft.amount || '0',
          durationMonths: draft.durationMonths || 0,
          purpose: draft.purpose || '',
          loanProductId: draft.loanProductId || undefined,
        });
        if (!mounted) {
          return;
        }
        setPreviewResult(result);
        setPreviewError(null);
      } catch {
        if (mounted) {
          setPreviewResult(null);
          setPreviewError('We couldn’t confirm your loan request right now.');
        }
      } finally {
        if (mounted) {
          setPreviewLoading(false);
        }
      }
    };

    void runPreview();
    return () => {
      mounted = false;
    };
  }, [chamaId, draft?.amount, draft?.durationMonths, draft?.loanProductId, draft?.purpose]);

  const canSubmit =
    !!draft?.amount &&
    !!draft?.durationMonths &&
    !!draft?.purpose &&
    !previewLoading &&
    !previewError &&
    !!previewResult?.eligible;
  const statusMeta = getLoanEligibilityMeta(
    previewLoading
      ? 'unknown_loading'
      : previewResult?.eligible
      ? 'eligible'
      : Number(previewResult?.recommended_max_amount || 0) > 0
      ? 'partially_eligible'
      : 'not_eligible'
  );

  const handleSubmit = async () => {
    if (!canSubmit || !chamaId || !draft?.amount || !draft.durationMonths || !draft.purpose) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await memberLoanService.submitApplication(chamaId, {
        amount: draft.amount,
        durationMonths: draft.durationMonths,
        purpose: draft.purpose,
        note: draft.note,
        loanProductId: draft.loanProductId || undefined,
      });

      setActiveApplication({
        applicationId: response.id,
        chamaId,
        amount: response.requested_amount,
        status: response.status,
        reference: `APP-${response.id.split('-')[0].toUpperCase()}`,
        submittedAt: response.submitted_at,
        createdLoanId: response.created_loan || null,
      });
      clearDraft();
      navigation.replace('LoanSubmissionResult', {
        chamaId,
        applicationId: response.id,
      });
    } catch {
      navigation.replace('LoanSubmissionResult', {
        chamaId,
        status: 'failed',
        errorMessage: 'We couldn’t submit your application right now.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Review Request" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Preparing your review...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!draft?.amount || !draft.durationMonths || !draft.purpose || !chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Review Request" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="No loan draft found"
          description="Start a loan application first so you can review the request before submitting."
          icon="document-text-outline"
          style={styles.centerState}
          action={{ label: 'Start application', onPress: () => navigation.replace('RequestLoan', { chamaId }) }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Review Request" subtitle={activeChama?.name} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={[styles.heroIcon, { backgroundColor: `${statusMeta.accent}16` }]}>
              <Icon name={statusMeta.icon as any} size={24} color={statusMeta.accent} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Review your loan request before submitting.</Text>
              <Text style={styles.heroText}>
                This screen confirms the amount, purpose, repayment terms, and the latest eligibility estimate.
              </Text>
            </View>
          </View>
          <Badge label={statusMeta.label} variant={statusMeta.tone} size="sm" />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Loan summary</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Loan amount</Text>
            <Text style={styles.detailValue}>{formatCurrency(draft.amount, currency)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purpose</Text>
            <Text style={styles.detailValue}>{draft.purpose}</Text>
          </View>
          {draft.note ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Supporting note</Text>
              <Text style={styles.detailValue}>{draft.note}</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Repayment duration</Text>
            <Text style={styles.detailValue}>{draft.durationMonths} months</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Loan product</Text>
            <Text style={styles.detailValue}>{selectedProduct?.name || 'Current default product'}</Text>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Repayment estimate</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated installment</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(
                previewResult?.calculated_metrics?.installment_estimate || estimate.installmentAmount,
                currency
              )}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated total repayment</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(
                previewResult?.calculated_metrics?.total_repayment_estimate || estimate.totalRepayment,
                currency
              )}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Interest / service cost</Text>
            <Text style={styles.detailValue}>{formatCurrency(estimate.totalInterest, currency)}</Text>
          </View>
          <Text style={styles.helperText}>
            Final repayment terms follow the selected product and your current eligibility assessment.
          </Text>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Eligibility note</Text>
          {previewLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
              <Text style={styles.helperText}>Confirming the latest eligibility estimate...</Text>
            </View>
          ) : previewError ? (
            <Text style={styles.warningText}>{previewError}</Text>
          ) : (
            <View style={styles.reasonList}>
              {(previewResult?.reasons.length ? previewResult.reasons : ['Your request is aligned with the current loan rules.']).map((item) => (
                <View key={item} style={styles.reasonRow}>
                  <Icon name="check-circle-outline" size={16} color={statusMeta.accent} />
                  <Text style={styles.reasonText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {previewResult ? (
            <Text style={styles.helperText}>
              Recommended max amount: {formatCurrency(previewResult.recommended_max_amount || '0', currency)}
            </Text>
          ) : null}
        </Card>

        {previewResult?.approval_requirements ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Approval path</Text>
            <View style={styles.reasonList}>
              <View style={styles.reasonRow}>
                <Icon name="account-check-outline" size={16} color={colors.info} />
                <Text style={styles.reasonText}>
                  {previewResult.approval_requirements.requires_guarantors
                    ? `${previewResult.approval_requirements.required_guarantors || 0} guarantor(s) will be required for this request.`
                    : 'No guarantors are required for this request amount.'}
                </Text>
              </View>
              {previewResult.approval_requirements.approval_path?.length ? (
                <View style={styles.reasonRow}>
                  <Icon name="timeline-outline" size={16} color={colors.primary[500]} />
                  <Text style={styles.reasonText}>
                    Approval path: {previewResult.approval_requirements.approval_path
                      .map((item) => item.replace(/_/g, ' '))
                      .join(' → ')}.
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>
        ) : null}

        {previewResult?.next_steps?.length ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>What to keep in mind</Text>
            <View style={styles.reasonList}>
              {previewResult.next_steps.map((item) => (
                <View key={item} style={styles.reasonRow}>
                  <Icon name="arrow-right-circle-outline" size={16} color={colors.primary[500]} />
                  <Text style={styles.reasonText}>{item}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <View style={styles.editRow}>
          <Button
            title="Edit Request"
            variant="outline"
            onPress={() => navigation.navigate('RequestLoan', { chamaId })}
            style={styles.flexButton}
          />
          <Button
            title="Back to Loans"
            variant="ghost"
            onPress={() => navigation.navigate('MemberLoans', { chamaId })}
            style={styles.flexButton}
          />
        </View>

        <Button
          title="Submit Application"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!canSubmit}
        />

        {!canSubmit && !previewLoading ? (
          <Text style={styles.warningText}>
            Review the highlighted eligibility message before submitting this request.
          </Text>
        ) : null}
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
    backgroundColor: '#F6FFFB',
    borderWidth: 1,
    borderColor: '#D8F5E8',
  },
  heroRow: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: spacing[1],
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  heroText: {
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
  helperText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  reasonList: {
    gap: spacing[2],
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
  editRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  flexButton: {
    flex: 1,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.warning,
    fontFamily: typography.fontFamily.medium,
  },
});
