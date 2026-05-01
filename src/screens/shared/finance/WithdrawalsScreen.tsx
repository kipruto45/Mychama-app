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
import {
  PaymentIntentActivityRecord,
  PaymentIntentRecord,
  paymentService,
} from '@/services/paymentService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';

type WithdrawalsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Withdrawals'>;
type WithdrawalsScreenRouteProp = RouteProp<MainStackParamList, 'Withdrawals'>;

type WithdrawalFilter = 'all' | 'pending' | 'approved' | 'sent';

const FILTERS: Array<{ key: WithdrawalFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'sent', label: 'Sent' },
];

type PayoutTarget =
  | { id: string; kind: 'withdrawal' }
  | { id: string; kind: 'loan_disbursement' }
  | null;

const isWithdrawalIntent = (record: PaymentIntentRecord) => {
  const searchable = [
    record.intent_type,
    record.purpose,
    record.reference_type,
    String(record.metadata?.workflow || ''),
  ]
    .join(' ')
    .toLowerCase();

  return searchable.includes('withdraw');
};

const getStatusVariant = (status: string) => {
  if (['sent', 'completed', 'success'].includes(status)) return 'success' as const;
  if (['approved', 'processing'].includes(status)) return 'info' as const;
  if (['failed', 'cancelled', 'rejected'].includes(status)) return 'error' as const;
  return 'warning' as const;
};

