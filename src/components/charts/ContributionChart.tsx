import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';

interface ContributionChartProps {
  data: Array<{
    month: string;
    amount: number;
  }>;
  style?: ViewStyle;
}

export const ContributionChart: React.FC<ContributionChartProps> = ({
  data,
  style,
}) => {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Monthly Contributions</Text>
      <View style={styles.chart}>
        {data.map((item, index) => {
          const height = (item.amount / maxAmount) * 120;
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: colors.primary[500],
                    },
                  ]}
                />
              </View>
              <Text style={styles.label}>{item.month}</Text>
              <Text style={styles.value}>
                KES {(item.amount / 1000).toFixed(0)}k
              </Text>
            </View>
          );
        })}
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
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: spacing[1],
  },
  bar: {
    width: '100%',
    borderRadius: borderRadius.sm,
    minHeight: 4,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[2],
  },
  value: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    marginTop: spacing[1],
  },
});
