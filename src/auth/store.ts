/**
 * Authorization Store
 * 
 * Manages user roles and permissions state.
 * Provides centralized authorization checks.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Role, parseRole, isRoleAtLeast, hasAnyRole } from './roles';
import { Permission, roleHasPermission, roleHasAnyPermission, roleHasAllPermissions } from './permissions';
import { zustandStorage } from '@/utils/storage';

interface MembershipInfo {
  chamaId: string;
  chamaName: string;
  role: Role;
  isActive: boolean;
  isApproved: boolean;
}

interface AuthState {
  // User's global role (if any)
  globalRole: Role | null;
  
  // User's memberships with roles per chama
  memberships: MembershipInfo[];
  
  // Currently active chama context
  activeChamaId: string | null;
  
  // Cached permissions for active chama
  activePermissions: Permission[];
  
  // Actions
  setGlobalRole: (role: Role | null) => void;
  setMemberships: (memberships: MembershipInfo[]) => void;
  setActiveChama: (chamaId: string | null) => void;
  updateActivePermissions: () => void;
  clearAuth: () => void;
  
  // Authorization checks
  hasRole: (role: Role, chamaId?: string) => boolean;
  hasAnyRole: (roles: Role[], chamaId?: string) => boolean;
  isRoleAtLeast: (role: Role, chamaId?: string) => boolean;
  hasPermission: (permission: Permission, chamaId?: string) => boolean;
  hasAnyPermission: (permissions: Permission[], chamaId?: string) => boolean;
  hasAllPermissions: (permissions: Permission[], chamaId?: string) => boolean;
  getActiveRole: (chamaId?: string) => Role | null;
  getMembership: (chamaId: string) => MembershipInfo | null;
  canAccessFeature: (feature: string, chamaId?: string) => boolean;
}

export const useAuthzStore = create<AuthState>()(
  persist(
    (set, get) => ({
      globalRole: null,
      memberships: [],
      activeChamaId: null,
      activePermissions: [],
      
      setGlobalRole: (role) => {
        set({ globalRole: role });
        get().updateActivePermissions();
      },
      
      setMemberships: (memberships) => {
        set({ memberships });
        get().updateActivePermissions();
      },
      
      setActiveChama: (chamaId) => {
        set({ activeChamaId: chamaId });
        get().updateActivePermissions();
      },
      
      updateActivePermissions: () => {
        const { globalRole, memberships, activeChamaId } = get();
        
        // If user has global role, use those permissions
        if (globalRole) {
          const permissions = Object.values(Permission).filter(p => 
            roleHasPermission(globalRole, p)
          );
          set({ activePermissions: permissions });
          return;
        }
        
        // Otherwise, get permissions from active chama membership
        if (activeChamaId) {
          const membership = memberships.find(m => m.chamaId === activeChamaId);
          if (membership && membership.isActive && membership.isApproved) {
            const permissions = Object.values(Permission).filter(p => 
              roleHasPermission(membership.role, p)
            );
            set({ activePermissions: permissions });
            return;
          }
        }
        
        // No valid role found
        set({ activePermissions: [] });
      },
      
      clearAuth: () => {
        set({
          globalRole: null,
          memberships: [],
          activeChamaId: null,
          activePermissions: [],
        });
      },
      
      hasRole: (role, chamaId) => {
        const { globalRole, memberships } = get();
        
        // Check global role first
        if (globalRole) {
          return globalRole === role;
        }
        
        // Check chama-specific role
        const targetChamaId = chamaId || get().activeChamaId;
        if (!targetChamaId) return false;
        
        const membership = memberships.find(m => m.chamaId === targetChamaId);
        return membership?.role === role && membership.isActive && membership.isApproved;
      },
      
      hasAnyRole: (roles, chamaId) => {
        const { globalRole, memberships } = get();
        
        if (globalRole) {
          return roles.includes(globalRole);
        }
        
        const targetChamaId = chamaId || get().activeChamaId;
        if (!targetChamaId) return false;
        
        const membership = memberships.find(m => m.chamaId === targetChamaId);
        return membership ? roles.includes(membership.role) && membership.isActive && membership.isApproved : false;
      },
      
      isRoleAtLeast: (role, chamaId) => {
        const { globalRole, memberships } = get();
        
        if (globalRole) {
          return isRoleAtLeast(globalRole, role);
        }
        
        const targetChamaId = chamaId || get().activeChamaId;
        if (!targetChamaId) return false;
        
        const membership = memberships.find(m => m.chamaId === targetChamaId);
        if (!membership || !membership.isActive || !membership.isApproved) return false;
        
        return isRoleAtLeast(membership.role, role);
      },
      
      hasPermission: (permission, chamaId) => {
        const { globalRole, memberships } = get();
        
        // Check global role
        if (globalRole) {
          return roleHasPermission(globalRole, permission);
        }
        
        // Check chama-specific role
        const targetChamaId = chamaId || get().activeChamaId;
        if (!targetChamaId) return false;
        
        const membership = memberships.find(m => m.chamaId === targetChamaId);
        if (!membership || !membership.isActive || !membership.isApproved) return false;
        
        return roleHasPermission(membership.role, permission);
      },
      
      hasAnyPermission: (permissions, chamaId) => {
        return permissions.some(p => get().hasPermission(p, chamaId));
      },
      
      hasAllPermissions: (permissions, chamaId) => {
        return permissions.every(p => get().hasPermission(p, chamaId));
      },
      
      getActiveRole: (chamaId) => {
        const { globalRole, memberships } = get();
        
        if (globalRole) return globalRole;
        
        const targetChamaId = chamaId || get().activeChamaId;
        if (!targetChamaId) return null;
        
        const membership = memberships.find(m => m.chamaId === targetChamaId);
        return membership?.role || null;
      },
      
      getMembership: (chamaId) => {
        return get().memberships.find(m => m.chamaId === chamaId) || null;
      },
      
      canAccessFeature: (feature, chamaId) => {
        const featurePermissionMap: Record<string, Permission[]> = {
          'chama_settings': [Permission.CAN_MANAGE_CHAMA_SETTINGS],
          'invite_members': [Permission.CAN_INVITE_MEMBERS],
          'manage_members': [Permission.CAN_VIEW_MEMBERS, Permission.CAN_REMOVE_MEMBERS],
          'assign_roles': [Permission.CAN_ASSIGN_ROLES],
          'approve_members': [Permission.CAN_APPROVE_MEMBERS],
          'record_contributions': [Permission.CAN_RECORD_CONTRIBUTIONS],
          'view_all_contributions': [Permission.CAN_VIEW_ALL_CONTRIBUTIONS],
          'approve_loans': [Permission.CAN_APPROVE_LOAN],
          'disburse_loans': [Permission.CAN_DISBURSE_LOAN],
          'manage_loan_products': [Permission.CAN_MANAGE_LOAN_PRODUCTS],
          'manage_contribution_types': [Permission.CAN_MANAGE_CONTRIBUTION_TYPES],
          'issue_penalties': [Permission.CAN_ISSUE_PENALTY],
          'close_month': [Permission.CAN_CLOSE_MONTH],
          'make_adjustments': [Permission.CAN_MAKE_ADJUSTMENTS],
          'create_meetings': [Permission.CAN_CREATE_MEETINGS],
          'edit_meetings': [Permission.CAN_EDIT_MEETINGS],
          'delete_meetings': [Permission.CAN_DELETE_MEETINGS],
          'record_minutes': [Permission.CAN_RECORD_MINUTES],
          'approve_minutes': [Permission.CAN_APPROVE_MINUTES],
          'record_attendance': [Permission.CAN_RECORD_ATTENDANCE],
          'send_announcements': [Permission.CAN_SEND_ANNOUNCEMENTS],
          'export_data': [Permission.CAN_EXPORT_DATA],
          'admin_tools': [Permission.CAN_ACCESS_ADMIN_TOOLS],
          'ai_assistant': [Permission.CAN_USE_AI_ASSISTANT],
        };
        
        const requiredPermissions = featurePermissionMap[feature];
        if (!requiredPermissions) return true; // Feature not restricted
        
        return get().hasAnyPermission(requiredPermissions, chamaId);
      },
    }),
    {
      name: 'authz-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
