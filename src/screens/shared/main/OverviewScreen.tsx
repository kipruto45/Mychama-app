import React, { useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChamaContextSwitcher } from '@/components/ui/ChamaContextSwitcher';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { useAuth } from '@/providers/AuthProvider';
import { useActiveRole, useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { RequireRouteAccess } from '@/rbac';
import { Role, ROLE_DISPLAY_NAMES, isRoleAtLeast } from '@/auth/roles';
import { appService } from '@/services/appService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { DashboardOverview } from '@/types';
import { ReKYCRequiredBanner } from '@/screens/kyc/ReKYCRequiredBanner';

type OverviewNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Dashboard'>;

const initialOverview: DashboardOverview = {
  user: {
    id: '',
    name: '',
    phone: '',
  },
  totals: {
    total_savings: '0',
    chama_balance: '0',
    total_loans: '0',
    total_expenses: '0',
    pending_contributions: 0,
    unread_notifications: 0,
  },
  member_overview: {
    active_chamas: 0,
    pending_contributions: 0,
    loan_eligibility: {},
  },
  chamas: [],
  recent_transactions: [],
  upcoming_meetings: [],
  announcements: [],
  activity_preview: [],
  trends: {
    contributions: [],
    expenses: [],
  },
  loan_stats: {
    active_count: 0,
    requested_count: 0,
  },
  smart_summary: {
    headline: '',
    plain_language: '',
    period_label: '',
  },
  scores: {
    member_reliability: 0,
    loan_eligibility: 0,
    chama_health: 0,
    liquidity_health: 0,
    default_risk: 0,
    attendance_score: 0,
  },
  analytics: {
    monthly_contributions: '0',
    monthly_expenses: '0',
    pending_withdrawals_amount: '0',
    pending_expenses_amount: '0',
    pending_loan_requests_amount: '0',
    contribution_completion_rate: 0,
    attendance_recent_average: null,
    attendance_previous_average: null,
    attendance_trend_delta: 0,
    failed_payouts: 0,
    failed_notifications: 0,
    pending_disbursements: 0,
    unpaid_penalties_total: '0',
    unpaid_penalties_count: 0,
  },
  next_actions: [],
  smart_insights: [],
  admin_action_center: {
    is_visible: false,
    pending_approvals: 0,
    pending_join_requests: 0,
    pending_expenses: 0,
    pending_withdrawals: 0,
    overdue_contributions: 0,
    overdue_loans: 0,
    pending_minutes_approval: 0,
    open_issues: 0,
    failed_payouts: 0,
    items: [],
  },
  compliance: {
    member_reliability_score: 0,
    pending_contributions: 0,
    unpaid_penalties: 0,
    overdue_loans: 0,
    contribution_completion_rate: 0,
  },
  role_workspaces: [],
};

export const OverviewScreen: React.FC = () => {
  const navigation = useNavigation<OverviewNavigationProp>();
  const { user } = useAuth();
  const {
    activeChama,
    activeChamaId,
    availableChamas,
    clearSwitchError,
    isLoading: isLoadingChamaContext,
    isSwitching,
    switchChama,
    switchError,
  } = useActiveChama();
  const activeRole = useActiveRole(activeChamaId || undefined);
  const isAdminWorkspace = !!activeRole && isRoleAtLeast(activeRole, Role.CHAMA_ADMIN);
  const canViewMembers = useCanPerformAction(Permission.CAN_VIEW_MEMBERS, activeChamaId || undefined);
  const canApproveMembers = useCanPerformAction(Permission.CAN_APPROVE_MEMBERS, activeChamaId || undefined);
  const canInviteMembers = useCanPerformAction(Permission.CAN_INVITE_MEMBERS, activeChamaId || undefined);
  const canViewFinance = useCanPerformAction(Permission.CAN_VIEW_FINANCE, activeChamaId || undefined);
  const canApproveLoan = useCanPerformAction(Permission.CAN_APPROVE_LOAN, activeChamaId || undefined);
  const canRequestLoan = useCanPerformAction(Permission.CAN_REQUEST_LOAN, activeChamaId || undefined);
  const canManageLoanRecovery = useCanPerformAction(Permission.CAN_MAKE_ADJUSTMENTS, activeChamaId || undefined);
  const canCreateMeetings = useCanPerformAction(Permission.CAN_CREATE_MEETINGS, activeChamaId || undefined);
  const canViewMeetings = useCanPerformAction(Permission.CAN_VIEW_MEETINGS, activeChamaId || undefined);
  const canRecordMinutes = useCanPerformAction(Permission.CAN_RECORD_MINUTES, activeChamaId || undefined);
  const canApproveMinutes = useCanPerformAction(Permission.CAN_APPROVE_MINUTES, activeChamaId || undefined);
  const canRecordAttendance = useCanPerformAction(Permission.CAN_RECORD_ATTENDANCE, activeChamaId || undefined);
  const canManageNotifications = useCanPerformAction(Permission.CAN_MANAGE_NOTIFICATIONS, activeChamaId || undefined);
  const canSendAnnouncements = useCanPerformAction(Permission.CAN_SEND_ANNOUNCEMENTS, activeChamaId || undefined);
  const canViewReports = useCanPerformAction(
    [Permission.CAN_VIEW_REPORTS, Permission.CAN_VIEW_FINANCIAL_REPORTS],
    activeChamaId || undefined
  );
  const canViewPayments = useCanPerformAction(Permission.CAN_VIEW_PAYMENTS, activeChamaId || undefined);
  const canMakePayments = useCanPerformAction(Permission.CAN_MAKE_PAYMENTS, activeChamaId || undefined);

  const [overview, setOverview] = useState<DashboardOverview>(initialOverview);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);
  const firstName = user?.full_name?.trim().split(' ')[0] || 'member';

  const loadOverview = async () => {
    if (isLoadingChamaContext) {
      return;
    }

    setError(null);
    try {
      const data = await appService.getDashboardOverview(activeChamaId || undefined);
      setOverview(data);
    } catch {
      setError('We could not load your dashboard right now.');
      setOverview(initialOverview);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, [activeChamaId, isLoadingChamaContext]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOverview();
    setRefreshing(false);
  };

  const roleQuickActions = useMemo(() => {
    const items = [
      canViewFinance
        ? {
            key: 'finance',
            title: 'Finance',
            subtitle: 'Open balances, ledger snapshots, and contribution trends',
            icon: 'bank-outline',
            route: 'Finance' as const,
            params: undefined,
          }
        : null,
      canViewPayments
        ? {
            key: 'payments',
            title: 'Payments',
            subtitle: 'Track payment records, receipts, and collection activity',
            icon: 'wallet-outline',
            route: 'PaymentHistory' as const,
            params: undefined,
          }
        : null,
      canMakePayments
        ? {
            key: 'contribute',
            title: 'Make contribution',
            subtitle: 'Pay your next contribution or settle what is due',
            icon: 'cash-plus',
            route: 'MemberContributions' as const,
            params: { chamaId: activeChamaId || undefined },
          }
        : null,
      canViewMembers
        ? {
            key: 'members',
            title: 'Members',
            subtitle: 'Review member roles, status, and participation',
            icon: 'account-group-outline',
            route: 'MemberList' as const,
            params: activeChamaId ? { chamaId: activeChamaId } : undefined,
          }
        : null,
      canInviteMembers
        ? {
            key: 'invite',
            title: 'Invite members',
            subtitle: 'Send invite links or codes for new members',
            icon: 'account-multiple-plus-outline',
            route: 'InviteMember' as const,
            params: activeChamaId ? { chamaId: activeChamaId } : undefined,
          }
        : null,
      canApproveMembers
        ? {
            key: 'join-requests',
            title: 'Join requests',
            subtitle: 'Review incoming requests that need a decision',
            icon: 'account-clock-outline',
            route: 'MembershipRequests' as const,
            params: activeChamaId ? { chamaId: activeChamaId } : undefined,
          }
        : null,
      canViewMeetings
        ? {
            key: 'meetings',
            title: 'Meetings',
            subtitle: 'Open the schedule, upcoming sessions, and meeting history',
            icon: 'calendar-clock-outline',
            route: 'Meetings' as const,
            params: undefined,
          }
        : null,
      canRecordMinutes || canApproveMinutes
        ? {
            key: 'governance',
            title: 'Minutes & resolutions',
            subtitle: 'Keep governance records organized and up to date',
            icon: 'file-document-edit-outline',
            route: 'Governance' as const,
            params: { chamaId: activeChamaId || undefined },
          }
        : null,
      canRecordAttendance
        ? {
            key: 'attendance',
            title: 'Attendance',
            subtitle: 'Record presence and follow up on participation',
            icon: 'account-check-outline',
            route: 'Meetings' as const,
            params: undefined,
          }
        : null,
      canApproveLoan
        ? {
            key: 'loan-queue',
            title: 'Loan approvals',
            subtitle: 'Review loan requests and move approvals forward',
            icon: 'clipboard-check-outline',
            route: 'LoanApprovalQueue' as const,
            params: { chamaId: activeChamaId || undefined },
          }
        : null,
      canManageLoanRecovery
        ? {
            key: 'loan-recovery',
            title: 'Recovery queue',
            subtitle: 'Follow up overdue and defaulted loan exposure',
            icon: 'shield-alert-outline',
            route: 'LoanRecoveryQueue' as const,
            params: { chamaId: activeChamaId || undefined },
          }
        : null,
      canRequestLoan
        ? {
            key: 'pay-loan',
            title: 'Pay loan',
            subtitle: 'Review your active loans and make repayments',
            icon: 'cash-fast',
            route: activeRole === Role.MEMBER ? 'MemberLoans' : 'LoanApplications',
            params: { chamaId: activeChamaId || undefined },
          }
        : null,
      canRequestLoan
        ? {
            key: 'get-loan',
            title: 'Get loan',
            subtitle: 'Check eligibility and submit a new loan request',
            icon: 'bank-plus',
            route: activeRole === Role.MEMBER ? 'MemberLoans' : 'RequestLoan',
            params: { chamaId: activeChamaId || undefined },
          }
        : null,
      canManageNotifications || canSendAnnouncements
        ? {
            key: 'communications',
            title: 'Communication',
            subtitle: 'Send updates and track delivery to members',
            icon: 'bullhorn-outline',
            route: activeChamaId ? ('CommunicationCenter' as const) : ('AnnouncementsFeed' as const),
            params: activeChamaId ? { chamaId: activeChamaId } : { chamaId: activeChamaId || undefined },
          }
        : null,
      canViewReports
        ? {
            key: 'reports',
            title: 'Reports',
            subtitle: 'Open exports, finance statements, and audit views',
            icon: 'file-chart-outline',
            route: 'ReportsHub' as const,
            params: { chamaId: activeChamaId || undefined },
          }
        : null,
      {
        key: 'profile',
        title: 'Profile',
        subtitle: 'Update your details, settings, and security preferences',
        icon: 'account-circle-outline',
        route: 'Profile' as const,
        params: undefined,
      },
    ].filter(Boolean) as Array<{
      key: string;
      title: string;
      subtitle: string;
      icon: string;
      route: keyof MainStackParamList;
      params?: Record<string, unknown>;
    }>;

    const filteredItems = activeRole === Role.MEMBER
      ? items.filter((item) =>
          ['contribute', 'pay-loan', 'meetings', 'get-loan', 'payments', 'profile'].includes(item.key)
        )
      : items;

    return filteredItems.slice(0, 6);
  }, [
    activeChamaId,
    activeRole,
    canApproveLoan,
    canApproveMembers,
    canInviteMembers,
    canMakePayments,
    canManageLoanRecovery,
    canManageNotifications,
    canRecordAttendance,
    canRecordMinutes,
    canRequestLoan,
    canSendAnnouncements,
    canViewFinance,
    canViewMeetings,
    canViewMembers,
    canViewPayments,
    canViewReports,
    canApproveMinutes,
  ]);

  const adminQuickActions = [
    canApproveMembers
      ? {
          key: 'approvals',
          title: 'Approvals',
          subtitle: 'Review joins, loans, disputes, and exceptions',
          icon: 'clipboard-check-multiple-outline',
          route: 'ApprovalsCenter' as const,
          params: { chamaId: activeChamaId || undefined },
        }
      : null,
    canViewMembers
      ? {
          key: 'members',
          title: 'Members',
          subtitle: 'Manage roles, suspensions, and member access',
          icon: 'account-group-outline',
          route: 'MemberList' as const,
          params: activeChamaId ? { chamaId: activeChamaId } : undefined,
        }
      : null,
    canApproveMembers
      ? {
          key: 'join-requests',
          title: 'Join requests',
          subtitle: 'Approve or reject pending applications',
          icon: 'account-clock-outline',
          route: 'MembershipRequests' as const,
          params: activeChamaId ? { chamaId: activeChamaId } : undefined,
        }
      : null,
    canInviteMembers
      ? {
          key: 'invites',
          title: 'Invites',
          subtitle: 'Send invites, links, and access codes',
          icon: 'account-multiple-plus-outline',
          route: 'InviteMember' as const,
          params: activeChamaId ? { chamaId: activeChamaId } : undefined,
        }
      : null,
    canViewFinance
      ? {
          key: 'contributions',
          title: 'Contributions',
          subtitle: 'Track compliance and overdue payments',
          icon: 'wallet-outline',
          route: 'ContributionCompliance' as const,
          params: { chamaId: activeChamaId || undefined, filter: isAdminWorkspace ? ('missed' as const) : ('all' as const) },
        }
      : null,
    canApproveLoan
      ? {
          key: 'loan-approvals',
          title: 'Loan approvals',
          subtitle: 'Move requests through review, approval, and funding',
          icon: 'clipboard-check-outline',
          route: 'LoanApprovalQueue' as const,
          params: { chamaId: activeChamaId || undefined },
        }
      : null,
    canManageLoanRecovery
      ? {
          key: 'loan-recovery',
          title: 'Recovery queue',
          subtitle: 'Track overdue, defaulted, and recovery-stage loans',
          icon: 'shield-alert-outline',
          route: 'LoanRecoveryQueue' as const,
          params: { chamaId: activeChamaId || undefined },
        }
      : null,
    canApproveLoan
      ? {
          key: 'loan-restructures',
          title: 'Restructures',
          subtitle: 'Review requested term changes before they apply',
          icon: 'source-branch-check',
          route: 'LoanRestructureQueue' as const,
          params: { chamaId: activeChamaId || undefined },
        }
      : null,
    canViewFinance && !canApproveLoan
      ? {
          key: 'loans',
          title: 'Loans',
          subtitle: 'Review loan requests and risky accounts',
          icon: 'hand-coin-outline',
          route: 'LoanApplications' as const,
          params: { chamaId: activeChamaId || undefined },
        }
      : null,
    canViewFinance
      ? {
          key: 'expenses',
          title: 'Expenses',
          subtitle: 'Review receipts and expense approvals',
          icon: 'receipt-text-outline',
          route: 'Expenses' as const,
          params: { chamaId: activeChamaId || undefined, filter: isAdminWorkspace ? ('pending' as const) : ('all' as const) },
        }
      : null,
    canViewFinance
      ? {
          key: 'withdrawals',
          title: 'Withdrawals',
          subtitle: 'Approve withdrawals and track payout status',
          icon: 'cash-fast',
          route: 'Withdrawals' as const,
          params: { chamaId: activeChamaId || undefined, filter: isAdminWorkspace ? ('pending' as const) : ('all' as const) },
        }
      : null,
    canManageNotifications
      ? {
          key: 'communications',
          title: 'Comms',
          subtitle: 'Send updates and review delivery logs',
          icon: 'bullhorn-outline',
          route: 'CommunicationCenter' as const,
          params: activeChamaId ? { chamaId: activeChamaId } : undefined,
        }
      : null,
    canCreateMeetings
      ? {
          key: 'governance',
          title: 'Governance',
          subtitle: 'Meetings, motions, and resolutions',
          icon: 'gavel',
          route: 'Governance' as const,
          params: { chamaId: activeChamaId || undefined },
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    title: string;
    subtitle: string;
    icon: string;
    route: keyof MainStackParamList;
    params?: Record<string, unknown>;
  }>;

  if (loading) {
    return (
      <RequireRouteAccess route="Dashboard" chamaId={activeChamaId || undefined}>
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.stateText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
      </RequireRouteAccess>
    );
  }

  if (error) {
    return (
      <RequireRouteAccess route="Dashboard" chamaId={activeChamaId || undefined}>
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <EmptyState
          icon={<Icon name="chart-box-outline" size={56} color={colors.neutral[400]} />}
          title="Dashboard unavailable"
          description={error}
          action={
            <TouchableOpacity style={styles.retryButton} onPress={() => void loadOverview()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
      </RequireRouteAccess>
    );
  }

  return (
    <RequireRouteAccess route="Dashboard" chamaId={activeChamaId || undefined}>
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{`${greeting}, ${firstName}`}</Text>
          <Text style={styles.pageSubtitle}>
            {(activeChama?.name ? `${activeChama.name} · ` : '') + ROLE_DISPLAY_NAMES[activeRole || Role.MEMBER]}
          </Text>
        </View>

        <ReKYCRequiredBanner />

        <ChamaContextSwitcher
          chamas={availableChamas}
          activeChamaId={activeChamaId}
          isSwitching={isSwitching}
          helperText={switchError}
          onSelectChama={(chamaId) => {
            clearSwitchError();
            void switchChama(chamaId).then(() => {
              void loadOverview();
            }).catch(() => undefined);
          }}
        />

        {roleQuickActions.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Quick actions</Text>
            </View>
            <View style={styles.list}>
              {roleQuickActions.map((item, index) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.listRow, index > 0 && styles.listRowBorder]}
                  activeOpacity={0.82}
                  onPress={() => (navigation as any).navigate(item.route, item.params || undefined)}
                >
                  <View style={styles.listIcon}>
                    <Icon name={item.icon as never} size={18} color={colors.primary[600]} />
                  </View>
                  <View style={styles.listCopy}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.listSubtitle} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={colors.neutral[400]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {(isAdminWorkspace || overview.admin_action_center.is_visible) && adminQuickActions.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Admin actions</Text>
            </View>
            <View style={styles.list}>
              {adminQuickActions.map((item, index) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.listRow, index > 0 && styles.listRowBorder]}
                  activeOpacity={0.82}
                  onPress={() => (navigation as any).navigate(item.route, item.params || undefined)}
                >
                  <View style={styles.listIcon}>
                    <Icon name={item.icon as never} size={18} color={colors.primary[600]} />
                  </View>
                  <View style={styles.listCopy}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.listSubtitle} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={colors.neutral[400]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {overview.next_actions.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Next actions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('More')}>
                <Text style={styles.linkText}>Open More</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.list}>
              {overview.next_actions.slice(0, 3).map((action, index) => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.listRow, index > 0 && styles.listRowBorder]}
                  activeOpacity={0.82}
                  onPress={() => {
                    if (action.action?.route) {
                      (navigation as any).navigate(action.action.route, action.action.params || {});
                    }
                  }}
                >
                  <View style={styles.listCopy}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {action.title}
                    </Text>
                    <Text style={styles.listSubtitle} numberOfLines={2}>
                      {action.description}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={colors.neutral[400]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
    </RequireRouteAccess>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  pageHeader: {
    paddingHorizontal: spacing[1],
    paddingTop: spacing[2],
  },
  pageTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
  },
  pageSubtitle: {
    marginTop: spacing[1],
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  section: {
    gap: spacing[2],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  list: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.light.surface,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  listRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[200],
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  listCopy: {
    flex: 1,
    minWidth: 0,
  },
  listTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  listSubtitle: {
    marginTop: spacing[1],
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 18,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: spacing[3],
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
  },
  retryButton: {
    marginTop: spacing[3],
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  retryButtonText: {
    color: colors.light.background,
    fontFamily: typography.fontFamily.semibold,
  },
  shellSummaryRow: {
    marginTop: spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  shellSummaryCopy: {
    flex: 1,
  },
  shellSummaryTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  shellSummaryText: {
    marginTop: spacing[2],
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 20,
  },
  shellBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  shellBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
  },
  heroCard: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[2],
  },
  heroTitle: {
    color: colors.light.background,
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[2],
  },
  heroText: {
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  gridItem: {
    width: '48%',
    minWidth: 0,
  },
  gridItemFull: {
    width: '100%',
  },
  statCard: {
    borderRadius: borderRadius.lg,
    minHeight: 132,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  statValue: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
  },
  statLabel: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    lineHeight: 18,
    flexShrink: 1,
  },
  summaryCard: {
    borderRadius: borderRadius.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
  },
  sectionMeta: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  summaryHeadline: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[2],
  },
  summaryText: {
    color: colors.neutral[600],
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
  },
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  scoreChip: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  scoreLabel: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  scoreValue: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
  },
  pulseCard: {
    borderRadius: borderRadius.xl,
  },
  roleDashboardCard: {
    borderRadius: borderRadius.xl,
    borderTopWidth: 4,
    backgroundColor: colors.neutral[900],
  },
  workspaceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  workspaceHeaderCopy: {
    flex: 1,
  },
  workspaceEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[1],
  },
  workspaceTitle: {
    color: colors.light.background,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
  },
  workspaceDescription: {
    color: 'rgba(255,255,255,0.74)',
    fontFamily: typography.fontFamily.regular,
    lineHeight: 21,
  },
  workspaceBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  roleDashboardMetric: {
    width: '48%',
    minWidth: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: spacing[3],
  },
  workspaceMetricValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
  },
  workspaceMetricLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    lineHeight: 18,
    flexShrink: 1,
  },
  workspaceAlerts: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  roleDashboardAlertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: spacing[3],
  },
  workspaceAlertDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  workspaceAlertCopy: {
    flex: 1,
  },
  workspaceAlertTitle: {
    color: colors.light.background,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[1],
  },
  workspaceAlertMessage: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: typography.fontFamily.regular,
    lineHeight: 19,
  },
  workspaceActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  roleDashboardActionItem: {
    width: '48%',
    minWidth: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.light.background,
    padding: spacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.neutral[200],
  },
  workspaceActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  workspaceActionTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
    flexShrink: 1,
  },
  workspaceActionSubtitle: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 18,
    flexShrink: 1,
  },
  adminCard: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.neutral[900],
  },
  adminSubtitle: {
    marginTop: spacing[1],
    color: 'rgba(255,255,255,0.72)',
    fontFamily: typography.fontFamily.regular,
    lineHeight: 20,
    maxWidth: 280,
  },
  adminSectionTitle: {
    color: colors.light.background,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
  },
  adminMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  adminMetric: {
    width: '48%',
    minWidth: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: spacing[3],
  },
  adminMetricValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
  },
  adminMetricLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    lineHeight: 18,
    flexShrink: 1,
  },
  adminLoanQueueRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  adminLoanQueueCard: {
    width: '48%',
    minWidth: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: spacing[3],
  },
  adminLoanQueueIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  adminLoanQueueTitle: {
    color: colors.light.background,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
    flexShrink: 1,
  },
  adminLoanQueueSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 18,
    flexShrink: 1,
  },
  adminActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  adminActionItem: {
    width: '48%',
    minWidth: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.light.background,
    padding: spacing[3],
  },
  adminActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  adminActionTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
    flexShrink: 1,
  },
  adminActionSubtitle: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 18,
    flexShrink: 1,
  },
  pulseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  pulseItem: {
    width: '48%',
    minWidth: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[50],
    padding: spacing[3],
    minHeight: 112,
  },
  pulseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  pulseValue: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
  },
  pulseLabel: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginTop: spacing[1],
    lineHeight: 18,
    flexShrink: 1,
  },
  actionCard: {
    borderRadius: borderRadius.xl,
  },
  linkText: {
    color: colors.primary[600],
    fontFamily: typography.fontFamily.semibold,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[200],
  },
  actionTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[1],
  },
  actionDescription: {
    color: colors.neutral[500],
    maxWidth: 260,
    fontFamily: typography.fontFamily.regular,
  },
});

export default OverviewScreen;
