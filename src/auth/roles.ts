/**
 * Role-Based Access Control (RBAC) - Role Definitions
 * 
 * Defines all roles supported by the MyChama platform.
 * Roles are hierarchical and map to backend MembershipRole enum.
 */

export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  CHAMA_ADMIN = 'CHAMA_ADMIN',
  TREASURER = 'TREASURER',
  SECRETARY = 'SECRETARY',
  AUDITOR = 'AUDITOR',
  MEMBER = 'MEMBER',
}

/**
 * Role hierarchy - higher roles inherit permissions from lower roles
 * Order matters: first entry is highest privilege
 */
export const ROLE_HIERARCHY: Role[] = [
  Role.SUPERADMIN,
  Role.ADMIN,
  Role.CHAMA_ADMIN,
  Role.TREASURER,
  Role.SECRETARY,
  Role.AUDITOR,
  Role.MEMBER,
];

/**
 * Role display names for UI
 */
export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [Role.SUPERADMIN]: 'Super Admin',
  [Role.ADMIN]: 'Admin',
  [Role.CHAMA_ADMIN]: 'Chama Admin',
  [Role.TREASURER]: 'Treasurer',
  [Role.SECRETARY]: 'Secretary',
  [Role.AUDITOR]: 'Auditor',
  [Role.MEMBER]: 'Member',
};

/**
 * Role descriptions for UI
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.SUPERADMIN]: 'Platform-wide oversight for users, chamas, providers, risk, jobs, and system operations.',
  [Role.ADMIN]: 'Platform operations and support access for moderation, disputes, tickets, and delivery issues.',
  [Role.CHAMA_ADMIN]: 'Full leadership access for one chama across members, approvals, governance, finance, and reports.',
  [Role.TREASURER]: 'Finance operations access for collections, reconciliation, expenses, withdrawals, loans, and reports.',
  [Role.SECRETARY]: 'Meetings, attendance, records, announcements, and member communication access for one chama.',
  [Role.AUDITOR]: 'Read-only oversight for finance, governance, history, compliance, and audit trails.',
  [Role.MEMBER]: 'Self-service access for contributions, loans, meetings, announcements, profile, and support.',
};

/**
 * Check if a role is at least as privileged as another role
 */
export function isRoleAtLeast(userRole: Role, requiredRole: Role): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  
  if (userIndex === -1 || requiredIndex === -1) {
    return false;
  }
  
  return userIndex <= requiredIndex;
}

/**
 * Check if user has exactly the specified role
 */
export function hasExactRole(userRole: Role, targetRole: Role): boolean {
  return userRole === targetRole;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRole: Role, roles: Role[]): boolean {
  return roles.includes(userRole);
}

/**
 * Get all roles that are at least as privileged as the given role
 */
export function getRolesAtLeast(role: Role): Role[] {
  const index = ROLE_HIERARCHY.indexOf(role);
  if (index === -1) {
    return [];
  }
  return ROLE_HIERARCHY.slice(0, index + 1);
}

/**
 * Parse role string to Role enum
 */
export function parseRole(roleString: string | null | undefined): Role | null {
  if (!roleString) return null;
  
  const normalized = roleString.toUpperCase() as Role;
  if (Object.values(Role).includes(normalized)) {
    return normalized;
  }
  return null;
}
