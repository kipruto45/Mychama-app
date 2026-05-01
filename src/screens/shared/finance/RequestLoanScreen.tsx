import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getErrorMessage } from '@/api/errors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { MainStackParamList } from '@/navigation/types';
import { useAuth } from '@/providers/AuthProvider';
import { useActiveChama } from '@/hooks';
import { chamaService } from '@/services/chamaService';
import { financeService } from '@/services/financeService';
import { profileService } from '@/services/profileService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Chama, LoanEligibilityPreview, LoanProduct, Membership, KYCRecord } from '@/types';
import { formatCurrency } from '@/utils/format';

type RequestLoanScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'RequestLoan'>;
type RequestLoanScreenRouteProp = RouteProp<MainStackParamList, 'RequestLoan'>;

const getProductDurationLabel = (product: LoanProduct) =>
  `${product.min_duration_months}-${product.max_duration_months} months`;

const buildGuarantorPayload = (
  selectedGuarantors: string[],
  principalAmount: string
): Array<{ guarantor_id: string; guaranteed_amount: string }> => {
  if (!selectedGuarantors.length) {
    return [];
  }

  const totalCents = Math.max(0, Math.round(Number(principalAmount || 0) * 100));
  const baseShare = Math.floor(totalCents / selectedGuarantors.length);
  const remainder = totalCents % selectedGuarantors.length;

  return selectedGuarantors.map((guarantorId, index) => ({
    guarantor_id: guarantorId,
    guaranteed_amount: ((baseShare + (index < remainder ? 1 : 0)) / 100).toFixed(2),
  }));
};

const getStatusVariant = (eligible: boolean) => (eligible ? 'success' : 'error');

