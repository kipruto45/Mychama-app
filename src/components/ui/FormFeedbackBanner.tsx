import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';

type BannerType = 'error' | 'success' | 'info' | 'warning';

const CONFIG: Record<
  BannerType,
  { icon: string; iconColor: string; backgroundColor: string; borderColor: string }
> = {
  error: {
    icon: 'alert-circle',
    iconColor: colors.error,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  success: {
    icon: 'check-decagram-outline',
    iconColor: colors.primary[700],
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[100],
  },
  info: {
    icon: 'information-outline',
    iconColor: colors.info,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  warning: {
    icon: 'alert',
    iconColor: colors.warning[700],
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
};

export function FormFeedbackBanner({
  type,
  title,
  message,
  style,
  testID,
}: {
  type: BannerType;
  title?: string;
  message: string;
  style?: ViewStyle;
  testID?: string;
}) {
  const config = CONFIG[type];

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        style,
      ]}
    >
      <Icon name={config.icon as any} size={18} color={config.iconColor} />
      <View style={styles.copy}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing[4],
  },
  copy: {
    flex: 1,
    gap: spacing[1],
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  message: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    lineHeight: 20,
  },
});

export default FormFeedbackBanner;

