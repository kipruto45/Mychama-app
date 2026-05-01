import { Role } from './roles';

/**
 * Role-Based Access Control (RBAC) - Permission Definitions
 * 
 * Defines all permissions supported by the MyChama platform.
 * Permissions are granular and map to backend permission classes.
 */

export enum Permission {
  // Chama Management
  CAN_VIEW_CHAMA = 'can_view_chama',
  CAN_EDIT_CHAMA = 'can_edit_chama',
  CAN_DELETE_CHAMA = 'can_delete_chama',
  CAN_MANAGE_CHAMA_SETTINGS = 'can_manage_chama_settings',
  
  // Member Management
  CAN_VIEW_MEMBERS = 'can_view_members',
  CAN_INVITE_MEMBERS = 'can_invite_members',
  CAN_REMOVE_MEMBERS = 'can_remove_members',
  CAN_ASSIGN_ROLES = 'can_assign_roles',
  CAN_APPROVE_MEMBERS = 'can_approve_members',
  CAN_SUSPEND_MEMBERS = 'can_suspend_members',
  
  // Finance Management
  CAN_VIEW_FINANCE = 'can_view_finance',
  CAN_VIEW_ALL_CONTRIBUTIONS = 'can_view_all_contributions',
  CAN_RECORD_CONTRIBUTIONS = 'can_record_contributions',
  CAN_VIEW_OWN_CONTRIBUTIONS = 'can_view_own_contributions',
  CAN_VIEW_ALL_LOANS = 'can_view_all_loans',
  CAN_REQUEST_LOAN = 'can_request_loan',
  CAN_APPROVE_LOAN = 'can_approve_loan',
  CAN_DISBURSE_LOAN = 'can_disburse_loan',
  CAN_VIEW_FINANCIAL_REPORTS = 'can_view_financial_reports',
  CAN_MANAGE_LOAN_PRODUCTS = 'can_manage_loan_products',
  CAN_MANAGE_CONTRIBUTION_TYPES = 'can_manage_contribution_types',
  CAN_ISSUE_PENALTY = 'can_issue_penalty',
  CAN_CLOSE_MONTH = 'can_close_month',
  CAN_MAKE_ADJUSTMENTS = 'can_make_adjustments',
  
  // Meeting Management
  CAN_VIEW_MEETINGS = 'can_view_meetings',
  CAN_CREATE_MEETINGS = 'can_create_meetings',
  CAN_EDIT_MEETINGS = 'can_edit_meetings',
  CAN_DELETE_MEETINGS = 'can_delete_meetings',
  CAN_RECORD_MINUTES = 'can_record_minutes',
  CAN_APPROVE_MINUTES = 'can_approve_minutes',
  CAN_RECORD_ATTENDANCE = 'can_record_attendance',
  
  // Notification Management
  CAN_VIEW_NOTIFICATIONS = 'can_view_notifications',
  CAN_MANAGE_NOTIFICATIONS = 'can_manage_notifications',
  CAN_SEND_ANNOUNCEMENTS = 'can_send_announcements',
  
  // Reports
  CAN_VIEW_REPORTS = 'can_view_reports',
  CAN_EXPORT_DATA = 'can_export_data',
  
  // AI Assistant
  CAN_USE_AI_ASSISTANT = 'can_use_ai_assistant',
  
  // Admin Tools
  CAN_ACCESS_ADMIN_TOOLS = 'can_access_admin_tools',
  
  // Profile
  CAN_VIEW_PROFILE = 'can_view_profile',
  CAN_EDIT_PROFILE = 'can_edit_profile',
  
  // Payments
  CAN_VIEW_PAYMENTS = 'can_view_payments',
  CAN_MAKE_PAYMENTS = 'can_make_payments',
  
  // Chama Creation
  CAN_CREATE_CHAMA = 'can_create_chama',
}

/**
 * Permission display names for UI
 */
