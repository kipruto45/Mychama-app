import { apiClient } from './api';

const unwrapList = <T>(response: unknown, keys: string[]): T[] => {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (response && typeof response === 'object') {
    const dataValue = (response as Record<string, unknown>).data;
    if (dataValue && typeof dataValue === 'object') {
      const unwrapped = unwrapList<T>(dataValue, keys);
      if (unwrapped.length) {
        return unwrapped;
      }
    }

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

const normalizePaymentIntent = (payload: Record<string, any>): PaymentIntentRecord => {
  const metadata = (payload.metadata || {}) as Record<string, any>;
  let normalizedStatus = String(payload.status || '').toLowerCase();
  if (metadata.ready_for_payout) {
    normalizedStatus = 'approved';
  }
  const normalizedIntent = {
    ...payload,
    id: String(payload.id),
    chama: String(payload.chama || ''),
    intent_type: String(payload.intent_type || payload.payment_method || '').toLowerCase(),
    payment_method: String(payload.payment_method || payload.intent_type || '').toLowerCase(),
    purpose: String(payload.purpose || '').toLowerCase(),
    reference_type: String(payload.reference_type || ''),
    reference_id: String(payload.reference_id || payload.reference || ''),
    reference: String(payload.reference || payload.reference_id || ''),
    amount: String(payload.amount || '0.00'),
    currency: String(payload.currency || 'KES'),
    phone: payload.phone || payload.masked_phone || undefined,
    status: normalizedStatus,
    metadata,
    beneficiary_name: metadata.beneficiary_name || undefined,
    beneficiary_phone: metadata.beneficiary_phone || undefined,
    beneficiary_details: metadata.beneficiary_details || undefined,
    payout_proof: metadata.payout_proof || undefined,
    created_at: String(payload.created_at || ''),
    updated_at: String(payload.updated_at || ''),
  } as unknown as PaymentIntentRecord;

  normalizedIntent.intent = normalizedIntent;
  return normalizedIntent;
};

export interface PaymentIntentRecord {
  id: string;
  chama: string;
  user?: string;
  intent_type: string;
  payment_method?: string;
  purpose: string;
  reference_type: string;
  reference_id: string;
  reference?: string;
  amount: string;
  currency: string;
  phone?: string;
  status: string;
  checkout_request_id?: string;
  merchant_request_id?: string;
  mpesa_receipt_number?: string | null;
  failure_reason?: string | null;
  raw_response?: Record<string, any> | null;
  idempotency_key?: string;
  expires_at?: string | null;
  metadata?: Record<string, any>;
  latest_stk_checkout_request_id?: string | null;
  transactions?: PaymentTransactionRecord[];
  intent?: PaymentIntentRecord;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransactionRecord {
  id: string;
  payment_intent: string;
  provider: string;
  reference: string;
  amount: string;
  status: string;
  provider_response?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentIntentActivityRecord {
  id: string;
  action: string;
  actor_name?: string | null;
  note?: string | null;
  created_at: string;
}

export interface UnifiedPaymentIntentRecord {
  id: string;
  chama: string;
  chama_name?: string;
  user?: string;
  user_name?: string;
  contribution?: string | null;
  contribution_type?: string | null;
  amount: string;
  currency: string;
  purpose: string;
  description?: string;
  payment_method: 'mpesa' | 'cash' | 'wallet' | 'bank' | 'card';
  provider: string;
  provider_intent_id: string;
  status: string;
  reference: string;
  failure_reason?: string | null;
  failure_code?: string | null;
  metadata?: Record<string, any>;
  expires_at?: string | null;
  initiated_at?: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  mpesa_details?: Record<string, any> | null;
  card_details?: Record<string, any> | null;
  cash_details?: Record<string, any> | null;
  bank_details?: Record<string, any> | null;
}

export interface UnifiedPaymentReceiptRecord {
  id: string;
  payment_intent_id: string;
  transaction_id: string;
  receipt_number: string;
  reference_number: string;
  amount: string;
  currency: string;
  payment_method: string;
  issued_at: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ReceiptPdfLinkRecord {
  download_url: string;
  expires_at: string;
}

export interface UnifiedPaymentStatusRecord {
  intent: UnifiedPaymentIntentRecord;
  transactions: Array<Record<string, any>>;
  receipt?: UnifiedPaymentReceiptRecord | null;
  audit_logs: Array<Record<string, any>>;
}

export interface PaymentReconciliationIssueRecord {
  id?: string;
  issue_type: string;
  severity: string;
  summary: string;
  payment_intent_id?: string;
  provider_reference?: string;
  payment_method?: string;
  status?: string;
  amount?: string;
  currency?: string;
  reference?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface PaymentReconciliationCaseRecord {
  id: string;
  chama: string;
  payment_intent?: string | null;
  payment_transaction?: string | null;
  webhook?: string | null;
  mismatch_type: string;
  case_status: string;
  expected_amount?: string | null;
  received_amount?: string | null;
  expected_reference?: string;
  received_reference?: string;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  resolution_notes?: string;
  resolved_at?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentRefundRecord {
  id: string;
  chama: string;
  payment_intent: string;
  amount: string;
  reason: string;
  status: string;
  idempotency_key: string;
  requested_by?: string | null;
  requested_by_name?: string | null;
  approved_by?: string | null;
  approved_by_name?: string | null;
  processed_by?: string | null;
  processed_by_name?: string | null;
  processed_at?: string | null;
  notes?: string;
  ledger_reversal_entry?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentDisputeRecord {
  id: string;
  chama: string;
  payment_intent?: string | null;
  opened_by?: string | null;
  opened_by_name?: string | null;
  category: string;
  amount?: string | null;
  reason: string;
  reference?: string;
  provider_case_reference?: string;
  status: string;
  resolution_notes?: string;
  financial_reversal_entry?: string | null;
  metadata?: Record<string, any>;
  resolved_by?: string | null;
  resolved_by_name?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManualPaymentApprovalPolicyRecord {
  id: string;
  chama: string;
  cash_maker_checker_enabled: boolean;
  bank_maker_checker_enabled: boolean;
  block_payer_self_approval: boolean;
  require_cash_receipt_number: boolean;
  require_cash_proof: boolean;
  require_bank_proof_document: boolean;
  require_bank_transfer_reference: boolean;
  dual_approval_threshold: string;
  allowed_cash_recorder_roles: string[];
  allowed_cash_verifier_roles: string[];
  allowed_bank_verifier_roles: string[];
  allowed_reconciliation_roles: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentStatementLineRecord {
  id: string;
  line_number: number;
  external_reference?: string;
  payer_reference?: string;
  amount: string;
  currency: string;
  transaction_date?: string | null;
  match_status: string;
  matched_payment_intent?: string | null;
  matched_transaction?: string | null;
  reconciliation_case?: string | null;
  raw_payload?: Record<string, any>;
  created_at: string;
}

export interface PaymentStatementImportRecord {
  id: string;
  chama: string;
  imported_by?: string | null;
  imported_by_name?: string | null;
  payment_method: string;
  provider_name?: string;
  source_name?: string;
  statement_date?: string | null;
  status: string;
  total_rows: number;
  matched_rows: number;
  mismatch_rows: number;
  unmatched_rows: number;
  metadata?: Record<string, any>;
  lines?: PaymentStatementLineRecord[];
  created_at: string;
  updated_at: string;
}

export interface PaymentSettlementAllocationRecord {
  id: string;
  payment_transaction: string;
  provider_reference?: string;
  settled_amount: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PaymentSettlementRecord {
  id: string;
  chama: string;
  statement_import?: string | null;
  payment_method: 'mpesa';
  provider_name?: string;
  settlement_reference: string;
  settlement_date: string;
  currency: string;
  status: string;
  gross_amount: string;
  fee_amount: string;
  net_amount: string;
  clearing_account_key: string;
  destination_account_key: string;
  fee_account_key: string;
  journal_entry?: string | null;
  posted_by?: string | null;
  posted_by_name?: string | null;
  posted_at?: string | null;
  metadata?: Record<string, any>;
  allocations?: PaymentSettlementAllocationRecord[];
  created_at: string;
  updated_at: string;
}

export const paymentService = {
  async getPayments(chamaId: string): Promise<PaymentIntentRecord[]> {
    const response = await apiClient.get<unknown>(`/v1/payments/my/transactions?chama_id=${chamaId}`);
    return unwrapList<Record<string, any>>(response, ['transactions', 'payments', 'results']).map(normalizePaymentIntent);
  },

  async getChamaTransactions(chamaId: string): Promise<PaymentIntentRecord[]> {
    const response = await apiClient.get<unknown>(`/v1/payments/${chamaId}/transactions`);
    return unwrapList<Record<string, any>>(response, ['transactions', 'payments', 'results']).map(normalizePaymentIntent);
  },

  async getTransaction(transactionId: string): Promise<PaymentIntentRecord> {
    const response = await apiClient.get<unknown>(`/v1/payments/my/transactions/${transactionId}`);
    return normalizePaymentIntent(unwrapItem<Record<string, any>>(response, ['transaction', 'payment', 'intent']));
  },

  async getPaymentDetail(chamaId: string, paymentId: string): Promise<PaymentIntentRecord> {
    const response = await apiClient.get<unknown>(`/v1/payments/${chamaId}/transactions/${paymentId}`);
    return normalizePaymentIntent(unwrapItem<Record<string, any>>(response, ['transaction', 'payment', 'intent']));
  },

  async createPayment(data: {
    chama: string;
    amount: string;
    method: 'mpesa' | 'cash';
    reference_id: string;
    idempotency_key?: string;
  }): Promise<{
    intent: PaymentIntentRecord;
    instructions?: Record<string, any>;
  }> {
    return apiClient.post('/v1/payments/deposit/c2b/intent', {
      chama_id: data.chama,
      amount: data.amount,
      purpose: 'contribution',
      reference_id: data.reference_id,
      idempotency_key: data.idempotency_key,
    });
  },

  async initiateMpesaPayment(data: {
    chamaId: string;
    phone: string;
    amount: string;
    referenceId: string;
    idempotency_key?: string;
  }): Promise<{ checkout_request_id: string; payment_intent: PaymentIntentRecord; created: boolean }> {
    return apiClient.post('/v1/payments/mpesa/stk-push/', {
      chama_id: data.chamaId,
      phone: data.phone,
      amount: data.amount,
      contribution_type_id: data.referenceId,
      idempotency_key: data.idempotency_key,
    });
  },

  async getPaymentStatus(paymentId: string): Promise<PaymentIntentRecord> {
    const response = await apiClient.get<unknown>(`/v1/payments/${paymentId}/status/`);
    const payload = unwrapItem<Record<string, any>>(response, ['intent', 'data']);
    return normalizePaymentIntent(payload.intent ? payload.intent : payload);
  },

  async createPaymentIntent(data: {
    chama_id: string;
    amount: string;
    currency?: string;
    payment_method: 'mpesa' | 'cash';
    purpose?: string;
    purpose_id?: string;
    description?: string;
    contribution_id?: string;
    contribution_type_id?: string;
    provider?: string;
    idempotency_key?: string;
    metadata?: Record<string, any>;
    phone?: string;
    received_by?: string;
    notes?: string;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    transfer_reference?: string;
  }): Promise<PaymentIntentRecord> {
    const response = await this.createUnifiedPaymentIntent(data);
    return normalizePaymentIntent(response as unknown as Record<string, any>);
  },

  async createUnifiedPaymentReceiptPdfLink(intentId: string): Promise<ReceiptPdfLinkRecord> {
    const response = await apiClient.post<unknown>(`/v1/payments/${intentId}/receipt/pdf-link/`);
    const payload = unwrapItem<Record<string, any>>(response, ['data']);
    return {
      download_url: String(payload.download_url || ''),
      expires_at: String(payload.expires_at || ''),
    };
  },

  async getPaymentHistory(params?: {
    chama_id?: string;
    status?: string;
    payment_method?: string;
    limit?: number;
  }): Promise<PaymentIntentRecord[]> {
    const rows = await this.getUnifiedPaymentHistory(params);
    return rows.map((item) => normalizePaymentIntent(item as unknown as Record<string, any>));
  },

  async requestWithdrawal(data: {
    chamaId: string;
    amount: string;
    phone: string;
    reason: string;
    beneficiary_name?: string;
    beneficiary_phone?: string;
    beneficiary_details?: string;
    idempotency_key?: string;
  }): Promise<PaymentIntentRecord> {
    const response = await apiClient.post<unknown>('/v1/payments/withdraw/request', {
      chama_id: data.chamaId,
      amount: data.amount,
      phone: data.phone,
      reason: data.reason,
      beneficiary_name: data.beneficiary_name,
      beneficiary_phone: data.beneficiary_phone,
      beneficiary_details: data.beneficiary_details,
      idempotency_key: data.idempotency_key,
    });

    return normalizePaymentIntent(unwrapItem<Record<string, any>>(response, ['intent', 'transaction', 'payment']));
  },

  async approveWithdrawal(intentId: string, chamaId: string, note?: string): Promise<Record<string, any>> {
    return apiClient.post(`/v1/payments/withdraw/${intentId}/approve`, {
      chama_id: chamaId,
      note,
    });
  },

  async rejectWithdrawal(intentId: string, chamaId: string, note?: string): Promise<Record<string, any>> {
    return apiClient.post(`/v1/payments/withdraw/${intentId}/reject`, {
      chama_id: chamaId,
      note,
    });
  },

  async sendWithdrawal(intentId: string, chamaId: string, payout_proof?: string): Promise<Record<string, any>> {
    return apiClient.post(`/v1/payments/withdraw/${intentId}/send`, {
      chama_id: chamaId,
      payout_proof,
    });
  },

  async getIntentActivity(intentId: string): Promise<PaymentIntentActivityRecord[]> {
    const response = await apiClient.get<unknown>(`/v1/payments/intents/${intentId}/activity`);
    return unwrapList<PaymentIntentActivityRecord>(response, ['activities', 'activity', 'results']);
  },

  async getPendingLoanDisbursements(): Promise<PaymentIntentRecord[]> {
    const response = await apiClient.get<unknown>('/v1/payments/loan-disbursements/pending');
    return unwrapList<Record<string, any>>(response, ['disbursements', 'transactions', 'results']).map(normalizePaymentIntent);
  },

  async approveLoanDisbursement(intentId: string, note?: string): Promise<Record<string, any>> {
    return apiClient.post(`/v1/payments/loan-disbursements/${intentId}/approve`, { note });
  },

  async sendLoanDisbursement(intentId: string, payout_proof?: string): Promise<Record<string, any>> {
    return apiClient.post(`/v1/payments/loan-disbursements/${intentId}/send`, { payout_proof });
  },

  async rejectLoanDisbursement(intentId: string, reason: string): Promise<Record<string, any>> {
    return apiClient.post(`/v1/payments/loan-disbursements/${intentId}/reject`, { reason });
  },

  async reconcilePayment(data: {
    payment_intent_id?: string;
    chama_id?: string;
  }): Promise<Record<string, any>> {
    return apiClient.post('/v1/payments/mpesa/reconcile/', data);
  },

  async createUnifiedPaymentIntent(data: {
    chama_id: string;
    amount: string;
    currency?: string;
    payment_method: 'mpesa' | 'cash' | 'bank' | 'wallet';
    purpose?: string;
    purpose_id?: string;
    description?: string;
    contribution_id?: string;
    contribution_type_id?: string;
    provider?: string;
    idempotency_key?: string;
    metadata?: Record<string, any>;
    phone?: string;
    received_by?: string;
    notes?: string;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  }): Promise<UnifiedPaymentIntentRecord> {
    const response = await apiClient.post<unknown>('/v1/payments/intents/', data);
    return unwrapItem<UnifiedPaymentIntentRecord>(response, ['data', 'intent']);
  },

  async getUnifiedPaymentStatus(intentId: string): Promise<UnifiedPaymentStatusRecord> {
    const response = await apiClient.get<unknown>(`/v1/payments/intents/${intentId}/status/`);
    return unwrapItem<UnifiedPaymentStatusRecord>(response, ['data']);
  },

  async verifyUnifiedPayment(intentId: string): Promise<UnifiedPaymentIntentRecord> {
    const response = await apiClient.post<unknown>(`/v1/payments/intents/${intentId}/verify/`);
    return unwrapItem<UnifiedPaymentIntentRecord>(response, ['data', 'intent']);
  },

  async getUnifiedPaymentHistory(params?: {
    chama_id?: string;
    payment_method?: string;
    status?: string;
    limit?: number;
  }): Promise<UnifiedPaymentIntentRecord[]> {
    const queryParams = new URLSearchParams();
    if (params?.chama_id) queryParams.append('chama_id', params.chama_id);
    if (params?.payment_method) queryParams.append('payment_method', params.payment_method);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `/v1/payments/history/?${queryString}` : '/v1/payments/history/';

    const response = await apiClient.get<unknown>(url);
    return unwrapList<UnifiedPaymentIntentRecord>(response, ['payments', 'data', 'results']);
  },

  async getUnifiedPaymentReceipt(intentId: string): Promise<UnifiedPaymentReceiptRecord> {
    const response = await apiClient.get<unknown>(`/v1/payments/${intentId}/receipt/`);
    return unwrapItem<UnifiedPaymentReceiptRecord>(response, ['data', 'receipt']);
  },

  async approveCashPayment(data: {
    intent_id: string;
    receipt_number?: string;
    notes?: string;
  }): Promise<UnifiedPaymentIntentRecord> {
    const response = await apiClient.post<unknown>('/v1/payments/cash/approve/', data);
    return unwrapItem<UnifiedPaymentIntentRecord>(response, ['data', 'intent']);
  },

  async rejectCashPayment(data: {
    intent_id: string;
    notes?: string;
  }): Promise<UnifiedPaymentIntentRecord> {
    const response = await apiClient.post<unknown>('/v1/payments/cash/reject/', data);
    return unwrapItem<UnifiedPaymentIntentRecord>(response, ['data', 'intent']);
  },

  async getPaymentReconciliationQueue(params: {
    chama_id: string;
    payment_method?: string;
    limit?: number;
  }): Promise<PaymentReconciliationIssueRecord[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('chama_id', params.chama_id);
    if (params.payment_method) queryParams.append('payment_method', params.payment_method);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<unknown>(`/v1/payments/reconciliation/?${queryParams.toString()}`);
    return unwrapList<PaymentReconciliationIssueRecord>(response, ['issues', 'data', 'results']);
  },

  async resolvePaymentReconciliationIssue(
    caseId: string,
    data: {
      action: 'retry_verification' | 'mark_reconciled' | 'mark_failed' | 'confirm_payment';
      notes?: string;
    }
  ): Promise<PaymentReconciliationCaseRecord> {
    const response = await apiClient.post<unknown>(`/v1/payments/reconciliation/${caseId}/resolve/`, data);
    return unwrapItem<PaymentReconciliationCaseRecord>(response, ['data']);
  },

  async requestPaymentRefund(data: {
    intent_id: string;
    amount?: string;
    reason?: string;
    idempotency_key?: string;
  }): Promise<PaymentRefundRecord> {
    const response = await apiClient.post<unknown>('/v1/payments/refunds/request/', data);
    return unwrapItem<PaymentRefundRecord>(response, ['data']);
  },

  async getPaymentRefunds(params: {
    chama_id: string;
    status?: string;
    limit?: number;
  }): Promise<PaymentRefundRecord[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('chama_id', params.chama_id);
    if (params.status) queryParams.append('status', params.status);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<unknown>(`/v1/payments/refunds/?${queryParams.toString()}`);
    return unwrapList<PaymentRefundRecord>(response, ['refunds', 'data', 'results']);
  },

  async approvePaymentRefund(
    refundId: string,
    data?: {
      approve?: boolean;
      note?: string;
    }
  ): Promise<PaymentRefundRecord> {
    const response = await apiClient.post<unknown>(`/v1/payments/refunds/${refundId}/approve/`, data ?? {});
    return unwrapItem<PaymentRefundRecord>(response, ['data']);
  },

  async processPaymentRefund(refundId: string): Promise<PaymentRefundRecord> {
    const response = await apiClient.post<unknown>(`/v1/payments/refunds/${refundId}/process/`, {});
    return unwrapItem<PaymentRefundRecord>(response, ['data']);
  },

  async getPaymentDisputes(params: {
    chama_id: string;
    intent_id?: string;
    status?: string;
    limit?: number;
  }): Promise<PaymentDisputeRecord[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('chama_id', params.chama_id);
    if (params.intent_id) queryParams.append('intent_id', params.intent_id);
    if (params.status) queryParams.append('status', params.status);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<unknown>(`/v1/payments/disputes/?${queryParams.toString()}`);
    return unwrapList<PaymentDisputeRecord>(response, ['disputes', 'data', 'results']);
  },

  async openPaymentDispute(data: {
    chama_id: string;
    intent_id?: string;
    category?: string;
    amount?: string;
    reason: string;
    reference?: string;
    provider_case_reference?: string;
  }): Promise<PaymentDisputeRecord> {
    const response = await apiClient.post<unknown>('/v1/payments/disputes/', data);
    return unwrapItem<PaymentDisputeRecord>(response, ['data']);
  },

  async resolvePaymentDispute(
    disputeId: string,
    data: {
      status: 'IN_REVIEW' | 'RESOLVED' | 'REJECTED' | 'WON' | 'LOST';
      resolution_notes?: string;
      amount?: string;
      provider_case_reference?: string;
    }
  ): Promise<PaymentDisputeRecord> {
    const response = await apiClient.post<unknown>(`/v1/payments/disputes/${disputeId}/resolve/`, data);
    return unwrapItem<PaymentDisputeRecord>(response, ['data']);
  },

  async getManualPaymentApprovalPolicy(chamaId: string): Promise<ManualPaymentApprovalPolicyRecord> {
    const response = await apiClient.get<unknown>(`/v1/payments/manual-policy/?chama_id=${chamaId}`);
    return unwrapItem<ManualPaymentApprovalPolicyRecord>(response, ['data']);
  },

  async updateManualPaymentApprovalPolicy(data: {
    chama_id: string;
    cash_maker_checker_enabled?: boolean;
    bank_maker_checker_enabled?: boolean;
    block_payer_self_approval?: boolean;
    require_cash_receipt_number?: boolean;
    require_cash_proof?: boolean;
    require_bank_proof_document?: boolean;
    require_bank_transfer_reference?: boolean;
    dual_approval_threshold?: string;
    allowed_cash_recorder_roles?: string[];
    allowed_cash_verifier_roles?: string[];
    allowed_bank_verifier_roles?: string[];
    allowed_reconciliation_roles?: string[];
    metadata?: Record<string, any>;
  }): Promise<ManualPaymentApprovalPolicyRecord> {
    const response = await apiClient.patch<unknown>('/v1/payments/manual-policy/', data);
    return unwrapItem<ManualPaymentApprovalPolicyRecord>(response, ['data']);
  },

  async importPaymentStatement(data: {
    chama_id: string;
    payment_method: 'mpesa' | 'bank';
    provider_name?: string;
    source_name?: string;
    statement_date?: string;
    csv_text?: string;
    rows?: Array<Record<string, any>>;
  }): Promise<PaymentStatementImportRecord> {
    const response = await apiClient.post<unknown>('/v1/payments/reconciliation/import-statement/', data);
    return unwrapItem<PaymentStatementImportRecord>(response, ['data']);
  },

  async getPaymentStatementImports(params: {
    chama_id: string;
    limit?: number;
  }): Promise<PaymentStatementImportRecord[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('chama_id', params.chama_id);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<unknown>(`/v1/payments/reconciliation/import-statement/?${queryParams.toString()}`);
    return unwrapList<PaymentStatementImportRecord>(response, ['imports', 'data', 'results']);
  },

  async createPaymentSettlement(data: {
    chama_id: string;
    payment_method: 'mpesa';
    provider_name?: string;
    settlement_reference: string;
    settlement_date?: string;
    currency?: string;
    gross_amount: string;
    fee_amount?: string;
    statement_import_id?: string;
    transaction_ids?: string[];
    metadata?: Record<string, any>;
  }): Promise<PaymentSettlementRecord> {
    const response = await apiClient.post<unknown>('/v1/payments/settlements/', data);
    return unwrapItem<PaymentSettlementRecord>(response, ['data']);
  },

  async getPaymentSettlements(params: {
    chama_id: string;
    payment_method?: 'mpesa';
    limit?: number;
  }): Promise<PaymentSettlementRecord[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('chama_id', params.chama_id);
    if (params.payment_method) queryParams.append('payment_method', params.payment_method);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<unknown>(`/v1/payments/settlements/?${queryParams.toString()}`);
    return unwrapList<PaymentSettlementRecord>(response, ['settlements', 'data', 'results']);
  },
};
