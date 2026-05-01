import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Chama } from '@/types';

interface ChamaCardProps {
  chama: Chama;
  onPress: () => void;
  style?: ViewStyle;
}

export const ChamaCard: React.FC<ChamaCardProps> = ({
  chama,
  onPress,
  style,
}) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'primary';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Avatar name={chama.name} size="lg" />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{chama.name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {chama.description || 'No description'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{chama.member_count || 0}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{chama.currency}</Text>
            <Text style={styles.statLabel}>Currency</Text>
          </View>
        </View>
        <Badge
          label={chama.status}
          variant={getStatusVariant(chama.status)}
          size="sm"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.neutral[100],
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  description: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
});
