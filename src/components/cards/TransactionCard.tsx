import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/utils/format';

interface TransactionCardProps {
  type: 'contribution' | 'loan' | 'repayment' | 'penalty';
  direction?: 'inflow' | 'outflow' | 'internal';
  amount: string;
  currency: string;
  description: string;
  date: string;
  status?: string;
  memberName?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const _TransactionCard: React.FC<TransactionCardProps> = ({
  type,
  direction,
  amount,
  currency,
  description,
  date,
  status,
  memberName,
  onPress,
  style,
}) => {
  const getTypeColor = () => {
    switch (type) {
      case 'contribution':
        return colors.success;
      case 'loan':
        return colors.warning;
      case 'repayment':
        return colors.primary[500];
      case 'penalty':
        return colors.error;
      default:
        return colors.neutral[500];
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'contribution':
        return '💰';
      case 'loan':
        return '🏦';
      case 'repayment':
        return '💳';
      case 'penalty':
        return '⚠️';
      default:
        return '📄';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'reversed':
        return 'error';
      default:
        return 'info';
    }
  };

  const resolvedSign = (() => {
    if (direction === 'inflow') return '+';
    if (direction === 'outflow') return '-';
    if (direction === 'internal') return '';
    return type === 'loan' || type === 'penalty' ? '+' : '-';
  })();

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getTypeIcon()}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={1}>
          {description}
        </Text>
        {memberName && (
          <Text style={styles.memberName}>{memberName}</Text>
        )}
        <Text style={styles.date}>{formatDate(date)}</Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, { color: getTypeColor() }]}>
          {resolvedSign}
          {formatCurrency(amount, currency)}
        </Text>
        {status && (
          <Badge
            label={status}
            variant={getStatusVariant(status)}
            size="sm"
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  memberName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  date: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[400],
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[1],
  },
});

export const TransactionCard = React.memo(_TransactionCard);
