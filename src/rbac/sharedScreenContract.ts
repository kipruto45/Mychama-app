import { Role, ROLE_DISPLAY_NAMES } from '@/auth/roles';
import { SHARED_SCREEN_DEFINITIONS } from './architecture';
import { TABLE_COLUMN_MATRIX } from './pageHelpers';
import { AppScreenKey, SCREEN_RBAC_MATRIX, ScreenRoleExperience } from './screenMatrix';

export interface ScreenRoleContract {
  screen: AppScreenKey;
  role: Role;
  roleLabel: string;
  visible: boolean;
  hidden: boolean;
  readOnly: boolean;
  access: ScreenRoleExperience['access'];
  scope: ScreenRoleExperience['scope'];
  dataScope: ScreenRoleExperience['backendScope'];
  baseLayout: string[];
  visibleSections: string[];
  hiddenSections: string[];
  readOnlySections: string[];
  allowedActions: string[];
  blockedActions: string[];
  visibleData: string[];
  hiddenData: string[];
  widgets: string[];
  tabs: string[];
  filters: string[];
  tableColumns: string[];
}

type RoleStringMap = Partial<Record<Role, string[]>>;
type ScreenRoleStringMap = Partial<Record<AppScreenKey, RoleStringMap>>;

const GLOBAL_BLOCKED_ACTIONS: Record<Role, string[]> = {
  [Role.SUPERADMIN]: ['Run member self-service checkout', 'Use chama-only invite acceptance flows as a normal member'],
  [Role.ADMIN]: ['Assign chama member roles', 'Approve memberships', 'Suspend members', 'Remove members', 'Verify chama payments', 'Disburse loans', 'Edit chama governance', 'Manage platform provider secrets'],
  [Role.CHAMA_ADMIN]: ['Inspect provider credentials', 'Manage failed jobs', 'Operate across other chamas', 'Change platform-wide billing settings'],
  [Role.TREASURER]: ['Assign roles', 'Suspend members', 'Remove members', 'Finalize governance decisions', 'Disburse loans', 'Manage provider settings'],
  [Role.SECRETARY]: ['Verify payments', 'Approve loans', 'Approve withdrawals', 'Disburse loans', 'Close financial periods', 'Manage provider settings'],
  [Role.AUDITOR]: [
    'Create records',
    'Edit records',
    'Delete records',
    'Approve requests',
    'Verify payments',
    'Disburse loans',
    'Assign roles',
    'Suspend members',
    'Remove members',
    'Publish announcements',
  ],
  [Role.MEMBER]: [
    'Assign roles',
    'Suspend members',
    'Remove members',
    'Approve requests',
    'Verify payments',
    'Approve loans',
    'Disburse loans',
    'Access provider settings',
    'View platform operations',
  ],
};

