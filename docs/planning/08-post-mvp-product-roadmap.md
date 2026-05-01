# 08. Post-MVP Product Roadmap

Baseline: this roadmap extends the MVP planning pack and current backend API map as of March 31, 2026.

## Goal

Turn MyChama from an MVP mobile app into a production-ready chama operating system with:
- strong financial controls
- safer lending and recovery
- formal governance workflows
- multi-chama identity and context management
- platform-level oversight, fraud controls, and resilience

## Planning Principles

- Protect money movement before adding convenience features.
- Build auditability into every approval, correction, override, and payout flow.
- Reuse backend capabilities that already exist before inventing new surface area.
- Treat offline behavior, document storage, and role delegation as platform infrastructure, not polish.
- Sequence work so scoring, fraud, and AI use trusted operational data rather than guesses.

## Delivery Model

Use the MVP backlog in `07-mvp-sprint-backlog.md` for release readiness. Then execute the following post-MVP phases.

Status legend:
- `API-partial`: backend/API support already exists and mainly needs workflow completion plus frontend coverage
- `Net-new`: requires meaningful new product, backend, and frontend work
- `Platform`: cross-cutting capability that affects multiple modules

## Phase 4: Group Operating System Foundation

Why first:
- these capabilities shape permissions, navigation, storage, and lifecycle rules for almost every later module

### 4.1 Multi-chama support for one user
- Status: `API-partial`
- Deliver:
- chama switching
- current chama context persistence
- role per chama resolution
- per-chama dashboard and report filtering
- Notes:
- backend already exposes membership and active-chama switching endpoints
- this should become a first-class app shell concern before adding more finance screens

### 4.2 Join request workflow
- Status: `API-partial`
- Deliver:
- request-to-join flow
- admin review queue
- approve/reject/needs-info states
- waiting list behavior
- public vs private discovery rules
- Notes:
- backend already exposes join requests and membership request review endpoints
- discovery rules and waiting-list UX still need explicit product treatment

### 4.3 Constitution, rules, and policy module
- Status: `Net-new`
- Deliver:
- constitution upload and storage
- policy documents for loans, fines, meetings, and voting
- version history
- member acknowledgement tracking
- policy-effective-date handling
- Notes:
- this should define downstream rule engines for loans, fines, quorum, and approvals

### 4.4 Document and file management
- Status: `API-partial`
- Deliver:
- receipt uploads
- meeting minutes attachments
- member documents
- KYC files
- reports archive
- secure file permissions by role and chama
- Notes:
- backend already has KYC, meeting minutes upload, issue attachments, and AI attachments
- the missing piece is a unified file registry and permission model across modules

### 4.5 Role delegation and succession
- Status: `API-partial`
- Deliver:
- temporary delegation
- handover workflow
- role change approvals
- transfer of treasurer powers
- audit of role transitions
- Notes:
- delegation endpoints already exist
- succession, explicit handover, and financial-power transfer rules still need domain workflows

### 4.6 Offline-aware mobile behavior
- Status: `Platform`
- Deliver:
- cached last-seen data
- retry queue for safe actions
- offline warning and degraded-mode UX
- delayed sync for non-critical actions
- Notes:
- aligns with the existing caching and sync work already planned in `MODULE_IMPLEMENTATION_PLAN.md`
- do not allow unsafe offline execution for approvals, payouts, reversals, or other irreversible finance actions

## Phase 5: Financial Controls and Treasury

Why next:
- these workflows close core finance control gaps and create the ledger quality needed for lending, analytics, and fraud detection

### 5.1 Contribution compliance engine
- Status: `API-partial`
- Deliver:
- who paid / who missed
- streak tracking
- automatic fines
- grace periods
- member compliance score
- member risk score
- Notes:
- automations and AI endpoints already hint at compliance and risk scoring
- this needs a rules engine, clear event model, and member-level explanations

### 5.2 Expense management workflow
- Status: `Net-new`
- Deliver:
- expense request
- approval workflow
- receipt upload
- expense categories
- treasurer/admin approval
- expense payment record
- expense audit trail
- Notes:
- this is a core finance module and should post cleanly into ledger, reports, and reconciliation

