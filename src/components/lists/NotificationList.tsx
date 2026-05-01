import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Badge } from '@/components/ui/Badge';
import { Notification } from '@/types';
import { formatRelativeTime } from '@/utils/format';

interface NotificationListProps {
  notifications: Notification[];
  onNotificationPress?: (notification: Notification) => void;
  style?: ViewStyle;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onNotificationPress,
  style,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contribution_due':
        return '💰';
      case 'meeting_reminder':
        return '📅';
      case 'announcement':
        return '📢';
      case 'payment_received':
        return '✅';
      case 'loan_approved':
        return '🏦';
      default:
        return '🔔';
    }
  };

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'contribution_due':
        return 'warning';
      case 'meeting_reminder':
        return 'info';
      case 'announcement':
        return 'primary';
      case 'payment_received':
        return 'success';
      case 'loan_approved':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.is_read && styles.unread,
      ]}
      onPress={() => onNotificationPress?.(item)}
      activeOpacity={0.7}
      disabled={!onNotificationPress}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getTypeIcon(item.type)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (notifications.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={styles.emptyText}>No notifications yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      renderItem={renderNotification}
      keyExtractor={(item) => item.id}
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing[4],
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  unread: {
    backgroundColor: colors.primary[50],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
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
  title: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  message: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
  time: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[400],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    marginLeft: spacing[2],
    marginTop: spacing[1],
  },
  emptyContainer: {
    padding: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
});
