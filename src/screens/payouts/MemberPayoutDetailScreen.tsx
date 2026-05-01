/**
 * Payout Detail Screen
 *
 * Shows payout details and eligibility status for a single payout.
 */

import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button, Card, EmptyState } from '@/components/ui';
import {
  PayoutDetailScreenRouteProp,
  PayoutStackParamList,
  eligibilityStatusDisplay,
  paymentMethodDisplay,
  payoutStatusDisplay,
} from '@/navigation/PayoutNavigator.types';
import { useTheme } from '@/providers/ThemeProvider';
import { usePayoutStore } from '@/store/payoutStore';
import { colors as palette, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';

type NavProp = NativeStackNavigationProp<PayoutStackParamList, 'PayoutDetail'>;

const badgeColor = (status: string) => {
  if (status === 'success') return palette.success;
  if (status === 'processing') return palette.warning;
  if (status === 'failed' || status === 'cancelled') return palette.error;
  if (status === 'hold') return palette.warning;
  return palette.neutral[500];
};

export default function MemberPayoutDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<PayoutDetailScreenRouteProp>();
  const { colors: themeColors } = useTheme();
  const { payoutId } = route.params;

  const { currentPayout, isLoadingDetail, detailError, fetchPayoutDetail } = usePayoutStore();

  useEffect(() => {
    void fetchPayoutDetail(payoutId);
  }, [fetchPayoutDetail, payoutId]);

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
        <EmptyState
          title="Payout unavailable"
          message={detailError || 'We couldn’t load this payout right now.'}
        />
        <View style={styles.actionsRow}>
          <Button title="Go Back" onPress={() => navigation.goBack()} variant="secondary" />
        </View>
      </View>
    );
  }

  const statusLabel = payoutStatusDisplay[currentPayout.status] || currentPayout.status;
  const statusTint = badgeColor(currentPayout.status);
  const eligibilityLabel = currentPayout.eligibility_status
    ? eligibilityStatusDisplay[currentPayout.eligibility_status] || currentPayout.eligibility_status
    : 'Unknown';

  const memberName = [
    currentPayout.member?.user?.first_name || '',
    currentPayout.member?.user?.last_name || '',
  ]
    .join(' ')
    .trim();

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        <Card>
          <Text style={[styles.title, { color: themeColors.text }]}>Payout</Text>
          <Text style={[styles.amount, { color: palette.primary[700] }]}>
            {formatCurrency(currentPayout.amount, currentPayout.currency || 'KES')}
          </Text>
          <Text style={[styles.subtle, { color: themeColors.textSecondary }]}>
            {currentPayout.chama_name || `Chama ${String(currentPayout.chama).slice(0, 8)}…`}
          </Text>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { borderColor: statusTint, backgroundColor: `${statusTint}1A` }]}>
              <Text style={[styles.badgeText, { color: statusTint }]}>{statusLabel}</Text>
            </View>
            <Text style={[styles.subtle, { color: themeColors.textSecondary }]}>
              Updated {formatDateTime(currentPayout.updated_at)}
            </Text>
          </View>
        </Card>

        {currentPayout.is_on_hold && (
          <Card>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>On Hold</Text>
            <Text style={[styles.holdText, { color: palette.warning }]}>
              {currentPayout.hold_reason || 'This payout is currently on hold.'}
            </Text>
          </Card>
        )}

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
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Details</Text>
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
          <View style={styles.kvRow}>
            <Text style={[styles.k, { color: themeColors.textSecondary }]}>Created</Text>
            <Text style={[styles.v, { color: themeColors.text }]}>{formatDateTime(currentPayout.created_at)}</Text>
          </View>
        </Card>
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
  holdText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  actionsRow: {
    marginTop: spacing.lg,
  },
});
