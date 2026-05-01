import { apiClient } from './api';
import { paymentService } from './paymentService';

export type WalletBalanceState =
  | 'positive_balance'
  | 'zero_balance'
  | 'pending_update'
  | 'temporarily_unavailable';

export type WalletActivityType =
  | 'wallet_deposit'
  | 'wallet_withdrawal'
  | 'wallet_transfer'
  | 'payout'
  | 'contribution_payment'
  | 'loan_repayment'
  | 'loan_disbursement'
  | 'fine_payment'
  | 'wallet_adjustment'
  | 'pending_transaction';

export type WalletTransactionState =
  | 'success'
  | 'pending'
  | 'failed'
  | 'reversed'
  | 'cancelled';

export type WalletActivityFilterKey =
  | 'all'
  | 'deposits'
  | 'withdrawals'
  | 'transfers'
  | 'contributions'
  | 'loan_repayments'
  | 'pending'
  | 'failed';

export type WalletActionMethodKey =
  | 'mpesa'
  | 'paybill'
  | 'bank'
  | 'bank_transfer_placeholder';

export type WalletDepositState =
  | 'not_started'
  | 'reviewing'
  | 'initiated'
  | 'processing'
  | 'success'
  | 'pending'
  | 'failed'
  | 'cancelled';

export type WalletWithdrawalState =
  | 'not_started'
  | 'reviewing'
  | 'submitted'
  | 'pending_processing'
  | 'approved_completed'
  | 'failed'
  | 'rejected'
  | 'cancelled';

export interface WalletActionMethodOption {
  key: WalletActionMethodKey;
  label: string;
  description: string;
  enabled: boolean;
}

export interface MemberWalletActivityItem {
  id: string;
  transactionId: string;
  sourceType: 'payment' | 'ledger';
  intentId?: string | null;
  ledgerEntryId?: string | null;
  amount: string;
  signedAmount?: string;
  currency: string;
  direction: 'inflow' | 'outflow';
  type: WalletActivityType;
  typeLabel: string;
  purposeLabel: string;
  status: WalletTransactionState;
  statusLabel: string;
  reference: string;
  date: string;
  updatedAt?: string | null;
  paymentMethod?: string | null;
  receiptAvailable: boolean;
  receiptReady: boolean;
  refreshSupported: boolean;
  explanation?: string | null;
  contributionId?: string | null;
  contributionTypeId?: string | null;
  contributionTypeName?: string | null;
  loanId?: string | null;
  installmentId?: string | null;
  penaltyId?: string | null;
  targetLabel?: string | null;
  linkedPurpose?: string | null;
}

export interface MemberWalletWorkspace {
  chamaId: string;
  memberId: string;
  currency: string;
  balanceState: WalletBalanceState;
  availableBalance: string;
  withdrawableBalance: string;
  pendingBalance: string;
  totalInflows: string;
  totalOutflows: string;
  lastUpdated?: string | null;
  limits: {
    minDeposit: string;
    maxDeposit: string;
    minWithdrawal: string;
    maxWithdrawal: string;
    minTransfer?: string;
    maxTransfer?: string;
    dailyWithdrawalLimit: string;
    todayWithdrawn: string;
    remainingDaily: string;
    withdrawableBalance: string;
  };
  methods: {
    depositMethods: WalletActionMethodOption[];
    withdrawalMethods: WalletActionMethodOption[];
  };
  summaryCards: {
    recentContributionPaymentsCount: number;
    recentContributionPaymentsTotal: string;
    activeLoanOutstanding: string;
    activeLoanId?: string | null;
    nextLoanRepaymentDue?: string | null;
    nextLoanRepaymentAmount: string;
  };
  linked: {
    contributions: Record<string, any>;
    loans: Record<string, any>;
  };
  recentActivity: MemberWalletActivityItem[];
  pendingActivity: MemberWalletActivityItem[];
  financialHealth: {
    tone: 'positive' | 'neutral' | 'attention';
    title: string;
    message: string;
  };
  emptyState: {
    title: string;
    description: string;
    actionLabel: string;
  };
  recovery: {
    lastOpenedTransactionId?: string | null;
    pendingTransactionReference?: string | null;
    activeChamaId?: string | null;
  };
}

