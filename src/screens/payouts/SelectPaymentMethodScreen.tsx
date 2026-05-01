/**
 * Select Payment Method Screen
 *
 * Lets treasurer update payout method before approval.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { Button, Card, EmptyState } from '@/components/ui';
import { paymentMethodDisplay, PayoutStackParamList } from '@/navigation/PayoutNavigator.types';
import { useToast } from '@/components/ui/ToastProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { usePayoutStore } from '@/store/payoutStore';
import { colors as palette, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';
import { memberWalletService, type WalletBalanceState } from '@/services/memberWalletService';

type NavProp = NativeStackNavigationProp<PayoutStackParamList, 'SelectPaymentMethod'>;
type RouteProps = RouteProp<PayoutStackParamList, 'SelectPaymentMethod'>;

const METHODS = [
  { key: 'mpesa' as const, title: 'M-Pesa', description: 'Instant transfer to member phone number.' },
  { key: 'wallet' as const, title: 'MyChama Wallet', description: 'Credit member wallet balance.' },
  { key: 'bank_transfer' as const, title: 'Bank Transfer', description: 'Transfer to the member’s bank account.' },
];

export default function SelectPaymentMethodScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { colors: themeColors } = useTheme();
  const toast = useToast();
  const { payoutId } = route.params;

  const {
    currentPayout,
    isLoadingDetail,
    detailError,
    isSubmitting,
    fetchPayoutDetail,
    setPayoutMethod,
  } = usePayoutStore();

  const [selected, setSelected] = useState<'bank_transfer' | 'mpesa' | 'wallet' | null>(null);
  const [walletBalanceState, setWalletBalanceState] = useState<WalletBalanceState | null>(null);
  const [walletAvailableBalance, setWalletAvailableBalance] = useState<string>('0');
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  useEffect(() => {
    void fetchPayoutDetail(payoutId);
  }, [fetchPayoutDetail, payoutId]);

  useEffect(() => {
    if (currentPayout?.payout_method) {
      setSelected(currentPayout.payout_method);
    }
  }, [currentPayout?.payout_method]);

  // Fetch wallet status to check if wallet is active
  useEffect(() => {
    if (!currentPayout?.chama) return;

    const loadWalletStatus = async () => {
      try {
        setIsLoadingWallet(true);
        const workspace = await memberWalletService.getWorkspace(currentPayout.chama);
        setWalletBalanceState(workspace.balanceState);
        setWalletAvailableBalance(workspace.availableBalance);
      } catch (error) {
        console.error('Failed to load wallet status:', error);
        // If wallet status fails to load, treat wallet as unavailable
        setWalletBalanceState('temporarily_unavailable');
      } finally {
        setIsLoadingWallet(false);
      }
    };

    void loadWalletStatus();
  }, [currentPayout?.chama]);

  const memberName = useMemo(() => {
    if (!currentPayout) return '';
    const first = currentPayout.member?.user?.first_name || '';
    const last = currentPayout.member?.user?.last_name || '';
    return [first, last].join(' ').trim();
  }, [currentPayout]);

  // Check if wallet is active and can be used for payouts
  const isWalletActive = useMemo(() => {
    if (walletBalanceState === 'positive_balance') {
      return true;
    }
    if (walletBalanceState === 'zero_balance') {
      return false;
    }
    if (walletBalanceState === 'pending_update') {
      return false; // Wallet has pending transactions, not safe to use
    }
    return false; // 'temporarily_unavailable' or unknown state
  }, [walletBalanceState]);

  // Get reason why wallet is not active
  const walletInactiveReason = useMemo(() => {
    if (walletBalanceState === 'zero_balance') {
      return 'No available balance';
    }
    if (walletBalanceState === 'pending_update') {
      return 'Wallet has pending updates';
    }
    if (walletBalanceState === 'temporarily_unavailable') {
      return 'Wallet temporarily unavailable';
    }
    return 'Wallet not available';
  }, [walletBalanceState]);

  const submit = async () => {
    if (!selected) {
      toast.showError('Select a method', 'Choose a payment method to continue.');
      return;
    }

    // Ensure wallet is active if selected
    if (selected === 'wallet' && !isWalletActive) {
      toast.showError('Wallet unavailable', `Cannot use wallet: ${walletInactiveReason}`);
      return;
    }

    try {
      await setPayoutMethod(payoutId, selected);
      toast.showSuccess('Updated', 'Payment method updated.');
      navigation.goBack();
    } catch (e: any) {
      toast.showError('Update failed', e?.message || 'Please try again.');
    }
  };

  if (isLoadingDetail) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={palette.primary[600]} />
      </View>
    );
  }

  if (detailError || !currentPayout) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: themeColors.background }]}>
        <EmptyState title="Payout unavailable" message={detailError || 'Unable to load payout right now.'} />
        <View style={styles.actionsRow}>
          <Button title="Go Back" onPress={() => navigation.goBack()} variant="secondary" />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        <Card>
          <Text style={[styles.title, { color: themeColors.text }]}>Payment Method</Text>
          <Text style={[styles.amount, { color: palette.primary[700] }]}>
            {formatCurrency(currentPayout.amount, currentPayout.currency || 'KES')}
          </Text>
          <Text style={[styles.subtle, { color: themeColors.textSecondary }]}>
            To {memberName || currentPayout.member?.user?.phone || 'member'}
          </Text>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Choose method</Text>
          {METHODS.map((method) => {
            const active = selected === method.key;
            const isWalletMethod = method.key === 'wallet';
            const methodDisabled = isWalletMethod && !isWalletActive;

            return (
              <TouchableOpacity
                key={method.key}
                activeOpacity={0.9}
                disabled={methodDisabled}
                onPress={() => {
                  if (!methodDisabled) {
                    setSelected(method.key);
                  }
                }}
                style={[
                  styles.methodRow,
                  {
                    borderColor: active ? palette.primary[300] : methodDisabled ? palette.error[200] : themeColors.border,
                    backgroundColor: active ? palette.primary[50] : methodDisabled ? palette.error[50] : 'transparent',
                    opacity: methodDisabled ? 0.6 : 1,
                  },
                ]}
              >
                <View style={styles.methodTop}>
                  <View style={[styles.radio, { borderColor: active ? palette.primary[600] : methodDisabled ? palette.error[400] : themeColors.border }]}>
                    {active ? <View style={[styles.radioFill, { backgroundColor: palette.primary[600] }]} /> : null}
                  </View>
                  <View style={styles.methodText}>
                    <View style={styles.methodHeaderRow}>
                      <Text style={[styles.methodTitle, { color: themeColors.text }]}>
                        {paymentMethodDisplay[method.key] || method.title}
                      </Text>
                      {methodDisabled && (
                        <Icon
                          name="alert-circle-outline"
                          size={16}
                          color={palette.error[500]}
                          style={styles.warningIcon}
                        />
                      )}
                    </View>
                    <Text style={[styles.methodDesc, { color: methodDisabled ? palette.error[600] : themeColors.textSecondary }]}>
                      {methodDisabled ? walletInactiveReason : method.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </Card>

        <View style={styles.actionsRow}>
          <Button title="Save" onPress={submit} loading={isSubmitting} />
          <Button title="Cancel" onPress={() => navigation.goBack()} variant="secondary" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
  },
  amount: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
  },
  subtle: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  methodRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  methodTop: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  methodText: {
    flex: 1,
    gap: 4,
  },
  methodHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  warningIcon: {
    marginTop: 2,
  },
  methodTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
  },
  methodDesc: {
    fontSize: typography.fontSize.sm,
  },
  actionsRow: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
});
