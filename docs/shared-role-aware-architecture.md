# Shared-Screen, Role-Aware Architecture

MyChama uses a shared-screen architecture. Most roles use the same screens, but RBAC changes the data, widgets, tabs, actions, filters, columns, and editability inside those screens.

This document is the frontend product and RBAC contract for the app. It is implemented by the shared RBAC runtime in:

- `src/config/sharedPageArchitecture.ts`
- `src/rbac/screenMatrix.ts`
- `src/rbac/pageHelpers.ts`
- `src/rbac/guards.tsx`
- `src/rbac/architecture.ts`
- `src/components/system/RoleAwarePageShell.tsx`
- `src/navigation/AppNavigator.tsx`

The Django backend contract that matches this model lives in:

- `../Mychama-backend/docs/SHARED_SCREEN_RBAC_CONTRACT.md`

The pre-implementation blueprint requested for planning is available directly in code through:

- `SHARED_SCREEN_LIST`
- `SEPARATE_SCREEN_LIST`
- `ROLE_PERMISSION_MATRIX`
- `DASHBOARD_WIDGET_VISIBILITY_MATRIX`
- `ACTION_VISIBILITY_MATRIX`
- `STANDARD_NAVIGATION_STRUCTURE`
- `PRE_IMPLEMENTATION_BLUEPRINT`

These live in `src/rbac/architecture.ts` so the planning outputs and the implementation stay aligned.

## 1. Full Shared-Screen Architecture

### Core principle

One screen per workflow. Different role experiences inside that same screen.

RBAC is enforced at:

1. route or screen level
2. section level
3. tab level
4. widget or card level
5. button or action level
6. form field level
7. table column level
8. backend query scope level

### Shared screens

1. Dashboard
2. Chamas
3. Chama Details
4. Members
5. Contributions
6. Payments
7. Loans
8. Meetings
9. Motions / Governance
10. Announcements
11. Notifications
12. Reports
13. Profile
14. Settings
15. Support / Disputes
16. AI Assistant

### Pages that remain separate

1. Login
2. Register
3. OTP Verification
4. Invite Preview
5. Join with Code
6. Join Success
7. KYC Submission
8. Payment Checkout / Processing
9. Platform SuperAdmin Console
10. Reconciliation Case Deep Detail
11. Communication Center when truly privileged
12. Access Denied
13. Not Found
14. Session Expired
15. Maintenance

### Shared shell model

Every shared screen uses the same structural pattern:

- `Top app shell`
- `Role-aware page hero`
- `Scope badge`
- `Quick action bar`
- `Summary cards`
- `Tabs and filters`
- `List, table, cards, or calendar view`
- `Detail drawer or detail panel`
- `Permission-aware empty state`

## 2. Role-by-Role Access Matrix

Legend:

- `full`: broad interactive access
- `limited`: scoped operational access
- `read_only`: inspect only
- `self_service`: own records and personal actions
- `support`: support or moderation access
- `inspect_only`: investigation or oversight only

| Screen | SuperAdmin | Admin | ChamaAdmin | Treasurer | Secretary | Auditor | Member |
|---|---|---|---|---|---|---|---|
| Dashboard | full | full | full | full | full | read_only | self_service |
| Chamas | full | support | full | limited | limited | read_only | self_service |
| Chama Details | inspect_only | support | full | limited | limited | read_only | self_service |
| Members | full | support | full | limited | limited | read_only | limited |
| Contributions | inspect_only | support | full | full | limited | read_only | self_service |
| Payments | inspect_only | support | limited | full | limited | read_only | self_service |
| Loans | inspect_only | support | full | full | limited | read_only | self_service |
| Meetings | inspect_only | support | full | limited | full | read_only | self_service |
| Governance | inspect_only | support | full | limited | limited | read_only | self_service |
| Announcements | inspect_only | support | full | read_only | full | read_only | self_service |
| Notifications | full | full | full | full | full | read_only | self_service |
| Reports | full | support | full | full | full | read_only | self_service |
| Profile | self_service | self_service | self_service | self_service | self_service | self_service | self_service |
| Settings | self_service | self_service | self_service | self_service | self_service | self_service | self_service |
| Support / Disputes | support | full | full | limited | limited | read_only | self_service |
| AI Assistant | full | full | full | full | full | full | self_service |

