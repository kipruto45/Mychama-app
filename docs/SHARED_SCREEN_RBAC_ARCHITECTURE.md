# MyChama Shared-Screen RBAC Architecture

## 0. Pre-Implementation Blueprint

This is the standard architecture checkpoint before any further screen implementation work begins.

### Shared Screen List

- Dashboard
- Chamas
- Chama Details
- Members
- Contributions
- Payments
- Loans
- Meetings
- Motions / Governance
- Announcements
- Notifications
- Reports
- Profile
- Settings
- Support / Disputes
- AI Assistant

### Separate Screen List

- Login
- Register
- OTP Verification
- Invite Preview
- Join with Code
- Join Success
- KYC Submission
- Payment Processing / Checkout
- Platform SuperAdmin Console
- Reconciliation Case Deep Workflow
- Access Denied
- Not Found
- Session Expired
- Maintenance

### Role-Permission Matrix

The code-backed role-permission matrix now lives in:

- `src/rbac/architecture.ts` via `ROLE_PERMISSION_MATRIX`
- `src/auth/permissions.ts` via `ROLE_PERMISSIONS`

Role summary:

| Role | Permission source | Pattern |
| --- | --- | --- |
| SuperAdmin | Full platform permission set | platform-wide control, provider health, risk, jobs, analytics |
| Admin | Operational platform permission set | support, moderation, disputes, communications |
| ChamaAdmin | Full chama-leadership permission set | members, approvals, policies, governance, announcements |
| Treasurer | Finance-heavy permission set | contributions, payments, reconciliation, loans, fines, finance reports |
| Secretary | Coordination and records permission set | meetings, attendance, minutes, announcements, communication |
| Auditor | Read-only oversight permission set | finance review, compliance, governance review, audit trails |
| Member | Self-service permission set | own contributions, payments, loans, meetings, profile, support |

### Widget / Action Visibility Matrix

The code-backed matrices now live in:

- `src/rbac/architecture.ts` via `DASHBOARD_WIDGET_VISIBILITY_MATRIX`
- `src/rbac/architecture.ts` via `ACTION_VISIBILITY_MATRIX`
- `src/rbac/architecture.ts` via `PRE_IMPLEMENTATION_BLUEPRINT`

### Role Navigation Structure

| Role | Navigation Sections |
| --- | --- |
| SuperAdmin | Main: Dashboard, Chamas, ReportsHub, Notifications. Platform: PlatformDashboard, AuditLogs, SupportIssues, AIChat. Personal: Profile, Settings |
| Admin | Main: Dashboard, Chamas, ReportsHub, Notifications. Operations: SupportIssues, Payments, Governance, AIChat. Personal: Profile, Settings |
| ChamaAdmin | Main: Dashboard, Chamas, ChamaDetail, MemberList. Operations: ContributionCompliance, Finance, Payments, LoanApplications, Meetings, Governance, AnnouncementsFeed, ReportsHub, SupportIssues, AIChat. Personal: Profile, Settings, Notifications |
| Treasurer | Main: Dashboard, Chamas, Finance, Payments. Finance Ops: ContributionCompliance, LoanApplications, ReportsHub, SupportIssues, AIChat. Personal: Profile, Settings, Notifications |
| Secretary | Main: Dashboard, Chamas, Meetings, Governance. Coordination: AnnouncementsFeed, MemberList, ReportsHub, SupportIssues, AIChat. Personal: Profile, Settings, Notifications |
| Auditor | Main: Dashboard, Chamas, Finance, ReportsHub. Review: Payments, LoanApplications, Governance, SupportIssues, AIChat. Personal: Profile, Settings, Notifications |
| Member | Main: Dashboard, Chamas, Payments, Meetings. Self Service: ContributionCompliance, LoanApplications, AnnouncementsFeed, SupportIssues, AIChat. Personal: Profile, Settings, Notifications |

The role-based navigation blueprint is also codified in:

- `src/rbac/architecture.ts` via `ROLE_NAVIGATION_BLUEPRINT`

## 1. Full Shared-Screen Architecture

MyChama is built around shared screens with strict RBAC-driven behavior. Most roles use the same route and base layout, but the page changes by role through:

- route guards
- screen guards
- section guards
- tab guards
- widget visibility
- quick action visibility
- table column visibility
- filter visibility
- read-only vs editable state
- backend data scope

Shared screens:

| Screen | Base Layout |
| --- | --- |
| Dashboard | Hero summary, widgets, alerts, quick actions, charts, role-aware empty states |
| Chamas | Search, filters, cards or rows, role badges, context switcher |
| Chama Details | Header summary, stat cards, role-aware tabs, quick actions, document/history sections |
| Members | Search, table/list, filters, details panel, role-aware profile view |
| Contributions | Summary cards, due/overdue/paid views, filters, compliance insights |
| Finance | Hero summary, finance metrics, charts, tabs, operational shortcuts |
| Payments | Transaction table, status chips, filters, receipt and detail states |
| Loans | Portfolio summary, applications list, filters, risk indicators, detail cards |
| Meetings | List/calendar toggle, detail page, agenda/attendance/minutes/resolutions |
| Motions / Governance | Motion list, detail panel, result state, archive and decision history |
| Announcements | Feed, detail view, create/edit state where permitted |
| Notifications | List, filters, detail state, settings entry |
| Reports | Reports hub, categories, filters, export actions |
| Profile | Profile summary, edit state, memberships, KYC, role summary |
| Settings | Appearance, notifications, privacy, security, sessions, operational alerts |
| Support / Disputes | Ticket list, filters, detail view, create or resolve flows |
| AI Assistant | Chat, prompts, insights panel, suggested actions, RBAC-filtered output |

## 2. Pages That Remain Separate

These stay separate because the workflow is materially different or privileged:

- Login
- Register
- OTP Verification
- Invite Preview
- Join with Code
- Join Success
- KYC Submission
- Payment Processing / Checkout
- Platform SuperAdmin Console
- Reconciliation Case Deep Workflow
- Access Denied
- Not Found
- Session Expired
- Maintenance

## 3. Role-by-Role Access Matrix

The code-backed access matrix lives in:

- `src/rbac/architecture.ts` via `ROLE_ACCESS_SUMMARY`
- `src/rbac/screenMatrix.ts` via `SCREEN_RBAC_MATRIX`

| Role | Primary Focus | Shared Screens | Separate Screens |
| --- | --- | --- | --- |
| SuperAdmin | Platform operations, provider health, fraud/risk, analytics | Dashboard, Chamas, Chama Details, Members, Contributions, Finance, Payments, Loans, Meetings, Governance, Notifications, Reports, Profile, Settings, Support, AI | Platform SuperAdmin Console |
| Admin | Support, moderation, disputes, communication operations | Dashboard, Chamas, Chama Details, Members, Contributions, Finance, Payments, Loans, Meetings, Governance, Notifications, Reports, Profile, Settings, Support, AI | Privileged communication center if run in platform mode |
| ChamaAdmin | One-chama leadership, approvals, policies, announcements | Dashboard, Chamas, Chama Details, Members, Contributions, Finance, Payments, Loans, Meetings, Governance, Announcements, Notifications, Reports, Profile, Settings, Support, AI | None |
| Treasurer | Payments, reconciliation, expenses, withdrawals, loans, reports | Dashboard, Chamas, Chama Details, Members, Contributions, Finance, Payments, Loans, Meetings, Governance, Announcements, Notifications, Reports, Profile, Settings, Support, AI | Payment checkout, reconciliation deep workflow |
| Secretary | Meetings, attendance, minutes, announcements, communication | Dashboard, Chamas, Chama Details, Members, Contributions, Meetings, Governance, Announcements, Notifications, Reports, Profile, Settings, Support, AI | None |
| Auditor | Read-only review, compliance, audit, governance review | Dashboard, Chamas, Chama Details, Members, Contributions, Finance, Payments, Loans, Meetings, Governance, Announcements, Notifications, Reports, Profile, Settings, Support, AI | None |
| Member | Self-service chama activity, payments, loans, meetings, support | Dashboard, Chamas, Chama Details, Members, Contributions, Payments, Loans, Meetings, Governance, Announcements, Notifications, Reports, Profile, Settings, Support, AI | KYC submission, payment checkout |

## 4. Screen-by-Screen RBAC Breakdown

The code-backed per-screen, per-role breakdown now lives in:

- `src/rbac/architecture.ts` via `getScreenRoleBreakdown()`
- `src/rbac/screenMatrix.ts` via `SCREEN_RBAC_MATRIX`
- `src/rbac/pageHelpers.ts` via `TABLE_COLUMN_MATRIX`

### Dashboard

