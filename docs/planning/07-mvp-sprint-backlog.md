# 07. MVP Sprint Backlog

Baseline: this backlog is derived from the planning pack and current React Native codebase as of March 30, 2026.

## Prioritization Model

- `P0`: blocks app usability or core release
- `P1`: high-value MVP completeness
- `P2`: polish and optimization

Story point guide:
- `1-2`: small
- `3-5`: medium
- `8`: large

## Sprint 0 (Foundation)

### MVP-001 API Environment Hardening
- Priority: `P0`
- Points: `3`
- Scope:
- ensure `EXPO_PUBLIC_API_URL` setup and env fallback documentation
- add clear dev/prod URL guidance in project docs
- Acceptance criteria:
- app builds with env-driven API URL in local and production configs
- no hardcoded local-only URL paths in screens/services

### MVP-002 Auth Session Reliability
- Priority: `P0`
- Points: `5`
- Scope:
- validate secure token persistence lifecycle
- handle refresh-token failure by safe logout + redirect
- add centralized auth-expired UX message
- Acceptance criteria:
- expired access token auto-refreshes
- invalid refresh token routes user to login without crash

### MVP-003 Navigation Guard and Route Audit
- Priority: `P0`
- Points: `3`
- Scope:
- audit `AppNavigator` for protected/unprotected routes
- ensure all auth-only screens are inaccessible when logged out
- Acceptance criteria:
- guests cannot open authenticated stack screens
- signed-in users cannot accidentally land in auth stack

### MVP-004 Global App States Standardization
- Priority: `P0`
- Points: `5`
- Scope:
- standard loading/empty/error/success components for list/detail screens
- use consistent retry patterns
- Acceptance criteria:
- each core MVP screen has explicit loading/empty/error handling
- retry action present where API calls can fail

## Sprint 1 (Core User Flows)

### MVP-005 Register -> OTP -> Login End-to-End
- Priority: `P0`
- Points: `8`
- Scope:
- complete and verify registration, OTP request/verify, and login sequence
- handle OTP resend and expiry feedback
- Acceptance criteria:
- new user can register, verify OTP, and enter app
- invalid OTP and expired OTP states are user-friendly

### MVP-006 Chama List and Detail Stability
- Priority: `P0`
- Points: `5`
- Scope:
- ensure chama list fetch, detail fetch, and refresh behavior are stable
- improve empty state CTA to `Create Chama`
- Acceptance criteria:
- user can open chama list and detail without runtime errors
- pull-to-refresh updates chama data

### MVP-007 Create Chama UX + Validation
- Priority: `P0`
- Points: `5`
- Scope:
- validate required fields in `CreateChamaScreen`
- improve success flow to route directly into created chama detail
- Acceptance criteria:
- incomplete form cannot submit
- successful creation shows success feedback and lands on detail

### MVP-008 Meetings List and Detail Completion
- Priority: `P1`
- Points: `5`
- Scope:
- ensure meetings list loads by active chama
- validate meeting detail rendering and fallback states
- Acceptance criteria:
- meetings are visible for selected chama
- empty upcoming meetings state includes `Schedule meeting` action

## Sprint 2 (Money and Notifications)

### MVP-009 Contributions and Payments Flow
- Priority: `P0`
- Points: `8`
- Scope:
- complete `MakeContributionScreen` submission and confirmation path
- ensure pending/success/failed payment statuses are reflected in UI
- Acceptance criteria:
- user can initiate contribution and see transaction state updates
- payment list reflects latest transaction state

### MVP-010 Payment Detail and Receipt Readiness
- Priority: `P1`
- Points: `5`
- Scope:
- finalize payment detail display with reference fields
- generate receipt-ready presentation structure
- Acceptance criteria:
- payment detail shows amount, method, reference, status, date
- success payments have a receipt-style summary view

### MVP-011 Notifications Center Functionality
- Priority: `P1`
- Points: `5`
- Scope:
- complete read/unread state flow
- implement mark-all-as-read UX and optimistic updates
- Acceptance criteria:
- notification opens related context screen
- mark-all updates list state immediately and syncs with backend

### MVP-012 Profile Core Editing Flow
- Priority: `P1`
- Points: `5`
- Scope:
- ensure profile fetch/edit/update works with clear feedback
- validate change password flow
- Acceptance criteria:
- user can edit profile and persist updates
- password change success/failure is clearly communicated

## Sprint 3 (Finance + AI + Release Readiness)

### MVP-013 Finance Summary and Transactions Polish
- Priority: `P1`
- Points: `8`
- Scope:
- finalize finance summary cards and transactions list reliability
- ensure filters/date grouping are stable
- Acceptance criteria:
- finance screen shows summary metrics and transaction drill-down
- transaction detail opens from finance lists

### MVP-014 AI Assistant MVP Completeness
- Priority: `P1`
- Points: `5`
- Scope:
- stabilize chat send/receive flow
- add quick prompt actions and empty/loading/error states
- Acceptance criteria:
- user can ask chama questions and receive responses
- failed AI requests show retry action without losing draft input

### MVP-015 Role-Based UI Visibility
- Priority: `P1`
- Points: `5`
- Scope:
- hide privileged actions for non-admin roles
- guard role-specific buttons in chama/member/meeting/payment areas
- Acceptance criteria:
- non-privileged users do not see admin-only actions
- privileged roles retain full access to governance actions

### MVP-016 MVP QA Regression and Release Checklist
- Priority: `P0`
- Points: `5`
- Scope:
- regression pass across auth, chamas, payments, meetings, notifications, profile, AI
- release readiness checklist and known-issues log
- Acceptance criteria:
- no blocker bugs in P0 flows
- release checklist signed with open-risk notes documented

## Dependency Map

- `MVP-001` -> `MVP-002`, `MVP-005`, `MVP-009`
- `MVP-002` -> all authenticated flows
- `MVP-006` -> `MVP-007`, `MVP-008`, `MVP-009`, `MVP-013`, `MVP-014`
- `MVP-009` -> `MVP-010`
- `MVP-004` runs in parallel and is required before `MVP-016`

## Definition of Done (MVP)

- Authentication and session management are stable
- Users can create and manage chamas
- Users can contribute and track payments
- Users can view meetings and notifications
- Users can manage profile settings
- Users can access AI assistant basics
- Critical screens support loading/empty/error/success states
- No unresolved `P0` issues

## Recommended Delivery Sequence

1. Sprint 0 foundation tasks
2. Sprint 1 core account and chama flows
3. Sprint 2 money and notification flows
4. Sprint 3 finance, AI, and release hardening