export const PERMISSION_DISPLAY_NAMES: Record<Permission, string> = {
  [Permission.CAN_VIEW_CHAMA]: 'View Chama',
  [Permission.CAN_EDIT_CHAMA]: 'Edit Chama',
  [Permission.CAN_DELETE_CHAMA]: 'Delete Chama',
  [Permission.CAN_MANAGE_CHAMA_SETTINGS]: 'Manage Chama Settings',
  [Permission.CAN_VIEW_MEMBERS]: 'View Members',
  [Permission.CAN_INVITE_MEMBERS]: 'Invite Members',
  [Permission.CAN_REMOVE_MEMBERS]: 'Remove Members',
  [Permission.CAN_ASSIGN_ROLES]: 'Assign Roles',
  [Permission.CAN_APPROVE_MEMBERS]: 'Approve Members',
  [Permission.CAN_SUSPEND_MEMBERS]: 'Suspend Members',
  [Permission.CAN_VIEW_FINANCE]: 'View Finance',
  [Permission.CAN_VIEW_ALL_CONTRIBUTIONS]: 'View All Contributions',
  [Permission.CAN_RECORD_CONTRIBUTIONS]: 'Record Contributions',
  [Permission.CAN_VIEW_OWN_CONTRIBUTIONS]: 'View Own Contributions',
  [Permission.CAN_VIEW_ALL_LOANS]: 'View All Loans',
  [Permission.CAN_REQUEST_LOAN]: 'Request Loan',
  [Permission.CAN_APPROVE_LOAN]: 'Approve Loan',
  [Permission.CAN_DISBURSE_LOAN]: 'Disburse Loan',
  [Permission.CAN_VIEW_FINANCIAL_REPORTS]: 'View Financial Reports',
  [Permission.CAN_MANAGE_LOAN_PRODUCTS]: 'Manage Loan Products',
  [Permission.CAN_MANAGE_CONTRIBUTION_TYPES]: 'Manage Contribution Types',
  [Permission.CAN_ISSUE_PENALTY]: 'Issue Penalty',
  [Permission.CAN_CLOSE_MONTH]: 'Close Month',
  [Permission.CAN_MAKE_ADJUSTMENTS]: 'Make Adjustments',
  [Permission.CAN_VIEW_MEETINGS]: 'View Meetings',
  [Permission.CAN_CREATE_MEETINGS]: 'Create Meetings',
  [Permission.CAN_EDIT_MEETINGS]: 'Edit Meetings',
  [Permission.CAN_DELETE_MEETINGS]: 'Delete Meetings',
  [Permission.CAN_RECORD_MINUTES]: 'Record Minutes',
  [Permission.CAN_APPROVE_MINUTES]: 'Approve Minutes',
  [Permission.CAN_RECORD_ATTENDANCE]: 'Record Attendance',
  [Permission.CAN_VIEW_NOTIFICATIONS]: 'View Notifications',
  [Permission.CAN_MANAGE_NOTIFICATIONS]: 'Manage Notifications',
  [Permission.CAN_SEND_ANNOUNCEMENTS]: 'Send Announcements',
  [Permission.CAN_VIEW_REPORTS]: 'View Reports',
  [Permission.CAN_EXPORT_DATA]: 'Export Data',
  [Permission.CAN_USE_AI_ASSISTANT]: 'Use AI Assistant',
  [Permission.CAN_ACCESS_ADMIN_TOOLS]: 'Access Admin Tools',
  [Permission.CAN_VIEW_PROFILE]: 'View Profile',
  [Permission.CAN_EDIT_PROFILE]: 'Edit Profile',
  [Permission.CAN_VIEW_PAYMENTS]: 'View Payments',
  [Permission.CAN_MAKE_PAYMENTS]: 'Make Payments',
  [Permission.CAN_CREATE_CHAMA]: 'Create Chama',
};