const ROLE_VISIBLE_SECTION_HINTS: ScreenRoleStringMap = {
  dashboard: {
    [Role.MEMBER]: ['personal obligations', 'recent transactions', 'meeting preview'],
    [Role.SECRETARY]: ['meeting task queue', 'attendance trend cards', 'communication reminders'],
    [Role.TREASURER]: ['verification queue', 'liquidity cards', 'reconciliation alerts'],
    [Role.CHAMA_ADMIN]: ['approvals rail', 'chama health', 'governance alerts'],
    [Role.AUDITOR]: ['compliance summary', 'read-only review cards', 'audit alerts'],
    [Role.ADMIN]: ['support queue', 'moderation queue', 'delivery failures'],
    [Role.SUPERADMIN]: ['platform health', 'provider status', 'fraud and risk'],
  },
  chamas_list: {
    [Role.MEMBER]: ['joined chamas', 'current chama switcher'],
    [Role.SECRETARY]: ['meeting indicators', 'governance indicators'],
    [Role.TREASURER]: ['finance indicators', 'cash-position hints'],
    [Role.CHAMA_ADMIN]: ['admin shortcuts', 'health indicators'],
    [Role.AUDITOR]: ['review indicators'],
    [Role.ADMIN]: ['moderation indicators'],
    [Role.SUPERADMIN]: ['platform flags', 'activity trends'],
  },
  chama_details: {
    [Role.MEMBER]: ['rules section', 'announcements panel', 'own obligations'],
    [Role.SECRETARY]: ['meeting records', 'attendance', 'announcements'],
    [Role.TREASURER]: ['finance summary', 'loan summary', 'contribution view'],
    [Role.CHAMA_ADMIN]: ['members', 'policies', 'documents', 'activity timeline'],
    [Role.AUDITOR]: ['history', 'finance review', 'governance review'],
    [Role.ADMIN]: ['support context', 'moderation context'],
    [Role.SUPERADMIN]: ['system metadata', 'inspection context'],
  },
  members: {
    [Role.MEMBER]: ['basic member directory'],
    [Role.SECRETARY]: ['participation summary', 'attendance profile', 'communication panel'],
    [Role.TREASURER]: ['financial profile', 'balances', 'loan exposure'],
    [Role.CHAMA_ADMIN]: ['lifecycle controls', 'role history', 'member summary'],
    [Role.AUDITOR]: ['history', 'compliance review'],
    [Role.ADMIN]: ['support case context'],
    [Role.SUPERADMIN]: ['platform identity review'],
  },
  contributions: {
    [Role.MEMBER]: ['own due list', 'own history'],
    [Role.SECRETARY]: ['reminder-support overview'],
    [Role.TREASURER]: ['compliance dashboard', 'member contribution breakdown'],
    [Role.CHAMA_ADMIN]: ['group compliance summary'],
    [Role.AUDITOR]: ['contribution review'],
    [Role.ADMIN]: ['operational inspection'],
    [Role.SUPERADMIN]: ['analytics inspection'],
  },
  finance: {
    [Role.TREASURER]: ['balance summary', 'cashflow', 'reserves', 'alerts'],
    [Role.CHAMA_ADMIN]: ['oversight summary', 'finance alerts'],
    [Role.AUDITOR]: ['read-only finance review', 'snapshots'],
    [Role.ADMIN]: ['platform support inspection'],
    [Role.SUPERADMIN]: ['platform finance inspection'],
  },
  payments: {
    [Role.MEMBER]: ['own receipts', 'own transaction history'],
    [Role.TREASURER]: ['verification queue', 'failures', 'receipt vault', 'manual operations'],
    [Role.CHAMA_ADMIN]: ['exceptions view', 'oversight receipts'],
    [Role.AUDITOR]: ['payment audit trail'],
    [Role.ADMIN]: ['dispute context'],
    [Role.SUPERADMIN]: ['provider issue context'],
  },
  loans: {
    [Role.MEMBER]: ['eligibility', 'request flow', 'repayment schedule'],
    [Role.TREASURER]: ['applications', 'active loans', 'risk dashboard', 'guarantor exposure'],
    [Role.CHAMA_ADMIN]: ['approval queue', 'recovery actions', 'portfolio summary'],
    [Role.AUDITOR]: ['loan review', 'recovery history'],
    [Role.ADMIN]: ['escalation cases'],
    [Role.SUPERADMIN]: ['platform risk trends'],
  },
  meetings: {
    [Role.MEMBER]: ['published records', 'attendance view'],
    [Role.SECRETARY]: ['agenda management', 'attendance management', 'minutes and resolutions'],
    [Role.CHAMA_ADMIN]: ['governance oversight', 'meeting management'],
    [Role.AUDITOR]: ['read-only governance records'],
  },
  governance: {
    [Role.MEMBER]: ['active motions', 'results archive'],
    [Role.SECRETARY]: ['records support'],
    [Role.CHAMA_ADMIN]: ['motion management', 'outcomes', 'archive'],
    [Role.AUDITOR]: ['decision history', 'read-only archive'],
  },
  announcements: {
    [Role.MEMBER]: ['published feed'],
    [Role.SECRETARY]: ['draft workspace', 'publish queue'],
    [Role.CHAMA_ADMIN]: ['composer', 'pinning controls'],
    [Role.TREASURER]: ['read-only feed'],
    [Role.AUDITOR]: ['read-only feed'],
  },
  notifications: {
    [Role.MEMBER]: ['personal feed', 'preference entry'],
    [Role.SECRETARY]: ['meeting reminders'],
    [Role.TREASURER]: ['finance alerts'],
    [Role.CHAMA_ADMIN]: ['operational alerts'],
    [Role.AUDITOR]: ['audit alerts'],
    [Role.ADMIN]: ['support alerts'],
    [Role.SUPERADMIN]: ['system alerts'],
  },
  reports: {
    [Role.MEMBER]: ['personal statements'],
    [Role.SECRETARY]: ['meeting and governance reports'],
    [Role.TREASURER]: ['finance and loan reports'],
    [Role.CHAMA_ADMIN]: ['operational report hub'],
    [Role.AUDITOR]: ['audit and compliance exports'],
    [Role.ADMIN]: ['operations reports'],
    [Role.SUPERADMIN]: ['platform analytics'],
  },
  profile: {
    [Role.MEMBER]: ['memberships', 'kyc status'],
    [Role.SECRETARY]: ['role summary'],
    [Role.TREASURER]: ['finance role summary'],
    [Role.CHAMA_ADMIN]: ['leadership role summary'],
    [Role.AUDITOR]: ['audit role summary'],
    [Role.ADMIN]: ['operations role summary'],
    [Role.SUPERADMIN]: ['platform role summary'],
  },
  settings: {
    [Role.MEMBER]: ['privacy', 'appearance', 'notifications', 'security'],
    [Role.SECRETARY]: ['reminder preferences'],
    [Role.TREASURER]: ['finance alert preferences'],
    [Role.CHAMA_ADMIN]: ['operational alert preferences'],
    [Role.AUDITOR]: ['review alert preferences'],
    [Role.ADMIN]: ['operations alert preferences'],
    [Role.SUPERADMIN]: ['platform alert preferences'],
  },
  support: {
    [Role.MEMBER]: ['own tickets', 'create ticket flow'],
    [Role.SECRETARY]: ['meeting and communication issue queue'],
    [Role.TREASURER]: ['finance issue queue'],
    [Role.CHAMA_ADMIN]: ['chama resolution queue'],
    [Role.AUDITOR]: ['issue history review'],
    [Role.ADMIN]: ['support and moderation queue'],
    [Role.SUPERADMIN]: ['platform escalation queue'],
  },
  ai_assistant: {
    [Role.MEMBER]: ['personal prompt starter', 'own chama insights'],
    [Role.SECRETARY]: ['meeting and communication prompts'],
    [Role.TREASURER]: ['finance and liquidity prompts'],
    [Role.CHAMA_ADMIN]: ['operations and health prompts'],
    [Role.AUDITOR]: ['audit and compliance prompts'],
    [Role.ADMIN]: ['support prompts'],
    [Role.SUPERADMIN]: ['platform prompts'],
  },
};

