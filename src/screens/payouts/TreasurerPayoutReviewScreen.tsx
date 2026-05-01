/**
 * Treasurer Payout Review Screen
 *
 * Treasurer workflow: approve/reject, flag on-hold, adjust payout method.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button, Card, EmptyState, Input, Modal } from '@/components/ui';
import {
  TreasurerReviewScreenRouteProp,
  PayoutStackParamList,
  eligibilityStatusDisplay,
  paymentMethodDisplay,
  payoutStatusDisplay,
} from '@/navigation/PayoutNavigator.types';
import { useTheme } from '@/providers/ThemeProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { usePayoutStore } from '@/store/payoutStore';
import { colors as palette, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';

type NavProp = NativeStackNavigationProp<PayoutStackParamList, 'TreasurerReview'>;

const statusTint = (status: string) => {
  if (status === 'success') return palette.success;
  if (status === 'processing') return palette.warning;
  if (status === 'failed' || status === 'cancelled') return palette.error;
  if (status === 'hold') return palette.warning;
  return palette.neutral[500];
};

export default function TreasurerPayoutReviewScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<TreasurerReviewScreenRouteProp>();
  const { colors: themeColors } = useTheme();
  const toast = useToast();
  const { payoutId } = route.params;

  const {
    currentPayout,
    isLoadingDetail,
    detailError,
    isSubmitting,
    fetchPayoutDetail,
    treasurerApprove,
    treasurerReject,
    flagOnHold,
  } = usePayoutStore();

  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [holdVisible, setHoldVisible] = useState(false);
  const [holdReason, setHoldReason] = useState('');

  useEffect(() => {
    void fetchPayoutDetail(payoutId);
  }, [fetchPayoutDetail, payoutId]);

  const memberName = useMemo(() => {
    if (!currentPayout) return '';
    return [currentPayout.member?.user?.first_name || '', currentPayout.member?.user?.last_name || '']
      .join(' ')
      .trim();
  }, [currentPayout]);

  const handleApprove = () => {
    Alert.alert(
      'Approve payout?',
      'This will send the payout to the chairperson for final approval.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              await treasurerApprove(payoutId);
              toast.showSuccess('Approved', 'Sent to chairperson for final approval.');
              navigation.goBack();
            } catch (e: any) {
              toast.showError('Approval failed', e?.message || 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const submitReject = async () => {
    const reason = rejectReason.trim();
    if (reason.length < 10) {
      toast.showError('Reason required', 'Add at least 10 characters for the rejection reason.');
      return;
    }
    try {
      await treasurerReject(payoutId, reason);
      toast.showSuccess('Rejected', 'The payout has been rejected.');
      setRejectVisible(false);
      setRejectReason('');
      navigation.goBack();
    } catch (e: any) {
      toast.showError('Rejection failed', e?.message || 'Please try again.');
    }
  };

  const submitHold = async () => {
    const reason = holdReason.trim();
    if (reason.length < 5) {
      toast.showError('Reason required', 'Add a short reason for putting this payout on hold.');
      return;
    }
    try {
      await flagOnHold(payoutId, reason);
      toast.showSuccess('On hold', 'The payout is now on hold.');
      setHoldVisible(false);
      setHoldReason('');
      void fetchPayoutDetail(payoutId);
    } catch (e: any) {
      toast.showError('Hold failed', e?.message || 'Please try again.');
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

  const tint = statusTint(currentPayout.status);
  const eligibilityLabel = currentPayout.eligibility_status
    ? eligibilityStatusDisplay[currentPayout.eligibility_status] || currentPayout.eligibility_status
    : 'Unknown';

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.content}>
          <Card>
            <Text style={[styles.title, { color: themeColors.text }]}>Treasurer Review</Text>
            <Text style={[styles.subtle, { color: themeColors.textSecondary }]}>
              Review eligibility and approve or reject this payout.
            </Text>

            <View style={styles.badgeRow}>
              <View style={[styles.badge, { borderColor: tint, backgroundColor: `${tint}1A` }]}>
                <Text style={[styles.badgeText, { color: tint }]}>
                  {payoutStatusDisplay[currentPayout.status] || currentPayout.status}
                </Text>
              </View>
              <Text style={[styles.subtle, { color: themeColors.textSecondary }]}>
                Updated {formatDateTime(currentPayout.updated_at)}
              </Text>
            </View>
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Member</Text>
            <View style={styles.kvRow}>
              <Text style={[styles.k, { color: themeColors.textSecondary }]}>Name</Text>
              <Text style={[styles.v, { color: themeColors.text }]}>{memberName || '—'}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={[styles.k, { color: themeColors.textSecondary }]}>Phone</Text>
              <Text style={[styles.v, { color: themeColors.text }]}>{currentPayout.member?.user?.phone || '—'}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Payout</Text>
            <View style={styles.kvRow}>
              <Text style={[styles.k, { color: themeColors.textSecondary }]}>Amount</Text>
              <Text style={[styles.v, { color: palette.primary[700] }]}>
                {formatCurrency(currentPayout.amount, currentPayout.currency || 'KES')}
              </Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={[styles.k, { color: themeColors.textSecondary }]}>Method</Text>
              <Text style={[styles.v, { color: themeColors.text }]}>
                {paymentMethodDisplay[currentPayout.payout_method] || currentPayout.payout_method}
              </Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={[styles.k, { color: themeColors.textSecondary }]}>Eligibility</Text>
              <Text style={[styles.v, { color: themeColors.text }]}>{eligibilityLabel}</Text>
            </View>
          </Card>

          {currentPayout.is_on_hold ? (
            <Card>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>On Hold</Text>
              <Text style={[styles.holdText, { color: palette.warning }]}>
                {currentPayout.hold_reason || 'This payout is currently on hold.'}
              </Text>
            </Card>
          ) : null}

          <View style={styles.actionsRow}>
            <Button title="Approve" onPress={handleApprove} loading={isSubmitting} />
            <Button title="Reject" onPress={() => setRejectVisible(true)} variant="secondary" loading={isSubmitting} />
            <Button title="Flag On Hold" onPress={() => setHoldVisible(true)} variant="secondary" loading={isSubmitting} />
            <Button
              title="Change Method"
              onPress={() => navigation.navigate('SelectPaymentMethod', { payoutId })}
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>

      <Modal visible={rejectVisible} onClose={() => setRejectVisible(false)} title="Reject payout">
        <Input placeholder="Reason (min 10 characters)" value={rejectReason} onChangeText={setRejectReason} />
        <View style={styles.modalActions}>
          <Button title="Cancel" onPress={() => setRejectVisible(false)} variant="secondary" />
          <Button title="Reject" onPress={submitReject} loading={isSubmitting} />
        </View>
      </Modal>

      <Modal visible={holdVisible} onClose={() => setHoldVisible(false)} title="Put on hold">
        <Input placeholder="Reason" value={holdReason} onChangeText={setHoldReason} />
        <View style={styles.modalActions}>
          <Button title="Cancel" onPress={() => setHoldVisible(false)} variant="secondary" />
          <Button title="Confirm" onPress={submitHold} loading={isSubmitting} />
        </View>
      </Modal>
    </>
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
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
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
  badgeRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  k: {
    fontSize: typography.fontSize.sm,
  },
  v: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  actionsRow: {
    gap: spacing.sm,
  },
  holdText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  modalActions: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});

