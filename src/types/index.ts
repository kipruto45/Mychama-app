// Authentication Types
export interface User {
  id: string;
  phone: string;
  email: string;
  full_name: string;
  avatar: string | null;
  phone_verified: boolean;
  phone_verified_at?: string | null;
  email_verified?: boolean;
  email_verified_at?: string | null;
  profile_completed?: boolean;
  active_chama_id?: string | null;
  is_active: boolean;
  two_factor_enabled: boolean;
  two_factor_method: string | null;
  date_joined: string;
  last_login_at: string | null;
  role: string | null;
  referral_code: string;
  referral_count: number;
  otp_verified?: boolean;
  tier_access?: 'unverified' | 'tier_0_view_only' | 'tier_2_full' | 'restricted' | string;
  kyc_status?:
    | 'not_started'
    | 'pending'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'rekyc_required'
    | 'frozen'
    | string;
  kyc_verified_at?: string | null;
  financial_access_enabled?: boolean;
  account_frozen?: boolean;
  account_locked_until?: string | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface OTPRequest {
  identifier: string;
  delivery_method: 'sms' | 'email';
  purpose?: 'verify_phone' | 'verify_email' | 'login_2fa' | 'password_reset' | 'register' | 'withdrawal_confirm';
  phone?: string;
  email?: string;
}

export interface OTPVerification {
  identifier: string;
  code: string;
  purpose?: 'verify_phone' | 'verify_email' | 'login_2fa' | 'password_reset' | 'register' | 'withdrawal_confirm';
  phone?: string;
  email?: string;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterData {
  phone: string;
  full_name: string;
  email?: string;
  password: string;
  password_confirm: string;
  otp_delivery_method: 'sms' | 'email';
}

// Chama Types
export interface Chama {
  id: string;
  name: string;
  description: string;
  privacy?: 'private' | 'invite_only' | 'open';
  chama_type?: 'savings' | 'investment' | 'welfare' | 'mixed';
  county: string;
  subcounty: string;
  currency: string;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  updated_at: string;
  member_count?: number;
  total_savings?: string;
  contribution_setup?: ChamaContributionSetup;
  finance_settings?: ChamaFinanceSettings;
  meeting_settings?: ChamaMeetingSettings;
  membership_rules?: ChamaMembershipRules;
  notification_defaults?: ChamaNotificationDefaults;
}

export interface ChamaContributionSetup {
  amount: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  due_day: number;
  grace_period_days: number;
  late_fine_amount: string;
}

export interface ChamaFinanceSettings {
  currency: string;
  payment_methods: Array<'mpesa' | 'cash'>;
  loans_enabled: boolean;
  fines_enabled: boolean;
  approval_rule: string;
}

export interface ChamaMeetingSettings {
  meeting_frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  quorum_percentage: number;
  voting_enabled: boolean;
}

export interface ChamaMembershipRules {
  invite_only: boolean;
  approval_required: boolean;
  max_members: number;
}

export interface ChamaNotificationDefaults {
  member_join_alerts: boolean;
  payment_received_alerts: boolean;
  meeting_reminders: boolean;
  loan_updates: boolean;
}

export interface ChamaPayoutRules {
  rotation_order: 'member_join_order' | 'manual_sequence' | 'randomized';
  trigger_mode: 'manual' | 'auto';
  payout_method: 'mpesa' | 'bank_transfer' | 'wallet';
}

export interface ChamaLoanRules {
  loans_enabled: boolean;
  max_loan_amount: string;
  interest_rate: string;
  repayment_period_months: number;
  approval_layers: number;
}

export interface ChamaGovernanceRules {
  minimum_members_to_start: number;
  quorum_percentage: number;
  missed_payment_penalty_amount: string;
  constitution_summary?: string;
}

export interface CreateChamaPayload {
  name: string;
  description: string;
  category: 'savings' | 'investment' | 'welfare' | 'mixed';
  location: {
    county: string;
    subcounty: string;
  };
  privacy: 'private' | 'invite_only' | 'open';
  contribution_setup: ChamaContributionSetup;
  finance_settings: ChamaFinanceSettings;
  meeting_settings: ChamaMeetingSettings;
  membership_rules: ChamaMembershipRules;
  notification_defaults?: ChamaNotificationDefaults;
  payout_rules?: ChamaPayoutRules;
  loan_rules?: ChamaLoanRules;
  governance_rules?: ChamaGovernanceRules;
}

export type CreateChamaContributionType =
  | 'monthly'
  | 'welfare'
  | 'development'
  | 'special';

export type CreateChamaAttendanceExpectation =
  | 'required'
  | 'recommended'
  | 'flexible';

export type CreateChamaMeetingDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface CreateChamaWorkflowDraft extends CreateChamaPayload {
  logo_uri?: string | null;
  contribution_type: CreateChamaContributionType;
  partial_payments_allowed: boolean;
  attendance_expectation: CreateChamaAttendanceExpectation;
  rules_summary: string;
  preferred_meeting_day: CreateChamaMeetingDay;
  preferred_meeting_time: string;
  meeting_reminders_enabled: boolean;
  attendance_tracking_enabled: boolean;
}

export interface CreateChamaInviteDraft {
  id: string;
  phone: string;
  email: string;
  role_to_assign: 'MEMBER' | 'TREASURER' | 'SECRETARY' | 'AUDITOR';
}

export interface Membership {
  id: string;
  user: User;
  chama: string;
  role:
    | 'member'
    | 'treasurer'
    | 'secretary'
    | 'auditor'
    | 'admin'
    | 'MEMBER'
    | 'TREASURER'
    | 'SECRETARY'
    | 'AUDITOR'
    | 'ADMIN'
    | 'CHAMA_ADMIN';
  status: 'active' | 'suspended' | 'exited';
  is_active: boolean;
  is_approved: boolean;
  joined_at: string;
  approved_at: string | null;
  approved_by: User | null;
  exited_at: string | null;
  suspension_reason: string | null;
  exit_reason: string | null;
}

export interface InviteLink {
  id: string;
  chama: string;
  chama_id: string;
  chama_name: string;
  token: string;
  code: string;
  created_by: User;
  role: string;
  role_display: string;
  approval_required: boolean;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  invite_url: string;
}

export interface Invite {
  id: string;
  chama: string;
  chama_id?: string;
  chama_name?: string;
  invited_by: User;
  invitee_phone?: string;
  invitee_email?: string;
  invitee_user?: User | null;
  role_to_assign: string;
  role_display?: string;
  token: string;
  code: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';
  expires_at: string;
  accepted_at?: string | null;
  declined_at?: string | null;
  revoked_at?: string | null;
  revoke_reason?: string;
  created_at: string;
}

export interface InvitePreview {
  id: string;
  chama: string;
  chama_id?: string;
  chama_name?: string;
  chama_description?: string;
  invited_by?: User;
  invited_by_name?: string;
  role?: string;
  role_display?: string;
  assigned_role?: string;
  assigned_role_display?: string;
  token?: string;
  code?: string;
  recipient_hint?: string;
  is_targeted?: boolean;
  status: string;
  expires_at: string;
  accepted_at?: string | null;
  is_valid?: boolean;
  message?: string;
}

export interface MembershipRequest {
  id: string;
  user: User;
  chama: string;
  chama_id: string;
  chama_name: string;
  status: 'pending' | 'approved' | 'rejected';
  status_display: string;
  requested_via: string;
  request_note: string | null;
  created_at: string;
  updated_at?: string;
  reviewed_by: User | null;
  reviewed_at: string | null;
  review_note: string | null;
  expires_at: string | null;
}

export interface RoleDelegation {
  id: string;
  chama: string;
  delegate: User | null;
  delegate_id?: string;
  role: string;
  status: 'active' | 'revoked' | 'expired' | 'pending' | string;
  notes?: string | null;
  created_at: string;
  starts_at?: string | null;
  expires_at: string | null;
  revoked_at?: string | null;
  created_by?: User | null;
  revoked_by?: User | null;
  is_active?: boolean;
}

export interface KYCRecord {
  id?: string;
  status?: 'draft' | 'queued' | 'processing' | 'pending' | 'under_review' | 'resubmit_required' | 'approved' | 'rejected' | 'frozen' | string;
  document_type?: 'national_id' | 'passport' | 'alien_id' | 'military_id' | string;
  kyc_tier?: 'tier_0' | 'tier_1' | 'tier_2' | 'tier_3' | string;
  verification_score?: number;
  confidence_score?: number;
  id_number?: string;
  legal_name?: string;
  date_of_birth?: string | null;
  gender?: string;
  nationality?: string;
  phone_number?: string;
  onboarding_path?: 'create_chama' | 'join_chama' | 'request_to_join' | 'existing_member_update' | string;
  retry_allowed?: boolean;
  review_reason?: string | null;
  provider?: string;
  location_label?: string | null;
  quality_front_passed?: boolean;
  quality_back_passed?: boolean;
  liveness_passed?: boolean;
  face_match_score?: number;
  iprs_match_status?: string | null;
  submitted_at?: string | null;
  processed_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  expires_at?: string | null;
  last_rekyc_at?: string | null;
  created_at?: string;
  updated_at?: string;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  chama_id?: string;
  chama_name?: string;
  duplicate_id_detected?: boolean;
  pep_match?: boolean;
  sanctions_match?: boolean;
  blacklist_match?: boolean;
  verification_result?: {
    success?: boolean;
    status?: string;
    eligible_for_loans?: boolean;
    id_verified?: boolean;
    face_matched?: boolean;
    liveness_passed?: boolean;
    government_verified?: boolean;
    mpesa_name_matched?: boolean;
    warnings?: string[];
    errors?: string[];
    next_steps?: string[];
    score?: number;
    manual_review_required?: boolean;
    quality_checks?: Record<string, unknown>;
  };
  documents?: Array<{
    id?: string;
    name?: string;
    type?: string;
    url?: string | null;
    created_at?: string;
  }>;
}

// Finance Types
export interface Contribution {
  id: string;
  chama: string;
  member: User;
  contribution_type: string;
  contribution_type_name: string;
  amount: string;
  date_paid: string;
  method: 'mpesa' | 'cash';
  receipt_code: string;
  recorded_by: User;
  created_at: string;
}

export interface ContributionType {
  id: string;
  chama: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
  default_amount: string;
  is_active: boolean;
}

export interface Loan {
  id: string;
  chama: string;
  member: User;
  loan_product: LoanProduct;
  purpose?: string;
  principal: string;
  outstanding_principal?: string;
  outstanding_interest?: string;
  outstanding_penalty?: string;
  total_due?: string;
  interest_type: 'flat' | 'reducing';
  interest_rate: string;
  duration_months: number;
  grace_period_days: number;
  late_penalty_type: 'fixed' | 'percentage';
  late_penalty_value: string;
  eligibility_status: 'eligible' | 'ineligible' | 'pending';
  eligibility_reason: string;
  recommended_max_amount: string;
  status:
    | 'requested'
    | 'review'
    | 'approved'
    | 'disbursing'
    | 'disbursed'
    | 'active'
    | 'due_soon'
    | 'overdue'
    | 'restructured'
    | 'paid'
    | 'closed'
    | 'cleared'
    | 'defaulted'
    | 'defaulted_recovering'
    | 'written_off'
    | 'recovered_from_offset'
    | 'recovered_from_guarantor'
    | 'rejected';
  escalation_level?: string;
  escalation_started_at?: string | null;
  last_reminder_sent_at?: string | null;
  last_escalation_sent_at?: string | null;
  recovery_meeting_scheduled?: boolean;
  recovery_meeting_date?: string | null;
  recovery_notes?: string;
  recovery_officer?: string | null;
  final_status?: string | null;
  final_status_date?: string | null;
  final_status_by?: string | null;
  write_off_amount?: string;
  write_off_reason?: string | null;
  due_date?: string | null;
  defaulted_at?: string | null;
  repaid_at?: string | null;
  rejection_reason?: string | null;
  disbursement_reference?: string | null;
  requested_at: string;
  approved_by: User | null;
  approved_at: string | null;
  disbursed_by: User | null;
  disbursed_at: string | null;
  approval_logs: LoanApprovalLog[];
  guarantors: LoanGuarantor[];
}

export interface LoanProduct {
  id: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  max_loan_amount: string;
  contribution_multiple: string;
  interest_type: string;
  interest_rate: string;
  min_duration_months: number;
  max_duration_months: number;
  grace_period_days: number;
  late_penalty_type: string;
  late_penalty_value: string;
  early_repayment_discount_percent: string;
  minimum_membership_months: number;
  minimum_contribution_months: number;
  block_if_unpaid_penalties: boolean;
  block_if_overdue_loans: boolean;
  require_treasurer_review: boolean;
  require_separate_disburser: boolean;
}

export interface LoanApprovalLog {
  id: string;
  loan: string;
  stage: string;
  decision: string;
  actor: User;
  note: string;
  acted_at: string;
}

export interface LoanGuarantor {
  id: string;
  loan: string;
  guarantor: User;
  guaranteed_amount: string;
  status: 'proposed' | 'accepted' | 'rejected' | 'released';
  review_note?: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  notified_at?: string | null;
  exposure_amount?: string;
  recovery_triggered?: boolean;
  recovery_triggered_at?: string | null;
  recovery_amount?: string;
}

export interface LoanApplicationApproval {
  id: string;
  loan_application: string;
  stage: 'treasurer_review' | 'committee_approval' | 'admin_approval' | 'disbursement' | string;
  decision: 'pending' | 'approved' | 'rejected' | string;
  actor: User;
  note: string;
  acted_at: string;
  created_at: string;
  updated_at: string;
}

export interface LoanApplicationGuarantor {
  id: string;
  loan_application: string;
  guarantor: User;
  guaranteed_amount: string;
  status: 'proposed' | 'accepted' | 'rejected' | 'released';
  review_note?: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoanApplication {
  id: string;
  chama: string;
  member: User;
  loan_product: LoanProduct;
  requested_amount: string;
  requested_term_months: number;
  purpose: string;
  status:
    | 'submitted'
    | 'in_review'
    | 'treasurer_approved'
    | 'committee_approved'
    | 'approved'
    | 'rejected'
    | 'disbursed'
    | 'cancelled';
  eligibility_status: 'eligible' | 'ineligible' | 'pending' | string;
  recommended_max_amount: string;
  eligible_amount_at_application?: string;
  savings_balance_at_application?: string;
  contribution_count_at_application?: number;
  repayment_history_score?: string;
  contribution_consistency_score?: string;
  installment_estimate?: string;
  total_repayment_estimate?: string;
  loan_multiplier_at_application?: string;
  risk_notes?: string[];
  next_steps?: string[];
  approval_requirements?: Record<string, unknown>;
  eligibility_snapshot?: Record<string, unknown>;
  rejection_reason?: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: User | null;
  approved_at: string | null;
  approved_by: User | null;
  disbursed_at: string | null;
  created_loan?: string | null;
  approval_logs: LoanApplicationApproval[];
  guarantors: LoanApplicationGuarantor[];
  created_at: string;
  updated_at: string;
}

export interface LoanPolicyCheck {
  key: string;
  label: string;
  passed: boolean;
  severity: 'blocking' | 'supporting' | string;
  actual: string | number | boolean | null;
  required: string | number | boolean | null;
  message: string;
}

export interface LoanEligibilityPreview {
  chama_id?: string;
  member_id?: string;
  loan_product_id?: string;
  currency?: string;
  eligible: boolean;
  status?: 'eligible' | 'ineligible' | string;
  requested_amount_valid?: boolean;
  requested_amount_validation?: {
    requested_amount: string;
    minimum_amount: string;
    maximum_amount: string;
    within_limit: boolean;
  };
  minimum_loan_amount?: string;
  reasons: string[];
  next_steps?: string[];
  risk_notes?: string[];
  recommended_max_amount: string;
  policy_summary?: {
    min_membership_months?: number;
    min_membership_days?: number;
    minimum_contributions?: number;
    minimum_savings_threshold?: string;
    minimum_loan_amount?: string;
    loan_cap_multiplier?: string;
    maximum_member_loan_amount?: string;
    max_active_loans?: number;
    block_unpaid_penalties?: boolean;
    block_pending_loan_applications?: boolean;
    repayment_capacity_ratio_limit?: string;
    require_phone_verification?: boolean;
    require_kyc?: boolean;
  };
  policy_checks?: LoanPolicyCheck[];
  calculated_metrics?: {
    membership_days?: number;
    membership_months?: number;
    successful_contributions?: number;
    contribution_compliance_percent?: string;
    contribution_consistency_score?: string;
    repayment_history_score?: string;
    active_loans_count?: number;
    pending_loan_applications_count?: number;
    available_liquidity?: string;
    effective_lendable_liquidity?: string;
    installment_estimate?: string;
    total_repayment_estimate?: string;
    average_monthly_savings?: string;
    repayment_capacity_ratio?: string;
  };
  repayment_history_score?: string;
  contribution_consistency_score?: string;
  savings_summary?: {
    eligible_personal_savings?: string;
    minimum_required_savings?: string;
    savings_shortfall?: string;
    loan_multiplier?: string;
    product_contribution_multiple?: string;
    max_based_on_savings?: string;
  };
  approval_requirements?: {
    requires_guarantors?: boolean;
    required_guarantors?: number;
    guarantor_threshold_amount?: string;
    requires_treasurer_approval?: boolean;
    requires_admin_approval?: boolean;
    requires_committee_approval?: boolean;
    approval_path?: string[];
  };
  metrics?: Record<string, unknown>;
}

export interface LoanInstallment {
  id: string;
  loan: string;
  due_date: string;
  expected_amount: string;
  expected_principal: string;
  expected_interest: string;
  expected_penalty: string;
  paid_amount?: string;
  paid_principal?: string;
  paid_interest?: string;
  paid_penalty?: string;
  paid_at?: string | null;
  status: 'due' | 'partial' | 'paid' | 'overdue' | string;
  created_at: string;
  updated_at: string;
}

export interface LoanQueueSummary {
  total: number;
  submitted: number;
  in_review: number;
  approved: number;
  rejected: number;
  disbursed: number;
}

export interface LoanPortfolioSummary {
  total_loans: number;
  active_loans: number;
  overdue_loans: number;
  defaulted_loans: number;
  total_outstanding: string;
  total_penalties: string;
}

export interface LoanReports {
  applications: Record<string, unknown>;
  portfolio: Record<string, unknown>;
}

export interface ContributionGoal {
  id: string;
  chama: string;
  member: string;
  title: string;
  target_amount: string;
  current_amount: string;
  due_date: string | null;
  status: 'active' | 'completed' | 'cancelled' | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoanRestructureRequest {
  id: string;
  loan: string;
  requested_duration_months: number;
  requested_interest_rate?: string | null;
  reason?: string | null;
  status: 'requested' | 'approved' | 'rejected' | 'applied' | string;
  reviewed_by?: User | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoanRecoveryAction {
  id: string;
  loan: string;
  action_type: string;
  amount: string;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  performed_by?: string | null;
  guarantor?: string | null;
  offset_from_savings?: boolean;
  offset_from_contributions?: boolean;
  created_by?: User | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  owner_type: 'user' | 'chama';
  owner_id: string;
  available_balance: string;
  locked_balance: string;
  total_balance: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  wallet?: string;
  wallet_id?: string;
  chama: string;
  journal_entry?: string;
  account?: string;
  entry_type: 'contribution' | 'loan' | 'repayment' | 'penalty' | 'adjustment' | 'expense';
  direction?: 'credit' | 'debit';
  amount: string;
  debit?: string;
  credit?: string;
  currency: string;
  status: 'pending' | 'completed' | 'reversed';
  provider?: string;
  provider_reference?: string;
  narration: string;
  created_at: string;
}

export interface Penalty {
  id: string;
  chama: string;
  member?: User | null;
  member_id?: string;
  member_name?: string;
  category?: string;
  category_display?: string;
  amount: string;
  reason: string;
  issued_reason?: string;
  due_date: string;
  status: string;
  status_display?: string;
  issued_by?: User | null;
  issued_by_name?: string | null;
  resolved_by?: User | null;
  resolved_at?: string | null;
  paid_at?: string | null;
  waived_at?: string | null;
  outstanding_amount?: string;
  dispute_reason?: string | null;
  dispute_resolution?: string | null;
  payments?: Array<{
    id: string;
    amount: string;
    method: string;
    transaction_reference?: string;
    created_at: string;
  }>;
}

export interface FinancialSummary {
  total_contributions: string;
  total_loans: string;
  total_penalties?: string;
  total_balance?: string;
  total_expenses?: string;
  wallet_balance: string;
  member_count: number;
  active_loans: number;
  currency: string;
}

export interface ExpenseAuditEntry {
  id: string;
  action: string;
  actor_name?: string | null;
  actor?: User | null;
  note?: string | null;
  created_at: string;
}

export interface ExpenseRecord {
  id: string;
  chama: string;
  category: string;
  amount: string;
  currency?: string;
  expense_date: string;
  description: string;
  vendor_name?: string | null;
  status:
    | 'draft'
    | 'pending'
    | 'pending_approval'
    | 'approved'
    | 'paid'
    | 'rejected'
    | 'cancelled'
    | string;
  requested_by?: User | null;
  approved_by?: User | null;
  paid_by?: User | null;
  payment_reference?: string | null;
  receipt_reference?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  audit_trail?: ExpenseAuditEntry[];
}

export interface WithdrawalActivity {
  id: string;
  action: string;
  actor_name?: string | null;
  note?: string | null;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  chama: string;
  amount: string;
  currency: string;
  status: 'pending' | 'approved' | 'sent' | 'completed' | 'failed' | 'cancelled' | string;
  reason?: string | null;
  phone?: string | null;
  beneficiary_name?: string | null;
  beneficiary_phone?: string | null;
  beneficiary_details?: string | null;
  payout_status?: string | null;
  payout_proof?: string | null;
  payout_reference?: string | null;
  failure_reason?: string | null;
  mpesa_receipt_number?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  activity?: WithdrawalActivity[];
}

export interface LoanDisbursementQueueItem {
  id: string;
  chama?: string;
  loan_id?: string | null;
  member_name?: string | null;
  amount: string;
  currency: string;
  status: string;
  phone?: string | null;
  reference?: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface MemberComplianceSummary {
  member_id: string;
  member_name: string;
  chama_id: string;
  expected_amount: string;
  paid_amount: string;
  pending_penalties: number;
  pending_penalty_amount: string;
  missed_cycles: number;
  contribution_streak: number;
  compliance_score: number;
  risk_score: number;
  current_status: 'paid' | 'in_grace' | 'missed';
  suggested_fine_amount: string;
  grace_deadline?: string | null;
  last_paid_at?: string | null;
}

export interface ChamaRule {
  id: string;
  chama: string;
  category: string;
  category_display?: string;
  title: string;
  description?: string;
  content: string;
  version: number;
  status: string;
  status_display?: string;
  effective_date?: string | null;
  expiry_date?: string | null;
  requires_acknowledgment: boolean;
  acknowledgment_deadline_days?: number | null;
  acknowledgment_rate?: number;
  approved_by?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RuleAcknowledgment {
  id: string;
  rule: string;
  rule_title?: string;
  member?: string;
  member_name?: string;
  status: string;
  status_display?: string;
  acknowledged_at?: string | null;
  created_at: string;
}

export interface GovernanceApprovalStep {
  id: string;
  approval_request: string;
  level: string;
  level_display?: string;
  approver_role: string;
  status: string;
  status_display?: string;
  decision_at?: string | null;
  decided_by?: string | null;
  decided_by_name?: string | null;
  comment?: string | null;
  conditions?: Record<string, unknown>;
  created_at: string;
}

export interface GovernanceApprovalRequest {
  id: string;
  chama: string;
  approval_type: string;
  approval_type_display?: string;
  reference_type?: string | null;
  reference_id?: string | null;
  reference_display?: string | null;
  title: string;
  description?: string | null;
  amount?: string | null;
  currency?: string | null;
  requested_by?: string | null;
  requested_by_name?: string | null;
  status: string;
  status_display?: string;
  required_level?: string;
  current_level?: string;
  current_level_display?: string;
  first_level_approver_role?: string | null;
  second_level_approver_role?: string | null;
  first_level_threshold?: string | null;
  due_date?: string | null;
  resolved_at?: string | null;
  steps: GovernanceApprovalStep[];
  approvers_needed?: string[];
  created_at: string;
  updated_at: string;
}

export interface GovernanceOverview {
  total_rules: number;
  active_rules: number;
  pending_acknowledgments: number;
  pending_approvals: number;
  pending_role_changes: number;
  expiring_acting_roles: number;
}

export interface GovernanceMotionVote {
  id: string;
  motion: string;
  user?: User | null;
  vote: 'yes' | 'no' | 'abstain' | string;
  created_at: string;
  updated_at: string;
}

export interface GovernanceMotionResult {
  id: string;
  motion: string;
  total_votes: number;
  yes_votes: number;
  no_votes: number;
  abstain_votes: number;
  eligible_voters: number;
  quorum_met: boolean;
  passed: boolean;
  calculated_at: string;
}

export interface GovernanceMotion {
  id: string;
  chama: string;
  title: string;
  description?: string;
  created_by?: User | null;
  status: 'open' | 'closed' | 'cancelled' | string;
  start_time: string;
  end_time: string;
  quorum_percent: number;
  closed_at?: string | null;
  closed_by?: User | null;
  eligible_roles?: string[];
  result?: GovernanceMotionResult | null;
  my_vote?: GovernanceMotionVote | null;
  vote_summary?: {
    total_votes: number;
    yes_votes: number;
    no_votes: number;
    abstain_votes: number;
  };
  created_at: string;
  updated_at: string;
}

export interface InvestmentOverview {
  total_invested: string;
  current_valuation: string;
  total_returns: string;
  total_profit_loss: string;
  average_roi: string;
  active_investments_count: number;
  matured_investments_count: number;
  pending_approvals_count: number;
  by_type: Record<string, number>;
  performance_history: Array<Record<string, unknown>>;
}

export interface InvestmentDistributionDetail {
  id: string;
  distribution: string;
  member: string;
  member_name: string;
  amount: string;
  share_percentage: string;
  paid: boolean;
  paid_at?: string | null;
}

export interface InvestmentDistribution {
  id: string;
  investment: string;
  total_amount: string;
  distribution_date: string;
  method: string;
  status: string;
  notes?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  details: InvestmentDistributionDetail[];
  created_at: string;
}

export interface InvestmentRecord {
  id: string;
  name: string;
  investment_type: string;
  investment_type_display?: string;
  institution?: string | null;
  principal_amount: string;
  current_value: string;
  currency?: string;
  start_date: string;
  maturity_date?: string | null;
  status: string;
  status_display?: string;
  roi?: string | number;
  total_returns?: string | number;
  created_at: string;
}

export type InvestmentFundingSource = 'wallet' | 'mpesa' | 'hybrid';
export type InvestmentPayoutDestination = 'wallet' | 'mpesa' | 'reinvest';
export type InvestmentPositionStatus =
  | 'pending_funding'
  | 'active'
  | 'matured'
  | 'partially_redeemed'
  | 'redeemed'
  | 'cancelled'
  | 'failed';

export interface InvestmentProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  short_description?: string;
  long_description?: string;  // Alias for description
  category: string;
  category_display?: string;
  status: string;
  status_display?: string;
  risk_level: 'low' | 'moderate' | 'high' | string;
  risk_level_display?: string;
  currency: string;
  minimum_amount: string;
  minimum_investment?: string;  // Alias for minimum_amount
  maximum_amount?: string | null;
  expected_return_rate: string;
  expected_return_percentage?: string;  // Alias for expected_return_rate
  expected_return_percent?: string;  // Another variation
  projected_return_min_rate: string;
  projected_return_max_rate: string;
  term_days: number;
  lock_in_days: number;
  lock_period_days?: number;  // Alias for lock_in_days
  liquidity_summary?: string;
  partial_redemption_allowed: boolean;
  returns_utilization_allowed: boolean;
  wallet_funding_enabled: boolean;
  mpesa_funding_enabled: boolean;
  hybrid_funding_enabled: boolean;
  wallet_payout_enabled: boolean;
  mpesa_payout_enabled: boolean;
  comparison_highlights?: string[];
  suitability_notes?: string[];
  payout_frequency?: string;
  disclosure_title?: string;
  disclosure_body?: string;
  terms_summary?: string[];
  faq_items?: Array<{ question?: string; answer?: string } | string>;
  trust_markers?: string[];
  partial_redemption_min_amount?: string;
  reinvestment_enabled?: boolean;
  auto_reinvest_available?: boolean;
  early_redemption_penalty_rate?: string;
  early_redemption_penalty_percentage?: string;  // Alias for rate
  management_fee_rate?: string;
  fees_percentage?: string;  // Alias or separate fee property
  withholding_tax_rate?: string;
  utilization_options?: Array<{ name: string; description?: string }>;  // Options for utilizing returns
}

export interface InvestmentProjection {
  gross_returns: string;
  management_fee: string;
  withholding_tax: string;
  net_returns: string;
  expected_value: string;
}

export interface InvestmentPayoutRecord {
  id: string;
  reference: string;
  kind: string;
  kind_display?: string;
  destination: InvestmentPayoutDestination | string;
  destination_display?: string;
  status: string;
  status_display?: string;
  gross_amount: string;
  fee_amount: string;
  tax_amount: string;
  penalty_amount: string;
  net_amount: string;
  currency: string;
  destination_phone?: string;
  failure_reason?: string;
  processed_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface InvestmentTransactionRecordV2 {
  id: string;
  reference: string;
  transaction_type: string;
  transaction_type_display?: string;
  status: string;
  status_display?: string;
  amount: string;
  fee_amount: string;
  tax_amount: string;
  penalty_amount: string;
  net_amount: string;
  currency: string;
  destination?: string;
  notes?: string;
  external_reference?: string;
  processed_at?: string | null;
  created_at: string;
}

export interface InvestmentReturnLedgerEntry {
  id: string;
  period_start: string;
  period_end: string;
  status: string;
  status_display?: string;
  gross_returns: string;
  management_fee: string;
  withholding_tax: string;
  net_returns: string;
  available_amount: string;
  utilized_amount: string;
  accrued_at: string;
  available_at?: string | null;
}

export interface InvestmentUtilizationActionRecord {
  id: string;
  reference: string;
  action_type: InvestmentPayoutDestination | string;
  action_type_display?: string;
  status: string;
  status_display?: string;
  amount: string;
  fee_amount: string;
  tax_amount: string;
  net_amount: string;
  beneficiary_phone?: string;
  failure_reason?: string;
  payout?: InvestmentPayoutRecord | null;
  processed_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface InvestmentRedemptionRecord {
  id: string;
  reference: string;
  redemption_type: string;
  redemption_type_display?: string;
  destination: InvestmentPayoutDestination | string;
  destination_display?: string;
  status: string;
  status_display?: string;
  requested_amount: string;
  principal_amount: string;
  profit_amount: string;
  fee_amount: string;
  tax_amount: string;
  penalty_amount: string;
  net_amount: string;
  beneficiary_phone?: string;
  reason?: string;
  failure_reason?: string;
  payout?: InvestmentPayoutRecord | null;
  processed_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface MemberInvestmentPosition {
  id: string;
  reference: string;
  product: string | InvestmentProduct;
  product_name: string;
  product_code?: string;
  status: InvestmentPositionStatus | string;
  status_display?: string;
  funding_source: InvestmentFundingSource | string;
  funding_source_display?: string;
  principal_amount: string;
  current_value: string;
  accrued_returns: string;
  unrealized_gains?: string;  // Alias for accrued_returns
  unrealized_returns?: string;  // Alias for accrued_returns
  available_returns: string;
  expected_value_at_maturity: string;
  maturity_date?: string | null;
  lock_until_date?: string | null;  // Date investment is locked until
  next_payout_date?: string | null;
  risk_level?: string;
  risk_level_display?: string;
  beneficiary_phone?: string;
  latest_status_note?: string;
  redemption_eligible: boolean;
  currency?: string;
  wallet_funded_amount?: string;
  mpesa_funded_amount?: string;
  realized_returns?: string;
  redeemed_principal?: string;
  total_fees_charged?: string;
  total_penalties_charged?: string;
  auto_reinvest?: boolean;
  metadata?: Record<string, unknown>;
  started_at?: string;
  created_at: string;
  investment_date?: string;  // Alias for created_at or started_at
  funded_at?: string | null;
  last_accrual_at?: string | null;
  closed_at?: string | null;
  transactions?: InvestmentTransactionRecordV2[];
  returns_ledger?: InvestmentReturnLedgerEntry[];
  payouts?: InvestmentPayoutRecord[];
  redemptions?: InvestmentRedemptionRecord[];
  utilizations?: InvestmentUtilizationActionRecord[];
}

export interface InvestmentPortfolioSummary {
  currency: string;
  total_invested: string;
  current_value: string;
  total_returns: string;
  available_returns: string;
  active_count: number;
  matured_count: number;
  next_maturity?: {
    investment_id: string;
    reference: string;
    product_name: string;
    maturity_date?: string | null;
  } | null;
  best_performing_investment?: {
    investment_id: string;
    reference: string;
    product_name: string;
    returns: string;
  } | null;
  alerts: Array<{ kind: string; message: string } | null>;
}

export interface InvestmentPortfolioAnalytics {
  allocation: Array<{ label: string; value: string; count: number }>;
  growth_series: Array<{
    reference: string;
    product_name: string;
    principal: string;
    current_value: string;
    returns: string;
  }>;
  realized_returns: string;
  unrealized_returns: string;
  wallet_withdrawals: string;
  reinvestment_total: string;
}

export interface InvestmentHistoryResponse {
  transactions: InvestmentTransactionRecordV2[];
  redemptions: InvestmentRedemptionRecord[];
  payouts: InvestmentPayoutRecord[];
}

export interface IssueUserSummary {
  id: string;
  full_name: string;
  phone: string;
  email: string;
}

export interface IssueComment {
  id: string;
  issue: string;
  author_id?: string;
  author?: IssueUserSummary | null;
  message: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export interface IssueAttachment {
  id: string;
  issue: string;
  uploaded_by_id?: string;
  uploaded_by?: IssueUserSummary | null;
  file: string;
  content_type?: string | null;
  size?: number | null;
  created_at: string;
  updated_at: string;
}

export interface IssueActivityLog {
  id: string;
  issue: string;
  actor?: IssueUserSummary | null;
  action: string;
  meta?: Record<string, unknown>;
  created_at: string;
}

export interface IssueSummary {
  id: string;
  chama: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to_id?: string | null;
  assigned_to_user?: IssueUserSummary | null;
  reported_user_id?: string | null;
  reported_user_data?: IssueUserSummary | null;
  loan_id?: string | null;
  report_type?: string | null;
  is_anonymous: boolean;
  due_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  created_by_id?: string | null;
  created_by_user?: IssueUserSummary | null;
  created_at: string;
  updated_at: string;
  comment_count?: number;
  attachment_count?: number;
}

export interface IssueDetail extends IssueSummary {
  comments: IssueComment[];
  attachments: IssueAttachment[];
  activity_logs: IssueActivityLog[];
}

export interface IssueAppeal {
  id: string;
  issue: string;
  appellant?: IssueUserSummary | null;
  message: string;
  status: string;
  reviewed_by?: IssueUserSummary | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueStats {
  chama_id: string;
  total_issues: number;
  status_counts: Record<string, number>;
  category_counts: Record<string, number>;
  priority_counts: Record<string, number>;
  avg_resolution_hours: number;
  active_suspensions: Array<{
    user_id: string;
    user__full_name: string;
    user__phone: string;
    starts_at: string;
    ends_at?: string | null;
  }>;
}

export interface FinancialReport {
  summary: FinancialSummary;
  accounts: Array<{
    code: string;
    name: string;
    type: string;
  }>;
  latest_snapshot_id: string;
}

export interface FinancialSnapshot {
  id: string;
  chama: string;
  snapshot_date: string;
  total_balance: string;
  total_contributions: string;
  total_loans: string;
  total_expenses: string;
  created_at: string;
  updated_at: string;
}

// Payment Types
export interface Payment {
  id: string;
  chama: string;
  member: User;
  amount: string;
  currency: string;
  method: 'mpesa' | 'cash';
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  reference: string;
  provider_reference: string;
  narration: string;
  created_at: string;
  completed_at: string | null;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'mpesa' | 'cash';
  is_active: boolean;
  icon: string;
}

// Meeting Types
export interface Meeting {
  id: string;
  chama: string;
  title: string;
  description: string;
  location: string;
  location_type: 'physical' | 'online' | 'hybrid';
  meeting_link: string | null;
  date: string;
  agenda: MeetingAgenda[];
  attendance: MeetingAttendance[];
  minutes: MeetingMinutes | null;
  attendance_qr_token: string;
  quorum_percentage: number;
  minutes_status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  minutes_approved_by: string | null;
  minutes_approved_at: string | null;
  cancelled_at: string | null;
  cancelled_by_id: string | null;
  cancellation_reason: string;
  created_by: User;
  created_at: string;
  updated_at: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface MeetingAgenda {
  id: string;
  meeting: string;
  proposed_by: string;
  proposed_by_name: string;
  title: string;
  description: string;
  order: number;
  duration_minutes: number;
  status: 'proposed' | 'approved' | 'rejected' | 'done';
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingMinutes {
  meeting: string;
  content: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  recorded_at: string;
}

export interface MeetingResolution {
  id: string;
  meeting_id: string;
  text: string;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  due_date: string | null;
  status: 'open' | 'done';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingAttendance {
  id: string;
  meeting: string;
  member_id: string;
  member_name: string;
  member_phone: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
  created_at: string;
  updated_at: string;
}

// Notification Types
export interface Notification {
  id: string;
  user: string;
  chama_id?: string | null;
  chama_name?: string | null;
  type: string;
  category?: string | null;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  contribution_reminders_enabled?: boolean;
  meeting_reminders_enabled?: boolean;
  finance_alerts_enabled?: boolean;
  announcement_enabled?: boolean;
  contribution_reminders: boolean;
  meeting_reminders: boolean;
  announcements: boolean;
  payment_notifications: boolean;
}

export interface AutomationActionTarget {
  route?: string | null;
  label?: string | null;
  params?: Record<string, any>;
}

export interface AutomationQueueItem {
  id: string;
  key: string;
  title: string;
  description: string;
  severity: 'success' | 'info' | 'warning' | 'critical';
  badge_count?: number;
  action?: AutomationActionTarget | null;
}

export interface AutomationRecentRun {
  id: string;
  job_name: string;
  description: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | string;
  started_at: string;
  finished_at: string | null;
  error: string;
}

export interface AutomationRuleRecord {
  id: string;
  rule_type: string;
  is_enabled: boolean;
  config: Record<string, any>;
}

export interface AutomationHub {
  scope: {
    chama_id: string | null;
    chama_name: string | null;
    active_chamas: number;
    is_admin_scope: boolean;
  };
  summary: {
    my_due_contributions: number;
    my_overdue_loans: number;
    meetings_next_24h: number;
    unread_notifications: number;
    pending_membership_approvals: number;
    pending_finance_approvals: number;
    failed_deliveries: number;
    jobs_needing_attention: number;
  };
  channel_status: {
    in_app_enabled: boolean;
    email_enabled: boolean;
    sms_enabled: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
    active_devices: number;
  };
  job_health: {
    enabled_jobs: number;
    recent_failures: number;
    stale_jobs: number;
    recent_runs: AutomationRecentRun[];
  };
  queue: AutomationQueueItem[];
  recommendations: AutomationQueueItem[];
  rules: AutomationRuleRecord[];
}

export interface CommunicationEventDefinition {
  event_name: string;
  trigger_source: string;
  allowed_channels: string[];
  recipient_rules: string;
  schedule_mode: string;
  user_disableable: boolean;
  template_variables: string[];
  priority: string;
  category: string;
}

export interface CommunicationCampaign {
  id: string;
  chama: string;
  title: string;
  message: string;
  target: string;
  segment?: string;
  target_roles: string[];
  target_member_ids: string[];
  channels: string[];
  action_url?: string;
  metadata?: Record<string, any>;
  priority: string;
  scheduled_at: string | null;
  sent_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  queued_count?: number;
}

export interface CommunicationDeliveryLog {
  id: string;
  notification: string;
  notification_subject: string;
  notification_type: string;
  notification_priority: string;
  recipient_id: string;
  recipient_name: string;
  chama_id: string;
  channel: string;
  to_address: string;
  provider: string;
  status: string;
  provider_message_id: string;
  attempts: number;
  error_message: string;
  last_attempt_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunicationAnalytics {
  summary: {
    total_notifications: number;
    total_deliveries: number;
    sent_deliveries: number;
    failed_deliveries: number;
    queued_notifications: number;
    broadcasts_count: number;
    delivery_success_rate: number;
  };
  by_channel: Record<string, number>;
  by_status: Record<string, number>;
  recent_campaigns: CommunicationCampaign[];
  top_templates: Array<{
    template__id: string;
    template__name: string;
    usage_count: number;
  }>;
}

export interface DashboardOverview {
  user: {
    id: string;
    name: string;
    phone: string;
  };
  totals: {
    total_savings: string;
    chama_balance: string;
    total_loans: string;
    total_expenses: string;
    pending_contributions: number;
    unread_notifications: number;
  };
  member_overview: {
    active_chamas: number;
    pending_contributions: number;
    loan_eligibility: Record<string, any>;
  };
  chamas: Array<{
    id: string;
    name: string;
    role: string;
    effective_role: string;
    currency: string;
    member_count: number;
  }>;
  recent_transactions: Array<{
    id: string;
    kind: string;
    amount: string;
    currency: string;
    description: string;
    counterparty: string;
    chama_id: string;
    chama_name: string;
    created_at: string;
  }>;
  upcoming_meetings: Array<{
    id: string;
    title: string;
    date: string;
    location: string;
    location_type: 'physical' | 'online' | 'hybrid';
    meeting_link?: string | null;
    chama_id: string;
    chama_name: string;
    quorum_percentage: number;
    minutes_status?: string;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    message: string;
    chama_id: string;
    chama_name: string;
    created_at: string;
    sent_at: string | null;
  }>;
  activity_preview: AuditTrailEntry[];
  trends: {
    contributions: Array<{ date: string; amount: string; chama_id: string }>;
    expenses: Array<{ date: string; amount: string; chama_id: string }>;
  };
  loan_stats: {
    active_count: number;
    requested_count: number;
  };
  smart_summary: {
    headline: string;
    plain_language: string;
    period_label: string;
  };
  scores: {
    member_reliability: number;
    loan_eligibility: number;
    chama_health: number;
    liquidity_health: number;
    default_risk: number;
    attendance_score: number;
  };
  analytics: {
    monthly_contributions: string;
    monthly_expenses: string;
    pending_withdrawals_amount: string;
    pending_expenses_amount: string;
    pending_loan_requests_amount: string;
    contribution_completion_rate: number;
    attendance_recent_average: number | null;
    attendance_previous_average: number | null;
    attendance_trend_delta: number;
    failed_payouts: number;
    failed_notifications: number;
    pending_disbursements: number;
    unpaid_penalties_total: string;
    unpaid_penalties_count: number;
  };
  smart_insights: DashboardInsight[];
  next_actions: DashboardAction[];
  admin_action_center: DashboardAdminActionCenter;
  compliance: {
    member_reliability_score: number;
    pending_contributions: number;
    unpaid_penalties: number;
    overdue_loans: number;
    contribution_completion_rate: number;
  };
  role_workspaces?: RoleWorkspace[];
}

export interface DashboardActionTarget {
  label?: string | null;
  route?: string | null;
  params?: Record<string, any>;
}

export interface DashboardInsight {
  id: string;
  key: string;
  title: string;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'critical';
  metric?: string | null;
  action?: DashboardActionTarget | null;
}

export interface DashboardAction {
  id: string;
  key: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  badge_count?: number;
  action?: DashboardActionTarget | null;
}

export interface DashboardAdminActionCenter {
  is_visible: boolean;
  pending_approvals: number;
  pending_join_requests: number;
  pending_expenses: number;
  pending_withdrawals: number;
  overdue_contributions: number;
  overdue_loans: number;
  pending_minutes_approval: number;
  open_issues: number;
  failed_payouts: number;
  items: DashboardAction[];
}

export interface ApprovalCenterActionTarget {
  route?: string | null;
  label?: string | null;
  params?: Record<string, any>;
}

export interface ApprovalCenterItem {
  id: string;
  item_type: string;
  title: string;
  description: string;
  status: string;
  severity: 'low' | 'medium' | 'high' | string;
  amount?: string | null;
  currency?: string | null;
  created_at?: string | null;
  requested_by?: string | null;
  chama_id: string;
  chama_name: string;
  action?: ApprovalCenterActionTarget | null;
}

export interface ApprovalCenterSection {
  key: string;
  title: string;
  count: number;
  route?: ApprovalCenterActionTarget | null;
  items: ApprovalCenterItem[];
}

export interface ApprovalCenter {
  scope: {
    active_chamas: number;
    is_admin_scope: boolean;
    primary_chama_id: string | null;
    primary_chama_name: string | null;
  };
  summary: {
    pending_total: number;
    join_requests: number;
    invites: number;
    loan_requests: number;
    expense_requests: number;
    withdrawal_requests: number;
    approval_requests: number;
    policy_changes: number;
    role_changes: number;
    disputes: number;
    reconciliation_items: number;
  };
  sections: ApprovalCenterSection[];
  recent_items: ApprovalCenterItem[];
}

export interface RoleWorkspaceAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical' | string;
  title: string;
  message: string;
}

export interface RoleWorkspace {
  workspace_key: string;
  workspace_label: string;
  workspace_summary: string;
  role: string;
  effective_role: string;
  chama_id: string;
  chama_name: string;
  currency: string;
  metrics: {
    pending_contributions: number;
    pending_approvals: number;
    overdue_loans: number;
    open_disputes: number;
    policy_acknowledgments_due: number;
    reliability_score: number;
    reconciliation_alerts: number;
  };
  alerts: RoleWorkspaceAlert[];
  recommended_actions: DashboardAction[];
  reports: DashboardActionTarget[];
}

export interface RoleWorkspaceResponse {
  summary: {
    workspace_count: number;
    admin_workspaces: number;
    member_workspaces: number;
  };
  workspaces: RoleWorkspace[];
}

export interface MemberFinancialProfileByChama {
  chama: {
    id: string;
    name: string;
    currency: string;
  };
  role: string;
  effective_role: string;
  joined_at: string;
  contributions: {
    total: string;
    count: number;
    this_month: string;
    pending_count: number;
    missed_count: number;
    next_due_amount: string;
    next_due_date: string | null;
    compliance_rate: number;
    on_time_rate: number;
  };
  fines: {
    issued_total: string;
    unpaid_total: string;
    disputed_count: number;
  };
  loans: {
    taken_total: string;
    repaid_total: string;
    outstanding_total: string;
    active_count: number;
    completed_count: number;
    overdue_count: number;
  };
  attendance: {
    attended: number;
    total: number;
    rate: number;
  };
  voting: {
    votes_cast: number;
    total_votes: number;
    rate: number;
  };
  obligations: {
    loan_exposure: string;
    payable_fines: string;
    pending_payments: string;
    expected_next_due_amount: string;
  };
  reliability: {
    score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical' | string;
    flags: string[];
    recommendations: string[];
  };
  activity: {
    open_disputes: number;
    open_issues: number;
    pending_policy_acknowledgments: number;
  };
}

export interface MemberProfile {
  user: {
    id: string;
    name: string;
    phone: string;
    email: string;
    date_joined: string;
  };
  wallet: {
    available: string;
    locked: string;
    total: string;
    currency: string;
  };
  memberships: {
    total: number;
    active: number;
    scoped: number;
    list: Array<{
      chama: {
        id: string;
        name: string;
        currency: string;
      };
      role: string;
      effective_role: string;
      status: string;
      joined_at: string;
    }>;
  };
  portfolio: {
    total_contributions: string;
    total_fines: string;
    total_loans_taken: string;
    total_loans_repaid: string;
    active_loans?: number;
    outstanding_balances: string;
    pending_payments: string;
    payable_fines: string;
    attendance_rate: number;
    voting_participation_rate: number;
    reliability_score: number;
  };
  financial_profile: {
    by_chama: MemberFinancialProfileByChama[];
  };
  role_workspaces: RoleWorkspace[];
}

export interface AuditTrailEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, any>;
  trace_id: string;
  created_at: string;
}

// AI Types
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  chama_id?: string;
  tool_name?: string | null;
  tool_payload?: Record<string, any> | null;
}

export interface AIInsight {
  id: string;
  type: 'financial' | 'member' | 'risk' | 'suggestion';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  data: Record<string, any>;
  created_at: string;
}

export interface AIAnalysis {
  summary: string;
  recommendations: string[];
  risk_score: number;
  insights: AIInsight[];
}