export interface MemberWalletActivityFeed {
  filters: Array<{ key: WalletActivityFilterKey; label: string }>;
  selectedFilter: WalletActivityFilterKey;
  search: string;
  count: number;
  items: MemberWalletActivityItem[];
}

export interface MemberWalletTransactionDetail {
  transaction: MemberWalletActivityItem & {
    linkedContributionAvailable?: boolean;
    linkedLoanAvailable?: boolean;
    receiptNumber?: string | null;
    referenceNumber?: string | null;
  };
}

export interface MemberWalletDepositFlow {
  intentId: string;
  state: WalletDepositState;
  transaction: MemberWalletTransactionDetail['transaction'];
  instructions?: Record<string, any> | null;
  walletSnapshot: MemberWalletWorkspace;
}

export interface MemberWalletWithdrawalFlow {
  intentId: string;
  state: WalletWithdrawalState;
  transaction: MemberWalletTransactionDetail['transaction'];
  walletSnapshot: MemberWalletWorkspace;
}

export interface MemberWalletTransferFlow {
  transactionRef: string;
  walletSnapshot: MemberWalletWorkspace;
}

export interface MemberWalletContributionFlow {
  intentId: string;
  transaction: MemberWalletTransactionDetail['transaction'];
  walletSnapshot: MemberWalletWorkspace;
}

const unwrapData = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const mapActivityItem = (payload: Record<string, any>): MemberWalletActivityItem => ({
  id: String(payload.id),
  transactionId: String(payload.transaction_id || payload.id),
  sourceType: payload.source_type === 'ledger' ? 'ledger' : 'payment',
  intentId: payload.intent_id ? String(payload.intent_id) : null,
  ledgerEntryId: payload.ledger_entry_id ? String(payload.ledger_entry_id) : null,
  amount: String(payload.amount || '0.00'),
  signedAmount: payload.signed_amount ? String(payload.signed_amount) : undefined,
  currency: String(payload.currency || 'KES'),
  direction: payload.direction === 'inflow' ? 'inflow' : 'outflow',
  type: String(payload.type || 'wallet_adjustment') as WalletActivityType,
  typeLabel: String(payload.type_label || 'Wallet activity'),
  purposeLabel: String(payload.purpose_label || payload.type_label || 'Wallet activity'),
  status: String(payload.status || 'pending') as WalletTransactionState,
  statusLabel: String(payload.status_label || 'Pending'),
  reference: String(payload.reference || payload.id || ''),
  date: String(payload.date || ''),
  updatedAt: payload.updated_at ? String(payload.updated_at) : null,
  paymentMethod: payload.payment_method ? String(payload.payment_method) : null,
  receiptAvailable: Boolean(payload.receipt_available),
  receiptReady: Boolean(payload.receipt_ready),
  refreshSupported: Boolean(payload.refresh_supported),
  explanation: payload.explanation ? String(payload.explanation) : null,
  contributionId: payload.contribution_id ? String(payload.contribution_id) : null,
  contributionTypeId: payload.contribution_type_id ? String(payload.contribution_type_id) : null,
  contributionTypeName: payload.contribution_type_name ? String(payload.contribution_type_name) : null,
  loanId: payload.loan_id ? String(payload.loan_id) : null,
  installmentId: payload.installment_id ? String(payload.installment_id) : null,
  penaltyId: payload.penalty_id ? String(payload.penalty_id) : null,
  targetLabel: payload.target_label ? String(payload.target_label) : null,
  linkedPurpose: payload.linked_purpose ? String(payload.linked_purpose) : null,
});

