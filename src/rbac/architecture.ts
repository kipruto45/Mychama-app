import { Permission, ROLE_PERMISSIONS } from '@/auth/permissions';
import { Role, ROLE_DESCRIPTIONS, ROLE_DISPLAY_NAMES } from '@/auth/roles';
import { ROLE_DASHBOARD_WIDGETS } from '@/config/sharedPageArchitecture';
import { AppScreenKey, SCREEN_RBAC_MATRIX } from './screenMatrix';
import { TABLE_COLUMN_MATRIX } from './pageHelpers';

export interface SharedScreenDefinition {
  key: AppScreenKey;
  label: string;
  baseLayout: string[];
  primaryRoles: Role[];
  hiddenFor: Role[];
  readOnlyFor: Role[];
  separateWorkflowNotes?: string[];
}

export interface RoleAccessSummary {
  role: Role;
  focus: string[];
  sharedScreens: AppScreenKey[];
  separateScreens: string[];
}

export interface RolePermissionMatrixRow {
  role: Role;
  label: string;
  description: string;
  permissions: Permission[];
  sharedScreens: AppScreenKey[];
  separateScreens: string[];
}

export interface ScreenRoleBreakdownRow {
  screen: AppScreenKey;
  screenLabel: string;
  role: Role;
  roleLabel: string;
  access: string;
  scope: string;
  backendScope: string;
  sees: string[];
  does: string[];
  tabs: string[];
  filters: string[];
  widgets: string[];
  quickActions: string[];
  tableColumns: string[];
  hiddenByRole: boolean;
  readOnly: boolean;
}

export interface NavigationSection {
  title: string;
  routes: string[];
}

export interface RoleNavigationBlueprint {
  role: Role;
  label: string;
  sections: NavigationSection[];
}

export const SEPARATE_WORKFLOWS = [
  'Login',
  'Register',
  'OTP Verification',
  'Invite Preview',
  'Join with Code',
  'Join Success',
  'KYC Submission',
  'Payment Processing / Checkout',
  'Platform SuperAdmin Console',
  'Reconciliation Case Deep Workflow',
  'Access Denied',
  'Not Found',
  'Session Expired',
  'Maintenance',
] as const;

export const SHARED_SCREEN_LIST = [
  'Dashboard',
  'Chamas',
  'Chama Details',
  'Members',
  'Contributions',
  'Payments',
  'Loans',
  'Meetings',
  'Motions / Governance',
  'Announcements',
  'Notifications',
  'Reports',
  'Profile',
  'Settings',
  'Support / Disputes',
  'AI Assistant',
] as const;

export const SEPARATE_SCREEN_LIST = [
  'Login',
  'Register',
  'OTP Verification',
  'Invite Preview',
  'Join With Code',
  'Join Success',
  'KYC Submission',
  'Payment Checkout / Processing',
  'Platform SuperAdmin Console',
  'Reconciliation Case Deep Workflow',
  'Access Denied',
  'Not Found',
  'Session Expired',
  'Maintenance',
] as const;