const ROLE_HIDDEN_SECTIONS: ScreenRoleStringMap = {
  dashboard: {
    [Role.MEMBER]: ['finance queues', 'admin action center', 'provider health'],
    [Role.SECRETARY]: ['liquidity', 'payment verification', 'provider health'],
    [Role.TREASURER]: ['moderation queue', 'governance editing rail', 'provider health'],
    [Role.CHAMA_ADMIN]: ['provider health', 'failed jobs', 'fraud console'],
    [Role.AUDITOR]: ['mutation toolbars', 'approval drawers'],
    [Role.ADMIN]: ['member self-service widgets', 'chama governance editing'],
    [Role.SUPERADMIN]: ['member self-service widgets'],
  },
  chamas_list: {
    [Role.MEMBER]: ['risk flags', 'moderation badges'],
    [Role.SECRETARY]: ['platform moderation badges', 'finance-only shortcuts'],
    [Role.TREASURER]: ['platform moderation badges', 'meeting authoring shortcuts'],
    [Role.CHAMA_ADMIN]: ['platform moderation badges'],
    [Role.AUDITOR]: ['edit shortcuts', 'join CTAs'],
  },
  chama_details: {
    [Role.MEMBER]: ['finance tab', 'settings tab', 'policy editor', 'documents management'],
    [Role.SECRETARY]: ['finance tab', 'loan actions', 'policy editor'],
    [Role.TREASURER]: ['role assignment', 'attendance management', 'policy editor'],
    [Role.CHAMA_ADMIN]: ['platform system metadata'],
    [Role.AUDITOR]: ['edit toolbar', 'approval drawers'],
    [Role.ADMIN]: ['member operations tabs', 'loan operations'],
    [Role.SUPERADMIN]: ['member self-service callouts'],
  },
  members: {
    [Role.MEMBER]: ['financial profile', 'audit history', 'role controls', 'lifecycle controls'],
    [Role.SECRETARY]: ['suspend and remove controls', 'financial adjustments'],
    [Role.TREASURER]: ['role assignment', 'suspend and remove controls'],
    [Role.AUDITOR]: ['all mutation controls'],
    [Role.ADMIN]: ['role assignment', 'suspend and remove controls'],
    [Role.SUPERADMIN]: ['chama-only action toolbar'],
  },
  contributions: {
    [Role.MEMBER]: ['group compliance dashboard', 'member breakdown', 'bulk follow-up'],
    [Role.SECRETARY]: ['financial adjustment actions', 'export controls'],
    [Role.AUDITOR]: ['mutation toolbar'],
  },
  finance: {
    [Role.AUDITOR]: ['edit drawer', 'close-period action bar'],
    [Role.ADMIN]: ['chama mutation forms'],
    [Role.SUPERADMIN]: ['chama mutation forms'],
  },
  payments: {
    [Role.MEMBER]: ['verification queue', 'reconciliation tools', 'manual entry'],
    [Role.CHAMA_ADMIN]: ['manual finance entry', 'deep reconciliation tools'],
    [Role.AUDITOR]: ['verification controls', 'manual entry'],
    [Role.ADMIN]: ['manual chama payment entry', 'chama verification actions'],
    [Role.SUPERADMIN]: ['manual chama payment entry'],
  },
  loans: {
    [Role.MEMBER]: ['approval queue', 'recovery workspace', 'write-off tools'],
    [Role.TREASURER]: ['role management context'],
    [Role.CHAMA_ADMIN]: ['disbursement internals if policy blocks it'],
    [Role.AUDITOR]: ['disbursement controls', 'approval buttons'],
    [Role.ADMIN]: ['chama approval toolbar'],
    [Role.SUPERADMIN]: ['chama approval toolbar'],
  },
  meetings: {
    [Role.MEMBER]: ['draft editors', 'attendance management', 'meeting cancellation'],
    [Role.TREASURER]: ['draft editors', 'attendance management'],
    [Role.AUDITOR]: ['draft editors', 'publish controls'],
    [Role.ADMIN]: ['meeting mutation tools'],
    [Role.SUPERADMIN]: ['meeting mutation tools'],
  },
  governance: {
    [Role.MEMBER]: ['create motion', 'finalize outcome', 'archive controls'],
    [Role.TREASURER]: ['finalize outcome toolbar'],
    [Role.AUDITOR]: ['all mutation controls'],
    [Role.ADMIN]: ['chama governance editing'],
    [Role.SUPERADMIN]: ['chama governance editing'],
  },
  announcements: {
    [Role.MEMBER]: ['composer panel', 'publish controls', 'pinning tools'],
    [Role.TREASURER]: ['composer panel', 'publish controls'],
    [Role.AUDITOR]: ['composer panel', 'publish controls'],
  },
  notifications: {
    [Role.MEMBER]: ['operational routing settings'],
    [Role.AUDITOR]: ['delivery reroute actions'],
  },
  reports: {
    [Role.MEMBER]: ['operational export center', 'audit categories', 'platform analytics'],
    [Role.SECRETARY]: ['finance analytics', 'loan risk'],
    [Role.TREASURER]: ['governance-only categories'],
    [Role.AUDITOR]: ['mutation and scheduling controls'],
    [Role.ADMIN]: ['chama-only report categories'],
    [Role.SUPERADMIN]: ['chama-only report categories'],
  },
  support: {
    [Role.MEMBER]: ['global support queue', 'resolution tools'],
    [Role.AUDITOR]: ['resolve toolbar', 'reply composer'],
  },
  ai_assistant: {
    [Role.MEMBER]: ['platform analytics prompts', 'member-to-member private data'],
    [Role.SECRETARY]: ['finance anomaly prompts'],
    [Role.TREASURER]: ['meeting attendance prompts'],
    [Role.AUDITOR]: ['mutation prompt suggestions'],
  },
};

