import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';

interface BalanceChartProps {
  totalBalance: string;
  availableBalance: string;
  lockedBalance: string;
  currency: string;
  style?: ViewStyle;
}

export const BalanceChart: React.FC<BalanceChartProps> = ({
  totalBalance,
  availableBalance,
  lockedBalance,
  currency,
  style,
}) => {
  const total = parseFloat(totalBalance) || 1;
  const available = parseFloat(availableBalance) || 0;
  const locked = parseFloat(lockedBalance) || 0;

  const availablePercent = (available / total) * 100;
  const lockedPercent = (locked / total) * 100;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Wallet Balance</Text>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.totalBalance}>
          {currency} {parseFloat(totalBalance).toLocaleString()}
        </Text>
        <Text style={styles.totalLabel}>Total Balance</Text>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.barContainer}>
          <View
            style={[
              styles.bar,
              {
                width: `${availablePercent}%`,
                backgroundColor: colors.primary[500],
              },
            ]}
          />
          <View
            style={[
              styles.bar,
              {
                width: `${lockedPercent}%`,
                backgroundColor: colors.accent[500],
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.primary[500] }]}
          />
          <Text style={styles.legendLabel}>Available</Text>
          <Text style={styles.legendValue}>
            {currency} {parseFloat(availableBalance).toLocaleString()}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.accent[500] }]}
          />
          <Text style={styles.legendLabel}>Locked</Text>
          <Text style={styles.legendValue}>
            {currency} {parseFloat(lockedBalance).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
  title: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  totalBalance: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  totalLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  chartContainer: {
    marginBottom: spacing[4],
  },
  barContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[200],
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing[2],
  },
  legendLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginRight: spacing[2],
  },
  legendValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
});
