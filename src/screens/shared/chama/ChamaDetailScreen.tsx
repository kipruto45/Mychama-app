import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { MeetingCard } from '@/components/cards/MeetingCard';
import { MainStackParamList } from '@/navigation/types';
import { chamaService } from '@/services/chamaService';
import { financeService } from '@/services/financeService';
import { meetingService } from '@/services/meetingService';
import { formatDate } from '@/utils/format';
import { useActiveRole, useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { Role } from '@/auth/roles';
import { useAuthStore } from '@/store/authStore';

type ChamaDetailScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ChamaDetail'>;
type ChamaDetailScreenRouteProp = RouteProp<MainStackParamList, 'ChamaDetail'>;

export const ChamaDetailScreen: React.FC = () => {
  const navigation = useNavigation<ChamaDetailScreenNavigationProp>();
  const route = useRoute<ChamaDetailScreenRouteProp>();
  const { chamaId } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'meetings' | 'announcements' | 'rules'>('meetings');
  const [chama, setChama] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [userContributions, setUserContributions] = useState<any[]>([]);
  const [myTotalContributions, setMyTotalContributions] = useState<number>(0);
  const [userLoan, setUserLoan] = useState<any | null>(null);
  const [myMembership, setMyMembership] = useState<any>(null);

  const activeRole = useActiveRole(chamaId);
  const currentUserId = useAuthStore((state) => state.user?.id);

  // Permission checks
  const canMakePayments = useCanPerformAction(Permission.CAN_MAKE_PAYMENTS, chamaId);
  const canRequestLoan = useCanPerformAction(Permission.CAN_REQUEST_LOAN, chamaId);
  const canCreateMeetings = useCanPerformAction(Permission.CAN_CREATE_MEETINGS, chamaId);
  const canInviteMembers = useCanPerformAction(Permission.CAN_INVITE_MEMBERS, chamaId);
  const canManageSettings = useCanPerformAction(Permission.CAN_MANAGE_CHAMA_SETTINGS, chamaId);

   // Date helpers
   const isUpcoming = (dateStr: string) => new Date(dateStr) > new Date();
   const isPast = (dateStr: string) => new Date(dateStr) <= new Date();

   const loadChamaDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate chamaId
      if (!chamaId) {
        const errorMsg = 'Chama ID is missing';
        console.error('ChamaDetailScreen:', errorMsg);
        setError(errorMsg);
        return;
      }

      console.log('ChamaDetailScreen: Loading chama details for:', { chamaId, currentUserId });

      try {
        let apiChama: any;
        try {
          apiChama = await chamaService.getChama(chamaId);
        } catch (chamaError) {
          // If 404 on chama fetch, log detailed error but continue with members fetch
          const errorStatus = (chamaError as any)?.status;
          const errorCode = (chamaError as any)?.code;
          console.error('Error fetching chama:', {
            status: errorStatus,
            code: errorCode,
            message: (chamaError as any)?.message,
            detail: 'User may not have approved membership. Attempting to load members instead.',
          });
          // Fetch chama from members data as fallback
          apiChama = null;
        }

        const [apiMembers, wallet, ledgerEntries, apiMeetings, contributions] = await Promise.all([
          chamaService.getMembers(chamaId).catch((err) => {
            console.error('Error fetching members:', err?.message || err);
            return [];
          }),
          financeService.getWallet(chamaId).catch(() => null),
          financeService.getLedgerEntries(chamaId).catch(() => []),
          meetingService.getMeetings(chamaId).catch(() => []),
          financeService.getContributions(chamaId).catch(() => []),
        ]);

        // If no data could be fetched at all, show error
        if (!apiChama && apiMembers.length === 0) {
          const errorMsg = 'Unable to load chama details. You may not have permission to view this chama or it may not exist.';
          console.error('ChamaDetailScreen:', errorMsg);
          setError(errorMsg);
          return;
        }

        // Derive member-specific data
        const myContributions = contributions.filter((c) => c.member.id === currentUserId);
        const myTotal = myContributions.reduce((sum, c) => sum + Number(c.amount || 0), 0);

        // Find active loan: entry with loan_id, type=disbursement, approval_status=approved AND settlement_status=active
        const activeLoanEntry = ledgerEntries.find(
          (tx: any) =>
            tx.loan_id &&
            tx.type === 'disbursement' &&
            tx.approval_status === 'approved' &&
            tx.settlement_status === 'active'
        ) || null;

        // Use fetched chama data or fall back to a minimal shell.
        // Membership payloads only include `chama` as an ID (string), not full chama details.
        const chamaData = apiChama || {
          id: chamaId,
          name: 'Chama',
          description: '',
          county: '',
          subcounty: '',
          total_savings: '0',
          created_at: '',
          updated_at: '',
        };

        setChama({
          ...chamaData,
          member_count: apiMembers.length,
          total_savings: apiChama?.total_savings || '0',
          wallet_balance: wallet?.available_balance || '0',
          locked_balance: wallet?.locked_balance || '0',
        });
        setMembers(apiMembers);

        // Find current user's membership record
        const currentMembership = apiMembers.find((m: any) => m.user.id === currentUserId) || null;
        setMyMembership(currentMembership);
        setMeetings(apiMeetings);
        setUserContributions(myContributions);
        setMyTotalContributions(myTotal);
        setUserLoan(activeLoanEntry);
      } catch (innerError) {
        // More specific error logging
        const errorMessage = innerError instanceof Error ? innerError.message : String(innerError);
        console.error('Error fetching chama details:', {
          error: errorMessage,
          chamaId,
          url: `/v1/chamas/${chamaId}/`,
          status: (innerError as any)?.status,
          code: (innerError as any)?.code,
        });
        setError('Failed to load chama details. Please try again.');
      }
    } catch (error) {
      console.error('Error in loadChamaDetails:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

   useEffect(() => {
     loadChamaDetails();
   }, [chamaId, currentUserId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChamaDetails();
    setRefreshing(false);
  };

  // Derived data
  const nextContribution = useMemo(() => {
    const sorted = [...userContributions].sort(
      (a, b) => new Date(b.date_paid).getTime() - new Date(a.date_paid).getTime()
    );
    return sorted[0] || null;
  }, [userContributions]);

  const upcomingMeetings = useMemo(() => {
    return meetings.filter((m) => isUpcoming(m.date)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [meetings]);

  const pastMeetings = useMemo(() => {
    return meetings.filter((m) => isPast(m.date)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [meetings]);

  const quickActions = useMemo(() => {
    const actions: { id: string; label: string; icon: string; color: string; onPress: () => void }[] = [];

    if (canMakePayments) {
      actions.push({
        id: 'contribute',
        label: 'Contribute',
        icon: 'cash-plus',
        color: colors.primary[500],
        onPress: () => navigation.navigate('MemberContributions', { chamaId }),
      });
    }

    actions.push({
      id: 'meetings',
      label: 'Meetings',
      icon: 'calendar',
      color: colors.info,
      onPress: () => setActiveTab('meetings'),
    });

    actions.push({
      id: 'announcements',
      label: 'Announcements',
      icon: 'bullhorn',
      color: colors.warning,
      onPress: () => setActiveTab('announcements'),
    });

    if (canRequestLoan) {
      actions.push({
        id: 'loan',
        label: 'My Loan',
        icon: 'bank-transfer',
        color: colors.neutral[600],
        onPress: () => navigation.navigate('MemberLoans', { chamaId }),
      });
    }

    if (canInviteMembers) {
      actions.push({
        id: 'invite',
        label: 'Invite',
        icon: 'account-plus',
        color: colors.primary[500],
        onPress: () => navigation.navigate('InviteMember', { chamaId }),
      });
    }

    return actions;
  }, [canMakePayments, canInviteMembers, canRequestLoan, navigation, chamaId]);

  const handleSettingsPress = () => {
    if (canManageSettings || activeRole === Role.CHAMA_ADMIN || activeRole === Role.ADMIN || activeRole === Role.SUPERADMIN) {
      navigation.navigate('ChamaSettings', { chamaId });
    } else {
      // Member: show profile options
      Alert.alert('Options', 'Choose an option', [
        { text: 'My Contributions', onPress: () => navigation.navigate('MemberContributions', { chamaId }) },
        { text: 'My Loans', onPress: () => navigation.navigate('MemberLoans', { chamaId }) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  if (!chama) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Sections ---

  const renderMeetingsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
        {canCreateMeetings && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateMeeting', { chamaId })}
          >
            <Icon name="plus" size={20} color={colors.primary[600]} />
          </TouchableOpacity>
        )}
      </View>

      {upcomingMeetings.length > 0 ? (
        upcomingMeetings.map((meeting) => (
          <MeetingCard
            key={meeting.id}
            meeting={meeting}
            onPress={() => navigation.navigate('MeetingDetail', { meetingId: meeting.id })}
            style={styles.meetingCard}
          />
        ))
      ) : (
        <EmptyState
          icon="calendar-outline"
          title="No upcoming meetings"
          message="The chama has not scheduled any upcoming meetings yet."
        />
      )}

      {pastMeetings.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>Past Meetings</Text>
          {pastMeetings.slice(0, 3).map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onPress={() => navigation.navigate('MeetingDetail', { meetingId: meeting.id })}
              style={styles.meetingCard}
            />
          ))}
        </>
      )}
    </View>
  );

  const renderAnnouncementsTab = () => {
    // Fetch announcements if available; for now use empty state
    const announcements: any[] = [];
    return (
      <View style={styles.tabContent}>
        {announcements.length > 0 ? (
          announcements.map((ann) => (
            <Card key={ann.id} style={styles.announcementCard}>
              <Text style={styles.announcementTitle}>{ann.title}</Text>
              <Text style={styles.announcementPreview} numberOfLines={3}>
                {ann.content}
              </Text>
              <Text style={styles.announcementDate}>{formatDate(ann.created_at)}</Text>
            </Card>
          ))
        ) : (
          <EmptyState
            icon="megaphone"
            title="No announcements yet"
            message="Check back later for updates from your chama."
          />
        )}
      </View>
    );
  };

  const renderRulesTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.rulesCard}>
        <View style={styles.rulesHeader}>
          <Icon name="file-document-outline" size={24} color={colors.primary[500]} />
          <Text style={styles.rulesTitle}>Contribution Rules</Text>
        </View>
        <Text style={styles.rulesText}>
          Members are expected to contribute on time according to the chama schedule. Late contributions may incur penalties as per chama bylaws.
        </Text>
      </Card>

      <Card style={styles.rulesCard}>
        <View style={styles.rulesHeader}>
          <Icon name="calendar-check-outline" size={24} color={colors.info} />
          <Text style={styles.rulesTitle}>Meeting Expectations</Text>
        </View>
        <Text style={styles.rulesText}>
          Attendance at scheduled meetings is strongly encouraged. Members should review meeting notices and RSVP when required.
        </Text>
      </Card>

      <Card style={styles.rulesCard}>
        <View style={styles.rulesHeader}>
          <Icon name="scale-balance" size={24} color={colors.warning} />
          <Text style={styles.rulesTitle}>Loan Policy</Text>
        </View>
        <Text style={styles.rulesText}>
          Loans are available to eligible members. All loans must be repaid according to the agreed schedule. Early repayment is allowed.
        </Text>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Error State */}
      {error && !chama ? (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing[4] }]}>
          <EmptyState
            icon="alert-circle-outline"
            title="Unable to Load Chama"
            message={error}
          />
          <TouchableOpacity 
            onPress={() => loadChamaDetails()}
            style={{ marginTop: spacing[4], paddingHorizontal: spacing[4], paddingVertical: spacing[2], backgroundColor: colors.primary[500], borderRadius: borderRadius.lg }}
          >
            <Text style={{ color: colors.light.text, fontWeight: '600', textAlign: 'center' }}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing[2], paddingHorizontal: spacing[4], paddingVertical: spacing[2] }}
          >
            <Text style={{ color: colors.primary[500], fontWeight: '600', textAlign: 'center' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : !chama ? (
        /* Loading State */
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.loadingText}>Loading chama details...</Text>
        </View>
      ) : (
        <>
          {/* Minimal Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.neutral[700]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{chama.name}</Text>
            <TouchableOpacity onPress={handleSettingsPress} style={styles.menuButton}>
              <Icon name="dots-vertical" size={24} color={colors.neutral[700]} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
        {/* Hero Card */}
        <Card style={styles.heroCard} variant="elevated">
          <View style={styles.heroHeader}>
            <Avatar name={chama.name} size="xl" />
            <View style={styles.heroInfo}>
              <View style={styles.heroTitleRow}>
                <Text style={styles.heroName}>{chama.name}</Text>
                <Badge label={chama.status === 'active' ? 'Active' : 'Suspended'} variant={chama.status === 'active' ? 'success' : 'warning'} size="sm" />
              </View>
              <View style={styles.heroMeta}>
                <View style={styles.metaItem}>
                  <Icon name="account" size={14} color={colors.neutral[500]} />
                  <Text style={styles.metaText}>{members.length} members</Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="clock-outline" size={14} color={colors.neutral[500]} />
                  <Text style={styles.metaText}>
                    Member since {myMembership?.joined_at ? formatDate(myMembership.joined_at, 'MMM yyyy') : 'N/A'}
                  </Text>
                </View>
              </View>
              {chama.description ? (
                <Text style={styles.heroDescription} numberOfLines={2}>{chama.description}</Text>
              ) : null}
              {activeRole && activeRole !== Role.MEMBER && (
                <Badge label={activeRole.replace('_', ' ')} variant="primary" size="sm" style={styles.roleBadge} />
              )}
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickAction}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                  <Icon name={action.icon} size={22} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            {(['meetings', 'announcements', 'rules'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
                {activeTab === tab && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContentWrapper}>
          {activeTab === 'meetings' && renderMeetingsTab()}
          {activeTab === 'announcements' && renderAnnouncementsTab()}
          {activeTab === 'rules' && renderRulesTab()}
        </View>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.light.surface,
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    flex: 1,
    marginHorizontal: spacing[3],
  },
  menuButton: {
    padding: spacing[2],
    marginRight: -spacing[2],
  },
  heroCard: {
    margin: spacing[4],
    padding: spacing[5],
    backgroundColor: colors.light.background,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroInfo: {
    flex: 1,
    marginLeft: spacing[4],
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  heroName: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    flex: 1,
    marginRight: spacing[2],
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginLeft: spacing[1],
  },
  heroDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: typography.lineHeight.normal,
    marginTop: spacing[1],
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing[2],
  },
  quickActionsContainer: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  quickActionsScroll: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  quickAction: {
    alignItems: 'center',
    width: 72,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  quickActionLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  tabsContainer: {
    marginHorizontal: spacing[4],
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  tab: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    position: 'relative',
  },
  activeTab: {
    // border bottom handled by indicator
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  activeTabText: {
    color: colors.primary[600],
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary[500],
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tabContentWrapper: {
    minHeight: 200,
  },
  tabContent: {
    paddingTop: spacing[4],
  },
  sectionContainer: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[800],
    marginBottom: spacing[3],
    marginHorizontal: spacing[4],
  },
  subsectionTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[700],
    marginTop: spacing[4],
    marginBottom: spacing[3],
    marginHorizontal: spacing[4],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginHorizontal: spacing[4],
  },
  statCard: {
    flex: 1,
  },
  loanCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    padding: spacing[4],
  },
  loanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  loanTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    marginLeft: spacing[2],
  },
  loanAmount: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  loanMeta: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
  },
  emptyLoanCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    padding: spacing[6],
    backgroundColor: colors.neutral[50],
  },
  emptyLoanContent: {
    alignItems: 'center',
  },
  emptyLoanTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
    marginTop: spacing[2],
  },
  emptyLoanText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
    textAlign: 'center',
  },
  nextItemCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    padding: spacing[4],
  },
  nextItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  nextItemContent: {
    flex: 1,
  },
  nextItemLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  nextItemTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  nextItemSub: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  nextItemNone: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[400],
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
    marginHorizontal: spacing[4],
  },
  addButton: {
    padding: spacing[2],
  },
  meetingCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  announcementCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    padding: spacing[4],
  },
  announcementTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  announcementPreview: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    marginBottom: spacing[2],
  },
  announcementDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[400],
  },
  rulesCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    padding: spacing[4],
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    backgroundColor: 'transparent',
  },
  rulesTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[800],
    marginLeft: spacing[3],
  },
  rulesText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[600],
    lineHeight: typography.lineHeight.normal,
  },
});
