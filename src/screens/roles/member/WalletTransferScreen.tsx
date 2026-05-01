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
import { chamaService } from '@/services/chamaService';
import { memberWalletService, type MemberWalletWorkspace } from '@/services/memberWalletService';
import { useAuthStore } from '@/store/authStore';
import { useMemberWalletFlowStore } from '@/store/memberWalletFlowStore';
import type { Membership } from '@/types';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';

type WalletTransferNavigationProp = NativeStackNavigationProp<MainStackParamList, 'WalletTransfer'>;
type WalletTransferRouteProp = RouteProp<MainStackParamList, 'WalletTransfer'>;

const fallbackMinTransfer = 10;
const fallbackMaxTransfer = 150000;

export const WalletTransferScreen: React.FC = () => {
  const navigation = useNavigation<WalletTransferNavigationProp>();
  const route = useRoute<WalletTransferRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const currentUser = useAuthStore((state) => state.user);
  const { setActiveChamaId, setLastVisitedScreen } = useMemberWalletFlowStore();

  const chamaId = route.params?.chamaId || activeChamaId || undefined;

  const [workspace, setWorkspace] = useState<MemberWalletWorkspace | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Membership | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    setLastVisitedScreen('WalletTransfer');
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
        const [workspaceResponse, membersResponse] = await Promise.all([
          memberWalletService.getWorkspace(chamaId),
          chamaService.getMembers(chamaId),
        ]);
        if (!mounted) return;
        setWorkspace(workspaceResponse);
        setMembers(membersResponse);
        setError(null);
      } catch (serviceError) {
        const message =
          typeof serviceError === 'object' && serviceError && 'message' in serviceError
            ? String((serviceError as { message?: string }).message || '')
            : '';
        if (!mounted) return;
        setError(message || 'We couldn’t load your wallet members right now.');
        setWorkspace(null);
        setMembers([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [chamaId]);

  const currency = workspace?.currency || activeChama?.currency || 'KES';
  const minTransfer = Number(workspace?.limits.minTransfer || fallbackMinTransfer);
  const maxTransfer = Number(workspace?.limits.maxTransfer || fallbackMaxTransfer);
  const withdrawableBalance = Number(workspace?.withdrawableBalance || 0);
  const amountValue = Number(amount || 0);

  const filteredMembers = useMemo(() => {
    const lowered = search.trim().toLowerCase();
    return members
      .filter((membership) => membership?.user?.id && membership.user.id !== currentUser?.id)
      .filter((membership) => {
        if (!lowered) return true;
        const name = String(membership.user?.full_name || '').toLowerCase();
        const phone = String(membership.user?.phone || '').toLowerCase();
        return name.includes(lowered) || phone.includes(lowered);
      });
  }, [currentUser?.id, members, search]);

  const validationError = useMemo(() => {
    if (!amount) return null;
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return 'Enter a valid amount to continue.';
    }
    if (amountValue < minTransfer) {
      return `Minimum transfer is ${formatCurrency(String(minTransfer), currency)}.`;
    }
    if (amountValue > maxTransfer) {
      return `Maximum transfer is ${formatCurrency(String(maxTransfer), currency)}.`;
    }
    if (amountValue > withdrawableBalance) {
      return 'You don’t have enough wallet balance for this transfer.';
    }
    return null;
  }, [amount, amountValue, currency, maxTransfer, minTransfer, withdrawableBalance]);

  const canContinue = Boolean(
    chamaId &&
      workspace &&
      selectedMember &&
      amount &&
      !validationError &&
      withdrawableBalance > 0
  );

  if (!chamaId && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Transfer to Member" showBack />
        <EmptyState
          title="No chama selected"
          description="Choose a chama first so we can load members to transfer to."
          icon="account-multiple-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Transfer to Member" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading eligible members…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!workspace) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Transfer to Member" subtitle={activeChama?.name} showBack />
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
      <ModernHeader title="Transfer to Member" subtitle={activeChama?.name} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Wallet transfer</Text>
          <Text style={styles.heroTitle}>Send wallet balance to another member.</Text>
          <Text style={styles.heroText}>
            Transfers move instantly and appear in your wallet activity.
          </Text>
        </Card>

        <Card style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Available balance</Text>
              <Text style={styles.balanceValue}>
                {formatCurrency(workspace.withdrawableBalance, currency)}
              </Text>
            </View>
            <View style={styles.balanceBadge}>
              <Icon name="account-arrow-right" size={20} color={colors.primary[600]} />
            </View>
          </View>
          <Text style={styles.balanceNote}>
            Min {formatCurrency(String(minTransfer), currency)} • Max {formatCurrency(String(maxTransfer), currency)}
          </Text>
        </Card>

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

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
          <Input
            label="Note (optional)"
            placeholder="Add a note for the recipient"
            value={note}
            onChangeText={setNote}
          />
        </Card>

        <Card style={styles.membersCard}>
          <Text style={styles.sectionTitle}>Select a member</Text>
          <Input
            label="Search members"
            placeholder="Search by name or phone"
            value={search}
            onChangeText={setSearch}
          />
          <View style={styles.memberList}>
            {filteredMembers.length ? (
              filteredMembers.map((membership) => {
                const selected = membership.id === selectedMember?.id;
                const displayName = membership.user?.full_name || membership.user?.phone || 'Member';
                const displayPhone = membership.user?.phone || '';
                return (
                  <TouchableOpacity
                    key={membership.id}
                    activeOpacity={0.86}
                    style={[styles.memberRow, selected ? styles.memberRowSelected : null]}
                    onPress={() => setSelectedMember(membership)}
                  >
                    <View style={styles.memberIcon}>
                      <Icon name="account-outline" size={18} color={selected ? colors.primary[700] : colors.neutral[600]} />
                    </View>
                    <View style={styles.memberCopy}>
                      <Text style={styles.memberName}>{displayName}</Text>
                      {displayPhone ? <Text style={styles.memberMeta}>{displayPhone}</Text> : null}
                    </View>
                    {selected ? (
                      <Icon name="check-circle" size={18} color={colors.primary[700]} />
                    ) : null}
                  </TouchableOpacity>
                );
              })
            ) : (
              <EmptyState
                title={search.trim() ? 'No matching members' : 'No eligible members'}
                description={
                  search.trim()
                    ? 'Try a different keyword to find the member you want.'
                    : 'Members will appear here once they are active in this chama.'
                }
                icon="account-search-outline"
              />
            )}
          </View>
        </Card>

        <Button
          title="Continue"
          disabled={!canContinue}
          onPress={() => {
            if (!selectedMember) return;
            const displayName = selectedMember.user?.full_name || selectedMember.user?.phone || 'Member';
            navigation.navigate('WalletTransferReview', {
              chamaId: chamaId!,
              recipientMemberId: selectedMember.user.id,
              recipientName: displayName,
              recipientPhone: selectedMember.user?.phone || undefined,
              amount,
              currency,
              note: note.trim() || undefined,
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
    backgroundColor: '#0F1B2E',
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    ...shadows.md,
  },
  heroEyebrow: {
    color: '#B6D5FF',
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
    color: '#DDEBFF',
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
  },
  balanceValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    marginTop: spacing[2],
  },
  balanceBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary[500]}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceNote: {
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
  formCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
    gap: spacing[4],
  },
  membersCard: {
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
  memberList: {
    gap: spacing[2],
  },
  memberRow: {
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
  memberRowSelected: {
    borderColor: colors.primary[500],
    backgroundColor: `${colors.primary[500]}10`,
  },
  memberIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCopy: {
    flex: 1,
  },
  memberName: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  memberMeta: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
});

export default WalletTransferScreen;
