# 03. API to Screen Mapping

This mapping aligns current frontend services (`src/services`) to screen responsibilities.

## Auth Module

- Screens: `Login`, `Register`, `OTP`, `ForgotPassword`, `ResetPassword`
- Service: `authService`, `profileService`
- Endpoints:
- `POST /v1/auth/login/`
- `POST /v1/auth/register/`
- `POST /v1/auth/otp/request/`
- `POST /v1/auth/otp/verify/`
- `POST /v1/auth/logout/`
- `GET /v1/auth/profile/`
- `PATCH /v1/auth/profile/`
- `POST /v1/auth/password/reset/`
- `POST /v1/auth/password/reset/confirm/`
- `POST /v1/auth/password/change/`
- `POST /v1/auth/token/refresh/`

## Chama Module

- Screens: `ChamaList`, `CreateChama`, `ChamaDetail`, `ChamaSettings`
- Service: `chamaService`
- Endpoints:
- `GET /v1/chamas/`
- `POST /v1/chamas/`
- `GET /v1/chamas/{id}/`
- `PATCH /v1/chamas/{id}/`
- `DELETE /v1/chamas/{id}/`

## Member and Role Module

- Screens: `MemberList`, `MemberDetail`, `MembershipRequests`, `InviteMember`
- Service: `chamaService`
- Endpoints:
- `GET /v1/chamas/{chamaId}/members/`
- `GET /v1/chamas/{chamaId}/members/{memberId}/`
- `PATCH /v1/chamas/{chamaId}/members/{memberId}/role/`
- `DELETE /v1/chamas/{chamaId}/members/{memberId}/`
- `POST /v1/chamas/{chamaId}/request-join/`
- `GET /v1/chamas/{chamaId}/membership-requests/`
- `POST /v1/chamas/{chamaId}/membership-requests/{requestId}/approve/`
- `POST /v1/chamas/{chamaId}/membership-requests/{requestId}/reject/`
- `POST /v1/chamas/{chamaId}/invite-links/`
- `GET /v1/chamas/{chamaId}/invite-links/`
- `POST /v1/chamas/{chamaId}/invite-links/{linkId}/revoke/`
- `GET /v1/invites/lookup?token=...`
- `POST /v1/invites/accept/`

## Payments Module

- Screens: `PaymentsScreen`, `MakeContributionScreen`, `PaymentDetailScreen`, `Receipt`
- Service: `paymentService`
- Endpoints:
- `GET /v1/payments/?chama_id=...`
- `GET /v1/payments/{id}/`
- `POST /v1/payments/`
- `GET /v1/payments/methods/`
- `POST /v1/payments/mpesa/initiate/`
- `GET /v1/payments/mpesa/status/?checkout_request_id=...`

## Finance Module

- Screens: `FinanceScreen`, `TransactionsScreen`, `TransactionDetailScreen`, `LoanDetailScreen`, `RequestLoanScreen`
- Service: `financeService`
- Endpoints:
- `GET /v1/finance/chamas/{chamaId}/summary/`
- `GET /v1/finance/chamas/{chamaId}/wallet/`
- `GET /v1/finance/chamas/{chamaId}/ledger/`
- `GET /v1/finance/chamas/{chamaId}/contributions/`
- `POST /v1/finance/chamas/{chamaId}/contributions/`
- `GET /v1/finance/chamas/{chamaId}/contribution-types/`
- `POST /v1/finance/chamas/{chamaId}/contribution-types/`
- `GET /v1/finance/chamas/{chamaId}/loans/`
- `GET /v1/finance/chamas/{chamaId}/loans/{loanId}/`
- `POST /v1/finance/chamas/{chamaId}/loans/`
- `POST /v1/finance/chamas/{chamaId}/loans/{loanId}/approve/`
- `POST /v1/finance/chamas/{chamaId}/loans/{loanId}/reject/`
- `POST /v1/finance/chamas/{chamaId}/loans/{loanId}/disburse/`
- `GET /v1/finance/chamas/{chamaId}/penalties/`
- `POST /v1/finance/chamas/{chamaId}/penalties/`
- `POST /v1/finance/chamas/{chamaId}/penalties/{penaltyId}/resolve/`

## Meetings Module

- Screens: `MeetingsScreen`, `CreateMeetingScreen`, `MeetingDetailScreen`
- Service: `meetingService`
- Endpoints:
- `GET /v1/meetings/?chama_id=...`
- `POST /v1/meetings/`
- `GET /v1/meetings/{id}/`
- `PATCH /v1/meetings/{id}/`
- `DELETE /v1/meetings/{id}/`
- `GET /v1/meetings/{meetingId}/attendance/`
- `POST /v1/meetings/{meetingId}/attendance/`
- `GET /v1/meetings/{meetingId}/minutes/`
- `POST /v1/meetings/{meetingId}/minutes/`

## Notifications Module

- Screens: `NotificationsScreen`, settings notification preference controls
- Service: `notificationService`
- Endpoints:
- `GET /v1/notifications/`
- `PATCH /v1/notifications/{id}/`
- `POST /v1/notifications/mark-all-read/`
- `DELETE /v1/notifications/{id}/`
- `GET /v1/notifications/preferences/`
- `PATCH /v1/notifications/preferences/`
- `POST /v1/notifications/push-token/`

## AI Module

- Screen: `AIChatScreen`
- Service: `aiService`
- Endpoints:
- `POST /ai/chat/`
- `GET /ai/chat/history/?chama_id=...`
- `GET /ai/insights/?chama_id=...`
- `GET /ai/suggestions/?context=...`
- `GET /ai/analysis/financial/?chama_id=...`
- `GET /ai/analysis/member-risk/?chama_id=...&member_id=...`
- `GET /ai/fraud-detection/?chama_id=...`

## Token and API Infrastructure

- Base URL: `EXPO_PUBLIC_API_URL` fallback `https://api.my-cham-a.app/api`
- Token storage: `expo-secure-store`
- Interceptors:
- request interceptor injects `Bearer access_token`
- response interceptor handles `401` with `refresh_token`
- failed request queue retries after refresh