export const RequestLoanScreen: React.FC = () => {
  const navigation = useNavigation<RequestLoanScreenNavigationProp>();
  const route = useRoute<RequestLoanScreenRouteProp>();
  const { user } = useAuth();

  const initialChamaId = route.params?.chamaId;

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'setup' | 'eligibility' | 'guarantors' | 'review' | 'success'>('setup');
  const [submittedApplication, setSubmittedApplication] = useState<any | null>(null);

  const [chamas, setChamas] = useState<Chama[]>([]);
  const [members, setMembers] = useState<Membership[]>([]);
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [selectedChamaId, setSelectedChamaId] = useState<string | null>(initialChamaId || null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [principal, setPrincipal] = useState('');
  const [duration, setDuration] = useState('');
  const [purpose, setPurpose] = useState('');
  const [selectedGuarantors, setSelectedGuarantors] = useState<string[]>([]);
  const [eligibility, setEligibility] = useState<LoanEligibilityPreview | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedChama = useMemo(
    () => chamas.find((item) => item.id === selectedChamaId) || null,
    [chamas, selectedChamaId]
  );
  const selectedProduct = useMemo(
    () => loanProducts.find((item) => item.id === selectedProductId) || null,
    [loanProducts, selectedProductId]
  );

  const guarantorCandidates = useMemo(
    () =>
      members.filter(
        (membership) => membership.user.id !== user?.id && membership.status === 'active' && membership.is_approved
      ),
    [members, user?.id]
  );

  const monthlyEstimate = useMemo(() => {
    if (!selectedProduct || !principal || !duration) {
      return '0.00';
    }

    const principalValue = Number(principal);
    const durationValue = Number(duration);
    const annualRate = Number(selectedProduct.interest_rate) / 100;

    if (!principalValue || !durationValue) {
      return '0.00';
    }

    const totalInterest = principalValue * annualRate * (durationValue / 12);
    return ((principalValue + totalInterest) / durationValue).toFixed(2);
  }, [duration, principal, selectedProduct]);

  const requiredGuarantors = Number((eligibility?.metrics as Record<string, unknown> | undefined)?.required_guarantors || 0);
  const guarantorsRequired = requiredGuarantors > 0;
  const flowSteps = guarantorsRequired
    ? [
        { key: 'setup', label: 'Details' },
        { key: 'eligibility', label: 'Check' },
        { key: 'guarantors', label: 'Guarantors' },
        { key: 'review', label: 'Review' },
        { key: 'success', label: 'Done' },
      ]
    : [
        { key: 'setup', label: 'Details' },
        { key: 'eligibility', label: 'Check' },
        { key: 'review', label: 'Review' },
        { key: 'success', label: 'Done' },
      ];

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedChamaId) {
      setLoanProducts([]);
      setMembers([]);
      setSelectedProductId(null);
      setSelectedGuarantors([]);
      return;
    }

    void loadChamaScopedData(selectedChamaId);
  }, [selectedChamaId]);

  const loadInitialData = async () => {
    try {
      const chamaList = await chamaService.getChamas();
      setChamas(chamaList);

      if (!initialChamaId && chamaList.length > 0) {
        setSelectedChamaId(chamaList[0].id);
      }
    } catch (error) {
      Alert.alert('Loan Request', getErrorMessage(error));
    } finally {
      setIsBootstrapping(false);
    }
  };

  const loadChamaScopedData = async (chamaId: string) => {
    try {
      const [products, chamaMembers] = await Promise.all([
        financeService.getLoanProducts(chamaId),
        chamaService.getMembers(chamaId),
      ]);

      setLoanProducts(products);
      setMembers(chamaMembers);
      setEligibility(null);

      if (!products.find((product) => product.id === selectedProductId)) {
        setSelectedProductId(products[0]?.id || null);
      }
    } catch (error) {
      setLoanProducts([]);
      setMembers([]);
      Alert.alert('Loan Request', getErrorMessage(error));
    }
  };

  const resetDecisionState = () => {
    setEligibility(null);
    setSelectedGuarantors([]);
    setSubmittedApplication(null);
  };

  const handleSelectChama = (chamaId: string) => {
    setSelectedChamaId(chamaId);
    setStep('setup');
    resetDecisionState();
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    resetDecisionState();
  };

  const toggleGuarantor = (memberId: string) => {
    setSelectedGuarantors((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]
    );
  };

  const validateDraft = () => {
    const nextErrors: Record<string, string> = {};

    if (!selectedChamaId) {
      nextErrors.chama = 'Select the chama that should process this application.';
    }

    if (!selectedProduct) {
      nextErrors.product = 'Select a loan product before you continue.';
    }

    if (!principal || Number(principal) <= 0) {
      nextErrors.principal = 'Enter a valid loan amount.';
    } else if (selectedProduct && Number(principal) > Number(selectedProduct.max_loan_amount)) {
      nextErrors.principal = `This product allows up to ${formatCurrency(selectedProduct.max_loan_amount, selectedChama?.currency || 'KES')}.`;
    }

    if (!duration || Number(duration) <= 0) {
      nextErrors.duration = 'Enter a valid repayment term.';
    } else if (
      selectedProduct &&
      (Number(duration) < selectedProduct.min_duration_months || Number(duration) > selectedProduct.max_duration_months)
    ) {
      nextErrors.duration = `Repayment term must be ${getProductDurationLabel(selectedProduct)}.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStepOne = () => {
    const nextErrors: Record<string, string> = {};

    if (!selectedChamaId) {
      nextErrors.chama = 'Select the chama that should process this application.';
    }

    if (!selectedProduct) {
      nextErrors.product = 'Select a loan product before you continue.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCheckEligibility = async () => {
    if (!validateDraft() || !selectedChamaId) {
      return;
    }

    setIsCheckingEligibility(true);
    try {
      // First check KYC status
      const kycRecords = await profileService.getKYCStatus();
      const currentChamaKYC = kycRecords.find((k: KYCRecord) => k.chama_id === selectedChamaId);
      
      if (!currentChamaKYC || currentChamaKYC.status !== 'approved') {
        const nextSteps = currentChamaKYC?.verification_result?.next_steps || [];
        const verificationErrors = currentChamaKYC?.verification_result?.errors || [];
        const guidance =
          nextSteps.length > 0
            ? `\n\nNext steps:\n${nextSteps.map((step) => `• ${step}`).join('\n')}`
            : verificationErrors.length > 0
            ? `\n\nIssues:\n${verificationErrors.map((step) => `• ${step}`).join('\n')}`
            : '';
        Alert.alert(
          'KYC Required',
          'You must complete KYC verification before requesting a loan.\n\nPlease:\n1. Go to Profile → KYC Verification\n2. Submit your ID, selfie, M-Pesa name, and proof of address\n3. Wait for approval' +
            guidance,
          [
            { text: 'Go to KYC', onPress: () => navigation.navigate('KYC') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        setIsCheckingEligibility(false);
        return;
      }

      // Check verification result from KYC
      const verificationResult = (currentChamaKYC as any)?.verification_result;
      if (verificationResult && !verificationResult.eligible_for_loans) {
        Alert.alert(
          'Loan Eligibility Issue',
          'Your KYC verification does not meet the requirements for loans.\n\n' +
          (verificationResult.next_steps?.join('\n') || 'Please complete full verification.'),
          [
            { text: 'Go to KYC', onPress: () => navigation.navigate('KYC') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        setIsCheckingEligibility(false);
        return;
      }

      const preview = await financeService.previewLoanEligibility(selectedChamaId, {
        loan_product_id: selectedProductId || undefined,
        principal: principal.trim(),
        duration_months: Number(duration),
        purpose: purpose.trim(),
      });

      setEligibility(preview);
      setStep('eligibility');
    } catch (error) {
      setEligibility(null);
      Alert.alert('Eligibility Check', getErrorMessage(error));
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedChamaId || !selectedProductId) {
      return;
    }

    if (!eligibility?.eligible) {
      await handleCheckEligibility();
      return;
    }

    if (guarantorsRequired && selectedGuarantors.length < requiredGuarantors) {
      Alert.alert(
        'Guarantors required',
        `Select at least ${requiredGuarantors} guarantor${requiredGuarantors === 1 ? '' : 's'} before submitting this loan request.`
      );
      setStep('guarantors');
      return;
    }

    setIsSubmitting(true);
    try {
      const application = await financeService.submitLoanApplication(selectedChamaId, {
        loan_product_id: selectedProductId,
        requested_amount: principal.trim(),
        requested_term_months: Number(duration),
        purpose: purpose.trim(),
        guarantors: buildGuarantorPayload(selectedGuarantors, principal.trim()),
      });
      setSubmittedApplication(application);
      setStep('success');
    } catch (error) {
      Alert.alert('Loan Request', getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepper = () => (
    <View style={styles.stepper}>
      {flowSteps.map((item, index) => {
        const currentIndex = flowSteps.findIndex((flowStep) => flowStep.key === step);
        const isActive = step === item.key;
        const isComplete = currentIndex > index;
        return (
          <View key={item.key as string} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                isActive && styles.stepDotActive,
                isComplete && styles.stepDotComplete,
              ]}
            >
              <Text style={[styles.stepDotText, (isActive || isComplete) && styles.stepDotTextActive]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );

  const renderEligibilityCard = () => {
    if (!eligibility) {
      return null;
    }

    return (
      <Card style={styles.sectionCard}>
        <View style={styles.inlineBetween}>
          <Text style={styles.sectionTitle}>Eligibility Result</Text>
          <Badge
            label={eligibility.eligible ? 'Eligible' : 'Not Eligible'}
            variant={getStatusVariant(eligibility.eligible)}
          />
        </View>
          <Text style={styles.supportText}>
          Recommended maximum: {formatCurrency(eligibility.recommended_max_amount || '0', selectedChama?.currency || 'KES')}
        </Text>
        <View style={styles.eligibilityHighlights}>
          <View style={styles.eligibilityMetric}>
            <Text style={styles.eligibilityMetricLabel}>Guarantors</Text>
            <Text style={styles.eligibilityMetricValue}>
              {guarantorsRequired ? `${requiredGuarantors} required` : 'Not required'}
            </Text>
          </View>
          <View style={styles.eligibilityMetric}>
            <Text style={styles.eligibilityMetricLabel}>Liquidity</Text>
            <Text style={styles.eligibilityMetricValue}>
              {((eligibility.metrics as Record<string, unknown> | undefined)?.effective_lendable_liquidity)
                ? formatCurrency(
                    String((eligibility.metrics as Record<string, unknown>).effective_lendable_liquidity),
                    selectedChama?.currency || 'KES'
                  )
                : 'Not available'}
            </Text>
          </View>
        </View>
        {eligibility.reasons.length > 0 && (
          <View style={styles.reasonList}>
            {eligibility.reasons.map((reason) => (
              <View key={reason} style={styles.reasonRow}>
                <Icon
                  name={eligibility.eligible ? 'check-circle-outline' : 'alert-circle-outline'}
                  size={18}
                  color={eligibility.eligible ? colors.success : colors.error}
                />
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        )}
        {!eligibility.eligible ? (
          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>What to fix before borrowing</Text>
            <Text style={styles.requirementsCopy}>
              Review the items above, then update your details or account standing and try again.
            </Text>
          </View>
        ) : null}
      </Card>
    );
  };

  const renderChamaSelection = () => (
    <Card style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>1. Pick Chama</Text>
      <Text style={styles.supportText}>Choose the chama that should evaluate and fund this loan.</Text>
      {chamas.map((chama) => {
        const isSelected = selectedChamaId === chama.id;
        return (
          <TouchableOpacity
            key={chama.id}
            style={[styles.optionCard, isSelected && styles.optionCardSelected]}
            onPress={() => handleSelectChama(chama.id)}
          >
            <View style={styles.optionBody}>
              <Icon name="account-group-outline" size={22} color={colors.primary[500]} />
              <View style={styles.optionTextBlock}>
                <Text style={styles.optionTitle}>{chama.name}</Text>
                <Text style={styles.optionSubtitle}>{chama.currency || 'KES'}</Text>
              </View>
            </View>
            {isSelected && <Icon name="check-circle" size={20} color={colors.primary[500]} />}
          </TouchableOpacity>
        );
      })}
      {errors.chama && <Text style={styles.errorText}>{errors.chama}</Text>}
    </Card>
  );

  const renderProductSelection = () => (
    <Card style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>2. Pick Loan Product</Text>
      <Text style={styles.supportText}>Loan terms come from your chama policy, not from this screen alone.</Text>
      {loanProducts.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Icon name="bank-off" size={32} color={colors.neutral[300]} />
          <Text style={styles.emptyStateTitle}>No loan products available</Text>
          <Text style={styles.emptyStateMessage}>
            This chama does not have any loan products available right now. 
            Contact your chama admin to set up lending options.
          </Text>
        </View>
      ) : (
        loanProducts.map((product) => {
          const isSelected = selectedProductId === product.id;
          return (
            <TouchableOpacity
              key={product.id}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => handleSelectProduct(product.id)}
            >
              <View style={styles.optionTextBlock}>
                <Text style={styles.optionTitle}>{product.name}</Text>
                <Text style={styles.optionSubtitle}>
                  Max {formatCurrency(product.max_loan_amount, selectedChama?.currency || 'KES')} • {product.interest_rate}% • {getProductDurationLabel(product)}
                </Text>
              </View>
              {isSelected && <Icon name="check-circle" size={20} color={colors.primary[500]} />}
            </TouchableOpacity>
          );
        })
      )}
      {errors.product && <Text style={styles.errorText}>{errors.product}</Text>}
    </Card>
  );

  const renderLoanInputs = () => (
    <Card style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>3. Enter Loan Details</Text>
      <Input
        label="Requested Amount"
        placeholder="e.g. 10000"
        value={principal}
        onChangeText={(value) => {
          setPrincipal(value);
          setEligibility(null);
        }}
        keyboardType="decimal-pad"
        error={errors.principal}
      />
      <Input
        label="Repayment Term (Months)"
        placeholder="e.g. 6"
        value={duration}
        onChangeText={(value) => {
          setDuration(value);
          setEligibility(null);
        }}
        keyboardType="number-pad"
        error={errors.duration}
      />
      <Input
        label="Loan Purpose"
        placeholder="Business, school fees, medical, emergency..."
        value={purpose}
        onChangeText={(value) => {
          setPurpose(value);
          setEligibility(null);
        }}
        multiline
        numberOfLines={3}
        autoCapitalize="sentences"
      />
      <View style={styles.estimateCard}>
        <Text style={styles.estimateLabel}>Estimated monthly repayment</Text>
        <Text style={styles.estimateValue}>
          {formatCurrency(monthlyEstimate, selectedChama?.currency || 'KES')}
        </Text>
      </View>
    </Card>
  );

  const renderGuarantors = () => (
    <Card style={styles.sectionCard}>
      <View style={styles.inlineBetween}>
        <Text style={styles.sectionTitle}>4. Add Guarantors</Text>
        <Badge label={`${selectedGuarantors.length}/${requiredGuarantors || 0} selected`} variant="info" />
      </View>
      <Text style={styles.supportText}>
        Select at least {requiredGuarantors} eligible guarantor{requiredGuarantors === 1 ? '' : 's'} for this request. Their available guarantee capacity is rechecked before approval.
      </Text>
      {guarantorCandidates.length === 0 ? (
        <Text style={styles.emptyCopy}>No eligible guarantor candidates are visible in this chama right now.</Text>
      ) : (
        guarantorCandidates.map((membership) => {
          const isSelected = selectedGuarantors.includes(membership.user.id);
          return (
            <TouchableOpacity
              key={membership.id}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => toggleGuarantor(membership.user.id)}
            >
              <View style={styles.optionBody}>
                <Icon name="shield-account-outline" size={22} color={colors.accent[600]} />
                <View style={styles.optionTextBlock}>
                  <Text style={styles.optionTitle}>{membership.user.full_name}</Text>
                  <Text style={styles.optionSubtitle}>{membership.role}</Text>
                </View>
              </View>
              {isSelected && <Icon name="check-circle" size={20} color={colors.primary[500]} />}
            </TouchableOpacity>
          );
        })
      )}
    </Card>
  );

  const renderReview = () => (
    <Card style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>5. Review Application</Text>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Chama</Text>
        <Text style={styles.reviewValue}>{selectedChama?.name || '-'}</Text>
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Product</Text>
        <Text style={styles.reviewValue}>{selectedProduct?.name || '-'}</Text>
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Amount</Text>
        <Text style={styles.reviewValue}>{formatCurrency(principal || '0', selectedChama?.currency || 'KES')}</Text>
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Repayment Term</Text>
        <Text style={styles.reviewValue}>{duration || '-'} months</Text>
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Purpose</Text>
        <Text style={styles.reviewValue}>{purpose.trim() || 'Not provided'}</Text>
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Guarantors</Text>
        <Text style={styles.reviewValue}>
          {guarantorsRequired ? `${selectedGuarantors.length} of ${requiredGuarantors}` : 'Not required'}
        </Text>
      </View>
    </Card>
  );

  const renderSubmissionSuccess = () => (
    <Card style={styles.sectionCard}>
      <View style={styles.successHero}>
        <View style={styles.successIconWrap}>
          <Icon name="check-decagram-outline" size={44} color={colors.primary[700]} />
        </View>
        <Text style={styles.successTitle}>Loan request submitted successfully</Text>
        <Text style={styles.successCopy}>
          Status: Pending Review. We&apos;ll notify you when guarantors respond, reviewers take action, or the loan is approved.
        </Text>
      </View>

      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Amount</Text>
        <Text style={styles.reviewValue}>{formatCurrency(principal || '0', selectedChama?.currency || 'KES')}</Text>
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Purpose</Text>
        <Text style={styles.reviewValue}>{purpose.trim() || 'Not provided'}</Text>
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Current Stage</Text>
        <Text style={styles.reviewValue}>{submittedApplication?.status?.replace(/_/g, ' ') || 'submitted'}</Text>
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Guarantors</Text>
        <Text style={styles.reviewValue}>
          {guarantorsRequired ? `${selectedGuarantors.length} selected` : 'Not required'}
        </Text>
      </View>

      <View style={styles.successActions}>
        <Button
          title="View Request"
          onPress={() => navigation.replace('LoanApplications', { chamaId: selectedChamaId || undefined })}
        />
        <Button
          title="Back to Loans"
          variant="outline"
          onPress={() => navigation.navigate('LoanApplications', { chamaId: selectedChamaId || undefined })}
        />
      </View>
    </Card>
  );

  if (isBootstrapping) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerTitle}>Preparing loan request</Text>
          <Text style={styles.centerText}>Loading chamas, products, and active members.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={22} color={colors.neutral[700]} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Loan Application</Text>
            <Text style={styles.subtitle}>Check eligibility, complete requirements, and submit a complete loan request.</Text>
          </View>
        </View>

        {renderStepper()}

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {step === 'setup' ? (
            <>
              {renderChamaSelection()}
              {renderProductSelection()}
              {renderLoanInputs()}
            </>
          ) : null}
          {step === 'eligibility' ? renderEligibilityCard() : null}
          {step === 'guarantors' ? renderGuarantors() : null}
          {step === 'review' ? renderReview() : null}
          {step === 'success' ? renderSubmissionSuccess() : null}
        </ScrollView>

        {step !== 'success' ? (
          <View style={styles.footer}>
            {step !== 'setup' ? (
            <Button
              title="Back"
              variant="ghost"
              onPress={() => {
                if (step === 'eligibility') {
                  setStep('setup');
                  return;
                }
                if (step === 'guarantors') {
                  setStep('eligibility');
                  return;
                }
                if (step === 'review') {
                  setStep(guarantorsRequired ? 'guarantors' : 'eligibility');
                }
              }}
            />
          ) : (
            <View />
          )}

          {step === 'setup' ? (
            <Button
              title="Check Eligibility"
              onPress={() => {
                void handleCheckEligibility();
              }}
              loading={isCheckingEligibility}
            />
          ) : step === 'eligibility' ? (
            <Button
              title={eligibility?.eligible ? (guarantorsRequired ? 'Continue to Guarantors' : 'Continue to Review') : 'Update Details'}
              onPress={() => {
                if (!eligibility?.eligible) {
                  setStep('setup');
                  return;
                }
                setStep(guarantorsRequired ? 'guarantors' : 'review');
              }}
            />
          ) : step === 'guarantors' ? (
            <Button
              title="Continue to Review"
              onPress={() => {
                if (selectedGuarantors.length < requiredGuarantors) {
                  Alert.alert(
                    'Guarantors required',
                    `Select at least ${requiredGuarantors} guarantor${requiredGuarantors === 1 ? '' : 's'} to continue.`
                  );
                  return;
                }
                setStep('review');
              }}
            />
          ) : (
            <Button title="Submit Application" onPress={() => void handleSubmit()} loading={isSubmitting} />
          )}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  subtitle: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[3],
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  stepDotActive: {
    backgroundColor: colors.primary[500],
  },
  stepDotComplete: {
    backgroundColor: colors.success,
  },
  stepDotText: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  stepLabelActive: {
    color: colors.primary[600],
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
    gap: spacing[4],
  },
  sectionCard: {
    gap: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  supportText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    lineHeight: 20,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
  },
  optionCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  optionBody: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTextBlock: {
    marginLeft: spacing[3],
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  optionSubtitle: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  estimateCard: {
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
  estimateLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  estimateValue: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.accent[700],
  },
  inlineBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  reasonList: {
    gap: spacing[2],
  },
  eligibilityHighlights: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  eligibilityMetric: {
    flex: 1,
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.xl,
    padding: spacing[3],
  },
  eligibilityMetricLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eligibilityMetricValue: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  reasonText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  requirementsCard: {
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
  requirementsTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.accent[700],
    marginBottom: spacing[1],
  },
  requirementsCopy: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  reviewLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  reviewValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  emptyCopy: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[3],
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[700],
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  emptyStateMessage: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
  },
  successHero: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  successIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  successTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    textAlign: 'center',
  },
  successCopy: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  successActions: {
    gap: spacing[3],
    marginTop: spacing[4],
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.light.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  centerTitle: {
    marginTop: spacing[4],
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  centerText: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});
