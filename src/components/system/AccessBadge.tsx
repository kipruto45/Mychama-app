import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '@/theme';

type AccessTone = 'full' | 'limited' | 'read_only' | 'self_service' | 'support' | 'inspect_only';

const ACCESS_STYLES: Record<AccessTone, { background: string; border: string; text: string }> = {
  full: {
    background: colors.success + '18',
    border: colors.success + '33',
    text: colors.success,
  },
  limited: {
    background: colors.warning + '18',
    border: colors.warning + '33',
    text: colors.warning,
  },
  read_only: {
    background: colors.info + '18',
    border: colors.info + '33',
    text: colors.info,
  },
  self_service: {
    background: colors.primary[100],
    border: colors.primary[200],
    text: colors.primary[700],
  },
  support: {
    background: colors.neutral[100],
    border: colors.neutral[200],
    text: colors.neutral[700],
  },
  inspect_only: {
    background: colors.error + '12',
    border: colors.error + '28',
    text: colors.error,
  },
};

export const AccessBadge: React.FC<{
  label: string;
  tone?: AccessTone;
}> = ({ label, tone = 'limited' }) => {
  const palette = ACCESS_STYLES[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  text: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
  },
});
