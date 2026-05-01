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
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { navigateToWorkspaceTab } from '@/navigation/workspaceTabNavigation';
import {
  memberPaymentsService,
  type MemberPaymentMethodOption,
} from '@/services/memberPaymentsService';
import { useAuthStore } from '@/store/authStore';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { useMemberPaymentsFlowStore } from '@/store/memberPaymentsFlowStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import {
  getPaymentMethodDisplay,
  getPaymentMethodIcon,
  getPaymentPurposeDisplay,
  normalizePhoneNumber,
} from './memberPaymentsWorkflowShared';

type PaymentMethodNavigationProp = NativeStackNavigationProp<MainStackParamList, 'PaymentMethod'>;
type PaymentMethodRouteProp = RouteProp<MainStackParamList, 'PaymentMethod'>;

export const PaymentMethodScreen: React.FC = () => {
  const navigation = useNavigation<PaymentMethodNavigationProp>();
  const route = useRoute<PaymentMethodRouteProp>();
  const { activeChama } = useActiveChama();
  const currentUser = useAuthStore((state) => state.user);
  const { draft, patchDraft, setLastVisitedRoute } = useMemberPaymentsFlowStore();
  const { repaymentDraft } = useMemberLoanFlowStore();

  const [methods, setMethods] = useState<MemberPaymentMethodOption[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<
    'mpesa' | 'paybill' | 'wallet_balance' | 'bank_transfer_placeholder'
  >((draft?.paymentMethod as any) || 'mpesa');
  const [phone, setPhone] = useState(
    draft?.phone || route.params.prefilledPhone || currentUser?.phone || ''
  );
  const [error, setError] = useState<string | null>(null);

  const paymentPurposeLabel = getPaymentPurposeDisplay(
    route.params.paymentPurposeType,
    route.params.paymentPurposeLabel ||
      route.params.targetLabel ||
      route.params.contributionTypeName ||
      route.params.purpose
  );
  const isLoanRepayment = route.params.paymentPurposeType === 'loan_repayment';
  const walletAllowed = route.params.paymentPurposeType === 'contribution';
  const screenTitle = isLoanRepayment ? 'Repayment Method' : 'Payment Method';
  const summaryTitle = isLoanRepayment ? 'Repayment summary' : 'Payment summary';
  const securityText = isLoanRepayment
    ? 'Choose how you want to repay your loan. You’ll review the repayment before continuing.'
    : 'Select how you want to pay. You’ll review everything before continuing.';
  const chooseTitle = isLoanRepayment ? 'Choose a repayment method' : 'Choose a payment method';
  const chooseSubtitle = isLoanRepayment
    ? 'Secure and member-friendly loan repayment options'
    : 'Secure and member-friendly payment options';

  useEffect(() => {
    setLastVisitedRoute('PaymentMethod');
  }, [setLastVisitedRoute]);

  useEffect(() => {
    let mounted = true;

    const loadMethods = async () => {
      try {
        const response = await memberPaymentsService.getPaymentMethods(
          route.params.chamaId,
          route.params.currency
        );
        if (mounted) {
          setMethods(response);
        }
      } catch (serviceError) {
        const message =
          typeof serviceError === 'object' && serviceError && 'message' in serviceError
            ? String((serviceError as { message?: string }).message || '')
            : '';
        if (mounted) {
          setError(message || 'We couldn’t load your payment methods right now. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoadingMethods(false);
        }
      }
    };

    void loadMethods();

    return () => {
      mounted = false;
    };
  }, [route.params.chamaId, route.params.currency]);

  const activeMethod = useMemo(
    () => methods.find((method) => method.type === selectedMethod) || null,
    [methods, selectedMethod]
  );

  const phoneError = useMemo(() => {
    if (selectedMethod !== 'mpesa') {
      return null;
    }
    const normalized = normalizePhoneNumber(phone);
    if (!normalized) {
      return 'Enter your M-Pesa phone number to continue.';
    }
    if (normalized.length !== 12 || !normalized.startsWith('254')) {
      return 'Enter a valid M-Pesa phone number to continue.';
    }
    return null;
  }, [phone, selectedMethod]);

  const handleContinue = () => {
    if (selectedMethod === 'wallet_balance' && !walletAllowed) {
      setError('Wallet payments are currently available for contributions only.');
      return;
    }

    if (!activeMethod?.enabled) {
      setError('Select a payment method to continue.');
      return;
    }

    if (phoneError) {
      setError(phoneError);
      return;
    }

    if (selectedMethod === 'wallet_balance') {
      const available = Number(activeMethod.balance || 0);
      const required = Number(route.params.totalAmount || route.params.amount || 0);
      if (!Number.isFinite(available) || available <= 0) {
        setError('Your wallet balance is unavailable right now. Please try again.');
        return;
      }
      if (!Number.isFinite(required) || required <= 0) {
        setError('Enter a valid amount to continue.');
        return;
      }
      if (available < required) {
        setError(
          `Insufficient wallet balance. Available ${formatCurrency(String(available), route.params.currency)}.`
        );
        return;
      }
    }

    const normalizedPhone = selectedMethod === 'mpesa' ? normalizePhoneNumber(phone) : undefined;
    patchDraft({
      chamaId: route.params.chamaId,
      paymentPurposeType: route.params.paymentPurposeType || 'contribution',
      paymentPurposeLabel,
      amount: route.params.amount,
      currency: route.params.currency,
      contributionId: route.params.contributionId || null,
      contributionTypeId: route.params.contributionTypeId || null,
      contributionTypeName: route.params.contributionTypeName || null,
      loanId: route.params.loanId || null,
      installmentId: route.params.installmentId || null,
      penaltyId: route.params.penaltyId || null,
      dueDate: route.params.dueDate || null,
      targetLabel: route.params.targetLabel || null,
      paymentMethod: selectedMethod as any,
      phone: normalizedPhone || '',
      sourceRoute: route.params.sourceRoute || 'PaymentMethod',
      feeAmount: route.params.feeAmount || '0.00',
      totalAmount: route.params.totalAmount || route.params.amount,
    });

    navigation.navigate('PaymentReview', {
      ...route.params,
      paymentPurposeLabel,
      paymentMethod: selectedMethod as any,
      phone: normalizedPhone,
      feeAmount: route.params.feeAmount || '0.00',
      totalAmount: route.params.totalAmount || route.params.amount,
    });
  };

  const handleLoanBack = () => {
    if (!route.params.loanId) {
      navigation.navigate('MemberLoans', { chamaId: route.params.chamaId });
      return;
    }

    navigation.navigate('LoanRepayment', {
      chamaId: route.params.chamaId,
      loanId: route.params.loanId,
      installmentId: route.params.installmentId,
      amount: route.params.amount,
      dueDate: route.params.dueDate,
      targetLabel: route.params.targetLabel,
      quickAmountOption: repaymentDraft?.quickAmountOption || undefined,
      entryPoint: 'loan_detail',
    });
  };

  if (!route.params?.chamaId || !route.params?.amount) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title={screenTitle} showBack />
        <EmptyState
          title="Payment details unavailable"
          description={
            isLoanRepayment
              ? 'Go back to your loan and choose the repayment details again.'
              : 'Go back to Payments and choose what you want to pay for again.'
          }
          icon="alert-circle-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (loadingMethods) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title={screenTitle} subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>
            {isLoanRepayment ? 'Loading repayment methods…' : 'Loading payment methods…'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title={screenTitle} subtitle={activeChama?.name} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>{summaryTitle}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Purpose</Text>
            <Text style={styles.summaryValue}>{paymentPurposeLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(route.params.totalAmount || route.params.amount, route.params.currency)}
            </Text>
          </View>
          {route.params.targetLabel ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Target</Text>
              <Text style={styles.summaryValue}>{route.params.targetLabel}</Text>
            </View>
          ) : null}
          {route.params.dueDate ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Due date</Text>
              <Text style={styles.summaryValue}>{formatDate(route.params.dueDate)}</Text>
            </View>
          ) : null}
          {route.params.outstandingBalance ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Outstanding balance</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(route.params.outstandingBalance, route.params.currency)}
              </Text>
            </View>
          ) : null}
          {route.params.nextDueAmount ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Next due amount</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(route.params.nextDueAmount, route.params.currency)}
              </Text>
            </View>
          ) : null}
          {route.params.resultingBalanceEstimate ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated balance after payment</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(route.params.resultingBalanceEstimate, route.params.currency)}
              </Text>
            </View>
          ) : null}
          <Text style={styles.securityText}>{securityText}</Text>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{chooseTitle}</Text>
          <Text style={styles.sectionSubtitle}>{chooseSubtitle}</Text>
        </View>

        {methods.map((method) => {
          const selected = method.type === selectedMethod;
          const isWallet = method.type === 'wallet_balance';
          const effectiveEnabled = method.enabled && (!isWallet || walletAllowed);
          const effectiveBadge = method.badge || (isWallet && !walletAllowed ? 'Soon' : undefined);
          const effectiveDescription =
            isWallet && !walletAllowed
              ? 'Wallet payments are currently available for contributions only.'
              : method.description;
          return (
            <TouchableOpacity
              key={method.type}
              activeOpacity={effectiveEnabled ? 0.86 : 1}
              style={[
                styles.methodRow,
                selected && styles.methodRowSelected,
                !effectiveEnabled && styles.methodRowDisabled,
              ]}
              onPress={() => {
                if (!effectiveEnabled) {
                  return;
                }
                setSelectedMethod(method.type);
                setError(null);
              }}
            >
              <View style={[styles.methodIcon, selected ? styles.methodIconSelected : null]}>
                <Icon
                  name={getPaymentMethodIcon(method.type) as any}
                  size={22}
                  color={selected ? colors.primary[700] : colors.neutral[500]}
                />
              </View>
              <View style={styles.methodCopy}>
                <View style={styles.methodTitleRow}>
                  <Text style={styles.methodTitle}>{getPaymentMethodDisplay(method.type)}</Text>
                  {effectiveBadge ? <Badge label={effectiveBadge} variant="secondary" size="sm" /> : null}
                </View>
                <Text style={styles.methodText}>{effectiveDescription}</Text>
                {method.balance ? (
                  <Text style={styles.methodBalance}>
                    Available {formatCurrency(method.balance, route.params.currency)}
                  </Text>
                ) : null}
              </View>
              <Icon
                name={selected ? 'check-circle' : 'circle-outline'}
                size={22}
                color={selected ? colors.primary[600] : colors.neutral[300]}
              />
            </TouchableOpacity>
          );
        })}

        {selectedMethod === 'mpesa' ? (
          <Card style={styles.phoneCard}>
            <Text style={styles.sectionTitle}>M-Pesa details</Text>
            <Input
              label="Phone number"
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setError(null);
              }}
              keyboardType="phone-pad"
              placeholder="2547XXXXXXXX"
              error={error || phoneError || undefined}
            />
            <View style={styles.reassuranceRow}>
              <Icon name="shield-check-outline" size={18} color={colors.success} />
              <Text style={styles.reassuranceText}>
                We only send the payment request after you confirm the review step.
              </Text>
            </View>
          </Card>
        ) : null}

        {error && !phoneError ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button title="Continue" onPress={handleContinue} />
          <Button
            title={isLoanRepayment ? 'Back to Repayment' : 'Back to Wallet'}
            variant="outline"
            onPress={() => {
              if (isLoanRepayment) {
                handleLoanBack();
                return;
              }
              navigateToWorkspaceTab(navigation as any, 'Payments', { chamaId: route.params.chamaId });
            }}
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
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  centerText: {
    marginTop: spacing[3],
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  summaryCard: {
    gap: spacing[3],
    backgroundColor: '#F8FFFB',
    borderWidth: 1,
    borderColor: '#D9F5E6',
  },
  sectionHeader: {
    gap: spacing[1],
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
  },
  sectionSubtitle: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    alignItems: 'center',
  },
  summaryLabel: {
    flex: 1,
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    color: colors.neutral[900],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  securityText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  methodRowSelected: {
    borderColor: colors.primary[500],
    backgroundColor: '#F5FFFA',
  },
  methodRowDisabled: {
    opacity: 0.65,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconSelected: {
    backgroundColor: '#DFF7EB',
  },
  methodCopy: {
    flex: 1,
    gap: spacing[1],
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  methodTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  methodText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  methodBalance: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.xs,
  },
  phoneCard: {
    gap: spacing[2],
  },
  reassuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  reassuranceText: {
    flex: 1,
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: '#FFF5F4',
    borderWidth: 1,
    borderColor: '#FBD4CD',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
  },
  actions: {
    gap: spacing[3],
  },
});

export default PaymentMethodScreen;