/**
 * Role to Permissions Mapping
 * Maps each role to the set of permissions they have
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPERADMIN]: [
    Permission.CAN_VIEW_CHAMA,
    Permission.CAN_CREATE_CHAMA,
    Permission.CAN_EDIT_CHAMA,
    Permission.CAN_DELETE_CHAMA,
    Permission.CAN_MANAGE_CHAMA_SETTINGS,
    Permission.CAN_VIEW_MEMBERS,
    Permission.CAN_INVITE_MEMBERS,
    Permission.CAN_REMOVE_MEMBERS,
    Permission.CAN_ASSIGN_ROLES,
    Permission.CAN_APPROVE_MEMBERS,
    Permission.CAN_SUSPEND_MEMBERS,
    Permission.CAN_VIEW_FINANCE,
    Permission.CAN_VIEW_ALL_CONTRIBUTIONS,
    Permission.CAN_RECORD_CONTRIBUTIONS,
    Permission.CAN_VIEW_OWN_CONTRIBUTIONS,
    Permission.CAN_VIEW_ALL_LOANS,
    Permission.CAN_REQUEST_LOAN,
    Permission.CAN_APPROVE_LOAN,
    Permission.CAN_DISBURSE_LOAN,
    Permission.CAN_VIEW_FINANCIAL_REPORTS,
    Permission.CAN_MANAGE_LOAN_PRODUCTS,
    Permission.CAN_MANAGE_CONTRIBUTION_TYPES,
    Permission.CAN_ISSUE_PENALTY,
    Permission.CAN_CLOSE_MONTH,
    Permission.CAN_MAKE_ADJUSTMENTS,
    Permission.CAN_VIEW_MEETINGS,
    Permission.CAN_CREATE_MEETINGS,
    Permission.CAN_EDIT_MEETINGS,
    Permission.CAN_DELETE_MEETINGS,
    Permission.CAN_RECORD_MINUTES,
    Permission.CAN_APPROVE_MINUTES,
    Permission.CAN_RECORD_ATTENDANCE,
    Permission.CAN_VIEW_NOTIFICATIONS,
    Permission.CAN_MANAGE_NOTIFICATIONS,
    Permission.CAN_SEND_ANNOUNCEMENTS,
    Permission.CAN_VIEW_REPORTS,
    Permission.CAN_EXPORT_DATA,
    Permission.CAN_USE_AI_ASSISTANT,
    Permission.CAN_ACCESS_ADMIN_TOOLS,
    Permission.CAN_VIEW_PROFILE,
    Permission.CAN_EDIT_PROFILE,
    Permission.CAN_VIEW_PAYMENTS,
    Permission.CAN_MAKE_PAYMENTS,
  ],
  
  [Role.ADMIN]: [
    Permission.CAN_VIEW_CHAMA,
    Permission.CAN_VIEW_MEMBERS,
    Permission.CAN_VIEW_FINANCE,
    Permission.CAN_VIEW_ALL_CONTRIBUTIONS,
    Permission.CAN_VIEW_ALL_LOANS,
    Permission.CAN_VIEW_FINANCIAL_REPORTS,
    Permission.CAN_VIEW_MEETINGS,
    Permission.CAN_VIEW_NOTIFICATIONS,
    Permission.CAN_MANAGE_NOTIFICATIONS,
    Permission.CAN_VIEW_REPORTS,
    Permission.CAN_EXPORT_DATA,
    Permission.CAN_USE_AI_ASSISTANT,
    Permission.CAN_ACCESS_ADMIN_TOOLS,
    Permission.CAN_VIEW_PROFILE,
    Permission.CAN_EDIT_PROFILE,
    Permission.CAN_VIEW_PAYMENTS,
  ],
  
  [Role.CHAMA_ADMIN]: [
    Permission.CAN_VIEW_CHAMA,
    Permission.CAN_CREATE_CHAMA,
    Permission.CAN_EDIT_CHAMA,
    Permission.CAN_DELETE_CHAMA,
    Permission.CAN_MANAGE_CHAMA_SETTINGS,
    Permission.CAN_VIEW_MEMBERS,
    Permission.CAN_INVITE_MEMBERS,
    Permission.CAN_REMOVE_MEMBERS,
    Permission.CAN_ASSIGN_ROLES,
    Permission.CAN_APPROVE_MEMBERS,
    Permission.CAN_SUSPEND_MEMBERS,
    Permission.CAN_VIEW_FINANCE,
    Permission.CAN_VIEW_ALL_CONTRIBUTIONS,
    Permission.CAN_RECORD_CONTRIBUTIONS,
    Permission.CAN_VIEW_OWN_CONTRIBUTIONS,
    Permission.CAN_VIEW_ALL_LOANS,
    Permission.CAN_REQUEST_LOAN,
    Permission.CAN_APPROVE_LOAN,
    Permission.CAN_DISBURSE_LOAN,
    Permission.CAN_VIEW_FINANCIAL_REPORTS,
    Permission.CAN_MANAGE_LOAN_PRODUCTS,
    Permission.CAN_MANAGE_CONTRIBUTION_TYPES,
    Permission.CAN_ISSUE_PENALTY,
    Permission.CAN_CLOSE_MONTH,
    Permission.CAN_MAKE_ADJUSTMENTS,
    Permission.CAN_VIEW_MEETINGS,
    Permission.CAN_CREATE_MEETINGS,
    Permission.CAN_EDIT_MEETINGS,
    Permission.CAN_DELETE_MEETINGS,
    Permission.CAN_RECORD_MINUTES,
    Permission.CAN_APPROVE_MINUTES,
    Permission.CAN_RECORD_ATTENDANCE,
    Permission.CAN_VIEW_NOTIFICATIONS,
    Permission.CAN_MANAGE_NOTIFICATIONS,
    Permission.CAN_SEND_ANNOUNCEMENTS,
    Permission.CAN_VIEW_REPORTS,
    Permission.CAN_EXPORT_DATA,
    Permission.CAN_USE_AI_ASSISTANT,
    Permission.CAN_VIEW_PROFILE,
    Permission.CAN_EDIT_PROFILE,
    Permission.CAN_VIEW_PAYMENTS,
    Permission.CAN_MAKE_PAYMENTS,
  ],
  
  [Role.TREASURER]: [
    Permission.CAN_VIEW_CHAMA,
    Permission.CAN_VIEW_MEMBERS,
    Permission.CAN_VIEW_FINANCE,
    Permission.CAN_VIEW_ALL_CONTRIBUTIONS,
    Permission.CAN_RECORD_CONTRIBUTIONS,
    Permission.CAN_VIEW_OWN_CONTRIBUTIONS,
    Permission.CAN_VIEW_ALL_LOANS,
    Permission.CAN_REQUEST_LOAN,
    Permission.CAN_APPROVE_LOAN,
    Permission.CAN_VIEW_FINANCIAL_REPORTS,
    Permission.CAN_MANAGE_LOAN_PRODUCTS,
    Permission.CAN_MANAGE_CONTRIBUTION_TYPES,
    Permission.CAN_ISSUE_PENALTY,
    Permission.CAN_CLOSE_MONTH,
    Permission.CAN_MAKE_ADJUSTMENTS,
    Permission.CAN_VIEW_MEETINGS,
    Permission.CAN_RECORD_ATTENDANCE,
    Permission.CAN_VIEW_NOTIFICATIONS,
    Permission.CAN_MANAGE_NOTIFICATIONS,
    Permission.CAN_VIEW_REPORTS,
    Permission.CAN_EXPORT_DATA,
    Permission.CAN_USE_AI_ASSISTANT,
    Permission.CAN_VIEW_PROFILE,
    Permission.CAN_EDIT_PROFILE,
    Permission.CAN_VIEW_PAYMENTS,
    Permission.CAN_MAKE_PAYMENTS,
  ],
  
  [Role.SECRETARY]: [
    Permission.CAN_VIEW_CHAMA,
    Permission.CAN_VIEW_MEMBERS,
    Permission.CAN_VIEW_ALL_CONTRIBUTIONS,
    Permission.CAN_VIEW_OWN_CONTRIBUTIONS,
    Permission.CAN_REQUEST_LOAN,
    Permission.CAN_VIEW_MEETINGS,
    Permission.CAN_CREATE_MEETINGS,
    Permission.CAN_EDIT_MEETINGS,
    Permission.CAN_DELETE_MEETINGS,
    Permission.CAN_RECORD_MINUTES,
    Permission.CAN_APPROVE_MINUTES,
    Permission.CAN_RECORD_ATTENDANCE,
    Permission.CAN_VIEW_NOTIFICATIONS,
    Permission.CAN_MANAGE_NOTIFICATIONS,
    Permission.CAN_SEND_ANNOUNCEMENTS,
    Permission.CAN_VIEW_REPORTS,
    Permission.CAN_USE_AI_ASSISTANT,
    Permission.CAN_VIEW_PROFILE,
    Permission.CAN_EDIT_PROFILE,
    Permission.CAN_MAKE_PAYMENTS,
  ],
  
  [Role.AUDITOR]: [
    Permission.CAN_VIEW_CHAMA,
    Permission.CAN_VIEW_MEMBERS,
    Permission.CAN_VIEW_FINANCE,
    Permission.CAN_VIEW_ALL_CONTRIBUTIONS,
    Permission.CAN_VIEW_OWN_CONTRIBUTIONS,
    Permission.CAN_VIEW_ALL_LOANS,
    Permission.CAN_VIEW_FINANCIAL_REPORTS,
    Permission.CAN_VIEW_MEETINGS,
    Permission.CAN_VIEW_NOTIFICATIONS,
    Permission.CAN_VIEW_REPORTS,
    Permission.CAN_EXPORT_DATA,
    Permission.CAN_USE_AI_ASSISTANT,
    Permission.CAN_VIEW_PROFILE,
    Permission.CAN_EDIT_PROFILE,
    Permission.CAN_VIEW_PAYMENTS,
  ],
  
  [Role.MEMBER]: [
    Permission.CAN_VIEW_CHAMA,
    Permission.CAN_VIEW_MEMBERS,
    Permission.CAN_VIEW_OWN_CONTRIBUTIONS,
    Permission.CAN_REQUEST_LOAN,
    Permission.CAN_VIEW_MEETINGS,
    Permission.CAN_VIEW_NOTIFICATIONS,
    Permission.CAN_VIEW_REPORTS,
    Permission.CAN_USE_AI_ASSISTANT,
    Permission.CAN_VIEW_PROFILE,
    Permission.CAN_EDIT_PROFILE,
    Permission.CAN_VIEW_PAYMENTS,
    Permission.CAN_MAKE_PAYMENTS,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function roleHasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => roleHasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function roleHasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => roleHasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
