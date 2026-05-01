import React from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { colors, spacing, borderRadius } from '@/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.md,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius: radius,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.card, style]}>
    <Skeleton width="60%" height={20} style={{ marginBottom: spacing[2] }} />
    <Skeleton width="80%" height={16} style={{ marginBottom: spacing[2] }} />
    <Skeleton width="40%" height={16} />
  </View>
);

export const SkeletonList: React.FC<{ count?: number; style?: ViewStyle }> = ({
  count = 3,
  style,
}) => (
  <View style={style}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} style={{ marginBottom: spacing[3] }} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.neutral[200],
  },
  card: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
});
