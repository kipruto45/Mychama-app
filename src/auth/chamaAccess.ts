import { Permission, roleHasPermission } from './permissions';
import { Role } from './roles';

export interface ChamaAccessMembership {
  chamaId: string;
  role: Role;
  isActive: boolean;
  isApproved: boolean;
}

export interface ChamaAccessContext {
  globalRole: Role | null;
  activeChamaId: string | null;
  memberships: ChamaAccessMembership[];
}

function getEligibleMemberships(memberships: ChamaAccessMembership[]) {
  return memberships.filter((membership) => membership.isActive && membership.isApproved);
}

export function needsChamaSetup(context: ChamaAccessContext): boolean {
  const { globalRole, memberships } = context;

  // Platform-wide administrators do not need to create or join a chama
  if (globalRole && [Role.SUPERADMIN, Role.ADMIN].includes(globalRole)) {
    return false;
  }

  // If user has any eligible membership in a chama, no setup needed
  return getEligibleMemberships(memberships).length === 0;
}

export function canCreateChama(context: ChamaAccessContext): boolean {
  if (context.globalRole) {
    return roleHasPermission(context.globalRole, Permission.CAN_CREATE_CHAMA);
  }

  const eligibleMemberships = getEligibleMemberships(context.memberships);

  // Brand-new verified users need to create their first chama before any
  // membership-based permissions can exist.
  if (eligibleMemberships.length === 0) {
    return true;
  }

  const scopedMemberships = context.activeChamaId
    ? eligibleMemberships.filter((membership) => membership.chamaId === context.activeChamaId)
    : eligibleMemberships;

  const membershipsToCheck = scopedMemberships.length > 0 ? scopedMemberships : eligibleMemberships;

  return membershipsToCheck.some((membership) =>
    roleHasPermission(membership.role, Permission.CAN_CREATE_CHAMA)
  );
}
