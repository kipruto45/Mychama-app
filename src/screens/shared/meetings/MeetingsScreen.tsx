import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  SectionList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { meetingService } from '@/services/meetingService';
import { Meeting } from '@/types';
import { useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';

type MeetingsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Meetings'>;

interface MeetingListItem extends Meeting {
  chamaMeta: { id: string; name: string };
  agendaCount: number;
  attendanceCount: number;
  totalMembers: number;
  userAttending?: boolean;
}

type MeetingFilter = 'upcoming' | 'past';

type MeetingSection = {
  title: string;
  data: MeetingListItem[];
};

export const MeetingsScreen: React.FC = () => {
  const navigation = useNavigation<MeetingsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
   const {
     activeChamaId,
     activeChama,
     availableChamas,
     clearSwitchError,
     isSwitching,
     switchChama,
     switchError,
   } = useActiveChama();

   const canCreateMeetings = useCanPerformAction(Permission.CAN_CREATE_MEETINGS, activeChamaId || undefined);

   const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<MeetingFilter>('upcoming');
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);

  const loadMeetings = async () => {
    if (!activeChamaId) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const chamaMeetings = await meetingService.getMeetings(activeChamaId);

      const data: MeetingListItem[] = await Promise.all(
        chamaMeetings.map(async (meeting) => {
          const [summary, agendaItems] = await Promise.all([
            meetingService.getMeetingSummary(meeting.id).catch(() => null),
            meetingService.getAgendaItems(meeting.id).catch(() => []),
          ]);

          return {
            ...meeting,
            chamaMeta: { id: activeChamaId, name: activeChama?.name || 'Chama' },
            agendaCount: agendaItems.length,
            attendanceCount: summary?.present_count || 0,
            totalMembers: summary?.total_members || 0,
          };
        })
      );

      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMeetings(sorted);
    } catch (apiError) {
      const message = typeof apiError === 'object' && apiError && 'message' in apiError
        ? String((apiError as { message?: string }).message || 'Unable to load meetings.')
        : 'Unable to load meetings.';
      setError(message);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [activeChamaId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeetings();
    setRefreshing(false);
  };

  const filteredMeetings = useMemo(() => {
    let filtered = meetings;
    const now = new Date();

    if (activeFilter === 'upcoming') {
      filtered = filtered.filter(m => new Date(m.date) >= now && m.status === 'scheduled');
    } else {
      filtered = filtered.filter(m => new Date(m.date) < now || m.status === 'completed');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(query) ||
        (m.description || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [meetings, activeFilter, searchQuery]);

  const groupedSections = useMemo(() => {
    const grouped = new Map<string, MeetingListItem[]>();
    const now = new Date();

    filteredMeetings.forEach((meeting) => {
      const date = new Date(meeting.date);
      let sectionKey = '';

      if (activeFilter === 'upcoming') {
        if (date.toDateString() === now.toDateString()) sectionKey = 'Today';
        else if (date > now) {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (date.toDateString() === tomorrow.toDateString()) sectionKey = 'Tomorrow';
          else {
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() + 7);
            if (date <= weekEnd) sectionKey = 'This Week';
            else sectionKey = 'Later';
          }
        }
      } else {
        if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) sectionKey = 'This Month';
        else {
          const lastMonth = new Date(now);
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          if (date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear()) sectionKey = 'Last Month';
          else sectionKey = 'Older';
        }
      }

      const current = grouped.get(sectionKey) || [];
      current.push(meeting);
      grouped.set(sectionKey, current);
    });

    const order = activeFilter === 'upcoming'
      ? ['Today', 'Tomorrow', 'This Week', 'Later']
      : ['This Month', 'Last Month', 'Older'];

    return order.filter(key => grouped.has(key)).map(key => ({
      title: key,
      data: grouped.get(key) || [],
    }));
  }, [filteredMeetings, activeFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = meetings.filter(m => new Date(m.date) >= now && m.status === 'scheduled').length;
    const past = meetings.filter(m => new Date(m.date) < now || m.status === 'completed').length;
    const nextMeeting = meetings.find(m => new Date(m.date) >= now && m.status === 'scheduled');
    
    return { upcoming, past, nextMeeting };
  }, [meetings]);

  const getStatusBadge = (meeting: MeetingListItem) => {
    const now = new Date();
    const meetingDate = new Date(meeting.date);
    const isToday = meetingDate.toDateString() === now.toDateString();
    const isPast = meetingDate < now || meeting.status === 'completed';

    if (isToday) return { label: 'Today', variant: 'warning' as const };
    if (isPast) return { label: 'Completed', variant: 'success' as const };
    if (meeting.location_type === 'online') return { label: 'Online', variant: 'info' as const };
    return { label: 'Upcoming', variant: 'info' as const };
  };

  const renderMeetingItem = ({ item }: { item: MeetingListItem }) => {
    const status = getStatusBadge(item);
    const meetingDate = new Date(item.date);
    
    return (
      <TouchableOpacity
        style={styles.meetingCard}
        onPress={() => navigation.navigate('MeetingDetail', { meetingId: item.id })}
        activeOpacity={0.75}
      >
        <View style={styles.meetingCardHeader}>
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>{meetingDate.getDate()}</Text>
            <Text style={styles.dateMonth}>{meetingDate.toLocaleString('default', { month: 'short' })}</Text>
          </View>
          
          <View style={styles.meetingInfo}>
            <Text style={styles.meetingTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.meetingMeta}>
              <Icon name="clock-outline" size={12} color={colors.neutral[500]} />
              <Text style={styles.meetingTime}>{item.time || meetingDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Icon name="map-marker-outline" size={12} color={colors.neutral[500]} />
              <Text style={styles.meetingLocation} numberOfLines={1}>
                {item.location_type === 'online' ? 'Online meeting' : item.location || 'TBD'}
              </Text>
            </View>
          </View>
          
          <Badge label={status.label} variant={status.variant} size="sm" />
        </View>

        {item.description && (
          <Text style={styles.meetingDescription} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={styles.meetingCardFooter}>
          <View style={styles.footerItem}>
            <Icon name="format-list-checks" size={14} color={colors.neutral[500]} />
            <Text style={styles.footerText}>{item.agendaCount} agenda</Text>
          </View>
          <View style={styles.footerItem}>
            <Icon name="account-group-outline" size={14} color={colors.neutral[500]} />
            <Text style={styles.footerText}>{item.attendanceCount}/{item.totalMembers}</Text>
          </View>
          
          {item.location_type === 'online' && item.meeting_link && (
            <TouchableOpacity style={styles.joinButton} onPress={() => {}}>
              <Icon name="video" size={14} color={colors.primary[500]} />
              <Text style={styles.joinText}>Join</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: MeetingSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length} meeting{section.data.length !== 1 ? 's' : ''}</Text>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return <SkeletonList count={3} />;
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Icon name="alert-circle-outline" size={48} color={colors.error} />
          </View>
          <Text style={styles.emptyTitle}>Unable to load meetings</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <Button title="Try Again" onPress={loadMeetings} style={styles.emptyButton} />
        </View>
      );
    }

    if (searchQuery && filteredMeetings.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Icon name="magnify" size={48} color={colors.neutral[400]} />
          </View>
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptySubtitle}>No meetings match "{searchQuery}"</Text>
          <Button title="Clear Search" onPress={() => setSearchQuery('')} variant="outline" style={styles.emptyButton} />
        </View>
      );
    }

    const noUpcoming = activeFilter === 'upcoming';
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <Icon name={noUpcoming ? "calendar-blank" : "history"} size={48} color={colors.neutral[300]} />
        </View>
        <Text style={styles.emptyTitle}>{noUpcoming ? 'No upcoming meetings' : 'No past meetings'}</Text>
        <Text style={styles.emptySubtitle}>
          {noUpcoming ? 'Your next meeting will appear here' : 'Completed meetings will show here'}
        </Text>
        {noUpcoming && (
          <Button title="View Past Meetings" onPress={() => setActiveFilter('past')} variant="outline" style={styles.emptyButton} />
        )}
      </View>
    );
  };

  if (!activeChamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Icon name="calendar-account-outline" size={48} color={colors.neutral[400]} />
          </View>
          <Text style={styles.emptyTitle}>Select a chama</Text>
          <Text style={styles.emptySubtitle}>Choose a chama to view its meetings</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
       <View style={styles.header}>
         <View>
           <Text style={styles.headerTitle}>Meetings</Text>
           <Text style={styles.headerSubtitle}>{activeChama?.name || 'MyChama'}</Text>
         </View>
         {canCreateMeetings && (
           <TouchableOpacity
             style={styles.headerButton}
             onPress={() => navigation.navigate('CreateMeeting', { chamaId: activeChamaId })}
           >
             <Icon name="calendar-plus" size={22} color={colors.neutral[700]} />
           </TouchableOpacity>
         )}
       </View>

      <ChamaContextSwitcher
        chamas={availableChamas}
        activeChamaId={activeChamaId}
        isSwitching={isSwitching}
        helperText={switchError}
        onSelectChama={(chamaId) => {
          clearSwitchError();
          void switchChama(chamaId).then(loadMeetings).catch(() => undefined);
        }}
      />

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.upcoming}</Text>
          <Text style={styles.summaryLabel}>Upcoming</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValueSuccess}>{stats.past}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {stats.nextMeeting ? new Date(stats.nextMeeting.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }) : '-'}
          </Text>
          <Text style={styles.summaryLabel}>Next meeting</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={18} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search meetings..."
            placeholderTextColor={colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={16} color={colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeFilter === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveFilter('upcoming')}
        >
          <Text style={[styles.tabText, activeFilter === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
          {stats.upcoming > 0 && (
            <View style={[styles.tabBadge, activeFilter === 'upcoming' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeFilter === 'upcoming' && styles.tabBadgeTextActive]}>{stats.upcoming}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeFilter === 'past' && styles.tabActive]}
          onPress={() => setActiveFilter('past')}
        >
          <Text style={[styles.tabText, activeFilter === 'past' && styles.tabTextActive]}>Past</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={groupedSections}
        keyExtractor={(item) => item.id}
        renderItem={renderMeetingItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    marginBottom: spacing[3],
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
  },
  summaryValueSuccess: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing[1],
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing[2],
    fontSize: typography.fontSize.sm,
    color: colors.neutral[900],
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[100],
  },
  tabActive: {
    backgroundColor: colors.primary[500],
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: colors.neutral[300],
    borderRadius: borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: spacing[1],
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[700],
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[400],
  },
  meetingCard: {
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  meetingCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  dateDay: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary[700],
    lineHeight: 22,
  },
  dateMonth: {
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
    textTransform: 'uppercase',
  },
  meetingInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  meetingTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: 2,
  },
  meetingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetingTime: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    marginLeft: 3,
  },
  metaDot: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[300],
    marginHorizontal: spacing[1],
  },
  meetingLocation: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    marginLeft: 3,
    flex: 1,
  },
  meetingDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    marginTop: spacing[2],
    lineHeight: 18,
  },
  meetingCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[3],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    marginLeft: 4,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    marginLeft: 'auto',
  },
  joinText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[600],
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[12],
    paddingHorizontal: spacing[6],
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[800],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  emptyButton: {
    minWidth: 140,
  },
});

export default MeetingsScreen;