## 3. Role-Based Dashboard Widget Matrix

| Role | Primary widgets | Quick actions |
|---|---|---|
| Member | next contribution due, overdue items, active loan summary, next meeting, recent announcements, recent transactions, unread notifications | pay contribution, request loan, open meeting, open chama |
| Secretary | upcoming meetings, meetings missing agenda or minutes, attendance trends, reminder queue, announcement shortcuts | create meeting, record minutes, send reminder, post announcement |
| Treasurer | payment verification queue, pending reconciliations, liquidity summary, contribution compliance, pending expenses, pending withdrawals, overdue loans and fines | verify payment, review reconciliation, approve expense, open reports |
| ChamaAdmin | join requests, invite queue, pending approvals, chama health, overdue contributions, overdue loans, governance alerts, member issues | invite members, approve request, create announcement, schedule meeting, review policies |
| Auditor | compliance summary, audit alerts, role changes, loan default review, finance review cards, anomaly feed | open audit logs, export compliance report, review finance anomalies |
| Admin | disputes, moderation items, support queue, operational alerts, failed communications | resolve ticket, review flagged user or chama, send communication |
| SuperAdmin | total users, total chamas, provider health, failed jobs, fraud flags, platform analytics, escalations | inspect provider, view failed jobs, review fraud flags, manage platform issues |

## 4. Screen-by-Screen RBAC Breakdown

### Dashboard

- Base layout: page hero, active scope indicator, widget grid, quick actions rail, alerts, recent activity.
- Access: all roles.
- Member sees due obligations, next meeting, recent transactions, announcements, notifications.
- Secretary sees meeting workflow cards, agenda and minutes backlog, attendance summaries, communication reminders.
- Treasurer sees finance queues, compliance summaries, reconciliation status, liquidity trends, expenses and withdrawals.
- ChamaAdmin sees approvals, join requests, governance alerts, health score, member issues.
- Auditor sees read-only compliance, anomaly widgets, role change history, defaults.
- Admin sees disputes, support, moderation, delivery failures, platform ops alerts.
- SuperAdmin sees provider health, jobs, risk and fraud, platform KPIs.
- Hidden by role: platform widgets hidden from chama-scoped roles; financial mutation widgets hidden from non-finance roles.
- Read-only by role: Auditor is read-only; Member is self-service only.
- Data scope: Member gets personal records, operational roles get active chama scope, Admin gets moderation scope, SuperAdmin gets platform scope.

### Chamas

- Base layout: search, filters, role badges, table or cards, current chama switcher.
- Access: all roles.
- Member sees joined chamas and pending join requests.
- Secretary sees joined chamas plus governance and meeting readiness signals.
- Treasurer sees joined chamas plus finance health and reconciliation state.
- ChamaAdmin sees managed chamas plus management shortcuts.
- Auditor sees audited chamas plus review indicators.
- Admin and SuperAdmin see global chama management or platform inspection mode.
- Hidden by role: moderation fields hidden from chama roles; internal finance risk hidden from members.
- Read-only by role: Auditor read-only; Member no management actions.
- Quick actions: switch chama, open workspace, create chama if permitted, review flagged chama in platform mode.
- Data scope: Member only memberships; Treasurer and Secretary only assigned or active chamas; platform roles can query across many chamas.

### Chama Details

- Base layout: header summary, KPI cards, role-aware tabs, detail panels.
- Common sections: Overview, Members, Contributions, Finance, Loans, Meetings, Governance, Documents, Settings.
- Member sees Overview, Announcements, Meetings, limited Members, own obligations.
- Secretary sees Meetings, Attendance, Minutes, Governance, Documents, Announcements.
- Treasurer sees Contributions, Finance, Loans, cashflow summaries, loan risk.
- ChamaAdmin sees all operational tabs, approvals, policies, settings, documents.
- Auditor sees broad read-only oversight tabs and audit trail views.
- Admin and SuperAdmin see platform inspection or support tabs when investigating.
- Hidden by role: settings, sensitive finance, moderation, and member lifecycle actions are role-restricted.
- Read-only by role: Auditor fully read-only, Admin/SuperAdmin mostly inspect-only here.
- Quick actions: invite member, open finance queue, schedule meeting, publish announcement, export audit snapshot.
- Data scope: chama-scoped for operational roles, personal subset for members, platform investigation subset for platform roles.

