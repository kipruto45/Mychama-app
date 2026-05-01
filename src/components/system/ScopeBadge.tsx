import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '@/theme';

export const ScopeBadge: React.FC<{
  label: string;
}> = ({ label }) => (
  <View style={styles.badge}>
    <Text style={styles.text}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.info + '35',
    backgroundColor: colors.info + '12',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  text: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
  },
});
