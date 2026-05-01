import { Permission } from '@/auth/permissions';
import { Role } from '@/auth/roles';
import { SharedPageId, SHARED_PAGE_ARCHITECTURE } from '@/config/sharedPageArchitecture';
import { AppScreenKey, SCREEN_RBAC_MATRIX, ScreenRoleExperience } from './screenMatrix';

export const ROUTE_SCREEN_MAP = {
  Dashboard: 'dashboard',
  Chamas: 'chamas_list',
  ChamaDetail: 'chama_details',
  MemberList: 'members',
  ContributionCompliance: 'contributions',
  Payments: 'payments',
  LoanApplications: 'loans',
  Meetings: 'meetings',
  Governance: 'governance',
  AnnouncementsFeed: 'announcements',
  Notifications: 'notifications',
  ReportsHub: 'reports',
  Profile: 'profile',
  Settings: 'settings',
  SupportIssues: 'support',
  AIChat: 'ai_assistant',
} as const;

export type AppRouteName = keyof typeof ROUTE_SCREEN_MAP;

export const SCREEN_TO_SHARED_PAGE: Partial<Record<AppScreenKey, SharedPageId>> = {
  dashboard: 'dashboard',
  chamas_list: 'chamas',
  chama_details: 'chamaDetails',
  members: 'members',
  contributions: 'contributions',
  payments: 'payments',
  loans: 'loans',
  meetings: 'meetings',
  governance: 'governance',
  announcements: 'announcements',
  notifications: 'notifications',
  reports: 'reports',
  profile: 'profile',
  settings: 'settings',
  support: 'support',
  ai_assistant: 'aiAssistant',
};

export const TABLE_COLUMN_MATRIX: Partial<Record<AppScreenKey, Record<Role, string[]>>> = {
  members: {
    [Role.SUPERADMIN]: ['Name', 'Role', 'Status', 'Join date', 'Last active', 'Risk'],
    [Role.ADMIN]: ['Name', 'Role', 'Status', 'Case flags', 'Last active'],
    [Role.CHAMA_ADMIN]: ['Name', 'Role', 'Status', 'Join date', 'Approvals', 'Last active', 'Actions'],
    [Role.TREASURER]: ['Name', 'Role', 'Dues status', 'Savings', 'Loan balance', 'Fine balance'],
    [Role.SECRETARY]: ['Name', 'Role', 'Attendance', 'Last meeting', 'Communication'],
    [Role.AUDITOR]: ['Name', 'Role', 'Status', 'Compliance', 'History'],
    [Role.MEMBER]: ['Name', 'Role', 'Join date'],
  },
  contributions: {
    [Role.SUPERADMIN]: ['Chama', 'Member', 'Amount', 'Status', 'Created'],
    [Role.ADMIN]: ['Chama', 'Member', 'Amount', 'Status', 'Issue'],
    [Role.CHAMA_ADMIN]: ['Member', 'Contribution type', 'Amount', 'Status', 'Due date'],
    [Role.TREASURER]: ['Member', 'Contribution type', 'Amount', 'Status', 'Method', 'Verifier'],
    [Role.SECRETARY]: ['Member', 'Contribution type', 'Status', 'Due date'],
    [Role.AUDITOR]: ['Member', 'Amount', 'Status', 'Verifier', 'Updated'],
    [Role.MEMBER]: ['Contribution type', 'Amount', 'Status', 'Due date'],
  },
  payments: {
    [Role.SUPERADMIN]: ['Provider', 'Reference', 'Amount', 'Status', 'Created'],
    [Role.ADMIN]: ['Member', 'Reference', 'Amount', 'Status', 'Dispute'],
    [Role.CHAMA_ADMIN]: ['Member', 'Reference', 'Amount', 'Status', 'Exception'],
    [Role.TREASURER]: ['Member', 'Channel', 'Reference', 'Amount', 'Status', 'Verification', 'Reconciliation'],
    [Role.SECRETARY]: ['Member', 'Reference', 'Amount', 'Status', 'Purpose'],
    [Role.AUDITOR]: ['Member', 'Channel', 'Reference', 'Amount', 'Status', 'Verified by'],
    [Role.MEMBER]: ['Reference', 'Purpose', 'Amount', 'Status', 'Receipt'],
  },
  loans: {
    [Role.SUPERADMIN]: ['Borrower', 'Principal', 'Status', 'Risk', 'Chama'],
    [Role.ADMIN]: ['Borrower', 'Principal', 'Status', 'Escalation'],
    [Role.CHAMA_ADMIN]: ['Borrower', 'Principal', 'Status', 'Approvals', 'Recovery'],
    [Role.TREASURER]: ['Borrower', 'Principal', 'Status', 'Next repayment', 'Risk', 'Guarantors'],
    [Role.SECRETARY]: ['Borrower', 'Status', 'Next repayment'],
    [Role.AUDITOR]: ['Borrower', 'Principal', 'Status', 'Recovery', 'Exceptions'],
    [Role.MEMBER]: ['Principal', 'Status', 'Next repayment', 'Balance'],
  },
};

export function getScreenFromRoute(routeName: AppRouteName): AppScreenKey {
  return ROUTE_SCREEN_MAP[routeName];
}

export function getSharedPageFromScreen(screen: AppScreenKey): SharedPageId | null {
  return SCREEN_TO_SHARED_PAGE[screen] || null;
}

export function getRoutePermissions(routeName: AppRouteName): Permission[] {
  const screen = getScreenFromRoute(routeName);
  const sharedPageId = getSharedPageFromScreen(screen);
  if (!sharedPageId) {
    return [];
  }
  return SHARED_PAGE_ARCHITECTURE[sharedPageId].accessPermissions;
}

export function getRoleVisibleTabs(screen: AppScreenKey, role: Role): string[] {
  return SCREEN_RBAC_MATRIX[screen][role].tabs || [];
}

export function getRoleVisibleFilters(screen: AppScreenKey, role: Role): string[] {
  return SCREEN_RBAC_MATRIX[screen][role].filters || [];
}

export function getRoleQuickActions(screen: AppScreenKey, role: Role): string[] {
  return SCREEN_RBAC_MATRIX[screen][role].quickActions || [];
}

export function getRoleVisibleWidgets(screen: AppScreenKey, role: Role): string[] {
  return SCREEN_RBAC_MATRIX[screen][role].widgets || [];
}

export function getRoleVisibleColumns(screen: AppScreenKey, role: Role): string[] {
  return TABLE_COLUMN_MATRIX[screen]?.[role] || [];
}

export function getScreenDataScope(screen: AppScreenKey, role: Role): string {
  return SCREEN_RBAC_MATRIX[screen][role].backendScope;
}

export function getRoleScreenExperience(screen: AppScreenKey, role: Role): ScreenRoleExperience {
  return SCREEN_RBAC_MATRIX[screen][role];
}

export function formatRBACLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function isReadOnlyAccess(access: ScreenRoleExperience['access']): boolean {
  return access === 'read_only' || access === 'inspect_only';
}

export function isSelfServiceAccess(access: ScreenRoleExperience['access']): boolean {
  return access === 'self_service';
}