- Base layout: hero summary, cards, alerts, quick actions, role widgets.
- Roles:
  - Member sees due items, active loan, next meeting, announcements, notifications.
  - Secretary sees meetings queue, attendance trends, minutes and reminder work.
  - Treasurer sees verification queue, liquidity, reconciliations, pending expenses/withdrawals.
  - ChamaAdmin sees approvals, join requests, invites, health, overdue items, governance alerts.
  - Auditor sees compliance, audit alerts, role changes, finance anomalies.
  - Admin sees disputes, moderation items, support queue, failed communications.
  - SuperAdmin sees users, chamas, provider health, failed jobs, fraud flags, platform analytics.
- Hidden:
  - Member does not see operational queues.
  - Secretary does not see finance-verification widgets.
  - Treasurer does not see moderation widgets.
- Read-only:
  - Auditor widgets are read-only.
- Data:
  - Member uses `own_records`
  - Chama roles use `scoped_chama`
  - Admin uses `platform_support`
  - SuperAdmin uses `platform_all`

### Chamas

- Base layout: search, filter, cards or rows, role badge, workspace switcher.
- Role shaping:
  - Member: joined chamas only, join/create actions.
  - Secretary: chama cards with governance and meeting signals.
  - Treasurer: chama cards with finance status.
  - ChamaAdmin: managed chamas with admin shortcuts.
  - Auditor: review indicators only.
  - Admin/SuperAdmin: platform or moderation-oriented inspection mode.
- Hidden:
  - platform-only moderation signals hidden from non-platform roles
- Read-only:
  - Auditor
- Data:
  - own memberships, scoped chama, or platform moderation/platform all depending on role

### Chama Details

- Base layout: header summary, stat cards, tabs, quick actions, contextual history.
- Role shaping:
  - Member: overview, rules, announcements, meetings, obligations.
  - Secretary: overview, meetings, attendance, records, announcements.
  - Treasurer: overview, finance, contributions, loans.
  - ChamaAdmin: overview, members, finance, governance, policies, documents.
  - Auditor: overview, finance history, governance history.
  - Admin/SuperAdmin: support, moderation, system metadata.
- Hidden:
  - settings and policy mutation tools hidden from Member, Secretary, Treasurer, Auditor
- Read-only:
  - Auditor, Admin, SuperAdmin
- Data:
  - own_records, scoped_chama, platform_moderation, investigation_only depending on role

### Members

- Base layout: searchable list or table, filters, detail pane.
- Role shaping:
  - Member: limited public details only.
  - Secretary: attendance, engagement, communication readiness.
  - Treasurer: contribution balance, loan exposure, fine balance.
  - ChamaAdmin: role assignment, suspension, lifecycle actions.
  - Auditor: history and compliance only.
  - Admin/SuperAdmin: platform or moderated member inspection.
- Hidden:
  - full financial profile hidden from Member and Secretary
  - lifecycle actions hidden from Treasurer, Secretary, Auditor, Member
- Read-only:
  - Auditor, Member
- Data:
  - own_records, scoped_chama, platform_moderation, platform_all

### Contributions

- Base layout: summary cards, status tabs, filters, detail view.
- Role shaping:
  - Member: own due, overdue, paid records and pay actions.
  - Secretary: reminder-support view only.
  - Treasurer: all records, queues, compliance dashboard, exports.
  - ChamaAdmin: group compliance and follow-up.
  - Auditor: read-only contribution review.
  - Admin/SuperAdmin: inspect-only or support-oriented analytics.
- Hidden:
  - adjustment workflows hidden from Member, Secretary, Auditor
- Read-only:
  - Auditor, Admin, SuperAdmin
- Data:
  - own_records, scoped_chama, platform_support, platform_all

### Payments

- Base layout: transactions table, status chips, filters, detail state, receipts.
- Role shaping:
  - Member: own payments, receipts, retry actions.
  - Treasurer: all chama transactions, verification and failure handling.
  - ChamaAdmin: overview and exception oversight.
  - Auditor: read-only audit trail.
  - Secretary: hidden from operational payments screen.
  - Admin/SuperAdmin: inspection or support-oriented payment review.
- Hidden:
  - operational verification and reconciliation hidden from Member and Secretary
- Read-only:
  - Auditor, partial ChamaAdmin oversight
- Data:
  - own_records, scoped_chama, platform_support, platform_all

### Loans

- Base layout: portfolio summary, application queue, filters, detail cards.
- Role shaping:
  - Member: own eligibility, request flow, active loans, repayment schedule, guarantor inbox.
  - Treasurer: applications, disbursement, overdue/defaulted, risk.
  - ChamaAdmin: approvals, portfolio, recovery and restructure context.
  - Auditor: read-only review of defaults, recovery, restructure history.
  - Secretary: hidden from loan operations screen.
  - Admin/SuperAdmin: investigation or escalation context only.
