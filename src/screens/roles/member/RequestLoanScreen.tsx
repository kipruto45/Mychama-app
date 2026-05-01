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
import { Input } from '@/components/ui/Input';
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

import {
  buildDurationOptions,
  purposeSuggestions,
  sanitizeLoanAmountInput,
} from './loanWorkflowShared';

type RequestLoanNavigationProp = NativeStackNavigationProp<MainStackParamList, 'RequestLoan'>;
type RequestLoanRouteProp = RouteProp<MainStackParamList, 'RequestLoan'>;

export const RequestLoanScreen: React.FC = () => {
  const navigation = useNavigation<RequestLoanNavigationProp>();
  const route = useRoute<RequestLoanRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const {
    draft,
    patchDraft,
    setLastVisitedRoute,
  } = useMemberLoanFlowStore();

  const chamaId = route.params?.chamaId || activeChamaId || undefined;

  const [workspace, setWorkspace] = useState<MemberLoanWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(draft?.loanProductId || null);
  const [amount, setAmount] = useState(draft?.amount || '');
  const [purpose, setPurpose] = useState(draft?.purpose || '');
  const [note, setNote] = useState(draft?.note || '');
  const [durationMonths, setDurationMonths] = useState<number | null>(draft?.durationMonths || null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [eligibilityPreview, setEligibilityPreview] = useState<LoanEligibilityPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    setLastVisitedRoute('RequestLoan');
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
        setError(null);

        const defaultProductId =
          draft?.loanProductId ||
          response.loan_rules.default_product?.id ||
          response.loan_rules.available_products[0]?.id ||
          null;
        setSelectedProductId((current) => current || defaultProductId);
      } catch (serviceError) {
        const message =
          typeof serviceError === 'object' && serviceError && 'message' in serviceError
            ? String((serviceError as { message?: string }).message || '')
            : '';
        setError(message || 'We couldn’t load your loan details right now. Please try again.');
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
  }, [chamaId, draft?.loanProductId]);

  const currency = workspace?.summary.currency || activeChama?.currency || 'KES';
  const selectedProduct =
    workspace?.loan_rules.available_products.find((item) => item.id === selectedProductId) ||
    workspace?.loan_rules.default_product ||
    null;
  const durationOptions = selectedProduct
    ? buildDurationOptions(selectedProduct.min_duration_months, selectedProduct.max_duration_months)
    : [];

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    if (!durationMonths) {
      setDurationMonths(selectedProduct.min_duration_months);
      return;
    }

    if (
      durationMonths < selectedProduct.min_duration_months ||
      durationMonths > selectedProduct.max_duration_months
    ) {
      setDurationMonths(selectedProduct.min_duration_months);
    }
  }, [durationMonths, selectedProduct]);

  useEffect(() => {
    if (!chamaId || !selectedProduct || !amount || !durationMonths) {
      setEligibilityPreview(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    const numericAmount = Number(amount || 0);
    if (!numericAmount || durationMonths <= 0) {
      setEligibilityPreview(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setPreviewLoading(true);
      memberLoanService
        .previewEligibility(chamaId, {
          amount,
          durationMonths,
          purpose,
          loanProductId: selectedProduct.id,
        })
        .then((result) => {
          if (cancelled) {
            return;
          }
          setEligibilityPreview(result);
          setPreviewError(null);
        })
        .catch((serviceError) => {
          if (cancelled) {
            return;
          }
          const message =
            typeof serviceError === 'object' && serviceError && 'message' in serviceError
              ? String((serviceError as { message?: string }).message || '')
              : '';
          setEligibilityPreview(null);
          setPreviewError(message || 'We could not confirm this request right now.');
        })
        .finally(() => {
          if (!cancelled) {
            setPreviewLoading(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [amount, chamaId, durationMonths, purpose, selectedProduct]);

  useEffect(() => {
    if (!chamaId) {
      return;
    }

    patchDraft({
      chamaId,
      loanProductId: selectedProduct?.id || null,
      loanProductName: selectedProduct?.name || null,
      amount,
      purpose,
      durationMonths,
      note,
      maxEligibleAmount: workspace?.eligibility.max_eligible_amount || undefined,
      eligibilityState: workspace?.eligibility.state || undefined,
    });
  }, [
    amount,
    chamaId,
    durationMonths,
    note,
    patchDraft,
    purpose,
    selectedProduct?.id,
    selectedProduct?.name,
    workspace?.eligibility.max_eligible_amount,
    workspace?.eligibility.state,
  ]);

  const estimate = useMemo(() => {
    if (!selectedProduct || !durationMonths) {
      return calculateLoanEstimate({
        amount: '0',
        durationMonths: 0,
        interestRate: '0',
      });
    }

    return calculateLoanEstimate({
      amount,
      durationMonths,
      interestRate: selectedProduct.interest_rate,
      interestType: selectedProduct.interest_type,
    });
  }, [amount, durationMonths, selectedProduct]);
  const approvalRequirements = eligibilityPreview?.approval_requirements;
  const approvalPath = approvalRequirements?.approval_path || [];

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const numericAmount = Number(amount || 0);
    const maxEligible = Number(
      eligibilityPreview?.recommended_max_amount || workspace?.eligibility.max_eligible_amount || 0
    );
    const minLoanAmount = Number(
      eligibilityPreview?.minimum_loan_amount ||
        workspace?.eligibility.policy_summary?.minimum_loan_amount ||
        0
    );

    if (!selectedProduct) {
      nextErrors.product = 'Choose a loan product to continue.';
    }

    if (!numericAmount) {
      nextErrors.amount = 'Enter an amount within your eligible range.';
    } else if (minLoanAmount > 0 && numericAmount < minLoanAmount) {
      nextErrors.amount = `Enter at least ${formatCurrency(String(minLoanAmount), currency)}.`;
    } else if (selectedProduct && numericAmount > Number(selectedProduct.max_loan_amount || 0)) {
      nextErrors.amount = 'Enter an amount within your eligible range.';
    } else if (maxEligible > 0 && numericAmount > maxEligible) {
      nextErrors.amount = 'Enter an amount within your eligible range.';
    } else if (eligibilityPreview && eligibilityPreview.requested_amount_valid === false) {
      nextErrors.amount = eligibilityPreview.reasons[0] || 'This amount is not allowed right now.';
    }

    if (!purpose.trim()) {
      nextErrors.purpose = 'Choose or enter a loan purpose to continue.';
    }

    if (!durationMonths) {
      nextErrors.duration = 'Choose a repayment duration to continue.';
    }

    if (eligibilityPreview && !eligibilityPreview.eligible) {
      nextErrors.eligibility =
        eligibilityPreview.reasons[0] || 'This request does not meet the current loan rules.';
    }

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validateForm()) {
      return;
    }

    navigation.navigate('LoanReviewConfirm', { chamaId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Apply for Loan" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Preparing your application form...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Apply for Loan" showBack />
        <EmptyState
          title="No chama selected"
          description="Choose a chama first so we can prepare the right loan options."
          icon="people-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (error || !workspace) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Apply for Loan" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Unable to load loan options"
          description={error || 'We couldn’t load your loan details right now. Please try again.'}
          icon="alert-circle-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (workspace.active_application) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Apply for Loan" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="An application is already in review"
          description="Track your existing application before starting another request."
          icon="time-outline"
          style={styles.centerState}
          action={{
            label: 'View Application',
            onPress: () =>
              navigation.replace('LoanApplicationDetails', {
                applicationId: workspace.active_application!.id,
                chamaId,
              }),
          }}
        />
      </SafeAreaView>
    );
  }

  if (workspace.active_loan && workspace.loan_rules.blocks_when_active_loan_exists) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Apply for Loan" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="You already have an active loan"
          description="Open your current loan details and repayment schedule instead of starting a new request."
          icon="cash-outline"
          style={styles.centerState}
          action={{
            label: 'View Active Loan',
            onPress: () =>
              navigation.replace('LoanDetail', {
                loanId: workspace.active_loan!.id,
                chamaId,
              }),
          }}
        />
      </SafeAreaView>
    );
  }

  if (!workspace.loan_rules.can_start_application || workspace.eligibility.state !== 'eligible') {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Apply for Loan" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="Check eligibility before applying"
          description="Open the eligibility screen to see your current limit and the conditions affecting a new application."
          icon="shield-outline"
          style={styles.centerState}
          action={{
            label: 'View Eligibility',
            onPress: () => navigation.replace('LoanEligibility', { chamaId }),
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Apply for Loan" subtitle={activeChama?.name} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Loan request</Text>
          <Text style={styles.heroTitle}>You can apply up to {formatCurrency(workspace.eligibility.max_eligible_amount || '0', currency)}.</Text>
          <Text style={styles.heroText}>
            Choose a repayment plan that suits your ability. Your estimated repayment will be shown before submission.
          </Text>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Loan product</Text>
          {validationErrors.product ? <Text style={styles.inlineError}>{validationErrors.product}</Text> : null}
          <View style={styles.choiceList}>
            {workspace.loan_rules.available_products.map((item) => {
              const selected = item.id === selectedProduct?.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  style={[styles.choiceCard, selected && styles.choiceCardSelected]}
                  onPress={() => setSelectedProductId(item.id)}
                >
                  <View style={styles.choiceHeader}>
                    <View>
                      <Text style={styles.choiceTitle}>{item.name}</Text>
                      <Text style={styles.choiceMeta}>
                        {formatCurrency(item.max_loan_amount, currency)} max
                      </Text>
                    </View>
                    {item.is_default ? <Badge label="Default" variant="info" size="sm" /> : null}
                  </View>
                  <Text style={styles.choiceMeta}>
                    {item.interest_rate}% interest • {item.min_duration_months}-{item.max_duration_months} months
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Loan amount</Text>
          <Input
            label="Amount"
            placeholder="Enter amount"
            value={amount}
            onChangeText={(value) => setAmount(sanitizeLoanAmountInput(value))}
            keyboardType="decimal-pad"
            error={validationErrors.amount}
          />
          <Text style={styles.helperText}>
            Max eligible amount: {formatCurrency(eligibilityPreview?.recommended_max_amount || workspace.eligibility.max_eligible_amount || '0', currency)}
          </Text>
          {validationErrors.eligibility ? <Text style={styles.inlineError}>{validationErrors.eligibility}</Text> : null}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Loan purpose</Text>
          <View style={styles.chipRow}>
            {purposeSuggestions.map((item) => {
              const selected = purpose === item;
              return (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.85}
                  style={[styles.purposeChip, selected && styles.purposeChipSelected]}
                  onPress={() => setPurpose(item)}
                >
                  <Text style={[styles.purposeChipText, selected && styles.purposeChipTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Input
            label="Purpose"
            placeholder="What is this loan for?"
            value={purpose}
            onChangeText={setPurpose}
            autoCapitalize="sentences"
            error={validationErrors.purpose}
          />
          <Input
            label="Optional note"
            placeholder="Add a short note if you want more context in your request"
            value={note}
            onChangeText={setNote}
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
          />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Repayment duration</Text>
          {validationErrors.duration ? <Text style={styles.inlineError}>{validationErrors.duration}</Text> : null}
          <View style={styles.chipRow}>
            {durationOptions.map((item) => {
              const selected = durationMonths === item;
              return (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.85}
                  style={[styles.purposeChip, selected && styles.purposeChipSelected]}
                  onPress={() => setDurationMonths(item)}
                >
                  <Text style={[styles.purposeChipText, selected && styles.purposeChipTextSelected]}>
                    {item} mo
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.helperText}>Choose a repayment plan that suits your ability.</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Estimate preview</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated installment</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(
                eligibilityPreview?.calculated_metrics?.installment_estimate || estimate.installmentAmount,
                currency
              )}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated total repayment</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(
                eligibilityPreview?.calculated_metrics?.total_repayment_estimate || estimate.totalRepayment,
                currency
              )}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Request check</Text>
            <Text style={styles.summaryValue}>
              {previewLoading
                ? 'Checking...'
                : eligibilityPreview
                ? eligibilityPreview.eligible
                  ? 'Eligible'
                  : 'Needs changes'
                : 'Awaiting input'}
            </Text>
          </View>
          {approvalRequirements ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Guarantors</Text>
                <Text style={styles.summaryValue}>
                  {approvalRequirements.requires_guarantors
                    ? `${approvalRequirements.required_guarantors || 0} required`
                    : 'Not required'}
                </Text>
              </View>
              {approvalPath.length ? (
                <Text style={styles.helperText}>
                  Approval path: {approvalPath.map((item) => item.replace(/_/g, ' ')).join(' → ')}.
                </Text>
              ) : null}
            </>
          ) : null}
          {previewError ? <Text style={styles.inlineError}>{previewError}</Text> : null}
          {eligibilityPreview?.next_steps?.length ? (
            <View style={styles.previewList}>
              {eligibilityPreview.next_steps.slice(0, 3).map((item) => (
                <Text key={item} style={styles.previewListItem}>
                  • {item}
                </Text>
              ))}
            </View>
          ) : null}
          <Text style={styles.helperText}>
            Review your loan request before submitting. Final terms depend on the product and your current eligibility.
          </Text>
        </Card>

        <Button title="Continue" onPress={handleContinue} />
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
    backgroundColor: '#F6FFFB',
    borderWidth: 1,
    borderColor: '#D8F5E8',
    gap: spacing[2],
  },
  heroEyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[700],
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
  sectionCard: {
    gap: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
  },
  choiceList: {
    gap: spacing[3],
  },
  choiceCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    gap: spacing[2],
    backgroundColor: colors.neutral[50],
  },
  choiceCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: '#F3FFF7',
  },
  choiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    alignItems: 'center',
  },
  choiceTitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
  },
  choiceMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  purposeChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  purposeChipSelected: {
    backgroundColor: colors.primary[500],
  },
  purposeChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
  },
  purposeChipTextSelected: {
    color: colors.light.surface,
  },
  inlineError: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
  },
  summaryCard: {
    gap: spacing[3],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  summaryLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    textAlign: 'right',
  },
  previewList: {
    gap: spacing[1],
  },
  previewListItem: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.regular,
  },
});
