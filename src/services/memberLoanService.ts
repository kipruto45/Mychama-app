import { apiClient } from './api';
import { financeService } from './financeService';
import type {
  Loan,
  LoanApplication,
  LoanEligibilityPreview,
  LoanInstallment,
  LoanPolicyCheck,
  LoanProduct,
} from '@/types';

export type MemberLoanEligibilityState =
  | 'eligible'
  | 'partially_eligible'
  | 'not_eligible'
  | 'unknown_loading';

export type MemberLoanApplicationState =
  | 'not_started'
  | 'draft'
  | 'validating'
  | 'submitting'
  | 'submitted_pending_review'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type MemberLoanState =
  | 'no_active_loan'
  | 'pending_application'
  | 'active'
  | 'overdue'
  | 'completed';

export interface MemberLoanWorkspace {
  summary: {
    currency: string;
    eligibility_status: MemberLoanEligibilityState;
    max_eligible_amount: string;
    active_loan_balance: string;
    next_repayment_due: string | null;
    next_repayment_amount: string;
    loan_state: MemberLoanState;
    has_pending_application: boolean;
  };
  eligibility: {
    state: MemberLoanEligibilityState;
    max_eligible_amount: string;
    reasons: string[];
    next_steps?: string[];
    risk_notes?: string[];
    contribution_based_limit: string;
    current_financial_standing: {
      savings_position: string;
      successful_contributions: number;
      contribution_compliance_percent: string;
      active_loans_count: number;
      available_liquidity: string;
      effective_lendable_liquidity: string;
    };
    conditions: Array<{
      key: string;
      label: string;
        value: string | number;
      }>;
    policy_checks?: LoanPolicyCheck[];
    policy_summary?: {
      minimum_membership_days?: number;
      minimum_contributions?: number;
      minimum_savings_threshold?: string;
      minimum_loan_amount?: string;
      loan_cap_multiplier?: string;
      max_active_loans?: number;
      repayment_capacity_ratio_limit?: string;
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
    savings_summary?: {
      eligible_personal_savings?: string;
      minimum_required_savings?: string;
      savings_shortfall?: string;
      loan_multiplier?: string;
      product_contribution_multiple?: string;
      max_based_on_savings?: string;
    };
    repayment_history_score?: string;
    contribution_consistency_score?: string;
    installment_estimate?: string;
    total_repayment_estimate?: string;
    metrics: Record<string, unknown>;
    guidance: string[];
    selected_product: LoanProduct | null;
  };
  active_application: {
    id: string;
    status: string;
    state: MemberLoanApplicationState;
    amount: string;
    duration_months: number;
    purpose: string;
    reference: string;
    submitted_at: string | null;
    approved_at: string | null;
    rejection_reason: string;
    recommended_max_amount: string;
    created_loan_id: string | null;
  } | null;
  active_loan: {
    id: string;
    status: string;
    state: MemberLoanState;
    amount: string;
    outstanding_balance: string;
    outstanding_principal: string;
    outstanding_interest: string;
    outstanding_penalty: string;
    duration_months: number;
    interest_rate: string;
    interest_type: 'flat' | 'reducing' | string;
    purpose: string;
    approved_at: string | null;
    disbursed_at: string | null;
    due_date: string | null;
    progress_percent: number;
    next_installment: {
      id: string;
      due_date: string;
      expected_amount: string;
      status: string;
      paid_amount: string;
    } | null;
    loan_product: LoanProduct | null;
  } | null;
  latest_rejected_application: {
    id: string;
    status: string;
    state: MemberLoanApplicationState;
    amount: string;
    duration_months: number;
    purpose: string;
    reference: string;
    submitted_at: string | null;
    approved_at: string | null;
    rejection_reason: string;
    recommended_max_amount: string;
    created_loan_id: string | null;
  } | null;
  history_preview: Array<{
    id: string;
    record_type: 'application' | 'loan';
    application_id: string | null;
    loan_id: string | null;
    status: string;
    amount: string;
    purpose: string;
    date: string | null;
  }>;
  loan_rules: {
    can_start_application: boolean;
    blocks_duplicate_applications: boolean;
    blocks_when_active_loan_exists: boolean;
    available_products: LoanProduct[];
    default_product: LoanProduct | null;
    policy_highlights: string[];
    frequency_summary: string;
    late_penalty: {
      type: string;
      value: string;
    };
  };
  empty_state: {
    title: string;
    description: string;
  };
  server_time: string;
  today: string;
}

export interface LoanEstimate {
  installmentAmount: string;
  totalRepayment: string;
  totalInterest: string;
  serviceFee: string;
}

export interface MemberLoanHistoryItem {
  id: string;
  recordType: 'application' | 'loan';
  status: string;
  applicationState: MemberLoanApplicationState;
  loanState: MemberLoanState;
  amount: string;
  purpose: string;
  dateApplied: string | null;
  dateApproved: string | null;
  dateRejected: string | null;
  applicationId?: string | null;
  loanId?: string | null;
}

const unwrapData = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

export const normalizeLoanState = (status: string): MemberLoanState => {
  const lowered = String(status || '').toLowerCase();
  if (['overdue', 'defaulted', 'defaulted_recovering', 'written_off'].includes(lowered)) {
    return 'overdue';
  }
  if (
    ['approved', 'disbursing', 'disbursed', 'active', 'due_soon', 'restructured'].includes(lowered)
  ) {
    return 'active';
  }
  if (
    ['paid', 'cleared', 'closed', 'recovered_from_guarantor', 'recovered_from_offset'].includes(
      lowered
    )
  ) {
    return 'completed';
  }
  return 'no_active_loan';
};

export const normalizeApplicationState = (status: string): MemberLoanApplicationState => {
  const lowered = String(status || '').toLowerCase();
  if (lowered === 'rejected') return 'rejected';
  if (lowered === 'cancelled') return 'cancelled';
  if (['approved', 'disbursed'].includes(lowered)) return 'approved';
  if (['submitted', 'in_review', 'treasurer_approved', 'committee_approved'].includes(lowered)) {
    return 'submitted_pending_review';
  }
  return 'not_started';
};

const calculateReducingInstallment = (principal: number, monthlyRate: number, months: number) => {
  if (!months) {
    return 0;
  }
  if (!monthlyRate) {
    return principal / months;
  }
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
};

export const calculateLoanEstimate = ({
  amount,
  durationMonths,
  interestRate,
  interestType,
}: {
  amount: string;
  durationMonths: number;
  interestRate: string;
  interestType?: string | null;
}): LoanEstimate => {
  const principal = Number(amount || 0);
  const months = Number(durationMonths || 0);
  const annualRate = Number(interestRate || 0) / 100;

  if (!principal || !months) {
    return {
      installmentAmount: '0.00',
      totalRepayment: '0.00',
      totalInterest: '0.00',
      serviceFee: '0.00',
    };
  }

  let installment = 0;
  let totalRepayment = 0;
  if (String(interestType || 'flat').toLowerCase() === 'reducing') {
    installment = calculateReducingInstallment(principal, annualRate / 12, months);
    totalRepayment = installment * months;
  } else {
    const totalInterest = principal * annualRate * (months / 12);
    totalRepayment = principal + totalInterest;
    installment = totalRepayment / months;
  }

  const totalInterest = Math.max(totalRepayment - principal, 0);
  return {
    installmentAmount: installment.toFixed(2),
    totalRepayment: totalRepayment.toFixed(2),
    totalInterest: totalInterest.toFixed(2),
    serviceFee: '0.00',
  };
};

export const memberLoanService = {
  async getWorkspace(chamaId: string): Promise<MemberLoanWorkspace> {
    const response = await apiClient.get<unknown>(`/v1/finance/member-loans/workspace?chama_id=${chamaId}`);
    return unwrapData<MemberLoanWorkspace>(response);
  },

  async previewEligibility(
    chamaId: string,
    input: {
      amount: string;
      durationMonths: number;
      purpose?: string;
      loanProductId?: string | null;
    }
  ): Promise<LoanEligibilityPreview> {
    return financeService.previewLoanEligibility(chamaId, {
      principal: input.amount,
      duration_months: input.durationMonths,
      purpose: input.purpose,
      loan_product_id: input.loanProductId || undefined,
    });
  },

  async submitApplication(
    chamaId: string,
    input: {
      amount: string;
      durationMonths: number;
      purpose: string;
      note?: string;
      loanProductId?: string | null;
    }
  ): Promise<LoanApplication> {
    return financeService.submitLoanApplication(chamaId, {
      requested_amount: input.amount,
      requested_term_months: input.durationMonths,
      purpose: input.note ? `${input.purpose}\n\n${input.note}` : input.purpose,
      loan_product_id: input.loanProductId || undefined,
    });
  },

  async getApplicationDetail(chamaId: string, applicationId: string): Promise<LoanApplication> {
    return financeService.getLoanApplication(chamaId, applicationId);
  },

  async getActiveLoanDetail(chamaId: string, loanId: string): Promise<Loan> {
    return financeService.getLoan(chamaId, loanId);
  },

  async getRepaymentSchedule(loanId: string): Promise<LoanInstallment[]> {
    return financeService.getLoanSchedule(loanId);
  },

  async getHistory(chamaId: string): Promise<MemberLoanHistoryItem[]> {
    const [applications, loans] = await Promise.all([
      financeService.getLoanApplications(chamaId).catch(() => []),
      financeService.getLoans(chamaId).catch(() => []),
    ]);

    const items: MemberLoanHistoryItem[] = [
      ...applications.map((application) => ({
        id: `application:${application.id}`,
        recordType: 'application' as const,
        status: application.status,
        applicationState: normalizeApplicationState(application.status),
        loanState: (
          application.status === 'approved' || application.status === 'disbursed'
            ? 'pending_application'
            : 'no_active_loan'
        ) as MemberLoanState,
        amount: application.requested_amount,
        purpose: application.purpose || '',
        dateApplied: application.submitted_at || null,
        dateApproved: application.approved_at || null,
        dateRejected: application.status === 'rejected' ? application.reviewed_at || null : null,
        applicationId: application.id,
        loanId: application.created_loan || null,
      })),
      ...loans.map((loan) => ({
        id: `loan:${loan.id}`,
        recordType: 'loan' as const,
        status: loan.status,
        applicationState: 'not_started' as const,
        loanState: normalizeLoanState(loan.status),
        amount: loan.principal,
        purpose: loan.purpose || '',
        dateApplied: loan.requested_at || null,
        dateApproved: loan.approved_at || null,
        dateRejected: loan.status === 'rejected' ? loan.approved_at || null : null,
        applicationId: null,
        loanId: loan.id,
      })),
    ];

    return items.sort((left, right) => {
      const leftDate = new Date(left.dateApproved || left.dateApplied || left.dateRejected || 0).getTime();
      const rightDate = new Date(right.dateApproved || right.dateApplied || right.dateRejected || 0).getTime();
      return rightDate - leftDate;
    });
  },
};
