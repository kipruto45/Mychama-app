/**
 * Rotation Queue Screen
 *
 * Shows the payout rotation order for a chama.
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';

import { Card, EmptyState } from '@/components/ui';
import { RotationQueueScreenRouteProp } from '@/navigation/PayoutNavigator.types';
import { useTheme } from '@/providers/ThemeProvider';
import { payoutService, PayoutRotationResponse } from '@/services/payoutService';
import { colors as palette, spacing, typography } from '@/theme';
import { formatDateTime } from '@/utils/format';

export default function RotationQueueScreen() {
  const route = useRoute<RotationQueueScreenRouteProp>();
  const { colors: themeColors } = useTheme();
  const { chamaId } = route.params;

  const [rotation, setRotation] = useState<PayoutRotationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const payload = await payoutService.getRotation(chamaId);
        if (!mounted) return;
        setRotation(payload);
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        setRotation(null);
        setError(e?.message || 'Failed to load rotation queue.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [chamaId]);

  if (loading) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={palette.primary[600]} />
      </View>
    );
  }

  if (error || !rotation) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: themeColors.background }]}>
        <EmptyState title="Rotation unavailable" message={error || 'Unable to load rotation right now.'} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        <Card>
          <Text style={[styles.title, { color: themeColors.text }]}>
            {rotation.chama_name || 'Rotation Queue'}
          </Text>
          <Text style={[styles.subtle, { color: themeColors.textSecondary }]}>
            Cycle {rotation.rotation_cycle} • Current position {rotation.current_position + 1}
          </Text>
          <Text style={[styles.subtle, { color: themeColors.textSecondary }]}>
            Updated {formatDateTime(rotation.last_updated_at)}
          </Text>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Members in rotation</Text>
          {rotation.members_in_rotation?.length ? (
            rotation.members_in_rotation.map((memberId, idx) => {
              const isCurrent = rotation.current_member_id && rotation.current_member_id === memberId;
              return (
                <View key={`${memberId}-${idx}`} style={styles.row}>
                  <Text style={[styles.position, { color: themeColors.textSecondary }]}>{idx + 1}.</Text>
                  <Text style={[styles.memberId, { color: themeColors.text, fontWeight: isCurrent ? '800' : '600' }]}>
                    {memberId}
                  </Text>
                  {isCurrent ? (
                    <Text style={[styles.currentBadge, { color: palette.primary[700] }]}>Current</Text>
                  ) : null}
                </View>
              );
            })
          ) : (
            <Text style={[styles.subtle, { color: themeColors.textSecondary }]}>No rotation members configured.</Text>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
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
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  subtle: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.neutral[200],
  },
  position: {
    width: 28,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  memberId: {
    flex: 1,
    fontSize: typography.fontSize.sm,
  },
  currentBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
  },
});
