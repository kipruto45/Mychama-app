import React from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '@/theme';

export const ReadOnlyBanner: React.FC<{
  title?: string;
  description: string;
}> = ({ title = 'Read-only workspace', description }) => (
  <View style={styles.banner}>
    <View style={styles.iconWrap}>
      <Icon name="shield-lock-outline" size={18} color={colors.info} />
    </View>
    <View style={styles.copy}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  banner: {
    marginTop: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.info + '2f',
    backgroundColor: colors.info + '10',
    padding: spacing[4],
    flexDirection: 'row',
    gap: spacing[3],
  },
  iconWrap: {
    marginTop: 2,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  description: {
    marginTop: spacing[1],
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
});
