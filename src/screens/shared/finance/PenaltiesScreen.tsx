import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
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

import { useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { Badge, Button, Card, EmptyState, Input, Modal } from '@/components/ui';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { chamaService } from '@/services/chamaService';
import { financeService } from '@/services/financeService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { Membership, Penalty } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

type PenaltiesScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Penalties'>;
type PenaltiesScreenRouteProp = RouteProp<MainStackParamList, 'Penalties'>;

const getAgingBucket = (dueDate: string) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Current';
  if (diffDays <= 30) return '1-30 days';
  if (diffDays <= 60) return '31-60 days';
  return '61+ days';
};

export const PenaltiesScreen: React.FC = () => {
  const navigation = useNavigation<PenaltiesScreenNavigationProp>();
  const route = useRoute<PenaltiesScreenRouteProp>();
  const routeChamaId = route.params?.chamaId;
  const routeMemberId = route.params?.memberId;
  const routeSuggestedAmount = route.params?.suggestedAmount;
  const routeReason = route.params?.reason;
  const { activeChama, activeChamaId, isLoading: isLoadingChamaContext } = useActiveChama();

  const chamaId = routeChamaId || activeChamaId || '';
  const currency = activeChama?.currency || 'KES';

  const canIssuePenalty = useCanPerformAction(Permission.CAN_ISSUE_PENALTY, chamaId || undefined);
  const canAdjustFinance = useCanPerformAction(Permission.CAN_MAKE_ADJUSTMENTS, chamaId || undefined);

  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [paymentPenalty, setPaymentPenalty] = useState<Penalty | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('cash');

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(routeMemberId || null);
  const [amount, setAmount] = useState(routeSuggestedAmount || '');
  const [reason, setReason] = useState(routeReason || '');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));

  const loadPenaltyData = async () => {
    if (!chamaId || isLoadingChamaContext) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [memberRows, penaltyRows] = await Promise.all([
        chamaService.getMembers(chamaId).catch(() => []),
        financeService.getPenalties(chamaId).catch(() => []),
      ]);

      const activeMembers = memberRows.filter((member) => member.is_active && member.is_approved);
      setMembers(activeMembers);
      setPenalties(
        penaltyRows.sort((left, right) => new Date(left.due_date).getTime() - new Date(right.due_date).getTime())
      );

      if (!selectedMemberId && activeMembers.length > 0) {
        setSelectedMemberId(activeMembers[0].user.id);
      }
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to load penalties.')
          : 'Unable to load penalties.';
      setError(message);
      setMembers([]);
      setPenalties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPenaltyData();
  }, [chamaId, isLoadingChamaContext]);

  useEffect(() => {
    if (routeMemberId || routeSuggestedAmount || routeReason) {
      setFormVisible(true);
    }
  }, [routeMemberId, routeSuggestedAmount, routeReason]);

  const summary = useMemo(() => {
    const pending = penalties.filter((penalty) => ['pending', 'due', 'overdue'].includes(penalty.status));
    const aging = {
      current: 0,
      days30: 0,
      days60: 0,
      days61: 0,
    };

    pending.forEach((penalty) => {
      const bucket = getAgingBucket(penalty.due_date);
      if (bucket === 'Current') aging.current += Number(penalty.amount || 0);
      if (bucket === '1-30 days') aging.days30 += Number(penalty.amount || 0);
      if (bucket === '31-60 days') aging.days60 += Number(penalty.amount || 0);
      if (bucket === '61+ days') aging.days61 += Number(penalty.amount || 0);
    });

    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, penalty) => sum + Number(penalty.amount || 0), 0),
      aging,
    };
  }, [penalties]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPenaltyData();
    setRefreshing(false);
  };

  const handleIssuePenalty = async () => {
    if (!selectedMemberId) {
      Alert.alert('Member required', 'Choose a member before issuing a fine.');
      return;
    }

    if (!amount.trim() || Number(amount) <= 0) {
      Alert.alert('Amount required', 'Enter a valid penalty amount.');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Reason required', 'Explain why the fine is being issued.');
      return;
    }

    setSaving(true);

    try {
      await financeService.createPenalty(chamaId, {
        member_id: selectedMemberId,
        amount,
        reason: reason.trim(),
        due_date: dueDate,
      });

      setFormVisible(false);
      setAmount('');
      setReason('');
      setDueDate(new Date().toISOString().slice(0, 10));
      await loadPenaltyData();
      Alert.alert('Penalty issued', 'The fine has been recorded and is now part of the finance trail.');
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to issue penalty.')
          : 'Unable to issue penalty.';
      Alert.alert('Penalty failed', message);
    } finally {
      setSaving(false);
    }
  };

  const handleResolvePenalty = (penalty: Penalty) => {
    setPaymentPenalty(penalty);
    setPaymentAmount(penalty.outstanding_amount || penalty.amount);
    setPaymentReference('');
    setPaymentMethod('cash');
  };

  const submitPenaltyPayment = async () => {
    if (!paymentPenalty) {
      return;
    }
    if (!paymentAmount.trim() || Number(paymentAmount) <= 0) {
      Alert.alert('Payment amount required', 'Enter the amount collected for this fine.');
      return;
    }

    setSaving(true);
    try {
      await financeService.resolvePenalty(chamaId, paymentPenalty.id, {
        amount: paymentAmount,
        method: paymentMethod,
        transaction_reference: paymentReference.trim() || undefined,
      });
      setPaymentPenalty(null);
      setPaymentAmount('');
      setPaymentReference('');
      await loadPenaltyData();
      Alert.alert('Payment recorded', 'The fine payment has been posted successfully.');
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to resolve penalty.')
          : 'Unable to resolve penalty.';
      Alert.alert('Resolve failed', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerTitle}>Loading penalties</Text>
          <Text style={styles.centerText}>Pulling pending fines, aging, and resolution history.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Choose a chama first"
          description="Penalty management is scoped to the active chama."
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.title}>Penalties</Text>
        {canIssuePenalty ? (
          <TouchableOpacity onPress={() => setFormVisible(true)} style={styles.headerButton}>
            <Icon name="plus" size={22} color={colors.primary[500]} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.guidanceCard}>
          <View style={styles.guidanceHeader}>
            <Icon name="gavel" size={22} color={colors.primary[500]} />
            <Text style={styles.guidanceTitle}>Penalty operations</Text>
          </View>
          <Text style={styles.guidanceText}>
            Manage issued fines, aging, and ledger-backed collections here. Each payment now records the actual amount
            collected instead of silently zeroing out the balance.
          </Text>
        </Card>

        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending fines</Text>
            <Text style={styles.summaryValue}>{summary.pendingCount}</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Amount due</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.pendingAmount.toFixed(2), currency)}</Text>
          </Card>
        </View>

        <Card style={styles.agingCard}>
          <Text style={styles.agingTitle}>Aging</Text>
          <View style={styles.agingRow}>
            <Text style={styles.agingLabel}>Current</Text>
            <Text style={styles.agingValue}>{formatCurrency(summary.aging.current.toFixed(2), currency)}</Text>
          </View>
          <View style={styles.agingRow}>
            <Text style={styles.agingLabel}>1-30 days</Text>
            <Text style={styles.agingValue}>{formatCurrency(summary.aging.days30.toFixed(2), currency)}</Text>
          </View>
          <View style={styles.agingRow}>
            <Text style={styles.agingLabel}>31-60 days</Text>
            <Text style={styles.agingValue}>{formatCurrency(summary.aging.days60.toFixed(2), currency)}</Text>
          </View>
          <View style={styles.agingRow}>
            <Text style={styles.agingLabel}>61+ days</Text>
            <Text style={styles.agingValue}>{formatCurrency(summary.aging.days61.toFixed(2), currency)}</Text>
          </View>
        </Card>

        {error ? (
          <EmptyState
            title="Penalty data unavailable"
            description={error}
            action={<Button title="Retry" onPress={() => void loadPenaltyData()} />}
            style={styles.inlineState}
          />
        ) : penalties.length > 0 ? (
          penalties.map((penalty) => (
            <Card key={penalty.id} style={styles.penaltyCard}>
              <View style={styles.penaltyHeader}>
                <View style={styles.penaltyMeta}>
                  <Text style={styles.memberName}>{penalty.member_name || penalty.member?.full_name || 'Member fine'}</Text>
                  <Text style={styles.penaltyReason}>{penalty.reason}</Text>
                </View>
                <Badge
                  label={penalty.status}
                  variant={penalty.status === 'paid' ? 'success' : penalty.status === 'waived' ? 'info' : 'warning'}
                  size="sm"
                />
              </View>

              <View style={styles.penaltyInfoRow}>
                <Text style={styles.penaltyInfoText}>Due {formatDate(penalty.due_date)}</Text>
                <Text style={styles.penaltyAmount}>
                  {formatCurrency(penalty.outstanding_amount || penalty.amount, currency)}
                </Text>
              </View>
              <Text style={styles.agingText}>Aging bucket: {getAgingBucket(penalty.due_date)}</Text>

              {['pending', 'due', 'overdue'].includes(penalty.status) && (canIssuePenalty || canAdjustFinance) ? (
                <Button title="Record Payment" variant="outline" onPress={() => handleResolvePenalty(penalty)} />
              ) : null}
            </Card>
          ))
        ) : (
          <EmptyState
            title="No penalties yet"
            description="Late contribution fines and other charges will appear here once they are issued."
            action={canIssuePenalty ? <Button title="Issue Fine" onPress={() => setFormVisible(true)} /> : undefined}
            style={styles.inlineState}
          />
        )}
      </ScrollView>

      <Modal visible={formVisible} onClose={() => setFormVisible(false)} title="Issue Penalty">
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.modalHelper}>Select the member, amount, and reason for this fine.</Text>
          <Text style={styles.fieldLabel}>Member</Text>
          <View style={styles.memberGrid}>
            {members.map((member) => {
              const isSelected = selectedMemberId === member.user.id;
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[styles.memberChip, isSelected && styles.memberChipSelected]}
                  onPress={() => setSelectedMemberId(member.user.id)}
                >
                  <Text style={[styles.memberChipText, isSelected && styles.memberChipTextSelected]}>
                    {member.user.full_name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <Input
            label="Reason"
            value={reason}
            onChangeText={setReason}
            placeholder="Late contribution fine"
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
          />
          <Input
            label="Due Date"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
          />

          <View style={styles.modalActions}>
            <Button title="Cancel" variant="ghost" onPress={() => setFormVisible(false)} style={styles.modalButton} />
            <Button title="Issue Fine" onPress={handleIssuePenalty} loading={saving} style={styles.modalButton} />
          </View>
        </ScrollView>
      </Modal>

      <Modal visible={Boolean(paymentPenalty)} onClose={() => setPaymentPenalty(null)} title="Record Fine Payment">
        <Text style={styles.modalHelper}>
          Capture the actual payment amount and reference so the fine ledger stays accurate.
        </Text>
        <Input label="Amount" value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="decimal-pad" />
        <Text style={styles.fieldLabel}>Method</Text>
        <View style={styles.memberGrid}>
          {(['cash', 'mpesa'] as const).map((method) => {
            const selected = paymentMethod === method;
            return (
              <TouchableOpacity
                key={method}
                style={[styles.memberChip, selected && styles.memberChipSelected]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[styles.memberChipText, selected && styles.memberChipTextSelected]}>
                  {method.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Input
          label="Reference"
          value={paymentReference}
          onChangeText={setPaymentReference}
          placeholder="Optional payment reference"
        />
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="ghost" onPress={() => setPaymentPenalty(null)} style={styles.modalButton} />
          <Button title="Post Payment" onPress={() => void submitPenaltyPayment()} loading={saving} style={styles.modalButton} />
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backButton: {
    padding: spacing[2],
  },
  headerButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  guidanceCard: {
    marginBottom: spacing[4],
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  guidanceTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  guidanceText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  summaryCard: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  agingCard: {
    marginBottom: spacing[4],
  },
  agingTitle: {
    marginBottom: spacing[2],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  agingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  agingLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  agingValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  penaltyCard: {
    marginBottom: spacing[3],
  },
  penaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  penaltyMeta: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  penaltyReason: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  penaltyInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  penaltyInfoText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  penaltyAmount: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  agingText: {
    marginBottom: spacing[3],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.warning,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  centerTitle: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  centerText: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  inlineState: {
    marginTop: spacing[6],
  },
  modalHelper: {
    marginBottom: spacing[4],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  fieldLabel: {
    marginBottom: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  memberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  memberChip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  memberChipSelected: {
    backgroundColor: colors.primary[100],
  },
  memberChipText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  memberChipTextSelected: {
    color: colors.primary[700],
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  modalButton: {
    flex: 1,
  },
});
