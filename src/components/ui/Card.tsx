import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const borderStyle =
    variant === 'outlined'
      ? {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: themeColors.border,
        }
      : null;
  const cardStyles = [
    styles.base,
    { backgroundColor: themeColors.card },
    borderStyle,
    styles[variant],
    styles[`padding_${padding}`],
    style,
  ];

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.light.card,
  },
  default: {
  },
  elevated: {
  },
  outlined: {
  },
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: spacing[3],
  },
  padding_md: {
    padding: spacing[4],
  },
  padding_lg: {
    padding: spacing[6],
  },
});
