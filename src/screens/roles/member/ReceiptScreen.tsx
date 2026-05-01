import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
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
import { ModernHeader } from '@/components/ui/ModernHeader';
import { MainStackParamList } from '@/navigation/types';
import { navigateToWorkspaceTab } from '@/navigation/workspaceTabNavigation';
import { memberPaymentsService } from '@/services/memberPaymentsService';
import { paymentService } from '@/services/paymentService';
import { useMemberPaymentsFlowStore } from '@/store/memberPaymentsFlowStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';
import * as WebBrowser from 'expo-web-browser';

import {
  getPaymentMethodDisplay,
  getPaymentPurposeDisplay,
  resolveLinkedPaymentTarget,
} from './memberPaymentsWorkflowShared';

type ReceiptNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Receipt'>;
type ReceiptRouteProp = RouteProp<MainStackParamList, 'Receipt'>;

export const ReceiptScreen: React.FC = () => {
  const navigation = useNavigation<ReceiptNavigationProp>();
  const route = useRoute<ReceiptRouteProp>();
  const { setLastVisitedRoute } = useMemberPaymentsFlowStore();

  const [receipt, setReceipt] = useState<any>(null);
  const [statusPayload, setStatusPayload] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intentId = route.params?.intentId || route.params?.paymentId || null;

  useEffect(() => {
    setLastVisitedRoute('Receipt');
  }, [setLastVisitedRoute]);

  const loadReceipt = async (manual = false) => {
    if (!intentId) {
      setError('We couldn’t retrieve your receipt right now.');
      setLoading(false);
      return;
    }

    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const status = await memberPaymentsService.getPaymentStatus(intentId).catch(() => null);
      setStatusPayload(status);
      const receiptPayload = await memberPaymentsService.getReceipt(intentId);
      setReceipt(receiptPayload);
      setError(null);
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || '')
          : '';
      setError(message || 'We couldn’t retrieve your receipt right now.');
      setReceipt(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadReceipt();
  }, [intentId]);

  const currentIntent = statusPayload?.intent;
  const paymentPurposeType =
    route.params?.paymentPurposeType ||
    memberPaymentsService.normalizePurposeType(currentIntent?.purpose);
  const paymentPurposeLabel = getPaymentPurposeDisplay(
    paymentPurposeType,
    route.params?.paymentPurposeLabel || route.params?.targetLabel || route.params?.contributionTypeName
  );
  const resolvedChamaId = route.params?.chamaId || currentIntent?.chama || undefined;
  const resolvedContributionId =
    route.params?.contributionId ||
    currentIntent?.metadata?.contribution_id ||
    currentIntent?.contribution ||
    undefined;
  const resolvedLoanId = route.params?.loanId || currentIntent?.metadata?.loan_id || undefined;
  const resolvedInstallmentId =
    route.params?.installmentId || currentIntent?.metadata?.installment_id || undefined;
  const resolvedPenaltyId = currentIntent?.metadata?.penalty_id || undefined;
  const resolvedTargetLabel =
    route.params?.targetLabel ||
    currentIntent?.metadata?.target_label ||
    currentIntent?.metadata?.installment_label ||
    undefined;
  const linkedTarget = resolveLinkedPaymentTarget({
    chamaId: resolvedChamaId,
    purposeType: paymentPurposeType,
    contributionId: resolvedContributionId,
    loanId: resolvedLoanId,
    penaltyId: resolvedPenaltyId,
  });
  const walletActivityFilter = useMemo(() => {
    if (paymentPurposeType === 'wallet_deposit') {
      return 'deposits' as const;
    }
    if (paymentPurposeType === 'wallet_withdrawal') {
      return 'withdrawals' as const;
    }
    return undefined;
  }, [paymentPurposeType]);
  const isLoanRepayment = paymentPurposeType === 'loan_repayment';
  const statusTitle =
    paymentPurposeType === 'wallet_deposit'
      ? 'Deposit Status'
      : paymentPurposeType === 'wallet_withdrawal'
      ? 'Withdrawal Detail'
      : paymentPurposeType === 'loan_repayment'
      ? 'Repayment Status'
      : 'Payment Status';
  const walletAwareHeroText =
    paymentPurposeType === 'wallet_deposit'
      ? 'Keep this record for your wallet funding history.'
      : paymentPurposeType === 'wallet_withdrawal'
      ? 'Keep this record for your wallet withdrawal history.'
      : paymentPurposeType === 'loan_repayment'
      ? 'Keep this record for your loan repayment history.'
      : 'Keep this record for your contribution, loan, or fine payment history.';
  const headerTitle = isLoanRepayment ? 'Repayment Receipt' : 'Receipt';

  const handleShare = async () => {
    if (!receipt) {
      return;
    }

    await Share.share({
      title: isLoanRepayment ? 'MyChama repayment receipt' : 'MyChama payment receipt',
      message: [
        isLoanRepayment ? 'MyChama repayment receipt' : 'MyChama payment receipt',
        `Receipt number: ${receipt.receipt_number}`,
        `Reference: ${receipt.reference_number}`,
        `Purpose: ${paymentPurposeLabel}`,
        `Amount: ${formatCurrency(receipt.amount, receipt.currency)}`,
        `Method: ${getPaymentMethodDisplay(receipt.payment_method)}`,
        `Issued: ${formatDateTime(receipt.issued_at)}`,
      ].join('\n'),
    });
  };

  const handleDownloadPlaceholder = () => {
    if (!intentId) {
      Alert.alert('Receipt unavailable', 'We couldn’t prepare this receipt download right now.');
      return;
    }

    void (async () => {
      try {
        const link = await paymentService.createUnifiedPaymentReceiptPdfLink(intentId);
        if (!link.download_url) {
          throw new Error('missing_download_url');
        }
        await WebBrowser.openBrowserAsync(link.download_url);
      } catch (downloadError) {
        const message =
          typeof downloadError === 'object' && downloadError && 'message' in downloadError
            ? String((downloadError as { message?: string }).message || '')
            : '';
        Alert.alert(
          'Download failed',
          message || 'We couldn’t prepare the receipt PDF download right now. Please try again.'
        );
      }
    })();
  };

  const openStatusScreen = () => {
    if (!intentId) {
      return;
    }

    if (paymentPurposeType === 'wallet_deposit') {
      navigation.navigate('WalletDepositStatus', {
        intentId,
        chamaId: resolvedChamaId,
        source: 'receipt',
      });
      return;
    }

    if (paymentPurposeType === 'wallet_withdrawal') {
      navigation.navigate('WalletWithdrawalDetail', {
        intentId,
        chamaId: resolvedChamaId,
        source: 'receipt',
      });
      return;
    }

    navigation.navigate('PaymentStatus', {
      intentId,
      chamaId: resolvedChamaId,
      status: currentIntent?.status,
      amount: currentIntent?.amount || receipt?.amount || '0',
      currency: currentIntent?.currency || receipt?.currency || 'KES',
      purpose: currentIntent?.purpose || paymentPurposeType,
      paymentPurposeType,
      paymentPurposeLabel,
      contributionId: resolvedContributionId,
      loanId: resolvedLoanId,
      installmentId: resolvedInstallmentId,
      targetLabel: resolvedTargetLabel,
      paymentMethod: currentIntent?.payment_method || receipt?.payment_method,
      reference: currentIntent?.reference || receipt?.reference_number,
    });
  };

  if (!intentId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title={headerTitle} showBack />
        <EmptyState
          title="Receipt unavailable"
          description="We couldn’t retrieve your receipt right now."
          icon="receipt-text-remove-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title={headerTitle} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Preparing your receipt…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title={headerTitle} showBack />
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.pendingCard}>
            <View style={styles.pendingIcon}>
              <Icon name="progress-clock" size={30} color={colors.warning} />
            </View>
            <Text style={styles.pendingTitle}>Your receipt is not ready yet.</Text>
            <Text style={styles.pendingText}>
              {error || 'The payment was recorded, but we are still preparing the receipt. Please check again shortly.'}
            </Text>
          </Card>
          <View style={styles.actions}>
            <Button
              title={refreshing ? 'Refreshing…' : 'Refresh Receipt'}
              onPress={() => void loadReceipt(true)}
              loading={refreshing}
            />
            <Button
              title={statusTitle}
              variant="outline"
              onPress={openStatusScreen}
            />
            <Button
              title={isLoanRepayment ? 'Back to Loan' : 'Back to Wallet'}
              variant="outline"
              onPress={() => {
                if (isLoanRepayment && resolvedLoanId) {
                  navigation.navigate('LoanDetail', { loanId: resolvedLoanId, chamaId: resolvedChamaId });
                  return;
                }
                navigateToWorkspaceTab(navigation as any, 'Payments', { chamaId: resolvedChamaId });
              }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title={headerTitle} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Icon name="check-decagram" size={34} color={colors.success} />
          </View>
          <Text style={styles.heroTitle}>Your receipt is ready.</Text>
          <Text style={styles.heroText}>{walletAwareHeroText}</Text>
          <Badge label="Successful" variant="success" size="sm" />
        </Card>

        <Card style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptBrand}>MyChama receipt</Text>
            <Text style={styles.receiptNumber}>{receipt.receipt_number}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Transaction reference</Text>
            <Text style={styles.value}>{receipt.reference_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment purpose</Text>
            <Text style={styles.value}>{paymentPurposeLabel}</Text>
          </View>
          {resolvedLoanId ? (
            <View style={styles.row}>
              <Text style={styles.label}>Loan reference</Text>
              <Text style={styles.value}>{resolvedLoanId}</Text>
            </View>
          ) : null}
          {resolvedInstallmentId ? (
            <View style={styles.row}>
              <Text style={styles.label}>Installment reference</Text>
              <Text style={styles.value}>{resolvedInstallmentId}</Text>
            </View>
          ) : null}
          {resolvedTargetLabel ? (
            <View style={styles.row}>
              <Text style={styles.label}>Related item</Text>
              <Text style={styles.value}>{resolvedTargetLabel}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{formatCurrency(receipt.amount, receipt.currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment method</Text>
            <Text style={styles.value}>{getPaymentMethodDisplay(receipt.payment_method)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, styles.successValue]}>Success</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Issued</Text>
            <Text style={styles.value}>{formatDateTime(receipt.issued_at)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Chama</Text>
            <Text style={styles.value}>{currentIntent?.chama_name || 'MyChama'}</Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button title="Share Receipt" onPress={() => void handleShare()} />
          <Button title="Download Receipt" variant="outline" onPress={handleDownloadPlaceholder} />
          <Button
            title={isLoanRepayment ? 'Repayment History' : 'Wallet Activity'}
            variant="outline"
            onPress={() => {
              if (isLoanRepayment && resolvedLoanId) {
                navigation.navigate('LoanRepaymentHistory', {
                  loanId: resolvedLoanId,
                  chamaId: resolvedChamaId,
                });
                return;
              }
              navigation.navigate('PaymentHistory', {
                chamaId: resolvedChamaId,
                filter: walletActivityFilter,
              });
            }}
          />
          <Button
            title={isLoanRepayment ? 'Back to Loan' : 'Back to Wallet'}
            variant="outline"
            onPress={() => {
              if (isLoanRepayment && resolvedLoanId) {
                navigation.navigate('LoanDetail', { loanId: resolvedLoanId, chamaId: resolvedChamaId });
                return;
              }
              navigateToWorkspaceTab(navigation as any, 'Payments', { chamaId: resolvedChamaId });
            }}
          />
          {linkedTarget ? (
            <Button
              title={`Open ${linkedTarget.screen === 'LoanDetail' ? 'Loan Details' : linkedTarget.screen === 'ContributionDetails' ? 'Contribution Details' : 'Penalty Details'}`}
              variant="ghost"
              onPress={() => (navigation as any).navigate(linkedTarget.screen, linkedTarget.params)}
            />
          ) : null}
          <Button
            title={statusTitle}
            variant="ghost"
            onPress={openStatusScreen}
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
  heroCard: {
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[6],
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E7F7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
  },
  heroText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    textAlign: 'center',
  },
  receiptCard: {
    gap: spacing[3],
    backgroundColor: '#FFFEFA',
    borderWidth: 1,
    borderColor: '#F1E7C6',
  },
  receiptHeader: {
    gap: spacing[1],
  },
  receiptBrand: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  receiptNumber: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    alignItems: 'center',
  },
  label: {
    flex: 1,
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  value: {
    flex: 1,
    textAlign: 'right',
    color: colors.neutral[900],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  successValue: {
    color: colors.success,
  },
  pendingCard: {
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[6],
  },
  pendingIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF7E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
  },
  pendingText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    textAlign: 'center',
  },
  actions: {
    gap: spacing[3],
  },
});

export default ReceiptScreen;
