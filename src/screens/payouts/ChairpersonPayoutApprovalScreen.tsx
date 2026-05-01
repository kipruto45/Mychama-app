/**
 * Chairperson Payout Approval Screen
 *
 * Chairperson workflow: final approve/reject after treasurer review.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button, Card, EmptyState, Input, Modal } from '@/components/ui';
import {
  ChairpersonApprovalScreenRouteProp,
  PayoutStackParamList,
  checkTypeDisplay,
  eligibilityStatusDisplay,
  paymentMethodDisplay,
  payoutStatusDisplay,
} from '@/navigation/PayoutNavigator.types';
import { useToast } from '@/components/ui/ToastProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { usePayoutStore } from '@/store/payoutStore';
import { colors as palette, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime, formatStatus } from '@/utils/format';

type NavProp = NativeStackNavigationProp<PayoutStackParamList, 'ChairpersonApproval'>;

const statusTint = (status: string) => {
  if (status === 'success') return palette.success;
  if (status === 'processing') return palette.warning;
  if (status === 'failed' || status === 'cancelled') return palette.error;
  if (status === 'hold') return palette.warning;
  if (status === 'chair_rejected' || status === 'treasury_rejected' || status === 'ineligible') return palette.error;
  return palette.neutral[500];
};

export default function ChairpersonPayoutApprovalScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ChairpersonApprovalScreenRouteProp>();
  const { colors: themeColors } = useTheme();
  const toast = useToast();
  const { payoutId } = route.params;

  const {
    currentPayout,
    isLoadingDetail,
    detailError,
    isSubmitting,
    fetchPayoutDetail,
    chairpersonApprove,
    chairpersonReject,
  } = usePayoutStore();

  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    void fetchPayoutDetail(payoutId);
  }, [fetchPayoutDetail, payoutId]);

  const memberName = useMemo(() => {
    if (!currentPayout) return '';
    const first = currentPayout.member?.user?.first_name || '';
    const last = currentPayout.member?.user?.last_name || '';
    return [first, last].join(' ').trim();
  }, [currentPayout]);

  const confirmApprove = () => {
    Alert.alert(
      'Approve payout?',
      'This is the final approval. The payout will proceed to payment processing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              await chairpersonApprove(payoutId);
              toast.showSuccess('Approved', 'Payment processing has started.');
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
      await chairpersonReject(payoutId, reason);
      toast.showSuccess('Rejected', 'The payout has been rejected.');
      setRejectVisible(false);
      setRejectReason('');
      navigation.goBack();
    } catch (e: any) {
      toast.showError('Rejection failed', e?.message || 'Please try again.');
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
  const statusLabel = payoutStatusDisplay[currentPayout.status] || currentPayout.status;
  const eligibilityLabel = currentPayout.eligibility_status
    ? eligibilityStatusDisplay[currentPayout.eligibility_status] || currentPayout.eligibility_status
    : 'Unknown';

  const canDecide = currentPayout.status === 'awaiting_chair_approval';
  const issues = Array.isArray(currentPayout.eligibility_issues) ? currentPayout.eligibility_issues : [];

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.content}>
          <Card>
            <Text style={[styles.title, { color: themeColors.text }]}>Final Approval</Text>
            <Text style={[styles.subtle, { color: themeColors.textSecondary }]}>
              Confirm the treasurer-approved payout before payment is processed.
            </Text>

            <View style={styles.badgeRow}>
              <View style={[styles.badge, { borderColor: tint, backgroundColor: `${tint}1A` }]}>
                <Text style={[styles.badgeText, { color: tint }]}>{statusLabel}</Text>
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
            <View style={styles.kvRow}>
              <Text style={[styles.k, { color: themeColors.textSecondary }]}>Chama</Text>
              <Text style={[styles.v, { color: themeColors.text }]}>{currentPayout.chama_name || '—'}</Text>
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

          <Card>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Review Trail</Text>
            <View style={styles.kvRow}>
              <Text style={[styles.k, { color: themeColors.textSecondary }]}>Treasurer Reviewed</Text>
              <Text style={[styles.v, { color: themeColors.text }]}>
                {currentPayout.treasurer_reviewed_at ? formatDateTime(currentPayout.treasurer_reviewed_at) : '—'}
              </Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={[styles.k, { color: themeColors.textSecondary }]}>Chair Approved</Text>
              <Text style={[styles.v, { color: themeColors.text }]}>
                {currentPayout.chairperson_approved_at ? formatDateTime(currentPayout.chairperson_approved_at) : '—'}
              </Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={[styles.k, { color: themeColors.textSecondary }]}>Payment Completed</Text>
              <Text style={[styles.v, { color: themeColors.text }]}>
                {currentPayout.payment_completed_at ? formatDateTime(currentPayout.payment_completed_at) : '—'}
              </Text>
            </View>
          </Card>

          {issues.length > 0 ? (
            <Card>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Eligibility Signals</Text>
              {issues.map((issue) => {
                const label = checkTypeDisplay[issue] || formatStatus(issue);
                return (
                  <View key={issue} style={styles.issueRow}>
                    <View style={[styles.issueDot, { backgroundColor: palette.warning }]} />
                    <Text style={[styles.issueText, { color: themeColors.text }]}>{label}</Text>
                  </View>
                );
              })}
            </Card>
          ) : null}

          <View style={styles.actionsRow}>
            <Button title="Approve" onPress={confirmApprove} loading={isSubmitting} disabled={!canDecide} />
            <Button
              title="Reject"
              onPress={() => setRejectVisible(true)}
              variant="secondary"
              loading={isSubmitting}
              disabled={!canDecide}
            />
          </View>
          {!canDecide ? (
            <Text style={[styles.helper, { color: themeColors.textSecondary }]}>
              This payout is not currently awaiting chairperson approval.
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={rejectVisible} onClose={() => setRejectVisible(false)} title="Reject payout">
        <Input
          placeholder="Reason (min 10 characters)"
          value={rejectReason}
          onChangeText={setRejectReason}
          multiline
        />
        <View style={styles.modalActions}>
          <Button title="Cancel" onPress={() => setRejectVisible(false)} variant="secondary" />
          <Button title="Reject" onPress={submitReject} loading={isSubmitting} />
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
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
  },
  subtle: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
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
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    marginBottom: spacing.sm,
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
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  issueDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  issueText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  actionsRow: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  helper: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
  },
  modalActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});

