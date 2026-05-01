/**
 * Authentication and Authorization Guards
 * 
 * Provides reusable guard components for protecting screens and features.
 * All guards check backend-authenticated user data.
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthzStore } from './store';
import { canCreateChama, needsChamaSetup } from './chamaAccess';
import { Role } from './roles';
import { Permission } from './permissions';

// ============================================================================
// TYPES
// ============================================================================

interface GuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}

interface RequireAuthProps extends GuardProps {
  isAuthenticated: boolean;
  isLoading?: boolean;
}

interface RequireRoleProps extends GuardProps {
  role: Role | Role[];
  chamaId?: string;
  requireAll?: boolean;
}

interface RequirePermissionProps extends GuardProps {
  permission: Permission | Permission[];
  chamaId?: string;
  requireAll?: boolean;
}

interface RequireFeatureProps extends GuardProps {
  feature: string;
  chamaId?: string;
}

// ============================================================================
// DEFAULT FALLBACK COMPONENTS
// ============================================================================

const UnauthorizedFallback: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Access Denied</Text>
    <Text style={styles.message}>
      You do not have permission to access this feature.
    </Text>
  </View>
);

const UnauthenticatedFallback: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Authentication Required</Text>
    <Text style={styles.message}>
      Please sign in to access this feature.
    </Text>
  </View>
);

const LoadingFallback: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.message}>Loading...</Text>
  </View>
);

// ============================================================================
// GUARD COMPONENTS
// ============================================================================

/**
 * RequireAuth Guard
 * Ensures user is authenticated before rendering children
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  isAuthenticated,
  isLoading = false,
  fallback = <UnauthenticatedFallback />,
  loading = <LoadingFallback />,
}) => {
  if (isLoading) {
    return <>{loading}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * RequireRole Guard
 * Ensures user has required role(s) before rendering children
 */
export const RequireRole: React.FC<RequireRoleProps> = ({
  children,
  role,
  chamaId,
  requireAll = false,
  fallback = <UnauthorizedFallback />,
}) => {
  const { hasRole, hasAnyRole } = useAuthzStore();

  const roles = Array.isArray(role) ? role : [role];
  
  const hasAccess = requireAll
    ? roles.every(r => hasRole(r, chamaId))
    : hasAnyRole(roles, chamaId);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * RequirePermission Guard
 * Ensures user has required permission(s) before rendering children
 */
export const RequirePermission: React.FC<RequirePermissionProps> = ({
  children,
  permission,
  chamaId,
  requireAll = false,
  fallback = <UnauthorizedFallback />,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuthzStore();

  const permissions = Array.isArray(permission) ? permission : [permission];
  
  const hasAccess = requireAll
    ? hasAllPermissions(permissions, chamaId)
    : hasAnyPermission(permissions, chamaId);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * RequireAnyPermission Guard
 * Ensures user has at least one of the required permissions
 */
export const RequireAnyPermission: React.FC<RequirePermissionProps> = ({
  children,
  permission,
  chamaId,
  fallback = <UnauthorizedFallback />,
}) => {
  const { hasAnyPermission } = useAuthzStore();

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = hasAnyPermission(permissions, chamaId);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * RequireFeature Guard
 * Ensures user can access a specific feature
 */
export const RequireFeature: React.FC<RequireFeatureProps> = ({
  children,
  feature,
  chamaId,
  fallback = <UnauthorizedFallback />,
}) => {
  const { canAccessFeature } = useAuthzStore();

  if (!canAccessFeature(feature, chamaId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * RequireMinRole Guard
 * Ensures user has at least the specified role level
 */
export const RequireMinRole: React.FC<{
  children: ReactNode;
  minRole: Role;
  chamaId?: string;
  fallback?: ReactNode;
}> = ({
  children,
  minRole,
  chamaId,
  fallback = <UnauthorizedFallback />,
}) => {
  const { isRoleAtLeast } = useAuthzStore();

  if (!isRoleAtLeast(minRole, chamaId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// HOOK-BASED GUARDS
// ============================================================================

/**
 * Hook to check if user can perform an action
 */
export function useCanPerformAction(
  permission: Permission | Permission[],
  chamaId?: string
): boolean {
  const { hasAnyPermission } = useAuthzStore();
  const permissions = Array.isArray(permission) ? permission : [permission];
  return hasAnyPermission(permissions, chamaId);
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(
  role: Role | Role[],
  chamaId?: string
): boolean {
  const { hasAnyRole } = useAuthzStore();
  const roles = Array.isArray(role) ? role : [role];
  return hasAnyRole(roles, chamaId);
}

/**
 * Hook to check if user can access a feature
 */
export function useCanAccessFeature(
  feature: string,
  chamaId?: string
): boolean {
  const { canAccessFeature } = useAuthzStore();
  return canAccessFeature(feature, chamaId);
}

/**
 * Hook to get current user's role in a chama
 */
export function useActiveRole(chamaId?: string): Role | null {
  const { getActiveRole } = useAuthzStore();
  return getActiveRole(chamaId);
}

export function useCanCreateChama(): boolean {
  const globalRole = useAuthzStore((state) => state.globalRole);
  const memberships = useAuthzStore((state) => state.memberships);
  const activeChamaId = useAuthzStore((state) => state.activeChamaId);

  return canCreateChama({
    globalRole,
    memberships,
    activeChamaId,
  });
}

export function useNeedsChamaSetup(): boolean {
  const globalRole = useAuthzStore((state) => state.globalRole);
  const memberships = useAuthzStore((state) => state.memberships);
  const activeChamaId = useAuthzStore((state) => state.activeChamaId);

  return needsChamaSetup({
    globalRole,
    memberships,
    activeChamaId,
  });
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
