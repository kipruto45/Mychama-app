import React, { useMemo } from 'react';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useActiveRole, useCanPerformAction } from '@/auth/guards';
import { Permission } from '@/auth/permissions';
import { AppScreenKey, canRoleAccessScreen, getScreenExperience, SCREEN_RBAC_MATRIX } from '@/rbac';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { useAuth } from '@/providers/AuthProvider';
import { Role, ROLE_DESCRIPTIONS, ROLE_DISPLAY_NAMES, isRoleAtLeast } from '@/auth/roles';
import { borderRadius, colors, spacing, typography } from '@/theme';

type MoreScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'More'>;

interface MoreItem {
  key: string;
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  screenKey?: AppScreenKey | string;
}

interface MoreSection {
  title: string;
  items: MoreItem[];
}

export const MoreScreen: React.FC = () => {
  const navigation = useNavigation<MoreScreenNavigationProp>();
  const { user, logout } = useAuth();
  const { activeChama, activeChamaId } = useActiveChama();
  const activeRole = useActiveRole(activeChamaId || undefined);
  const isAdminWorkspace = !!activeRole && isRoleAtLeast(activeRole, Role.CHAMA_ADMIN);
  const canOpenChamaLifecycleActions = !!activeRole && activeRole !== Role.MEMBER;

  const canCreateChama = useCanPerformAction(Permission.CAN_CREATE_CHAMA, activeChamaId || undefined);
  const canViewNotifications = useCanPerformAction(Permission.CAN_VIEW_NOTIFICATIONS, activeChamaId || undefined);
  const canViewChama = useCanPerformAction(Permission.CAN_VIEW_CHAMA, activeChamaId || undefined);
  const canViewMembers = useCanPerformAction(Permission.CAN_VIEW_MEMBERS, activeChamaId || undefined);
  const canApproveMembers = useCanPerformAction(Permission.CAN_APPROVE_MEMBERS, activeChamaId || undefined);
  const canAssignRoles = useCanPerformAction(Permission.CAN_ASSIGN_ROLES, activeChamaId || undefined);
  const canViewFinance = useCanPerformAction(Permission.CAN_VIEW_FINANCE, activeChamaId || undefined);
  const canManageSettings = useCanPerformAction(Permission.CAN_MANAGE_CHAMA_SETTINGS, activeChamaId || undefined);
   const canManageNotifications = useCanPerformAction(Permission.CAN_MANAGE_NOTIFICATIONS, activeChamaId || undefined);
   const canInviteMembers = useCanPerformAction(Permission.CAN_INVITE_MEMBERS, activeChamaId || undefined);
   const canCreateMeetings = useCanPerformAction(Permission.CAN_CREATE_MEETINGS, activeChamaId || undefined);
   const canMakePayments = useCanPerformAction(Permission.CAN_MAKE_PAYMENTS, activeChamaId || undefined);
   const canViewReports = useCanPerformAction(
     [Permission.CAN_VIEW_FINANCIAL_REPORTS, Permission.CAN_VIEW_REPORTS],
     activeChamaId || undefined
   );
   const canAccessAdminTools = useCanPerformAction(Permission.CAN_ACCESS_ADMIN_TOOLS, activeChamaId || undefined);
   const canRequestLoan = useCanPerformAction(Permission.CAN_REQUEST_LOAN, activeChamaId || undefined);
   const canApproveLoan = useCanPerformAction(Permission.CAN_APPROVE_LOAN, activeChamaId || undefined);
   const canManageLoanRecovery = useCanPerformAction(Permission.CAN_MAKE_ADJUSTMENTS, activeChamaId || undefined);
   const canIssuePenalty = useCanPerformAction(Permission.CAN_ISSUE_PENALTY, activeChamaId || undefined);

  const navigateTo = (route: keyof MainStackParamList, params?: Record<string, unknown>) => {
    if (route === 'MemberContributions') {
      (navigation as any).navigate(route, {
        chamaId: activeChamaId || undefined,
        entryPoint: 'more',
        ...(params || {}),
      });
      return;
    }

    (navigation as any).navigate(route, params || undefined);
  };

  const applyRoleExperience = (items: MoreItem[]): MoreItem[] =>
    items
      .map((item) => {
        if (!item.screenKey || !activeRole) {
          return item;
        }

        if (!(item.screenKey in SCREEN_RBAC_MATRIX)) {
          return item;
        }

        const screenKey = item.screenKey as AppScreenKey;

        if (!canRoleAccessScreen(screenKey, activeRole)) {
          return null;
        }

        const experience = getScreenExperience(screenKey, activeRole);

        return {
          ...item,
          subtitle: experience.does[0] || experience.sees[0] || item.subtitle,
        };
      })
      .filter((item): item is MoreItem => Boolean(item));

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const accountItems: MoreItem[] = [
        {
          key: 'profile',
          icon: 'account-circle-outline',
          title: 'Profile & identity',
          subtitle: 'Your account, role, verification status, and personal details',
          onPress: () => navigateTo('Profile'),
          screenKey: 'profile',
        },
        {
          key: 'settings',
          icon: 'tune-variant',
          title: 'Settings',
          subtitle: 'Preferences, app settings, and environment checks',
          onPress: () => navigateTo('Settings'),
          screenKey: 'settings',
        },
    {
      key: 'documents',
      icon: 'file-document-multiple-outline',
      title: 'Document Center',
      subtitle: 'Receipts, KYC files, and generated records',
      onPress: () => navigateTo('DocumentCenter'),
    },
    ...(!isAdminWorkspace
      ? [
          {
            key: 'kyc',
            icon: 'badge-account-horizontal-outline',
            title: 'KYC Verification',
            subtitle: 'Complete identity and compliance requirements',
            onPress: () => navigateTo('KYC'),
          },
        ]
      : []),
    {
      key: 'password',
      icon: 'lock-reset',
      title: 'Change Password',
      subtitle: 'Update your sign-in credentials',
      onPress: () => navigateTo('ChangePassword'),
    },
    {
      key: 'two-factor',
      icon: 'shield-key-outline',
      title: 'Two-Factor Authentication',
      subtitle: 'Strengthen access to your account',
      onPress: () => navigateTo('TwoFactorAuth'),
    },
    ...(!isAdminWorkspace
      ? [
          {
            key: 'referrals',
            icon: 'account-heart-outline',
            title: 'Referrals',
            subtitle: 'Invite others and track rewards',
            onPress: () => navigateTo('Referrals'),
          },
        ]
      : []),
  ];

  const workspaceItems: MoreItem[] = [
    ...(canCreateChama && canOpenChamaLifecycleActions
      ? [
          {
            key: 'create-chama',
            icon: 'plus-circle-outline',
            title: 'Create Chama',
            subtitle: 'Start a new group and configure its rules',
            onPress: () => navigateTo('CreateChama'),
          },
          {
            key: 'join-via-code',
            icon: 'account-plus-outline',
            title: 'Join Via Code',
            subtitle: 'Use an invite code to join another chama securely',
            onPress: () => navigateTo('JoinViaCode'),
          },
          {
            key: 'join-request-status',
            icon: 'clipboard-account-outline',
            title: 'Join Request Status',
            subtitle: 'Track requests you have submitted to other chamas',
            onPress: () => navigateTo('JoinRequestStatus'),
          },
        ]
      : []),
    ...(activeChamaId && canViewChama
      ? [
          {
            key: 'chama-detail',
            icon: 'office-building-outline',
            title: 'Current Chama',
            subtitle: activeChama?.name || 'Open the current workspace',
            onPress: () => navigateTo('ChamaDetail', { chamaId: activeChamaId }),
            screenKey: 'chama_details',
          },
        ]
      : []),
    ...(activeChamaId && canManageSettings
      ? [
          {
            key: 'chama-settings',
            icon: 'cog-outline',
            title: 'Chama Settings',
            subtitle: 'Configure rules, fees, notifications, and preferences',
            onPress: () => navigateTo('ChamaSettings', { chamaId: activeChamaId }),
          },
        ]
      : []),
    ...(activeChamaId && canViewMembers
      ? [
          {
            key: 'members',
            icon: 'account-multiple-outline',
            title: 'Members',
            subtitle: 'Review members and workspace access',
            onPress: () => navigateTo('MemberList', { chamaId: activeChamaId }),
            screenKey: 'members',
          },
        ]
      : []),
    ...(activeChamaId && canInviteMembers
      ? [
          {
            key: 'invite-members',
            icon: 'account-multiple-plus-outline',
            title: 'Invite Members',
            subtitle: 'Share invites and bring more members into the chama',
            onPress: () => navigateTo('InviteMember', { chamaId: activeChamaId }),
          },
        ]
      : []),
    ...(activeChamaId && canApproveMembers
      ? [
          {
            key: 'membership-requests',
            icon: 'clipboard-account-outline',
            title: 'Membership Requests',
            subtitle: 'Approve or reject pending join requests',
            onPress: () => navigateTo('MembershipRequests', { chamaId: activeChamaId }),
          },
        ]
      : []),
    ...(activeChamaId && canAssignRoles
      ? [
          {
            key: 'delegations',
            icon: 'account-switch-outline',
            title: 'Role Delegations',
            subtitle: 'Manage role handovers and access coverage',
            onPress: () => navigateTo('RoleDelegations', { chamaId: activeChamaId }),
          },
        ]
      : []),
    ...(activeChamaId && canViewChama
      ? [
          {
            key: 'governance',
            icon: 'gavel',
            title: 'Governance',
            subtitle: 'Motions, decisions, and governance activity',
            onPress: () => navigateTo('Governance', { chamaId: activeChamaId }),
            screenKey: 'governance',
          },
        ]
      : []),
  ];

  const financeItems: MoreItem[] = [
    ...(canViewFinance
      ? [
          {
            key: 'finance',
            icon: 'finance',
            title: 'Finance Hub',
            subtitle: 'Contributions, withdrawals, penalties, and controls',
            onPress: () => navigateTo('Finance'),
          },
          {
            key: 'transactions',
            icon: 'swap-horizontal-bold',
            title: 'Transactions',
            subtitle: 'Browse the finance trail and ledger activity',
            onPress: () => navigateTo('Transactions'),
          },
          {
            key: 'payment-history',
            icon: 'history',
            title: 'Payment History',
            subtitle: 'Open receipts, statuses, and completed payment attempts',
            onPress: () => navigateTo('PaymentHistory'),
            screenKey: 'payments',
          },
          {
            key: 'expenses',
            icon: 'receipt-text-outline',
            title: 'Expenses',
            subtitle: 'Submit and review expense workflows',
            onPress: () =>
              navigateTo('Expenses', {
                chamaId: activeChamaId || undefined,
                filter: isAdminWorkspace ? 'pending' : 'all',
              }),
          },
          {
            key: 'withdrawals',
            icon: 'cash-fast',
            title: 'Withdrawals',
            subtitle: 'Approve and track payout requests',
            onPress: () =>
              navigateTo('Withdrawals', {
                chamaId: activeChamaId || undefined,
                filter: isAdminWorkspace ? 'pending' : 'all',
              }),
          },
          {
            key: 'payment-operations',
            icon: 'cog-transfer-outline',
            title: 'Payment Operations',
            subtitle: 'Reconciliation, callbacks, and payment operations controls',
            onPress: () => navigateTo('PaymentOperations', { chamaId: activeChamaId || undefined }),
            screenKey: 'payments',
          },
          {
            key: 'compliance',
            icon: 'shield-check-outline',
            title: 'Contribution Compliance',
            subtitle: 'Follow up on contribution completion and compliance gaps',
            onPress: () =>
              navigateTo('ContributionCompliance', {
                chamaId: activeChamaId || undefined,
                filter: isAdminWorkspace ? 'missed' : 'all',
              }),
            screenKey: 'contributions',
          },
          {
            key: 'goals',
            icon: 'bullseye-arrow',
            title: 'Goals & Investments',
            subtitle: 'Track long-term targets and shared growth plans',
            onPress: () => navigateTo('GoalsInvestments', { chamaId: activeChamaId || undefined }),
          },
        ]
      : []),
    ...(activeChamaId && canMakePayments
      ? [
          {
            key: 'wallet',
            icon: 'wallet-bifold-outline',
            title: 'Wallet',
            subtitle: 'Balance, receipts, pending payments, and wallet activity',
            onPress: () =>
              navigateTo('Payments', {
                chamaId: activeChamaId,
                entryPoint: 'more',
              }),
            screenKey: 'payments',
          },
          {
            key: 'make-contribution',
            icon: 'cash-plus',
            title: 'Contributions',
            subtitle: 'View dues, history, schedule, and make a contribution',
            onPress: () => navigateTo('MemberContributions', { chamaId: activeChamaId }),
          },
        ]
      : []),
    ...(canIssuePenalty
      ? [
          {
            key: 'penalties',
            icon: 'gavel',
            title: 'Penalties',
            subtitle: 'Issue fines and resolve outstanding penalties',
            onPress: () => navigateTo('Penalties', { chamaId: activeChamaId || undefined }),
          },
        ]
      : []),
    ...(canRequestLoan || canViewFinance
      ? [
          {
            key: 'loan-applications',
            icon: 'hand-coin-outline',
            title: 'Loans',
            subtitle:
              activeRole === Role.MEMBER
                ? 'Check eligibility, apply, and track your loan status'
                : 'Request, review, and manage loan applications',
            onPress: () =>
              navigateTo(
                activeRole === Role.MEMBER ? 'MemberLoans' : 'LoanApplications',
                { chamaId: activeChamaId || undefined }
              ),
            screenKey: 'loans',
          },
        ]
      : []),
    ...(activeChamaId && canApproveLoan
      ? [
          {
            key: 'loan-approval-queue',
            icon: 'clipboard-check-outline',
            title: 'Loan Approval Queue',
            subtitle: 'Review submitted, approved, and disbursement-ready requests',
            onPress: () => navigateTo('LoanApprovalQueue', { chamaId: activeChamaId }),
            screenKey: 'loans',
          },
        ]
      : []),
    ...(activeChamaId && canManageLoanRecovery
      ? [
          {
            key: 'loan-recovery-queue',
            icon: 'shield-alert-outline',
            title: 'Loan Recovery Queue',
            subtitle: 'Follow overdue, defaulted, and escalated repayment cases',
            onPress: () => navigateTo('LoanRecoveryQueue', { chamaId: activeChamaId }),
            screenKey: 'loans',
          },
        ]
      : []),
    ...(activeChamaId && canApproveLoan
      ? [
          {
            key: 'loan-restructure-queue',
            icon: 'source-branch-check',
            title: 'Loan Restructure Review',
            subtitle: 'Approve or reject requested term changes',
            onPress: () => navigateTo('LoanRestructureQueue', { chamaId: activeChamaId }),
            screenKey: 'loans',
          },
        ]
      : []),
    ...(activeChamaId && canRequestLoan
      ? [
          {
            key: 'request-loan',
            icon: 'bank-plus',
            title: 'Request Loan',
            subtitle:
              activeRole === Role.MEMBER
                ? 'Open the guided loan application flow'
                : 'Submit a loan request directly from your current workspace',
            onPress: () =>
              navigateTo(activeRole === Role.MEMBER ? 'MemberLoans' : 'RequestLoan', {
                chamaId: activeChamaId,
              }),
            screenKey: 'loans',
          },
        ]
      : []),
  ];

  const communicationItems: MoreItem[] = [
    ...(canViewNotifications
      ? [
          {
            key: 'notifications',
            icon: 'bell-ring-outline',
            title: 'Notifications',
            subtitle: 'Alerts, approvals, and member updates',
            onPress: () => navigateTo('Notifications'),
            screenKey: 'notifications',
          },
          {
            key: 'announcements-feed',
            icon: 'bullhorn-outline',
            title: 'Announcements',
            subtitle: 'Read published workspace updates and notices',
            onPress: () => navigateTo('AnnouncementsFeed', { chamaId: activeChamaId || undefined }),
            screenKey: 'announcements',
          },
          {
            key: 'approvals',
            icon: 'clipboard-check-multiple-outline',
            title: 'Approvals Center',
            subtitle: 'Pending items that need attention',
            onPress: () => navigateTo('ApprovalsCenter', { chamaId: activeChamaId || undefined }),
            screenKey: 'dashboard',
          },
        ]
      : []),
    ...(canManageNotifications && activeChamaId
      ? [
          {
            key: 'automation',
            icon: 'robot-outline',
            title: 'Automation Center',
            subtitle: 'Notification and workflow automation controls',
            onPress: () => navigateTo('AutomationCenter', { chamaId: activeChamaId }),
          },
          {
            key: 'communications',
            icon: 'bullhorn-outline',
            title: 'Communication Center',
            subtitle: 'Broadcast updates and announcements',
            onPress: () => navigateTo('CommunicationCenter', { chamaId: activeChamaId }),
          },
          {
            key: 'communication-logs',
            icon: 'message-badge-outline',
            title: 'Communication Logs',
            subtitle: 'Review sent communication history',
            onPress: () => navigateTo('CommunicationLogs', { chamaId: activeChamaId }),
          },
        ]
      : []),
    ...(activeChamaId && canCreateMeetings
      ? [
          {
            key: 'create-meeting',
            icon: 'calendar-plus',
            title: 'Create Meeting',
            subtitle: 'Schedule a meeting, agenda, and attendance workflow',
            onPress: () => navigateTo('CreateMeeting', { chamaId: activeChamaId }),
            screenKey: 'meetings',
          },
        ]
      : []),

  ];

  const supportItems: MoreItem[] = [
    {
      key: 'help',
      icon: 'lifebuoy',
      title: 'Help & Support',
      subtitle: 'Guides, support contacts, and FAQs',
      onPress: () => navigateTo('HelpSupport'),
      screenKey: 'support',
    },
    ...(activeChamaId
      ? [
          {
            key: 'support-issues',
            icon: 'wrench-clock-outline',
            title: 'Support Issues',
            subtitle: 'Track workspace issues and service follow-up',
            onPress: () => navigateTo('SupportIssues', { chamaId: activeChamaId }),
            screenKey: 'support',
          },
        ]
      : []),
    {
      key: 'terms',
      icon: 'file-document-outline',
      title: 'Terms of Service',
      subtitle: 'Review platform terms and obligations',
      onPress: () => navigateTo('TermsOfService'),
    },
    {
      key: 'privacy',
      icon: 'shield-lock-outline',
      title: 'Privacy Policy',
      subtitle: 'See how data is handled and protected',
      onPress: () => navigateTo('PrivacyPolicy'),
    },
    {
      key: 'logout',
      icon: 'logout',
      title: 'Logout',
      subtitle: 'End this session securely',
      onPress: handleLogout,
    },
  ];

  const reportsItems: MoreItem[] = [
    ...(canViewReports
      ? [
          {
            key: 'reports-hub',
            icon: 'file-chart-outline',
            title: 'Reports Hub',
            subtitle: 'Open financial reports and export-ready workspace summaries',
            onPress: () => navigateTo('ReportsHub', { chamaId: activeChamaId || undefined }),
            screenKey: 'reports',
          },
        ]
      : []),
    ...(activeChamaId && canViewFinance
      ? [
          {
            key: 'chama-summary-report',
            icon: 'chart-box-outline',
            title: 'Chama Summary Report',
            subtitle: 'Review a high-level report for this workspace',
            onPress: () => navigateTo('ReportsHub', { chamaId: activeChamaId }),
          },
          {
            key: 'audit-trail',
            icon: 'history',
            title: 'Audit Logs',
            subtitle: 'Review transaction, approval, and activity history',
            onPress: () => navigateTo('AuditLogs', { chamaId: activeChamaId }),
            screenKey: 'reports',
          },
        ]
      : []),
    ...(activeChamaId && canManageNotifications
      ? [
          {
            key: 'delivery-logs',
            icon: 'message-badge-outline',
            title: 'Delivery Logs',
            subtitle: 'Check sent messages, retries, and delivery outcomes',
            onPress: () => navigateTo('CommunicationLogs', { chamaId: activeChamaId }),
          },
        ]
      : []),
  ];

  const adminHomeItems: MoreItem[] = [
    ...(canViewNotifications
      ? [
          {
            key: 'admin-action-center',
            icon: 'view-dashboard-edit-outline',
            title: 'Admin Action Center',
            subtitle: 'Your main queue for approvals, alerts, and pending decisions',
            onPress: () => navigateTo('ApprovalsCenter', { chamaId: activeChamaId || undefined }),
            screenKey: 'dashboard',
          },
        ]
      : []),
    ...(activeChamaId && canViewFinance
      ? [
          {
            key: 'health-report',
            icon: 'heart-pulse',
            title: 'Chama Health',
            subtitle: 'Track liquidity, contribution reliability, and risk signals',
            onPress: () =>
              navigateTo('FinanceReportDetail', {
                reportType: 'chama-summary',
                chamaId: activeChamaId,
              }),
          },
        ]
      : []),
    ...(canAccessAdminTools
      ? [
          {
            key: 'platform-dashboard',
            icon: 'monitor-dashboard',
            title: 'Platform Dashboard',
            subtitle: 'Provider health, fraud flags, failed operations, and admin monitoring',
            onPress: () => navigateTo('PlatformDashboard', { chamaId: activeChamaId || undefined }),
            screenKey: 'dashboard',
          },
        ]
      : []),
  ];

  const adminChamaItems = workspaceItems.filter((item) =>
    [
      'create-chama',
      'chama-detail',
      'chama-settings',
      'members',
      'invite-members',
      'membership-requests',
      'delegations',
    ].includes(item.key)
  );

  const adminFinanceItems = financeItems;

  const adminGovernanceItems = [
    ...communicationItems.filter((item) => item.key === 'create-meeting'),
    ...workspaceItems.filter((item) => item.key === 'governance'),
  ];

  const adminOperationsItems = [
    ...communicationItems.filter((item) =>
      ['notifications', 'approvals', 'automation', 'communications', 'communication-logs'].includes(item.key)
    ),
    ...supportItems.filter((item) => item.key === 'support-issues'),
  ];

  const memberSections = [
    { title: 'Account', items: accountItems },
    { title: 'Workspace', items: workspaceItems },
    { title: 'Finance', items: financeItems },
    { title: 'Communication', items: communicationItems },
    { title: 'Support', items: supportItems },
  ];

  const treasurerSections: MoreSection[] = [
    {
      title: 'Finance Command',
      items: financeItems.filter((item) =>
        [
          'finance',
          'transactions',
          'payment-history',
          'payment-operations',
          'expenses',
          'withdrawals',
          'compliance',
        ].includes(item.key)
      ),
    },
    {
      title: 'Loans & Exposure',
      items: financeItems.filter((item) =>
        [
          'loan-applications',
          'loan-approval-queue',
          'loan-recovery-queue',
          'loan-restructure-queue',
          'penalties',
        ].includes(item.key)
      ),
    },
    {
      title: 'Workspace',
      items: workspaceItems.filter((item) =>
        ['chama-detail', 'members', 'invite-members', 'membership-requests', 'governance'].includes(item.key)
      ),
    },
    {
      title: 'Reports & Control',
      items: [
        ...reportsItems,
        ...communicationItems.filter((item) => ['approvals', 'notifications'].includes(item.key)),
      ],
    },
    { title: 'Account', items: accountItems },
    { title: 'Support', items: supportItems },
  ];

  const secretarySections: MoreSection[] = [
    {
      title: 'Meetings & Governance',
      items: [
        ...communicationItems.filter((item) => item.key === 'create-meeting'),
        ...workspaceItems.filter((item) => item.key === 'governance'),
      ],
    },
    {
      title: 'Member Coordination',
      items: workspaceItems.filter((item) =>
        ['members', 'invite-members', 'membership-requests', 'delegations'].includes(item.key)
      ),
    },
    {
      title: 'Announcements & Delivery',
      items: communicationItems.filter((item) =>
        [
          'notifications',
          'announcements-feed',
          'approvals',
          'automation',
          'communications',
          'communication-logs',
        ].includes(item.key)
      ),
    },
    {
      title: 'Reports',
      items: reportsItems,
    },
    { title: 'Account', items: accountItems },
    { title: 'Support', items: supportItems },
  ];

  const auditorSections: MoreSection[] = [
    {
      title: 'Audit & Oversight',
      items: [
        ...reportsItems,
        ...financeItems.filter((item) =>
          ['finance', 'transactions', 'payment-history', 'loan-applications', 'penalties'].includes(item.key)
        ),
      ],
    },
    {
      title: 'Governance Review',
      items: [
        ...workspaceItems.filter((item) => ['chama-detail', 'members', 'governance'].includes(item.key)),
        ...communicationItems.filter((item) => ['notifications', 'announcements-feed'].includes(item.key)),
      ],
    },
    { title: 'Account', items: accountItems },
    { title: 'Support', items: supportItems },
  ];

   const roleAwareMemberSections: MoreSection[] = [
     {
       title: 'My Workspace',
       items: workspaceItems.filter((item) =>
         ['chama-detail'].includes(item.key)
       ),
     },
     {
       title: 'My Money',
       items: financeItems.filter((item) =>
         ['make-contribution', 'payment-history', 'loan-applications', 'request-loan', 'goals'].includes(item.key)
       ),
     },
     {
       title: 'Investments',
       items: [
         {
           key: 'investment-products',
           icon: 'trending-up',
           title: 'Investment Products',
           subtitle: 'Explore available investment opportunities',
           onPress: () => navigateTo('InvestmentProducts'),
         },
         {
           key: 'my-investments',
           icon: 'wallet-outline',
           title: 'My Investments',
           subtitle: 'View and manage your investments',
           onPress: () => navigateTo('MyInvestments'),
         },
         {
           key: 'investment-learn',
           icon: 'school-outline',
           title: 'Learn About Investments',
           subtitle: 'Educational resources on investing',
           onPress: () => navigateTo('InvestmentLearn'),
         },
       ],
     },
     {
       title: 'Stay Updated',
       items: communicationItems.filter((item) =>
         ['notifications', 'announcements-feed', 'smart-dashboard'].includes(item.key)
       ),
     },
     { title: 'Account', items: accountItems },
     { title: 'Support', items: supportItems },
   ];

  const superAdminSections: MoreSection[] = [
    {
      title: 'Platform Control',
      items: [
        ...adminHomeItems.filter((item) => ['platform-dashboard', 'admin-action-center'].includes(item.key)),
        ...reportsItems.filter((item) => ['reports-hub', 'audit-trail'].includes(item.key)),
      ],
    },
    {
      title: 'Operational Signals',
      items: communicationItems.filter((item) =>
        ['notifications', 'approvals', 'automation', 'communication-logs'].includes(item.key)
      ),
    },
    {
      title: 'Workspace Oversight',
      items: [
        ...workspaceItems.filter((item) => ['create-chama', 'members', 'governance'].includes(item.key)),
        ...financeItems.filter((item) =>
          ['finance', 'transactions', 'payment-operations', 'loan-applications'].includes(item.key)
        ),
      ],
    },
    { title: 'Account', items: accountItems },
    { title: 'Support', items: supportItems },
  ];

  const adminSections: MoreSection[] = [
    { title: 'Operations', items: adminHomeItems.filter((item) => item.key === 'admin-action-center') },
    {
      title: 'Moderation & Communication',
      items: [
        ...adminOperationsItems,
        ...communicationItems.filter((item) => ['announcements-feed'].includes(item.key)),
      ],
    },
    { title: 'Workspace Oversight', items: adminChamaItems },
    { title: 'Finance', items: adminFinanceItems },
    { title: 'Reports', items: reportsItems },
    { title: 'Account', items: accountItems },
    { title: 'Support', items: supportItems },
  ];

  const chamaAdminSections: MoreSection[] = [
    {
      title: 'Action Center',
      items: [
        ...adminHomeItems.filter((item) => item.key === 'admin-action-center'),
        ...workspaceItems.filter((item) =>
          ['membership-requests', 'invite-members', 'members', 'delegations'].includes(item.key)
        ),
      ],
    },
    {
      title: 'Finance & Approvals',
      items: financeItems.filter((item) =>
        [
          'finance',
          'payment-history',
          'expenses',
          'withdrawals',
          'payment-operations',
          'compliance',
          'loan-applications',
          'loan-approval-queue',
          'loan-recovery-queue',
          'loan-restructure-queue',
          'penalties',
        ].includes(item.key)
      ),
    },
    {
      title: 'Governance & Meetings',
      items: [
        ...adminGovernanceItems,
        ...communicationItems.filter((item) =>
          ['announcements-feed', 'communications', 'communication-logs'].includes(item.key)
        ),
      ],
    },
    {
      title: 'Settings & Reports',
      items: [
        ...workspaceItems.filter((item) => ['chama-detail', 'chama-settings', 'governance'].includes(item.key)),
        ...reportsItems,
      ],
    },
    { title: 'Account', items: accountItems },
    { title: 'Support', items: supportItems },
  ];

  const roleExperience = useMemo(() => {
    switch (activeRole) {
      case Role.SUPERADMIN:
        return {
          title: 'Super Admin workspace',
          description:
            'Watch platform health, provider stability, operational alerts, and cross-chama signals from one control center.',
          accent: colors.primary[700],
          sections: superAdminSections,
        };
      case Role.ADMIN:
        return {
          title: 'Admin workspace',
          description:
            'Handle support, moderation, approvals, and delivery issues across the operating environment.',
          accent: colors.primary[600],
          sections: adminSections,
        };
      case Role.CHAMA_ADMIN:
        return {
          title: 'Chama Admin workspace',
          description:
            'Run one chama end to end with approvals, members, finance, meetings, communication, and reports in one place.',
          accent: colors.primary[600],
          sections: chamaAdminSections,
        };
      case Role.TREASURER:
        return {
          title: 'Treasurer workspace',
          description:
            'Focus on collections, payouts, reconciliation, loan exposure, and financial reporting with the tools you use most.',
          accent: colors.success,
          sections: treasurerSections,
        };
      case Role.SECRETARY:
        return {
          title: 'Secretary workspace',
          description:
            'Run meetings, minutes, attendance, announcements, and member communication from a clear operations hub.',
          accent: colors.info,
          sections: secretarySections,
        };
      case Role.AUDITOR:
        return {
          title: 'Auditor workspace',
          description:
            'Review finance, governance, activity history, and compliance signals in a read-heavy oversight workspace.',
          accent: colors.accent[600],
          sections: auditorSections,
        };
      case Role.MEMBER:
      default:
        return {
          title: 'Member workspace',
          description:
            'Keep your contributions, loan activity, chama participation, and account actions organized in one place.',
          accent: colors.warning,
          sections: roleAwareMemberSections.length ? roleAwareMemberSections : memberSections,
        };
    }
  }, [
    activeRole,
    adminSections,
    auditorSections,
    chamaAdminSections,
    memberSections,
    roleAwareMemberSections,
    secretarySections,
    superAdminSections,
    treasurerSections,
  ]);

  const sections = useMemo(
    () =>
      roleExperience.sections
        .map((section) => ({
          ...section,
          items: applyRoleExperience(section.items),
        }))
        .filter((section) => section.items.length > 0),
    [roleExperience, activeRole]
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileHero}>
          <View style={styles.profileRow}>
            <Avatar name={user?.full_name || 'Member'} size="lg" imageUri={user?.avatar || undefined} />
            <View style={styles.profileCopy}>
              <Text style={styles.profileTitle}>{user?.full_name || 'MyChama Member'}</Text>
              <Text style={styles.profileSubtitle}>{user?.email || user?.phone || 'Signed in'}</Text>
              <Text style={styles.roleBadge}>
                {activeChama?.name
                  ? `${activeChama.name} ${isAdminWorkspace ? 'admin workspace' : 'workspace'}`
                  : user?.role || 'MyChama access'}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={{ ...styles.roleBanner, backgroundColor: roleExperience.accent }}>
          <Text style={styles.adminBannerEyebrow}>
            {ROLE_DISPLAY_NAMES[activeRole || Role.MEMBER]}
          </Text>
          <Text style={styles.adminBannerTitle}>{roleExperience.title}</Text>
          <Text style={styles.adminBannerText}>
            {roleExperience.description || ROLE_DESCRIPTIONS[activeRole || Role.MEMBER]}
          </Text>
        </Card>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.itemRow,
                    index < section.items.length - 1 ? styles.itemDivider : null,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.75}
                >
                  <View style={styles.itemLeft}>
                    <View style={styles.itemIcon}>
                      <Icon name={item.icon as never} size={20} color={colors.primary[600]} />
                    </View>
                    <View style={styles.itemCopy}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" size={20} color={colors.neutral[400]} />
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}
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
    padding: spacing[4],
    gap: spacing[4],
  },
  profileHero: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.neutral[900],
  },
  roleBanner: {
    borderRadius: borderRadius.xl,
  },
  adminBannerEyebrow: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[2],
  },
  adminBannerTitle: {
    color: colors.light.background,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[2],
  },
  adminBannerText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCopy: {
    flex: 1,
    marginLeft: spacing[3],
  },
  profileTitle: {
    color: colors.light.background,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
  },
  profileSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing[1],
    fontFamily: typography.fontFamily.regular,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: colors.light.background,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    overflow: 'hidden',
  },
  section: {
    gap: spacing[2],
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
  },
  sectionCard: {
    borderRadius: borderRadius.xl,
    paddingVertical: 0,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
  },
  itemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  itemCopy: {
    flex: 1,
    paddingRight: spacing[3],
  },
  itemTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  itemSubtitle: {
    color: colors.neutral[500],
    marginTop: spacing[1],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
});

export default MoreScreen;