const ROLE_HIDDEN_DATA: ScreenRoleStringMap = {
  members: {
    [Role.MEMBER]: ['member balances', 'loan exposure', 'fine balances', 'audit history', 'role change history'],
    [Role.SECRETARY]: ['member balances', 'loan exposure', 'fine balances'],
    [Role.TREASURER]: ['private moderation notes', 'disciplinary workflow state'],
    [Role.AUDITOR]: ['mutation affordances'],
  },
  chama_details: {
    [Role.MEMBER]: ['internal finance ledgers', 'draft governance records', 'policy edit state'],
    [Role.SECRETARY]: ['financial reserves', 'withdrawal pipeline'],
    [Role.TREASURER]: ['draft minutes authoring state'],
  },
  contributions: {
    [Role.MEMBER]: ['other members contribution details', 'compliance scoring internals'],
    [Role.SECRETARY]: ['adjustment metadata', 'verifier assignment'],
  },
  payments: {
    [Role.MEMBER]: ['other members payments', 'verification assignments', 'reconciliation notes'],
    [Role.AUDITOR]: ['write-only settlement notes'],
  },
  loans: {
    [Role.MEMBER]: ['other members loans', 'committee-only recovery notes'],
    [Role.SECRETARY]: ['loan risk scoring details'],
  },
  governance: {
    [Role.MEMBER]: ['draft motion moderation notes'],
    [Role.AUDITOR]: ['unpublished mutation state'],
  },
  announcements: {
    [Role.MEMBER]: ['draft and scheduled announcements'],
    [Role.TREASURER]: ['draft and scheduled announcements'],
    [Role.AUDITOR]: ['draft and scheduled announcements'],
  },
  reports: {
    [Role.MEMBER]: ['group finance report payloads', 'group audit payloads'],
  },
  ai_assistant: {
    [Role.MEMBER]: ['other members private finance', 'admin-only case metadata'],
    [Role.SECRETARY]: ['private finance anomalies beyond secretary scope'],
    [Role.TREASURER]: ['private attendance and disciplinary history beyond finance scope'],
    [Role.AUDITOR]: ['write-only workflow state'],
  },
};

