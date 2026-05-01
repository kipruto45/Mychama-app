import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { RequireRouteAccess, useScreenRBAC } from '@/rbac';
import { formatRelativeTime } from '@/utils/format';
import { notificationService } from '@/services/notificationService';
import { Notification } from '@/types';
import { useAppStore } from '@/store/appStore';
import { useActiveRole, useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { Role } from '@/auth/roles';
import { resolveContributionNotificationTarget } from '@/screens/roles/member/contributionWorkflowRouting';
import { resolveMemberLoanNotificationTarget } from '@/screens/roles/member/memberLoanWorkflowRouting';
import { resolveMemberPaymentNotificationTarget } from '@/screens/roles/member/memberPaymentWorkflowRouting';
import { resolveMemberWalletNotificationTarget } from '@/screens/roles/member/memberWalletWorkflowRouting';

type NotificationsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Notifications'>;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const { setUnreadNotificationsCount } = useAppStore();
  const { activeChamaId } = useActiveChama();
  const activeRole = useActiveRole(activeChamaId || undefined) || Role.MEMBER;
  const { visibleFilters } = useScreenRBAC('notifications', activeChamaId || undefined);
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categoryOptions = useMemo(() => {
    if (activeRole === Role.MEMBER) {
      return [
        { label: 'All', value: null },
        { label: 'Payments', value: 'payments' },
        { label: 'Meetings', value: 'meetings' },
        { label: 'Announcements', value: 'announcement' },
      ];
    }

    if (activeRole === Role.SECRETARY) {
      return [
        { label: 'All', value: null },
        { label: 'Meetings', value: 'meetings' },
        { label: 'Announcements', value: 'announcement' },
        { label: 'Membership', value: 'membership' },
        { label: 'System', value: 'system' },
      ];
    }

    if (activeRole === Role.TREASURER) {
      return [
        { label: 'All', value: null },
        { label: 'Payments', value: 'payments' },
        { label: 'Loans', value: 'loans' },
        { label: 'Membership', value: 'membership' },
        { label: 'System', value: 'system' },
      ];
    }

    return [
      { label: 'All', value: null },
      { label: 'Payments', value: 'payments' },
      { label: 'Meetings', value: 'meetings' },
      { label: 'Membership', value: 'membership' },
      { label: 'Invite', value: 'invite' },
      { label: 'System', value: 'system' },
    ];
  }, [activeRole]);

  // Permission checks
  const canViewNotifications = useCanPerformAction(Permission.CAN_VIEW_NOTIFICATIONS);
  const canMarkAllRead = canViewNotifications;

  const parseActionUrl = (actionUrl?: string | null) => {
    if (!actionUrl) {
      return null;
    }

    const segments = actionUrl.split('?')[0].split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    if (!lastSegment) {
      return null;
    }

    if (segments.includes('meetings')) {
      return { kind: 'meeting' as const, id: lastSegment };
    }

    if (segments.includes('payments') || segments.includes('transactions')) {
      return { kind: 'payment' as const, id: lastSegment };
    }

    if (segments.includes('loans')) {
      return { kind: 'loan' as const, id: lastSegment };
    }

    return null;
  };

  const loadNotifications = async (nextPage = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await notificationService.getNotifications({
        page: nextPage,
        pageSize: 20,
        unread: unreadOnly,
        category: activeCategory || undefined,
        search: search || undefined,
      });

      setNotifications((prev) =>
        append ? [...prev, ...response.notifications] : response.notifications
      );
      setPage(response.page);
      setHasNext(response.hasNext);
      setUnreadNotificationsCount(response.unreadCount);
    } catch (apiError) {
      const message =
        typeof apiError === 'object' && apiError && 'message' in apiError
          ? String((apiError as { message?: string }).message || 'Unable to load notifications.')
          : 'Unable to load notifications.';
      setError(message);
      if (!append) {
        setNotifications([]);
        setUnreadNotificationsCount(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadNotifications(1, false);
  }, [unreadOnly, activeCategory, search]);

  useEffect(() => {
    setUnreadNotificationsCount(notifications.filter((item) => !item.is_read).length);
  }, [notifications, setUnreadNotificationsCount]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications(1, false);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || loading || !hasNext) {
      return;
    }
    await loadNotifications(page + 1, true);
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (error) {
      console.warn('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.warn('Failed to mark all notifications as read', error);
    }
  };

  const deleteNotification = async (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.deleteNotification(id);
              setNotifications((prev) => prev.filter((n) => n.id !== id));
            } catch (error) {
              console.warn('Failed to delete notification', error);
              Alert.alert('Delete failed', 'This notification could not be archived right now.');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'contribution_due':
        return 'cash';
      case 'meeting_reminder':
        return 'calendar';
      case 'announcement':
        return 'bullhorn';
      case 'payment_received':
        return 'check-circle';
      case 'loan_approved':
        return 'bank-check';
      case 'system':
        return 'information';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'contribution_due':
        return colors.warning;
      case 'meeting_reminder':
        return colors.info;
      case 'announcement':
        return colors.primary[500];
      case 'payment_received':
        return colors.success;
      case 'loan_approved':
        return colors.success;
      case 'system':
        return colors.neutral[500];
      default:
        return colors.primary[500];
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    void markAsRead(notification.id);

    const payload = notification.data || {};
    const walletTarget =
      activeRole === Role.MEMBER ? resolveMemberWalletNotificationTarget(notification) : null;
    const paymentTarget =
      activeRole === Role.MEMBER ? resolveMemberPaymentNotificationTarget(notification) : null;
    const loanTarget =
      activeRole === Role.MEMBER ? resolveMemberLoanNotificationTarget(notification) : null;
    const contributionTarget =
      activeRole === Role.MEMBER ? resolveContributionNotificationTarget(notification) : null;

    if (walletTarget) {
      (navigation as any).navigate(walletTarget.screen, walletTarget.params);
      return;
    }

    if (paymentTarget) {
      (navigation as any).navigate(paymentTarget.screen, paymentTarget.params);
      return;
    }

    if (loanTarget) {
      (navigation as any).navigate(loanTarget.screen, loanTarget.params);
      return;
    }

    if (contributionTarget) {
      (navigation as any).navigate(contributionTarget.screen, contributionTarget.params);
      return;
    }

    const routeFromUrl = parseActionUrl(
      typeof payload.action_url === 'string' ? payload.action_url : null
    );

    if (routeFromUrl?.kind === 'meeting') {
      navigation.navigate('MeetingDetail', { meetingId: routeFromUrl.id });
      return;
    }

    if (routeFromUrl?.kind === 'payment') {
      navigation.navigate('PaymentDetail', { paymentId: routeFromUrl.id });
      return;
    }

    if (routeFromUrl?.kind === 'loan') {
      navigation.navigate('LoanDetail', { loanId: routeFromUrl.id });
      return;
    }

    switch (notification.type) {
      case 'contribution_due':
        if (payload.chamaId || payload.chama_id) {
          navigation.navigate('MemberContributions', {
            chamaId: payload.chamaId || payload.chama_id,
            entryPoint: 'notifications',
          });
        }
        break;
      case 'meeting_reminder':
        if (payload.meetingId || payload.meeting_id) {
          navigation.navigate('MeetingDetail', {
            meetingId: payload.meetingId || payload.meeting_id,
          });
        }
        break;
      case 'payment_received':
        if (payload.paymentId || payload.payment_id) {
          navigation.navigate('PaymentDetail', {
            paymentId: payload.paymentId || payload.payment_id,
          });
        }
        break;
      case 'loan_approved':
        if (payload.loanId || payload.loan_id) {
          navigation.navigate('LoanDetail', {
            loanId: payload.loanId || payload.loan_id,
          });
        }
        break;
      default:
        break;
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.is_read && styles.notificationItemUnread,
      ]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => deleteNotification(item.id)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.notificationIcon,
          { backgroundColor: getNotificationColor(item.type) + '20' },
        ]}
      >
        <Icon
          name={getNotificationIcon(item.type)}
          size={20}
          color={getNotificationColor(item.type)}
        />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text
            style={[
              styles.notificationTitle,
              !item.is_read && styles.notificationTitleUnread,
            ]}
          >
            {item.title}
          </Text>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        {item.chama_name ? (
          <Text style={styles.notificationChama}>{item.chama_name}</Text>
        ) : null}
        <Text style={styles.notificationTime}>
          {formatRelativeTime(item.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon={<Icon name="bell-off-outline" size={64} color={colors.neutral[400]} />}
      title={error ? 'Could not load notifications' : 'No Notifications'}
      description={error || "You're all caught up! Check back later for updates"}
      action={
        error ? (
          <Button
            title="Retry"
            onPress={() => void loadNotifications(1, false)}
            icon={<Icon name="refresh" size={20} color="#FFFFFF" />}
          />
        ) : undefined
      }
    />
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <RequireRouteAccess route="Notifications" chamaId={activeChamaId || undefined}>
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Badge label={`${unreadCount} new`} variant="primary" size="sm" />
          )}
        </View>
        {unreadCount > 0 && canMarkAllRead && (
          <TouchableOpacity
            onPress={markAllAsRead}
            style={styles.markAllButton}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification List */}
      {!loading && !error && !canViewNotifications ? (
        <EmptyState
          icon={<Icon name="shield-lock-outline" size={64} color={colors.neutral[400]} />}
          title="Notifications unavailable"
          description="Your current role does not allow notification history in this context."
          style={styles.emptyState}
        />
      ) : loading ? (
        <SkeletonList count={5} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.filterSection}>
              <View style={styles.searchRow}>
                <TextInput
                  placeholder="Search notifications"
                  placeholderTextColor={colors.neutral[400]}
                  style={styles.searchInput}
                  value={searchDraft}
                  onChangeText={setSearchDraft}
                  onSubmitEditing={() => setSearch(searchDraft.trim())}
                  returnKeyType="search"
                />
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={() => setSearch(searchDraft.trim())}
                >
                  <Icon name="magnify" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.filterRow}>
                {visibleFilters.length === 0 || visibleFilters.includes('unread') ? (
                  <TouchableOpacity
                    style={[styles.filterChip, unreadOnly && styles.filterChipActive]}
                    onPress={() => setUnreadOnly((prev) => !prev)}
                  >
                    <Text style={[styles.filterChipText, unreadOnly && styles.filterChipTextActive]}>
                      Unread only
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {search ? (
                  <TouchableOpacity
                    style={styles.clearChip}
                    onPress={() => {
                      setSearch('');
                      setSearchDraft('');
                    }}
                  >
                    <Text style={styles.clearChipText}>Clear search</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categoryOptions.map((item) => {
                  const isActive = activeCategory === item.value;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                      onPress={() => setActiveCategory(item.value)}
                    >
                      <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={
            hasNext ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => void loadMore()}
                disabled={loadingMore}
              >
                <Text style={styles.loadMoreText}>
                  {loadingMore ? 'Loading more...' : 'Load more'}
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </SafeAreaView>
    </RequireRouteAccess>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backButton: {
    padding: spacing[2],
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing[3],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginRight: spacing[2],
  },
  markAllButton: {
    padding: spacing[2],
  },
  markAllText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    paddingBottom: spacing[8],
  },
  filterSection: {
    marginBottom: spacing[4],
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: spacing[3],
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.light.card,
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.regular,
  },
  searchButton: {
    marginLeft: spacing[2],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  filterChip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.light.card,
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterChipText: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  clearChip: {
    marginLeft: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  clearChipText: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    marginRight: spacing[2],
  },
  categoryChipActive: {
    backgroundColor: colors.primary[100],
  },
  categoryChipText: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  categoryChipTextActive: {
    color: colors.primary[700],
  },
  emptyState: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  notificationItemUnread: {
    backgroundColor: colors.primary[50],
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  notificationTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[900],
    flex: 1,
  },
  notificationTitleUnread: {
    fontFamily: typography.fontFamily.semibold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    marginLeft: spacing[2],
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginBottom: spacing[2],
    lineHeight: 20,
  },
  notificationChama: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
    marginBottom: spacing[1],
  },
  notificationTime: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[400],
  },
  loadMoreButton: {
    marginTop: spacing[2],
    alignSelf: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  loadMoreText: {
    color: colors.primary[600],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
});