### Members

- Base layout: member table, filters, detail drawer, profile side panel.
- Common sections: directory, member detail, role badge, status, activity.
- Member sees a limited directory and public-safe profile fields.
- Secretary sees participation, meeting attendance, reminder history.
- Treasurer sees dues status, savings, loan balance, fine balance, finance notes.
- ChamaAdmin sees role assignment, suspend or remove, approvals, lifecycle actions.
- Auditor sees read-only compliance, membership history, role changes, financial review history.
- Hidden by role: private fields, finance columns, lifecycle tools, compliance details vary by role.
- Read-only by role: Auditor read-only, Member cannot edit others.
- Quick actions: invite, assign role, suspend, follow up, export attendance, open finance profile.
- Data scope: Member sees limited chama member directory, ops roles see active chama members, Admin/SuperAdmin see moderated or platform user slices.

### Contributions

- Base layout: summary cards, due or overdue or paid tabs, filters, details panel.
- Member sees own contribution timeline, due items, overdue items, and pay CTA.
- Secretary sees reminder-support view, due and overdue filters, communication cues.
- Treasurer sees all contributions, verification states, compliance analysis, exception queues.
- ChamaAdmin sees group compliance and performance trends, plus intervention shortcuts if policy allows.
- Auditor sees read-only contribution history, verifier metadata, compliance trends.
- Hidden by role: all-member ledgers hidden from members; adjustments hidden from non-finance roles.
- Read-only by role: Auditor read-only; Secretary limited.
- Quick actions: pay now, send reminder, verify payment, review compliance, export statement.
- Data scope: Member own rows only, chama roles active chama scope, platform roles support or investigation scope.

### Payments

- Base layout: transaction table, status chips, method filters, receipt area, detail drawer.
- Member sees own payments, receipts, payment retry, payment failure guidance.
- Treasurer sees all chama payments, verification queue, proof review, manual entries, reconciliation shortcuts.
- ChamaAdmin sees payment exceptions, approval edge cases, health summaries.
- Auditor sees read-only payment review with timestamps, verifier, reconciliation state.
- Admin and SuperAdmin use separate platform tools for provider and platform payment issues, not this chama screen for mutations.
- Hidden by role: provider metadata and reconciliation tools hidden from members and Secretary.
- Read-only by role: Auditor read-only; ChamaAdmin limited based on policy.
- Quick actions: retry payment, verify payment, reconcile batch, review exception, export ledger.
- Data scope: own payments, active chama payments, support payment disputes, or platform provider investigations.

### Loans

- Base layout: loan summary cards, loans table, detail panel, schedule and repayment surfaces.
- Member sees eligibility, request loan flow, own active loans, schedule, repayment history.
- Treasurer sees applications, active loans, overdue or defaulted, disbursement readiness, guarantor context, risk indicators.
- ChamaAdmin sees approvals, restructure, recovery and policy-driven loan actions.
- Auditor sees read-only loan review, approvals trail, recovery status, exceptions.
- Hidden by role: group portfolio hidden from members; recovery tools hidden from non-admin finance roles.
- Read-only by role: Auditor read-only.
- Quick actions: request loan, review application, disburse, mark repayment, open recovery case.
- Data scope: Member own loans, chama portfolio for operations, investigation scope for platform roles.

### Meetings

- Base layout: list or calendar switch, meeting detail, agenda, attendance, minutes, resolutions tabs.
- Member sees upcoming and past meetings, published records, RSVP or attendance status.
- Secretary sees full create/edit flow, agenda management, attendance capture, minutes, reminders.
- ChamaAdmin sees governance oversight and create/edit if permitted.
- Treasurer sees contextual read-only meeting data as needed.
- Auditor sees read-only published and archived records with change history.
- Hidden by role: draft agenda, unpublished minutes, reminder tools hidden from basic members.
- Read-only by role: Auditor read-only, Treasurer mostly read-only.
- Quick actions: create meeting, record attendance, finalize minutes, open next meeting.
- Data scope: active chama meetings, own attendance context, or inspection history.

### Motions / Governance