const ROLE_READ_ONLY_SECTIONS: ScreenRoleStringMap = {
  dashboard: {
    [Role.AUDITOR]: ['all dashboard widgets', 'all dashboard quick actions'],
  },
  meetings: {
    [Role.MEMBER]: ['agenda', 'attendance', 'minutes', 'resolutions'],
    [Role.TREASURER]: ['agenda', 'attendance', 'minutes', 'resolutions'],
    [Role.AUDITOR]: ['agenda', 'attendance', 'minutes', 'resolutions'],
  },
  governance: {
    [Role.AUDITOR]: ['motion detail', 'archive', 'results'],
  },
  announcements: {
    [Role.MEMBER]: ['feed', 'details'],
    [Role.TREASURER]: ['feed', 'details'],
    [Role.AUDITOR]: ['feed', 'details'],
  },
  payments: {
    [Role.AUDITOR]: ['transactions table', 'receipt drawer', 'detail panel'],
    [Role.CHAMA_ADMIN]: ['transactions table', 'receipt drawer'],
  },
  members: {
    [Role.MEMBER]: ['member directory', 'profile preview'],
    [Role.AUDITOR]: ['members table', 'profile drawer', 'history'],
  },
};

const ROLE_ALLOWED_ACTION_OVERRIDES: ScreenRoleStringMap = {
  members: {
    [Role.CHAMA_ADMIN]: ['Assign roles', 'Suspend member', 'Remove member', 'Open role history'],
    [Role.TREASURER]: ['Open financial profile', 'Inspect loan exposure'],
    [Role.SECRETARY]: ['Open participation profile', 'Message member'],
    [Role.MEMBER]: ['Open limited member profile'],
  },
  contributions: {
    [Role.MEMBER]: ['Pay contribution', 'View contribution history'],
    [Role.TREASURER]: ['Record contribution', 'Export contribution report', 'Open due queue'],
    [Role.CHAMA_ADMIN]: ['Review compliance', 'Trigger follow-up'],
    [Role.SECRETARY]: ['Open reminder list'],
  },
  payments: {
    [Role.MEMBER]: ['Initiate payment', 'Retry failed payment', 'View receipt'],
    [Role.TREASURER]: ['Verify payment', 'Review proof', 'Resolve failure', 'Open reconciliation case'],
    [Role.CHAMA_ADMIN]: ['Review exception', 'Inspect receipt'],
    [Role.ADMIN]: ['Open dispute case'],
    [Role.SUPERADMIN]: ['Inspect provider issue'],
  },
  loans: {
    [Role.MEMBER]: ['Request loan', 'Repay loan', 'View schedule'],
    [Role.TREASURER]: ['Review application', 'Approve loan', 'Open recovery workflow'],
    [Role.CHAMA_ADMIN]: ['Approve loan', 'Review restructure', 'Review recovery action'],
    [Role.AUDITOR]: ['Open loan review'],
  },
  meetings: {
    [Role.SECRETARY]: ['Create meeting', 'Edit meeting', 'Record attendance', 'Draft minutes', 'Publish resolutions'],
    [Role.CHAMA_ADMIN]: ['Create meeting', 'Edit meeting', 'Cancel meeting'],
    [Role.MEMBER]: ['Open meeting details'],
  },
  governance: {
    [Role.MEMBER]: ['Vote', 'View results'],
    [Role.SECRETARY]: ['Open governance records'],
    [Role.CHAMA_ADMIN]: ['Create motion', 'Manage voting window', 'Finalize outcome'],
    [Role.AUDITOR]: ['Review archive'],
  },
  announcements: {
    [Role.SECRETARY]: ['Create announcement', 'Edit announcement', 'Publish announcement'],
    [Role.CHAMA_ADMIN]: ['Create announcement', 'Edit announcement', 'Publish announcement', 'Pin announcement'],
    [Role.MEMBER]: ['Open announcement details'],
  },
  notifications: {
    [Role.MEMBER]: ['Open linked item', 'Mark notification read', 'Manage reminders'],
    [Role.SECRETARY]: ['Open linked task', 'Manage reminder preferences'],
    [Role.TREASURER]: ['Open finance task', 'Manage finance alerts'],
    [Role.AUDITOR]: ['Open review item', 'Manage alert preferences'],
  },
  reports: {
    [Role.MEMBER]: ['Download personal statement'],
    [Role.SECRETARY]: ['Generate attendance report', 'Export governance report'],
    [Role.TREASURER]: ['Generate finance report', 'Export loan report'],
    [Role.CHAMA_ADMIN]: ['Export operational report'],
    [Role.AUDITOR]: ['Export compliance report'],
    [Role.ADMIN]: ['Export moderation report'],
    [Role.SUPERADMIN]: ['Export platform report'],
  },
  support: {
    [Role.MEMBER]: ['Create ticket', 'Reply to own case'],
    [Role.SECRETARY]: ['Review meeting issue', 'Reply to scoped case'],
    [Role.TREASURER]: ['Review finance issue', 'Reply to scoped case'],
    [Role.CHAMA_ADMIN]: ['Resolve chama issue', 'Review dispute history'],
    [Role.ADMIN]: ['Resolve ticket', 'Escalate dispute'],
    [Role.SUPERADMIN]: ['Inspect escalation queue'],
  },
  ai_assistant: {
    [Role.MEMBER]: ['Ask personal question'],
    [Role.SECRETARY]: ['Ask coordination question'],
    [Role.TREASURER]: ['Ask finance question'],
    [Role.CHAMA_ADMIN]: ['Ask operations question'],
    [Role.AUDITOR]: ['Ask compliance question'],
    [Role.ADMIN]: ['Ask support question'],
    [Role.SUPERADMIN]: ['Ask platform question'],
  },
};