const mapWorkspace = (payload: Record<string, any>): MemberWalletWorkspace => ({
  chamaId: String(payload.chama_id),
  memberId: String(payload.member_id),
  currency: String(payload.currency || 'KES'),
  balanceState: String(payload.balance_state || 'temporarily_unavailable') as WalletBalanceState,
  availableBalance: String(payload.available_balance || '0.00'),
  withdrawableBalance: String(
    payload.withdrawable_balance || payload.available_balance || '0.00'
  ),
  pendingBalance: String(payload.pending_balance || '0.00'),
  totalInflows: String(payload.total_inflows || '0.00'),
  totalOutflows: String(payload.total_outflows || '0.00'),
  lastUpdated: payload.last_updated ? String(payload.last_updated) : null,
  limits: {
    minDeposit: String(payload.limits?.min_deposit || '0.00'),
    maxDeposit: String(payload.limits?.max_deposit || '0.00'),
    minWithdrawal: String(payload.limits?.min_withdrawal || '0.00'),
    maxWithdrawal: String(payload.limits?.max_withdrawal || '0.00'),
    minTransfer: payload.limits?.min_transfer ? String(payload.limits.min_transfer) : undefined,
    maxTransfer: payload.limits?.max_transfer ? String(payload.limits.max_transfer) : undefined,
    dailyWithdrawalLimit: String(payload.limits?.daily_withdrawal_limit || '0.00'),
    todayWithdrawn: String(payload.limits?.today_withdrawn || '0.00'),
    remainingDaily: String(payload.limits?.remaining_daily || '0.00'),
    withdrawableBalance: String(
      payload.limits?.withdrawable_balance || payload.withdrawable_balance || '0.00'
    ),
  },
  methods: {
    depositMethods: Array.isArray(payload.methods?.deposit_methods)
      ? payload.methods.deposit_methods.map((method: Record<string, any>) => ({
          key: String(method.key || 'mpesa') as WalletActionMethodKey,
          label: String(method.label || 'Method'),
          description: String(method.description || ''),
          enabled: Boolean(method.enabled),
        }))
      : [],
    withdrawalMethods: Array.isArray(payload.methods?.withdrawal_methods)
      ? payload.methods.withdrawal_methods.map((method: Record<string, any>) => ({
          key: String(method.key || 'mpesa') as WalletActionMethodKey,
          label: String(method.label || 'Method'),
          description: String(method.description || ''),
          enabled: Boolean(method.enabled),
        }))
      : [],
  },
  summaryCards: {
    recentContributionPaymentsCount: Number(
      payload.summary_cards?.recent_contribution_payments_count || 0
    ),
    recentContributionPaymentsTotal: String(
      payload.summary_cards?.recent_contribution_payments_total || '0.00'
    ),
    activeLoanOutstanding: String(payload.summary_cards?.active_loan_outstanding || '0.00'),
    activeLoanId: payload.summary_cards?.active_loan_id
      ? String(payload.summary_cards.active_loan_id)
      : null,
    nextLoanRepaymentDue: payload.summary_cards?.next_loan_repayment_due
      ? String(payload.summary_cards.next_loan_repayment_due)
      : null,
    nextLoanRepaymentAmount: String(
      payload.summary_cards?.next_loan_repayment_amount || '0.00'
    ),
  },
  linked: {
    contributions: payload.linked?.contributions || {},
    loans: payload.linked?.loans || {},
  },
  recentActivity: Array.isArray(payload.recent_activity)
    ? payload.recent_activity.map(mapActivityItem)
    : [],
  pendingActivity: Array.isArray(payload.pending_activity)
    ? payload.pending_activity.map(mapActivityItem)
    : [],
  financialHealth: {
    tone: (payload.financial_health?.tone || 'neutral') as 'positive' | 'neutral' | 'attention',
    title: String(payload.financial_health?.title || 'Your wallet balance at a glance.'),
    message: String(
      payload.financial_health?.message || 'Track inflows, outflows, and recent activity.'
    ),
  },
  emptyState: {
    title: String(payload.empty_state?.title || 'No wallet activity yet.'),
    description: String(
      payload.empty_state?.description || 'Start with a contribution to begin using your wallet.'
    ),
    actionLabel: String(payload.empty_state?.action_label || 'Make Contribution'),
  },
  recovery: {
    lastOpenedTransactionId: payload.recovery?.last_opened_transaction_id
      ? String(payload.recovery.last_opened_transaction_id)
      : null,
    pendingTransactionReference: payload.recovery?.pending_transaction_reference
      ? String(payload.recovery.pending_transaction_reference)
      : null,
    activeChamaId: payload.recovery?.active_chama_id
      ? String(payload.recovery.active_chama_id)
      : null,
  },
});