- Base layout: motion list, detail state, voting area, results, archive.
- Member sees active motions, voting deadlines, own vote state, results when published.
- Secretary sees record-keeping helpers, motion documentation, governance reminders.
- ChamaAdmin sees create, edit, open, close, finalize, archive.
- Auditor sees read-only archive, governance outcomes, role-change trails.
- Hidden by role: draft governance settings and finalization tools hidden from members.
- Read-only by role: Auditor read-only; Secretary may be limited to record support.
- Quick actions: create motion, cast vote, finalize result, open archive.
- Data scope: active chama governance records, own voting visibility for members, broader history for auditors.

### Announcements

- Base layout: feed, filters, detail panel, compose panel where permitted.
- Member sees published announcements only.
- Secretary sees draft and scheduled announcement workflows if permission allows.
- ChamaAdmin sees create, edit, publish, pin, archive, audience targeting.
- Treasurer and Auditor mostly see read-only feed and detail.
- Admin and SuperAdmin use a separate platform communication workspace for global messaging.
- Hidden by role: draft tools and publish controls hidden from readers.
- Read-only by role: Member, Auditor, most Treasurer states.
- Quick actions: compose announcement, pin, send reminder, open detail.
- Data scope: chama feed for chama roles, personal notification-linked subset for members.

### Notifications

- Base layout: notifications list, read or unread states, filters, detail state, settings entry.
- All roles access a personal inbox.
- Operational roles get category-specific alerts such as approvals, reconciliations, meeting reminders, moderation cases.
- Hidden by role: platform operational categories hidden from chama-only roles.
- Read-only by role: the inbox itself is read-only data but preferences remain editable.
- Quick actions: mark all read, open target, mute category, open notification settings.
- Data scope: always personal delivery scope, never broad inbox access.

### Reports

- Base layout: reports hub, category cards, filters, exports, saved presets.
- Member sees personal statements only.
- Secretary sees attendance, meeting, minutes, governance reports.
- Treasurer sees finance, payments, contributions, loans, fines, reconciliations.
- ChamaAdmin sees broad operational reports across governance, members, finance, and health.
- Auditor sees audit, compliance, finance review, governance history.
- Admin and SuperAdmin see platform-wide reports in platform mode.
- Hidden by role: platform analytics hidden from chama roles; other-member statements hidden from members.
- Read-only by role: most reporting is read-only, exports depend on permission.
- Quick actions: run report, export CSV/PDF, save filter preset, open anomaly view.
- Data scope: personal, active chama, moderated platform subset, or full platform.

### Profile

- Base layout: profile summary, edit mode, memberships, role summary, KYC state, security shortcuts.
- Access: all roles.
- All roles see own profile only.
- Role summary changes by role, showing operational responsibilities where relevant.
- Hidden by role: admin-only metadata hidden from non-platform roles.
- Read-only by role: platform-assigned immutable identity fields may be read-only.
- Quick actions: edit profile, upload KYC, change password, manage sessions.
- Data scope: own identity and own memberships only.

### Settings

- Base layout: appearance, notifications, privacy, security, sessions, app preferences.
- Access: all roles.
- All roles get core settings.
- Treasurer, Secretary, and ChamaAdmin get operational alert preference sections.
- Admin and SuperAdmin keep platform settings in a separate privileged area.
- Hidden by role: privileged admin settings outside this page.
- Read-only by role: some compliance and audit toggles may be fixed by policy.
- Quick actions: sign out other sessions, enable biometric login, adjust alert channels.
- Data scope: own settings only.

### Support / Disputes

- Base layout: case list, detail thread, create case flow, status filters.
- Member sees own tickets and disputes only.
- Treasurer sees finance-related disputes if assigned.
- Secretary sees communication or meeting-related disputes if assigned.
- ChamaAdmin sees chama-level support issues and escalations.
- Admin sees platform support and moderation queues.
- Auditor sees read-only case review where policy requires it.
- Hidden by role: platform moderation tools hidden from chama roles; other users' cases hidden from members.
- Read-only by role: Auditor read-only.
- Quick actions: create ticket, assign owner, escalate case, resolve dispute.
- Data scope: own cases, assigned operational cases, chama queue, support queue, or escalation queue.

### AI Assistant

