import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingTitle?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingTitle,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const buttonStyles = [
    styles.base,
    styles[variant],
    variant === 'outline' ? { borderColor: colors.primary[500] } : null,
    variant === 'ghost' ? { backgroundColor: 'transparent' } : null,
    styles[size],
    disabled && styles.disabled,
    loading && styles.loading,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    variant === 'outline' || variant === 'ghost' ? { color: colors.primary[500] } : null,
    styles[`text_${size}`],
    loading && styles.textLoading,
    textStyle,
  ];

  const spinnerColor = variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : colors.primary[500];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <>
          <ActivityIndicator color={spinnerColor} size="small" />
          {loadingTitle && <Text style={textStyles}>{loadingTitle}</Text>}
        </>
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  primary: {
    backgroundColor: colors.primary[500],
  },
  secondary: {
    backgroundColor: colors.accent[500],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  sm: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  md: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
  },
  lg: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
  },
  disabled: {
    opacity: 0.5,
  },
  loading: {
    opacity: 0.9,
  },
  text: {
    fontFamily: typography.fontFamily.semibold,
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#FFFFFF',
  },
  text_outline: {
    color: colors.primary[500],
  },
  text_ghost: {
    color: colors.primary[500],
  },
  text_sm: {
    fontSize: typography.fontSize.sm,
  },
  text_md: {
    fontSize: typography.fontSize.base,
  },
  text_lg: {
    fontSize: typography.fontSize.lg,
  },
  textLoading: {
    opacity: 1,
  },
});