const dedupe = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

function getRoleOverride(
  overrides: ScreenRoleStringMap,
  screen: AppScreenKey,
  role: Role
): string[] {
  return overrides[screen]?.[role] || [];
}

function buildVisibleSections(
  screen: AppScreenKey,
  role: Role,
  experience: ScreenRoleExperience
): string[] {
  const baseLayout = SHARED_SCREEN_DEFINITIONS[screen].baseLayout;
  const hints = getRoleOverride(ROLE_VISIBLE_SECTION_HINTS, screen, role);
  const hidden = new Set(getRoleOverride(ROLE_HIDDEN_SECTIONS, screen, role));
  return dedupe([...baseLayout, ...(experience.tabs || []), ...(experience.widgets || []), ...hints]).filter(
    (item) => !hidden.has(item)
  );
}

function buildReadOnlySections(
  screen: AppScreenKey,
  role: Role,
  experience: ScreenRoleExperience,
  visibleSections: string[]
): string[] {
  if (experience.access === 'read_only' || experience.access === 'inspect_only') {
    return visibleSections;
  }
  return getRoleOverride(ROLE_READ_ONLY_SECTIONS, screen, role);
}

function buildAllowedActions(
  screen: AppScreenKey,
  role: Role,
  experience: ScreenRoleExperience
): string[] {
  return dedupe([...(experience.quickActions || []), ...getRoleOverride(ROLE_ALLOWED_ACTION_OVERRIDES, screen, role)]);
}

