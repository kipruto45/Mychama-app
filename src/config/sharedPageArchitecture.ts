import { Permission } from '@/auth/permissions';
import { Role } from '@/auth/roles';

export type WorkspaceTabRoute = 'Dashboard' | 'Chamas' | 'Payments' | 'Meetings' | 'More';

export type SharedPageId =
  | 'dashboard'
  | 'chamas'
  | 'chamaDetails'
  | 'members'
  | 'contributions'
  | 'payments'
  | 'loans'
  | 'meetings'
  | 'governance'
  | 'announcements'
  | 'notifications'
  | 'reports'
  | 'profile'
  | 'settings'
  | 'support'
  | 'aiAssistant';

type RoleExperience = {
  sees: string[];
  can: string[];
  hidden: string[];
  readOnly: string[];
  quickActions: string[];
  dataScope: string;
  tabs?: string[];
  tableColumns?: string[];
  filters?: string[];
};

export interface SharedPageConfig {
  id: SharedPageId;
  route: string;
  title: string;
  sharedLayout: string;
  commonSections: string[];
  accessPermissions: Permission[];
  roleExperience: Record<Role, RoleExperience>;
}

type WorkspaceTabContext = {
  isMemberWorkspace: boolean;
  canViewChamas: boolean;
  canViewPayments: boolean;
  canViewMeetings: boolean;
};

const memberTabLayout: WorkspaceTabRoute[] = ['Dashboard', 'Payments', 'Meetings', 'More'];
const operationsTabLayout: WorkspaceTabRoute[] = ['Dashboard', 'Chamas', 'Payments', 'Meetings', 'More'];

export const WORKSPACE_TAB_LAYOUTS: Record<Role, WorkspaceTabRoute[]> = {
  [Role.SUPERADMIN]: operationsTabLayout,
  [Role.ADMIN]: operationsTabLayout,
  [Role.CHAMA_ADMIN]: operationsTabLayout,
  [Role.TREASURER]: operationsTabLayout,
  [Role.SECRETARY]: operationsTabLayout,
  [Role.AUDITOR]: operationsTabLayout,
  [Role.MEMBER]: memberTabLayout,
};

export const WORKSPACE_TAB_TITLES: Record<Role, Record<WorkspaceTabRoute, string>> = {
  [Role.SUPERADMIN]: {
    Dashboard: 'Dashboard',
    Chamas: 'Chamas',
    Payments: 'Payments',
    Meetings: 'Meetings',
    More: 'More',
  },
  [Role.ADMIN]: {
    Dashboard: 'Dashboard',
    Chamas: 'Chamas',
    Payments: 'Payments',
    Meetings: 'Meetings',
    More: 'More',
  },
  [Role.CHAMA_ADMIN]: {
    Dashboard: 'Dashboard',
    Chamas: 'Chamas',
    Payments: 'Payments',
    Meetings: 'Meetings',
    More: 'More',
  },
  [Role.TREASURER]: {
    Dashboard: 'Dashboard',
    Chamas: 'Chamas',
    Payments: 'Payments',
    Meetings: 'Meetings',
    More: 'More',
  },
  [Role.SECRETARY]: {
    Dashboard: 'Dashboard',
    Chamas: 'Chamas',
    Payments: 'Payments',
    Meetings: 'Meetings',
    More: 'More',
  },
  [Role.AUDITOR]: {
    Dashboard: 'Dashboard',
    Chamas: 'Chamas',
    Payments: 'Payments',
    Meetings: 'Meetings',
    More: 'More',
  },
  [Role.MEMBER]: {
    Dashboard: 'Home',
    Payments: 'Wallet',
    Meetings: 'Meetings',
    More: 'More',
  } as Record<WorkspaceTabRoute, string>,
};

export function getWorkspaceTabs(role: Role, context: WorkspaceTabContext): WorkspaceTabRoute[] {
  const desiredTabs = WORKSPACE_TAB_LAYOUTS[role] || operationsTabLayout;
  return desiredTabs.filter((tab) => {
    switch (tab) {
      case 'Chamas':
        return context.canViewChamas;
      case 'Payments':
        // Always keep Wallet/Payments available to avoid dead-end navigation flows.
        // The screen itself can render an access-denied state when needed.
        return true;
      case 'Meetings':
        // Members should always see meetings tab, others need permission
        return role === Role.MEMBER || context.canViewMeetings;
      default:
        return true;
    }
  });
}

export function getWorkspaceTabTitle(role: Role, tab: WorkspaceTabRoute): string {
  return WORKSPACE_TAB_TITLES[role]?.[tab] || tab;
}

export const ROLE_DASHBOARD_WIDGETS: Record<Role, string[]> = {
  [Role.MEMBER]: [
    'next-contribution-due',
    'overdue-items',
    'active-loan-summary',
    'next-meeting',
    'recent-payments',
    'announcement-preview',
    'notification-preview',
  ],
  [Role.SECRETARY]: [
    'upcoming-meetings',
    'agenda-and-minutes-tasks',
    'attendance-summary',
    'communication-reminders',
    'announcement-actions',
  ],
  [Role.TREASURER]: [
    'payment-verification-queue',
    'contribution-compliance',
    'pending-reconciliations',
    'liquidity-summary',
    'loan-and-fine-alerts',
    'pending-expense-withdrawal-items',
  ],
  [Role.CHAMA_ADMIN]: [
    'join-requests',
    'pending-approvals',
    'member-issues',
    'chama-health',
    'governance-alerts',
    'announcement-actions',
  ],
  [Role.AUDITOR]: [
    'compliance-summary',
    'audit-alerts',
    'loan-default-overview',
    'finance-review',
    'high-risk-actions',
  ],
  [Role.ADMIN]: [
    'operational-issues',
    'support-and-disputes',
    'moderation-items',
    'communication-failures',
    'global-summaries',
  ],
  [Role.SUPERADMIN]: [
    'platform-health',
    'provider-health',
    'failed-jobs',
    'fraud-and-risk-flags',
    'global-analytics',
    'user-and-chama-metrics',
  ],
};