- Base layout: chat interface, quick prompts, insights panel, suggested actions.
- Member gets prompts around own payments, contributions, loans, meetings, and profile help.
- Secretary gets prompts around meetings, attendance, communication, agenda and minutes.
- Treasurer gets prompts around compliance, liquidity, collections, defaults, and reconciliation.
- ChamaAdmin gets operations, policies, governance, member health, and leadership insights.
- Auditor gets compliance, anomalies, audit questions, governance review support.
- Admin and SuperAdmin get platform support, moderation, analytics, and provider operations prompts.
- Hidden by role: prompts and suggested actions outside permission scope.
- Read-only by role: response text is informational; any follow-up mutations are still guarded separately.
- Quick actions: ask AI, summarize queue, explain anomaly, draft communication, draft report.
- Data scope: retrieval and answer scope must match the caller's screen and object permissions.

## 5. Widget Visibility Matrix by Role

| Widget family | SA | A | CA | T | S | Au | M |
|---|---|---|---|---|---|---|---|
| Platform health | yes | partial | no | no | no | no | no |
| Provider health | yes | partial | no | no | no | no | no |
| Failed jobs | yes | partial | no | no | no | no | no |
| Fraud or risk flags | yes | yes | summary | summary | no | yes | no |
| Support queue | yes | yes | summary | no | no | read_only | no |
| Moderation queue | yes | yes | no | no | no | no | no |
| Join requests | no | no | yes | optional | optional | read_only | no |
| Chama health | no | partial | yes | summary | summary | read_only | no |
| Payment verification | no | partial | optional | yes | no | read_only | no |
| Liquidity summary | no | partial | summary | yes | no | read_only | no |
| Reconciliation status | yes | partial | optional | yes | no | read_only | no |
| Meeting workload | no | no | yes | no | yes | read_only | next meeting only |
| Attendance trends | no | no | summary | no | yes | read_only | no |
| Governance alerts | no | partial | yes | summary | yes | read_only | no |
| Personal obligations | no | no | no | optional | optional | no | yes |
| Recent transactions | no | no | no | no | no | no | yes |
| Unread notifications | yes | yes | yes | yes | yes | yes | yes |

## 6. Quick Action Matrix by Role

| Quick action | SA | A | CA | T | S | Au | M |
|---|---|---|---|---|---|---|---|
| Create chama | yes | yes | policy | no | no | no | optional |
| Join with code | no | no | no | no | no | no | yes |
| Invite members | yes | yes | yes | no | no | no | no |
| Approve request | yes | yes | yes | policy | no | no | no |
| Assign role | yes | yes | yes | no | no | no | no |
| Pay contribution | no | no | no | no | no | no | yes |
| Retry failed payment | no | no | no | no | no | no | yes |
| Verify payment | no | partial | optional | yes | no | no | no |
| Reconcile batch | yes | partial | optional | yes | no | no | no |
| Request loan | no | no | no | no | no | no | yes |
| Approve loan | yes | yes | yes | yes | no | no | no |
| Disburse loan | yes | yes | policy | yes | no | no | no |
| Create meeting | yes | limited | yes | no | yes | no | no |
| Record attendance | no | no | policy | limited | yes | no | no |
| Record minutes | no | no | policy | no | yes | no | no |
| Publish announcement | platform mode | platform mode | yes | no | yes | no | no |
| Export report | yes | yes | yes | yes | yes | yes | own only |
| Open support case | yes | yes | yes | yes | yes | yes | yes |
| Review anomaly | yes | yes | summary | yes | no | yes | no |

## 7. Tab / Section Visibility Matrix by Role

### Chama Details

| Role | Visible tabs |
|---|---|
| SuperAdmin | Overview, Moderation, System Metadata |
| Admin | Overview, Support, Moderation |
| ChamaAdmin | Overview, Members, Contributions, Finance, Loans, Meetings, Governance, Documents, Settings |
| Treasurer | Overview, Contributions, Finance, Loans |
| Secretary | Overview, Meetings, Attendance, Records, Announcements |
| Auditor | Overview, Finance, Governance, History |
| Member | Overview, Rules, Announcements, Meetings |

### Members

| Role | Visible tabs or sections |
|---|---|
| ChamaAdmin | Directory, Profile, Lifecycle, Role History |
| Treasurer | Directory, Financial Profile, Arrears, Loans |
| Secretary | Directory, Participation, Attendance, Communication |
| Auditor | Directory, Compliance, Role History, Membership History |
| Member | Directory, Public Profile |