- Hidden:
  - approval, recovery, restructure actions hidden from Member, Secretary, Auditor
- Read-only:
  - Auditor, Admin, SuperAdmin
- Data:
  - own_records, scoped_chama, platform_support, platform_all

### Meetings

- Base layout: list/calendar toggle, details, agenda, attendance, minutes, resolutions.
- Role shaping:
  - Member: upcoming and past meetings, published records.
  - Secretary: full meeting operations and records management.
  - ChamaAdmin: governance oversight with create/edit/cancel where permitted.
  - Treasurer: mostly read-only context.
  - Auditor: read-only governance records.
  - Admin/SuperAdmin: inspection context only.
- Hidden:
  - draft governance records hidden from Member
- Read-only:
  - Member, Treasurer, Auditor, Admin, SuperAdmin
- Data:
  - own_records for attendance context or scoped_chama for operational roles

### Motions / Governance

- Base layout: motion list, detail, result state, archive.
- Role shaping:
  - Member: active motions, vote, results where allowed.
  - Secretary: governance records support.
  - ChamaAdmin: create, manage voting, finalize outcomes.
  - Auditor: read-only archive and results.
  - Treasurer: relevant motions with member-level participation only.
  - Admin/SuperAdmin: inspect only.
- Hidden:
  - finalize/archive controls hidden from Member, Treasurer, Auditor
- Read-only:
  - Auditor, Admin, SuperAdmin
- Data:
  - own_records for Member, scoped_chama for chama roles, investigation/platform moderation for platform roles

### Announcements

- Base layout: feed, detail, create/edit state where permitted.
- Role shaping:
  - Member: read only.
  - Secretary: draft and post where permitted.
  - ChamaAdmin: create, edit, publish, pin.
  - Treasurer/Auditor: mostly read only.
  - Admin/SuperAdmin: platform messaging belongs elsewhere.
- Hidden:
  - platform roles do not use this chama announcements feed for privileged communications
- Read-only:
  - Member, Treasurer, Auditor
- Data:
  - own_records for member feed context, scoped_chama for chama roles

### Notifications

- Base layout: list, filters, read/unread state, detail, settings entry.
- All roles see personal notifications.
- Content and linked destinations vary by role.
- Operational roles see alert-heavy content.
- Hidden:
  - no shared global inbox
- Read-only:
  - inbox records are informational, settings still editable
- Data:
  - always personal delivery scope

### Reports

- Base layout: report categories, filters, exports, report cards.
- Role shaping:
  - Member: personal statements only.
  - Secretary: attendance, meetings, governance.
  - Treasurer: finance, payments, expenses, loans, fines.
  - ChamaAdmin: broad operational reports.
  - Auditor: audit, compliance, finance, governance.
  - Admin/SuperAdmin: platform and operations reports separately.
- Hidden:
  - platform analytics hidden from chama-only roles
- Read-only:
  - reports are read-centric, export depends on permission
- Data:
  - own_records, scoped_chama, platform_support, platform_all

### Profile

- Base layout: summary, edit state, memberships, role summary, KYC, security links.
- All roles manage own profile.
- Role summary and visible supporting info differ by role.
- Hidden:
  - privileged platform-only metadata
- Read-only:
  - immutable identity fields as policy requires
- Data:
  - own identity only

### Settings

- Base layout: appearance, notifications, privacy, security, sessions.
- All roles see core settings.
- Operational roles see extra alert preferences.
- Hidden:
  - platform console settings are separate
- Read-only:
  - some enforced policy settings
- Data:
  - own preferences only

### Support / Disputes

- Base layout: list, filters, detail view, create or resolve actions.
- Member: own tickets only.
- Secretary: meeting or communication issues where permitted.
- Treasurer: finance-related issues where permitted.
- ChamaAdmin: chama-level issues.
- Admin: support and moderation queue.
- Auditor: mostly read-only.
- SuperAdmin: platform support operations in admin mode.
- Hidden:
  - member cannot see other cases
  - chama roles cannot see platform moderation queues unless elevated
- Read-only:
  - Auditor
- Data:
  - own_records, assigned operational cases, scoped_chama, platform_support

### AI Assistant

