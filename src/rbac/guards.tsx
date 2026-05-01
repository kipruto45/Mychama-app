import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Permission } from '@/auth/permissions';
import { useActiveRole, useCanPerformAction } from '@/auth/guards';
import { Role, ROLE_DISPLAY_NAMES } from '@/auth/roles';
import { colors, spacing, typography } from '@/theme';
import { AppScreenKey, canRoleAccessScreen, getScreenExperience } from './screenMatrix';
import {
  AppRouteName,
  formatRBACLabel,
  getRoutePermissions,
  getRoleQuickActions,
  getRoleVisibleColumns,
  getRoleVisibleFilters,
  getRoleVisibleTabs,
  getRoleVisibleWidgets,
  getScreenDataScope,
  getScreenFromRoute,
  isReadOnlyAccess,
  isSelfServiceAccess,
} from './pageHelpers';

const AccessDeniedCard = ({ title, description }: { title: string; description: string }) => (
  <View style={styles.fallbackCard}>
    <Text style={styles.fallbackTitle}>{title}</Text>
    <Text style={styles.fallbackText}>{description}</Text>
  </View>
);

export const RequireScreenAccess: React.FC<{
  screen: AppScreenKey;
  chamaId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ screen, chamaId, children, fallback }) => {
  const activeRole = useActiveRole(chamaId) || Role.MEMBER;

  if (!canRoleAccessScreen(screen, activeRole)) {
    return (
      <>
        {fallback || (
          <AccessDeniedCard
            title="Access denied"
            description={`${ROLE_DISPLAY_NAMES[activeRole]} does not have access to this screen in the current workspace.`}
          />
        )}
      </>
    );
  }

  return <>{children}</>;
};

export const RequireRouteAccess: React.FC<{
  route: AppRouteName;
  chamaId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ route, chamaId, children, fallback }) => {
  const screen = getScreenFromRoute(route);
  const permissions = getRoutePermissions(route);
  const hasPermission = useCanPerformAction(permissions, chamaId);

  if (permissions.length > 0 && !hasPermission) {
    return (
      <>
        {fallback || (
          <AccessDeniedCard
            title="Permission required"
            description="Your current role does not have the permission required to open this page."
          />
        )}
      </>
    );
  }

  return (
    <RequireScreenAccess screen={screen} chamaId={chamaId} fallback={fallback}>
      {children}
    </RequireScreenAccess>
  );
};

export const SectionGuard: React.FC<{
  when: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ when, children, fallback = null }) => (when ? <>{children}</> : <>{fallback}</>);

export const ActionGuard: React.FC<{
  permission: Permission | Permission[];
  chamaId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, chamaId, children, fallback = null }) => {
  const allowed = useCanPerformAction(permission, chamaId);
  return allowed ? <>{children}</> : <>{fallback}</>;
};

export const FieldGuard: React.FC<{
  editable: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ editable, children, fallback = null }) => (editable ? <>{children}</> : <>{fallback}</>);

export function useScreenRBAC(screen: AppScreenKey, chamaId?: string) {
  const role = useActiveRole(chamaId) || Role.MEMBER;
  const experience = getScreenExperience(screen, role);
  const accessLabel = formatRBACLabel(experience.access);
  const scopeLabel = formatRBACLabel(getScreenDataScope(screen, role));

  return {
    role,
    experience,
    visibleWidgets: getRoleVisibleWidgets(screen, role),
    visibleTabs: getRoleVisibleTabs(screen, role),
    visibleFilters: getRoleVisibleFilters(screen, role),
    visibleQuickActions: getRoleQuickActions(screen, role),
    visibleColumns: getRoleVisibleColumns(screen, role),
    dataScope: getScreenDataScope(screen, role),
    accessLabel,
    scopeLabel,
    isReadOnly: isReadOnlyAccess(experience.access),
    isSelfService: isSelfServiceAccess(experience.access),
  };
}

const styles = StyleSheet.create({
  fallbackCard: {
    margin: spacing[4],
    padding: spacing[5],
    borderRadius: 20,
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.error + '22',
  },
  fallbackTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    marginBottom: spacing[2],
  },
  fallbackText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
});
