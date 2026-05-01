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

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { navigateToWorkspaceTab } from '@/navigation/workspaceTabNavigation';
import { memberWalletService, type MemberWalletWorkspace } from '@/services/memberWalletService';
import { useMemberWalletFlowStore } from '@/store/memberWalletFlowStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';

type WalletWithdrawNavigationProp = NativeStackNavigationProp<MainStackParamList, 'WalletWithdraw'>;
type WalletWithdrawRouteProp = RouteProp<MainStackParamList, 'WalletWithdraw'>;

const QUICK_AMOUNTS = ['500', '1000'];

export const WalletWithdrawScreen: React.FC = () => {
  const navigation = useNavigation<WalletWithdrawNavigationProp>();
  const route = useRoute<WalletWithdrawRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const {
    activeChamaId: storedChamaId,
    withdrawalDraftAmount,
    setActiveChamaId,
    setLastVisitedScreen,
    setWithdrawalDraft,
  } = useMemberWalletFlowStore();

  const chamaId = route.params?.chamaId || activeChamaId || storedChamaId || undefined;
  const [workspace, setWorkspace] = useState<MemberWalletWorkspace | null>(null);
  const [amount, setAmount] = useState(withdrawalDraftAmount || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLastVisitedScreen('WalletWithdraw');
    setActiveChamaId(chamaId || null);
  }, [chamaId, setActiveChamaId, setLastVisitedScreen]);

  useEffect(() => {
    const loadWorkspace = async () => {
      if (!chamaId) {
        setLoading(false);
        return;
      }
      try {
        const response = await memberWalletService.getWorkspace(chamaId);
        setWorkspace(response);
      } catch {
        setError('We couldn’t load your wallet right now. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    void loadWorkspace();
  }, [chamaId]);

  const amountValue = Number(amount || 0);
  const withdrawableBalance = Number(workspace?.withdrawableBalance || 0);
  const validationError = useMemo(() => {
    if (!amount) return null;
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return 'Enter a valid amount to continue.';
    }
    if (workspace && amountValue < Number(workspace.limits.minWithdrawal)) {
      return `Minimum withdrawal is ${formatCurrency(
        workspace.limits.minWithdrawal,
        workspace.currency
      )}.`;
    }
    if (workspace && amountValue > Number(workspace.limits.maxWithdrawal)) {
      return `Maximum withdrawal is ${formatCurrency(
        workspace.limits.maxWithdrawal,
        workspace.currency
      )}.`;
    }
    if (workspace && amountValue > Number(workspace.limits.remainingDaily)) {
      return 'You don’t have enough withdrawable balance.';
    }
    if (amountValue > withdrawableBalance) {
      return 'You don’t have enough withdrawable balance.';
    }
    return null;
  }, [amount, amountValue, withdrawableBalance, workspace]);

  const handleContinue = () => {
    if (!workspace || !chamaId || validationError || !amount) {
      setError(validationError || 'Enter a valid amount to continue.');
      return;
    }

    setWithdrawalDraft({ amount, method: 'mpesa' });
    navigation.navigate('WalletWithdrawalReview', {
      chamaId,
      amount,
      currency: workspace.currency,
      paymentMethod: 'mpesa',
      phone: '',
      withdrawableBalance: workspace.withdrawableBalance,
    });
  };

  if (!chamaId && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Withdraw from Wallet" showBack />
        <EmptyState
          title="No chama selected"
          description="Choose a chama first so we can open your wallet."
          icon="wallet-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Withdraw from Wallet" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading wallet details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!workspace) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Withdraw from Wallet" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="We couldn’t load your wallet right now. Please try again."
          description="Return to your wallet overview or refresh and try again."
          icon="cloud-alert-outline"
          action={{
            label: 'Back to Wallet',
            onPress: () => navigateToWorkspaceTab(navigation as any, 'Payments', { chamaId }),
          }}
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  const withdrawalBlocked = Number(workspace.withdrawableBalance) <= 0;

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Withdraw from Wallet" subtitle={activeChama?.name} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Wallet withdrawal</Text>
          <Text style={styles.heroTitle}>Withdraw from your available wallet balance.</Text>
          <Text style={styles.heroText}>
            Review the amount carefully before sending your withdrawal request.
          </Text>
        </Card>

        <Card style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Withdrawable balance</Text>
              <Text style={styles.balanceValue}>
                {formatCurrency(workspace.withdrawableBalance, workspace.currency)}
              </Text>
            </View>
            <View style={styles.balanceBadge}>
              <Icon name="bank-transfer-out" size={20} color={colors.primary[600]} />
            </View>
          </View>
          <Text style={styles.balanceNote}>
            Daily remaining: {formatCurrency(workspace.limits.remainingDaily, workspace.currency)}
          </Text>
        </Card>

        <Card style={styles.formCard}>
          <Input
            label="Amount"
            placeholder="Enter amount"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(value) => {
              setAmount(value.replace(/[^0-9.]/g, ''));
              if (error) setError(null);
            }}
            error={validationError || undefined}
          />
          <View style={styles.chipsRow}>
            {QUICK_AMOUNTS.map((chip) => (
              <TouchableOpacity
                key={chip}
                activeOpacity={0.85}
                style={[
                  styles.amountChip,
                  amount === chip ? styles.amountChipSelected : null,
                ]}
                onPress={() => setAmount(chip)}
              >
                <Text
                  style={[
                    styles.amountChipText,
                    amount === chip ? styles.amountChipTextSelected : null,
                  ]}
                >
                  {formatCurrency(chip, workspace.currency)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.amountChip, styles.fullChip]}
              onPress={() => setAmount(String(workspace.withdrawableBalance))}
            >
              <Text style={styles.amountChipText}>Full Available</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.helperCard}>
            <Icon name="information-outline" size={18} color={colors.warning} />
            <Text style={styles.helperText}>
              Minimum withdrawal {formatCurrency(workspace.limits.minWithdrawal, workspace.currency)}.
              Processing usually starts after your request is submitted.
            </Text>
          </View>
        </Card>

        {withdrawalBlocked ? (
          <Text style={styles.warningText}>You don’t have enough withdrawable balance.</Text>
        ) : null}
        {error ? <Text style={styles.warningText}>{error}</Text> : null}

        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={withdrawalBlocked || Boolean(validationError) || !amount}
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
  content: {
    padding: spacing[5],
    gap: spacing[4],
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
    backgroundColor: '#20150E',
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    ...shadows.md,
  },
  heroEyebrow: {
    color: '#E7C2A4',
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    marginBottom: spacing[2],
  },
  heroText: {
    color: '#F2E4DA',
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    lineHeight: 22,
  },
  balanceCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[2],
  },
  balanceValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
  },
  balanceBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F1EB',
  },
  balanceNote: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[3],
  },
  formCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[1],
    marginBottom: spacing[3],
  },
  amountChip: {
    borderRadius: borderRadius.full,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.neutral[100],
  },
  amountChipSelected: {
    backgroundColor: '#F9F1EB',
  },
  amountChipText: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  amountChipTextSelected: {
    color: colors.primary[700],
  },
  fullChip: {
    backgroundColor: '#EDEFF2',
  },
  helperCard: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-start',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    backgroundColor: '#FBF7F3',
  },
  helperText: {
    flex: 1,
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  warningText: {
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
});

export default WalletWithdrawScreen;
