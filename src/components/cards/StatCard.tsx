import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = colors.primary[500],
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
      </View>

      <Text style={[styles.value, { color }]} numberOfLines={2}>{value}</Text>

      {subtitle && <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>}

      {trend && (
        <View style={styles.trendContainer}>
          <Text
            style={[
              styles.trendValue,
              { color: trend.isPositive ? colors.success : colors.error },
            ]}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Text>
          <Text style={styles.trendLabel}>vs last month</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  icon: {
    marginRight: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    flex: 1,
    flexShrink: 1,
  },
  value: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
    flexShrink: 1,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[400],
    marginBottom: spacing[2],
    flexShrink: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendValue: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    marginRight: spacing[1],
  },
  trendLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[400],
  },
});