### Contributions

| Role | Visible tabs |
|---|---|
| ChamaAdmin | All, Due, Overdue, Paid, Compliance |
| Treasurer | All, Due, Overdue, Paid, Compliance, Exceptions |
| Secretary | Due, Overdue, Paid |
| Auditor | All, Overdue, Paid, Compliance |
| Member | All, Due, Overdue, Paid |

### Payments

| Role | Visible tabs |
|---|---|
| ChamaAdmin | Overview, History, Exceptions |
| Treasurer | Overview, History, Verification, Reconciliation, Failures |
| Secretary | History, Purpose-linked records |
| Auditor | History, Receipts, Review |
| Member | History, Details, Receipts |

### Loans

| Role | Visible tabs |
|---|---|
| ChamaAdmin | Portfolio, Applications, Active, Overdue, Recovery, Policy |
| Treasurer | Applications, Active, Repayments, Overdue, Risk, Disbursement |
| Auditor | Portfolio, Review, Exceptions, Recovery History |
| Member | Eligibility, Request, Active, Schedule, History |

### Meetings

| Role | Visible tabs |
|---|---|
| ChamaAdmin | List, Calendar, Details, Records |
| Secretary | List, Calendar, Agenda, Attendance, Minutes, Resolutions, Reports |
| Treasurer | List, Calendar, Details |
| Auditor | List, Details, Published Records, Audit Trail |
| Member | Upcoming, Past, Details |

### Reports

| Role | Visible report categories |
|---|---|
| SuperAdmin | Platform, Providers, Risk, Support, Global Analytics |
| Admin | Support, Moderation, Operations, Communications |
| ChamaAdmin | Contributions, Finance, Loans, Attendance, Governance, Members |
| Treasurer | Finance, Payments, Contributions, Expenses, Loans, Fines, Reconciliation |
| Secretary | Attendance, Meetings, Governance, Announcements |
| Auditor | Audit, Compliance, Finance, Governance, Recovery |
| Member | Contributions, Payments, Loans, Fines |

## 8. Table Column Visibility Matrix by Role

Runtime column rules are implemented in `TABLE_COLUMN_MATRIX` inside `src/rbac/pageHelpers.ts`.

### Members table

| Role | Columns |
|---|---|
| ChamaAdmin | Name, Role, Status, Join date, Approvals, Last active, Actions |
| Treasurer | Name, Role, Dues status, Savings, Loan balance, Fine balance |
| Secretary | Name, Role, Attendance, Last meeting, Communication |
| Auditor | Name, Role, Status, Compliance, History |
| Member | Name, Role, Join date |

### Contributions table

| Role | Columns |
|---|---|
| ChamaAdmin | Member, Contribution type, Amount, Status, Due date |
| Treasurer | Member, Contribution type, Amount, Status, Method, Verifier |
| Secretary | Member, Contribution type, Status, Due date |
| Auditor | Member, Amount, Status, Verifier, Updated |
| Member | Contribution type, Amount, Status, Due date |

### Payments table

| Role | Columns |
|---|---|
| ChamaAdmin | Member, Reference, Amount, Status, Exception |
| Treasurer | Member, Channel, Reference, Amount, Status, Verification, Reconciliation |
| Secretary | Member, Reference, Amount, Status, Purpose |
| Auditor | Member, Channel, Reference, Amount, Status, Verified by |
| Member | Reference, Purpose, Amount, Status, Receipt |

### Loans table

| Role | Columns |
|---|---|
| ChamaAdmin | Borrower, Principal, Status, Approvals, Recovery |
| Treasurer | Borrower, Principal, Status, Next repayment, Risk, Guarantors |
| Secretary | Borrower, Status, Next repayment |
| Auditor | Borrower, Principal, Status, Recovery, Exceptions |
| Member | Principal, Status, Next repayment, Balance |

## 9. Backend Data Scope Matrix by Role