const mapTransactionDetailPayload = (
  payload: Record<string, any>
): MemberWalletTransactionDetail['transaction'] => ({
  ...mapActivityItem(payload.transaction || {}),
  linkedContributionAvailable: Boolean(payload.transaction?.linked_contribution_available),
  linkedLoanAvailable: Boolean(payload.transaction?.linked_loan_available),
  receiptNumber: payload.transaction?.receipt_number
    ? String(payload.transaction.receipt_number)
    : null,
  referenceNumber: payload.transaction?.reference_number
    ? String(payload.transaction.reference_number)
    : null,
});

const mapDepositFlow = (payload: Record<string, any>): MemberWalletDepositFlow => ({
  intentId: String(payload.intent_id || ''),
  state: String(payload.state || 'processing') as WalletDepositState,
  transaction: mapTransactionDetailPayload(payload),
  instructions: payload.instructions || null,
  walletSnapshot: mapWorkspace(payload.wallet_snapshot || {}),
});

const mapWithdrawalFlow = (payload: Record<string, any>): MemberWalletWithdrawalFlow => ({
  intentId: String(payload.intent_id || ''),
  state: String(payload.state || 'pending_processing') as WalletWithdrawalState,
  transaction: mapTransactionDetailPayload(payload),
  walletSnapshot: mapWorkspace(payload.wallet_snapshot || {}),
});