- Base layout: chat, quick prompts, insights panel, suggested actions.
- Member: personal chama questions only.
- Secretary: meetings and communication prompts.
- Treasurer: finance, liquidity, payments, loans.
- ChamaAdmin: governance, approvals, chama health.
- Auditor: audit and compliance prompts.
- Admin/SuperAdmin: platform or operations prompts.
- All AI responses must be backend-scoped.
- Hidden:
  - prompts outside role scope
- Read-only:
  - informational by default, mutations still separately guarded
- Data:
  - uses the same backend scope as the launching screen or role context

## 5. Widget Visibility Matrix by Role

Widgets are driven from the screen RBAC matrix.

| Screen | Member | Secretary | Treasurer | ChamaAdmin | Auditor | Admin | SuperAdmin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | Due items, loan summary, notifications | Meeting queue, attendance alerts, announcement tasks | Verifications, liquidity, reconciliation | Health score, approvals, alerts | Compliance, audit alerts, defaults | Tickets, disputes, alerts | Users, chamas, support backlog, risk alerts |
| Finance | Hidden | Hidden | Collections, liquidity, workload | Balances, compliance, loan pipeline | Read-only balances and exposure | Issue-driven finance view | Platform finance health |
| Loans | Own eligibility and active loan | Hidden | Risk, exposure, overdue | Portfolio, approvals, recovery | Defaults and recovery review | Escalation context | Platform loan trends |

## 6. Quick Action Matrix by Role

| Role | Primary Quick Actions |
| --- | --- |
| Member | Pay contribution, request loan, open meeting, open chama |
| Secretary | Create meeting, record minutes, send reminder, post announcement |
| Treasurer | Verify payment, resolve reconciliation, approve expense, open finance reports |
| ChamaAdmin | Invite members, approve request, create announcement, schedule meeting |
| Auditor | Open audit log, review compliance report, inspect anomalies |
| Admin | Resolve ticket, review flagged chama, message affected users |
| SuperAdmin | Open failed jobs, review fraud flags, inspect provider health, manage platform issues |

## 7. Tab / Section Visibility Matrix by Role

| Screen | Member | Secretary | Treasurer | ChamaAdmin | Auditor | Admin / SuperAdmin |
| --- | --- | --- | --- | --- | --- | --- |
| Chama Details | Overview, Rules, Announcements, Meetings | Overview, Meetings, Attendance, Records, Announcements | Overview, Finance, Contributions, Loans | Overview, Members, Finance, Governance, Policies, Documents | Overview, Finance, Governance, History | Overview, Support/Moderation/System metadata |
| Payments | History, Details, Receipts | Hidden | Overview, History, Verification, Failures | Overview | Read-only audit detail | Inspection/support |
| Loans | Eligibility, Request, Active, Schedule, History | Hidden | Applications, Active, Repayments, Overdue, Risk | Portfolio, Applications, Overdue, Recovery | Read-only review | Escalation/investigation |
| Meetings | Upcoming, Past, Details | List, Calendar, Agenda, Attendance, Minutes, Resolutions, Reports | Context view only | List, Calendar, Details, Records | Review only | Inspection only |
| Reports | Contributions, Payments, Loans, Fines | Attendance, Meetings, Governance | Finance, Payments, Expenses, Loans, Fines | Contributions, Finance, Loans, Attendance, Governance | Audit, Compliance, Finance, Governance | Platform / operations reports |

## 8. Table Column Visibility Matrix by Role

Current shared table columns are defined in `src/rbac/pageHelpers.ts`.

Examples:

### Members

- Member: `Name`, `Role`, `Join date`
- Secretary: `Name`, `Role`, `Attendance`, `Last meeting`, `Communication`
- Treasurer: `Name`, `Role`, `Dues status`, `Savings`, `Loan balance`, `Fine balance`
- ChamaAdmin: `Name`, `Role`, `Status`, `Join date`, `Approvals`, `Last active`, `Actions`
- Auditor: `Name`, `Role`, `Status`, `Compliance`, `History`

### Payments

- Member: `Reference`, `Purpose`, `Amount`, `Status`, `Receipt`
- Treasurer: `Member`, `Channel`, `Reference`, `Amount`, `Status`, `Verification`, `Reconciliation`
- Auditor: `Member`, `Channel`, `Reference`, `Amount`, `Status`, `Verified by`

### Loans

