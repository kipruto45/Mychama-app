import { apiClient } from './api';
import {
  Contribution,
  ContributionGoal,
  ContributionType,
  ExpenseRecord,
  FinancialReport,
  FinancialSnapshot,
  FinancialSummary,
  LedgerEntry,
  LoanApplication,
  LoanApplicationApproval,
  LoanApplicationGuarantor,
  LoanEligibilityPreview,
  LoanInstallment,
  Loan,
  LoanRecoveryAction,
  LoanRestructureRequest,
  LoanProduct,
  LoanReports,
  Penalty,
  Wallet,
} from '@/types';

type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
};

export type TransactionsFeedCategory = 'inflow' | 'outflow' | 'internal' | 'system';
export type TransactionsFeedStatus = 'pending' | 'success' | 'failed' | 'reversed' | 'unknown';

export interface TransactionsFeedMember {
  id: string;
  name: string;
  phone?: string;
}

export interface TransactionsFeedItem {
  ref: string;
  source: 'payment_intent' | 'journal_entry' | 'ledger_entry';
  source_id: string;
  event_at: string;
  category: TransactionsFeedCategory;
  direction: string;
  type: string;
  title: string;
  description?: string | null;
  amount: string;
  currency: string;
  status: TransactionsFeedStatus | string;
  method: string;
  provider?: string | null;
  reference?: string | null;
  member?: TransactionsFeedMember | null;
  receipt_available?: boolean;
  receipt_intent_id?: string | null;
}

export interface TransactionsFeedPage {
  items: TransactionsFeedItem[];
  pagination: {
    limit: number;
    next_cursor?: string | null;
  };
}

export interface TransactionDetailLine {
  id: string;
  entry_type: string;
  direction: string;
  amount: string;
  debit: string;
  credit: string;
  status: string;
  provider?: string | null;
  provider_reference?: string | null;
  account?: {
    id: string | null;
    code: string | null;
    name: string | null;
  };
  related_payment_intent_id?: string | null;
  related_loan_id?: string | null;
}

export interface TransactionDetail extends TransactionsFeedItem {
  lines?: TransactionDetailLine[];
  receipt_number?: string | null;
  reference_number?: string | null;
  related_payment_intent_id?: string | null;
  related_loan_id?: string | null;
  raw_metadata?: Record<string, any>;
}

const unwrapList = <T>(response: unknown, keys: string[]): T[] => {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (response && typeof response === 'object') {
    for (const key of keys) {
      const value = (response as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        return value as T[];
      }
    }
  }

  return [];
};

const unwrapItem = <T>(response: unknown, keys: string[]): T => {
  if (response && typeof response === 'object') {
    for (const key of keys) {
      const value = (response as Record<string, unknown>)[key];
      if (value && typeof value === 'object') {
        return value as T;
      }
    }
  }

  return response as T;
};

const lowerCaseStatus = (value: unknown): string => String(value || '').toLowerCase();

const toPenaltyRecord = (payload: Record<string, any>): Penalty => ({
  id: String(payload.id),
  chama: String(payload.chama),
  member: payload.member
    ? payload.member
    : payload.member_id
      ? {
          id: String(payload.member_id),
          full_name: String(payload.member_name || ''),
          phone: '',
          email: '',
          avatar: null,
          is_active: true,
          two_factor_enabled: false,
          two_factor_method: null,
          date_joined: '',
          last_login_at: null,
          role: null,
          referral_code: '',
          referral_count: 0,
        }
      : null,
  member_id: payload.member?.id || payload.member || payload.member_id,
  member_name: payload.member?.full_name || payload.member_name,
  category: payload.category,
  category_display: payload.category_display,
  amount: String(payload.amount || '0.00'),
  reason: String(payload.reason || payload.issued_reason || ''),
  issued_reason: payload.issued_reason,
  due_date: String(payload.due_date || ''),
  status: lowerCaseStatus(payload.status),
  status_display: payload.status_display,
  issued_by: payload.issued_by || null,
  issued_by_name: payload.issued_by_name || payload.issued_by?.full_name || null,
  resolved_by: payload.resolved_by || null,
  resolved_at: payload.resolved_at || null,
  paid_at: payload.paid_at || null,
  waived_at: payload.waived_at || null,
  outstanding_amount: payload.outstanding_amount ? String(payload.outstanding_amount) : undefined,
  dispute_reason: payload.dispute_reason || null,
  dispute_resolution: payload.dispute_resolution || null,
  payments: Array.isArray(payload.payments)
    ? payload.payments.map((payment: Record<string, any>) => ({
        id: String(payment.id),
        amount: String(payment.amount || '0.00'),
        method: String(payment.method || ''),
        transaction_reference: payment.transaction_reference,
        created_at: String(payment.created_at || ''),
      }))
    : undefined,
});

