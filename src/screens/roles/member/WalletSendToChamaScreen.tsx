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
import { financeService } from '@/services/financeService';
import { memberWalletService, type MemberWalletWorkspace } from '@/services/memberWalletService';
import { useMemberWalletFlowStore } from '@/store/memberWalletFlowStore';
import type { ContributionType } from '@/types';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';

type WalletSendToChamaNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'WalletSendToChama'
>;
type WalletSendToChamaRouteProp = RouteProp<MainStackParamList, 'WalletSendToChama'>;

export const WalletSendToChamaScreen: React.FC = () => {
  const navigation = useNavigation<WalletSendToChamaNavigationProp>();
  const route = useRoute<WalletSendToChamaRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const { setActiveChamaId, setLastVisitedScreen } = useMemberWalletFlowStore();

  const chamaId = route.params?.chamaId || activeChamaId || undefined;

  const [workspace, setWorkspace] = useState<MemberWalletWorkspace | null>(null);
  const [types, setTypes] = useState<ContributionType[]>([]);
  const [selectedType, setSelectedType] = useState<ContributionType | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLastVisitedScreen('WalletSendToChama');
    setActiveChamaId(chamaId || null);
  }, [chamaId, setActiveChamaId, setLastVisitedScreen]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!chamaId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [workspaceResponse, typesResponse] = await Promise.all([
          memberWalletService.getWorkspace(chamaId),
          financeService.getContributionTypes(chamaId),
        ]);
        if (!mounted) return;
        setWorkspace(workspaceResponse);
        const activeTypes = typesResponse.filter((item) => item.is_active);
        setTypes(activeTypes);
        if (!selectedType && activeTypes.length) {
          setSelectedType(activeTypes[0]);
          setAmount(activeTypes[0].default_amount || '');
        }
        setError(null);
      } catch (serviceError) {
        const message =
          typeof serviceError === 'object' && serviceError && 'message' in serviceError
            ? String((serviceError as { message?: string }).message || '')
            : '';
        if (!mounted) return;
        setError(message || 'We couldn’t load contribution types right now.');
        setWorkspace(null);
        setTypes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamaId]);

  const currency = workspace?.currency || activeChama?.currency || 'KES';
  const availableBalance = Number(workspace?.withdrawableBalance || 0);
  const amountValue = Number(amount || 0);

  const validationError = useMemo(() => {
    if (!amount) return null;
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return 'Enter a valid amount to continue.';
    }
    if (amountValue > availableBalance) {
      return 'You do not have enough wallet balance to contribute.';
    }
    return null;
  }, [amount, amountValue, availableBalance]);

  const canContinue = Boolean(chamaId && workspace && selectedType && amount && !validationError);

  if (!chamaId && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Send to Chama" showBack />
        <EmptyState
          title="No chama selected"
          description="Choose a chama first so we can load contribution types."
          icon="account-group-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Send to Chama" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading contribution details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!workspace) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Send to Chama" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="We couldn’t load your wallet right now."
          description="Return to your wallet overview and try again."
          icon="cloud-alert-outline"
          action={{ label: 'Back to Wallet', onPress: () => navigateToWorkspaceTab(navigation as any, 'Payments', { chamaId }) }}
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Send to Chama" subtitle={activeChama?.name} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>From wallet</Text>
          <Text style={styles.heroTitle}>Send wallet balance to your chama.</Text>
          <Text style={styles.heroText}>
            Choose the contribution type and amount. The funds are deducted from your wallet immediately.
          </Text>
        </Card>

        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available wallet balance</Text>
          <Text style={styles.balanceValue}>{formatCurrency(workspace.withdrawableBalance, currency)}</Text>
          <Text style={styles.balanceMeta}>This is the maximum you can contribute right now.</Text>
        </Card>

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        <Card style={styles.typesCard}>
          <Text style={styles.sectionTitle}>Select contribution type</Text>
          <View style={styles.typesList}>
            {types.length ? (
              types.map((type) => {
                const selected = type.id === selectedType?.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    activeOpacity={0.86}
                    style={[styles.typeRow, selected ? styles.typeRowSelected : null]}
                    onPress={() => {
                      setSelectedType(type);
                      setAmount(type.default_amount || '');
                      setError(null);
                    }}
                  >
                    <View style={styles.typeIcon}>
                      <Icon
                        name="cash-plus"
                        size={18}
                        color={selected ? colors.primary[700] : colors.neutral[600]}
                      />
                    </View>
                    <View style={styles.typeCopy}>
                      <Text style={styles.typeName}>{type.name}</Text>
                      <Text style={styles.typeMeta}>
                        Default {formatCurrency(type.default_amount || '0.00', currency)}
                      </Text>
                    </View>
                    {selected ? <Icon name="check-circle" size={18} color={colors.primary[700]} /> : null}
                  </TouchableOpacity>
                );
              })
            ) : (
              <EmptyState
                title="No contribution types configured"
                description="Ask a chama admin to configure contribution types before contributing from wallet."
                icon="format-list-bulleted"
              />
            )}
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
            {selectedType?.default_amount ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.amountChip}
                onPress={() => setAmount(String(selectedType.default_amount))}
              >
                <Text style={styles.amountChipText}>Use default</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.amountChip}
              onPress={() => setAmount(String(workspace.withdrawableBalance))}
            >
              <Text style={styles.amountChipText}>Full balance</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Button
          title="Continue"
          disabled={!canContinue}
          onPress={() => {
            if (!selectedType) return;
            navigation.navigate('WalletSendToChamaReview', {
              chamaId: chamaId!,
              contributionTypeId: selectedType.id,
              contributionTypeName: selectedType.name,
              amount,
              currency,
              availableBalance: workspace.withdrawableBalance,
            });
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
  balanceLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  balanceValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    marginTop: spacing[2],
  },
  balanceMeta: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[3],
  },
  errorCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorText: {
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  typesCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
    gap: spacing[4],
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
  },
  typesList: {
    gap: spacing[2],
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: '#FFFFFF',
  },
  typeRowSelected: {
    borderColor: colors.primary[500],
    backgroundColor: `${colors.primary[500]}10`,
  },
  typeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeCopy: {
    flex: 1,
  },
  typeName: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  typeMeta: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  formCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
    gap: spacing[4],
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  amountChip: {
    borderRadius: borderRadius.full,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: '#FFFFFF',
  },
  amountChipText: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
});

export default WalletSendToChamaScreen;