| Role | Default scope | Allowed query footprint | Mutation boundary |
|---|---|---|---|
| SuperAdmin | `platform_all` | all users, all chamas, provider and job telemetry, fraud and risk entities | any platform-approved mutation |
| Admin | `platform_support` or `platform_moderation` | moderated chamas, support queues, disputes, flagged users, communication failures | support, moderation, communications, platform-ops mutations only |
| ChamaAdmin | `scoped_chama` | active or managed chama, all members in that chama, full governance and operational records | chama leadership, member lifecycle, governance, policy, approved finance actions |
| Treasurer | `scoped_chama` | active chama finance domain, contributions, payments, expenses, withdrawals, loans, fines | finance mutations only |
| Secretary | `scoped_chama` | active chama meeting, attendance, agenda, minutes, announcements, reminder-related member slices | meeting, records, announcement, reminder mutations only |
| Auditor | `scoped_chama` read-only | active chama audit, compliance, finance review, role changes, governance archive | no write access |
| Member | `own_records` plus limited directory | own contributions, own payments, own loans, own fines, own notifications, own meetings context, limited chama membership views | self-service only |

## 10. Modern Design Guidance for Shared Role-Aware Screens

- Use one consistent design system and let role changes feel like capability mode changes.
- Prefer dense but readable information architecture: hero, summary cards, tabs, filters, detail panel.
- Use role badges and scope badges near the page title.
- Keep operational actions in a dedicated quick action rail.
- Use permission-aware empty states:
  - no data yet
  - data exists but hidden by scope
  - action unavailable because permission is missing
- Use read-only banners for Auditor and inspect-only states.
- Use bottom sheets on mobile and split-pane detail drawers on web or tablet.
- Use charts only where they change decisions for that role.
- Hide unused complexity instead of showing disabled clutter everywhere.
- Use visual hierarchy:
  - hero summary
  - action rail
  - KPIs
  - operational content
  - secondary detail

## 11. Recommended Reusable Components

1. `RequireRouteAccess`
2. `RequireScreenAccess`
3. `SectionGuard`
4. `ActionGuard`
5. `FieldGuard`
6. `useScreenRBAC`
7. `RoleAwarePageShell`
8. `ScopeBadge`
9. `AccessBadge`
10. `QuickActionBar`
11. `RoleAwareTabBar`
12. `SmartTable`
13. `DetailDrawer`
14. `ReadOnlyBanner`
15. `PermissionEmptyState`
16. `WidgetRegistry`
17. `ChamaContextSwitcher`
18. `PromptPackSelector` for AI

## 12. Final Route Structure

```text
/auth
  /login
  /register
  /otp
  /forgot-password
  /reset-password

/join
  /invite-preview
  /join-with-code
  /join-success

/app
  /dashboard
  /chamas
  /chamas/:chamaId
  /members
  /members/:memberId
  /contributions
  /payments
  /payments/:paymentId
  /payments/checkout
  /loans
  /loans/:loanId
  /meetings
  /meetings/:meetingId
  /governance
  /announcements
  /notifications
  /reports
  /profile
  /settings
  /support
  /ai

/special
  /kyc-submission
  /reconciliation/:caseId
  /communication-center
  /access-denied
  /session-expired
  /maintenance
  /not-found

/platform
  /console
  /health
  /providers
  /risk
  /global-reports
  /jobs
  /escalations
```

## 13. Frontend Enforcement Contract

- Route guards use permission-driven screen access, not raw role checks.
- Widgets, tabs, filters, and columns are resolved from screen metadata and role scope.
- Actions are hidden when unauthorized and validated again before mutation.
- Form fields that are visible but not editable must be rendered read-only, not merely disabled visually.
- API consumers must expect partial payloads based on role and never assume hidden fields are present.
- AI prompts, context retrieval, and suggested actions must use the same scope and permission checks as the screen that launches them.

## 14. Django Backend Alignment

The frontend shared-screen model depends on these backend guarantees:

1. every list endpoint is scope-filtered before serialization
2. every detail endpoint performs object-level permission checks
3. every mutation validates permissions server-side
4. serializers exclude unauthorized fields
5. audit trails record privileged actions
6. AI retrieval is filtered to the caller's allowed records

Implementation detail lives in:

- `../Mychama-backend/docs/SHARED_SCREEN_RBAC_CONTRACT.md`
- `../Mychama-backend/apps/chama/permissions.py`

This keeps the app maintainable: one screen system, many role experiences, no duplicated dashboard families.