- Member: `Principal`, `Status`, `Next repayment`, `Balance`
- Treasurer: `Borrower`, `Principal`, `Status`, `Next repayment`, `Risk`, `Guarantors`
- ChamaAdmin: `Borrower`, `Principal`, `Status`, `Approvals`, `Recovery`
- Auditor: `Borrower`, `Principal`, `Status`, `Recovery`, `Exceptions`

## 9. Backend Data Scope Matrix by Role

| Scope Key | Meaning |
| --- | --- |
| `platform_all` | Platform-wide records for SuperAdmin or privileged platform contexts |
| `platform_moderation` | Platform records filtered to moderation or support contexts |
| `platform_support` | Operational support records only |
| `scoped_chama` | Only records for the current chama workspace |
| `own_records` | Only records owned by the current user |
| `investigation_only` | Restricted inspection payloads for special cases |

Examples:

- Member payments use `own_records`
- Treasurer payments use `scoped_chama`
- Auditor finance uses `scoped_chama` with read-only UI
- SuperAdmin dashboard uses `platform_all`
- Admin support queues use `platform_support`

Backend rules:

- every mutation checks permission plus object scope
- every list is scoped by platform, chama, investigation, or own records
- hidden UI fields are also removed or redacted from payloads
- read-only roles never receive writable mutations
- AI answers use the same backend scope as the invoking screen

Frontend rules:

- route guards must stop disallowed screens before mount
- section guards must control internal shared-screen blocks
- tabs, widgets, filters, and actions must be independently RBAC-aware
- read-only roles must see disabled or explanatory states, not hidden write paths
- table columns must match role scope, not just role label

## 10. Modern Design Guidance for Shared Role-Aware Screens

- Use one clean shell per screen and swap internal sections by role.
- Keep cards dense but readable.
- Show scope labels like `own records`, `scoped chama`, or `platform support`.
- Use read-only banners for auditor and restricted views.
- Prefer explicit quick actions instead of overloaded floating menus.
- Keep member views simpler and calmer than operations views.
- Keep operational screens rich with filters, chips, summaries, and status clusters.
- Use role-aware empty states so users know what they can do next.
- Prefer one shared screen with modular role-aware internals over separate role copies.

## 11. Recommended Reusable Components

These are the preferred building blocks for the shared-screen system:

- `RoleAwarePageShell`
- `RequireRouteAccess`
- `RequireScreenAccess`
- `SectionGuard`
- `ActionGuard`
- `FieldGuard`
- `AccessBadge`
- `ScopeBadge`
- `ReadOnlyBanner`
- `QuickActionBar`
- `RoleAwareTabBar`
- `ChamaContextSwitcher`
- `Card`
- `Badge`
- `Button`
- `EmptyState`
- `SkeletonList`
- `StatCard`
- `TransactionCard`
- `MeetingCard`
- `ContributionChart`
- `BalanceChart`

## 12. Final Route Structure

The code-backed route and navigation structure lives in:

- `src/rbac/architecture.ts` via `STANDARD_NAVIGATION_STRUCTURE`
- `src/rbac/architecture.ts` via `FINAL_ROUTE_STRUCTURE`
- `src/navigation/AppNavigator.tsx`

### Shared Routes

- `Dashboard`
- `Chamas`
- `ChamaDetail`
- `MemberList`
- `ContributionCompliance`
- `Finance`
- `Payments`
- `LoanApplications`
- `Meetings`
- `Governance`
- `AnnouncementsFeed`
- `Notifications`
- `ReportsHub`
- `Profile`
- `Settings`
- `SupportIssues`
- `AIChat`

### Special Routes

- `Login`
- `Register`
- `OTP`
- `OTPVerification`
- `InvitePreview`
- `JoinViaCode`
- `JoinSuccess`
- `KYC`
- `PaymentStatus`
- `PlatformDashboard`

### Implementation Rule

For every shared screen, enforce RBAC at:

1. route level
2. screen level
3. section level
4. tab level
5. widget level
6. action/button level
7. table column level
8. backend query scope level

The goal is one scalable app, not many duplicate apps hidden inside one codebase.

## 13. Implementation Source of Truth

These are the primary implementation files behind this final architecture:

- `src/rbac/architecture.ts`
- `src/rbac/screenMatrix.ts`
- `src/rbac/pageHelpers.ts`
- `src/rbac/guards.tsx`
- `src/config/sharedPageArchitecture.ts`
- `src/components/system/RoleAwarePageShell.tsx`
- `src/navigation/AppNavigator.tsx`

Backend contract:

- `../Mychama-backend/docs/SHARED_SCREEN_RBAC_CONTRACT.md`