### 5.3 Withdrawal and disbursement workflow
- Status: `API-partial`
- Deliver:
- withdrawal request
- approval levels
- disbursement tracking
- beneficiary details
- payout status
- proof of payout
- reversal and cancellation rules
- Notes:
- backend already exposes withdrawal and loan-disbursement endpoints
- remaining work is approval policy, proof artifacts, and failure/reversal handling

### 5.4 Treasury and bank reconciliation
- Status: `API-partial`
- Deliver:
- cashbook
- bank transaction import or manual entry
- M-Pesa reconciliation
- unmatched transaction queue
- approval before posting corrections
- Notes:
- reconciliation endpoints exist, but treasury accounting UX is still missing
- corrections must be dual-controlled and fully audited

### 5.5 Penalty and fine management
- Status: `API-partial`
- Deliver:
- late contribution fines
- meeting absence fines
- misconduct and admin fines
- fine dispute workflow
- fine waiver approval
- fine aging report
- Notes:
- finance and fines modules already expose penalties, fine rules, payments, reminders, and waivers
- the product gap is a complete admin/member workflow and aging/reporting layer

## Phase 6: Credit, Collections, and Recovery

Why here:
- recovery and credit operations depend on reliable contribution, penalty, treasury, and approval controls

### 6.1 Loan guarantor and recovery system
- Status: `API-partial`
- Deliver:
- guarantor approval flow
- guarantor exposure tracking
- recovery from guarantors
- loan restructuring
- partial repayment handling
- write-off workflow with strict approval
- savings offset recovery rules
- Notes:
- guarantor, restructure, repayment, approval-log, and portfolio endpoints already exist
- major missing pieces are exposure accounting, savings-offset rules, write-off governance, and recovery sequencing

### 6.2 Recovery policy and collections controls
- Status: `Net-new`
- Deliver:
- collections stages
- overdue notice automation
- restructure eligibility rules
- write-off committee approval path
- recovery settlement records
- Notes:
- some overdue automation exists, but the business policy layer still needs explicit definition

## Phase 7: Governance, Goals, and Member Value

Why after controls:
- once money controls are stable, governance and value-distribution features become trustworthy and easier to audit

### 7.1 Savings goals and investment goals
- Status: `API-partial`
- Deliver:
- chama goal creation
- target amount
- target date
- progress tracking
- goal-specific contributions
- investment project tracking
- milestone notifications
- Notes:
- contribution goals already exist in finance APIs
- investment projects and milestone communication still need dedicated models and screens

### 7.2 Dividend and profit sharing logic
- Status: `Net-new`
- Deliver:
- profit declaration
- member share calculation
- contribution-weighted allocation
- payout schedule
- retained earnings option
- distribution history
- Notes:
- this needs formal rules on share basis, approval authority, retained earnings, rounding, and payout posting

### 7.3 Voting and decision module
- Status: `API-partial`
- Deliver:
- create motion
- voting window
- eligible voters
- quorum check
- result calculation
- passed or rejected outcome
- audit trail
- Notes:
- meeting voting endpoints already exist for agenda items
- the missing layer is a broader governance motion system tied to policy, eligibility, and archival records

## Phase 8: Support, Intelligence, and Risk Controls

Why here:
- these features become much more accurate and useful once the operational modules generate high-quality events and records

### 8.1 Support and dispute resolution
- Status: `API-partial`
- Deliver:
- support ticketing
- payment dispute logging
- loan dispute cases
- membership dispute handling
- admin response workflow
- Notes:
- payments disputes and the issues module already provide a strong starting point
- unify them into one support operations model with routing and SLAs

### 8.2 Strong analytics and health scoring
- Status: `API-partial`
- Deliver:
- chama health score
- member reliability score
- liquidity health
- default risk dashboard
- contribution completion trend
- attendance trend
- engagement score
- Notes:
- reports and AI modules already expose health, default risk, and risk-profile concepts
- the product work is metric definition, explainability, trend views, and actionability