export const memberWalletService = {
  async getWorkspace(chamaId: string): Promise<MemberWalletWorkspace> {
    const response = await apiClient.get<unknown>(
      `/v1/finance/member-wallet/workspace?chama_id=${chamaId}`
    );
    return mapWorkspace(unwrapData<Record<string, any>>(response));
  },

  async getActivity(
    chamaId: string,
    params: {
      filter?: WalletActivityFilterKey;
      search?: string;
      limit?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<MemberWalletActivityFeed> {
    const query = new URLSearchParams();
    query.append('chama_id', chamaId);
    if (params.filter) query.append('filter', params.filter);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', String(params.limit));
    if (params.startDate) query.append('start_date', params.startDate);
    if (params.endDate) query.append('end_date', params.endDate);

    const response = await apiClient.get<unknown>(
      `/v1/finance/member-wallet/activity?${query.toString()}`
    );
    const payload = unwrapData<Record<string, any>>(response);
    return {
      filters: Array.isArray(payload.filters)
        ? payload.filters.map((filter) => ({
            key: String(filter.key || 'all') as WalletActivityFilterKey,
            label: String(filter.label || 'All'),
          }))
        : [],
      selectedFilter: String(payload.selected_filter || 'all') as WalletActivityFilterKey,
      search: String(payload.search || ''),
      count: Number(payload.count || 0),
      items: Array.isArray(payload.items) ? payload.items.map(mapActivityItem) : [],
    };
  },

  async getTransactionDetail(
    chamaId: string,
    transactionId: string
  ): Promise<MemberWalletTransactionDetail> {
    const response = await apiClient.get<unknown>(
      `/v1/finance/member-wallet/transactions/${transactionId}?chama_id=${chamaId}`
    );
    const payload = unwrapData<Record<string, any>>(response);
    return {
      transaction: mapTransactionDetailPayload(payload),
    };
  },

  async refreshTransactionStatus(
    chamaId: string,
    transactionId: string
  ): Promise<MemberWalletTransactionDetail> {
    const response = await apiClient.post<unknown>(
      `/v1/finance/member-wallet/transactions/${transactionId}`,
      { chama_id: chamaId }
    );
    const payload = unwrapData<Record<string, any>>(response);
    return {
      transaction: mapTransactionDetailPayload(payload),
    };
  },

  async createDeposit(input: {
    chamaId: string;
    amount: string;
    paymentMethod: 'mpesa' | 'bank';
    phone?: string;
    idempotencyKey?: string;
  }): Promise<MemberWalletDepositFlow> {
    const response = await apiClient.post<unknown>('/v1/finance/member-wallet/deposits', {
      chama_id: input.chamaId,
      amount: input.amount,
      payment_method: input.paymentMethod,
      phone: input.phone || '',
      idempotency_key: input.idempotencyKey,
    });
    return mapDepositFlow(unwrapData<Record<string, any>>(response));
  },

  async getDepositDetail(chamaId: string, intentId: string): Promise<MemberWalletDepositFlow> {
    const response = await apiClient.get<unknown>(
      `/v1/finance/member-wallet/deposits/${intentId}?chama_id=${chamaId}`
    );
    return mapDepositFlow(unwrapData<Record<string, any>>(response));
  },

  async refreshDeposit(chamaId: string, intentId: string): Promise<MemberWalletDepositFlow> {
    const response = await apiClient.post<unknown>(
      `/v1/finance/member-wallet/deposits/${intentId}`,
      { chama_id: chamaId }
    );
    return mapDepositFlow(unwrapData<Record<string, any>>(response));
  },

  async createWithdrawal(input: {
    chamaId: string;
    amount: string;
    paymentMethod: 'mpesa';
    phone: string;
    idempotencyKey?: string;
  }): Promise<MemberWalletWithdrawalFlow> {
    const response = await apiClient.post<unknown>('/v1/finance/member-wallet/withdrawals', {
      chama_id: input.chamaId,
      amount: input.amount,
      payment_method: input.paymentMethod,
      phone: input.phone,
      idempotency_key: input.idempotencyKey,
    });
    return mapWithdrawalFlow(unwrapData<Record<string, any>>(response));
  },

  async getWithdrawalDetail(
    chamaId: string,
    intentId: string
  ): Promise<MemberWalletWithdrawalFlow> {
    const response = await apiClient.get<unknown>(
      `/v1/finance/member-wallet/withdrawals/${intentId}?chama_id=${chamaId}`
    );
    return mapWithdrawalFlow(unwrapData<Record<string, any>>(response));
  },

  async refreshWithdrawal(
    chamaId: string,
    intentId: string
  ): Promise<MemberWalletWithdrawalFlow> {
    const response = await apiClient.post<unknown>(
      `/v1/finance/member-wallet/withdrawals/${intentId}`,
      { chama_id: chamaId }
    );
    return mapWithdrawalFlow(unwrapData<Record<string, any>>(response));
  },

  async openReceipt(item: Pick<MemberWalletActivityItem, 'intentId'>) {
    if (!item.intentId) {
      throw new Error('This receipt is not ready yet.');
    }
    return paymentService.getUnifiedPaymentReceipt(item.intentId);
  },

  async createTransfer(input: {
    chamaId: string;
    recipientMemberId: string;
    amount: string;
    note?: string;
    idempotencyKey?: string;
  }): Promise<MemberWalletTransferFlow> {
    const response = await apiClient.post<unknown>('/v1/finance/member-wallet/transfers', {
      chama_id: input.chamaId,
      recipient_member_id: input.recipientMemberId,
      amount: input.amount,
      note: input.note,
      idempotency_key: input.idempotencyKey,
    });
    const payload = unwrapData<Record<string, any>>(response);
    return {
      transactionRef: String(payload.transaction_ref || ''),
      walletSnapshot: mapWorkspace(payload.wallet_snapshot || {}),
    };
  },

  async createContribution(input: {
    chamaId: string;
    contributionTypeId: string;
    amount: string;
    idempotencyKey?: string;
  }): Promise<MemberWalletContributionFlow> {
    const response = await apiClient.post<unknown>('/v1/finance/member-wallet/contributions', {
      chama_id: input.chamaId,
      contribution_type_id: input.contributionTypeId,
      amount: input.amount,
      idempotency_key: input.idempotencyKey,
    });
    const payload = unwrapData<Record<string, any>>(response);
    return {
      intentId: String(payload.intent_id || ''),
      transaction: mapTransactionDetailPayload(payload),
      walletSnapshot: mapWorkspace(payload.wallet_snapshot || {}),
    };
  },
};
