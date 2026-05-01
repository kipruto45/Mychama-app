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

type WalletDepositNavigationProp = NativeStackNavigationProp<MainStackParamList, 'WalletDeposit'>;
type WalletDepositRouteProp = RouteProp<MainStackParamList, 'WalletDeposit'>;

const QUICK_AMOUNTS = ['500', '1000', '2000'];

export const WalletDepositScreen: React.FC = () => {
  const navigation = useNavigation<WalletDepositNavigationProp>();
  const route = useRoute<WalletDepositRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const {
    activeChamaId: storedChamaId,
    depositDraftAmount,
    setActiveChamaId,
    setDepositDraft,
    setLastVisitedScreen,
  } = useMemberWalletFlowStore();

  const chamaId = route.params?.chamaId || activeChamaId || storedChamaId || undefined;
  const [workspace, setWorkspace] = useState<MemberWalletWorkspace | null>(null);
  const [amount, setAmount] = useState(depositDraftAmount || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLastVisitedScreen('WalletDeposit');
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
        setError(null);
      } catch {
        setError('We couldn’t load your wallet right now. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void loadWorkspace();
  }, [chamaId]);

  const amountValue = Number(amount || 0);
  const validationError = useMemo(() => {
    if (!amount) {
      return null;
    }
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return 'Enter a valid amount to continue.';
    }
    if (workspace && amountValue < Number(workspace.limits.minDeposit)) {
      return `Minimum deposit is ${formatCurrency(workspace.limits.minDeposit, workspace.currency)}.`;
    }
    if (workspace && amountValue > Number(workspace.limits.maxDeposit)) {
      return `Maximum deposit is ${formatCurrency(workspace.limits.maxDeposit, workspace.currency)}.`;
    }
    return null;
  }, [amount, amountValue, workspace]);

  const handleContinue = () => {
    if (!chamaId || !workspace || validationError || !amount) {
      setError(validationError || 'Enter a valid amount to continue.');
      return;
    }

    setDepositDraft({ amount, method: null });
    navigation.navigate('WalletDepositMethod', {
      chamaId,
      amount,
      currency: workspace.currency,
      walletBalance: workspace.availableBalance,
    });
  };

  if (!chamaId && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Deposit to Wallet" showBack />
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
        <ModernHeader title="Deposit to Wallet" subtitle={activeChama?.name} showBack />
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
        <ModernHeader title="Deposit to Wallet" subtitle={activeChama?.name} showBack />
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

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Deposit to Wallet" subtitle={activeChama?.name} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Wallet funding</Text>
          <Text style={styles.heroTitle}>Add money to your wallet securely.</Text>
          <Text style={styles.heroText}>
            Add money to use for contributions and loan repayments whenever you need it.
          </Text>
        </Card>

        <Card style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Current wallet balance</Text>
              <Text style={styles.balanceValue}>
                {formatCurrency(workspace.availableBalance, workspace.currency)}
              </Text>
            </View>
            <View style={styles.balanceBadge}>
              <Icon name="wallet-plus-outline" size={20} color={colors.primary[600]} />
            </View>
          </View>
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
              style={[styles.amountChip, !QUICK_AMOUNTS.includes(amount) && amount ? styles.amountChipSelected : null]}
              onPress={() => setAmount('')}
            >
              <Text
                style={[
                  styles.amountChipText,
                  !QUICK_AMOUNTS.includes(amount) && amount ? styles.amountChipTextSelected : null,
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.helperCard}>
            <Icon name="shield-check-outline" size={18} color={colors.success} />
            <Text style={styles.helperText}>
              Deposits between {formatCurrency(workspace.limits.minDeposit, workspace.currency)} and{' '}
              {formatCurrency(workspace.limits.maxDeposit, workspace.currency)} are supported right now.
            </Text>
          </View>
        </Card>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <Button title="Continue" onPress={handleContinue} disabled={Boolean(validationError) || !amount} />
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
    backgroundColor: '#0E2C20',
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    ...shadows.md,
  },
  heroEyebrow: {
    color: '#9EE5C2',
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
    color: '#D9F2E5',
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: '#EAF8F1',
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
    backgroundColor: '#D8F4E4',
  },
  amountChipText: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  amountChipTextSelected: {
    color: colors.primary[700],
  },
  helperCard: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-start',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    backgroundColor: '#F3FBF6',
  },
  helperText: {
    flex: 1,
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  errorText: {
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
});

export default WalletDepositScreen;
