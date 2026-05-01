/**
 * Authentication and Authorization Module
 * 
 * Central export point for all auth-related functionality.
 */

// Roles
export {
  Role,
  ROLE_HIERARCHY,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
  isRoleAtLeast,
  hasExactRole,
  hasAnyRole,
  getRolesAtLeast,
  parseRole,
} from './roles';

// Permissions
export {
  Permission,
  PERMISSION_DISPLAY_NAMES,
  ROLE_PERMISSIONS,
  roleHasPermission,
  roleHasAnyPermission,
  roleHasAllPermissions,
  getPermissionsForRole,
} from './permissions';

// Store
export { useAuthzStore } from './store';

// Guards
export {
  RequireAuth,
  RequireRole,
  RequirePermission,
  RequireAnyPermission,
  RequireFeature,
  RequireMinRole,
  useCanPerformAction,
  useHasRole,
  useCanAccessFeature,
  useActiveRole,
} from './guards';
