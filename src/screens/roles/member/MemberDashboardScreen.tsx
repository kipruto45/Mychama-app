import React, { useEffect, useState, useMemo } from 'react';
import {
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from '@/components/ui/Card';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { useActiveChama } from '@/hooks';
import { useAuth } from '@/providers/AuthProvider';
import { appService } from '@/services/appService';
import type { MainStackParamList } from '@/navigation/types';
import { navigateToWorkspaceTab } from '@/navigation/workspaceTabNavigation';
import { borderRadius, colors, spacing, typography } from '@/theme';
import type { DashboardOverview } from '@/types';
import { formatCurrency } from '@/utils/format';

// Helper function to get Greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Helper function to format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Helper function to calculate days until date
const daysUntil = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

type DashboardNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Dashboard'
>;

export const MemberDashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    activeChama,
    activeChamaId,
    availableChamas,
    clearSwitchError,
    isSwitching,
    switchChama,
    switchError,
  } = useActiveChama();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(
    null
  );
  const [greeting] = useState(getGreeting());

  const firstName = useMemo(
    () => user?.full_name?.split(' ')[0]?.trim() || 'Member',
    [user?.full_name]
  );

  // Minimal quick actions (member dashboard)
  const quickActions = useMemo(() => {
    return [
      {
        key: 'invest',
        title: 'Invest',
        icon: 'trending-up',
        color: colors.accent[500],
        onPress: () =>
          navigation.navigate('InvestmentProducts', {
            chamaId: activeChamaId || undefined,
          }),
      },
      {
        key: 'payments',
        title: 'Payments',
        icon: 'credit-card-outline',
        color: colors.success,
        onPress: () => navigation.navigate('MakeContribution'),
      },
      {
        key: 'wallet',
        title: 'Wallet',
        icon: 'wallet-outline',
        color: colors.primary[600],
        onPress: () => navigateToWorkspaceTab(navigation as any, 'Payments'),
      },
      {
        key: 'loan',
        title: 'Get Loan',
        icon: 'hand-coin-outline',
        color: colors.info,
        onPress: () =>
          navigation.navigate('RequestLoan', {
            chamaId: activeChamaId || undefined,
          }),
      },
    ];
  }, [activeChamaId, navigation]);

  // Load dashboard data
  const loadDashboard = async () => {
    setIsLoading(true);
    setRefreshing(true);

    try {
      const data = await appService.getDashboardOverview(
        activeChamaId || undefined
      );
      setDashboardData(data);
    } catch (error) {
      console.log('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [activeChamaId]);

  const onRefresh = async () => {
    await loadDashboard();
  };

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['left', 'right', 'top']}>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: insets.top }]}
      edges={['left', 'right', 'top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
        }
      >
        {/* Enhanced Top Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View>
            <Text style={styles.greeting}>{greeting}, {firstName}</Text>
            <Text style={styles.chamaName}>{activeChama?.name || 'MyChama'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.85}
            >
              {dashboardData.totals.unread_notifications > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.warning }]}>
                  <Text style={styles.badgeText}>{dashboardData.totals.unread_notifications}</Text>
                </View>
              )}
              <Icon name="bell-outline" size={24} color={colors.neutral[900]} />
            </TouchableOpacity>
          </View>
        </View>

        <ChamaContextSwitcher
          chamas={availableChamas}
          activeChamaId={activeChamaId}
          isSwitching={isSwitching}
          helperText={switchError}
          onSelectChama={(chamaId) => {
            clearSwitchError();
            void switchChama(chamaId).then(() => loadDashboard()).catch((error) => {
              console.log('Error switching chama:', error?.message || error);
            });
          }}
        />

        {/* Welcome Card */}
        <Card style={styles.welcomeCard}>
          <View style={styles.welcomeAccent} />
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeTopRow}>
              <View style={styles.welcomeBadge}>
                <Text style={styles.welcomeBadgeText}>WELCOME</Text>
              </View>
              <View style={styles.welcomePill}>
                <Text style={styles.welcomePillText}>{activeChama?.name || 'MyChama'}</Text>
              </View>
            </View>
            <Text style={styles.welcomeTitle}>Welcome back, {firstName}</Text>
            <Text style={styles.welcomeSubtitle}>
              Manage your wallet, payments, investments, and loans in one calm workspace.
            </Text>

            <View style={styles.welcomeStatsRow}>
              <View style={styles.welcomeStat}>
                <Text style={styles.welcomeStatLabel}>Savings</Text>
                <Text style={styles.welcomeStatValue}>
                  KES {formatCurrency(dashboardData.totals.total_savings || '0')}
                </Text>
              </View>
              <View style={styles.welcomeDivider} />
              <View style={styles.welcomeStat}>
                <Text style={styles.welcomeStatLabel}>Pending</Text>
                <Text style={styles.welcomeStatValue}>
                  {dashboardData.totals.pending_contributions || 0}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Financial Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Total Balance</Text>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusText, { color: colors.success }]}>Healthy</Text>
              </View>
            </View>
            <Text style={styles.balanceAmount}>KES {formatCurrency(dashboardData.totals.total_savings || '0')}</Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Contribution Rate</Text>
              <Text style={styles.progressValue}>{Math.round(dashboardData.analytics.contribution_completion_rate * 100)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, { width: `${Math.round(dashboardData.analytics.contribution_completion_rate * 100)}%` }]} />
            </View>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Active Loans</Text>
            </View>
            <Text style={[styles.balanceAmount, { color: colors.info }]}>
              {dashboardData.loan_stats.active_count || 0} loans
            </Text>
            <View style={styles.loanSummary}>
              <Text style={styles.loanText}>Outstanding Balance:</Text>
              <Text style={styles.loanValue}>KES {formatCurrency(dashboardData.totals.total_loans || '0')}</Text>
            </View>
            <View style={styles.loanProgress}>
              <View style={styles.loanProgressTrack}>
                <View style={[styles.loanProgressFill, { width: `${Math.min(100, (Number(dashboardData.totals.total_loans) / (Number(dashboardData.totals.total_savings) || 1)) * 100)}%` }]} />
              </View>
            </View>
          </Card>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={styles.quickActionButton}
                onPress={action.onPress}
                activeOpacity={0.85}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}14` }]}>
                  <Icon name={action.icon} size={20} color={action.color} />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* My Chama Status Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Chama Status</Text>
          </View>
          <Card style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Chama</Text>
                <Text style={styles.statusValue}>{activeChama?.name || 'N/A'}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: colors.success[50], borderColor: colors.success[200] }]}>
                <Text style={[styles.statusPillText, { color: colors.success[600] }]}>Active</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Member Score</Text>
                <Text style={styles.statusValue}>{Math.round(dashboardData.scores.member_reliability)}%</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: dashboardData.scores.member_reliability >= 80 ? colors.success[50] : colors.warning[50], borderColor: dashboardData.scores.member_reliability >= 80 ? colors.success[200] : colors.warning[200] }]}>
                <Text style={[styles.statusPillText, { color: dashboardData.scores.member_reliability >= 80 ? colors.success[600] : colors.warning[600] }]}>In Good Standing</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Loan Eligibility</Text>
                <Text style={styles.statusValue}>{Math.round(dashboardData.scores.loan_eligibility)}%</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: colors.success[50], borderColor: colors.success[200] }]}>
                <Text style={[styles.statusPillText, { color: colors.success[600] }]}>Eligible</Text>
              </View>
            </View>
            {dashboardData.upcoming_meetings && dashboardData.upcoming_meetings.length > 0 && (
              <View style={styles.statusRow}>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Next Meeting</Text>
                  <Text style={styles.statusValue}>{new Date(dashboardData.upcoming_meetings[0].date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: colors.warning[50], borderColor: colors.warning[200] }]}>
                  <Text style={[styles.statusPillText, { color: colors.warning[600] }]}>{Math.max(0, daysUntil(dashboardData.upcoming_meetings[0].date))} days away</Text>
                </View>
              </View>
            )}
          </Card>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <Card style={styles.activityCard}>
            {dashboardData.recent_transactions && dashboardData.recent_transactions.length > 0 ? (
              dashboardData.recent_transactions.slice(0, 3).map((transaction) => (
                <View key={transaction.id} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: transaction.kind === 'credit' ? colors.success[100] : colors.primary[100] }]}>
                    <Text style={[styles.activityIconText, { color: transaction.kind === 'credit' ? colors.success[600] : colors.primary[600] }]}>{transaction.kind === 'credit' ? '+' : '-'}</Text>
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityTitle}>{transaction.description}</Text>
                    <Text style={styles.activitySubtitle}>{transaction.chama_name}</Text>
                    <Text style={styles.activityTime}>{formatTimeAgo(transaction.created_at)}</Text>
                  </View>
                  <Text style={[styles.activityAmount, { color: transaction.kind === 'credit' ? colors.success : colors.primary[500] }]}>KES {formatCurrency(transaction.amount)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.activityItem}>
                <Text style={styles.activitySubtitle}>No recent transactions</Text>
              </View>
            )}
          </Card>
        </View>

        {/* Announcements Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chama Announcements</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AnnouncementsFeed')}>
              <Text style={styles.seeAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          <Card style={styles.announcementCard}>
            {dashboardData.announcements && dashboardData.announcements.length > 0 ? (
              dashboardData.announcements.slice(0, 1).map((announcement) => (
                <View key={announcement.id} style={styles.announcementItem}>
                  <View style={[styles.announcementDot, { backgroundColor: colors.accent[500] }]} />
                  <View style={styles.announcementContent}>
                    <Text style={styles.announcementTitle}>{announcement.title}</Text>
                    <Text style={styles.announcementSubtitle}>{announcement.message}</Text>
                    <Text style={styles.announcementTime}>{formatTimeAgo(announcement.created_at)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.announcementItem}>
                <Text style={styles.announcementSubtitle}>No announcements</Text>
              </View>
            )}
          </Card>
        </View>

        {/* Meetings Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Meeting</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Meetings')}>
              <Text style={styles.seeAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          <Card style={styles.meetingCard}>
            {dashboardData.upcoming_meetings && dashboardData.upcoming_meetings.length > 0 ? (
              <View style={styles.meetingInfo}>
                <Text style={styles.meetingTitle}>{dashboardData.upcoming_meetings[0].title}</Text>
                <Text style={styles.meetingDate}>{new Date(dashboardData.upcoming_meetings[0].date).toLocaleDateString('en-KE', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                <Text style={styles.meetingTime}>{dashboardData.upcoming_meetings[0].location_type}</Text>
              </View>
            ) : (
              <View style={styles.meetingInfo}>
                <Text style={styles.meetingTitle}>No upcoming meetings</Text>
              </View>
            )}
            <View style={styles.meetingActions}>
              <TouchableOpacity style={[styles.meetingButton, { backgroundColor: colors.primary[50] }]} onPress={() => navigation.navigate('Meetings')}>
                <Text style={[styles.meetingButtonText, { color: colors.primary[600] }]}>View Details</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Financial Insights Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Financial Insights</Text>
          </View>
          <Card style={styles.insightsCard}>
            <View style={styles.insightRow}>
              <View style={[styles.insightDot, { backgroundColor: colors.success }]} />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Contribution Completion</Text>
                <Text style={styles.insightSubtitle}>{Math.round(dashboardData.analytics.contribution_completion_rate * 100)}% completion rate</Text>
              </View>
              <Text style={[styles.insightValue, { color: colors.success }]}>✓</Text>
            </View>
            <View style={styles.insightRow}>
              <View style={[styles.insightDot, { backgroundColor: colors.info }]} />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Loan Eligibility</Text>
                <Text style={styles.insightSubtitle}>{Math.round(dashboardData.scores.loan_eligibility)}% eligible</Text>
              </View>
              <Text style={[styles.insightValue, { color: colors.info }]}>{Math.round(dashboardData.scores.loan_eligibility)}%</Text>
            </View>
            <View style={styles.insightRow}>
              <View style={[styles.insightDot, { backgroundColor: colors.warning }]} />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Pending Contributions</Text>
                <Text style={styles.insightSubtitle}>{dashboardData.totals.pending_contributions} pending</Text>
              </View>
              <Text style={[styles.insightValue, { color: colors.warning }]}>{dashboardData.totals.pending_contributions}</Text>
            </View>
            <View style={styles.insightRow}>
              <View style={[styles.insightDot, { backgroundColor: colors.primary[600] }]} />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Chama Health</Text>
                <Text style={styles.insightSubtitle}>{Math.round(dashboardData.scores.chama_health)}% score</Text>
              </View>
              <Text style={[styles.insightValue, { color: colors.primary[600] }]}>{Math.round(dashboardData.scores.chama_health)}%</Text>
            </View>
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          <Card style={styles.supportCard}>
            <TouchableOpacity
              style={styles.supportItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('HelpSupport')}
            >
              <Text style={styles.supportText}>Need help?</Text>
              <Text style={styles.supportChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.supportItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('SupportIssues')}
            >
              <Text style={styles.supportText}>Report an issue</Text>
              <Text style={styles.supportChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.supportItem}
              activeOpacity={0.85}
              onPress={() => {
                // Navigate to help or open FAQ section
                navigation.navigate('HelpSupport');
              }}
            >
              <Text style={styles.supportText}>FAQs</Text>
              <Text style={styles.supportChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.supportItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AIChat')}
            >
              <Text style={styles.supportText}>AI Assistant</Text>
              <Text style={styles.supportChevron}>›</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  greeting: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    letterSpacing: -0.5,
  },
  chamaName: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[600],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing[1],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeCard: {
    marginTop: spacing[3],
    marginBottom: spacing[4],
    backgroundColor: colors.primary[700],
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  welcomeAccent: {
    position: 'absolute',
    right: -80,
    top: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  welcomeContent: {
    padding: spacing[4],
  },
  welcomeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  welcomeBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  welcomeBadgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 1.2,
  },
  welcomePill: {
    maxWidth: '55%',
    paddingHorizontal: spacing[2],
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  welcomePillText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: 'rgba(255,255,255,0.92)',
  },
  welcomeTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.light.background,
    letterSpacing: -0.2,
  },
  welcomeSubtitle: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 20,
  },
  welcomeStatsRow: {
    marginTop: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: spacing[2],
  },
  welcomeStat: {
    flex: 1,
    paddingHorizontal: spacing[3],
  },
  welcomeStatLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: 'rgba(255,255,255,0.80)',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  welcomeStatValue: {
    marginTop: 4,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.light.background,
  },
  welcomeDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  notificationButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: -4,
    top: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.light.background,
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
  },
  iconButton: {
    padding: spacing[1],
    borderRadius: spacing[1],
  },
  iconText: {
    fontSize: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  summaryCard: {
    flex: 1,
    padding: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  cardLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  statusBadge: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statusText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  progressLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  progressValue: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
	  loanProgressTrack: {
	    height: 8,
	    backgroundColor: colors.neutral[200],
	    borderRadius: 4,
	    overflow: 'hidden',
	    marginTop: spacing[2],
	  },
	  loanProgress: {
	    marginTop: spacing[1],
	  },
	  loanProgressFill: {
	    height: '100%',
	    backgroundColor: colors.info,
	    borderRadius: 4,
	  },
  loanSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  loanText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  loanValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.info,
    marginLeft: spacing[1],
  },
  sectionContainer: {
    marginBottom: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
	  sectionTitle: {
	    fontSize: typography.fontSize.lg,
	    fontFamily: typography.fontFamily.bold,
	    color: colors.neutral[900],
	  },
	  pendingCard: {
	    paddingVertical: spacing[3],
	  },
	  pendingItem: {
	    flexDirection: 'row',
	    alignItems: 'center',
	    paddingVertical: spacing[2],
	  },
	  pendingDot: {
	    width: 8,
	    height: 8,
	    borderRadius: 4,
	    marginRight: spacing[2],
	  },
	  pendingInfo: {
	    flex: 1,
	  },
	  pendingTitle: {
	    fontSize: typography.fontSize.base,
	    fontFamily: typography.fontFamily.semibold,
	    color: colors.neutral[900],
	  },
	  pendingSubtitle: {
	    fontSize: typography.fontSize.sm,
	    fontFamily: typography.fontFamily.regular,
	    color: colors.neutral[500],
	    marginTop: 1,
	  },
	  pendingButton: {
	    paddingHorizontal: spacing[3],
	    paddingVertical: spacing[1],
	    borderRadius: 20,
	  },
	  pendingButtonText: {
	    fontSize: typography.fontSize.sm,
	    fontFamily: typography.fontFamily.medium,
	  },
	  seeAllText: {
	    fontSize: typography.fontSize.sm,
	    fontFamily: typography.fontFamily.medium,
	    color: colors.primary[600],
	  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  quickActionButton: {
    width: (Dimensions.get('window').width - spacing[4] * 2 - spacing[3]) / 2,
    backgroundColor: colors.light.card,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  quickActionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  statusCard: {
    paddingVertical: spacing[3],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
  },
  statusValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
  },
  activityCard: {
    paddingVertical: spacing[3],
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  activityIconText: {
    fontSize: 18,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  activitySubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: 1,
  },
  activityTime: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[400],
    marginTop: 2,
  },
  activityAmount: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
  },
  announcementCard: {
    paddingVertical: spacing[3],
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  announcementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing[2],
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  announcementSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: 1,
  },
  announcementTime: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[400],
    marginTop: 2,
  },
  meetingCard: {
    paddingVertical: spacing[3],
  },
  meetingInfo: {
    marginBottom: spacing[2],
  },
  meetingTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  meetingDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[500],
    marginTop: 1,
  },
  meetingTime: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[400],
    marginTop: 1,
  },
  meetingActions: {
    alignItems: 'center',
  },
  meetingButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 20,
  },
  meetingButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  insightsCard: {
    paddingVertical: spacing[3],
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
  },
  insightSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral[500],
    marginTop: 1,
  },
  insightValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
  },
  supportCard: {
    paddingVertical: spacing[3],
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  supportText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.neutral[900],
    flex: 1,
  },
  supportChevron: {
    fontSize: 20,
    color: colors.neutral[400],
  },
});

export default MemberDashboardScreen;
