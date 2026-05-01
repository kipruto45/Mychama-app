import type { ComponentType } from 'react';
import { Role } from '@/auth/roles';
import * as SuperAdminScreens from './superadmin';
import * as AdminScreens from './admin';
import * as ChamaAdminScreens from './chamaAdmin';
import * as TreasurerScreens from './treasurer';
import * as SecretaryScreens from './secretary';
import * as AuditorScreens from './auditor';
import * as MemberScreens from './member';

export type RoleScreenModule = Record<string, ComponentType<any> | string>;

const ROLE_SCREEN_MODULES: Record<Role, RoleScreenModule> = {
  [Role.SUPERADMIN]: SuperAdminScreens as RoleScreenModule,
  [Role.ADMIN]: AdminScreens as RoleScreenModule,
  [Role.CHAMA_ADMIN]: ChamaAdminScreens as RoleScreenModule,
  [Role.TREASURER]: TreasurerScreens as RoleScreenModule,
  [Role.SECRETARY]: SecretaryScreens as RoleScreenModule,
  [Role.AUDITOR]: AuditorScreens as RoleScreenModule,
  [Role.MEMBER]: MemberScreens as RoleScreenModule,
};

export function getRoleScreenModule(role: Role): RoleScreenModule {
  return ROLE_SCREEN_MODULES[role] || ROLE_SCREEN_MODULES[Role.MEMBER];
}

export function getRoleScreenComponent(
  role: Role,
  screenName: string
): ComponentType<any> {
  const module = getRoleScreenModule(role);
  const component = module[screenName];

  if (typeof component === 'function') {
    return component as ComponentType<any>;
  }

  const fallback = ROLE_SCREEN_MODULES[Role.MEMBER][screenName];
  if (typeof fallback === 'function') {
    return fallback as ComponentType<any>;
  }

  throw new Error(`Role screen "${screenName}" was not found for role "${role}".`);
}
