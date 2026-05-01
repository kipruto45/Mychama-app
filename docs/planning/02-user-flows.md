# 02. User Flows

## 1. First-Time User Onboarding

1. Open app -> `Splash`
2. View `Onboarding`
3. Choose `Create Account`
4. Fill registration form
5. Submit -> OTP sent
6. Enter OTP on `OTPVerification`
7. Success -> `HomeDashboard`

Error branches:
- OTP expired -> `Resend OTP`
- Weak password -> inline validation
- Duplicate phone/email -> account recovery prompt

## 2. Returning User Login

1. Open app
2. `Login`
3. Enter email/phone + password
4. Auth success -> refresh tokens saved
5. Land on `HomeDashboard`

Error branches:
- Invalid credentials -> inline error + retry
- Token refresh failure -> force re-auth
- Network down -> retry with offline messaging

## 3. Create Chama Flow

1. From `Chamas` or quick action -> `CreateChama`
2. Enter chama details and contribution setup
3. Submit chama
4. Backend creates chama + default roles
5. Navigate to `ChamaDetail`
6. Prompt to `InviteMember`

Error branches:
- Missing required fields -> form errors
- Duplicate chama name (if enforced) -> conflict handling

## 4. Join Chama Flow (Invite-Based)

1. User opens invite link/token
2. App resolves invite metadata
3. User confirms join request
4. Request submitted or auto-joined (depending on policy)
5. If approval required -> `Pending approval` state
6. On approval -> chama appears in `ChamaList`

## 5. Contribution Payment Flow

1. User opens `MakeContribution`
2. Select chama + amount + method
3. For M-Pesa:
4. Trigger STK push
5. Poll payment status
6. Success -> create contribution record
7. Show `Receipt`
8. Update dashboard balances

Error branches:
- Duplicate submission -> idempotency protection
- Timeout/pending -> pending status UI + manual refresh
- Failed transaction -> actionable retry

## 6. Meeting Management Flow

1. Admin/secretary opens `CreateMeeting`
2. Add title, schedule, location, agenda
3. Save -> notify members
4. Members see meeting in `MeetingsList`
5. During/after meeting -> attendance + minutes + resolutions
6. Meeting moves to `Past meetings` with records

## 7. Notifications Flow

1. Trigger event (due contribution, meeting, approval, payment)
2. Notification stored server-side
3. User opens `NotificationsCenter`
4. Select notification -> deep link to related screen
5. Mark read or mark all read

## 8. AI Assistant Flow

1. Open `AIChatAssistant`
2. Pick quick prompt or type custom question
3. Send with active chama context
4. Receive response and suggestions
5. Follow-up questions continue thread

Safety branch:
- If no chama selected -> ask user to pick chama context

## 9. Profile and Security Flow

1. Open `ProfileOverview`
2. Edit details or upload avatar
3. Manage password and security options
4. Manage notification preferences
5. Save and reflect immediately in app state

## 10. Admin Governance Flow

1. Admin opens `ChamaDetail` -> `MemberList`/`MembershipRequests`
2. Approve/reject requests
3. Assign roles
4. Update chama settings and contribution rules
5. Review finance summary and compliance state