export const financeService = {
  async getAllTransactionsFeed(
    chamaId: string,
    params?: {
      category?: TransactionsFeedCategory;
      entry_type?: string;
      method?: string;
      status?: Exclude<TransactionsFeedStatus, 'unknown'>;
      search?: string;
      from_date?: string;
      to_date?: string;
      cursor?: string;
      limit?: number;
    }
  ): Promise<TransactionsFeedPage> {
    const query = new URLSearchParams({ chama_id: chamaId });
    if (params?.category) query.set('category', params.category);
    if (params?.entry_type) query.set('entry_type', params.entry_type);
    if (params?.method) query.set('method', params.method);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.from_date) query.set('from_date', params.from_date);
    if (params?.to_date) query.set('to_date', params.to_date);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));

    const response = await apiClient.get<unknown>(`/v1/finance/transactions?${query.toString()}`);
    if (response && typeof response === 'object' && (response as any).success === true) {
      return (response as ApiSuccess<TransactionsFeedPage>).data;
    }
    if (response && typeof response === 'object' && 'items' in (response as Record<string, unknown>)) {
      return response as TransactionsFeedPage;
    }
    throw new Error('Unable to load transactions.');
  },

  async getTransactionDetail(chamaId: string, transactionRef: string): Promise<TransactionDetail> {
    const query = new URLSearchParams({ chama_id: chamaId });
    const response = await apiClient.get<unknown>(
      `/v1/finance/transactions/${transactionRef}?${query.toString()}`
    );

    if (response && typeof response === 'object' && (response as any).success === true) {
      const data = (response as ApiSuccess<{ transaction: TransactionDetail }>).data;
      return data.transaction;
    }

    if (response && typeof response === 'object' && 'transaction' in (response as Record<string, unknown>)) {
      return (response as { transaction: TransactionDetail }).transaction;
    }

    throw new Error('Unable to load this transaction.');
  },

  async getContributions(chamaId: string): Promise<Contribution[]> {
    const response = await apiClient.get<unknown>(`/v1/finance/contributions/?chama_id=${chamaId}`);
    return unwrapList<Contribution>(response, ['contributions', 'results']);
  },

  async createContribution(chamaId: string, data: {
    member_id: string;
    contribution_type_id: string;
    amount: string;
    date_paid: string;
    method: string;
    receipt_code: string;
    idempotency_key: string;
  }): Promise<Contribution> {
    const response = await apiClient.post<{ contribution: Contribution }>(
      '/v1/finance/contributions/record',
      { ...data, chama_id: chamaId }
    );
    return response.contribution;
  },

  async getContributionTypes(chamaId: string): Promise<ContributionType[]> {
    const response = await apiClient.get<unknown>(`/v1/finance/contribution-types/?chama_id=${chamaId}`);
    return unwrapList<ContributionType>(response, ['types', 'contribution_types', 'results']);
  },

  async createContributionType(chamaId: string, data: {
    name: string;
    frequency: string;
    default_amount: string;
  }): Promise<ContributionType> {
    return apiClient.post<ContributionType>('/v1/finance/contribution-types/', {
      ...data,
      chama_id: chamaId,
    });
  },

  async getContributionGoals(chamaId: string): Promise<ContributionGoal[]> {
    const response = await apiClient.get<unknown>(`/v1/finance/contribution-goals/?chama_id=${chamaId}`);
    return unwrapList<ContributionGoal>(response, ['goals', 'results']);
  },

  async createContributionGoal(chamaId: string, data: {
    title: string;
    target_amount: string;
    due_date?: string;
    member_id?: string;
  }): Promise<ContributionGoal> {
    return apiClient.post<ContributionGoal>('/v1/finance/contribution-goals/', {
      ...data,
      chama_id: chamaId,
    });
  },

  async getLoans(chamaId: string): Promise<Loan[]> {
    const response = await apiClient.get<unknown>(`/v1/finance/loans/?chama_id=${chamaId}`);
    return unwrapList<Loan>(response, ['loans', 'results']);
  },

  async getLoanProducts(chamaId: string): Promise<LoanProduct[]> {
    const response = await apiClient.get<unknown>(`/v1/finance/loan-policies/?chama_id=${chamaId}`);
    return unwrapList<LoanProduct>(response, ['policies', 'loan_policies', 'results']);
  },

  async getLoan(chamaId: string, loanId: string): Promise<Loan> {
    const loans = await this.getLoans(chamaId);
    const loan = loans.find((item) => item.id === loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }
    return loan;
  },

  async previewLoanEligibility(chamaId: string, data: {
    member_id?: string;
    loan_product_id?: string;
    principal: string;
    duration_months: number;
    purpose?: string;
  }): Promise<LoanEligibilityPreview> {
    return apiClient.post<LoanEligibilityPreview>('/v1/finance/loans/eligibility', {
      ...data,
      chama_id: chamaId,
    });
  },

  async getLoanApplications(chamaId: string, status?: string): Promise<LoanApplication[]> {
    const query = status
      ? `/v1/finance/loan-applications/?chama_id=${chamaId}&status=${status}`
      : `/v1/finance/loan-applications/?chama_id=${chamaId}`;
    const response = await apiClient.get<unknown>(query);
    return unwrapList<LoanApplication>(response, ['applications', 'results']);
  },

  async getLoanApplication(chamaId: string, applicationId: string): Promise<LoanApplication> {
    const applications = await this.getLoanApplications(chamaId);
    const application = applications.find((item) => item.id === applicationId);
    if (!application) {
      throw new Error('Loan application not found');
    }
    return application;
  },

  async requestLoan(chamaId: string, data: {
    member_id?: string;
    loan_product_id?: string;
    principal: string;
    duration_months: number;
    purpose?: string;
    guarantors?: Array<{
      guarantor_id: string;
      guaranteed_amount: string;
    }>;
  }): Promise<LoanApplication> {
    return apiClient.post<LoanApplication>('/v1/finance/loans/request', {
      ...data,
      chama_id: chamaId,
    });
  },

  async submitLoanApplication(chamaId: string, data: {
    member_id?: string;
    loan_product_id?: string;
    requested_amount: string;
    requested_term_months: number;
    purpose?: string;
    guarantors?: Array<{
      guarantor_id: string;
      guaranteed_amount: string;
    }>;
  }): Promise<LoanApplication> {
    return apiClient.post<LoanApplication>('/v1/finance/loan-applications/', {
      ...data,
      chama_id: chamaId,
    });
  },

  async reviewLoanApplication(chamaId: string, applicationId: string, data: {
    decision: 'approved' | 'rejected';
    note?: string;
  }): Promise<LoanApplication> {
    return apiClient.post<LoanApplication>(
      `/v1/finance/loan-applications/${applicationId}/review`,
      { ...data, chama_id: chamaId }
    );
  },

  async committeeApproveLoanApplication(chamaId: string, applicationId: string, data: {
    decision: 'approved' | 'rejected';
    note?: string;
  }): Promise<LoanApplication> {
    return apiClient.post<LoanApplication>(
      `/v1/finance/loan-applications/${applicationId}/committee-approve`,
      { ...data, chama_id: chamaId }
    );
  },

  async approveLoanApplication(chamaId: string, applicationId: string, note?: string): Promise<LoanApplication> {
    return apiClient.post<LoanApplication>(
      `/v1/finance/loan-applications/${applicationId}/approve`,
      { chama_id: chamaId, note }
    );
  },

  async rejectLoanApplication(chamaId: string, applicationId: string, note?: string): Promise<LoanApplication> {
    return apiClient.post<LoanApplication>(
      `/v1/finance/loan-applications/${applicationId}/reject`,
      { chama_id: chamaId, note }
    );
  },

  async disburseLoanApplication(chamaId: string, applicationId: string, data: {
    disbursement_reference: string;
    idempotency_key: string;
  }): Promise<{
    application: LoanApplication;
    loan: Loan;
    ledger_entry: LedgerEntry;
  }> {
    return apiClient.post(
      `/v1/finance/loan-applications/${applicationId}/disburse`,
      { ...data, chama_id: chamaId }
    );
  },

  async getLoanApplicationApprovals(applicationId: string): Promise<LoanApplicationApproval[]> {
    const response = await apiClient.get<unknown>(`/v1/finance/loan-applications/${applicationId}/approvals`);
    return unwrapList<LoanApplicationApproval>(response, ['approval_logs', 'approvals', 'results']);
  },

  async getLoanApplicationGuarantors(applicationId: string): Promise<LoanApplicationGuarantor[]> {
    const response = await apiClient.get<unknown>(`/v1/finance/loan-applications/${applicationId}/guarantors`);
    return unwrapList<LoanApplicationGuarantor>(response, ['guarantors', 'results']);
  },

  async addLoanApplicationGuarantor(applicationId: string, data: {
    guarantor_id: string;
    guaranteed_amount: string;
  }): Promise<LoanApplicationGuarantor> {
    return apiClient.post<LoanApplicationGuarantor>(
      `/v1/finance/loan-applications/${applicationId}/guarantors`,
      data
    );
  },

  async respondToLoanApplicationGuarantor(guarantorRecordId: string, data: {
    action: 'accepted' | 'rejected';
    review_note?: string;
  }): Promise<LoanApplicationGuarantor> {
    return apiClient.post<LoanApplicationGuarantor>(
      `/v1/finance/loan-application-guarantors/${guarantorRecordId}/respond`,
      data
    );
  },

  async approveLoan(chamaId: string, loanId: string, note?: string): Promise<Loan> {
    return apiClient.post<Loan>(`/v1/finance/loans/${loanId}/approve`, { note, chama_id: chamaId });
  },

  async rejectLoan(chamaId: string, loanId: string, note?: string): Promise<Loan> {
    return apiClient.post<Loan>(`/v1/finance/loans/${loanId}/reject`, { note, chama_id: chamaId });
  },

  async disburseLoan(chamaId: string, loanId: string, reference: string): Promise<Loan> {
    return apiClient.post<Loan>(`/v1/finance/loans/${loanId}/disburse`, { reference, chama_id: chamaId });
  },

  async getLoanSchedule(loanId: string): Promise<LoanInstallment[]> {
    const response = await apiClient.get<unknown>(`/v1/finance/loans/${loanId}/schedule`);
    return unwrapList<LoanInstallment>(response, ['schedule', 'results']);
  },

  async getLoanRecoveryActions(loanId: string): Promise<LoanRecoveryAction[]> {
    const response = await apiClient.get<unknown>(`/v1/finance/loans/${loanId}/recovery-actions`);
    return unwrapList<LoanRecoveryAction>(response, ['actions', 'results']);
  },

  async requestLoanRestructure(loanId: string, data: {
    requested_duration_months: number;
    requested_interest_rate?: string;
    reason?: string;
  }): Promise<LoanRestructureRequest> {
    return apiClient.post<LoanRestructureRequest>(
      `/v1/finance/loans/${loanId}/restructure/request`,
      data
    );
  },

  async getLoanRestructureRequests(chamaId: string, status?: string): Promise<LoanRestructureRequest[]> {
    const query = status
      ? `/v1/finance/loans/restructures/?chama_id=${chamaId}&status=${status}`
      : `/v1/finance/loans/restructures/?chama_id=${chamaId}`;
    const response = await apiClient.get<unknown>(query);
    return unwrapList<LoanRestructureRequest>(response, ['results', 'restructures', 'requests']);
  },

  async reviewLoanRestructureRequest(requestId: string, data: {
    decision: 'approved' | 'rejected';
    note?: string;
  }): Promise<LoanRestructureRequest> {
    return apiClient.post<LoanRestructureRequest>(`/v1/finance/loans/restructures/${requestId}/review`, data);
  },

  async recordLoanRecoveryAction(loanId: string, data: {
    action_type: string;
    amount?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }): Promise<LoanRecoveryAction> {
    return apiClient.post<LoanRecoveryAction>(
      `/v1/finance/loans/${loanId}/recovery-actions`,
      data
    );
  },

  async offsetLoanFromSavings(loanId: string, data: {
    amount: string;
    notes?: string;
    idempotency_key: string;
  }): Promise<{
    repayment: {
      id: string;
      loan: string;
      amount: string;
      date_paid: string;
      method: string;
      receipt_code: string;
      created_at: string;
      updated_at: string;
    };
    ledger_entry: LedgerEntry;
  }> {
    return apiClient.post(`/v1/finance/loans/${loanId}/offset`, data);
  },

  async writeOffLoan(loanId: string, data: {
    notes?: string;
    idempotency_key: string;
  }): Promise<LoanRecoveryAction> {
    return apiClient.post<LoanRecoveryAction>(`/v1/finance/loans/${loanId}/write-off`, data);
  },

  async repayLoan(loanId: string, data: {
    amount: string;
    date_paid: string;
    method: 'mpesa' | 'cash';
    receipt_code: string;
    idempotency_key: string;
  }): Promise<{
    repayment: {
      id: string;
      loan: string;
      amount: string;
      date_paid: string;
      method: string;
      receipt_code: string;
      created_at: string;
      updated_at: string;
    };
    ledger_entry: LedgerEntry;
  }> {
    return apiClient.post(`/v1/finance/loans/${loanId}/repay`, data);
  },

  async getWallet(chamaId: string): Promise<Wallet> {
    const response = await apiClient.get<{
      chama_id: string;
      member_id: string;
      currency: string;
      wallet_balance: string;
    }>(`/v1/finance/wallet?chama_id=${chamaId}`);
    return {
      id: `${response.chama_id}-${response.member_id}`,
      owner_type: 'user',
      owner_id: response.member_id,
      available_balance: response.wallet_balance,
      locked_balance: '0.00',
      total_balance: response.wallet_balance,
      currency: response.currency,
      created_at: '',
      updated_at: '',
    };
  },

  async getLedgerEntries(chamaId: string): Promise<LedgerEntry[]> {
    const response = await apiClient.get<unknown>(`/v1/finance/ledger?chama_id=${chamaId}`);
    return unwrapList<LedgerEntry>(response, ['entries', 'ledger', 'results']);
  },

  async getPenalties(chamaId: string): Promise<Penalty[]> {
    const response = await apiClient.get<unknown>(`/v1/fines/?chama_id=${chamaId}`);
    return unwrapList<Record<string, any>>(response, ['results']).map(toPenaltyRecord);
  },

  async createPenalty(chamaId: string, data: {
    member_id: string;
    amount: string;
    reason: string;
    due_date: string;
  }): Promise<Penalty> {
    const response = await apiClient.post<unknown>(`/v1/fines/issue/?chama_id=${chamaId}`, {
      member_ids: [data.member_id],
      category: 'CUSTOM',
      amount: data.amount,
      due_date: data.due_date,
      reason: data.reason,
      attachments: [],
    });
    const fines = unwrapList<Record<string, any>>(response, ['fines', 'results']);
    const created = fines[0];
    if (!created) {
      throw new Error('Fine was not returned by the server.');
    }
    return toPenaltyRecord(created);
  },

  async resolvePenalty(
    chamaId: string,
    penaltyId: string,
    data?: {
      amount?: string;
      method?: 'cash' | 'mpesa';
      transaction_reference?: string;
      notes?: string;
    }
  ): Promise<Penalty> {
    const response = await apiClient.post<unknown>(`/v1/fines/${penaltyId}/pay/`, {
      amount: data?.amount || '0.00',
      method: (data?.method || 'cash').toUpperCase(),
      transaction_reference: data?.transaction_reference,
      notes: data?.notes,
      idempotency_key: `fine-pay-${penaltyId}-${Date.now()}`,
    });
    return toPenaltyRecord(unwrapItem<Record<string, any>>(response, ['fine', 'result']));
  },

  async getFinancialSummary(chamaId: string): Promise<FinancialSummary> {
    const summary = await apiClient.get<{
      total_balance: string;
      total_contributions: string;
      total_loans: string;
      total_expenses: string;
      currency: string;
    }>(`/v1/finance/summary?chama_id=${chamaId}`);
    const loans = await this.getLoans(chamaId).catch(() => []);
    return {
      total_contributions: summary.total_contributions || '0.00',
      total_loans: summary.total_loans || '0.00',
      total_penalties: '0.00',
      total_balance: summary.total_balance || '0.00',
      total_expenses: summary.total_expenses || '0.00',
      wallet_balance: summary.total_balance || '0.00',
      member_count: 0,
      active_loans: loans.filter((loan) => ['approved', 'disbursed', 'active'].includes(loan.status)).length,
      currency: summary.currency || 'KES',
    };
  },

  async getFinanceReports(chamaId: string): Promise<FinancialReport> {
    const report = await apiClient.get<FinancialReport>(`/v1/finance/reports?chama_id=${chamaId}`);
    return {
      ...report,
      summary: {
        ...report.summary,
        wallet_balance: report.summary.wallet_balance || report.summary.total_balance || '0.00',
        member_count: report.summary.member_count || 0,
        active_loans: report.summary.active_loans || 0,
        currency: report.summary.currency || 'KES',
      },
    };
  },

  async getMemberContributionSummary(chamaId: string): Promise<Array<{
    member_id: string;
    member__full_name: string;
    total: string;
  }>> {
    return apiClient.get(`/v1/finance/member-contributions?chama_id=${chamaId}`);
  },

  async getLoanReports(chamaId: string): Promise<LoanReports> {
    return apiClient.get<LoanReports>(`/v1/finance/loans/reports?chama_id=${chamaId}`);
  },

  async getExpenses(chamaId: string): Promise<ExpenseRecord[]> {
    const response = await apiClient.get<unknown>(`/v1/finance/expenses/?chama_id=${chamaId}`);
    return unwrapList<ExpenseRecord>(response, ['expenses', 'results']);
  },

  async createExpense(chamaId: string, data: {
    category: string;
    amount: string;
    expense_date: string;
    description: string;
    vendor_name?: string;
    notes?: string;
    receipt_reference?: string;
  }): Promise<ExpenseRecord> {
    const response = await apiClient.post<unknown>('/v1/finance/expenses/', {
      ...data,
      chama_id: chamaId,
      idempotency_key: `expense-${chamaId}-${Date.now()}`,
    });
    return unwrapItem<ExpenseRecord>(response, ['expense', 'request', 'result']);
  },

  async approveExpense(chamaId: string, expenseId: string, note?: string): Promise<ExpenseRecord> {
    const response = await apiClient.post<unknown>(`/v1/finance/expenses/${expenseId}/approve`, {
      chama_id: chamaId,
      note,
    });
    return unwrapItem<ExpenseRecord>(response, ['expense', 'request', 'result']);
  },

  async rejectExpense(chamaId: string, expenseId: string, note?: string): Promise<ExpenseRecord> {
    const response = await apiClient.post<unknown>(`/v1/finance/expenses/${expenseId}/reject`, {
      chama_id: chamaId,
      note,
    });
    return unwrapItem<ExpenseRecord>(response, ['expense', 'request', 'result']);
  },

  async markExpensePaid(chamaId: string, expenseId: string, data: {
    payment_reference?: string;
    note?: string;
  }): Promise<ExpenseRecord> {
    const response = await apiClient.post<unknown>(`/v1/finance/expenses/${expenseId}/mark-paid`, {
      chama_id: chamaId,
      ...data,
      idempotency_key: `expense-paid-${expenseId}-${Date.now()}`,
    });
    return unwrapItem<ExpenseRecord>(response, ['expense', 'request', 'result']);
  },

  async getFinancialSnapshots(chamaId: string): Promise<FinancialSnapshot[]> {
    return apiClient.get(`/v1/finance/snapshots?chama_id=${chamaId}`);
  },
};
