import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  style,
}) => {
  const { isDark } = useTheme();
  const badgeStyles = [
    styles.base,
    styles[variant],
    isDark ? styles.darkVariant : null,
    styles[size],
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  primary: {
    backgroundColor: colors.primary[100],
  },
  secondary: {
    backgroundColor: colors.accent[100],
  },
  success: {
    backgroundColor: '#D1FAE5',
  },
  warning: {
    backgroundColor: '#FEF3C7',
  },
  error: {
    backgroundColor: '#FEE2E2',
  },
  info: {
    backgroundColor: '#DBEAFE',
  },
  darkVariant: {
    opacity: 0.88,
  },
  sm: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  md: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
  },
  text: {
    fontFamily: typography.fontFamily.medium,
  },
  text_primary: {
    color: colors.primary[700],
  },
  text_secondary: {
    color: colors.accent[700],
  },
  text_success: {
    color: '#065F46',
  },
  text_warning: {
    color: '#92400E',
  },
  text_error: {
    color: '#991B1B',
  },
  text_info: {
    color: '#1E40AF',
  },
  text_sm: {
    fontSize: typography.fontSize.xs,
  },
  text_md: {
    fontSize: typography.fontSize.sm,
  },
});