export const SHARED_PAGE_ARCHITECTURE: Record<SharedPageId, SharedPageConfig> = {
  dashboard: {
    id: 'dashboard',
    route: 'Dashboard',
    title: 'Dashboard',
    sharedLayout: 'Hero summary, role-aware widget grid, alert rail, quick actions, and recent activity.',
    commonSections: ['Hero summary', 'Quick actions', 'Alerts', 'Key metrics', 'Recent activity'],
    accessPermissions: [Permission.CAN_VIEW_PROFILE],
    roleExperience: {
      [Role.SUPERADMIN]: {
        sees: ['Platform health', 'Provider health', 'Risk trends', 'Global analytics'],
        can: ['Open platform console', 'Inspect system jobs', 'Review risk flags'],
        hidden: ['Member-only obligations'],
        readOnly: [],
        quickActions: ['Platform dashboard', 'Audit logs', 'Reports hub'],
        dataScope: 'Global platform-wide scope across providers, users, and chamas.',
      },
      [Role.ADMIN]: {
        sees: ['Support queues', 'Dispute pressure', 'Moderation activity', 'Global summaries'],
        can: ['Resolve platform issues', 'Escalate disputes', 'Open operations tools'],
        hidden: ['Superadmin-only infrastructure controls'],
        readOnly: [],
        quickActions: ['Support issues', 'Approvals center', 'Reports hub'],
        dataScope: 'Global operational scope limited by admin tooling permissions.',
      },
      [Role.CHAMA_ADMIN]: {
        sees: ['Approvals', 'Join requests', 'Operational health', 'Governance alerts'],
        can: ['Manage members', 'Approve requests', 'Open chama controls'],
        hidden: ['Platform health internals'],
        readOnly: [],
        quickActions: ['Member list', 'Membership requests', 'Governance'],
        dataScope: 'Current chama with broad operational access.',
      },
      [Role.TREASURER]: {
        sees: ['Collections', 'Liquidity', 'Pending reconciliations', 'Loan pressure'],
        can: ['Review finance queues', 'Open recovery flows', 'Inspect payment operations'],
        hidden: ['Platform risk internals', 'Role assignment controls'],
        readOnly: [],
        quickActions: ['Finance', 'Loan approvals', 'Recovery queue'],
        dataScope: 'Current chama financial records and assigned operational queues.',
      },
      [Role.SECRETARY]: {
        sees: ['Upcoming meetings', 'Minutes tasks', 'Attendance trends', 'Communication reminders'],
        can: ['Create meetings', 'Record minutes', 'Publish announcements'],
        hidden: ['Advanced finance controls', 'Role assignment controls'],
        readOnly: [],
        quickActions: ['Create meeting', 'Governance', 'Announcements'],
        dataScope: 'Current chama governance, meetings, and communication context.',
      },
      [Role.AUDITOR]: {
        sees: ['Compliance summary', 'Audit alerts', 'Finance review', 'High-risk actions'],
        can: ['Open reports', 'Inspect logs', 'Review finance activity'],
        hidden: ['Operational approve/edit flows'],
        readOnly: ['Finance queues', 'Governance records', 'Loan review'],
        quickActions: ['Audit logs', 'Reports hub', 'Finance'],
        dataScope: 'Current chama oversight in read-only mode.',
      },
      [Role.MEMBER]: {
        sees: ['Due contributions', 'Overdue items', 'Active loan summary', 'Meetings', 'Announcements'],
        can: ['Pay contributions', 'Request loan', 'Open meetings'],
        hidden: ['Operational queues', 'Approvals', 'Global summaries'],
        readOnly: ['Group-wide analytics beyond personal scope'],
        quickActions: ['Make contribution', 'Request loan', 'Profile'],
        dataScope: 'Own memberships, obligations, payments, and upcoming activity.',
      },
    },
  },
  chamas: {
    id: 'chamas',
    route: 'Chamas',
    title: 'Chamas',
    sharedLayout: 'Searchable chama cards or table with status badges, role badge, and scoped actions.',
    commonSections: ['Search', 'Role badge', 'Chama list', 'Status indicators'],
    accessPermissions: [Permission.CAN_VIEW_CHAMA],
    roleExperience: {
      [Role.SUPERADMIN]: {
        sees: ['Global chama inventory', 'Platform summaries', 'Cross-chama health signals'],
        can: ['Inspect chama health', 'Open oversight mode'],
        hidden: ['Member-only onboarding prompts'],
        readOnly: [],
        quickActions: ['Platform dashboard', 'Reports hub'],
        dataScope: 'All chamas in platform mode.',
        filters: ['Status', 'Region', 'Risk', 'Growth'],
      },
      [Role.ADMIN]: {
        sees: ['Operational chama inventory', 'Issue indicators', 'Moderation signals'],
        can: ['Open support workflows', 'Inspect global chama status'],
        hidden: ['Infrastructure-only diagnostics'],
        readOnly: [],
        quickActions: ['Support issues', 'Approvals center'],
        dataScope: 'Global chama list for operations and moderation.',
        filters: ['Status', 'Issue state', 'Size'],
      },
      [Role.CHAMA_ADMIN]: {
        sees: ['Managed chamas', 'Membership pressure', 'Health summaries'],
        can: ['Open management shortcuts', 'Review requests'],
        hidden: ['Platform-only metrics'],
        readOnly: [],
        quickActions: ['Create chama', 'Membership requests', 'Invite members'],
        dataScope: 'Chamas where the user has an administrative role.',
        filters: ['Status', 'Member count', 'Approval state'],
      },
      [Role.TREASURER]: {
        sees: ['Joined chamas', 'Finance health indicators', 'Collection posture'],
        can: ['Open finance workspaces'],
        hidden: ['Governance management controls'],
        readOnly: [],
        quickActions: ['Finance', 'Contribution compliance'],
        dataScope: 'Joined chamas with finance-centric summaries.',
        filters: ['Status', 'Liquidity', 'Collections'],
      },
      [Role.SECRETARY]: {
        sees: ['Joined chamas', 'Governance summaries', 'Meeting readiness'],
        can: ['Open meeting workspace', 'Open announcement flows'],
        hidden: ['Treasurer-only finance controls'],
        readOnly: [],
        quickActions: ['Meetings', 'Announcements'],
        dataScope: 'Joined chamas with governance and communication summaries.',
        filters: ['Status', 'Meeting status', 'Announcements'],
      },
      [Role.AUDITOR]: {
        sees: ['Joined chamas', 'Oversight indicators', 'Risk and compliance chips'],
        can: ['Open read-only detail views'],
        hidden: ['Approval and edit controls'],
        readOnly: ['Management shortcuts'],
        quickActions: ['Reports hub', 'Audit logs'],
        dataScope: 'Joined chamas visible for audit review.',
        filters: ['Status', 'Risk', 'Compliance'],
      },
      [Role.MEMBER]: {
        sees: ['Joined chamas', 'Pending join requests', 'Basic health and schedule cues'],
        can: ['Open chama details', 'Join via code', 'Create chama'],
        hidden: ['Operational shortcuts', 'Oversight analytics'],
        readOnly: ['Finance and governance control indicators'],
        quickActions: ['Create chama', 'Join via code'],
        dataScope: 'Only the member’s joined chamas and submitted requests.',
        filters: ['Status', 'Membership'],
      },
    },
  },
  chamaDetails: {
    id: 'chamaDetails',
    route: 'ChamaDetail',
    title: 'Chama Details',
    sharedLayout: 'Header summary with role-aware tabs for overview, members, finance, meetings, governance, documents, and settings.',
    commonSections: ['Header summary', 'Overview', 'Members', 'Meetings', 'Announcements'],
    accessPermissions: [Permission.CAN_VIEW_CHAMA],
    roleExperience: {
      [Role.SUPERADMIN]: { sees: ['All tabs', 'Global context'], can: ['Inspect health', 'Open platform actions'], hidden: [], readOnly: [], quickActions: ['Platform dashboard', 'Reports hub'], dataScope: 'Selected chama in platform context.', tabs: ['Overview', 'Members', 'Contributions', 'Finance', 'Loans', 'Meetings', 'Governance', 'Documents', 'Settings'] },
      [Role.ADMIN]: { sees: ['All operational tabs'], can: ['Inspect disputes', 'Open moderation actions'], hidden: ['Infrastructure controls'], readOnly: [], quickActions: ['Support issues', 'Approvals center'], dataScope: 'Selected chama in operations context.', tabs: ['Overview', 'Members', 'Contributions', 'Finance', 'Loans', 'Meetings', 'Governance', 'Documents', 'Settings'] },
      [Role.CHAMA_ADMIN]: { sees: ['Full operational layout'], can: ['Manage settings', 'Manage roles', 'Approve requests'], hidden: [], readOnly: [], quickActions: ['Chama settings', 'Member list', 'Governance'], dataScope: 'Current chama full operational scope.', tabs: ['Overview', 'Members', 'Contributions', 'Finance', 'Loans', 'Meetings', 'Governance', 'Documents', 'Settings'] },
      [Role.TREASURER]: { sees: ['Overview', 'Contributions', 'Finance', 'Loans', 'Meetings'], can: ['Review finance', 'Inspect loans'], hidden: ['Role assignment', 'Some governance controls'], readOnly: ['Settings', 'Members lifecycle'], quickActions: ['Finance', 'Loan approvals'], dataScope: 'Current chama finance and related summaries.', tabs: ['Overview', 'Contributions', 'Finance', 'Loans', 'Meetings'] },
      [Role.SECRETARY]: { sees: ['Overview', 'Members', 'Meetings', 'Governance', 'Documents'], can: ['Manage meetings', 'Publish communications'], hidden: ['Advanced finance controls'], readOnly: ['Finance', 'Loan controls'], quickActions: ['Create meeting', 'Announcements'], dataScope: 'Current chama meeting, records, and member participation context.', tabs: ['Overview', 'Members', 'Meetings', 'Governance', 'Documents'] },
      [Role.AUDITOR]: { sees: ['Expanded oversight tabs'], can: ['Inspect records and logs'], hidden: ['Mutating action panels'], readOnly: ['All operational tabs'], quickActions: ['Reports hub', 'Audit logs'], dataScope: 'Current chama read-only oversight.', tabs: ['Overview', 'Members', 'Contributions', 'Finance', 'Loans', 'Meetings', 'Governance', 'Documents'] },
      [Role.MEMBER]: { sees: ['Overview', 'Announcements', 'Meetings', 'Limited members', 'Own obligations'], can: ['Open meetings', 'View announcements'], hidden: ['Finance internals', 'Settings', 'Admin controls'], readOnly: ['Members', 'Governance records'], quickActions: ['Payments', 'Meetings'], dataScope: 'Only public-safe chama information plus the member’s own obligations.', tabs: ['Overview', 'Members', 'Meetings', 'Announcements'] },
    },
  },
  members: {
    id: 'members',
    route: 'MemberList',
    title: 'Members',
    sharedLayout: 'Directory table with role-aware columns, filters, and detail drawer.',
    commonSections: ['Search', 'Filters', 'Members table', 'Member detail panel'],
    accessPermissions: [Permission.CAN_VIEW_MEMBERS],
    roleExperience: {
      [Role.SUPERADMIN]: { sees: ['Full directory', 'Lifecycle indicators', 'Permissions'], can: ['Inspect role history'], hidden: [], readOnly: [], quickActions: ['Reports hub', 'Audit logs'], dataScope: 'Platform member views scoped by selected chama or global mode.', tableColumns: ['Name', 'Role', 'Status', 'Join date', 'Last active'], filters: ['Role', 'Status', 'KYC', 'Risk'] ,},
      [Role.ADMIN]: { sees: ['Operational member directory', 'Case indicators'], can: ['Moderate support-linked issues'], hidden: ['Infrastructure fields'], readOnly: [], quickActions: ['Support issues', 'Approvals center'], dataScope: 'Operationally scoped members tied to moderation or support work.', tableColumns: ['Name', 'Role', 'Status', 'Case flags', 'Last active'], filters: ['Role', 'Status', 'Case state'] },
      [Role.CHAMA_ADMIN]: { sees: ['Full member directory', 'Role assignment', 'Lifecycle actions'], can: ['Assign roles', 'Suspend/remove', 'Approve members'], hidden: [], readOnly: [], quickActions: ['Membership requests', 'Invite members', 'Role delegations'], dataScope: 'All members in the current chama.', tableColumns: ['Name', 'Role', 'Status', 'Join date', 'Approvals', 'Last active'], filters: ['Role', 'Status', 'Approval state'] },
      [Role.TREASURER]: { sees: ['Member finance profile', 'Balances', 'Compliance'], can: ['Inspect financial posture'], hidden: ['Role assignment'], readOnly: ['Lifecycle actions'], quickActions: ['Contribution compliance', 'Loan approvals'], dataScope: 'Current chama members with finance-relevant data only.', tableColumns: ['Name', 'Role', 'Dues status', 'Savings', 'Loan balance'], filters: ['Dues status', 'Loan state', 'Contribution type'] },
      [Role.SECRETARY]: { sees: ['Participation data', 'Attendance patterns', 'Communication status'], can: ['Track attendance context'], hidden: ['Loan approvals', 'Sensitive finance'], readOnly: ['Lifecycle actions'], quickActions: ['Meetings', 'Announcements'], dataScope: 'Current chama members with governance and participation context.', tableColumns: ['Name', 'Role', 'Attendance', 'Last meeting', 'Communication status'], filters: ['Attendance', 'Role', 'Engagement'] },
      [Role.AUDITOR]: { sees: ['Compliance history', 'Read-only member context'], can: ['Inspect history'], hidden: ['Mutating controls'], readOnly: ['All edit actions'], quickActions: ['Reports hub', 'Audit logs'], dataScope: 'Current chama member data in read-only audit mode.', tableColumns: ['Name', 'Role', 'Status', 'Compliance', 'History'], filters: ['Compliance', 'Role', 'Status'] },
      [Role.MEMBER]: { sees: ['Limited directory', 'Public-safe profiles'], can: ['Open limited member detail'], hidden: ['Sensitive contacts', 'Finance and lifecycle fields'], readOnly: ['Directory and profile detail'], quickActions: ['Profile', 'Meetings'], dataScope: 'Only limited profiles of members in joined chamas.', tableColumns: ['Name', 'Role', 'Join date'], filters: ['Role'] },
    },
  },
  contributions: {
    id: 'contributions',
    route: 'ContributionCompliance',
    title: 'Contributions',
    sharedLayout: 'Summary cards, due/overdue/paid filters, compliance table, and detail drawer.',
    commonSections: ['Summary', 'Status filters', 'Contribution table', 'Details drawer'],
    accessPermissions: [Permission.CAN_VIEW_OWN_CONTRIBUTIONS, Permission.CAN_VIEW_ALL_CONTRIBUTIONS],
    roleExperience: {
      [Role.SUPERADMIN]: { sees: ['Global contribution posture'], can: ['Inspect trends and exceptions'], hidden: ['Member-only payment prompts'], readOnly: [], quickActions: ['Reports hub'], dataScope: 'Platform or selected chama contribution overview.', tabs: ['All', 'Due', 'Overdue', 'Paid', 'Compliance'], filters: ['Status', 'Chama', 'Date range'] },
      [Role.ADMIN]: { sees: ['Operational contribution issues'], can: ['Inspect support-linked exceptions'], hidden: ['Member payment prompts'], readOnly: [], quickActions: ['Support issues', 'Reports hub'], dataScope: 'Contribution issues tied to operational support scope.', tabs: ['All', 'Overdue', 'Compliance'], filters: ['Status', 'Issue state'] },
      [Role.CHAMA_ADMIN]: { sees: ['Group compliance', 'Overdue posture', 'Contribution health'], can: ['Review compliance and exceptions'], hidden: [], readOnly: [], quickActions: ['Contribution compliance', 'Reports hub'], dataScope: 'All contributions for the current chama.', tabs: ['All', 'Due', 'Overdue', 'Paid', 'Compliance'], filters: ['Status', 'Member', 'Contribution type'] },
      [Role.TREASURER]: { sees: ['All contributions', 'Verification and aging'], can: ['Record contributions', 'Review compliance'], hidden: [], readOnly: [], quickActions: ['Contribution compliance', 'Payments'], dataScope: 'Current chama contributions including operational verification context.', tabs: ['All', 'Due', 'Overdue', 'Paid', 'Compliance'], filters: ['Status', 'Member', 'Payment method'] },
      [Role.SECRETARY]: { sees: ['Reminder-ready due items', 'Participation-linked status'], can: ['Use for communication follow-up'], hidden: ['Deep finance operations'], readOnly: ['Verification actions'], quickActions: ['Announcements', 'Meetings'], dataScope: 'Current chama contribution reminders and participation context.', tabs: ['Due', 'Overdue', 'Paid'], filters: ['Status', 'Member'] },
      [Role.AUDITOR]: { sees: ['Contribution review', 'Compliance'], can: ['Inspect trends'], hidden: ['Record/verify actions'], readOnly: ['All contribution actions'], quickActions: ['Reports hub', 'Audit logs'], dataScope: 'Current chama read-only contribution review.', tabs: ['All', 'Overdue', 'Paid', 'Compliance'], filters: ['Status', 'Member', 'Period'] },
      [Role.MEMBER]: { sees: ['Own contributions', 'Due and overdue items'], can: ['Open payment flow'], hidden: ['Other members data', 'Compliance controls'], readOnly: ['Historical records'], quickActions: ['Make contribution', 'Payments'], dataScope: 'Only the current member’s own contributions.', tabs: ['All', 'Due', 'Overdue', 'Paid'], filters: ['Status', 'Date range'] },
    },
  },
  payments: {
    id: 'payments',
    route: 'Payments',
    title: 'Payments',
    sharedLayout: 'Status-rich ledger with search, receipts, transaction detail, and role-aware actions.',
    commonSections: ['Summary cards', 'Search', 'Status filters', 'Transactions list', 'Detail drawer'],
    accessPermissions: [Permission.CAN_VIEW_PAYMENTS, Permission.CAN_MAKE_PAYMENTS],
    roleExperience: {
      [Role.SUPERADMIN]: { sees: ['Transaction activity', 'Status trails', 'Exception indicators'], can: ['Inspect payment operations'], hidden: ['Member-only retry prompts'], readOnly: [], quickActions: ['Platform dashboard', 'Audit logs'], dataScope: 'Global or scoped payment operations view.' },
      [Role.ADMIN]: { sees: ['Payment issues', 'Failures', 'Disputes'], can: ['Open support-linked transaction cases'], hidden: ['Treasurer-only verification tools'], readOnly: [], quickActions: ['Support issues', 'Payment operations'], dataScope: 'Operational payment issues and selected transaction scope.' },
      [Role.CHAMA_ADMIN]: { sees: ['Payment health', 'Exceptions', 'Collections'], can: ['Review exception paths'], hidden: ['Treasurer-only reconciliation controls'], readOnly: ['Deep treasury operations'], quickActions: ['Payments', 'Reports hub'], dataScope: 'Current chama transaction activity and selected exception review.' },
      [Role.TREASURER]: { sees: ['Verification queue', 'Bank proofs', 'Reconciliation shortcuts', 'Manual entries'], can: ['Verify payments', 'Open reconciliation', 'Review disputes'], hidden: [], readOnly: [], quickActions: ['Payment operations', 'Reports hub', 'Transactions'], dataScope: 'Current chama payments with full treasury operations visibility.' },
      [Role.SECRETARY]: { sees: ['Shared payment summary', 'Member payment status context'], can: ['Reference payment state for coordination'], hidden: ['Verification and reconciliation queues'], readOnly: ['Payment actions except own payments'], quickActions: ['Payments', 'Announcements'], dataScope: 'Current chama payment summaries needed for meeting and member coordination.' },
      [Role.AUDITOR]: { sees: ['Payment review', 'Receipts', 'Status trail', 'Reconciliation state'], can: ['Inspect read-only transaction history'], hidden: ['Manual edit controls'], readOnly: ['All operations'], quickActions: ['Audit logs', 'Reports hub'], dataScope: 'Current chama read-only payments and receipts.' },
      [Role.MEMBER]: { sees: ['Own payment history', 'Receipts', 'Status outcomes'], can: ['Pay', 'Retry', 'View receipts'], hidden: ['Other members payments', 'Treasury ops'], readOnly: ['Completed payment history'], quickActions: ['Make contribution', 'Payment history'], dataScope: 'Only the current member’s own payments and receipts.' },
    },
  },
  loans: {
    id: 'loans',
    route: 'LoanApplications',
    title: 'Loans',
    sharedLayout: 'Loan summary cards, applications table, active loans, repayment schedules, and detail view.',
    commonSections: ['Summary', 'Applications', 'Active loans', 'Repayments', 'Loan detail'],
    accessPermissions: [Permission.CAN_REQUEST_LOAN, Permission.CAN_VIEW_ALL_LOANS],
    roleExperience: {
      [Role.SUPERADMIN]: { sees: ['Global loan exposure', 'Defaults', 'Risk'], can: ['Inspect exceptions'], hidden: ['Member-only submit prompts'], readOnly: [], quickActions: ['Reports hub', 'Audit logs'], dataScope: 'Platform or selected chama loan overview.' },
      [Role.ADMIN]: { sees: ['Operational loan issues', 'High-risk cases'], can: ['Open escalations'], hidden: ['Treasury-only disbursement actions'], readOnly: [], quickActions: ['Support issues', 'Reports hub'], dataScope: 'Operationally significant loan cases.' },
      [Role.CHAMA_ADMIN]: { sees: ['Approvals', 'Recovery', 'Restructure', 'Portfolio health'], can: ['Approve', 'Recover', 'Restructure'], hidden: [], readOnly: [], quickActions: ['Loan approvals', 'Recovery queue', 'Restructures'], dataScope: 'Full current chama loan portfolio.' },
      [Role.TREASURER]: { sees: ['Applications', 'Active loans', 'Overdue/defaulted', 'Disbursement readiness'], can: ['Approve', 'Review risk', 'Prepare disbursement'], hidden: ['Non-finance governance controls'], readOnly: [], quickActions: ['Loan approvals', 'Recovery queue'], dataScope: 'Current chama financial loan operations.' },
      [Role.SECRETARY]: { sees: ['Read-only loan context for coordination'], can: ['Reference schedules where needed'], hidden: ['Approval and disbursement actions'], readOnly: ['Loan operations'], quickActions: ['Meetings'], dataScope: 'Limited current chama loan context tied to member coordination.' },
      [Role.AUDITOR]: { sees: ['Read-only loan review', 'Defaults', 'Recovery posture'], can: ['Inspect schedules and exceptions'], hidden: ['Approve/disburse/restructure actions'], readOnly: ['All loan operations'], quickActions: ['Reports hub', 'Audit logs'], dataScope: 'Current chama read-only loan oversight.' },
      [Role.MEMBER]: { sees: ['Own loans', 'Eligibility', 'Repayment schedule', 'History'], can: ['Request loan', 'Repay loan'], hidden: ['Other borrowers', 'Approval queues'], readOnly: ['Published repayment history'], quickActions: ['Request loan', 'Payments'], dataScope: 'Only the current member’s loan records and guarantor interactions.' },
    },
  },
  meetings: {
    id: 'meetings',
    route: 'Meetings',
    title: 'Meetings',
    sharedLayout: 'List and calendar views backed by meeting detail tabs for agenda, attendance, minutes, and resolutions.',
    commonSections: ['List', 'Calendar', 'Detail tabs', 'Attendance', 'Minutes', 'Resolutions'],
    accessPermissions: [Permission.CAN_VIEW_MEETINGS],
    roleExperience: {
      [Role.SUPERADMIN]: { sees: ['Cross-chama meeting context'], can: ['Inspect governance signals'], hidden: ['Member-only RSVP prompts'], readOnly: [], quickActions: ['Reports hub', 'Audit logs'], dataScope: 'Global or scoped meeting records.' },
      [Role.ADMIN]: { sees: ['Operational meeting records'], can: ['Inspect issue-linked meetings'], hidden: ['Secretary-only edit controls'], readOnly: [], quickActions: ['Support issues', 'Reports hub'], dataScope: 'Operationally relevant meeting records.' },
      [Role.CHAMA_ADMIN]: { sees: ['Meeting list', 'Agenda', 'Attendance', 'Minutes', 'Resolutions'], can: ['Create/edit meetings when policy allows'], hidden: [], readOnly: [], quickActions: ['Create meeting', 'Governance'], dataScope: 'Current chama governance and meetings.' },
      [Role.TREASURER]: { sees: ['Meeting schedule', 'Finance-relevant minutes'], can: ['Reference meeting context'], hidden: ['Governance editing panels'], readOnly: ['Most meeting records'], quickActions: ['Meetings'], dataScope: 'Current chama meeting records needed for finance operations.' },
      [Role.SECRETARY]: { sees: ['Meeting list', 'Agenda', 'Attendance', 'Minutes', 'Resolutions'], can: ['Create meetings', 'Edit agenda', 'Record attendance', 'Record minutes'], hidden: [], readOnly: [], quickActions: ['Create meeting', 'Attendance', 'Minutes'], dataScope: 'Current chama meetings with full secretary workflow access.' },
      [Role.AUDITOR]: { sees: ['Read-only meetings and governance trail'], can: ['Inspect published records'], hidden: ['Create/edit controls'], readOnly: ['All meeting actions'], quickActions: ['Reports hub', 'Audit logs'], dataScope: 'Current chama meeting and governance records in read-only mode.' },
      [Role.MEMBER]: { sees: ['Upcoming meetings', 'Published agenda', 'Published minutes', 'Attendance view'], can: ['Attend and review'], hidden: ['Draft agenda editing', 'Operational attendance tools'], readOnly: ['Published records'], quickActions: ['Meetings'], dataScope: 'Meetings the member is allowed to attend or review.' },
    },
  },
  governance: {
    id: 'governance',
    route: 'Governance',
    title: 'Motions & Governance',
    sharedLayout: 'Motions list with detail state for voting, results, archive, and governance records.',
    commonSections: ['Motions list', 'Details', 'Voting', 'Results', 'Archive'],
    accessPermissions: [Permission.CAN_VIEW_CHAMA],
    roleExperience: {
      [Role.SUPERADMIN]: { sees: ['Governance oversight'], can: ['Inspect governance outcomes'], hidden: ['Member-only vote CTA'], readOnly: [], quickActions: ['Audit logs', 'Reports hub'], dataScope: 'Selected chama governance records in platform context.' },
      [Role.ADMIN]: { sees: ['Governance records tied to operations'], can: ['Inspect disputed governance actions'], hidden: ['Direct governance creation controls'], readOnly: [], quickActions: ['Support issues'], dataScope: 'Operationally relevant governance history.' },
      [Role.CHAMA_ADMIN]: { sees: ['Motions', 'Voting', 'Results', 'Archive'], can: ['Create', 'Close', 'Finalize motions'], hidden: [], readOnly: [], quickActions: ['Governance', 'Create meeting'], dataScope: 'Current chama governance with full operational control.' },
      [Role.TREASURER]: { sees: ['Governance records tied to finance'], can: ['Review outcomes'], hidden: ['Motion management'], readOnly: ['Governance actions'], quickActions: ['Governance'], dataScope: 'Current chama governance records relevant to financial decisions.' },
      [Role.SECRETARY]: { sees: ['Motions', 'Voting records', 'Results', 'Archive'], can: ['Manage records where permitted'], hidden: ['Role-assignment controls outside governance'], readOnly: ['Finalize where policy restricts'], quickActions: ['Governance', 'Minutes'], dataScope: 'Current chama motions and governance recordkeeping.' },
      [Role.AUDITOR]: { sees: ['Read-only governance review'], can: ['Inspect archive and trails'], hidden: ['Create/close/finalize actions'], readOnly: ['All governance actions'], quickActions: ['Audit logs', 'Reports hub'], dataScope: 'Current chama governance oversight.' },
      [Role.MEMBER]: { sees: ['Motions', 'Vote state', 'Results'], can: ['View and vote'], hidden: ['Record-management panels'], readOnly: ['Archived records'], quickActions: ['Governance'], dataScope: 'Only governance items the member is allowed to view or vote on.' },
    },
  },
  announcements: {
    id: 'announcements',
    route: 'AnnouncementsFeed',
    title: 'Announcements',
    sharedLayout: 'Feed view with pinning, role-aware publish actions, and detail drawer.',
    commonSections: ['Feed', 'Details', 'Pinned items'],
    accessPermissions: [Permission.CAN_VIEW_NOTIFICATIONS],
    roleExperience: {
      [Role.SUPERADMIN]: { sees: ['Platform communication context'], can: ['Inspect global messaging posture'], hidden: ['Chama-specific publishing'], readOnly: [], quickActions: ['Platform dashboard'], dataScope: 'Platform communication summaries where applicable.' },
      [Role.ADMIN]: { sees: ['Operational communication issues'], can: ['Inspect failures'], hidden: ['Chama content authoring by default'], readOnly: [], quickActions: ['Communication center'], dataScope: 'Operational messaging issues and selected communications.' },
      [Role.CHAMA_ADMIN]: { sees: ['Feed', 'Drafts', 'Pinned items'], can: ['Create', 'Edit', 'Publish', 'Pin'], hidden: [], readOnly: [], quickActions: ['Announcements', 'Communication center'], dataScope: 'Current chama announcements with publishing controls.' },
      [Role.TREASURER]: { sees: ['Read-only announcement feed'], can: ['Reference communications'], hidden: ['Publishing tools'], readOnly: ['Announcement detail'], quickActions: ['Announcements'], dataScope: 'Current chama announcements.' },
      [Role.SECRETARY]: { sees: ['Feed', 'Drafts', 'Detail'], can: ['Create and edit when permitted'], hidden: ['Pin controls if policy locks them'], readOnly: ['Published items if policy restricts'], quickActions: ['Announcements', 'Communication center'], dataScope: 'Current chama announcements and communications.' },
      [Role.AUDITOR]: { sees: ['Read-only feed'], can: ['Inspect published communication history'], hidden: ['Authoring controls'], readOnly: ['All announcement actions'], quickActions: ['Announcements'], dataScope: 'Current chama published announcements only.' },
      [Role.MEMBER]: { sees: ['Announcement feed', 'Details'], can: ['Read only'], hidden: ['Drafts', 'Publishing', 'Management controls'], readOnly: ['All announcement records'], quickActions: ['Announcements'], dataScope: 'Published announcements in the member’s joined chamas.' },
    },
  },
  notifications: {
    id: 'notifications',
    route: 'Notifications',
    title: 'Notifications',
    sharedLayout: 'Personal inbox with unread states, navigation targets, and preferences.',
    commonSections: ['Inbox', 'Unread filter', 'Detail panel', 'Preferences'],
    accessPermissions: [Permission.CAN_VIEW_NOTIFICATIONS],
    roleExperience: {
      [Role.SUPERADMIN]: { sees: ['Personal notifications', 'Platform alerts'], can: ['Manage notification preferences'], hidden: [], readOnly: [], quickActions: ['Notifications'], dataScope: 'Personal inbox and role-specific platform alerts.' },
      [Role.ADMIN]: { sees: ['Personal notifications', 'Operations alerts'], can: ['Manage notification preferences'], hidden: [], readOnly: [], quickActions: ['Notifications'], dataScope: 'Personal inbox and operational alerts.' },
      [Role.CHAMA_ADMIN]: { sees: ['Personal notifications', 'Chama approvals and alerts'], can: ['Manage preferences'], hidden: [], readOnly: [], quickActions: ['Notifications'], dataScope: 'Personal inbox plus current chama operations alerts.' },
      [Role.TREASURER]: { sees: ['Personal notifications', 'Finance alerts'], can: ['Manage preferences'], hidden: [], readOnly: [], quickActions: ['Notifications'], dataScope: 'Personal inbox plus current chama finance alerts.' },
      [Role.SECRETARY]: { sees: ['Personal notifications', 'Meeting and communication reminders'], can: ['Manage preferences'], hidden: [], readOnly: [], quickActions: ['Notifications'], dataScope: 'Personal inbox plus current chama governance reminders.' },
      [Role.AUDITOR]: { sees: ['Personal notifications', 'Audit alerts'], can: ['Manage preferences'], hidden: [], readOnly: [], quickActions: ['Notifications'], dataScope: 'Personal inbox plus current chama oversight alerts.' },
      [Role.MEMBER]: { sees: ['Personal notifications', 'Announcements and obligations'], can: ['Manage preferences'], hidden: [], readOnly: [], quickActions: ['Notifications'], dataScope: 'Personal inbox and member-facing chama alerts.' },
    },
  },
  reports: {
    id: 'reports',
    route: 'ReportsHub',
    title: 'Reports',
    sharedLayout: 'Reports hub with categories, filters, exports, and saved presets.',
    commonSections: ['Categories', 'Filters', 'Exports', 'Saved views'],
    accessPermissions: [Permission.CAN_VIEW_REPORTS, Permission.CAN_VIEW_FINANCIAL_REPORTS],
    roleExperience: {
      [Role.SUPERADMIN]: { sees: ['Platform reports', 'Global metrics', 'Exports'], can: ['Export platform analytics'], hidden: ['Member-only report limitations'], readOnly: [], quickActions: ['Reports hub'], dataScope: 'Global platform reporting.' },
      [Role.ADMIN]: { sees: ['Operational reports', 'Case trends', 'Delivery issues'], can: ['Export operational reports'], hidden: ['Infrastructure-only reporting'], readOnly: [], quickActions: ['Reports hub'], dataScope: 'Operational platform reporting.' },
      [Role.CHAMA_ADMIN]: { sees: ['Operational reports', 'Member and finance summaries'], can: ['Export chama reports'], hidden: [], readOnly: [], quickActions: ['Reports hub'], dataScope: 'Broad current chama reporting.' },
      [Role.TREASURER]: { sees: ['Finance', 'Payments', 'Loans', 'Penalties'], can: ['Export finance reports'], hidden: ['Governance-only reports'], readOnly: [], quickActions: ['Reports hub'], dataScope: 'Current chama finance reporting.' },
      [Role.SECRETARY]: { sees: ['Attendance', 'Meetings', 'Governance', 'Communication'], can: ['Export secretary reports'], hidden: ['Treasury-only financial statements'], readOnly: [], quickActions: ['Reports hub'], dataScope: 'Current chama governance and participation reporting.' },
      [Role.AUDITOR]: { sees: ['Audit', 'Compliance', 'Finance review'], can: ['Export read-only reports'], hidden: ['Operational draft reports'], readOnly: ['All reports are read-only'], quickActions: ['Reports hub', 'Audit logs'], dataScope: 'Current chama audit and compliance reporting.' },
      [Role.MEMBER]: { sees: ['Personal statements', 'Own payment history', 'Own loans'], can: ['Export personal statements'], hidden: ['Group-wide reports'], readOnly: ['All personal reports'], quickActions: ['Reports hub'], dataScope: 'Personal statements only.' },
    },
  },
  profile: {
    id: 'profile',
    route: 'Profile',
    title: 'Profile',
    sharedLayout: 'Profile card, edit mode, chama memberships, role summaries, and KYC state.',
    commonSections: ['Profile card', 'Edit profile', 'Memberships', 'Role summary', 'KYC state'],
    accessPermissions: [Permission.CAN_VIEW_PROFILE],
    roleExperience: {
      [Role.SUPERADMIN]: { sees: ['Own profile', 'Platform role summary', 'KYC state'], can: ['Edit own profile', 'Manage own security'], hidden: [], readOnly: [], quickActions: ['Edit profile', 'KYC'], dataScope: 'Own user profile only.' },
      [Role.ADMIN]: { sees: ['Own profile', 'Operations role summary'], can: ['Edit own profile'], hidden: [], readOnly: [], quickActions: ['Edit profile', 'KYC'], dataScope: 'Own user profile only.' },
      [Role.CHAMA_ADMIN]: { sees: ['Own profile', 'Leadership summary'], can: ['Edit own profile'], hidden: [], readOnly: [], quickActions: ['Edit profile', 'KYC'], dataScope: 'Own user profile only.' },
      [Role.TREASURER]: { sees: ['Own profile', 'Treasury summary'], can: ['Edit own profile'], hidden: [], readOnly: [], quickActions: ['Edit profile', 'KYC'], dataScope: 'Own user profile only.' },
      [Role.SECRETARY]: { sees: ['Own profile', 'Secretary summary'], can: ['Edit own profile'], hidden: [], readOnly: [], quickActions: ['Edit profile', 'KYC'], dataScope: 'Own user profile only.' },
      [Role.AUDITOR]: { sees: ['Own profile', 'Auditor summary'], can: ['Edit own profile'], hidden: [], readOnly: [], quickActions: ['Edit profile', 'KYC'], dataScope: 'Own user profile only.' },
      [Role.MEMBER]: { sees: ['Own profile', 'Memberships', 'KYC state'], can: ['Edit own profile'], hidden: [], readOnly: [], quickActions: ['Edit profile', 'KYC'], dataScope: 'Own user profile only.' },
    },
  },
  settings: {
    id: 'settings',
    route: 'Settings',
    title: 'Settings',
    sharedLayout: 'Sectioned settings for appearance, notifications, privacy, security, and sessions.',
    commonSections: ['Appearance', 'Notifications', 'Privacy', 'Security', 'Sessions'],
    accessPermissions: [Permission.CAN_VIEW_PROFILE],
    roleExperience: {
      [Role.SUPERADMIN]: { sees: ['Core settings', 'Operational alert preferences'], can: ['Manage preferences'], hidden: ['Separate platform admin settings'], readOnly: [], quickActions: ['Settings'], dataScope: 'Own account preferences.' },
      [Role.ADMIN]: { sees: ['Core settings', 'Operational alert preferences'], can: ['Manage preferences'], hidden: ['Separate admin console settings'], readOnly: [], quickActions: ['Settings'], dataScope: 'Own account preferences.' },
      [Role.CHAMA_ADMIN]: { sees: ['Core settings', 'Operational alert preferences'], can: ['Manage preferences'], hidden: [], readOnly: [], quickActions: ['Settings'], dataScope: 'Own account preferences.' },
      [Role.TREASURER]: { sees: ['Core settings', 'Finance alert preferences'], can: ['Manage preferences'], hidden: [], readOnly: [], quickActions: ['Settings'], dataScope: 'Own account preferences.' },
      [Role.SECRETARY]: { sees: ['Core settings', 'Meeting and communication alerts'], can: ['Manage preferences'], hidden: [], readOnly: [], quickActions: ['Settings'], dataScope: 'Own account preferences.' },
      [Role.AUDITOR]: { sees: ['Core settings', 'Audit alert preferences'], can: ['Manage preferences'], hidden: [], readOnly: [], quickActions: ['Settings'], dataScope: 'Own account preferences.' },
      [Role.MEMBER]: { sees: ['Core settings'], can: ['Manage preferences'], hidden: ['Operational alert groups'], readOnly: [], quickActions: ['Settings'], dataScope: 'Own account preferences.' },
    },
  },
  support: {
    id: 'support',
    route: 'SupportIssues',
    title: 'Support & Disputes',
    sharedLayout: 'Case list with detail thread, create action, and role-aware resolution workflow.',
    commonSections: ['Case list', 'Case detail', 'Comments', 'Resolution notes'],
    accessPermissions: [Permission.CAN_VIEW_PROFILE],
    roleExperience: {
      [Role.SUPERADMIN]: { sees: ['Platform cases', 'Escalations', 'Resolution metrics'], can: ['Inspect escalations'], hidden: ['Member-only create shortcuts'], readOnly: [], quickActions: ['Support issues'], dataScope: 'Global platform support and dispute context.' },
      [Role.ADMIN]: { sees: ['Platform support queue', 'Moderation cases', 'Disputes'], can: ['Resolve, assign, escalate'], hidden: [], readOnly: [], quickActions: ['Support issues'], dataScope: 'Platform support and moderation scope.' },
      [Role.CHAMA_ADMIN]: { sees: ['Chama-level tickets and disputes'], can: ['Resolve chama-level issues where policy permits'], hidden: ['Platform moderation tools'], readOnly: [], quickActions: ['Support issues'], dataScope: 'Current chama issues and disputes.' },
      [Role.TREASURER]: { sees: ['Finance-linked disputes'], can: ['Inspect payment and loan issues'], hidden: ['General moderation tools'], readOnly: ['Non-finance case actions'], quickActions: ['Payment disputes'], dataScope: 'Current chama issues related to finance workflows.' },
      [Role.SECRETARY]: { sees: ['Communication and meeting-related tickets'], can: ['Inspect and coordinate'], hidden: ['Deep moderation tools'], readOnly: ['Resolution actions outside assignment'], quickActions: ['Support issues'], dataScope: 'Current chama coordination-related issues.' },
      [Role.AUDITOR]: { sees: ['Assigned or visible issues'], can: ['Inspect read-only case history'], hidden: ['Resolve actions'], readOnly: ['All support workflows'], quickActions: ['Support issues'], dataScope: 'Read-only cases exposed for oversight.' },
      [Role.MEMBER]: { sees: ['Own tickets and disputes'], can: ['Create and track own cases'], hidden: ['Other members cases', 'Resolution controls'], readOnly: ['Resolved cases'], quickActions: ['Support issues'], dataScope: 'Only the current member’s own tickets and disputes.' },
    },
  },
  aiAssistant: {
    id: 'aiAssistant',
    route: 'AIChat',
    title: 'AI Assistant',
    sharedLayout: 'Chat workspace with quick prompts, result cards, and permission-filtered suggestions.',
    commonSections: ['Chat', 'Prompt packs', 'Suggested actions', 'Result cards'],
    accessPermissions: [],
    roleExperience: {
      [Role.SUPERADMIN]: { sees: ['Platform ops prompts', 'Analytics prompts'], can: ['Ask platform-wide questions'], hidden: ['Unauthorized chama-private responses'], readOnly: [], quickActions: ['AI assistant'], dataScope: 'Platform-wide but permission-filtered context.' },
      [Role.ADMIN]: { sees: ['Operations prompts', 'Support prompts'], can: ['Ask operations questions'], hidden: ['Unauthorized infrastructure answers'], readOnly: [], quickActions: ['AI assistant'], dataScope: 'Operational data scope filtered by admin permissions.' },
      [Role.CHAMA_ADMIN]: { sees: ['Operations prompts', 'Governance prompts', 'Health prompts'], can: ['Ask chama-wide operational questions'], hidden: ['Platform-only analytics'], readOnly: [], quickActions: ['AI assistant'], dataScope: 'Current chama data filtered by permissions.' },
      [Role.TREASURER]: { sees: ['Finance prompts', 'Risk prompts', 'Collections prompts'], can: ['Ask treasury questions'], hidden: ['Governance-only private data'], readOnly: [], quickActions: ['AI assistant'], dataScope: 'Current chama finance context filtered by permissions.' },
      [Role.SECRETARY]: { sees: ['Meetings prompts', 'Communication prompts', 'Records prompts'], can: ['Ask secretary workflow questions'], hidden: ['Treasury-private data'], readOnly: [], quickActions: ['AI assistant'], dataScope: 'Current chama governance and records context filtered by permissions.' },
      [Role.AUDITOR]: { sees: ['Compliance prompts', 'Audit prompts', 'Risk prompts'], can: ['Ask read-only oversight questions'], hidden: ['Operational action suggestions'], readOnly: ['Suggested actions remain advisory only'], quickActions: ['AI assistant'], dataScope: 'Current chama read-only audit context filtered by permissions.' },
      [Role.MEMBER]: { sees: ['Obligations prompts', 'Payments prompts', 'Meetings prompts'], can: ['Ask personal chama questions'], hidden: ['Other members or operational data'], readOnly: [], quickActions: ['AI assistant'], dataScope: 'Only the member’s own records and public-safe chama context.' },
    },
  },
};

export function getSharedPageConfig(pageId: SharedPageId): SharedPageConfig {
  return SHARED_PAGE_ARCHITECTURE[pageId];
}

export function getRolePageExperience(pageId: SharedPageId, role: Role): RoleExperience {
  return SHARED_PAGE_ARCHITECTURE[pageId].roleExperience[role];
}