export const SHARED_SCREEN_DEFINITIONS: Record<AppScreenKey, SharedScreenDefinition> = {
  dashboard: {
    key: 'dashboard',
    label: 'Dashboard',
    baseLayout: ['hero summary', 'role widgets', 'quick actions', 'alerts', 'charts or cards', 'permission-aware empty states'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [],
    readOnlyFor: [Role.AUDITOR],
  },
  chamas_list: {
    key: 'chamas_list',
    label: 'Chamas',
    baseLayout: ['search', 'filter bar', 'role badges', 'chama cards or rows', 'context switcher', 'operational highlights'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [],
    readOnlyFor: [Role.AUDITOR],
  },
  chama_details: {
    key: 'chama_details',
    label: 'Chama Details',
    baseLayout: ['header summary', 'stats cards', 'role-aware tabs', 'detail sections', 'quick actions', 'history and documents'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [],
    readOnlyFor: [Role.AUDITOR, Role.ADMIN, Role.SUPERADMIN],
  },
  members: {
    key: 'members',
    label: 'Members',
    baseLayout: ['search', 'member table/list', 'filters', 'detail panel', 'profile summary', 'role-aware actions'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [],
    readOnlyFor: [Role.AUDITOR, Role.MEMBER],
  },
  contributions: {
    key: 'contributions',
    label: 'Contributions',
    baseLayout: ['summary cards', 'status tabs', 'filters', 'records list', 'details panel', 'compliance indicators'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [],
    readOnlyFor: [Role.AUDITOR, Role.SUPERADMIN, Role.ADMIN],
  },
  finance: {
    key: 'finance',
    label: 'Finance',
    baseLayout: ['hero summary', 'financial metrics', 'role-aware tabs', 'charts', 'transaction highlights', 'quick actions'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.AUDITOR],
    hiddenFor: [Role.SECRETARY, Role.MEMBER],
    readOnlyFor: [Role.AUDITOR, Role.SUPERADMIN, Role.ADMIN],
  },
  payments: {
    key: 'payments',
    label: 'Payments',
    baseLayout: ['transactions table', 'status chips', 'filters', 'receipt drawer', 'detail panel', 'verification shortcuts'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [Role.SECRETARY],
    readOnlyFor: [Role.AUDITOR, Role.CHAMA_ADMIN],
    separateWorkflowNotes: ['Actual payment checkout remains separate.'],
  },
  loans: {
    key: 'loans',
    label: 'Loans',
    baseLayout: ['portfolio summary', 'applications list', 'filters', 'detail cards', 'risk indicators', 'actions rail'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [Role.SECRETARY],
    readOnlyFor: [Role.AUDITOR, Role.SUPERADMIN, Role.ADMIN],
  },
  meetings: {
    key: 'meetings',
    label: 'Meetings',
    baseLayout: ['list or calendar toggle', 'meeting cards', 'search and filters', 'detail view', 'records tabs'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [],
    readOnlyFor: [Role.AUDITOR, Role.MEMBER, Role.TREASURER, Role.SUPERADMIN, Role.ADMIN],
  },
  governance: {
    key: 'governance',
    label: 'Motions / Governance',
    baseLayout: ['motion list', 'detail panel', 'result state', 'archive state', 'decision timeline'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [],
    readOnlyFor: [Role.AUDITOR, Role.SUPERADMIN, Role.ADMIN],
  },
  announcements: {
    key: 'announcements',
    label: 'Announcements',
    baseLayout: ['feed', 'detail view', 'composer panel', 'pinning state', 'role badges'],
    primaryRoles: [Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [Role.SUPERADMIN, Role.ADMIN],
    readOnlyFor: [Role.TREASURER, Role.AUDITOR, Role.MEMBER],
  },
  notifications: {
    key: 'notifications',
    label: 'Notifications',
    baseLayout: ['list', 'filters', 'detail drawer', 'read or unread states', 'settings entry'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [],
    readOnlyFor: [],
  },
  reports: {
    key: 'reports',
    label: 'Reports',
    baseLayout: ['reports hub', 'category chips', 'filters', 'export actions', 'report cards'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [],
    readOnlyFor: [Role.AUDITOR, Role.MEMBER],
  },
  profile: {
    key: 'profile',
    label: 'Profile',
    baseLayout: ['profile summary', 'edit form', 'role summary', 'memberships', 'KYC state', 'security links'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [],
    readOnlyFor: [],
  },
  settings: {
    key: 'settings',
    label: 'Settings',
    baseLayout: ['appearance', 'notifications', 'privacy', 'security', 'sessions', 'role-specific alert preferences'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [],
    readOnlyFor: [],
  },
  support: {
    key: 'support',
    label: 'Support / Disputes',
    baseLayout: ['list', 'filters', 'detail view', 'status timeline', 'create flow or resolve actions'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [],
    readOnlyFor: [Role.AUDITOR],
  },
  ai_assistant: {
    key: 'ai_assistant',
    label: 'AI Assistant',
    baseLayout: ['chat surface', 'quick prompts', 'insights panel', 'suggested actions', 'role-filtered answers'],
    primaryRoles: [Role.SUPERADMIN, Role.ADMIN, Role.CHAMA_ADMIN, Role.TREASURER, Role.SECRETARY, Role.AUDITOR, Role.MEMBER],
    hiddenFor: [],
    readOnlyFor: [],
  },
};

export const ROLE_ACCESS_SUMMARY: RoleAccessSummary[] = [
  {
    role: Role.SUPERADMIN,
    focus: ['platform operations', 'provider health', 'fraud and risk', 'system analytics', 'support escalation'],
    sharedScreens: ['dashboard', 'chamas_list', 'chama_details', 'members', 'contributions', 'finance', 'payments', 'loans', 'meetings', 'governance', 'notifications', 'reports', 'profile', 'settings', 'support', 'ai_assistant'],
    separateScreens: ['Platform SuperAdmin Console'],
  },
  {
    role: Role.ADMIN,
    focus: ['support operations', 'moderation', 'disputes', 'communications', 'investigation views'],
    sharedScreens: ['dashboard', 'chamas_list', 'chama_details', 'members', 'contributions', 'finance', 'payments', 'loans', 'meetings', 'governance', 'notifications', 'reports', 'profile', 'settings', 'support', 'ai_assistant'],
    separateScreens: ['Privileged communication center when run in platform mode'],
  },
  {
    role: Role.CHAMA_ADMIN,
    focus: ['member management', 'approvals', 'governance', 'policies', 'announcements', 'chama health'],
    sharedScreens: ['dashboard', 'chamas_list', 'chama_details', 'members', 'contributions', 'finance', 'payments', 'loans', 'meetings', 'governance', 'announcements', 'notifications', 'reports', 'profile', 'settings', 'support', 'ai_assistant'],
    separateScreens: [],
  },
  {
    role: Role.TREASURER,
    focus: ['payments', 'reconciliation', 'contributions', 'liquidity', 'loans', 'finance reports'],
    sharedScreens: ['dashboard', 'chamas_list', 'chama_details', 'members', 'contributions', 'finance', 'payments', 'loans', 'meetings', 'governance', 'announcements', 'notifications', 'reports', 'profile', 'settings', 'support', 'ai_assistant'],
    separateScreens: ['Payment processing / checkout', 'Reconciliation case deep workflow'],
  },
  {
    role: Role.SECRETARY,
    focus: ['meetings', 'agenda', 'minutes', 'attendance', 'announcements', 'member communication', 'governance support'],
    sharedScreens: ['dashboard', 'chamas_list', 'chama_details', 'members', 'contributions', 'meetings', 'governance', 'announcements', 'notifications', 'reports', 'profile', 'settings', 'support', 'ai_assistant'],
    separateScreens: [],
  },
  {
    role: Role.AUDITOR,
    focus: ['read-only finance review', 'audit logs', 'compliance', 'loan and fine review', 'governance review'],
    sharedScreens: ['dashboard', 'chamas_list', 'chama_details', 'members', 'contributions', 'finance', 'payments', 'loans', 'meetings', 'governance', 'announcements', 'notifications', 'reports', 'profile', 'settings', 'support', 'ai_assistant'],
    separateScreens: [],
  },
  {
    role: Role.MEMBER,
    focus: ['own contributions', 'own payments', 'own loans', 'meetings', 'announcements', 'support'],
    sharedScreens: ['dashboard', 'chamas_list', 'chama_details', 'members', 'contributions', 'payments', 'loans', 'meetings', 'governance', 'announcements', 'notifications', 'reports', 'profile', 'settings', 'support', 'ai_assistant'],
    separateScreens: ['KYC Submission', 'Payment Processing / Checkout'],
  },
];

export const FINAL_ROUTE_STRUCTURE = {
  auth: ['Splash', 'Onboarding', 'Login', 'Register', 'OTP', 'OTPVerification', 'ForgotPassword', 'ResetPassword'],
  special: [...SEPARATE_WORKFLOWS],
  shared: [
    'Dashboard',
    'Chamas',
    'ChamaDetail',
    'MemberList',
    'ContributionCompliance',
    'Finance',
    'Payments',
    'LoanApplications',
    'Meetings',
    'Governance',
    'AnnouncementsFeed',
    'Notifications',
    'ReportsHub',
    'Profile',
    'Settings',
    'SupportIssues',
    'AIChat',
  ],
} as const;

export const STANDARD_NAVIGATION_STRUCTURE = {
  auth: ['Splash', 'Onboarding', 'Login', 'Register', 'OTP', 'OTPRequest', 'OTPVerification', 'ForgotPassword', 'ResetPassword'],
  join: ['InvitePreview', 'JoinViaCode', 'RequestJoin', 'JoinRequestStatus', 'JoinSuccess', 'PostJoinSetup'],
  sharedTabs: ['Dashboard', 'Chamas', 'Payments', 'Meetings', 'More'],
  sharedCore: [
    'Dashboard',
    'Chamas',
    'ChamaDetail',
    'MemberList',
    'ContributionCompliance',
    'Payments',
    'LoanApplications',
    'Meetings',
    'Governance',
    'AnnouncementsFeed',
    'Notifications',
    'ReportsHub',
    'Profile',
    'Settings',
    'SupportIssues',
    'AIChat',
  ],
  special: ['CreateChama', 'CreateChamaSuccess', 'PaymentMethod', 'MpesaPayment', 'CashPayment', 'PaymentStatus', 'KYC'],
  platform: ['PlatformDashboard', 'AuditLogs', 'CommunicationCenter', 'ApprovalsCenter', 'AutomationCenter', 'CommunicationLogs'],
} as const;

export const ROLE_NAVIGATION_BLUEPRINT: RoleNavigationBlueprint[] = [
  {
    role: Role.SUPERADMIN,
    label: ROLE_DISPLAY_NAMES[Role.SUPERADMIN],
    sections: [
      { title: 'Main', routes: ['Dashboard', 'Chamas', 'ReportsHub', 'Notifications'] },
      { title: 'Platform', routes: ['PlatformDashboard', 'AuditLogs', 'Payments', 'SupportIssues', 'AIChat'] },
      { title: 'Personal', routes: ['Profile', 'Settings'] },
    ],
  },
  {
    role: Role.ADMIN,
    label: ROLE_DISPLAY_NAMES[Role.ADMIN],
    sections: [
      { title: 'Main', routes: ['Dashboard', 'Chamas', 'SupportIssues', 'Notifications'] },
      { title: 'Operations', routes: ['Payments', 'ReportsHub', 'MemberList', 'AIChat'] },
      { title: 'Personal', routes: ['Profile', 'Settings'] },
    ],
  },
  {
    role: Role.CHAMA_ADMIN,
    label: ROLE_DISPLAY_NAMES[Role.CHAMA_ADMIN],
    sections: [
      { title: 'Main', routes: ['Dashboard', 'Chamas', 'ChamaDetail', 'MemberList'] },
      { title: 'Operations', routes: ['ContributionCompliance', 'Finance', 'Payments', 'LoanApplications', 'Meetings', 'Governance', 'AnnouncementsFeed', 'ReportsHub', 'SupportIssues', 'AIChat'] },
      { title: 'Personal', routes: ['Profile', 'Settings', 'Notifications'] },
    ],
  },
  {
    role: Role.TREASURER,
    label: ROLE_DISPLAY_NAMES[Role.TREASURER],
    sections: [
      { title: 'Main', routes: ['Dashboard', 'Chamas', 'Finance', 'Payments'] },
      { title: 'Finance Ops', routes: ['ContributionCompliance', 'LoanApplications', 'MemberList', 'ReportsHub', 'SupportIssues', 'AIChat'] },
      { title: 'Personal', routes: ['Profile', 'Settings', 'Notifications'] },
    ],
  },
  {
    role: Role.SECRETARY,
    label: ROLE_DISPLAY_NAMES[Role.SECRETARY],
    sections: [
      { title: 'Main', routes: ['Dashboard', 'Chamas', 'Meetings', 'Governance'] },
      { title: 'Coordination', routes: ['ChamaDetail', 'AnnouncementsFeed', 'MemberList', 'ReportsHub', 'SupportIssues', 'AIChat'] },
      { title: 'Personal', routes: ['Profile', 'Settings', 'Notifications'] },
    ],
  },
  {
    role: Role.AUDITOR,
    label: ROLE_DISPLAY_NAMES[Role.AUDITOR],
    sections: [
      { title: 'Main', routes: ['Dashboard', 'Chamas', 'Finance', 'ReportsHub'] },
      { title: 'Review', routes: ['MemberList', 'ContributionCompliance', 'Payments', 'LoanApplications', 'Meetings', 'Governance', 'SupportIssues', 'AIChat'] },
      { title: 'Personal', routes: ['Profile', 'Settings', 'Notifications'] },
    ],
  },
  {
    role: Role.MEMBER,
    label: ROLE_DISPLAY_NAMES[Role.MEMBER],
    sections: [
      { title: 'Main', routes: ['Dashboard', 'Chamas', 'Payments', 'Meetings'] },
      { title: 'Self Service', routes: ['ContributionCompliance', 'LoanApplications', 'Governance', 'AnnouncementsFeed', 'ReportsHub', 'SupportIssues', 'AIChat'] },
      { title: 'Personal', routes: ['Profile', 'Settings', 'Notifications'] },
    ],
  },
] as const;

export const RECOMMENDED_REUSABLE_COMPONENTS = [
  'RoleAwarePageShell',
  'RequireRouteAccess',
  'RequireScreenAccess',
  'SectionGuard',
  'ActionGuard',
  'FieldGuard',
  'AccessBadge',
  'ScopeBadge',
  'ReadOnlyBanner',
  'QuickActionBar',
  'RoleAwareTabBar',
  'ChamaContextSwitcher',
  'Card',
  'Badge',
  'Button',
  'EmptyState',
  'SkeletonList',
  'StatCard',
  'TransactionCard',
  'MeetingCard',
  'ContributionChart',
  'BalanceChart',
] as const;

export const MODERN_DESIGN_GUIDANCE = [
  'Use one clean shared layout per screen, then vary widgets, tabs, and actions by role.',
  'Show read-only banners for audit and restricted views instead of hiding context abruptly.',
  'Prefer rich cards, compact summaries, chips, and filters over long plain lists.',
  'Use permission-aware empty states that explain what the role can do next.',
  'Keep operational roles information-dense and member views calmer and self-service focused.',
  'Use consistent role badges, scope labels, and data-scope copy across shared screens.',
] as const;

export const BACKEND_RBAC_ENFORCEMENT = [
  'Every mutation must check permission and object-level ownership/scope.',
  'Every list query must be scoped by platform, chama, investigation, or own records.',
  'Hidden UI fields must also be removed or redacted from API payloads.',
  'Read-only roles must never receive writable actions from the API.',
  'AI responses must use the same backend scope as the screen or role context.',
] as const;

export const FRONTEND_RBAC_ENFORCEMENT = [
  'Guard shared routes before a screen mounts.',
  'Drive section visibility from the RBAC matrix instead of ad hoc conditions.',
  'Control tabs, widgets, tables, and actions independently inside each shared screen.',
  'Use permission-aware component guards for buttons, drawers, and form actions.',
  'Show clear read-only banners for oversight roles instead of silently hiding context.',
  'Keep role-aware data scope labels visible so users understand why they see what they see.',
] as const;

export const ROLE_PERMISSION_MATRIX: RolePermissionMatrixRow[] = ROLE_ACCESS_SUMMARY.map((item) => ({
  role: item.role,
  label: ROLE_DISPLAY_NAMES[item.role],
  description: ROLE_DESCRIPTIONS[item.role],
  permissions: ROLE_PERMISSIONS[item.role],
  sharedScreens: item.sharedScreens,
  separateScreens: item.separateScreens,
}));

export const DASHBOARD_WIDGET_VISIBILITY_MATRIX: Record<Role, string[]> = {
  [Role.SUPERADMIN]: ROLE_DASHBOARD_WIDGETS[Role.SUPERADMIN],
  [Role.ADMIN]: ROLE_DASHBOARD_WIDGETS[Role.ADMIN],
  [Role.CHAMA_ADMIN]: ROLE_DASHBOARD_WIDGETS[Role.CHAMA_ADMIN],
  [Role.TREASURER]: ROLE_DASHBOARD_WIDGETS[Role.TREASURER],
  [Role.SECRETARY]: ROLE_DASHBOARD_WIDGETS[Role.SECRETARY],
  [Role.AUDITOR]: ROLE_DASHBOARD_WIDGETS[Role.AUDITOR],
  [Role.MEMBER]: ROLE_DASHBOARD_WIDGETS[Role.MEMBER],
};

export const ACTION_VISIBILITY_MATRIX: Record<Role, string[]> = {
  [Role.SUPERADMIN]: ['Inspect provider', 'View failed jobs', 'Review fraud flags', 'Manage users', 'Export reports'],
  [Role.ADMIN]: ['Resolve ticket', 'Review flagged chama', 'Send communication', 'Open moderation queue'],
  [Role.CHAMA_ADMIN]: ['Invite members', 'Approve request', 'Create announcement', 'Schedule meeting', 'Review policies'],
  [Role.TREASURER]: ['Verify payment', 'Review reconciliation', 'Approve loan', 'Issue penalty', 'Open reports'],
  [Role.SECRETARY]: ['Create meeting', 'Record minutes', 'Send reminder', 'Post announcement', 'Track attendance'],
  [Role.AUDITOR]: ['Open audit logs', 'Export compliance report', 'Review finance anomalies'],
  [Role.MEMBER]: ['Pay contribution', 'Request loan', 'Open meeting', 'Join chama', 'Open support ticket'],
};

export const PRE_IMPLEMENTATION_BLUEPRINT = {
  sharedScreens: SHARED_SCREEN_LIST,
  separateScreens: SEPARATE_SCREEN_LIST,
  rolePermissionMatrix: ROLE_PERMISSION_MATRIX,
  dashboardWidgetMatrix: DASHBOARD_WIDGET_VISIBILITY_MATRIX,
  actionVisibilityMatrix: ACTION_VISIBILITY_MATRIX,
  navigation: STANDARD_NAVIGATION_STRUCTURE,
} as const;

export function getWidgetVisibilityMatrix(): Record<AppScreenKey, Record<Role, string[]>> {
  return Object.fromEntries(
    Object.entries(SCREEN_RBAC_MATRIX).map(([screen, roleMap]) => [
      screen,
      Object.fromEntries(
        Object.entries(roleMap).map(([role, experience]) => [role, experience.widgets || []])
      ),
    ])
  ) as Record<AppScreenKey, Record<Role, string[]>>;
}

export function getQuickActionMatrix(): Record<AppScreenKey, Record<Role, string[]>> {
  return Object.fromEntries(
    Object.entries(SCREEN_RBAC_MATRIX).map(([screen, roleMap]) => [
      screen,
      Object.fromEntries(
        Object.entries(roleMap).map(([role, experience]) => [role, experience.quickActions || []])
      ),
    ])
  ) as Record<AppScreenKey, Record<Role, string[]>>;
}

export function getTabVisibilityMatrix(): Record<AppScreenKey, Record<Role, string[]>> {
  return Object.fromEntries(
    Object.entries(SCREEN_RBAC_MATRIX).map(([screen, roleMap]) => [
      screen,
      Object.fromEntries(
        Object.entries(roleMap).map(([role, experience]) => [role, experience.tabs || []])
      ),
    ])
  ) as Record<AppScreenKey, Record<Role, string[]>>;
}

export function getFilterVisibilityMatrix(): Record<AppScreenKey, Record<Role, string[]>> {
  return Object.fromEntries(
    Object.entries(SCREEN_RBAC_MATRIX).map(([screen, roleMap]) => [
      screen,
      Object.fromEntries(
        Object.entries(roleMap).map(([role, experience]) => [role, experience.filters || []])
      ),
    ])
  ) as Record<AppScreenKey, Record<Role, string[]>>;
}

export function getTableColumnVisibilityMatrix(): Partial<Record<AppScreenKey, Record<Role, string[]>>> {
  return TABLE_COLUMN_MATRIX;
}

export function getBackendDataScopeMatrix(): Record<AppScreenKey, Record<Role, string>> {
  return Object.fromEntries(
    Object.entries(SCREEN_RBAC_MATRIX).map(([screen, roleMap]) => [
      screen,
      Object.fromEntries(
        Object.entries(roleMap).map(([role, experience]) => [role, experience.backendScope])
      ),
    ])
  ) as Record<AppScreenKey, Record<Role, string>>;
}

export function getRoleByRoleAccessMatrix(): Array<Record<string, string>> {
  return ROLE_ACCESS_SUMMARY.map((item) => ({
    role: ROLE_DISPLAY_NAMES[item.role],
    focus: item.focus.join(', '),
    sharedScreens: item.sharedScreens.map((screen) => SHARED_SCREEN_DEFINITIONS[screen].label).join(', '),
    separateScreens: item.separateScreens.join(', ') || 'None',
  }));
}

export function getRolePermissionSummary(): Array<Record<string, string>> {
  return ROLE_PERMISSION_MATRIX.map((item) => ({
    role: item.label,
    description: item.description,
    permissionCount: String(item.permissions.length),
    keyPermissions: item.permissions.slice(0, 8).join(', '),
    sharedScreens: item.sharedScreens.map((screen) => SHARED_SCREEN_DEFINITIONS[screen].label).join(', '),
    separateScreens: item.separateScreens.join(', ') || 'None',
  }));
}

export function getScreenRoleBreakdown(): ScreenRoleBreakdownRow[] {
  return Object.entries(SCREEN_RBAC_MATRIX).flatMap(([screen, roleMap]) => {
    const screenKey = screen as AppScreenKey;
    const definition = SHARED_SCREEN_DEFINITIONS[screenKey];

    return Object.entries(roleMap).map(([role, experience]) => {
      const resolvedRole = role as Role;
      return {
        screen: screenKey,
        screenLabel: definition.label,
        role: resolvedRole,
        roleLabel: ROLE_DISPLAY_NAMES[resolvedRole],
        access: experience.access,
        scope: experience.scope,
        backendScope: experience.backendScope,
        sees: experience.sees,
        does: experience.does,
        tabs: experience.tabs || [],
        filters: experience.filters || [],
        widgets: experience.widgets || [],
        quickActions: experience.quickActions || [],
        tableColumns: TABLE_COLUMN_MATRIX[screenKey]?.[resolvedRole] || [],
        hiddenByRole: definition.hiddenFor.includes(resolvedRole),
        readOnly: definition.readOnlyFor.includes(resolvedRole) || experience.access === 'read_only' || experience.access === 'inspect_only',
      };
    });
  });
}

export function getNavigationBlueprintSummary(): Array<Record<string, string>> {
  return ROLE_NAVIGATION_BLUEPRINT.map((item) => ({
    role: item.label,
    sections: item.sections.map((section) => `${section.title}: ${section.routes.join(', ')}`).join(' | '),
  }));
}