function buildBlockedActions(
  screen: AppScreenKey,
  role: Role,
  allowedActions: string[]
): string[] {
  const blocked = dedupe([...GLOBAL_BLOCKED_ACTIONS[role], ...getRoleOverride(ROLE_HIDDEN_SECTIONS, screen, role)]);
  return blocked.filter((action) => !allowedActions.includes(action));
}

function buildHiddenData(screen: AppScreenKey, role: Role): string[] {
  return getRoleOverride(ROLE_HIDDEN_DATA, screen, role);
}

function buildVisibleData(
  screen: AppScreenKey,
  role: Role,
  experience: ScreenRoleExperience
): string[] {
  const hidden = new Set(buildHiddenData(screen, role));
  return experience.sees.filter((item) => !hidden.has(item));
}

export const SHARED_SCREEN_ROLE_CONTRACT: Record<AppScreenKey, Record<Role, ScreenRoleContract>> = Object.fromEntries(
  Object.entries(SCREEN_RBAC_MATRIX).map(([screen, roleMap]) => {
    const screenKey = screen as AppScreenKey;
    return [
      screenKey,
      Object.fromEntries(
        Object.entries(roleMap).map(([role, experience]) => {
          const resolvedRole = role as Role;
          const hidden = !experience.visible;
          const visibleSections = hidden ? [] : buildVisibleSections(screenKey, resolvedRole, experience);
          const allowedActions = hidden ? [] : buildAllowedActions(screenKey, resolvedRole, experience);
          const contract: ScreenRoleContract = {
            screen: screenKey,
            role: resolvedRole,
            roleLabel: ROLE_DISPLAY_NAMES[resolvedRole],
            visible: experience.visible,
            hidden,
            readOnly:
              SHARED_SCREEN_DEFINITIONS[screenKey].readOnlyFor.includes(resolvedRole) ||
              experience.access === 'read_only' ||
              experience.access === 'inspect_only',
            access: experience.access,
            scope: experience.scope,
            dataScope: experience.backendScope,
            baseLayout: SHARED_SCREEN_DEFINITIONS[screenKey].baseLayout,
            visibleSections,
            hiddenSections: hidden ? SHARED_SCREEN_DEFINITIONS[screenKey].baseLayout : getRoleOverride(ROLE_HIDDEN_SECTIONS, screenKey, resolvedRole),
            readOnlySections: hidden ? [] : buildReadOnlySections(screenKey, resolvedRole, experience, visibleSections),
            allowedActions,
            blockedActions: hidden ? GLOBAL_BLOCKED_ACTIONS[resolvedRole] : buildBlockedActions(screenKey, resolvedRole, allowedActions),
            visibleData: hidden ? [] : buildVisibleData(screenKey, resolvedRole, experience),
            hiddenData: hidden ? [] : buildHiddenData(screenKey, resolvedRole),
            widgets: hidden ? [] : experience.widgets || [],
            tabs: hidden ? [] : experience.tabs || [],
            filters: hidden ? [] : experience.filters || [],
            tableColumns: hidden ? [] : TABLE_COLUMN_MATRIX[screenKey]?.[resolvedRole] || [],
          };
          return [resolvedRole, contract];
        })
      ),
    ];
  })
) as Record<AppScreenKey, Record<Role, ScreenRoleContract>>;

export const SCREEN_VISIBILITY_MATRIX: Record<AppScreenKey, Record<Role, boolean>> = Object.fromEntries(
  Object.entries(SHARED_SCREEN_ROLE_CONTRACT).map(([screen, roleMap]) => [
    screen,
    Object.fromEntries(Object.entries(roleMap).map(([role, contract]) => [role, contract.visible])),
  ])
) as Record<AppScreenKey, Record<Role, boolean>>;

