# 01. App Sitemap

## Goal

Build a modern mobile chama platform that combines:
- fintech workflows
- community governance workflows
- clear reporting and operational visibility

## Navigation Blueprint

### Root
- `AuthStack` (when signed out)
- `MainAppStack` (when signed in)

### AuthStack
- `Splash`
- `Onboarding`
- `Welcome`
- `Login`
- `Register`
- `OTPVerification`
- `ForgotPassword`
- `ResetPassword`

### MainAppStack

Bottom tabs:
- `Home`
- `Chamas`
- `Payments`
- `Meetings`
- `Profile`

Global stack screens:
- `Notifications`
- `Finance`
- `AIChat`
- `Settings`
- `Search`

## Tab-Level Sitemap

### Home Tab
- `HomeDashboard`
- `FinanceSummaryCard`
- `UpcomingMeetingsCard`
- `PendingContributionsCard`
- `QuickActionsSheet`

### Chamas Tab
- `ChamaList`
- `CreateChama`
- `ChamaDetail`
- `ChamaSettings`
- `MemberList`
- `MemberDetail`
- `InviteMember`
- `MembershipRequests`
- `ContributionRules`

### Payments Tab
- `PaymentsList`
- `MakeContribution`
- `PaymentDetail`
- `Receipt`
- `PaymentMethods`

### Meetings Tab
- `MeetingsList`
- `CreateMeeting`
- `MeetingDetail`
- `MeetingMinutes`
- `Attendance`

### Profile Tab
- `ProfileOverview`
- `EditProfile`
- `KYCScreen`
- `ChangePassword`
- `NotificationPreferences`
- `Security`
- `Referrals`
- `HelpSupport`

## Cross-Cutting Screens

- `NotificationsCenter`
- `FinanceReports`
- `Transactions`
- `TransactionDetail`
- `LoanRequest`
- `LoanDetail`
- `AIChatAssistant`
- `Settings`

## Quick Actions (FAB / Sheet)

- Contribute
- Create chama
- Invite member
- Schedule meeting

## Access Control Layers

- Guest: auth screens only
- Member: view and transact in joined chamas
- Treasurer: finance and payment actions
- Secretary: meetings and minutes actions
- Chairperson/Admin: governance, membership approvals, role assignment

## Current Implementation Alignment

Already available in the app codebase:
- Auth screens (`login/register/otp/forgot/reset`)
- Main tabs (`dashboard/chamas/payments/meetings/profile`)
- Core secondary screens (`chama detail/notifications/settings/finance/ai`)
- Detail flows (`payment detail`, `meeting detail`, `loan detail`, `transaction detail`, `create chama`, `create meeting`, `invite member`)