### 8.3 Fraud and abuse detection
- Status: `API-partial`
- Deliver:
- duplicate payment detection
- suspicious repeated invites
- role abuse detection
- rapid failed payment alerts
- unusual withdrawal patterns
- admin override audit
- Notes:
- anomaly, fraud-check, fraud-flag, and audit endpoints already exist
- add rule tuning, review queues, evidence capture, and override governance

## Phase 9: Platform Operations, Billing, and Lifecycle

Why last:
- these are business-critical, but they rely on stable core workflows, reliable metrics, and mature audit coverage

### 9.1 Super admin and platform admin tools
- Status: `Net-new`
- Deliver:
- user management
- chama moderation
- suspicious activity monitoring
- fraud flags review
- platform-wide broadcast
- provider configuration
- system health dashboard
- Notes:
- some underlying endpoints exist, but there is no cohesive platform-ops console in the planning pack

### 9.2 Platform billing and monetization
- Status: `Net-new`
- Deliver:
- subscription plans
- per-chama pricing
- transaction fees
- premium reports
- premium AI tools
- invoicing for platform fees
- Notes:
- this needs tenancy-aware billing, entitlements, invoicing, payment collection, and plan enforcement

### 9.3 Chama closure and archive workflow
- Status: `Net-new`
- Deliver:
- archive chama
- freeze new activity
- final reconciliation
- final report
- member notification
- payout closure workflow
- Notes:
- closure depends on finance reconciliation, open-issue resolution, and final member approvals

### 9.4 Backup, restore, and business continuity
- Status: `Platform`
- Deliver:
- data backup strategy
- restore procedures
- export of critical records
- disaster recovery plan
- Notes:
- backend scripts already suggest backup operations
- the missing part is productized restore testing, RPO/RTO targets, and operational runbooks

## Cross-Phase Architecture Additions

These should be designed once and reused across phases:

- Unified approval engine:
- multi-step approvals, quorum-style approvals, delegated approvals, escalations, and approval SLAs
- Unified audit model:
- actor, role, delegated-role context, before/after state, chama, artifact links, and override reason
- Unified file registry:
- file owner, module type, sensitivity, retention policy, and signed-access rules
- Unified rule engine:
- contribution rules, fine rules, loan policy, withdrawal policy, quorum policy, and billing entitlements
- Unified scoring framework:
- compliance score, reliability score, chama health, liquidity health, default risk, fraud risk

## Existing Backend Anchors To Reuse

These areas already have meaningful backend/API coverage and should be surfaced before adding new endpoints:

- multi-chama membership and active chama switching
- join requests and membership approval flows
- role delegations
- contribution goals
- loan guarantors, restructures, repayments, schedules, and approval logs
- penalties and fines
- withdrawals, loan disbursements, refunds, disputes, and reconciliation runs
- meeting votes and minutes uploads
- KYC and attachment-style uploads
- compliance, overdue-loan automation, anomaly checks, fraud flags, and audit exports
- chama health, collection forecast, default risk, and AI risk scoring

## Recommended Execution Order

1. Finish MVP release readiness from `07-mvp-sprint-backlog.md`.
2. Ship Phase 4 platform foundations, especially multi-chama context, documents, delegation, and offline-safe sync.
3. Ship Phase 5 finance controls so the ledger becomes trustworthy.
4. Ship Phase 6 credit and recovery after compliance, fines, and treasury controls are stable.
5. Ship Phase 7 governance and member-value features on top of the policy and approval foundation.
6. Ship Phase 8 support, analytics, and fraud controls once high-quality data is flowing.
7. Ship Phase 9 platform operations, billing, closure, and continuity for business maturity.

## Definition of Done for "Real Product" Status

MyChama should only be treated as a fully operational product when:

- every money-out flow has approvals, tracking, reversal rules, and audit history
- loans support guarantors, restructures, partial repayment, recovery, and write-off governance
- contributions, fines, and compliance feed reliable member scoring
- governance rules, motions, votes, and constitutions are versioned and acknowledged
- users can safely operate across multiple chamas with correct role resolution
- documents, receipts, KYC files, and reports have secure storage and permissions
- fraud review, support handling, reconciliation, backup, and restore are operationalized
- platform admins can monitor health, abuse, billing, and tenant lifecycle