export const SCREEN_HIDDEN_MATRIX: Record<AppScreenKey, Record<Role, string[]>> = Object.fromEntries(
  Object.entries(SHARED_SCREEN_ROLE_CONTRACT).map(([screen, roleMap]) => [
    screen,
    Object.fromEntries(Object.entries(roleMap).map(([role, contract]) => [role, contract.hiddenSections])),
  ])
) as Record<AppScreenKey, Record<Role, string[]>>;

export const SCREEN_READ_ONLY_MATRIX: Record<AppScreenKey, Record<Role, string[]>> = Object.fromEntries(
  Object.entries(SHARED_SCREEN_ROLE_CONTRACT).map(([screen, roleMap]) => [
    screen,
    Object.fromEntries(Object.entries(roleMap).map(([role, contract]) => [role, contract.readOnlySections])),
  ])
) as Record<AppScreenKey, Record<Role, string[]>>;

export const SCREEN_ALLOWED_ACTION_MATRIX: Record<AppScreenKey, Record<Role, string[]>> = Object.fromEntries(
  Object.entries(SHARED_SCREEN_ROLE_CONTRACT).map(([screen, roleMap]) => [
    screen,
    Object.fromEntries(Object.entries(roleMap).map(([role, contract]) => [role, contract.allowedActions])),
  ])
) as Record<AppScreenKey, Record<Role, string[]>>;

export const SCREEN_BLOCKED_ACTION_MATRIX: Record<AppScreenKey, Record<Role, string[]>> = Object.fromEntries(
  Object.entries(SHARED_SCREEN_ROLE_CONTRACT).map(([screen, roleMap]) => [
    screen,
    Object.fromEntries(Object.entries(roleMap).map(([role, contract]) => [role, contract.blockedActions])),
  ])
) as Record<AppScreenKey, Record<Role, string[]>>;

export const SCREEN_VISIBLE_DATA_MATRIX: Record<AppScreenKey, Record<Role, string[]>> = Object.fromEntries(
  Object.entries(SHARED_SCREEN_ROLE_CONTRACT).map(([screen, roleMap]) => [
    screen,
    Object.fromEntries(Object.entries(roleMap).map(([role, contract]) => [role, contract.visibleData])),
  ])
) as Record<AppScreenKey, Record<Role, string[]>>;

export const SCREEN_HIDDEN_DATA_MATRIX: Record<AppScreenKey, Record<Role, string[]>> = Object.fromEntries(
  Object.entries(SHARED_SCREEN_ROLE_CONTRACT).map(([screen, roleMap]) => [
    screen,
    Object.fromEntries(Object.entries(roleMap).map(([role, contract]) => [role, contract.hiddenData])),
  ])
) as Record<AppScreenKey, Record<Role, string[]>>;

export const SCREEN_TAB_MATRIX: Record<AppScreenKey, Record<Role, string[]>> = Object.fromEntries(
  Object.entries(SHARED_SCREEN_ROLE_CONTRACT).map(([screen, roleMap]) => [
    screen,
    Object.fromEntries(Object.entries(roleMap).map(([role, contract]) => [role, contract.tabs])),
  ])
) as Record<AppScreenKey, Record<Role, string[]>>;

export const SCREEN_COLUMN_MATRIX: Record<AppScreenKey, Record<Role, string[]>> = Object.fromEntries(
  Object.entries(SHARED_SCREEN_ROLE_CONTRACT).map(([screen, roleMap]) => [
    screen,
    Object.fromEntries(Object.entries(roleMap).map(([role, contract]) => [role, contract.tableColumns])),
  ])
) as Record<AppScreenKey, Record<Role, string[]>>;

export const SCREEN_SCOPE_MATRIX: Record<AppScreenKey, Record<Role, ScreenRoleExperience['backendScope']>> = Object.fromEntries(
  Object.entries(SHARED_SCREEN_ROLE_CONTRACT).map(([screen, roleMap]) => [
    screen,
    Object.fromEntries(Object.entries(roleMap).map(([role, contract]) => [role, contract.dataScope])),
  ])
) as Record<AppScreenKey, Record<Role, ScreenRoleExperience['backendScope']>>;

export function getScreenRoleContract(screen: AppScreenKey, role: Role): ScreenRoleContract {
  return SHARED_SCREEN_ROLE_CONTRACT[screen][role];
}