export const WithdrawalsScreen: React.FC = () => {
  const navigation = useNavigation<WithdrawalsScreenNavigationProp>();
  const route = useRoute<WithdrawalsScreenRouteProp>();
  const routeChamaId = route.params?.chamaId;
  const { activeChama, activeChamaId, isLoading: isLoadingChamaContext } = useActiveChama();

  const chamaId = routeChamaId || activeChamaId || '';
  const currency = activeChama?.currency || 'KES';

  const canMakePayments = useCanPerformAction(Permission.CAN_MAKE_PAYMENTS, chamaId || undefined);
  const canAdjustFinance = useCanPerformAction(Permission.CAN_MAKE_ADJUSTMENTS, chamaId || undefined);

  const [withdrawals, setWithdrawals] = useState<PaymentIntentRecord[]>([]);
  const [disbursements, setDisbursements] = useState<PaymentIntentRecord[]>([]);
  const [activities, setActivities] = useState<Record<string, PaymentIntentActivityRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<WithdrawalFilter>(route.params?.filter || 'all');
  const [requestVisible, setRequestVisible] = useState(false);
  const [payoutTarget, setPayoutTarget] = useState<PayoutTarget>(null);
  const [payoutProof, setPayoutProof] = useState('');

  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryPhone, setBeneficiaryPhone] = useState('');
  const [beneficiaryDetails, setBeneficiaryDetails] = useState('');

  const loadTreasuryOutflows = async () => {
    if (!chamaId || isLoadingChamaContext) {
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const [transactionRows, disbursementRows] = await Promise.all([
        paymentService.getChamaTransactions(chamaId).catch(() => []),
        paymentService.getPendingLoanDisbursements().catch(() => []),
      ]);

      setWithdrawals(
        transactionRows
          .filter(isWithdrawalIntent)
          .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      );
      setDisbursements(
        disbursementRows
          .filter((item) => !item.chama || item.chama === chamaId)
          .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      );
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to load withdrawals.')
          : 'Unable to load withdrawals.';
      setError(message);
      setWithdrawals([]);
      setDisbursements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTreasuryOutflows();
  }, [chamaId, isLoadingChamaContext]);

  useEffect(() => {
    setFilter(route.params?.filter || 'all');
  }, [route.params?.filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTreasuryOutflows();
    setRefreshing(false);
  };

  const summary = useMemo(() => {
    const rows = {
      pending: 0,
      approved: 0,
      paid: 0,
    };

    withdrawals.forEach((item) => {
      if (['sent', 'completed', 'success'].includes(item.status)) {
        rows.paid += Number(item.amount || 0);
      } else if (item.status === 'approved') {
        rows.approved += Number(item.amount || 0);
      } else {
        rows.pending += Number(item.amount || 0);
      }
    });

    return rows;
  }, [withdrawals]);

  const filteredWithdrawals = useMemo(() => {
    if (filter === 'all') {
      return withdrawals;
    }
    if (filter === 'pending') {
      return withdrawals.filter((item) => item.status === 'pending');
    }
    if (filter === 'approved') {
      return withdrawals.filter((item) => item.status === 'approved');
    }
    return withdrawals.filter((item) => ['sent', 'completed', 'success'].includes(item.status));
  }, [filter, withdrawals]);

  const resetRequestForm = () => {
    setAmount('');
    setPhone('');
    setReason('');
    setBeneficiaryName('');
    setBeneficiaryPhone('');
    setBeneficiaryDetails('');
  };

  const handleCreateWithdrawal = async () => {
    if (!chamaId) {
      Alert.alert('Chama required', 'Switch into a chama before requesting a withdrawal.');
      return;
    }

    if (!amount.trim() || Number(amount) <= 0) {
      Alert.alert('Amount required', 'Enter a valid withdrawal amount.');
      return;
    }

    if (!phone.trim() || !reason.trim()) {
      Alert.alert('Missing details', 'Phone number and reason are required for a withdrawal request.');
      return;
    }

    setSaving(true);

    try {
      await paymentService.requestWithdrawal({
        chamaId,
        amount,
        phone,
        reason: reason.trim(),
        beneficiary_name: beneficiaryName.trim() || undefined,
        beneficiary_phone: beneficiaryPhone.trim() || undefined,
        beneficiary_details: beneficiaryDetails.trim() || undefined,
        idempotency_key: `withdraw-${Date.now()}`,
      });

      setRequestVisible(false);
      resetRequestForm();
      await loadTreasuryOutflows();
      Alert.alert('Withdrawal requested', 'The payout is now waiting for approval and sending.');
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to create withdrawal request.')
          : 'Unable to create withdrawal request.';
      Alert.alert('Request failed', message);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveWithdrawal = (item: PaymentIntentRecord) => {
    Alert.alert('Approve withdrawal', 'This will move the request into the payout stage.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await paymentService.approveWithdrawal(item.id, chamaId);
            await loadTreasuryOutflows();
          } catch (serviceError) {
            const message =
              typeof serviceError === 'object' && serviceError && 'message' in serviceError
                ? String((serviceError as { message?: string }).message || 'Unable to approve withdrawal.')
                : 'Unable to approve withdrawal.';
            Alert.alert('Approval failed', message);
          }
        },
      },
    ]);
  };

  const handleRejectWithdrawal = (item: PaymentIntentRecord) => {
    Alert.alert('Reject withdrawal', 'This will stop the payout request before any money leaves the chama.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await paymentService.rejectWithdrawal(item.id, chamaId, 'Rejected from treasury workflow');
            await loadTreasuryOutflows();
          } catch (serviceError) {
            const message =
              typeof serviceError === 'object' && serviceError && 'message' in serviceError
                ? String((serviceError as { message?: string }).message || 'Unable to reject withdrawal.')
                : 'Unable to reject withdrawal.';
            Alert.alert('Rejection failed', message);
          }
        },
      },
    ]);
  };

  const handleSendPayout = async () => {
    if (!payoutTarget) {
      return;
    }

    setSaving(true);

    try {
      if (payoutTarget.kind === 'withdrawal') {
        await paymentService.sendWithdrawal(payoutTarget.id, chamaId, payoutProof.trim() || undefined);
      } else {
        await paymentService.sendLoanDisbursement(payoutTarget.id, payoutProof.trim() || undefined);
      }

      setPayoutTarget(null);
      setPayoutProof('');
      await loadTreasuryOutflows();
      Alert.alert('Payout sent', 'The payout record has been updated with the latest sending status.');
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to send payout.')
          : 'Unable to send payout.';
      Alert.alert('Send failed', message);
    } finally {
      setSaving(false);
    }
  };

  const handleLoanDisbursementAction = (
    item: PaymentIntentRecord,
    action: 'approve' | 'reject'
  ) => {
    const title = action === 'approve' ? 'Approve disbursement' : 'Reject disbursement';
    const description =
      action === 'approve'
        ? 'This loan can then be sent to the member.'
        : 'This will stop the pending disbursement until another request is raised.';

    Alert.alert(title, description, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action === 'approve' ? 'Approve' : 'Reject',
        style: action === 'approve' ? 'default' : 'destructive',
        onPress: async () => {
          try {
            if (action === 'approve') {
              await paymentService.approveLoanDisbursement(item.id);
            } else {
              await paymentService.rejectLoanDisbursement(item.id, 'Rejected from treasury workflow');
            }

            await loadTreasuryOutflows();
          } catch (serviceError) {
            const message =
              typeof serviceError === 'object' && serviceError && 'message' in serviceError
                ? String((serviceError as { message?: string }).message || `Unable to ${action} disbursement.`)
                : `Unable to ${action} disbursement.`;
            Alert.alert('Action failed', message);
          }
        },
      },
    ]);
  };

  const handleLoadActivity = async (intentId: string) => {
    if (activities[intentId]) {
      return;
    }

    try {
      const rows = await paymentService.getIntentActivity(intentId);
      setActivities((current) => ({ ...current, [intentId]: rows }));
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || 'Unable to load activity log.')
          : 'Unable to load activity log.';
      Alert.alert('Activity unavailable', message);
    }
  };

  const renderWithdrawalCard = (item: PaymentIntentRecord) => {
    const metadata = item.metadata || {};
    const activity = activities[item.id] || [];

    return (
      <Card key={item.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle}>{metadata.beneficiary_name || item.phone || 'Withdrawal Request'}</Text>
            <Text style={styles.cardSubtitle}>
              {String(metadata.reason || item.purpose || 'Treasury withdrawal')}
            </Text>
          </View>
          <Badge label={item.status.replace(/_/g, ' ')} variant={getStatusVariant(item.status)} size="sm" />
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountValue}>{formatCurrency(item.amount, item.currency || currency)}</Text>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>

        <View style={styles.metaGroup}>
          <Text style={styles.metaText}>Beneficiary phone: {metadata.beneficiary_phone || item.phone || '-'}</Text>
          {metadata.beneficiary_details ? (
            <Text style={styles.metaText}>Beneficiary details: {String(metadata.beneficiary_details)}</Text>
          ) : null}
          <Text style={styles.metaText}>Payout status: {item.status.replace(/_/g, ' ')}</Text>
          {item.mpesa_receipt_number ? (
            <Text style={styles.metaText}>Proof of payout: {item.mpesa_receipt_number}</Text>
          ) : null}
          {metadata.payout_proof ? (
            <Text style={styles.metaText}>Recorded proof: {String(metadata.payout_proof)}</Text>
          ) : null}
          {item.failure_reason ? <Text style={styles.failureText}>Failure: {item.failure_reason}</Text> : null}
        </View>

        <View style={styles.policyNote}>
          <Icon name="shield-check-outline" size={16} color={colors.primary[500]} />
          <Text style={styles.policyNoteText}>
            Pending requests can be halted before payout. Sent payouts should move into dispute or reversal handling.
          </Text>
        </View>

        {activity.length > 0 ? (
          <View style={styles.activitySection}>
            <Text style={styles.activityTitle}>Audit trail</Text>
            {activity.slice(0, 4).map((entry) => (
              <Text key={entry.id} style={styles.activityText}>
                {entry.action.replace(/_/g, ' ')} • {formatDateTime(entry.created_at)}
                {entry.actor_name ? ` • ${entry.actor_name}` : ''}
              </Text>
            ))}
          </View>
        ) : (
          <TouchableOpacity onPress={() => void handleLoadActivity(item.id)} style={styles.activityButton}>
            <Icon name="history" size={16} color={colors.primary[500]} />
            <Text style={styles.activityButtonText}>Load audit trail</Text>
          </TouchableOpacity>
        )}

        {canAdjustFinance && item.status === 'pending' ? (
          <View style={styles.actionRow}>
            <Button
              title="Approve"
              variant="outline"
              onPress={() => handleApproveWithdrawal(item)}
              style={styles.actionButton}
            />
            <Button
              title="Reject"
              variant="ghost"
              onPress={() => handleRejectWithdrawal(item)}
              style={styles.actionButton}
            />
          </View>
        ) : null}

        {canMakePayments && item.status === 'approved' ? (
          <Button
            title="Send Payout"
            onPress={() => setPayoutTarget({ id: item.id, kind: 'withdrawal' })}
          />
        ) : null}
      </Card>
    );
  };

  const renderDisbursementCard = (item: PaymentIntentRecord) => {
    const metadata = item.metadata || {};

    return (
      <Card key={item.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle}>{String(metadata.member_name || metadata.borrower_name || 'Loan disbursement')}</Text>
            <Text style={styles.cardSubtitle}>Loan disbursement queue</Text>
          </View>
          <Badge label={item.status.replace(/_/g, ' ')} variant={getStatusVariant(item.status)} size="sm" />
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountValue}>{formatCurrency(item.amount, item.currency || currency)}</Text>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>

        <View style={styles.metaGroup}>
          {metadata.loan_id ? <Text style={styles.metaText}>Loan ID: {String(metadata.loan_id)}</Text> : null}
          {item.phone ? <Text style={styles.metaText}>Member phone: {item.phone}</Text> : null}
        </View>

        <View style={styles.actionRow}>
          {canAdjustFinance && item.status === 'pending' ? (
            <>
              <Button
                title="Approve"
                variant="outline"
                onPress={() => handleLoanDisbursementAction(item, 'approve')}
                style={styles.actionButton}
              />
              <Button
                title="Reject"
                variant="ghost"
                onPress={() => handleLoanDisbursementAction(item, 'reject')}
                style={styles.actionButton}
              />
            </>
          ) : null}
        </View>

        {canMakePayments && item.status === 'approved' ? (
          <Button
            title="Send Disbursement"
            onPress={() => setPayoutTarget({ id: item.id, kind: 'loan_disbursement' })}
          />
        ) : null}
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerTitle}>Loading treasury outflows</Text>
          <Text style={styles.centerText}>Fetching withdrawal requests, payout stages, and pending disbursements.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Choose a chama first"
          description="Treasury outflow controls are scoped to the active chama."
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
        <Text style={styles.title}>Withdrawals</Text>
        {canMakePayments ? (
          <TouchableOpacity onPress={() => setRequestVisible(true)} style={styles.headerButton}>
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
            <Icon name="bank-transfer-out" size={22} color={colors.primary[500]} />
            <Text style={styles.guidanceTitle}>Safe money-out workflow</Text>
          </View>
          <Text style={styles.guidanceText}>
            Requests, approvals, beneficiary details, send confirmation, and payout proof should all remain visible
            before funds leave the chama.
          </Text>
        </Card>

        <View style={styles.summaryRow}>
          <TouchableOpacity style={styles.summaryCardTouch} activeOpacity={0.82} onPress={() => setFilter('pending')}>
            <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.pending.toString(), currency)}</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardTouch} activeOpacity={0.82} onPress={() => setFilter('approved')}>
            <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Approved</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.approved.toString(), currency)}</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardTouch} activeOpacity={0.82} onPress={() => setFilter('sent')}>
            <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Sent</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.paid.toString(), currency)}</Text>
            </Card>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterLabel, filter === item.key && styles.filterLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <EmptyState
            title="Treasury data unavailable"
            description={error}
            action={<Button title="Retry" onPress={() => void loadTreasuryOutflows()} />}
            style={styles.inlineState}
          />
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Withdrawal Requests</Text>
          <Text style={styles.sectionMeta}>{filteredWithdrawals.length} items</Text>
        </View>

        {filteredWithdrawals.length > 0 ? (
          filteredWithdrawals.map(renderWithdrawalCard)
        ) : (
          <EmptyState
            title="No withdrawal requests yet"
            description="New treasury payouts will appear here once requests are created."
            action={canMakePayments ? <Button title="Request Withdrawal" onPress={() => setRequestVisible(true)} /> : undefined}
            style={styles.inlineState}
          />
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pending Loan Disbursements</Text>
          <Text style={styles.sectionMeta}>{disbursements.length} items</Text>
        </View>

        {disbursements.length > 0 ? (
          disbursements.map(renderDisbursementCard)
        ) : (
          <Card style={styles.emptyQueueCard}>
            <Text style={styles.emptyQueueText}>No loan disbursements are waiting in the queue right now.</Text>
          </Card>
        )}
      </ScrollView>

      <Modal visible={requestVisible} onClose={() => setRequestVisible(false)} title="Withdrawal Request">
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.modalHelper}>Capture who is receiving the money and why the payout is needed.</Text>
          <Input
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <Input
            label="Payout Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="07..."
          />
          <Input
            label="Beneficiary Name"
            value={beneficiaryName}
            onChangeText={setBeneficiaryName}
            autoCapitalize="words"
            placeholder="Optional"
          />
          <Input
            label="Beneficiary Phone"
            value={beneficiaryPhone}
            onChangeText={setBeneficiaryPhone}
            keyboardType="phone-pad"
            placeholder="Optional alternate contact"
          />
          <Input
            label="Beneficiary Details"
            value={beneficiaryDetails}
            onChangeText={setBeneficiaryDetails}
            placeholder="Account details, national ID, or notes"
            autoCapitalize="sentences"
            multiline
            numberOfLines={2}
          />
          <Input
            label="Reason"
            value={reason}
            onChangeText={setReason}
            placeholder="Why is this payout needed?"
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalActions}>
            <Button title="Cancel" variant="ghost" onPress={() => setRequestVisible(false)} style={styles.modalButton} />
            <Button title="Submit" onPress={handleCreateWithdrawal} loading={saving} style={styles.modalButton} />
          </View>
        </ScrollView>
      </Modal>

      <Modal
        visible={Boolean(payoutTarget)}
        onClose={() => {
          setPayoutTarget(null);
          setPayoutProof('');
        }}
        title="Send Payout"
      >
        <Text style={styles.modalHelper}>Record a proof reference so the payout can be traced later.</Text>
        <Input
          label="Proof of Payout"
          value={payoutProof}
          onChangeText={setPayoutProof}
          placeholder="M-Pesa receipt or payout reference"
          autoCapitalize="characters"
        />
        <View style={styles.modalActions}>
          <Button
            title="Close"
            variant="ghost"
            onPress={() => {
              setPayoutTarget(null);
              setPayoutProof('');
            }}
            style={styles.modalButton}
          />
          <Button title="Confirm Send" onPress={handleSendPayout} loading={saving} style={styles.modalButton} />
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
  summaryCardTouch: {
    flex: 1,
  },
  summaryCard: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    marginBottom: spacing[2],
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
  },
  filterLabelActive: {
    color: colors.light.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  sectionMeta: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  card: {
    marginBottom: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  cardSubtitle: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  amountValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  metaGroup: {
    gap: spacing[1],
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  failureText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
  },
  policyNote: {
    flexDirection: 'row',
    gap: spacing[2],
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginTop: spacing[3],
  },
  policyNoteText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.primary[700],
    lineHeight: 18,
  },
  activitySection: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: spacing[1],
  },
  activityTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[800],
  },
  activityText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  activityButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  actionButton: {
    flex: 1,
  },
  emptyQueueCard: {
    marginBottom: spacing[3],
  },
  emptyQueueText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
  },
  inlineState: {
    marginBottom: spacing[4],
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  centerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginTop: spacing[3],
  },
  centerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginTop: spacing[2],
    textAlign: 'center',
    lineHeight: 20,
  },
  modalHelper: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  modalButton: {
    flex: 1,
  },
});
