import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useActiveRole } from '@/auth/guards';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { Role } from '@/auth/roles';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { RequireRouteAccess, useScreenRBAC } from '@/rbac';
import { announcementService, AnnouncementFeedItem } from '@/services/announcementService';
import { notificationService } from '@/services/notificationService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatDateTime } from '@/utils/format';

import { ModernHeader } from '@/components/ui/ModernHeader';

type AnnouncementsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'AnnouncementsFeed'>;
type AnnouncementsRouteProp = RouteProp<MainStackParamList, 'AnnouncementsFeed'>;

export const AnnouncementsFeedScreen: React.FC = () => {
  const navigation = useNavigation<AnnouncementsNavigationProp>();
  const route = useRoute<AnnouncementsRouteProp>();
  const { activeChamaId } = useActiveChama();
  const scopedChamaId = route.params?.chamaId || activeChamaId || undefined;
  const activeRole = useActiveRole(scopedChamaId) || Role.MEMBER;
  const canSendAnnouncements = useCanPerformAction(
    Permission.CAN_SEND_ANNOUNCEMENTS,
    scopedChamaId
  );
  const { experience } = useScreenRBAC('announcements', scopedChamaId);
  const canCreateAnnouncements = canSendAnnouncements && experience.access === 'full';
  const announcementNarrative = useMemo(() => {
    if (activeRole === Role.MEMBER) {
      return 'Read published updates, reminders, and group notices for your chama.';
    }
    if (activeRole === Role.SECRETARY) {
      return 'Draft and publish updates that keep members informed and prepared.';
    }
    if (activeRole === Role.CHAMA_ADMIN) {
      return 'Publish, pin, and manage important chama-wide announcements.';
    }
    if (activeRole === Role.AUDITOR) {
      return 'Review the published communications trail in a read-only workspace.';
    }
    return 'Review announcement activity in this scoped workspace.';
  }, [activeRole]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementFeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);

  const loadAnnouncements = useCallback(async (nextPage: number, replace = false) => {
    try {
      setError(null);
      const response = await announcementService.getFeed({
        chamaId: scopedChamaId,
        page: nextPage,
        pageSize: 20,
      });
      setAnnouncements((prev) => (replace ? response.results : [...prev, ...response.results]));
      setPage(response.page);
      setHasNext(response.hasNext);
    } catch (apiError) {
      const message =
        apiError instanceof Error ? apiError.message : 'We could not load announcements right now.';
      setError(message);
      if (replace) {
        setAnnouncements([]);
      }
    } finally {
      setLoading(false);
    }
  }, [scopedChamaId]);

  useEffect(() => {
    if (!scopedChamaId) {
      setLoading(false);
      setAnnouncements([]);
      return;
    }
    setLoading(true);
    void loadAnnouncements(1, true);
  }, [scopedChamaId]);

  const refresh = useCallback(async () => {
    if (!scopedChamaId) return;
    setRefreshing(true);
    setLoading(false);
    await loadAnnouncements(1, true);
    setRefreshing(false);
  }, [loadAnnouncements, scopedChamaId]);

  const loadMore = useCallback(async () => {
    if (!hasNext || fetchingMore || loading) return;
    setFetchingMore(true);
    await loadAnnouncements(page + 1);
    setFetchingMore(false);
  }, [fetchingMore, hasNext, loadAnnouncements, loading, page]);

  const markRead = useCallback(async (item: AnnouncementFeedItem) => {
    if (item.inbox_status?.toLowerCase() === 'read') return;
    setAnnouncements((prev) =>
      prev.map((row) =>
        row.id === item.id ? { ...row, inbox_status: 'read', read_at: new Date().toISOString() } : row
      )
    );
    try {
      await notificationService.markAsRead(item.id);
    } catch {
      setAnnouncements((prev) => prev.map((row) => (row.id === item.id ? item : row)));
    }
  }, []);

  const renderAnnouncement = useCallback(
    ({ item }: { item: AnnouncementFeedItem }) => {
      const isUnread = item.inbox_status?.toLowerCase() !== 'read';
      const showPriority = ['high', 'critical'].includes(String(item.priority || '').toLowerCase());
      const priorityLabel = String(item.priority || '').toUpperCase();

      return (
        <TouchableOpacity activeOpacity={0.9} onPress={() => void markRead(item)}>
          <Card style={styles.announcementCard}>
            <View style={styles.announcementTopRow}>
              <View style={styles.announcementTitleRow}>
                {isUnread ? <View style={styles.unreadDot} /> : null}
                <Text style={styles.announcementTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
              <Text style={styles.announcementTimestamp}>
                {formatDateTime(item.sent_at || item.created_at)}
              </Text>
            </View>
            <View style={styles.announcementMetaRow}>
              <Text style={styles.announcementChama}>{item.chama_name}</Text>
              {showPriority ? (
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityBadgeText}>{priorityLabel}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.announcementMessage}>{item.message}</Text>
          </Card>
        </TouchableOpacity>
      );
    },
    [markRead]
  );

  return (
    <RequireRouteAccess route="AnnouncementsFeed" chamaId={scopedChamaId}>
    <SafeAreaView style={styles.container}>
      <ModernHeader 
        title="Announcements" 
        subtitle="Stay updated"
        onAction={() => canCreateAnnouncements && scopedChamaId ? navigation.navigate('SendCommunication', { chamaId: scopedChamaId }) : void refresh()}
        actionIcon={canCreateAnnouncements && scopedChamaId ? 'plus' : 'refresh'}
      />

      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        renderItem={renderAnnouncement}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.primary[500]}
          />
        }
        ListHeaderComponent={
          <Card style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroIcon}>
                <Icon name="bullhorn-outline" size={28} color={colors.primary[700]} />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>Announcement feed</Text>
                <Text style={styles.heroSubtitle}>{announcementNarrative}</Text>
              </View>
            </View>

            {canCreateAnnouncements && scopedChamaId ? (
              <TouchableOpacity
                style={styles.composeButton}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('SendCommunication', { chamaId: scopedChamaId })}
              >
                <Icon name="plus" size={18} color={colors.light.background} />
                <Text style={styles.composeButtonText}>Create announcement</Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.centerText}>Loading announcements...</Text>
            </View>
          ) : error ? (
            <EmptyState
              title="Announcements unavailable"
              description={error}
              action={{ label: 'Retry', onPress: () => void refresh() }}
            />
          ) : scopedChamaId ? (
            <EmptyState
              title="No announcements yet"
              description="When updates are published for this chama, they will appear here."
              action={
                canCreateAnnouncements
                  ? { label: 'Create announcement', onPress: () => navigation.navigate('SendCommunication', { chamaId: scopedChamaId }) }
                  : undefined
              }
            />
          ) : (
            <EmptyState
              title="Choose a chama"
              description="Pick a chama to view its announcements."
              action={{ label: 'Open chamas', onPress: () => navigation.navigate('Chamas') }}
            />
          )
        }
        onEndReachedThreshold={0.35}
        onEndReached={() => void loadMore()}
        ListFooterComponent={
          fetchingMore ? (
            <View style={styles.footerState}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
            </View>
          ) : null
        }
      />
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  heroCard: {
    gap: spacing[4],
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    marginRight: spacing[3],
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  composeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[600],
  },
  composeButtonText: {
    color: colors.light.background,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
  },
  centerText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  announcementCard: {
    gap: spacing[2],
  },
  announcementTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  announcementTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    flex: 1,
  },
  unreadDot: {
    marginTop: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[600],
  },
  announcementTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  announcementTimestamp: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  announcementMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  announcementChama: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[700],
  },
  priorityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  priorityBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[700],
    letterSpacing: 0.3,
  },
  announcementMessage: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[700],
    lineHeight: 21,
  },
  footerState: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
});
